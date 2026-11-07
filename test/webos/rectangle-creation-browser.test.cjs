const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL||'http://127.0.0.1:19982/node_modules/jsketcher-build/'),cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19983');
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{
 const browser=await puppeteer.connect({browserURL:cdp.href}),context=await browser.createBrowserContext(),errors=[];
 try{
  async function fresh(){
   const p=await context.newPage();p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.text().startsWith('Error while observer call:'))errors.push(m.text());});
   await p.goto(new URL('index-webos.html?DEFAULT&webos=1',base));await p.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
   await p.evaluate(()=>{const c=__CAD_APP;window.rt={
    args:()=>({revision:c.craftService.inspectRectangleCreation().revision,unit:'millimeter',origin:[10,20],width:100,height:50,depth:7}),
    wait:async()=>{const end=Date.now()+30000;while(c.craftService.isProcessing&&Date.now()<end)await new Promise(r=>setTimeout(r,5));if(c.craftService.isProcessing)throw Error('Replay timeout');},
    state:()=>({history:c.craftService.modifications$.value.history.length,pointer:c.craftService.modifications$.value.pointer,
     models:c.craftService.models$.value.map(m=>({id:m.id,faces:m.faces.map(f=>({id:f.id,frame:{origin:f.csys.origin.toArray()},objects:f.sketchObjects.map(o=>o.id),regions:f.sketchRegions.map(r=>r.id),indexed:c.cadRegistry.find(f.id)===f&&f.sketchRegions.every(r=>c.cadRegistry.find(r.id)===r)}))})),
     keys:c.storageService.getAllKeysFromNamespace(c.projectService.sketchStorageNamespace).sort()})};});return p;
  }
  const p=await fresh();
  const result=await p.evaluate(async()=>{
   const c=__CAD_APP,observed=[],record=()=>{const s=rt.state();if(s.history)observed.push(s);},stops=[c.craftService.models$.attach(record),c.craftService.modifications$.attach(record),c.craftService.pipelineFailure$.attach(record)];
   try{
    const accepted=await c.craftService.createRectangleSketch(rt.args()),state=rt.state(),bytes=c.sketchStorageService.getSketchData(accepted.faceId),acceptedObservations=observed.slice();
    c.craftService.historyTravel.setPointer(-1);await rt.wait();const undo=rt.state();c.craftService.historyTravel.end();await rt.wait();const redo=rt.state();
    return{accepted,state,observed:acceptedObservations,bytes,undo,redo,envelope:c.projectManager.snapshotCurrentProject()};
   }finally{stops.forEach(f=>f());}
  });
  assert.equal(result.state.history,1);assert.equal(result.state.models.length,1);assert.equal(result.state.keys.length,1);
  assert.deepEqual(result.state.models[0].faces[0].frame.origin,[0,0,7]);assert.equal(result.state.models[0].faces[0].objects.length,4);assert.equal(result.state.models[0].faces[0].regions.length,1);
  assert.equal(result.accepted.persistence,'volatile-workspace');assert.equal(result.undo.models.length,0);assert.deepEqual(result.redo,result.state);
  for(const s of result.observed){assert.equal(s.models.length,1);assert.equal(s.keys.length,1);assert.equal(s.models[0].faces[0].objects.length,4);assert.equal(s.models[0].faces[0].indexed,true);}
  const saved=JSON.parse(result.bytes);assert.equal(saved.stages[0].constraints.length,11);assert.deepEqual(saved.objects[0].data.a,{x:10,y:20});assert.deepEqual(saved.objects[2].data.a,{x:110,y:70});
  const r=await fresh();
  const reopened=await r.evaluate(async envelope=>{const c=__CAD_APP;await c.projectManager.restoreSnapshotInEmptyWorkspace(JSON.stringify(envelope));await rt.wait();return rt.state();},result.envelope);
  assert.deepEqual(reopened.models,result.state.models);assert.equal(reopened.history,1);
  console.log('PASS atomic accepted observers, nonzero plane/local origin, undo/redo and native reopen');
  const second=await r.evaluate(async()=>{const c=__CAD_APP,first=rt.state(),bytes=first.keys.map(k=>c.storageService.get(k)),accepted=await c.craftService.createRectangleSketch({...rt.args(),origin:[-20,30],width:40,height:25,depth:12});
   return{accepted,state:rt.state(),priorUnchanged:first.keys.every((k,i)=>c.storageService.get(k)===bytes[i]),envelope:c.projectManager.snapshotCurrentProject()};});
  assert.equal(second.state.history,2);assert.equal(second.state.models.length,2);assert.equal(second.state.keys.length,2);assert.equal(second.priorUnchanged,true);assert.ok(second.state.models.every(m=>m.faces[0].indexed&&m.faces[0].objects.length===4));
  const two=await fresh();const both=await two.evaluate(async envelope=>{await __CAD_APP.projectManager.restoreSnapshotInEmptyWorkspace(JSON.stringify(envelope));await rt.wait();return rt.state();},second.envelope);
  assert.deepEqual(both.models,second.state.models);await two.close();await p.close();await r.close();console.log('PASS second rectangle preserves existing sketch and both reopen');

  for(const mode of ['cancel','storage-aba','expressions-aba','reset','history','orphan','concurrent','commit-failure']){
   const q=await fresh();
   const out=await q.evaluate(async mode=>{
    const c=__CAD_APP,Native=window.Worker,controller=new AbortController(),before=rt.state();let release,started=0,terminated=0,second=null;
    window.Worker=class extends Native{postMessage(data,...args){started++;release=()=>super.postMessage(data,...args);}terminate(){terminated++;return super.terminate();}};
    let restore=()=>{};
    try{
     const pending=c.craftService.createRectangleSketch(rt.args(),{signal:controller.signal}).then(x=>({accepted:x}),e=>({name:e.name,committed:e.committed,message:e.message}));
     const end=Date.now()+10000;while(!release&&Date.now()<end)await new Promise(r=>setTimeout(r,5));if(!release)throw Error('Worker did not start');
     const privateState=rt.state();
     if(mode==='cancel')controller.abort();
     if(mode==='storage-aba'){c.storageService.set('unrelated','a');c.storageService.set('unrelated','a');c.storageService.remove('unrelated');}
     if(mode==='expressions-aba'){c.expressionService.load('w=10');c.expressionService.load('');}
     if(mode==='reset')c.projectService.empty();
     if(mode==='history')c.craftService.historyTravel.end();
     if(mode==='orphan')c.sketchStorageService.setSketchData('S:0/SURFACE','orphan user bytes');
     if(mode==='concurrent')second=await c.craftService.createRectangleSketch(rt.args()).then(()=>true,e=>e.message);
     if(mode==='commit-failure'){const original=c.storageService.prepareWrites;c.storageService.prepareWrites=(...args)=>{const prepared=original(...args);return{...prepared,commit(){prepared.discard();throw Error('injected commit refusal');}}};restore=()=>c.storageService.prepareWrites=original;}
     if(mode!=='cancel')release();const outcome=await pending;await rt.wait();
     return{mode,before,privateState,outcome,after:rt.state(),started,terminated,second,orphan:c.sketchStorageService.getSketchData('S:0/SURFACE')};
    }finally{window.Worker=Native;restore();}
   },mode);
   assert.deepEqual(out.privateState,out.before,'candidate must remain invisible while worker is held');assert.equal(out.started,1);assert.equal(out.terminated,1);
   if(mode==='concurrent'){assert.ok(out.outcome.accepted);assert.match(out.second,/progress/);assert.equal(out.after.history,1);}
   else{assert.equal(out.after.history,0);assert.deepEqual(out.after.models,[]);assert.ok(!out.outcome.accepted);if(mode==='commit-failure')assert.equal(out.outcome.message,'injected commit refusal');else assert.equal(out.outcome.name,'AbortError');
    if(mode==='orphan'){assert.equal(out.orphan,'orphan user bytes');assert.equal(out.after.keys.length,1);}else assert.deepEqual(out.after.keys,[]);}
   await q.close();console.log('PASS held worker',mode);
  }
  const a=await fresh();await a.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
  const stale=await a.evaluate(async()=>{const c=__CAD_APP,args=rt.args(),storageRevision=c.storageService.revision;webosTest.activateStorage(c);const newRevision=c.storageService.revision;return{storageRevision,newRevision,oldToken:args.revision,newToken:c.craftService.inspectRectangleCreation().revision,outcome:await c.craftService.createRectangleSketch(args).then(()=>true,e=>e.name)};});
  assert.equal(stale.storageRevision,stale.newRevision);assert.notEqual(stale.oldToken,stale.newToken);assert.equal(stale.outcome,'AbortError');console.log('PASS equal-counter service replacement invalidates inspect token');
  await a.close();

  const after=await fresh();
  const reset=await after.evaluate(async()=>{const c=__CAD_APP;let fired=false,stale=0;
   const first=c.craftService.models$.attach(models=>{if(models.length&&!fired){fired=true;c.projectService.empty();}}),second=c.craftService.models$.attach(models=>{if(fired&&models.length)stale++;});
   try{const outcome=await c.craftService.createRectangleSketch(rt.args()).then(()=>true,e=>({name:e.name,committed:e.committed}));await rt.wait();return{outcome,stale,state:rt.state()};}finally{first();second();}
  });assert.deepEqual(reset.outcome,{name:'AbortError',committed:true});assert.equal(reset.stale,0);assert.equal(reset.state.history,0);assert.deepEqual(reset.state.models,[]);console.log('PASS notification reset distinguishes committed result');
  await after.close();

  for(const mode of ['wrong-intent','empty-residuals']){
   const q=await fresh();const out=await q.evaluate(async mode=>{const c=__CAD_APP,Native=Worker;
    window.Worker=class extends Native{set onmessage(handler){super.onmessage=e=>{const data=e.data;if(data.ok){if(mode==='wrong-intent'){data.sketch.stages[0].constraints[10].constants.length='99';data.serializedSketch=JSON.stringify(data.sketch);}else data.evidence[0].residuals=[];}handler(new MessageEvent('message',{data}));}}};
    try{return{outcome:await c.craftService.createRectangleSketch(rt.args()).then(()=>true,e=>e.message),state:rt.state()};}finally{window.Worker=Native}
   },mode);assert.match(out.outcome,/intent or residual/);assert.equal(out.state.history,0);assert.deepEqual(out.state.models,[]);assert.deepEqual(out.state.keys,[]);await q.close();console.log('PASS worker response refusal',mode);
  }

  const parent=await context.newPage();await parent.goto(new URL('/',base));
  const cross=await parent.evaluate(async url=>{const frame=document.createElement('iframe');frame.src=url;document.body.replaceChildren(frame);await new Promise((yes,no)=>{frame.onload=yes;frame.onerror=no;});const end=Date.now()+90000;while(!frame.contentWindow.__CAD_APP?.streams?.lifecycle?.projectLoaded?.value&&Date.now()<end)await new Promise(r=>setTimeout(r,20));const c=frame.contentWindow.__CAD_APP,controller=new AbortController();return await c.craftService.createRectangleSketch({revision:c.craftService.inspectRectangleCreation().revision,unit:'millimeter',origin:[0,0],width:25,height:10,depth:0},{signal:controller.signal});},new URL('index-webos.html?DEFAULT&webos=1',base).href);
  assert.equal(cross.persistence,'volatile-workspace');assert.equal(cross.featureId,1);console.log('PASS parent-frame command data and AbortSignal');assert.deepEqual(errors,[]);
 }finally{await context.close();browser.disconnect();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
