import {MWorkerSolid} from 'cad/model/mworkerSolid';
import {captureSolidEdgeTreatment,solidBodyId} from 'engine/solid/solidIntent.mjs';
import {inspectWorkerSolidSelections} from 'engine/solid/solidLedger.mjs';
import {requireCadEngineBuild} from 'engine/mount/engineCatalog.mjs';
import {genericHistoryBuild} from 'engine/mount/selectedProfileBuildSelection.mjs';
import {selectedProfileHistoryBudget} from 'engine/mount/selectedProfileBudget.mjs';
import {selectSolidContinuationBuild} from 'engine/solid/solidOperandRuntime.mjs';

const OP='WORKER_SOLID_EDGE_TREATMENT_V1';
const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
const abort=(committed=false)=>{const e=new DOMException(committed?'Accepted edge treatment was superseded.':'Edge treatment was cancelled or superseded.','AbortError');Object.defineProperty(e,'committed',{value:committed,enumerable:true});return e;};
function fields(value:any,keys:string[]){
 const proto=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
 if(!value||typeof value!=='object'||Array.isArray(value)||(proto!==null&&Object.getPrototypeOf(proto)!==null)||Reflect.ownKeys(value).length!==keys.length)fail('INVALID_REQUEST','Expected exact edge-treatment data fields.');
 const out:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))fail('INVALID_REQUEST','Edge-treatment fields must be data.');out[key]=d.value;}return out;
}
function options(value:any){
 if(!value||typeof value!=='object'||Array.isArray(value))fail('INVALID_REQUEST','Invalid edge-treatment options.');
 const keys=Reflect.ownKeys(value);if(keys.some(k=>typeof k!=='string'||!['signal','valid'].includes(k)))fail('INVALID_REQUEST','Invalid edge-treatment options.');
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
 if(!(model instanceof MWorkerSolid)||model.featureId!==featureId||model.id!==solidBodyId(featureId)||model.ext?.workerGeometry?.engine!=='occ')fail('ENGINE_FAILURE','The checked native edge-treatment output is unavailable.');
 const m=model.inspectKernelMetrics();
 if(!m||!Object.isFrozen(m)||m.runtime!==model.ext.workerGeometry.runtime||m.resultKind!=='single-solid'||m.solidCount!==1||m.nativeValidity?.valid!==true||typeof m.nativeVolume!=='number'||!Number.isFinite(m.nativeVolume)||m.nativeVolume<=0||!m.nativeBounds||!['min','max'].every(k=>vectorData(m.nativeBounds[k]))||m.nativeBounds.min.some((v:number,i:number)=>v>m.nativeBounds.max[i])||runtimeBuild(m,'occ')!==build)fail('ENGINE_FAILURE','One measured valid native solid in the recorded runtime is required.');
 return m;
}
function advertisedEdges(selection:any,featureId:number,build:any){
 const unavailable=():never=>fail('UNRESOLVED_SELECTION','Current authored edge selections are unavailable for this producer.');
 const data=(value:any,key:string)=>{const d=value&&typeof value==='object'?Object.getOwnPropertyDescriptor(value,key):null;if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))unavailable();return d.value;};
 if(!selection||!Object.isFrozen(selection)||data(selection,'status')!=='available')unavailable();
 const plan=data(selection,'plan'),expectedVersion=build.selectionPlanVersion??1;
 if(!plan||!Object.isFrozen(plan)||![1,2].includes(expectedVersion)||data(plan,'version')!==expectedVersion||data(plan,'featureId')!==featureId||data(plan,'scope')!=='authored-source')unavailable();
 const origins=new Set<number>();
 if(expectedVersion===1){if(!id(data(plan,'regionId'),8192))unavailable();}
 else{
  // Common lineage has several actual construction origins, never a made-up
  // top-level region for the current Boolean/treatment producer.
  if(Object.prototype.hasOwnProperty.call(plan,'regionId'))unavailable();
  const contexts=data(plan,'sourceContexts'),source=data(plan,'source');
  if(!['prism-construction-history','kernel-operation-history'].includes(source)||!Array.isArray(contexts)||!Object.isFrozen(contexts)||contexts.length<1||contexts.length>32||Reflect.ownKeys(contexts).length!==contexts.length+1)unavailable();
  for(let i=0;i<contexts.length;i++){
   const c=data(contexts,String(i));if(!c||!Object.isFrozen(c)||Reflect.ownKeys(c).length!==3)unavailable();
   const origin=data(c,'featureId');if(data(c,'kind')!=='sketch-profile'||!Number.isSafeInteger(origin)||origin<1||origins.has(origin)||!id(data(c,'regionId'),8192))unavailable();origins.add(origin);
  }
  if(source==='prism-construction-history'&&(origins.size!==1||!origins.has(featureId)))unavailable();
 }
 const edges=data(plan,'edges');if(!Array.isArray(edges)||edges.length>512||Reflect.ownKeys(edges).length!==edges.length+1||expectedVersion===2&&!Object.isFrozen(edges))unavailable();
 const ids:string[]=[];for(let i=0;i<edges.length;i++){
  const row=data(edges,String(i)),edgeId=data(row,'id');if(!id(edgeId,16384))unavailable();
  if(expectedVersion===2&&(!Object.isFrozen(row)||!origins.has(data(row,'originFeatureId'))))unavailable();ids.push(edgeId);
 }
 if(!ids.length||new Set(ids).size!==ids.length)fail('UNRESOLVED_SELECTION','Distinct current authored edges are required.');return Object.freeze(ids);
}

// The shared craft service owns evaluation, native handles and publication.
export function createWorkerEdgeTreatmentCommands(ctx:any,submit:any,cancelEpoch:(epoch:number)=>void){
 if(typeof submit!=='function'||typeof cancelEpoch!=='function')fail('INVALID_REQUEST','Shared craft publication and cancellation are required.');
 function discover(){
  const craft=ctx.craftService,registry=ctx.cadRegistry,project=ctx.projectService,storage=ctx.storageService,manager=ctx.projectManager,unit=manager.unit,info=craft.inspectWorkerSolids(),state=craft.modifications$.value,generation=project.documentGeneration,storageRevision=storage.revision;
  if(!id(info.revision)||!Array.isArray(info.bodies)||info.bodies.length>16384||!Array.isArray(info.outputs)||info.outputs.length>16384)fail('UNAVAILABLE','Current solid inspection is unavailable.');
  let reason=info.ready?null:info.reason||'Finish the current operation before treating edges.';
  if(!reason&&(!project.hasHostLifetime||!project.isDocumentCurrent(generation)))reason='A current host-bound workspace is required.';
  if(!reason&&unit!=='millimeter')reason='Edge treatments require a millimeter document.';
  if(!reason)try{ctx.operationService.get(OP);}catch{reason='The edge-treatment operation is unavailable in this build.';}
  const targets:any[]=[],unsupported:any[]=[],records=new Map<string,any>(),seen=new Set();
  for(const body of info.bodies){
   if(!id(body?.id,1024)||seen.has(body.id))fail('UNAVAILABLE','Current solid identities are unavailable.');seen.add(body.id);
   try{
    const model=registry.find(body.id);if(!(model instanceof MWorkerSolid)||model.id!==body.id||model.featureId!==body.featureId||model.ext.workerGeometry.engine!==body.engine||model.inspectKernelMetrics()!==body.metrics)fail('INVALID_OPERAND','Select a current native solid.');
    const build=runtimeBuild(body.metrics,body.engine);if(build.id!=='occ'||build.edgeTreatmentVersion!==1)fail('ENGINE_CAPABILITY_UNAVAILABLE','The recorded part backend does not support edge treatments.');
    measured(model,body.featureId,build);if(inspectWorkerSolidSelections(model)!==body.selections)fail('UNRESOLVED_SELECTION','The authored selection snapshot is no longer current.');
    const edgeIds=advertisedEdges(body.selections,body.featureId,build),historyBuild=genericHistoryBuild(state.history),outputBuild=selectSolidContinuationBuild(info.outputs,'occ',build.revision);
    if(historyBuild!==build||outputBuild!==build)fail('ENGINE_REVISION_MISMATCH','The whole authored part must retain one backend build.');
    const budget=selectedProfileHistoryBudget(state.history,build.revision),row=Object.freeze({bodyId:body.id,featureId:body.featureId,engine:'occ',engineRevision:build.revision,selections:body.selections,edgeIds,budget,canCreate:!reason&&budget.canAppend,reason:reason||budget.reason||(!budget.canAppend?'RESOURCE_LIMIT':null)});
    targets.push(row);records.set(body.id,{row,model,ext:model.ext,tag:model.ext.workerGeometry,method:model.inspectKernelMetrics,metrics:body.metrics,selections:body.selections,build});
   }catch(error){unsupported.push(Object.freeze({bodyId:body.id,engine:body.engine,code:error.code||'UNAVAILABLE',reason:String(error.message||error)}));}
  }
  const end=craft.inspectWorkerSolids();
  if(ctx.craftService!==craft||ctx.cadRegistry!==registry||ctx.projectService!==project||ctx.storageService!==storage||ctx.projectManager!==manager||manager.unit!==unit||craft.modifications$.value!==state||storage.revision!==storageRevision||project.documentGeneration!==generation||end.revision!==info.revision||[...records.values()].some(r=>registry.find(r.model.id)!==r.model||r.model.ext!==r.ext||r.ext.workerGeometry!==r.tag||r.model.inspectKernelMetrics!==r.method||r.method.call(r.model)!==r.metrics||inspectWorkerSolidSelections(r.model)!==r.selections))throw abort();
  return {info:Object.freeze({ready:!reason,reason:reason||null,revision:info.revision,unit:'millimeter',engine:'occ',kinds:Object.freeze(['fillet','chamfer-equal']),limits:Object.freeze({selectedEdges:16,maxSizeMm:1e6}),canCreate:!reason&&targets.some(t=>t.canCreate),targets:Object.freeze(targets),unsupported:Object.freeze(unsupported),scope:'numeric-authored-worker-edge-treatment-v1'}),records};
 }
 function inspectWorkerEdgeTreatments(){return discover().info;}
 async function createWorkerEdgeTreatment(input:any,rawOptions:any={}){
  const args=fields(input,['revision','version','unit','engine','engineRevision','bodyId','kind','edgeIds','size']),opts=options(rawOptions);
  if(!id(args.revision)||!id(args.bodyId,1024)||args.version!==1||args.unit!=='millimeter'||args.engine!=='occ'||typeof args.engineRevision!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(args.engineRevision))fail('INVALID_REQUEST','Use a current inspected OCC body and explicit runtime revision.');
  const discovery=discover(),info=discovery.info;if(!info.ready)fail('UNAVAILABLE',info.reason);if(args.revision!==info.revision)throw abort();
  const target=discovery.records.get(args.bodyId);if(!target){const refusal=info.unsupported.find(r=>r.bodyId===args.bodyId);fail(refusal?.code||'INVALID_OPERAND',refusal?.reason||'Select a current eligible native body.');}
  if(args.engineRevision!==target.build.revision)fail('ENGINE_REVISION_MISMATCH','Use the current whole-part backend without substitution.');
  // This detached admission value allocates no authored ID or native object.
  const producerFeatureId=target.model.featureId,preflight=captureSolidEdgeTreatment({version:args.version,unit:args.unit,engine:args.engine,engineRevision:args.engineRevision,featureId:producerFeatureId===1?2:1,target:args.bodyId,producerFeatureId,kind:args.kind,edgeIds:args.edgeIds,size:args.size});
  if(preflight.edgeIds.some(edge=>!target.row.edgeIds.includes(edge)))fail('UNRESOLVED_SELECTION','Use only currently advertised edges of this body.');
  if(!target.row.budget.canAppend)fail(target.row.budget.reason==='INCOMPATIBLE_ENGINE_BUILD'?'ENGINE_REVISION_MISMATCH':target.row.budget.reason||'RESOURCE_LIMIT','The selected-owned evaluation cannot append another native result.');
  const project=ctx.projectService,craft=ctx.craftService,registry=ctx.cadRegistry,storage=ctx.storageService,manager=ctx.projectManager,generation=project.documentGeneration,documentSignal=project.documentSignal,history=craft.modifications$.value,storageRevision=storage.revision,epoch=craft.evaluationEpoch,scope:{epoch:number|null}={epoch:null};
  const services=()=>[ctx.projectService,ctx.storageService,ctx.craftService,ctx.cadRegistry,ctx.operationService,ctx.expressionService,ctx.projectManager,ctx.services.sketcher,ctx.wizardService,ctx.workbenchService,ctx.assemblyService],streams=()=>[ctx.craftService.modifications$,ctx.craftService.models$,ctx.craftService.pipelineFailure$,ctx.craftService.engineCleanupFailure$,ctx.expressionService.script$,ctx.expressionService.list$,ctx.expressionService.errors$,ctx.expressionService.table$,ctx.streams.sketcher.sketchingFace,ctx.wizardService.workingRequest$,ctx.workbenchService.currentWorkbench$,ctx.assemblyService.constraints$],capturedServices=services(),capturedStreams=streams(),versions=capturedStreams.map(s=>s.revision);
  const alive=()=>{try{return !opts.signal?.aborted&&(!opts.valid||opts.valid()===true)&&ctx.projectService===project&&project.hasHostLifetime&&project.documentGeneration===generation&&project.documentSignal===documentSignal&&!documentSignal?.aborted&&project.isDocumentCurrent(generation)&&ctx.craftService===craft&&ctx.cadRegistry===registry&&ctx.storageService===storage&&ctx.projectManager===manager&&manager.unit==='millimeter';}catch{return false;}};
  const current=()=>{if(!alive()||storage.revision!==storageRevision||craft.modifications$.value!==history||craft.evaluationEpoch!==(scope.epoch===null?epoch:scope.epoch)||services().some((s,i)=>s!==capturedServices[i])||streams().some((s,i)=>s!==capturedStreams[i]||s.revision!==versions[i])||registry.find(args.bodyId)!==target.model||target.model.ext!==target.ext||target.ext.workerGeometry!==target.tag||target.model.inspectKernelMetrics!==target.method||target.method.call(target.model)!==target.metrics||inspectWorkerSolidSelections(target.model)!==target.selections)throw abort();};
  let settled=false,committed=false,featureId:string|null=null,receipt:any=null;
  const stop=()=>{if(!settled&&scope.epoch!==null)cancelEpoch(scope.epoch);},signals=[...new Set([opts.signal,documentSignal].filter(Boolean))] as AbortSignal[];
  for(const signal of signals)signal.addEventListener('abort',stop,{once:true});const timer=setInterval(()=>{if(!alive())stop();},100);
  try{
   current();featureId=project.counterGenerator.generateFeatureId();const intent=captureSolidEdgeTreatment({...preflight,featureId:Number(featureId)}),outputId=solidBodyId(intent.featureId);
   const preparation={candidateScope:scope,requireCurrent:current,requireCommittedCurrent(){if(!alive())throw abort(true);},async prepare(models:any[]){
    current();const matches=models.filter(m=>m.id===outputId);if(matches.length!==1||models.some(m=>m.id===args.bodyId))fail('ENGINE_FAILURE','The treated output and consumed source body are unavailable.');
    const metrics=measured(matches[0],intent.featureId,target.build),r=metrics.runtime;
    if(r.workerSha256!==undefined&&(typeof r.workerSha256!=='string'||!/^[a-f0-9]{64}$/.test(r.workerSha256)))fail('ENGINE_BINDING_MISMATCH','The published Worker runtime identity is unavailable.');
    const runtime=Object.freeze({mountEngine:r.mountEngine,representation:r.representation,jsSha256:r.jsSha256,wasmSha256:r.wasmSha256,...(r.workerSha256?{workerSha256:r.workerSha256}:{})});current();
    receipt=Object.freeze({featureId:intent.featureId,outputId,bodyId:outputId,sourceBodyId:args.bodyId,resultKind:'single-solid',engine:'occ',engineRevision:intent.engineRevision,runtime,unit:'millimeter',kind:intent.kind,size:intent.size,edgeIds:intent.edgeIds,persistence:'volatile-workspace'});return null;
   }};
   await new Promise<void>((resolve,reject)=>submit({type:OP,params:intent},resolve,reject,preparation));committed=true;
   if(!alive())throw abort(true);if(!receipt)fail('ENGINE_FAILURE','Edge-treatment publication did not return a receipt.');return receipt;
  }catch(error){if(committed&&!error?.committed)throw abort(true);if(!alive()&&!error?.committed)throw abort();throw error;}
  finally{settled=true;clearInterval(timer);for(const signal of signals)signal.removeEventListener('abort',stop);if(featureId!==null)project.counterGenerator.releaseFeatureId(featureId);}
 }
 function inspectWorkerEdgeTreatmentHistory(){
  const craft=ctx.craftService,project=ctx.projectService,manager=ctx.projectManager,unit=manager.unit,generation=project.documentGeneration,base=craft.inspectRectangleCreation(),journal=craft.inspectAuthoredEdits(),state=craft.modifications$.value;
  let reason=base.ready?null:base.reason||'Finish the current operation before editing edge-treatment history.';
  if(!reason&&(!project.hasHostLifetime||!project.isDocumentCurrent(generation)||unit!=='millimeter'))reason='A current host-bound millimeter workspace is required.';
  if(!reason&&typeof craft.authoredSolidEdgeTreatmentOperation!=='function')reason='Numeric edge-treatment replay is unavailable in this build.';
  if(!Array.isArray(state.history)||state.history.length>256||Reflect.ownKeys(state.history).length!==state.history.length+1)fail('RESOURCE_LIMIT','Edge-treatment history exceeds its bound.');
  const features:any[]=[];
  for(let index=0;index<state.history.length;index++){
   const d=Object.getOwnPropertyDescriptor(state.history,String(index)),entry=d?.value,type=entry&&Object.getOwnPropertyDescriptor(entry,'type');
   if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||!type?.enumerable||!Object.prototype.hasOwnProperty.call(type,'value')||typeof type.value!=='string')fail('INVALID_REQUEST','Authored history must be dense data.');
   if(type.value===OP){const p=Object.getOwnPropertyDescriptor(entry,'params');if(!p?.enumerable||!Object.prototype.hasOwnProperty.call(p,'value'))fail('INVALID_REQUEST','Authored edge parameters must be data.');const captured=captureSolidEdgeTreatment(p.value);let unsupported=null;try{const build:any=requireCadEngineBuild(captured.engine,captured.engineRevision);if(build.edgeTreatmentVersion!==1)unsupported='ENGINE_CAPABILITY_UNAVAILABLE';}catch(error){unsupported=error.code||'ENGINE_REVISION_MISMATCH';}features.push(Object.freeze({index,...captured,canEdit:!reason&&!unsupported,reason:reason||unsupported}));}
  }
  const end=craft.inspectRectangleCreation(),endJournal=craft.inspectAuthoredEdits();
  if(ctx.craftService!==craft||ctx.projectService!==project||project.documentGeneration!==generation||ctx.projectManager!==manager||manager.unit!==unit||craft.modifications$.value!==state||end.revision!==base.revision||endJournal.revision!==journal.revision)throw abort();
  return Object.freeze({ready:!reason,reason:reason||null,revision:journal.revision,canUndo:journal.canUndo,canRedo:journal.canRedo,features:Object.freeze(features),scope:'numeric-worker-edge-treatment-size',typedBindings:'unsupported'});
 }
 async function editWorkerEdgeTreatment(input:any,rawOptions:any={}){
  const args=fields(input,['revision','index','featureId','size']),opts=options(rawOptions);
  if(!id(args.revision)||!Number.isSafeInteger(args.index)||args.index<0||args.index>255||!Number.isSafeInteger(args.featureId)||args.featureId<1||typeof args.size!=='number'||!Number.isFinite(args.size)||args.size<=0||args.size>1e6)fail('INVALID_REQUEST','Use a current edge-treatment identity and positive bounded numeric size.');
  const craft=ctx.craftService,project=ctx.projectService,generation=project.documentGeneration,manager=ctx.projectManager,history=craft.modifications$.value,info=inspectWorkerEdgeTreatmentHistory();if(!info.ready)fail('UNAVAILABLE',info.reason);if(args.revision!==info.revision)fail('STALE_HISTORY','The authored edge-treatment revision is stale.');
  const feature=info.features.find(f=>f.index===args.index&&f.featureId===args.featureId);if(!feature)fail('INVALID_FEATURE','The authored edge-treatment feature is unavailable.');if(!feature.canEdit)fail(feature.reason||'UNAVAILABLE','The recorded feature backend does not support edge-treatment editing.');
  let caller=true;try{caller=!opts.signal?.aborted&&(!opts.valid||opts.valid()===true);}catch{caller=false;}
  if(!caller||ctx.craftService!==craft||ctx.projectService!==project||project.documentGeneration!==generation||!project.hasHostLifetime||!project.isDocumentCurrent(generation)||ctx.projectManager!==manager||manager.unit!=='millimeter'||craft.modifications$.value!==history||craft.inspectAuthoredEdits().revision!==info.revision)throw abort();
  return craft.authoredSolidEdgeTreatmentOperation(Object.freeze(args),Object.freeze(opts));
 }
 return Object.freeze({inspectWorkerEdgeTreatments,createWorkerEdgeTreatment,inspectWorkerEdgeTreatmentHistory,editWorkerEdgeTreatment});
}
