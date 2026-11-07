const assert=require('node:assert/strict');
module.exports=async function faults(page){
 const sources=['base = (() => 75)()\nW = base * 2\nH = base\nD = 25','W = 1\nW = 2','W = H\nH = W\nD = 25','base = -75\nW = base * 2\nH = base\nD = 25','base = 75\nW = base * 2\nH = base\nD = -25'];
 await page.evaluate(()=>{window.faultBaseline=()=>{const c=__CAD_APP,k=c.craftService;return {state:capture(),models:k.models$.value.slice(),history:k.modifications$.value,table:c.expressionService.table$.value,versions:capture().sketches.map(row=>c.storageService.versionOf(c.projectService.sketchStorageKey(row.id)))};};window.faultPreserved=before=>{const c=__CAD_APP,k=c.craftService,after=capture();return {source:before.state.source===after.source,sketches:JSON.stringify(before.state.sketches)===JSON.stringify(after.sketches),models:before.models.length===k.models$.value.length&&before.models.every((m,i)=>m===k.models$.value[i]),history:before.history===k.modifications$.value,table:before.table===c.expressionService.table$.value,metadata:before.state.metadata===after.metadata,versions:before.versions.every((v,i)=>v===c.storageService.versionOf(c.projectService.sketchStorageKey(before.state.sketches[i].id))),journal:['canUndo','canRedo','undoTarget','redoTarget'].every(key=>JSON.stringify(before.state.journal[key])===JSON.stringify(after.journal[key]))};};});
 const refusals=await page.evaluate(async sources=>{const c=__CAD_APP,k=c.craftService,rows=[];for(const source of sources){const before=faultBaseline();let error=null;try{await k.applyLegacyExpressions({revision:k.inspectAuthoredEdits().revision,source});}catch(e){error={name:e.name,code:e.code||null,message:e.message||String(e)};}rows.push({source,error,preserved:faultPreserved(before),pipelineFailure:k.pipelineFailure$.value});}return rows;},sources);
 const check=row=>{assert.ok(row.error||row.result?.ok===false,JSON.stringify(row));for(const [key,value]of Object.entries(row.preserved))assert.equal(value,true,JSON.stringify(row)+' '+key);};
 for(const row of refusals){check(row);assert.equal(row.pipelineFailure,null);}
 const interrupted=[];
 for(const [mode,task]of[['cancel','legacy-expression-transaction'],['lifetime','legacy-expression-transaction'],['table-ABA','legacy-expression-transaction'],['source-ABA','legacy-expression-transaction'],['cancel','rectangle-extrusion-solve']]){
  await page.evaluate(({task})=>{const c=__CAD_APP,k=c.craftService;window.faultBefore=faultBaseline();window.held=false;window.heldController=new AbortController();window.faultValid=true;window.holdNative=Worker;
   window.Worker=class extends holdNative{postMessage(data,...args){if(data?.task===task&&(task!=='legacy-expression-transaction'||data.sketchJSON!==null)){window.held=true;return;}return super.postMessage(data,...args);}};
   window.heldJob=k.applyLegacyExpressions({revision:k.inspectAuthoredEdits().revision,source:'base = 80\nW = base * 2\nH = base\nD = 30'},{signal:heldController.signal,valid:()=>faultValid}).then(value=>({ok:true,value}),e=>({ok:false,name:e.name,message:e.message}));
  },{task});
  await page.waitForFunction('window.held',{timeout:30000});
  const row=await page.evaluate(async mode=>{const c=__CAD_APP;if(mode==='cancel')heldController.abort();else if(mode==='lifetime')faultValid=false;else if(mode==='source-ABA')c.expressionService.script$.next(c.expressionService.script$.value);else c.expressionService.table$.next(c.expressionService.table$.value);try{const result=await heldJob;return {mode,result,preserved:faultPreserved(faultBefore)};}finally{window.Worker=holdNative;}},mode);
  check(row);assert.equal(row.result.name,'AbortError');interrupted.push({...row,heldTask:task});
 }
 const malformed=[];
 for(const mode of ['extra-envelope','extra-result','bad-number','duplicate-name','source-native','source-frame','accessor','bad-native-json','changed-intent','bad-frame','changed-frame']){
  const row=await page.evaluate(async mode=>{const c=__CAD_APP,k=c.craftService,before=faultBaseline(),Native=Worker;let injected=false,getterCalls=0;
   window.Worker=class extends Native{constructor(...args){super(...args);this.addEventListener('message',event=>{const data=event.data;if(injected||this.faultTask!=='legacy-expression-transaction'||!data.ok)return;const sketchCase=['bad-native-json','changed-intent','bad-frame','changed-frame'].includes(mode);if(sketchCase!==this.faultSketch)return;injected=true;
    if(mode==='extra-envelope')data.unexpected=true;
    else if(mode==='extra-result')data.result.unexpected=true;
    else if(mode==='bad-number')data.result.values[0].value=NaN;
    else if(mode==='duplicate-name')data.result.values.push({...data.result.values[0]});
    else if(mode==='source-native')data.serializedSketch='{}';
    else if(mode==='source-frame')data.boundaryFrame={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]};
    else if(mode==='accessor'){const value=data.result;Object.defineProperty(data,'result',{enumerable:true,get(){getterCalls++;return value;}});}
    else if(mode==='bad-native-json')data.serializedSketch='{';
    else if(mode==='changed-intent'){const native=JSON.parse(data.serializedSketch);native.stages[0].constraints.find(row=>row.typeId==='SegmentLength').constants.length='160';data.serializedSketch=JSON.stringify(native);}
    else if(mode==='bad-frame')data.boundaryFrame.x[0]=2;
    else if(mode==='changed-frame')data.boundaryFrame.origin[0]=99;
   });}postMessage(data,...args){this.faultTask=data?.task;this.faultSketch=data?.sketchJSON!==null;return super.postMessage(data,...args);}};
   let error=null;try{await k.applyLegacyExpressions({revision:k.inspectAuthoredEdits().revision,source:'base = 80\nW = base * 2\nH = base\nD = 30'});}catch(e){error={name:e.name,message:e.message||String(e)};}finally{window.Worker=Native;}
   return {mode,injected,getterCalls,error,preserved:faultPreserved(before)};
  },mode);
  assert.equal(row.injected,true,mode);assert.equal(row.getterCalls,0,mode);check(row);malformed.push(row);
 }
 const stale=await page.evaluate(async()=>{const k=__CAD_APP.craftService,before=faultBaseline();let error=null;try{await k.applyLegacyExpressions({revision:'stale',source:'base = 80'});}catch(e){error={name:e.name,message:e.message};}return {error,preserved:faultPreserved(before)};});check(stale);assert.equal(stale.error.name,'AbortError');
 return {refusals,interrupted,malformed,stale};
};
