import {assertHistoryControlAppendAllowed,historyControlAppendReason} from 'engine/solid/authoredHistoryState.mjs';
import {MWorkerSolid} from 'cad/model/mworkerSolid';
import {solidBodyId} from 'engine/solid/solidIntent.mjs';
import {captureOwnedShellFeature} from 'engine/solid/ownedShellFeature.mjs';
import {inspectWorkerSolidSelections} from 'engine/solid/solidLedger.mjs';
import {requireCadEngineBuild} from 'engine/mount/engineCatalog.mjs';
import {genericHistoryBuild} from 'engine/mount/selectedProfileBuildSelection.mjs';
import {selectedProfileHistoryBudget} from 'engine/mount/selectedProfileBudget.mjs';
import {selectSolidContinuationBuild} from 'engine/solid/solidOperandRuntime.mjs';

const OP='WORKER_SOLID_SHELL_V1';
const nativeAborted=Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted')!.get!;
const isAborted=(signal:any)=>signal!==undefined&&nativeAborted.call(signal);
const listen=(signal:AbortSignal,callback:()=>void)=>EventTarget.prototype.addEventListener.call(signal,'abort',callback,{once:true});
const unlisten=(signal:AbortSignal,callback:()=>void)=>EventTarget.prototype.removeEventListener.call(signal,'abort',callback);
const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
const abort=(committed=false)=>{const e=new DOMException(committed?'Accepted shell was superseded.':'Shell was cancelled or superseded.','AbortError');Object.defineProperty(e,'committed',{value:committed,enumerable:true});return e;};
function fields(value:any,keys:string[]){
 const proto=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
 if(!value||typeof value!=='object'||Array.isArray(value)||(proto!==null&&Object.getPrototypeOf(proto)!==null)||Reflect.ownKeys(value).length!==keys.length)fail('INVALID_REQUEST','Expected exact shell data fields.');
 const out:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))fail('INVALID_REQUEST','Shell fields must be data.');out[key]=d.value;}return out;
}
function options(value:any){
 if(!value||typeof value!=='object'||Array.isArray(value))fail('INVALID_REQUEST','Invalid shell options.');
 const keys=Reflect.ownKeys(value);if(keys.some(k=>typeof k!=='string'||!['signal','valid'].includes(k)))fail('INVALID_REQUEST','Invalid shell options.');
 const out=fields(value,keys as string[]);if(out.valid!==undefined&&typeof out.valid!=='function')fail('INVALID_REQUEST','Invalid lifetime guard.');
 if(out.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(out.signal);}catch{fail('INVALID_REQUEST','Invalid cancellation signal.');}return out;
}
const id=(v:any,max=256)=>typeof v==='string'&&v.length>0&&v.length<=max;
const vectorData=(v:any)=>Array.isArray(v)&&v.length===3&&Reflect.ownKeys(v).length===4&&[0,1,2].every(i=>{const d=Object.getOwnPropertyDescriptor(v,String(i));return d?.enumerable&&Object.prototype.hasOwnProperty.call(d,'value')&&typeof d.value==='number'&&Number.isFinite(d.value);});
function runtimeBuild(metrics:any,engine:string){
 const r=metrics?.runtime;if(!r||!Object.isFrozen(r)||!['jsSha256','wasmSha256'].every(k=>typeof r[k]==='string'&&/^[a-f0-9]{64}$/.test(r[k])))fail('ENGINE_BINDING_MISMATCH','The current native runtime is unavailable.');
 const build:any=requireCadEngineBuild(engine,'sha256:'+r.jsSha256+':'+r.wasmSha256);
 if(r.mountEngine!==build.mountEngine||r.representation!==build.representation)fail('ENGINE_BINDING_MISMATCH','The current native runtime differs from its registered build.');return build;
}
function measured(model:any,featureId:number,build:any){
 if(!(model instanceof MWorkerSolid)||model.featureId!==featureId||model.id!==solidBodyId(featureId)||model.ext?.workerGeometry?.engine!=='occ')fail('ENGINE_FAILURE','The checked native shell output is unavailable.');
 const m=model.inspectKernelMetrics();
 if(!m||!Object.isFrozen(m)||m.runtime!==model.ext.workerGeometry.runtime||m.resultKind!=='single-solid'||m.solidCount!==1||m.nativeValidity?.valid!==true||typeof m.nativeVolume!=='number'||!Number.isFinite(m.nativeVolume)||m.nativeVolume<=0||!m.nativeBounds||!['min','max'].every(k=>vectorData(m.nativeBounds[k]))||m.nativeBounds.min.some((v:number,i:number)=>v>m.nativeBounds.max[i])||runtimeBuild(m,'occ')!==build)fail('ENGINE_FAILURE','One measured valid native solid in the recorded runtime is required.');
 return m;
}
function advertisedFaces(selection:any,featureId:number){
 const unavailable=():never=>fail('UNRESOLVED_SELECTION','Current native box-construction face selections are unavailable for this producer.');
 const data=(value:any,key:string)=>{const d=value&&typeof value==='object'?Object.getOwnPropertyDescriptor(value,key):null;if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))unavailable();return d.value;};
 if(!selection||!Object.isFrozen(selection)||data(selection,'status')!=='available')unavailable();
 const plan=data(selection,'plan');if(!plan||!Object.isFrozen(plan)||data(plan,'version')!==2||data(plan,'featureId')!==featureId||data(plan,'scope')!=='authored-source'||!['box-construction-history','kernel-operation-history'].includes(data(plan,'source'))||Object.prototype.hasOwnProperty.call(plan,'regionId'))unavailable();
 const contexts=data(plan,'sourceContexts');if(!Array.isArray(contexts)||!Object.isFrozen(contexts)||contexts.length<1||contexts.length>32||Reflect.ownKeys(contexts).length!==contexts.length+1)unavailable();
 const origins=new Set<number>();for(let i=0;i<contexts.length;i++){const c=data(contexts,String(i)),origin=data(c,'featureId');if(!c||!Object.isFrozen(c)||Reflect.ownKeys(c).length!==3||data(c,'kind')!=='box'||data(c,'regionId')!==null||!Number.isSafeInteger(origin)||origin<1||origins.has(origin))unavailable();origins.add(origin);}
 const faces=data(plan,'faces');if(!Array.isArray(faces)||!Object.isFrozen(faces)||faces.length>256||Reflect.ownKeys(faces).length!==faces.length+1)unavailable();
 const ids:string[]=[],roles=['X_MIN','X_MAX','Y_MIN','Y_MAX','Z_MIN','Z_MAX'];
 for(let i=0;i<faces.length;i++){const row=data(faces,String(i)),faceId=data(row,'id');if(!row||!Object.isFrozen(row)||!id(faceId,16384)||!origins.has(data(row,'originFeatureId')))unavailable();if(data(row,'geometry')==='plane'&&roles.includes(data(row,'role')))ids.push(faceId);}
 if(!ids.length||new Set(ids).size!==ids.length)unavailable();return Object.freeze(ids);
}

// The shared craft service owns evaluation, native handles and publication.
export function createWorkerShellCommands(ctx:any,submit:any,cancelEpoch:(epoch:number)=>void){
 if(typeof submit!=='function'||typeof cancelEpoch!=='function')fail('INVALID_REQUEST','Shared craft publication and cancellation are required.');
 function discover(){
  const craft=ctx.craftService,registry=ctx.cadRegistry,project=ctx.projectService,storage=ctx.storageService,manager=ctx.projectManager,unit=manager.unit,info=craft.inspectWorkerSolids(),state=craft.modifications$.value,generation=project.documentGeneration,storageRevision=storage.revision;
  if(!id(info.revision)||!Array.isArray(info.bodies)||info.bodies.length>16384||!Array.isArray(info.outputs)||info.outputs.length>16384)fail('UNAVAILABLE','Current solid inspection is unavailable.');
  let reason=info.ready?null:info.reason||'Finish the current operation before creating a shell.';
  if(!reason)reason=historyControlAppendReason(ctx.craftService.modifications$.value.history,OP);
  if(!reason&&(!project.hasHostLifetime||!project.isDocumentCurrent(generation)))reason='A current host-bound workspace is required.';
  if(!reason&&unit!=='millimeter')reason='Shells require a millimeter document.';
  if(!reason)try{ctx.operationService.get(OP);}catch{reason='The shell operation is unavailable in this build.';}
  const targets:any[]=[],unsupported:any[]=[],records=new Map<string,any>(),seen=new Set();
  for(const body of info.bodies){
   if(!id(body?.id,1024)||seen.has(body.id))fail('UNAVAILABLE','Current solid identities are unavailable.');seen.add(body.id);
   try{
    const model=registry.find(body.id);if(!(model instanceof MWorkerSolid)||model.id!==body.id||model.featureId!==body.featureId||model.ext.workerGeometry.engine!==body.engine||model.inspectKernelMetrics()!==body.metrics)fail('INVALID_OPERAND','Select a current native solid.');
    const build=runtimeBuild(body.metrics,body.engine);if(build.id!=='occ'||build.shellVersion!==1)fail('ENGINE_CAPABILITY_UNAVAILABLE','The recorded part backend does not support shells.');
    measured(model,body.featureId,build);if(inspectWorkerSolidSelections(model)!==body.selections)fail('UNRESOLVED_SELECTION','The authored selection snapshot is no longer current.');
    const removedFaceIds=advertisedFaces(body.selections,body.featureId),historyBuild=genericHistoryBuild(state.history),outputBuild=selectSolidContinuationBuild(info.outputs,'occ',build.revision);
    if(historyBuild!==build||outputBuild!==build)fail('ENGINE_REVISION_MISMATCH','The whole authored part must retain one backend build.');
    const budget=selectedProfileHistoryBudget(state.history,build.revision),row=Object.freeze({bodyId:body.id,featureId:body.featureId,engine:'occ',engineRevision:build.revision,selections:body.selections,removedFaceIds,budget,canCreate:!reason&&budget.canAppend,reason:reason||budget.reason||(!budget.canAppend?'RESOURCE_LIMIT':null)});
    targets.push(row);records.set(body.id,{row,model,ext:model.ext,tag:model.ext.workerGeometry,method:model.inspectKernelMetrics,metrics:body.metrics,selections:body.selections,build});
   }catch(error){unsupported.push(Object.freeze({bodyId:body.id,engine:body.engine,code:error.code||'UNAVAILABLE',reason:String(error.message||error)}));}
  }
  const end=craft.inspectWorkerSolids();
  if(ctx.craftService!==craft||ctx.cadRegistry!==registry||ctx.projectService!==project||ctx.storageService!==storage||ctx.projectManager!==manager||manager.unit!==unit||craft.modifications$.value!==state||storage.revision!==storageRevision||project.documentGeneration!==generation||end.revision!==info.revision||[...records.values()].some(r=>registry.find(r.model.id)!==r.model||r.model.ext!==r.ext||r.ext.workerGeometry!==r.tag||r.model.inspectKernelMetrics!==r.method||r.method.call(r.model)!==r.metrics||inspectWorkerSolidSelections(r.model)!==r.selections))throw abort();
  return {info:Object.freeze({ready:!reason,reason:reason||null,revision:info.revision,unit:'millimeter',engine:'occ',directions:Object.freeze(['inward']),limits:Object.freeze({removedFaces:16,maxThicknessMm:1e6}),sourceQualification:'requires-worker-validation',selectionScope:'retained-box-construction-faces',canCreate:!reason&&targets.some(t=>t.canCreate),targets:Object.freeze(targets),unsupported:Object.freeze(unsupported),scope:'numeric-authored-worker-shell-v1'}),records};
 }
 function inspectWorkerShells(){return discover().info;}
 async function createWorkerShell(input:any,rawOptions:any={}){
  assertHistoryControlAppendAllowed(ctx.craftService.modifications$.value.history,OP);
  const args=fields(input,['revision','version','unit','engine','engineRevision','bodyId','removedFaceIds','thickness','direction']),opts=options(rawOptions);
  if(!id(args.revision)||!id(args.bodyId,1024)||args.version!==1||args.unit!=='millimeter'||args.engine!=='occ'||typeof args.engineRevision!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(args.engineRevision))fail('INVALID_REQUEST','Use a current inspected OCC body and explicit runtime revision.');
  const discovery=discover(),info=discovery.info;if(!info.ready)fail('UNAVAILABLE',info.reason);if(args.revision!==info.revision)throw abort();
  const target=discovery.records.get(args.bodyId);if(!target){const refusal=info.unsupported.find(r=>r.bodyId===args.bodyId);fail(refusal?.code||'INVALID_OPERAND',refusal?.reason||'Select a current eligible native body.');}
  if(args.engineRevision!==target.build.revision)fail('ENGINE_REVISION_MISMATCH','Use the current whole-part backend without substitution.');
  // This detached admission value allocates no authored ID or native object.
  const producerFeatureId=target.model.featureId,preflight=captureOwnedShellFeature({version:args.version,unit:args.unit,engine:args.engine,engineRevision:args.engineRevision,featureId:producerFeatureId===1?2:1,target:args.bodyId,producerFeatureId,removedFaceIds:args.removedFaceIds,thickness:args.thickness,direction:args.direction});
  if(preflight.removedFaceIds.some(face=>!target.row.removedFaceIds.includes(face)))fail('UNRESOLVED_SELECTION','Use only currently advertised box faces of this body.');
  if(!target.row.budget.canAppend)fail(target.row.budget.reason==='INCOMPATIBLE_ENGINE_BUILD'?'ENGINE_REVISION_MISMATCH':target.row.budget.reason||'RESOURCE_LIMIT','The selected-owned evaluation cannot append another native result.');
  const project=ctx.projectService,craft=ctx.craftService,registry=ctx.cadRegistry,storage=ctx.storageService,manager=ctx.projectManager,generation=project.documentGeneration,documentSignal=project.documentSignal,history=craft.modifications$.value,storageRevision=storage.revision,epoch=craft.evaluationEpoch,scope:{epoch:number|null}={epoch:null};
  const services=()=>[ctx.projectService,ctx.storageService,ctx.craftService,ctx.cadRegistry,ctx.operationService,ctx.expressionService,ctx.projectManager,ctx.services.sketcher,ctx.wizardService,ctx.workbenchService,ctx.assemblyService],streams=()=>[ctx.craftService.modifications$,ctx.craftService.models$,ctx.craftService.pipelineFailure$,ctx.craftService.engineCleanupFailure$,ctx.expressionService.script$,ctx.expressionService.list$,ctx.expressionService.errors$,ctx.expressionService.table$,ctx.streams.sketcher.sketchingFace,ctx.wizardService.workingRequest$,ctx.workbenchService.currentWorkbench$,ctx.assemblyService.constraints$],capturedServices=services(),capturedStreams=streams(),versions=capturedStreams.map(s=>s.revision);
  const alive=()=>{try{return !isAborted(opts.signal)&&(!opts.valid||opts.valid()===true)&&ctx.projectService===project&&project.hasHostLifetime&&project.documentGeneration===generation&&project.documentSignal===documentSignal&&!isAborted(documentSignal)&&project.isDocumentCurrent(generation)&&ctx.craftService===craft&&ctx.cadRegistry===registry&&ctx.storageService===storage&&ctx.projectManager===manager&&manager.unit==='millimeter';}catch{return false;}};
  const current=()=>{if(!alive()||storage.revision!==storageRevision||craft.modifications$.value!==history||craft.evaluationEpoch!==(scope.epoch===null?epoch:scope.epoch)||services().some((s,i)=>s!==capturedServices[i])||streams().some((s,i)=>s!==capturedStreams[i]||s.revision!==versions[i])||registry.find(args.bodyId)!==target.model||target.model.ext!==target.ext||target.ext.workerGeometry!==target.tag||target.model.inspectKernelMetrics!==target.method||target.method.call(target.model)!==target.metrics||inspectWorkerSolidSelections(target.model)!==target.selections)throw abort();};
  let settled=false,committed=false,featureId:string|null=null,receipt:any=null;
  const stop=()=>{if(!settled&&scope.epoch!==null)cancelEpoch(scope.epoch);},signals=[...new Set([opts.signal,documentSignal].filter(Boolean))] as AbortSignal[];
  for(const signal of signals)listen(signal,stop);const timer=setInterval(()=>{if(!alive())stop();},100);
  try{
   current();featureId=project.counterGenerator.generateFeatureId();const intent=captureOwnedShellFeature({...preflight,featureId:Number(featureId)}),outputId=solidBodyId(intent.featureId);
   const preparation={candidateScope:scope,requireCurrent:current,requireCommittedCurrent(){if(!alive())throw abort(true);},async prepare(models:any[]){
    current();const matches=models.filter(m=>m.id===outputId);if(matches.length!==1||models.some(m=>m.id===args.bodyId))fail('ENGINE_FAILURE','The shell output and consumed source body are unavailable.');
    const metrics=measured(matches[0],intent.featureId,target.build),r=metrics.runtime;
    if(r.workerSha256!==undefined&&(typeof r.workerSha256!=='string'||!/^[a-f0-9]{64}$/.test(r.workerSha256)))fail('ENGINE_BINDING_MISMATCH','The published Worker runtime identity is unavailable.');
    const runtime=Object.freeze({mountEngine:r.mountEngine,representation:r.representation,jsSha256:r.jsSha256,wasmSha256:r.wasmSha256,...(r.workerSha256?{workerSha256:r.workerSha256}:{})});current();
    receipt=Object.freeze({featureId:intent.featureId,outputId,bodyId:outputId,sourceBodyId:args.bodyId,resultKind:'single-solid',engine:'occ',engineRevision:intent.engineRevision,runtime,unit:'millimeter',thickness:intent.thickness,direction:intent.direction,removedFaceIds:intent.removedFaceIds,persistence:'volatile-workspace'});return null;
   }};
   await new Promise<void>((resolve,reject)=>submit({type:OP,params:intent},resolve,reject,preparation));committed=true;
   if(!alive())throw abort(true);if(!receipt)fail('ENGINE_FAILURE','Shell publication did not return a receipt.');return receipt;
  }catch(error){if(committed&&!error?.committed)throw abort(true);if(!alive()&&!error?.committed)throw abort();throw error;}
  finally{settled=true;clearInterval(timer);for(const signal of signals)unlisten(signal,stop);if(featureId!==null)project.counterGenerator.releaseFeatureId(featureId);}
 }
 function inspectWorkerShellHistory(){
  const craft=ctx.craftService,project=ctx.projectService,manager=ctx.projectManager,unit=manager.unit,generation=project.documentGeneration,base=craft.inspectRectangleCreation(),journal=craft.inspectAuthoredEdits(),state=craft.modifications$.value;
  let reason=base.ready?null:base.reason||'Finish the current operation before editing shell history.';
  if(!reason&&(!project.hasHostLifetime||!project.isDocumentCurrent(generation)||unit!=='millimeter'))reason='A current host-bound millimeter workspace is required.';
  if(!reason&&typeof craft.authoredSolidShellOperation!=='function')reason='Numeric shell replay is unavailable in this build.';
  if(!Array.isArray(state.history)||state.history.length>256||Reflect.ownKeys(state.history).length!==state.history.length+1)fail('RESOURCE_LIMIT','Shell history exceeds its bound.');
  const features:any[]=[];
  for(let index=0;index<state.history.length;index++){
   const d=Object.getOwnPropertyDescriptor(state.history,String(index)),entry=d?.value,type=entry&&Object.getOwnPropertyDescriptor(entry,'type');
   if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||!type?.enumerable||!Object.prototype.hasOwnProperty.call(type,'value')||typeof type.value!=='string')fail('INVALID_REQUEST','Authored history must be dense data.');
   if(type.value===OP){const p=Object.getOwnPropertyDescriptor(entry,'params');if(!p?.enumerable||!Object.prototype.hasOwnProperty.call(p,'value'))fail('INVALID_REQUEST','Authored shell parameters must be data.');const captured=captureOwnedShellFeature(p.value);let unsupported=null;try{const build:any=requireCadEngineBuild(captured.engine,captured.engineRevision);if(build.shellVersion!==1)unsupported='ENGINE_CAPABILITY_UNAVAILABLE';}catch(error){unsupported=error.code||'ENGINE_REVISION_MISMATCH';}features.push(Object.freeze({index,...captured,canEdit:!reason&&!unsupported,reason:reason||unsupported}));}
  }
  const end=craft.inspectRectangleCreation(),endJournal=craft.inspectAuthoredEdits();
  if(ctx.craftService!==craft||ctx.projectService!==project||project.documentGeneration!==generation||ctx.projectManager!==manager||manager.unit!==unit||craft.modifications$.value!==state||end.revision!==base.revision||endJournal.revision!==journal.revision)throw abort();
  return Object.freeze({ready:!reason,reason:reason||null,revision:journal.revision,canUndo:journal.canUndo,canRedo:journal.canRedo,features:Object.freeze(features),scope:'numeric-worker-shell-thickness',typedBindings:'unsupported'});
 }
 async function editWorkerShell(input:any,rawOptions:any={}){
  const args=fields(input,['revision','index','featureId','thickness']),opts=options(rawOptions);
  if(!id(args.revision)||!Number.isSafeInteger(args.index)||args.index<0||args.index>255||!Number.isSafeInteger(args.featureId)||args.featureId<1||typeof args.thickness!=='number'||!Number.isFinite(args.thickness)||args.thickness<=0||args.thickness>1e6)fail('INVALID_REQUEST','Use a current shell identity and positive bounded numeric thickness.');
  const craft=ctx.craftService,project=ctx.projectService,generation=project.documentGeneration,manager=ctx.projectManager,history=craft.modifications$.value,info=inspectWorkerShellHistory();if(!info.ready)fail('UNAVAILABLE',info.reason);if(args.revision!==info.revision)fail('STALE_HISTORY','The authored shell revision is stale.');
  const feature=info.features.find(f=>f.index===args.index&&f.featureId===args.featureId);if(!feature)fail('INVALID_FEATURE','The authored shell feature is unavailable.');if(!feature.canEdit)fail(feature.reason||'UNAVAILABLE','The recorded feature backend does not support shell editing.');
  let caller=true;try{caller=!isAborted(opts.signal)&&(!opts.valid||opts.valid()===true);}catch{caller=false;}
  if(!caller||ctx.craftService!==craft||ctx.projectService!==project||project.documentGeneration!==generation||!project.hasHostLifetime||!project.isDocumentCurrent(generation)||ctx.projectManager!==manager||manager.unit!=='millimeter'||craft.modifications$.value!==history||craft.inspectAuthoredEdits().revision!==info.revision)throw abort();
  return craft.authoredSolidShellOperation(Object.freeze(args),Object.freeze(opts));
 }
 return Object.freeze({inspectWorkerShells,createWorkerShell,inspectWorkerShellHistory,editWorkerShell});
}
