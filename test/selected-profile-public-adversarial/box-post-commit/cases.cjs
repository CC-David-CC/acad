const assert=require('node:assert/strict');
// A real public publication observer queues cancellation before the command's
// async continuation. Committed geometry must never be described as rolled back.
module.exports=async({fresh,baseline})=>{
 const rows=[];
 for(const mode of['normal-publication','queued-caller-lifetime','queued-host-close']){
  const page=await fresh();
  const row=await page.evaluate(async mode=>{
   const c=__CAD_APP,k=c.craftService,before=sp.rawCapture(),selectedRevision=k.inspectSelectedProfileCommands().engineRevision,defaultEngine=k.inspectWorkerSolids().engines.find(e=>e.id==='occ');let observed=false,invalidated=false,valid=true;
   const detach=k.models$.attach(models=>{if(observed||!models.some(m=>m.ext?.workerGeometry?.representation==='worker-owned-occ-solid'))return;observed=true;if(mode==='normal-publication')return;queueMicrotask(()=>{invalidated=true;if(mode==='queued-host-close')spHost.abort();else valid=false;});});
   let outcome;try{outcome={ok:true,value:await k.createWorkerSolidBox({revision:k.inspectWorkerSolids().revision,version:1,unit:'millimeter',engine:'occ',origin:[1,2,3],dimensions:[2,3,4]},{valid:()=>valid})};}catch(e){outcome={ok:false,name:e.name,code:e.code||null,message:e.message,committed:e.committed||false};}finally{detach();}
   const model=k.models$.value.find(m=>m.ext?.workerGeometry?.representation==='worker-owned-occ-solid'),metrics=model?.inspectKernelMetrics(),after=sp.rawCapture();
   const result={mode,observed,invalidatedBeforeResolution:invalidated,outcome,committedHistoryAdded:JSON.parse(after.history).history.length===JSON.parse(before.history).history.length+1,sourcePreserved:JSON.stringify(before.sketches)===JSON.stringify(after.sketches),publishedBody:model?.id||null,nativeVolume:metrics?.volumeMagnitude??metrics?.nativeVolume??null,bounds:metrics?.bounds,runtime:metrics?.runtime,defaultEngine,selectedRevision};
   spHost.abort();await new Promise(resolve=>setTimeout(resolve,100));result.closedResources=k.engineResourceUsage;result.workers=spWorkers;return result;
  },mode);
  assert.equal(row.observed,true);assert.equal(row.invalidatedBeforeResolution,mode!=='normal-publication');assert.equal(row.committedHistoryAdded,true);assert.equal(row.sourcePreserved,true);assert.ok(row.publishedBody);assert.notEqual(row.defaultEngine.revision,row.selectedRevision);assert.deepEqual(row.bounds,{min:[1,2,3],max:[3,5,7]});assert.ok(Math.abs(row.nativeVolume-24)<1e-6);
  if(baseline||mode==='normal-publication')assert.equal(row.outcome.ok,true,JSON.stringify(row));else{assert.equal(row.outcome.ok,false,JSON.stringify(row));assert.equal(row.outcome.name,'AbortError');assert.equal(row.outcome.committed,true);}
  assert.equal(row.closedResources.mounts,0);assert.equal(row.closedResources.owners,0);assert.ok(row.workers.every(w=>w.terminated));rows.push(row);await page.close();
 }
 return rows;
};
