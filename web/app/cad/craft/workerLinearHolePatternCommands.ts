import {assertHistoryControlAppendAllowed,historyControlAppendReason} from 'engine/solid/authoredHistoryState.mjs';
import {MWorkerSolid} from 'cad/model/mworkerSolid';
import {solidBodyId} from 'engine/solid/solidIntent.mjs';
import {inspectWorkerSolidPatternSeeds} from 'engine/solid/solidLedger.mjs';
import {requireCadEngineBuild} from 'engine/mount/engineCatalog.mjs';
import {genericHistoryBuild} from 'engine/mount/selectedProfileBuildSelection.mjs';
import {selectedProfileHistoryBudget} from 'engine/mount/selectedProfileBudget.mjs';
import {selectSolidContinuationBuild} from 'engine/solid/solidOperandRuntime.mjs';

import {captureOwnedLinearHolePatternIntent,linearHolePatternNativeCost} from 'engine/solid/ownedLinearHolePatternIntent.mjs';
import {MOpenFaceShell} from '../model/mopenFace';
import {sketchBoundaryFrame} from '../sketch/boundaryValidity';
import {sketchRevision} from './sketchRevision.mjs';
const AXIS='source-local-x-positive';
const capacity=(b:any,cost:number)=>b.supported===true&&b.compatible===true&&b.withinLimit===true&&Number.isSafeInteger(b.remainingNativeResults)&&b.remainingNativeResults>=cost;
const OP='WORKER_LINEAR_HOLE_PATTERN_V1';
const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
const abort=(committed=false)=>{const e=new DOMException(committed?'Accepted linear hole pattern was superseded.':'Linear hole pattern was cancelled or superseded.','AbortError');Object.defineProperty(e,'committed',{value:committed,enumerable:true});return e;};
function fields(value:any,keys:string[]){
 const proto=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
 if(!value||typeof value!=='object'||Array.isArray(value)||(proto!==null&&Object.getPrototypeOf(proto)!==null)||Reflect.ownKeys(value).length!==keys.length)fail('INVALID_REQUEST','Expected exact linear-hole-pattern data fields.');
 const out:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))fail('INVALID_REQUEST','Linear-hole-pattern fields must be data.');out[key]=d.value;}return out;
}
function options(value:any){
 if(!value||typeof value!=='object'||Array.isArray(value))fail('INVALID_REQUEST','Invalid linear-hole-pattern options.');
 const keys=Reflect.ownKeys(value);if(keys.some(k=>typeof k!=='string'||!['signal','valid'].includes(k)))fail('INVALID_REQUEST','Invalid linear-hole-pattern options.');
 const out=fields(value,keys as string[]);if(out.valid!==undefined&&typeof out.valid!=='function')fail('INVALID_REQUEST','Invalid lifetime guard.');
 if(out.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(out.signal);}catch{fail('INVALID_REQUEST','Invalid cancellation signal.');}return out;
}
const id=(v:any,max=256)=>typeof v==='string'&&v.length>0&&v.length<=max;
import {runtimeBuild,measured,sourceRecord,sourceCurrent} from './workerThroughHoleCommands';
// The shared craft service owns evaluation, native handles and publication.
export function createWorkerLinearHolePatternCommands(ctx:any,submit:any,cancelEpoch:(epoch:number)=>void){
 if(typeof submit!=='function'||typeof cancelEpoch!=='function')fail('INVALID_REQUEST','Shared craft publication and cancellation are required.');
 function discover(){
  const craft=ctx.craftService,registry=ctx.cadRegistry,project=ctx.projectService,storage=ctx.storageService,manager=ctx.projectManager,unit=manager.unit,info=craft.inspectWorkerSolids(),state=craft.modifications$.value,generation=project.documentGeneration,sketches=ctx.sketchStorageService,namespace=project.sketchStorageNamespace,sourceRevision=sketchRevision(storage,namespace);
  if(!id(info.revision)||!Array.isArray(info.bodies)||info.bodies.length>16384||!Array.isArray(info.outputs)||info.outputs.length>16384)fail('UNAVAILABLE','Current solid inspection is unavailable.');
  let reason=info.ready?null:info.reason||'Finish the current operation before creating linear hole patterns.';
  if(!reason)reason=historyControlAppendReason(ctx.craftService.modifications$.value.history,OP);
  if(!reason&&(!project.hasHostLifetime||!project.isDocumentCurrent(generation)))reason='A current host-bound workspace is required.';
  if(!reason&&unit!=='millimeter')reason='Linear hole patterns require a millimeter document.';
  if(!reason&&(ctx.expressionService.isTyped||ctx.expressionService.script$.value.trim()||Object.keys(ctx.expressionService.table$.value||{}).length))reason='Linear hole patterns currently support native local constants without project parameter bindings.';
  if(!reason)try{ctx.operationService.get(OP);}catch{reason='The linear-hole-pattern operation is unavailable in this build.';}
  const targets:any[]=[],unsupported:any[]=[],records=new Map<string,any>(),seen=new Set();
  for(const body of info.bodies){
   if(!id(body?.id,1024)||seen.has(body.id))fail('UNAVAILABLE','Current solid identities are unavailable.');seen.add(body.id);
   try{
    const model=registry.find(body.id);if(!(model instanceof MWorkerSolid)||model.id!==body.id||model.featureId!==body.featureId||model.ext.workerGeometry.engine!==body.engine||model.inspectKernelMetrics()!==body.metrics)fail('INVALID_OPERAND','Select a current native solid.');
    const build=runtimeBuild(body.metrics,body.engine);if(build.id!=='occ'||build.linearHolePatternVersion!==1||build.selectionPlanVersion!==2)fail('ENGINE_CAPABILITY_UNAVAILABLE','The recorded part backend does not support linear hole patterns.');
    measured(model,body.featureId,build);
    const witness=inspectWorkerSolidPatternSeeds(model);
    if(witness.status!=='available')throw Object.assign(Error('The current target has no authenticated centered-hole ancestry.'),{code:'UNSUPPORTED_SEED'});
    if(!Object.isFrozen(witness)||!Array.isArray(witness.seeds)||!Object.isFrozen(witness.seeds))fail('UNSUPPORTED_SEED','The immutable centered-hole witness is unavailable.');
    const origins=witness.seeds.map(seed=>({featureId:witness.sourceFeatureId,regionId:witness.sourceRegionId,seedFeatureId:seed.seedFeatureId})),historyBuild=genericHistoryBuild(state.history),outputBuild=selectSolidContinuationBuild(info.outputs,'occ',build.revision);
    if(historyBuild!==build||outputBuild!==build)fail('ENGINE_REVISION_MISMATCH','The whole authored part must retain one backend build.');
    const budget=selectedProfileHistoryBudget(state.history,build.revision);
    for(const origin of origins){try{
     const source=sourceRecord(ctx,state.history,origin,build);
     if(source.captured.faceId!==witness.sourceFaceId)fail('UNRESOLVED_SOURCE','The authenticated constructor differs from current source history.');
     const canCreate=!reason&&capacity(budget,2),row=Object.freeze({sourceProfile:'selected-rectangle',sourceQualification:'requires-worker-validation',bodyId:body.id,featureId:body.featureId,seedFeatureId:origin.seedFeatureId,sourceFeatureId:origin.featureId,sourceFaceId:witness.sourceFaceId,sourceRegionId:origin.regionId,engine:'occ',engineRevision:build.revision,budget,minimumNativeResultCost:2,canCreate,reason:reason||budget.reason||(!canCreate?'RESOURCE_LIMIT':null)});
     targets.push(row);records.set(body.id+'#'+origin.seedFeatureId,{row,model,ext:model.ext,tag:model.ext.workerGeometry,method:model.inspectKernelMetrics,metrics:body.metrics,witness,build,source});
    }catch(error){unsupported.push(Object.freeze({bodyId:body.id,sourceFeatureId:origin.featureId,engine:body.engine,code:error.code||'UNAVAILABLE',reason:String(error.message||error)}));}}

   }catch(error){unsupported.push(Object.freeze({bodyId:body.id,engine:body.engine,code:error.code||'UNAVAILABLE',reason:String(error.message||error)}));}
  }
  const end=craft.inspectWorkerSolids();
  if(ctx.craftService!==craft||ctx.cadRegistry!==registry||ctx.projectService!==project||ctx.storageService!==storage||ctx.projectManager!==manager||manager.unit!==unit||craft.modifications$.value!==state||ctx.sketchStorageService!==sketches||project.sketchStorageNamespace!==namespace||sketchRevision(storage,namespace)!==sourceRevision||project.documentGeneration!==generation||end.revision!==info.revision||[...records.values()].some(r=>registry.find(r.model.id)!==r.model||r.model.ext!==r.ext||r.ext.workerGeometry!==r.tag||r.model.inspectKernelMetrics!==r.method||r.method.call(r.model)!==r.metrics||inspectWorkerSolidPatternSeeds(r.model)!==r.witness||!sourceCurrent(ctx,r.source)))throw abort();
  return {info:Object.freeze({ready:!reason,reason:reason||null,revision:info.revision,unit:'millimeter',engine:'occ',sourceProfile:'selected-rectangle',sourceQualification:'requires-worker-validation',axis:AXIS,countIncludesSeed:true,unsupportedCounts:Object.freeze([1]),limits:Object.freeze({maxCount:17,maxSpacingMm:1e6,sourceCharacters:65536}),canCreate:!reason&&targets.some(t=>t.canCreate),targets:Object.freeze(targets),unsupported:Object.freeze(unsupported),scope:'numeric-authored-worker-linear-hole-pattern-v1'}),records};
 }
 function inspectWorkerLinearHolePatterns(){return discover().info;}
 async function createWorkerLinearHolePattern(input:any,rawOptions:any={}){
  assertHistoryControlAppendAllowed(ctx.craftService.modifications$.value.history,OP);
  const args=fields(input,['revision','version','unit','engine','engineRevision','bodyId','seedFeatureId','axis','count','spacing']),opts=options(rawOptions);
  if(!id(args.revision)||!id(args.bodyId,1024)||!Number.isSafeInteger(args.seedFeatureId)||args.seedFeatureId<1||args.version!==1||args.unit!=='millimeter'||args.engine!=='occ'||typeof args.engineRevision!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(args.engineRevision))fail('INVALID_REQUEST','Use a current inspected OCC body and explicit runtime revision.');
  const discovery=discover(),info=discovery.info;if(!info.ready)fail('UNAVAILABLE',info.reason);if(args.revision!==info.revision)throw abort();
  const target=discovery.records.get(args.bodyId+'#'+args.seedFeatureId);if(!target){const refusal=info.unsupported.find(r=>r.bodyId===args.bodyId&&(!r.seedFeatureId||r.seedFeatureId===args.seedFeatureId));fail(refusal?.code||'INVALID_OPERAND',refusal?.reason||'Select a current eligible native body.');}
  if(args.engineRevision!==target.build.revision)fail('ENGINE_REVISION_MISMATCH','Use the current whole-part backend without substitution.');
  // This detached admission value allocates no authored ID or native object.
  const producerFeatureId=target.model.featureId,seedFeatureId=args.seedFeatureId;
  const temporaryFeatureId=[1,2,3].find(n=>n!==producerFeatureId&&n!==seedFeatureId);
  const preflight=captureOwnedLinearHolePatternIntent({version:args.version,unit:args.unit,engine:args.engine,engineRevision:args.engineRevision,featureId:temporaryFeatureId,target:args.bodyId,producerFeatureId,seedFeatureId,axis:args.axis,count:args.count,spacing:args.spacing});
  const nativeResultCost=linearHolePatternNativeCost(preflight.count);
  if(!capacity(target.row.budget,nativeResultCost))fail(target.row.budget.reason==='INCOMPATIBLE_ENGINE_BUILD'?'ENGINE_REVISION_MISMATCH':target.row.budget.reason||'RESOURCE_LIMIT','The selected-owned evaluation cannot reserve the complete pattern cost.');
  const project=ctx.projectService,craft=ctx.craftService,registry=ctx.cadRegistry,storage=ctx.storageService,manager=ctx.projectManager,generation=project.documentGeneration,documentSignal=project.documentSignal,history=craft.modifications$.value,sketches=ctx.sketchStorageService,namespace=project.sketchStorageNamespace,sourceRevision=sketchRevision(storage,namespace),epoch=craft.evaluationEpoch,scope:{epoch:number|null}={epoch:null};
  const services=()=>[ctx.projectService,ctx.storageService,ctx.craftService,ctx.cadRegistry,ctx.operationService,ctx.expressionService,ctx.projectManager,ctx.sketchStorageService,ctx.services.sketcher,ctx.wizardService,ctx.workbenchService,ctx.assemblyService],streams=()=>[ctx.craftService.modifications$,ctx.craftService.models$,ctx.craftService.pipelineFailure$,ctx.craftService.engineCleanupFailure$,ctx.expressionService.script$,ctx.expressionService.list$,ctx.expressionService.errors$,ctx.expressionService.table$,ctx.streams.sketcher.sketchingFace,ctx.wizardService.workingRequest$,ctx.workbenchService.currentWorkbench$,ctx.assemblyService.constraints$],capturedServices=services(),capturedStreams=streams(),versions=capturedStreams.map(s=>s.revision);
  const alive=()=>{try{return !opts.signal?.aborted&&(!opts.valid||opts.valid()===true)&&ctx.projectService===project&&project.hasHostLifetime&&project.documentGeneration===generation&&project.documentSignal===documentSignal&&!documentSignal?.aborted&&project.isDocumentCurrent(generation)&&ctx.craftService===craft&&ctx.cadRegistry===registry&&ctx.storageService===storage&&ctx.sketchStorageService===sketches&&ctx.projectManager===manager&&manager.unit==='millimeter';}catch{return false;}};
  const current=()=>{if(!alive()||ctx.sketchStorageService!==sketches||project.sketchStorageNamespace!==namespace||sketchRevision(storage,namespace)!==sourceRevision||craft.modifications$.value!==history||craft.evaluationEpoch!==(scope.epoch===null?epoch:scope.epoch)||services().some((s,i)=>s!==capturedServices[i])||streams().some((s,i)=>s!==capturedStreams[i]||s.revision!==versions[i])||registry.find(args.bodyId)!==target.model||target.model.ext!==target.ext||target.ext.workerGeometry!==target.tag||target.model.inspectKernelMetrics!==target.method||target.method.call(target.model)!==target.metrics||inspectWorkerSolidPatternSeeds(target.model)!==target.witness||!sourceCurrent(ctx,target.source))throw abort();};
  let settled=false,committed=false,featureId:string|null=null,receipt:any=null;
  const stop=()=>{if(!settled&&scope.epoch!==null)cancelEpoch(scope.epoch);},signals=[...new Set([opts.signal,documentSignal].filter(Boolean))] as AbortSignal[];
  for(const signal of signals)signal.addEventListener('abort',stop,{once:true});const timer=setInterval(()=>{if(!alive())stop();},100);
  try{
   current();featureId=project.counterGenerator.generateFeatureId();const intent=captureOwnedLinearHolePatternIntent({...preflight,featureId:Number(featureId)}),outputId=solidBodyId(intent.featureId);
   const preparation={candidateScope:scope,requireCurrent:current,requireCommittedCurrent(){if(!alive())throw abort(true);},async prepare(models:any[]){
    current();const matches=models.filter(m=>m.id===outputId);if(matches.length!==1||models.some(m=>m.id===args.bodyId)||models.filter(m=>m instanceof MOpenFaceShell&&m.face.id===target.row.sourceFaceId).length!==1)fail('ENGINE_FAILURE','The linear-hole-pattern output and consumed target body are unavailable.');
    const plane=models.find(m=>m instanceof MOpenFaceShell&&m.face.id===target.row.sourceFaceId);if(JSON.stringify(sketchBoundaryFrame(plane.face))!==target.source.frameText)fail('ENGINE_FAILURE','The retained source frame changed during replay.');
    const metrics=measured(matches[0],intent.featureId,target.build),r=metrics.runtime;
    if(r.workerSha256!==undefined&&(typeof r.workerSha256!=='string'||!/^[a-f0-9]{64}$/.test(r.workerSha256)))fail('ENGINE_BINDING_MISMATCH','The published Worker runtime identity is unavailable.');
    const runtime=Object.freeze({mountEngine:r.mountEngine,representation:r.representation,jsSha256:r.jsSha256,wasmSha256:r.wasmSha256,...(r.workerSha256?{workerSha256:r.workerSha256}:{})});current();
    receipt=Object.freeze({featureId:intent.featureId,outputId,bodyId:outputId,sourceBodyId:args.bodyId,resultKind:'single-solid',engine:'occ',engineRevision:intent.engineRevision,runtime,unit:'millimeter',seedFeatureId:intent.seedFeatureId,axis:intent.axis,count:intent.count,spacing:intent.spacing,nativeResultCost,persistence:'volatile-workspace'});return null;
   }};
   await new Promise<void>((resolve,reject)=>submit({type:OP,params:intent},resolve,reject,preparation));committed=true;
   if(!alive())throw abort(true);if(!receipt)fail('ENGINE_FAILURE','Linear-hole-pattern publication did not return a receipt.');return receipt;
  }catch(error){if(committed&&!error?.committed)throw abort(true);if(!alive()&&!error?.committed)throw abort();throw error;}
  finally{settled=true;clearInterval(timer);for(const signal of signals)signal.removeEventListener('abort',stop);if(featureId!==null)project.counterGenerator.releaseFeatureId(featureId);}
 }
 function inspectWorkerLinearHolePatternHistory(){
  const craft=ctx.craftService,project=ctx.projectService,manager=ctx.projectManager,unit=manager.unit,generation=project.documentGeneration,base=craft.inspectRectangleCreation(),journal=craft.inspectAuthoredEdits(),state=craft.modifications$.value;
  let reason=base.ready?null:base.reason||'Finish the current operation before editing linear-hole-pattern history.';
  if(!reason&&(!project.hasHostLifetime||!project.isDocumentCurrent(generation)||unit!=='millimeter'))reason='A current host-bound millimeter workspace is required.';
  if(!reason&&(ctx.expressionService.isTyped||ctx.expressionService.script$.value.trim()||Object.keys(ctx.expressionService.table$.value||{}).length))reason='Linear-hole-pattern numeric edits do not support project parameter bindings.';
  if(!reason&&typeof craft.authoredLinearHolePatternOperation!=='function')reason='Numeric linear-hole-pattern replay is unavailable in this build.';
  if(!Array.isArray(state.history)||state.history.length>256||Reflect.ownKeys(state.history).length!==state.history.length+1)fail('RESOURCE_LIMIT','Linear-hole-pattern history exceeds its bound.');
  const features:any[]=[],outputs=craft.inspectWorkerSolids();
  for(let index=0;index<state.history.length;index++){
   const d=Object.getOwnPropertyDescriptor(state.history,String(index)),entry=d?.value,type=entry&&Object.getOwnPropertyDescriptor(entry,'type');
   if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||!type?.enumerable||!Object.prototype.hasOwnProperty.call(type,'value')||typeof type.value!=='string')fail('INVALID_REQUEST','Authored history must be dense data.');
   if(type.value===OP){const p=Object.getOwnPropertyDescriptor(entry,'params');if(!p?.enumerable||!Object.prototype.hasOwnProperty.call(p,'value'))fail('INVALID_REQUEST','Authored linear-hole-pattern parameters must be data.');const captured=captureOwnedLinearHolePatternIntent(p.value);linearHolePatternNativeCost(captured.count);let unsupported=null;try{const build:any=requireCadEngineBuild(captured.engine,captured.engineRevision);if(build.linearHolePatternVersion!==1||build.selectionPlanVersion!==2)unsupported='ENGINE_CAPABILITY_UNAVAILABLE';else if(genericHistoryBuild(state.history)!==build||selectSolidContinuationBuild(outputs.outputs,'occ',build.revision)!==build)unsupported='ENGINE_REVISION_MISMATCH';}catch(error){unsupported=error.code||'ENGINE_REVISION_MISMATCH';}features.push(Object.freeze({index,...captured,canEdit:!reason&&!unsupported,reason:reason||unsupported}));}
  }
  const end=craft.inspectRectangleCreation(),endJournal=craft.inspectAuthoredEdits();
  if(ctx.craftService!==craft||ctx.projectService!==project||project.documentGeneration!==generation||ctx.projectManager!==manager||manager.unit!==unit||craft.modifications$.value!==state||end.revision!==base.revision||endJournal.revision!==journal.revision||craft.inspectWorkerSolids().revision!==outputs.revision)throw abort();
  return Object.freeze({ready:!reason,reason:reason||null,revision:journal.revision,canUndo:journal.canUndo,canRedo:journal.canRedo,features:Object.freeze(features),scope:'numeric-worker-linear-hole-pattern-dimensions',typedBindings:'unsupported'});
 }
 async function editWorkerLinearHolePattern(input:any,rawOptions:any={}){
  const args=fields(input,['revision','index','featureId','count','spacing']),opts=options(rawOptions);
  if(!id(args.revision)||!Number.isSafeInteger(args.index)||args.index<0||args.index>255||!Number.isSafeInteger(args.featureId)||args.featureId<1||typeof args.spacing!=='number'||!Number.isFinite(args.spacing)||args.spacing<=0||args.spacing>1e6)fail('INVALID_REQUEST','Use a current pattern identity and bounded numeric count/spacing.');
  linearHolePatternNativeCost(args.count);
  const craft=ctx.craftService,project=ctx.projectService,generation=project.documentGeneration,manager=ctx.projectManager,history=craft.modifications$.value,info=inspectWorkerLinearHolePatternHistory();if(!info.ready)fail('UNAVAILABLE',info.reason);if(args.revision!==info.revision)fail('STALE_HISTORY','The authored linear-hole-pattern revision is stale.');
  const feature=info.features.find(f=>f.index===args.index&&f.featureId===args.featureId);if(!feature)fail('INVALID_FEATURE','The authored linear-hole-pattern feature is unavailable.');if(!feature.canEdit)fail(feature.reason||'UNAVAILABLE','The recorded feature backend does not support linear-hole-pattern editing.');
  const entry=history.history[args.index],captured=captureOwnedLinearHolePatternIntent(entry.params);
  const next=captureOwnedLinearHolePatternIntent({...captured,count:args.count,spacing:args.spacing});
  const proposedHistory=history.history.map((entry:any,index:number)=>index===args.index?{type:OP,params:next}:entry),budget=selectedProfileHistoryBudget(proposedHistory,feature.engineRevision);
  if(!capacity(budget,0))fail(budget.reason==='INCOMPATIBLE_ENGINE_BUILD'?'ENGINE_REVISION_MISMATCH':budget.reason||'RESOURCE_LIMIT','The full edited history exceeds the selected-owned native budget.');
  let caller=true;try{caller=!opts.signal?.aborted&&(!opts.valid||opts.valid()===true);}catch{caller=false;}
  if(!caller||ctx.craftService!==craft||ctx.projectService!==project||project.documentGeneration!==generation||!project.hasHostLifetime||!project.isDocumentCurrent(generation)||ctx.projectManager!==manager||manager.unit!=='millimeter'||craft.modifications$.value!==history||craft.inspectAuthoredEdits().revision!==info.revision)throw abort();
  return craft.authoredLinearHolePatternOperation(Object.freeze(args),Object.freeze(opts));
 }
 return Object.freeze({inspectWorkerLinearHolePatterns,createWorkerLinearHolePattern,inspectWorkerLinearHolePatternHistory,editWorkerLinearHolePattern});
}
