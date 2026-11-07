const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL||'http://127.0.0.1:19982/node_modules/jsketcher-build/'),cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19983');
for(const url of [base,cdp])if(!['127.0.0.1','localhost','[::1]'].includes(url.hostname))throw Error('Loopback only');
(async()=>{
 const browser=await puppeteer.connect({browserURL:cdp.href}),context=await browser.createBrowserContext(),errors=[];
 try{
  async function fresh(){
   const p=await context.newPage();p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.text().startsWith('Error while observer call:'))errors.push(m.text());});
   await p.goto(new URL('index-webos.html?DEFAULT&webos=1',base));await p.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
   await p.evaluate(async()=>{
    const c=__CAD_APP;for(let id=1;id<=2;id++)await new Promise((yes,no)=>c.craftService.modify({type:'PLANE',params:{featureId:id,orientation:'XY',depth:id}},yes,no));
    window.wt={ids:c.craftService.models$.value.flatMap(m=>m.faces.map(f=>f.id)),
     sketch:id=>JSON.stringify({version:3,objects:[{id,type:'Circle',role:null,stage:0,data:{c:{x:0,y:0},r:5}}],dimensions:[],labels:[],stages:[{constraints:[],generators:[]}],constants:''}),
     wait:()=>new Promise(r=>setTimeout(r,250)),
     faces:()=>c.craftService.models$.value.flatMap(m=>m.faces.map(f=>({id:f.id,objects:f.sketchObjects.map(o=>o.id),loops:f.sketchLoops.length,regions:f.sketchRegions.length,indexed:f.sketchObjects.every(o=>c.cadRegistry.find(o.id)===o)})))};
   });return p;
  }
  const p=await fresh();
  const normal=await p.evaluate(async()=>{const c=__CAD_APP;wt.ids.forEach((id,i)=>c.storageService.set(c.projectService.sketchStorageKey(id),wt.sketch('normal'+i)));await wt.wait();return wt.faces();});
  console.log('TWO_FACE_NORMAL_WRITES',JSON.stringify(normal));
  for(let i=0;i<2;i++){assert.equal(normal[i].objects.length,1,'both changed faces must refresh');assert.ok(normal[i].objects[0].endsWith('normal'+i));assert.equal(normal[i].loops,1);assert.equal(normal[i].regions,1);assert.equal(normal[i].indexed,true);}
  if(process.env.CODI_WORKSPACE_BASELINE_ONLY==='1')return;
  const result=await p.evaluate(async()=>{
   const c=__CAD_APP,s=c.storageService,keys=wt.ids.map(id=>c.projectService.sketchStorageKey(id)),before=keys.map(k=>s.get(k)),events=[];
   const priorObjects=wt.faces().flatMap(f=>f.objects),removedLoop=c.craftService.models$.value[0].faces[0].sketchLoops[0].id;
   const stop=c.streams.sketcher.update.attach(f=>events.push(f.id));
   try{
    const pending=s.prepareWrites([{key:keys[0],value:null},{key:keys[1],value:wt.sketch('replacement')}]);await wt.wait();
    const invisible=keys.every((k,i)=>s.get(k)===before[i])&&!events.length;pending.commit();
    const installed=s.get(keys[0])===null&&s.get(keys[1])===wt.sketch('replacement')&&!events.length;
    pending.notify();await wt.wait();const faces=wt.faces(),firstEvents=events.splice(0),oldIdsGone=priorObjects.every(id=>!c.cadRegistry.find(id))&&!c.cadRegistry.find(removedLoop);
    s.set(keys[0],wt.sketch('first'));s.set(keys[0],wt.sketch('latest'));s.set(keys[1],wt.sketch('other'));await wt.wait();
    const latest=wt.faces(),coalesced=events.splice(0),stale=s.prepareWrites([{key:keys[0],value:wt.sketch('stale')}]);s.set(keys[0],s.get(keys[0]));
    let refused=false;try{stale.commit();}catch{refused=true;}
    return{invisible,installed,faces,firstEvents,oldIdsGone,latest,coalesced,refused,current:stale.isCurrent()};
   }finally{stop();}
  });
  assert.equal(result.invisible,true);assert.equal(result.installed,true);assert.deepEqual(result.faces[0].objects,[]);assert.equal(result.faces[0].loops,0);assert.equal(result.faces[0].regions,0);
  assert.equal(result.oldIdsGone,true,'removed sketch objects and loops must leave the registry');
  assert.ok(result.faces[1].objects[0].endsWith('replacement'));assert.equal(result.faces[1].indexed,true);assert.equal(new Set(result.firstEvents).size,2);assert.equal(result.firstEvents.length,2);
  assert.ok(result.latest[0].objects[0].endsWith('latest'));assert.ok(result.latest[1].objects[0].endsWith('other'));assert.equal(result.coalesced.length,2);assert.equal(new Set(result.coalesced).size,2);assert.equal(result.refused,true);assert.equal(result.current,false);
  for(const mode of ['generation','loadData']){
  const r=await fresh();
  const reset=await r.evaluate(async mode=>{
   const c=__CAD_APP,history=c.craftService.modifications$.value.history,previous=c.craftService.models$.value.flatMap(m=>m.faces);
   const writes=[],originalSet=c.storageService.set;c.storageService.set=(key,value)=>{writes.push({key,generation:c.projectService.documentGeneration});return originalSet(key,value);};
   const pending=c.storageService.prepareWrites(wt.ids.map((id,i)=>({key:c.projectService.sketchStorageKey(id),value:wt.sketch('beforeReset'+i)})));pending.commit();pending.notify();
   if(mode==='loadData')c.projectService.loadData({history,expressions:''});
   else c.craftService.reset(history,{documentGeneration:c.projectService.beginDocumentChange()});
   const end=Date.now()+30000;while(c.craftService.isProcessing&&Date.now()<end)await new Promise(r=>setTimeout(r,5));if(c.craftService.isProcessing)throw Error('Replay timeout');
   const replaced=c.craftService.models$.value.flatMap(m=>m.faces).every((f,i)=>f!==previous[i]&&f.id===previous[i].id),events=[],stop=c.streams.sketcher.update.attach(f=>events.push(f.id));
   try{await wt.wait();return{replaced,events,faces:wt.faces(),writes,generation:c.projectService.documentGeneration,prefix:c.projectService.sketchStorageNamespace};}finally{stop();c.storageService.set=originalSet;}
  },mode);
  console.log('RESET_EVENTS',mode,JSON.stringify(reset));
  assert.equal(reset.replaced,true);
  if(mode==='generation')assert.deepEqual(reset.events,[],'old invalidations cannot cross a reset that reuses face IDs');
  else for(const id of reset.events)assert.ok(reset.writes.some(w=>w.key===reset.prefix+id&&w.generation===reset.generation),'full expression reload can emit legitimate new-generation sketch writes');
  assert.ok(reset.faces.every(f=>f.indexed&&f.objects.length===1));
  }
  const g=await fresh();
  const guards=await g.evaluate(async()=>{
   const c=__CAD_APP,key=c.projectService.sketchStorageKey(wt.ids[0]);let armed=false,events=0;
   const stop=c.storageService.addListener(e=>{if(e.key===key)events++;}),pending=c.storageService.prepareWrites([{key,value:wt.sketch('guard')}]);pending.commit();
   pending.notify(()=>{if(armed)c.projectService.beginDocumentChange();return true;});armed=true;await wt.wait();stop();
   let first=0,second=0;const a=c.storageService.addListener(e=>{if(e.key===key){first++;c.projectService.beginDocumentChange();}}),b=c.storageService.addListener(e=>{if(e.key===key)second++;});
   c.storageService.set(key,wt.sketch('observer'));await wt.wait();a();b();
   const old=c.storageService.prepareWrites([{key,value:wt.sketch('cancelled')}]);c.projectService.beginDocumentChange();let refused=false;try{old.commit();}catch{refused=true;}
   c.storageService.prepareWrites([{key,value:wt.sketch('next')}]).discard();
   const rollback=c.storageService.stageWrite(key,wt.sketch('staged'));c.projectService.beginDocumentChange();
   return{events,first,second,refused,staleRollback:rollback(),bytes:c.storageService.get(key),expected:wt.sketch('staged')};
  });
  assert.equal(guards.events,0);assert.equal(guards.first,1);assert.equal(guards.second,0);assert.equal(guards.refused,true);assert.equal(guards.staleRollback,false);assert.equal(guards.bytes,guards.expected);
  const q=await fresh();await q.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
  const service=await q.evaluate(async()=>{
   const c=__CAD_APP,old=c.storageService,key=c.projectService.sketchStorageKey(wt.ids[0]),rollback=old.stageWrite(key,wt.sketch('staged')),pending=old.prepareWrites([{key,value:wt.sketch('never')}]);
   let events=0;const stop=old.addListener(e=>{if(e.key===key)events++;});webosTest.activateStorage(c);let refused=false;try{pending.commit();}catch{refused=true;}
   await wt.wait();stop();return{refused,current:pending.isCurrent(),staleRollback:rollback(),events,newBytes:c.storageService.get(key),oldBytes:old.get(key),expected:wt.sketch('staged')};
  });
  assert.equal(service.refused,true);assert.equal(service.current,false);assert.equal(service.staleRollback,false);assert.equal(service.events,0);assert.equal(service.newBytes,null);assert.equal(service.oldBytes,service.expected);assert.deepEqual(errors,[]);
  const queue=await q.evaluate(async()=>{
   const one={services:{},streams:{}},two={services:{},streams:{}};webosTest.activateStorage(one);webosTest.activateStorage(two);
   const seen=[],other=[],a=one.storageService.addListener(e=>seen.push(e.key)),b=two.storageService.addListener(e=>other.push(e.key));
   try{
    one.storageService.set('one','one');await wt.wait();const isolated=seen.join(',')==='one'&&!other.length;seen.length=0;
    const pending=one.storageService.prepareWrites([{key:'invalid','value':'stored'}]);pending.commit();let armed=false;
    pending.notify(()=>{if(armed)throw Error('expected validity failure');return true;});armed=true;one.storageService.set('valid','stored');await wt.wait();const survives=seen.join(',')==='valid';seen.length=0;
    let between=null;const first=one.storageService.addListener(()=>{if(between===null){between=-1;setTimeout(()=>{between=seen.length;},0);}});
    const batch=one.storageService.prepareWrites(Array.from({length:65},(_,i)=>({key:'many'+i,value:'v'})));batch.commit();batch.notify();await wt.wait();first();
    return{isolated,survives,between,total:seen.length};
   }finally{a();b();one.storageService.dispose();two.storageService.dispose();}
  });
  assert.deepEqual(queue,{isolated:true,survives:true,between:64,total:65});assert.deepEqual(errors,[]);
  console.log('PASS private multi-key workspace, actual face/region refresh, removal, coalescing, stale writes, reset, guard reentrancy and service replacement');
 }finally{await context.close();browser.disconnect();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
