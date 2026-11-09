import {featureSuppressed,historyControlAppendReason,assertHistoryControlAppendAllowed} from 'engine/solid/authoredHistoryState.mjs';
import {captureAuthoredCountersinkIntent,captureAuthoredCountersinkDimensions,materializeAuthoredCountersinkDimensions,assertCountersinkBindingsPreserved} from 'engine/solid/authoredCountersinkIntent.mjs';
import {physicalReadUnsupportedReason} from '../parameters/modernPhysicalBindings.mjs';
import {MWorkerSolid} from 'cad/model/mworkerSolid';
import {solidBodyId} from 'engine/solid/solidIntent.mjs';
import {inspectWorkerSolidSelections} from 'engine/solid/solidLedger.mjs';
import {requireCadEngineBuild} from 'engine/mount/engineCatalog.mjs';
import {genericHistoryBuild} from 'engine/mount/selectedProfileBuildSelection.mjs';
import {selectedProfileHistoryBudget} from 'engine/mount/selectedProfileBudget.mjs';
import {selectSolidContinuationBuild} from 'engine/solid/solidOperandRuntime.mjs';

import {captureSelectedProfileDepthParameters} from './authoredEditJournal.mjs';
import {MOpenFaceShell} from '../model/mopenFace';
import {sketchBoundaryFrame} from '../sketch/boundaryValidity';
import {getSketchBoundaries} from '../sketch/sketchBoundaries';
import {sketchRevision} from './sketchRevision.mjs';
const ABORTED=Function.call.bind(Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get),LISTEN=Function.call.bind(EventTarget.prototype.addEventListener),UNLISTEN=Function.call.bind(EventTarget.prototype.removeEventListener);
const KINDS=Object.freeze(['centered-countersink-conical']);
const COST=Object.freeze({'centered-countersink-conical':4});
const OP='WORKER_CENTERED_COUNTERSINK_V1';
const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
const abort=(committed=false)=>{const e=new DOMException(committed?'Accepted countersink hole was superseded.':'Countersink hole was cancelled or superseded.','AbortError');Object.defineProperty(e,'committed',{value:committed,enumerable:true});return e;};
function fields(value:any,keys:string[]){
 const proto=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
 if(!value||typeof value!=='object'||Array.isArray(value)||(proto!==null&&Object.getPrototypeOf(proto)!==null)||Reflect.ownKeys(value).length!==keys.length)fail('INVALID_REQUEST','Expected exact countersink data fields.');
 const out:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))fail('INVALID_REQUEST','Countersink-hole fields must be data.');out[key]=d.value;}return out;
}
function options(value:any){
 if(!value||typeof value!=='object'||Array.isArray(value))fail('INVALID_REQUEST','Invalid countersink options.');
 const keys=Reflect.ownKeys(value);if(keys.some(k=>typeof k!=='string'||!['signal','valid'].includes(k)))fail('INVALID_REQUEST','Invalid countersink options.');
 const out=fields(value,keys as string[]);if(out.valid!==undefined&&typeof out.valid!=='function')fail('INVALID_REQUEST','Invalid lifetime guard.');
 if(out.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(out.signal);}catch{fail('INVALID_REQUEST','Invalid cancellation signal.');}return out;
}
const id=(v:any,max=256)=>typeof v==='string'&&v.length>0&&v.length<=max;
const vectorData=(v:any)=>Array.isArray(v)&&v.length===3&&Reflect.ownKeys(v).length===4&&[0,1,2].every(i=>{const d=Object.getOwnPropertyDescriptor(v,String(i));return d?.enumerable&&Object.prototype.hasOwnProperty.call(d,'value')&&typeof d.value==='number'&&Number.isFinite(d.value);});
export function runtimeBuild(metrics:any,engine:string){
 const r=metrics?.runtime;if(!r||!Object.isFrozen(r)||!['jsSha256','wasmSha256'].every(k=>typeof r[k]==='string'&&/^[a-f0-9]{64}$/.test(r[k])))fail('ENGINE_BINDING_MISMATCH','The current native runtime is unavailable.');
 const build:any=requireCadEngineBuild(engine,'sha256:'+r.jsSha256+':'+r.wasmSha256);
 if(r.mountEngine!==build.mountEngine||r.representation!==build.representation)fail('ENGINE_BINDING_MISMATCH','The current native runtime differs from its registered build.');return build;
}
export function measured(model:any,featureId:number,build:any){
 if(!(model instanceof MWorkerSolid)||model.featureId!==featureId||model.id!==solidBodyId(featureId)||model.ext?.workerGeometry?.engine!=='occ')fail('ENGINE_FAILURE','The checked native countersink output is unavailable.');
 const m=model.inspectKernelMetrics();
 if(!m||!Object.isFrozen(m)||m.runtime!==model.ext.workerGeometry.runtime||m.resultKind!=='single-solid'||m.solidCount!==1||m.nativeValidity?.valid!==true||typeof m.nativeVolume!=='number'||!Number.isFinite(m.nativeVolume)||m.nativeVolume<=0||!m.nativeBounds||!['min','max'].every(k=>vectorData(m.nativeBounds[k]))||m.nativeBounds.min.some((v:number,i:number)=>v>m.nativeBounds.max[i])||runtimeBuild(m,'occ')!==build)fail('ENGINE_FAILURE','One measured valid native solid in the recorded runtime is required.');
 return m;
}
function sourceOrigins(selection:any,featureId:number){
 const unavailable=():never=>fail('UNRESOLVED_SOURCE','Current immutable source contexts are unavailable for this producer.');
 const data=(v:any,k:string)=>{const d=v&&typeof v==='object'?Object.getOwnPropertyDescriptor(v,k):null;if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))unavailable();return d.value;};
 if(!selection||!Object.isFrozen(selection)||data(selection,'status')!=='available')unavailable();
 const plan=data(selection,'plan');
 if(!plan||!Object.isFrozen(plan)||data(plan,'version')!==2||data(plan,'featureId')!==featureId||data(plan,'scope')!=='authored-source'||Object.prototype.hasOwnProperty.call(plan,'regionId'))unavailable();
 const source=data(plan,'source'),contexts=data(plan,'sourceContexts');
 for(const kind of ['edges','faces']){const rows=data(plan,kind);if(!Array.isArray(rows)||!Object.isFrozen(rows))unavailable();if(rows.some(row=>Object.prototype.hasOwnProperty.call(row,'boundaryRef')||Object.prototype.hasOwnProperty.call(row,'incidentBoundaryRefs')))fail('UNSUPPORTED_SOURCE','Derived arrangement spans are not the canonical authored rectangle hole source.');}
 if(!['prism-construction-history','kernel-operation-history'].includes(source)||!Array.isArray(contexts)||!Object.isFrozen(contexts)||contexts.length<1||contexts.length>32||Reflect.ownKeys(contexts).length!==contexts.length+1)unavailable();
 const seen=new Set(),origins:any[]=[];
 for(let i=0;i<contexts.length;i++){
  const c=data(contexts,String(i));if(!c||!Object.isFrozen(c)||Reflect.ownKeys(c).length!==3)unavailable();
  const origin=data(c,'featureId'),regionId=data(c,'regionId');
  if(data(c,'kind')!=='sketch-profile'||!Number.isSafeInteger(origin)||origin<1||seen.has(origin)||!id(regionId,8192))unavailable();
  seen.add(origin);origins.push(Object.freeze({featureId:origin,regionId}));
 }
 if(source==='prism-construction-history'&&(origins.length!==1||origins[0].featureId!==featureId))unavailable();
 return origins;
}
const capacity=(b:any,cost:number)=>b.supported===true&&b.compatible===true&&b.withinLimit===true&&Number.isSafeInteger(b.remainingNativeResults)&&b.remainingNativeResults>=cost;
export function sourceRecord(ctx:any,history:any[],origin:any,build:any){
 if(!Array.isArray(history)||history.length>256||Reflect.ownKeys(history).length!==history.length+1)fail('INVALID_SOURCE','Expected bounded dense authored source history.');
 const matches:any[]=[];
 for(let i=0;i<history.length;i++){
  const d=Object.getOwnPropertyDescriptor(history,String(i)),entry=d?.value,t=entry&&Object.getOwnPropertyDescriptor(entry,'type');
  if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||!t?.enumerable||!Object.prototype.hasOwnProperty.call(t,'value'))fail('INVALID_SOURCE','Source history must be dense data.');
  if(t.value!=='WORKER_SELECTED_PROFILE_EXTRUDE_V2')continue;
  const params=Object.getOwnPropertyDescriptor(entry,'params');if(!params?.enumerable||!Object.prototype.hasOwnProperty.call(params,'value'))fail('INVALID_SOURCE','Source profile parameters must be data.');
  let captured:any;try{captured=captureSelectedProfileDepthParameters(params.value);}catch{fail('INVALID_SOURCE','Source selected-profile intent is unsupported.');}
  if(captured.featureId===origin.featureId)matches.push({entry,params:params.value,captured});
 }
 if(matches.length!==1)fail('UNRESOLVED_SOURCE','Exactly one authored selected-profile source is required.');
 const r=matches[0],p=r.captured;
 if(p.regionId!==origin.regionId||p.engineRevision!==build.revision)fail('UNRESOLVED_SOURCE','The source origin differs from authored history.');
 const face=ctx.cadRegistry.findFace(p.faceId);
 if(!(face?.root instanceof MOpenFaceShell)||!face.isPlaneBased||face.id!==p.faceId||face.defaultSketchId!==p.faceId||!ctx.craftService.models$.value.includes(face.root))fail('UNSUPPORTED_FACE','A current retained source sketch plane is required.');
 const source=ctx.sketchStorageService.getSketchData(p.faceId);
 if(typeof source!=='string'||source.length>65536||new TextEncoder().encode(source).byteLength>65536)fail('UNSUPPORTED_SOURCE','A saved bounded native source sketch is required.');
 const frameText=JSON.stringify(sketchBoundaryFrame(face)),boundary=getSketchBoundaries(face);
 if(['lines','arcs','circles','nurbses'].some(k=>!Array.isArray(boundary[k])||boundary[k].length))fail('UNSUPPORTED_FACE','Referenced boundary geometry is unsupported.');
 return {...r,face,root:face.root,source,frameText,parameterText:JSON.stringify(p)};
}
export function sourceCurrent(ctx:any,r:any){
 try{return ctx.cadRegistry.findFace(r.captured.faceId)===r.face&&ctx.craftService.models$.value.includes(r.face.root)&&r.face.root===r.root&&r.root instanceof MOpenFaceShell&&r.face.isPlaneBased&&r.face.defaultSketchId===r.captured.faceId&&ctx.sketchStorageService.getSketchData(r.captured.faceId)===r.source&&JSON.stringify(sketchBoundaryFrame(r.face))===r.frameText&&Object.getOwnPropertyDescriptor(r.entry,'type')?.enumerable===true&&Object.getOwnPropertyDescriptor(r.entry,'type')?.value==='WORKER_SELECTED_PROFILE_EXTRUDE_V2'&&Object.getOwnPropertyDescriptor(r.entry,'params')?.enumerable===true&&Object.getOwnPropertyDescriptor(r.entry,'params')?.value===r.params&&JSON.stringify(captureSelectedProfileDepthParameters(r.params))===r.parameterText;}catch{return false;}
}

// The shared craft service owns evaluation, native handles and publication.
export function createWorkerCountersinkCommands(ctx:any,submit:any,cancelEpoch:(epoch:number)=>void){
 if(typeof submit!=='function'||typeof cancelEpoch!=='function')fail('INVALID_REQUEST','Shared craft publication and cancellation are required.');
 let failedCleanup:any=null;
 const wasCommitted=(error:any)=>{try{return error!==null&&(typeof error==='object'||typeof error==='function')&&Object.getOwnPropertyDescriptor(error,'committed')?.value===true;}catch{return false;}};
 const clean=()=>{if(failedCleanup)throw failedCleanup;};
 function discover(){
  clean();
  const craft=ctx.craftService,registry=ctx.cadRegistry,project=ctx.projectService,storage=ctx.storageService,manager=ctx.projectManager,unit=manager.unit,info=craft.inspectWorkerSolids(),state=craft.modifications$.value,generation=project.documentGeneration,sketches=ctx.sketchStorageService,namespace=project.sketchStorageNamespace,sourceRevision=sketchRevision(storage,namespace);
  if(!id(info.revision)||!Array.isArray(info.bodies)||info.bodies.length>32||!Array.isArray(info.outputs)||info.outputs.length>32)fail('UNAVAILABLE','Current solid inspection is unavailable.');
  let reason=info.ready?null:info.reason||'Finish the current operation before creating countersink holes.';
  if(!reason&&(!project.hasHostLifetime||!project.isDocumentCurrent(generation)))reason='A current host-bound workspace is required.';
  if(!reason&&unit!=='millimeter')reason='Countersink holes require a millimeter document.';
  if(!reason)reason=physicalReadUnsupportedReason(ctx.expressionService,state.history);
  if(!reason)reason=historyControlAppendReason(state.history,OP);
  if(!reason)try{ctx.operationService.get(OP);}catch{reason='The countersink operation is unavailable in this build.';}
  const targets:any[]=[],unsupported:any[]=[],records=new Map<string,any>(),seen=new Set();
  for(const body of info.bodies){
   if(!id(body?.id,1024)||seen.has(body.id))fail('UNAVAILABLE','Current solid identities are unavailable.');seen.add(body.id);
   try{
    const model=registry.find(body.id);if(!(model instanceof MWorkerSolid)||model.id!==body.id||model.featureId!==body.featureId||model.ext.workerGeometry.engine!==body.engine||model.inspectKernelMetrics()!==body.metrics)fail('INVALID_OPERAND','Select a current native solid.');
    const build=runtimeBuild(body.metrics,body.engine);if(build.id!=='occ'||build.countersinkVersion!==1||build.selectionPlanVersion!==2)fail('ENGINE_CAPABILITY_UNAVAILABLE','The recorded part backend does not support countersink holes.');
    measured(model,body.featureId,build);if(inspectWorkerSolidSelections(model)!==body.selections)fail('UNRESOLVED_SELECTION','The authored selection snapshot is no longer current.');
    const origins=sourceOrigins(body.selections,body.featureId),historyBuild=genericHistoryBuild(state.history),outputBuild=selectSolidContinuationBuild(info.outputs,'occ',build.revision);
    if(historyBuild!==build||outputBuild!==build)fail('ENGINE_REVISION_MISMATCH','The whole authored part must retain one backend build.');
    const budget=selectedProfileHistoryBudget(state.history,build.revision);
    for(const origin of origins){try{
     if(origin.featureId!==body.featureId)fail('COUNTERSINK_UNSUPPORTED_TARGET','Select the genuine unconsumed rectangular constructor.');
     const entryRows=body.selections.plan.faces.filter(r=>r.role==='last-cap'&&r.originFeatureId===origin.featureId);if(entryRows.length!==1)fail('COUNTERSINK_ENTRY_UNRESOLVED','Select the unique actual constructor last cap.');
     const source=sourceRecord(ctx,state.history,origin,build),creation:any={};
     for(const kind of KINDS){const canCreate=!reason&&capacity(budget,COST[kind]);creation[kind]=Object.freeze({nativeResultCost:COST[kind],canCreate,reason:reason||budget.reason||(!canCreate?'RESOURCE_LIMIT':null)});}
     const row=Object.freeze({sourceProfile:'selected-rectangle',sourceQualification:'requires-worker-validation',bodyId:body.id,featureId:body.featureId,sourceFeatureId:origin.featureId,sourceFaceId:source.captured.faceId,sourceRegionId:origin.regionId,entryFaceId:entryRows[0].id,engine:'occ',engineRevision:build.revision,budget,creation:Object.freeze(creation),canCreate:KINDS.some(k=>creation[k].canCreate)});
     targets.push(row);records.set(body.id+'#'+origin.featureId,{row,model,ext:model.ext,tag:model.ext.workerGeometry,method:model.inspectKernelMetrics,metrics:body.metrics,selections:body.selections,build,source});
    }catch(error){unsupported.push(Object.freeze({bodyId:body.id,sourceFeatureId:origin.featureId,engine:body.engine,code:error.code||'UNAVAILABLE',reason:String(error.message||error)}));}}

   }catch(error){unsupported.push(Object.freeze({bodyId:body.id,engine:body.engine,code:error.code||'UNAVAILABLE',reason:String(error.message||error)}));}
  }
  const end=craft.inspectWorkerSolids();
  if(ctx.craftService!==craft||ctx.cadRegistry!==registry||ctx.projectService!==project||ctx.storageService!==storage||ctx.projectManager!==manager||manager.unit!==unit||craft.modifications$.value!==state||ctx.sketchStorageService!==sketches||project.sketchStorageNamespace!==namespace||sketchRevision(storage,namespace)!==sourceRevision||project.documentGeneration!==generation||end.revision!==info.revision||[...records.values()].some(r=>registry.find(r.model.id)!==r.model||r.model.ext!==r.ext||r.ext.workerGeometry!==r.tag||r.model.inspectKernelMetrics!==r.method||r.method.call(r.model)!==r.metrics||inspectWorkerSolidSelections(r.model)!==r.selections||!sourceCurrent(ctx,r.source)))throw abort();
  if(new TextEncoder().encode(JSON.stringify({targets,unsupported})).byteLength>65536)fail('RESOURCE_LIMIT','Countersink discovery exceeds64KiB metadata.');
  return {info:Object.freeze({ready:!reason,reason:reason||null,revision:info.revision,unit:'millimeter',engine:'occ',sourceProfile:'selected-rectangle',sourceQualification:'requires-worker-validation',kinds:KINDS,nativeResultCost:COST,limits:Object.freeze({maxDimensionMm:1e6,sourceCharacters:65536}),canCreate:!reason&&targets.some(t=>t.canCreate),targets:Object.freeze(targets),unsupported:Object.freeze(unsupported),scope:'authored-worker-countersink-v1'}),records};
 }
 function inspectWorkerCountersinks(){return discover().info;}
 async function createWorkerCountersink(input:any,rawOptions:any={}){
  const args=fields(input,['revision','bodyId','sourceFeatureId','sourceFaceId','sourceRegionId','entryFaceId','throughDiameter','entryDiameter','includedAngleRadians']),opts=options(rawOptions);
  if(!id(args.revision)||!id(args.bodyId,1024)||!id(args.sourceFaceId)||!id(args.sourceRegionId,8192)||!id(args.entryFaceId,16384)||!Number.isSafeInteger(args.sourceFeatureId)||args.sourceFeatureId<1)fail('INVALID_REQUEST','Select current discovered countersink source/body.');
  const lengths=captureAuthoredCountersinkDimensions({throughDiameter:args.throughDiameter,entryDiameter:args.entryDiameter,includedAngleRadians:args.includedAngleRadians});
  const discovery=discover(),info=discovery.info;if(!info.ready)fail('UNAVAILABLE',info.reason);if(args.revision!==info.revision)fail('STALE_HISTORY','The inspected countersink source/history revision changed.');
  const target=discovery.records.get(args.bodyId+'#'+args.sourceFeatureId);if(!target){
   if(info.unsupported.some(row=>row.bodyId===args.bodyId&&row.code==='ENGINE_CAPABILITY_UNAVAILABLE'))fail('UNSUPPORTED_COUNTERSINK_BUILD','The recorded current body backend does not support countersinks.');
   fail('COUNTERSINK_UNSUPPORTED_TARGET','Select the current genuine constructor.');
  }
  if(['sourceFaceId','sourceRegionId','entryFaceId'].some(k=>args[k]!==target.row[k]))fail('COUNTERSINK_ENTRY_UNRESOLVED','The selected source/entry differs from the current actual constructor.');
  const producerFeatureId=target.model.featureId,sourceFeatureId=args.sourceFeatureId;
  // Scalar admission only; actual conical depth/entry belongs to the Worker.
  materializeAuthoredCountersinkDimensions(lengths,ctx.expressionService);
  if(!capacity(target.row.budget,4))fail('RESOURCE_LIMIT','The complete four-result countersink operation exceeds its budget.');
  const project=ctx.projectService,craft=ctx.craftService,registry=ctx.cadRegistry,storage=ctx.storageService,manager=ctx.projectManager,generation=project.documentGeneration,documentSignal=project.documentSignal,history=craft.modifications$.value,sketches=ctx.sketchStorageService,namespace=project.sketchStorageNamespace,sourceRevision=sketchRevision(storage,namespace),epoch=craft.evaluationEpoch,scope:{epoch:number|null}={epoch:null};
  const services=()=>[ctx.projectService,ctx.storageService,ctx.craftService,ctx.cadRegistry,ctx.operationService,ctx.expressionService,ctx.projectManager,ctx.sketchStorageService,ctx.services.sketcher,ctx.wizardService,ctx.workbenchService,ctx.assemblyService],streams=()=>[ctx.craftService.modifications$,ctx.craftService.models$,ctx.craftService.pipelineFailure$,ctx.craftService.engineCleanupFailure$,ctx.expressionService.script$,ctx.expressionService.list$,ctx.expressionService.errors$,ctx.expressionService.table$,ctx.streams.sketcher.sketchingFace,ctx.wizardService.workingRequest$,ctx.workbenchService.currentWorkbench$,ctx.assemblyService.constraints$],capturedServices=services(),capturedStreams=streams(),versions=capturedStreams.map(s=>s.revision);
  const alive=()=>{try{return (!opts.signal||!ABORTED(opts.signal))&&(!opts.valid||opts.valid()===true)&&ctx.projectService===project&&project.hasHostLifetime&&project.documentGeneration===generation&&project.documentSignal===documentSignal&&(!documentSignal||!ABORTED(documentSignal))&&project.isDocumentCurrent(generation)&&ctx.craftService===craft&&ctx.cadRegistry===registry&&ctx.storageService===storage&&ctx.sketchStorageService===sketches&&ctx.projectManager===manager&&manager.unit==='millimeter';}catch{return false;}};
  const current=()=>{if(!alive()||ctx.sketchStorageService!==sketches||project.sketchStorageNamespace!==namespace||sketchRevision(storage,namespace)!==sourceRevision||craft.modifications$.value!==history||craft.evaluationEpoch!==(scope.epoch===null?epoch:scope.epoch)||services().some((s,i)=>s!==capturedServices[i])||streams().some((s,i)=>s!==capturedStreams[i]||s.revision!==versions[i])||registry.find(args.bodyId)!==target.model||target.model.ext!==target.ext||target.ext.workerGeometry!==target.tag||target.model.inspectKernelMetrics!==target.method||target.method.call(target.model)!==target.metrics||inspectWorkerSolidSelections(target.model)!==target.selections||!sourceCurrent(ctx,target.source))throw abort();};
  const allocator=project.counterGenerator,generate=allocator?.generateFeatureId,release=allocator?.releaseFeatureId;
  if(typeof generate!=='function'||typeof release!=='function')fail('INVALID_WORKSPACE','The actual feature allocator is unavailable.');
  let settled=false,committed=false,featureId:string|null=null,receipt:any=null,failure:{cause:any}|null=null,timer:any=null;
  const stop=()=>{if(!settled&&scope.epoch!==null)cancelEpoch(scope.epoch);},signals=[...new Set([opts.signal,documentSignal].filter(Boolean))] as AbortSignal[];
  const attached:AbortSignal[]=[];
  try{
   for(const signal of signals){attached.push(signal);LISTEN(signal,'abort',stop,{once:true});}
   timer=setInterval(()=>{if(!alive())stop();},100);
   current();if(project.counterGenerator!==allocator||allocator.generateFeatureId!==generate||allocator.releaseFeatureId!==release)throw abort();assertHistoryControlAppendAllowed(history.history,OP);featureId=generate.call(allocator);const intent=captureAuthoredCountersinkIntent({version:1,unit:'millimeter',engine:'occ',engineRevision:target.build.revision,featureId:Number(featureId),target:args.bodyId,producerFeatureId,sourceFeatureId,sourceFaceId:args.sourceFaceId,sourceRegionId:args.sourceRegionId,entryFaceId:args.entryFaceId,kind:'centered-countersink-conical',...lengths}),outputId=solidBodyId(intent.featureId);
   const preparation={candidateScope:scope,requireCurrent:current,requireCommittedCurrent(){if(!alive())throw abort(true);},async prepare(models:any[]){
    current();const matches=models.filter(m=>m.id===outputId);if(matches.length!==1||models.some(m=>m.id===args.bodyId)||models.filter(m=>m instanceof MOpenFaceShell&&m.face.id===target.row.sourceFaceId).length!==1)fail('ENGINE_FAILURE','The countersink output and consumed target body are unavailable.');
    const plane=models.find(m=>m instanceof MOpenFaceShell&&m.face.id===target.row.sourceFaceId);if(JSON.stringify(sketchBoundaryFrame(plane.face))!==target.source.frameText)fail('ENGINE_FAILURE','The retained source frame changed during replay.');
    const metrics=measured(matches[0],intent.featureId,target.build),r=metrics.runtime;
    if(r.workerSha256!==undefined&&(typeof r.workerSha256!=='string'||!/^[a-f0-9]{64}$/.test(r.workerSha256)))fail('ENGINE_BINDING_MISMATCH','The published Worker runtime identity is unavailable.');
    const runtime=Object.freeze({mountEngine:r.mountEngine,representation:r.representation,jsSha256:r.jsSha256,wasmSha256:r.wasmSha256,...(r.workerSha256?{workerSha256:r.workerSha256}:{})});current();
    receipt=Object.freeze({featureId:intent.featureId,outputId,bodyId:outputId,sourceBodyId:args.bodyId,resultKind:'single-solid',engine:'occ',engineRevision:intent.engineRevision,runtime,unit:'millimeter',kind:intent.kind,throughDiameter:intent.throughDiameter,entryDiameter:intent.entryDiameter,includedAngleRadians:intent.includedAngleRadians,entryFaceId:intent.entryFaceId,sourceFeatureId:intent.sourceFeatureId,sourceFaceId:intent.sourceFaceId,sourceRegionId:intent.sourceRegionId,persistence:'volatile-workspace'});return null;
   }};
   await new Promise<void>((resolve,reject)=>submit({type:OP,params:intent},()=>{committed=true;resolve();},reject,preparation));
   if(!alive())throw abort(true);if(!receipt)fail('ENGINE_FAILURE','Countersink-hole publication did not return a receipt.');return receipt;
  }catch(error){
   let cause=error;
   if(committed&&!wasCommitted(error))cause=Object.assign(Error('Countersink publication committed but its receipt/lifetime is unavailable.'),{code:'COUNTERSINK_PUBLICATION_FAILED',committed:true,cause:error,...(receipt?{receipt}:{})});
   else if(!alive()&&!wasCommitted(error))cause=Object.assign(abort(),{cause:error});
   failure={cause};throw cause;
  }finally{
   settled=true;const cleanup:any[]=[];
   if(timer!==null)try{clearInterval(timer);}catch(cause){cleanup.push(cause);}
   for(const signal of attached)try{UNLISTEN(signal,'abort',stop);}catch(cause){cleanup.push(cause);}
   if(featureId!==null)try{release.call(allocator,featureId);}catch(cause){cleanup.push(cause);}
   if(cleanup.length){const error=Object.assign(Error('Countersink command cleanup is unconfirmed; reload this service.'),{code:'WORKER_CLEANUP_FAILED',committed:committed||wasCommitted(failure?.cause),cause:cleanup[0],cleanupErrors:Object.freeze(cleanup),...(failure?{operationError:failure.cause}:{}),...((committed||wasCommitted(failure?.cause))&&receipt?{receipt}:{})});if(!failedCleanup)failedCleanup=error;throw error;}
  }
 }
 function inspectWorkerCountersinkHistory(){
  clean();
  const craft=ctx.craftService,project=ctx.projectService,manager=ctx.projectManager,unit=manager.unit,generation=project.documentGeneration,base=craft.inspectRectangleCreation(),journal=craft.inspectAuthoredEdits(),state=craft.modifications$.value;
  let reason=base.ready?null:base.reason||'Finish the current operation before editing countersink history.';
  if(!reason&&(!project.hasHostLifetime||!project.isDocumentCurrent(generation)||unit!=='millimeter'))reason='A current host-bound millimeter workspace is required.';
  if(!reason)reason=physicalReadUnsupportedReason(ctx.expressionService,state.history);
  if(!reason&&typeof craft.authoredCountersinkOperation!=='function')reason='Numeric countersink replay is unavailable in this build.';
  if(!Array.isArray(state.history)||state.history.length>256||Reflect.ownKeys(state.history).length!==state.history.length+1)fail('RESOURCE_LIMIT','Countersink-hole history exceeds its bound.');
  const features:any[]=[],outputs=craft.inspectWorkerSolids();
  for(let index=0;index<state.history.length;index++){
   const d=Object.getOwnPropertyDescriptor(state.history,String(index)),entry=d?.value,type=entry&&Object.getOwnPropertyDescriptor(entry,'type');
   if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||!type?.enumerable||!Object.prototype.hasOwnProperty.call(type,'value')||typeof type.value!=='string')fail('INVALID_REQUEST','Authored history must be dense data.');
   if(type.value===OP){const p=Object.getOwnPropertyDescriptor(entry,'params');if(!p?.enumerable||!Object.prototype.hasOwnProperty.call(p,'value'))fail('INVALID_REQUEST','Authored countersink parameters must be data.');const captured=captureAuthoredCountersinkIntent(p.value);let unsupported=null;try{const build:any=requireCadEngineBuild(captured.engine,captured.engineRevision);if(build.countersinkVersion!==1||build.selectionPlanVersion!==2)unsupported='ENGINE_CAPABILITY_UNAVAILABLE';else if(genericHistoryBuild(state.history)!==build||selectSolidContinuationBuild(outputs.outputs,'occ',build.revision)!==build)unsupported='ENGINE_REVISION_MISMATCH';}catch(error){unsupported=error.code||'ENGINE_REVISION_MISMATCH';}features.push(Object.freeze({index,...captured,state:featureSuppressed(entry)?'suppressed':'active',canEdit:!featureSuppressed(entry)&&!reason&&!unsupported,reason:featureSuppressed(entry)?'FEATURE_SUPPRESSED':reason||unsupported||null}));}
  }
  const end=craft.inspectRectangleCreation(),endJournal=craft.inspectAuthoredEdits();
  if(ctx.craftService!==craft||ctx.projectService!==project||project.documentGeneration!==generation||ctx.projectManager!==manager||manager.unit!==unit||craft.modifications$.value!==state||end.revision!==base.revision||endJournal.revision!==journal.revision||craft.inspectWorkerSolids().revision!==outputs.revision)throw abort();
  if(new TextEncoder().encode(JSON.stringify(features)).byteLength>65536)fail('RESOURCE_LIMIT','Countersink feature inspection exceeds64KiB metadata.');
  return Object.freeze({ready:!reason,reason:reason||null,revision:journal.revision,canUndo:journal.canUndo,canRedo:journal.canRedo,features:Object.freeze(features),scope:'authored-worker-countersink-dimensions',typedBindings:'physical-source-and-retained-direct-edits'});
 }
 async function editWorkerCountersink(input:any,rawOptions:any={}){
  const args=fields(input,['revision','index','featureId','throughDiameter','entryDiameter','includedAngleRadians']),opts=options(rawOptions);
  if(!id(args.revision)||!Number.isSafeInteger(args.index)||args.index<0||args.index>255||!Number.isSafeInteger(args.featureId)||args.featureId<1)fail('INVALID_REQUEST','Use the actual current countersink index/feature/revision.');
  const dimensions=captureAuthoredCountersinkDimensions({throughDiameter:args.throughDiameter,entryDiameter:args.entryDiameter,includedAngleRadians:args.includedAngleRadians}),info=inspectWorkerCountersinkHistory();
  if(args.revision!==info.revision)fail('STALE_HISTORY','The inspected countersink source/history revision changed.');if(!info.ready)fail('UNAVAILABLE',info.reason);
  const row=info.features.find(f=>f.index===args.index&&f.featureId===args.featureId);if(!row||!row.canEdit)fail(row?.reason==='BOUND_DIMENSION'?'BOUND_DIMENSION':'INVALID_OPERAND',row?.reason||'Select the current countersink feature.');
  assertCountersinkBindingsPreserved({throughDiameter:row.throughDiameter,entryDiameter:row.entryDiameter,includedAngleRadians:row.includedAngleRadians},dimensions);
  materializeAuthoredCountersinkDimensions(dimensions,ctx.expressionService);
  return ctx.craftService.authoredCountersinkOperation(Object.freeze(args),Object.freeze(opts));
 }

 return Object.freeze({inspectWorkerCountersinks,createWorkerCountersink,inspectWorkerCountersinkHistory,editWorkerCountersink});
}
