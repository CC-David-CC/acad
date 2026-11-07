const assert=require('node:assert/strict');
// Replace descriptors on genuine replies only. No substitute Worker/math/UI.
module.exports=async({fresh,baseline})=>{
 const rows=[];
 for(const spec of[
  {id:'solve-ok',phase:'solve',field:'ok'},
  {id:'solve-revision',phase:'solve',field:'revision'},
  {id:'solve-sketch',phase:'solve',field:'sketch'},
  {id:'semantic-jobId',phase:'semantic',field:'jobId'},
  {id:'semantic-ok',phase:'semantic',field:'ok'},
  {id:'semantic-value',phase:'semantic',field:'value'},
  {id:'native-seq',phase:'native',field:'seq'},
  {id:'native-kind',phase:'native',field:'kind'},
  {id:'native-ready-kind',phase:'native-ready',field:'kind'},
  {id:'native-evidence-volume',phase:'native',field:'nativeVolume',nested:'evidence'}
 ]){
  const page=await fresh();await page.evaluate(()=>sp.setup());
  const row=await page.evaluate(async spec=>{
   const before=sp.capture(),Native=Worker;let injected=false,reads=0;
   window.Worker=class extends Native{constructor(...args){super(...args);this.addEventListener('message',event=>{
    if(injected)return;const d=event.data,task=this.row.task;
    const match=spec.phase==='solve'?task==='rectangle-extrusion-solve'&&d.ok===true:spec.phase==='semantic'?task==='inspect-selected'&&d.ok===true:spec.phase==='native'?task==='selected-profile-extrude'&&d.kind==='result':this.row.url.includes('selected-profile-worker')&&d.kind==='ready';
    if(!match)return;injected=true;const target=spec.nested?d[spec.nested]:d,value=target[spec.field];Object.defineProperty(target,spec.field,{enumerable:true,configurable:true,get(){reads++;return value;}});
   });}};
   let outcome;try{const value=spec.phase.startsWith('native')?await sp.create():await sp.inspect();outcome={ok:true,...(spec.phase.startsWith('native')?{bodyId:value.bodyId}:{regions:value.regions.length})};}catch(error){outcome={ok:false,name:error.name,code:error.code||null,message:error.message,committed:error.committed||false};}finally{window.Worker=Native;}
   const after=sp.capture(),result={...spec,injected,reads,outcome,preserved:JSON.stringify(before)===JSON.stringify(after),sourcePreserved:JSON.stringify(before.sketches)===JSON.stringify(after.sketches),resources:__CAD_APP.craftService.engineResourceUsage};
   spHost.abort();await new Promise(resolve=>setTimeout(resolve,100));result.resourcesAfterClose=__CAD_APP.craftService.engineResourceUsage;result.workers=spWorkers;return result;
  },spec);
  assert.equal(row.injected,true,JSON.stringify(row));assert.equal(row.sourcePreserved,true,JSON.stringify(row));
  if(baseline){assert.ok(row.reads>0,JSON.stringify(row));}
  else{assert.equal(row.reads,0,JSON.stringify(row));assert.equal(row.outcome.ok,false,JSON.stringify(row));assert.equal(row.outcome.committed,false);assert.equal(row.preserved,true,JSON.stringify(row));}
  assert.ok(row.workers.every(worker=>worker.terminated),JSON.stringify(row));assert.equal(row.resourcesAfterClose.mounts,0);assert.equal(row.resourcesAfterClose.owners,0);rows.push(row);await page.close();
 }
 return rows;
};
