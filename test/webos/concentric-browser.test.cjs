// Real CAD/sketcher action and sketch IO; local disposable browser only.
const assert=require('node:assert/strict');
const puppeteer=require('puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL||'http://127.0.0.1:19872/');
const cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19873');
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback required');
(async()=>{
 const b=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),c=await b.createBrowserContext();
 try{
  const p=await c.newPage();if(process.env.CODI_PHONE)await p.setViewport({width:430,height:932,isMobile:true,hasTouch:true});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  const response=await p.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);
  assert.match(response.headers()['content-security-policy']||'',/wasm-unsafe-eval/);assert.doesNotMatch(response.headers()['content-security-policy']||'',/'unsafe-eval'/);
  await p.waitForFunction('window.__CAD_APP?.streams?.lifecycle?.projectLoaded?.value === true',{timeout:90000});
  await p.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
  const result=await p.evaluate(async()=>{
   window.Cypress={$:selector=>{const nodes=[...document.querySelectorAll(selector)];nodes.index=node=>nodes.indexOf(node);return nodes}};
   const ui=webosTest.modellerUISubject(__CAD_APP),[subject]=await webosTest.createPlaneAndOpenSketcher(ui);
   const first=subject.addCircle(-35,0,20),second=subject.addCircle(35,0,10),v=subject.viewer;
   subject.select([first,second]);const ctx=__CAD_APP.services.sketcher.inPlaceEditor.sketcherAppContext;
   if(!ctx.actions.ConcentricGlobal)throw Error('Concentric toolbar action unavailable');
   ctx.actions.ConcentricGlobal.invoke(ctx);
   const snap=()=>JSON.parse(v.io.serializeSketch(undefined,{strict:true}));
   const before=snap();const rel=before.stages.flatMap(x=>x.constraints).filter(x=>x.typeId==='Concentric');
   const centers=()=>[first.c.x,first.c.y,second.c.x,second.c.y,first.r.get(),second.r.get()];
   const applied=centers();v.historyManager.undo();const undone=snap().stages.flatMap(x=>x.constraints).filter(x=>x.typeId==='Concentric').length;
   v.historyManager.redo();const after=snap();const redone=after.stages.flatMap(x=>x.constraints).filter(x=>x.typeId==='Concentric').length;
   v.io.loadSketch(JSON.stringify(after),{strict:true});const restored=snap();
   const third=subject.addCircle(-35,40,6),fourth=subject.addCircle(35,40,7);
   const action=ctx.actions.Concentric,inspected=await action.inspect(ctx);
   const savedToken=inspected.revision,unchanged=v.io.serializeSketch(undefined,{strict:true});
   v.io.loadSketch(unchanged,{strict:true});let stale=false;
   try{await action.invokeByIds(ctx,[third.id,fourth.id],savedToken)}catch(e){stale=/changed/.test(e.message)}
   const refreshed=await action.inspect(ctx);let cancelled=false;
   try{await action.invokeByIds(ctx,[third.id,fourth.id],refreshed.revision,{valid:()=>false})}catch(e){cancelled=/no longer available/.test(e.message)}
   const latest=await action.inspect(ctx), command=await action.invokeByIds(ctx,[third.id,fourth.id],latest.revision,{valid:()=>true});
   const state=await action.inspect(ctx);return {agent:{stale,cancelled,command,objects:state.objects.filter(x=>[third.id,fourth.id].includes(x.id)),relations:state.relations},applied,ids:rel.map(r=>r.objects),undone,redone,restored:restored.stages.flatMap(x=>x.constraints).filter(x=>x.typeId==='Concentric').map(r=>r.objects),objects:restored.objects.filter(x=>x.type==='Circle').map(x=>x.data)};
  });
  assert.equal(result.ids.length,1);assert.equal(result.undone,0);assert.equal(result.redone,1);assert.deepEqual(result.restored,result.ids);
  assert.ok(Math.abs(result.applied[0]-result.applied[2])<1e-6);assert.ok(Math.abs(result.applied[1]-result.applied[3])<1e-6);
  assert.ok(Math.abs(result.applied[4]-20)<1e-6);assert.ok(Math.abs(result.applied[5]-10)<1e-6);assert.equal(result.objects.length,2);
  assert.equal(result.agent.stale,true);assert.equal(result.agent.cancelled,true);assert.equal(result.agent.command.status,'accepted');
  assert.equal(result.agent.objects.length,2);assert.ok(Math.abs(result.agent.objects[0].center.x-result.agent.objects[1].center.x)<1e-6);
  assert.ok(result.agent.relations.some(r=>r.objects.join(':')===result.agent.command.objects.join(':')));
  assert.deepEqual(errors,[]);console.log('PASS real sketcher concentric action, geometry, undo/redo and sketch IO reopen');
 }finally{await c.close();b.disconnect()}
})().catch(e=>{console.error(e);process.exitCode=1});
