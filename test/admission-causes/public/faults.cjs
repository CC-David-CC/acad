const assert=require('node:assert/strict');
module.exports=async(page,fresh,saved,targets)=>{
 const rows=[];
 for(const mode of['unknown-kind','wrong-basis','extra-cause','accessor-cause','accessor-kind','extra-error','null-cause','legacy-no-cause','line-wrong-basis','line-accessor-kind']){
  const row=await page.evaluate(async mode=>{
   const c=__CAD_APP,k=c.craftService,{faceId,ids}=publicCauseTargets,before=captureCauseState(),Native=Worker;let injected=false,getters=0,genuineFailure;const line=mode.startsWith('line-'),task=line?'sketch-transition-line-relation':'sketch-transition-signed-distance',mutation=line?mode.slice(5):mode;
   window.Worker=class extends Native{constructor(...args){super(...args);this.addEventListener('message',event=>{
    if(injected||this.task!==task||event.data.ok!==false)return;
    injected=true;const d=event.data;genuineFailure=structuredClone(d.error);
    if(mutation==='unknown-kind')d.error.cause={kind:'globally-infeasible',basis:'unproved'};
    else if(mutation==='wrong-basis')d.error.cause={kind:'algebraic-contradiction',basis:'solver-status'};
    else if(mutation==='extra-cause')d.error.cause.extra='must-refuse';
    else if(mutation==='accessor-cause')Object.defineProperty(d.error,'cause',{enumerable:true,get(){getters++;return genuineFailure.cause;}});
    else if(mutation==='accessor-kind')Object.defineProperty(d.error.cause,'kind',{enumerable:true,get(){getters++;return'algebraic-contradiction';}});
    else if(mutation==='extra-error')d.error.extra='must-refuse';
    else if(mutation==='null-cause')d.error.cause=null;
    else delete d.error.cause;
   });}postMessage(v,...rest){this.task=v?.task;return super.postMessage(v,...rest);}};
   let error;try{if(line)await k.applySketchLineRelation({revision:k.inspectSketchTransitions().revision,faceId:publicCauseTargets.line.faceId,kind:'axis-symmetry',ids:publicCauseTargets.line.ids});else await k.applySketchSignedDistance({revision:k.inspectSketchTransitions().revision,faceId,axis:'x',ids,distance:11});}catch(e){error={name:e.name,code:e.code||null,message:e.message,committed:e.committed||false,cause:e.cause||null};}finally{window.Worker=Native;}
   const after=captureCauseState();return{mode,injected,getters,genuineFailure,error,preserved:JSON.stringify(before)===JSON.stringify(after),differences:Object.keys(before).filter(key=>JSON.stringify(before[key])!==JSON.stringify(after[key]))};
  },mode);
  assert.equal(row.injected,true,JSON.stringify(row));assert.equal(row.getters,0,JSON.stringify(row));assert.deepEqual(row.genuineFailure.cause,mode.startsWith('line-')?{kind:'invalid-domain',basis:'domain-check'}:{kind:'algebraic-contradiction',basis:'exact-reduced-row'});assert.ok(row.error,JSON.stringify(row));assert.equal(row.error.committed,false);assert.equal(row.preserved,true,JSON.stringify(row));assert.equal(row.error.cause,null);
  if(mode==='legacy-no-cause')assert.equal(row.error.code,'DISTANCE_CONFLICT');else assert.notEqual(row.error.code,mode.startsWith('line-')?'LINE_RELATION_CONFLICT':'DISTANCE_CONFLICT','Malformed diagnostics must fail envelope validation rather than reach public conflict');rows.push(row);
 }
 for(const mode of['held-success-lifetime','held-success-host-close']){
  const targetPage=mode==='held-success-host-close'?await fresh():page;
  if(targetPage!==page){await targetPage.evaluate(async saved=>__CAD_APP.projectManager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(saved)])),saved);await targetPage.evaluate(targets=>window.publicCauseTargets=targets,targets);}
  await targetPage.evaluate(mode=>{
   const c=__CAD_APP,k=c.craftService,{faceId,freeIds}=publicCauseTargets;
   window.causeHeldBefore=captureCauseState(mode!=='held-success-host-close');window.causeHeldValid=true;window.causeHeld=false;window.causeHeldSettled=null;window.causeLatePassed=false;window.causeHeldNative=Worker;
   window.Worker=class extends causeHeldNative{constructor(...args){super(...args);this.addEventListener('message',e=>{
    if(this.task!=='sketch-transition-signed-distance'||e.data.ok!==true)return;
    if(this.heldDelivery){window.causeLatePassed=true;return;}this.heldDelivery=true;
    e.stopImmediatePropagation();window.causeHeld=true;window.causeHeldReply=e.data;const Message=MessageEvent;window.causeHeldRelease=()=>this.dispatchEvent(new Message('message',{data:e.data}));
   });}postMessage(v,...rest){this.task=v?.task;return super.postMessage(v,...rest);}};
   window.causeHeldJob=k.applySketchSignedDistance({revision:k.inspectSketchTransitions().revision,faceId,axis:'y',ids:freeIds,distance:8},{valid:()=>causeHeldValid}).then(value=>({ok:true,value}),e=>({ok:false,name:e.name,message:e.message,committed:e.committed||false,cause:e.cause||null})).then(result=>{causeHeldSettled=result;return result;});
  },mode);
  await targetPage.waitForFunction(()=>causeHeld||causeHeldSettled,{timeout:30000,polling:50});assert.equal(await targetPage.evaluate(()=>causeHeld),true,mode+': '+JSON.stringify(await targetPage.evaluate(()=>causeHeldSettled)));
  const row=await targetPage.evaluate(async mode=>{
   try{
    const source=__CAD_APP.sketchStorageService.getSketchData(publicCauseTargets.faceId),wouldChangeNative=causeHeldReply.serializedSketch!==source;
    if(mode==='held-success-host-close')publicCauseHost.abort();else causeHeldValid=false;
    const result=await causeHeldJob,after=captureCauseState(mode!=='held-success-host-close'),before=causeHeldBefore,settled=JSON.stringify(after);causeHeldRelease();await new Promise(resolve=>setTimeout(resolve,100));
    let closedInspectionRefused=null;if(mode==='held-success-host-close'){try{__CAD_APP.craftService.inspectAuthoredEdits();closedInspectionRefused=false;}catch(error){closedInspectionRefused=error.name==='AbortError';}}
    return{mode,closedInspectionRefused,genuineSuccessHeld:causeHeldReply.ok===true,wouldChangeNative,result,preserved:JSON.stringify(before)===settled,lateReplyDelivered:causeLatePassed,lateReplyPreserved:JSON.stringify(captureCauseState(mode!=='held-success-host-close'))===settled,differences:Object.keys(before).filter(key=>JSON.stringify(before[key])!==JSON.stringify(after[key]))};
   }finally{window.Worker=causeHeldNative;}
  },mode);
  if(mode==='held-success-host-close')assert.equal(row.closedInspectionRefused,true);assert.equal(row.genuineSuccessHeld,true);assert.equal(row.wouldChangeNative,true);assert.equal(row.result.ok,false);assert.equal(row.result.name,'AbortError');assert.equal(row.result.committed,false);assert.equal(row.result.cause,null);assert.equal(row.preserved,true,JSON.stringify(row));assert.equal(row.lateReplyDelivered,true,JSON.stringify(row));assert.equal(row.lateReplyPreserved,true,JSON.stringify(row));rows.push(row);
 }
 return rows;
};
