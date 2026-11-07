const assert=require('node:assert/strict');
module.exports=async({fresh,baseline})=>{
 const rows=[];
 for(const mode of['identical-project-save','public-source-ABA']){
  const page=await fresh();await page.evaluate(async()=>{await sp.setup();__CAD_APP.projectService.save();});
  await page.evaluate(()=>{
   window.spHeldBefore=sp.capture();window.spHoldUsed=false;window.spHeld=false;window.spHeldSettled=null;window.spLatePassed=false;window.spHeldNative=Worker;
   window.Worker=class extends spHeldNative{constructor(...args){super(...args);this.addEventListener('message',e=>{if(this.row.task!=='inspect-selected'||e.data.ok!==true)return;if(this.wasHeld){spLatePassed=true;return;}if(spHoldUsed)return;spHoldUsed=true;this.wasHeld=true;e.stopImmediatePropagation();spHeld=true;const Message=MessageEvent;window.spRelease=()=>this.dispatchEvent(new Message('message',{data:e.data}));});}};
   window.spHeldJob=sp.inspect().then(value=>({ok:true,regionIds:value.regions.map(r=>r.regionId)}),e=>({ok:false,name:e.name,code:e.code||null,message:e.message})).then(result=>{spHeldSettled=result;return result;});
  });
  await page.waitForFunction(()=>spHeld||spHeldSettled,{timeout:45000,polling:50});assert.equal(await page.evaluate(()=>spHeld),true);
  const row=await page.evaluate(async({mode,baseline})=>{
   try{
    const c=__CAD_APP,k=c.craftService,s=c.storageService,namespace=c.projectService.sketchStorageNamespace,key=c.projectService.sketchStorageKey(sp.faceId),projectKey=c.projectService.projectStorageKey();
    const stamp=()=>({global:s.revision,namespace:s.namespaceRevision(namespace),sourceVersion:s.versionOf(key),projectVersion:s.versionOf(projectKey),source:c.sketchStorageService.getSketchData(sp.faceId),project:s.get(projectKey)}),beforeStamp=stamp();let expected=spHeldBefore;
    if(mode==='identical-project-save')c.projectService.save();
    else{await sp.append('Point',{x:77,y:78},'construction');await k.authoredEditTravel({revision:k.inspectAuthoredEdits().revision,direction:'undo'});expected=sp.capture();}
    const afterStamp=stamp();await new Promise(resolve=>setTimeout(resolve,250));const settledBeforeRelease=spHeldSettled;
    if(mode==='identical-project-save'&&!baseline){if(spHeldSettled)throw Error('Unrelated save invalidated current selected discovery');spRelease();}
    const result=await spHeldJob,settled=JSON.stringify(sp.capture());if(mode!=='identical-project-save'||baseline)spRelease();await new Promise(resolve=>setTimeout(resolve,100));
    const record={mode,beforeStamp,afterStamp,settledBeforeRelease,result,preserved:JSON.stringify(expected)===settled,lateReplyDelivered:spLatePassed,lateReplyPreserved:JSON.stringify(sp.capture())===settled};spHost.abort();await new Promise(resolve=>setTimeout(resolve,100));record.resourcesAfterClose=k.engineResourceUsage;record.workers=spWorkers;return record;
   }finally{window.Worker=spHeldNative;}
  },{mode,baseline});
  assert.ok(row.afterStamp.global>row.beforeStamp.global);assert.equal(row.afterStamp.source,row.beforeStamp.source);assert.equal(row.preserved,true);assert.equal(row.lateReplyDelivered,true);assert.equal(row.lateReplyPreserved,true);
  if(mode==='identical-project-save'){assert.equal(row.afterStamp.namespace,row.beforeStamp.namespace);assert.equal(row.afterStamp.sourceVersion,row.beforeStamp.sourceVersion);assert.equal(row.afterStamp.project,row.beforeStamp.project);assert.ok(row.afterStamp.projectVersion>row.beforeStamp.projectVersion);assert.equal(row.result.ok,!baseline,JSON.stringify(row));if(baseline)assert.equal(row.result.name,'AbortError');else assert.equal(row.settledBeforeRelease,null);}
  else{assert.notEqual(row.afterStamp.namespace,row.beforeStamp.namespace);assert.notEqual(row.afterStamp.sourceVersion,row.beforeStamp.sourceVersion);assert.equal(row.result.ok,false);assert.equal(row.result.name,'AbortError');}
  assert.equal(row.resourcesAfterClose.mounts,0);assert.equal(row.resourcesAfterClose.owners,0);assert.ok(row.workers.every(w=>w.terminated));rows.push(row);await page.close();
 }
 return rows;
};
