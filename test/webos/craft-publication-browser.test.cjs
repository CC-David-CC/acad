const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL||'http://127.0.0.1:19982/node_modules/jsketcher-build/'),cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19983');
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href}),context=await browser.createBrowserContext(),errors=[];
try{
 async function page(){const p=await context.newPage();p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.text().startsWith('Error while observer call:'))errors.push(m.text());});await p.goto(new URL('index-webos.html?DEFAULT&webos=1',base));await p.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});return p;}
 const p=await page();
 const result=await p.evaluate(async()=>{
  const c=__CAD_APP,observations=[],call=req=>new Promise((yes,no)=>c.craftService.modify(req,yes,no));
  const inspect=source=>{const mods=c.craftService.modifications$.value,models=c.craftService.models$.value;observations.push({source,history:mods.history.length,models:models.length,pointer:mods.pointer,registry:models.every(m=>c.cadRegistry.find(m.id)===m)&&c.cadRegistry.shells.length===models.length});};
  const detachModels=c.craftService.models$.attach(()=>inspect('models'));
  const detachHistory=c.craftService.modifications$.attach(()=>inspect('history'));
  try{for(let i=1;i<=3;i++)await call({type:'PLANE',params:{featureId:i,orientation:'XY',depth:i}});}
  finally{detachModels();detachHistory();}
  return observations;
 });
 console.log('PUBLICATION_OBSERVATIONS',JSON.stringify(result));
 assert.ok(result.length>=8);
 assert.deepEqual(result.filter(r=>r.history!==r.models||r.pointer!==r.history-1||!r.registry),[],'observers must see one accepted history/model/registry revision');
 const q=await page();
 const reset=await q.evaluate(async()=>{
  const c=__CAD_APP;let staleObserver=0,reset=false,immediate=null,emptyNotifications=0;
  const first=c.craftService.models$.attach(models=>{if(models.length===1&&!reset){reset=true;c.projectService.empty();
   immediate={models:c.craftService.models$.value.length,history:c.craftService.modifications$.value.history.length,
     index:c.cadRegistry.modelIndex.size,shells:c.cadRegistry.shells.length,failure:c.craftService.pipelineFailure$.value};
  }});
  const second=c.craftService.models$.attach(models=>{if(reset&&models.length===1)staleObserver++;if(reset&&!models.length)emptyNotifications++;});
  try{
   const outcome=await new Promise(resolve=>c.craftService.modify({type:'PLANE',params:{featureId:1,orientation:'XY',depth:0}},()=>resolve('accepted'),e=>resolve({name:e.name,committed:e.committed})));
   const end=Date.now()+30000;while(c.craftService.isProcessing&&Date.now()<end)await new Promise(r=>setTimeout(r,20));
   return{outcome,staleObserver,immediate,emptyNotifications,history:c.craftService.modifications$.value.history.length,models:c.craftService.models$.value.length,processing:c.craftService.isProcessing};
  }finally{first();second();}
 });
 assert.ok(reset.emptyNotifications>0);delete reset.emptyNotifications;
 assert.deepEqual(reset,{outcome:{name:'AbortError',committed:true},staleObserver:0,
   immediate:{models:0,history:0,index:0,shells:0,failure:null},history:0,models:0,processing:false});

 const f=await page();
 const failure=await f.evaluate(async()=>{
  const c=__CAD_APP,call=req=>new Promise((yes,no)=>c.craftService.modify(req,yes,no));
  const wait=async()=>{const end=Date.now()+30000;while(c.craftService.isProcessing&&Date.now()<end)await new Promise(r=>setTimeout(r,20));if(c.craftService.isProcessing)throw Error('timeout');};
  for(let i=1;i<=2;i++)await call({type:'PLANE',params:{featureId:i,orientation:'XY',depth:i}});
  const accepted=c.craftService.models$.value,history=c.craftService.modifications$.value.history;
  const op=c.operationService.get('PLANE'),original=op.run,observations=[];
  op.run=(params,...args)=>{if(params.depth===42)throw Error('injected replay failure');return original(params,...args);};
  const inspect=()=>{const mods=c.craftService.modifications$.value;observations.push({history:mods.history.length,pointer:mods.pointer,models:c.craftService.models$.value.length,failure:c.craftService.pipelineFailure$.value?.message||null,retained:c.craftService.models$.value===accepted,registry:accepted.every(m=>c.cadRegistry.find(m.id)===m)});};
  const detach=[c.craftService.models$.attach(inspect),c.craftService.modifications$.attach(inspect),c.craftService.pipelineFailure$.attach(inspect)];observations.length=0;
  try {
   c.craftService.modifications$.next({history:[...history,{type:'PLANE',params:{featureId:3,orientation:'XY',depth:42}}],pointer:2});
   await wait();const failed=observations.splice(0);
   for(const stop of detach)stop();
   // Recover, then reject a new command while deliberately rolled back. The
   // last complete tip is not the accepted rollback geometry.
   c.craftService.modifications$.next({history,pointer:1});await wait();
   const tip=c.craftService.models$.value;
   const rejectedAtTip=await call({type:'PLANE',params:{featureId:4,orientation:'XY',depth:42}}).then(()=>null,e=>e.message);
   const saved=c.projectManager.snapshotCurrentProject();
   const stillSavable=rejectedAtTip==='injected replay failure'&&c.craftService.models$.value===tip&&c.craftService.pipelineFailure$.value===null&&saved.project.model.history.length===2;
   c.craftService.historyTravel.setPointer(0);await wait();
   const before=c.craftService.models$.value,beforeHistory=c.craftService.modifications$.value;
   const rejection=await call({type:'PLANE',params:{featureId:5,orientation:'XY',depth:42}}).then(()=>null,e=>e.message);
   return {failed,rejection,stillSavable,retainedRollback:c.craftService.models$.value===before,retainedHistory:c.craftService.modifications$.value===beforeHistory,
     models:c.craftService.models$.value.length,pointer:c.craftService.modifications$.value.pointer};
  }finally{op.run=original;for(const stop of detach)stop();}
 });
 assert.ok(failure.failed.length>=3);
 for(const observation of failure.failed)assert.deepEqual(observation,{history:3,pointer:2,models:2,failure:'injected replay failure',retained:true,registry:true});
 assert.equal(failure.stillSavable,true);assert.equal(failure.rejection,'injected replay failure');assert.equal(failure.retainedRollback,true);assert.equal(failure.retainedHistory,true);assert.equal(failure.models,1);assert.equal(failure.pointer,0);

 const n=await page();
 const nested=await n.evaluate(async()=>{
  const c=__CAD_APP,call=req=>new Promise((yes,no)=>c.craftService.modify(req,yes,no));
  const wait=async()=>{const end=Date.now()+30000;while(c.craftService.isProcessing&&Date.now()<end)await new Promise(r=>setTimeout(r,20));if(c.craftService.isProcessing)throw Error('timeout');};
  await call({type:'PLANE',params:{featureId:1,orientation:'XY',depth:1}});
  const history=c.craftService.modifications$.value.history,op=c.operationService.get('PLANE'),original=op.run;
  op.run=(params,...args)=>{if(params.depth===42)throw Error('injected failure reset');return original(params,...args);};
  let reset=false,immediate=null,stale=0,acceptedCallbacks=0,errorCallbacks=0;
  const stops=[c.craftService.pipelineFailure$.attach(failure=>{if(failure&&!reset){reset=true;c.projectService.empty();immediate={history:c.craftService.modifications$.value.history.length,models:c.craftService.models$.value.length,index:c.cadRegistry.modelIndex.size,shells:c.cadRegistry.shells.length,failure:c.craftService.pipelineFailure$.value};}}),
   c.craftService.pipelineFailure$.attach(failure=>{if(reset&&failure)stale++;}),
   c.craftService.models$.attach(models=>{if(reset&&models.length)stale++;})];
  try {
   c.craftService.modifications$.next({history:[...history,{type:'PLANE',params:{featureId:2,orientation:'XY',depth:42}}],pointer:1});
   await wait();for(const stop of stops)stop();
   c.craftService.modify({type:'PLANE',params:{featureId:1,orientation:'XY',depth:1}},()=>{acceptedCallbacks++;throw Error('consumer accepted callback failure');},()=>errorCallbacks++);
   await wait();
   c.craftService.modify({type:'PLANE',params:{featureId:2,orientation:'XY',depth:42}},()=>acceptedCallbacks++,()=>{errorCallbacks++;throw Error('consumer error callback failure');});
   await wait();
   const preserved={history:c.craftService.modifications$.value.history.length,models:c.craftService.models$.value.length,failure:c.craftService.pipelineFailure$.value};
   await call({type:'PLANE',params:{featureId:3,orientation:'XY',depth:3}});
   return {immediate,stale,acceptedCallbacks,errorCallbacks,preserved,recovered:c.craftService.models$.value.length};
  }finally{op.run=original;for(const stop of stops)stop();}
 });
 assert.deepEqual(nested,{immediate:{history:0,models:0,index:0,shells:0,failure:null},stale:0,acceptedCallbacks:1,errorCallbacks:1,
  preserved:{history:1,models:1,failure:null},recovered:2});
 assert.deepEqual(errors,[],'publication must not hide observer or page exceptions');
 console.log('PASS actual CAD publication consistency, synchronous reset, failed revision, rejected rollback edit, savable rejection and callback failures');
}finally{await context.close();browser.disconnect();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
