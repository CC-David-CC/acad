import {isSourcePlaneType,isRegisteredSourcePlane} from './sourcePlanePolicy';
import {MWorkerSolid} from '../model/mworkerSolid';
import {MOpenFaceShell} from '../model/mopenFace';
import {ReadSketch} from '../sketch/sketchReader';
import {sketchBoundaryFrame} from '../sketch/boundaryValidity';
import {capturePipelineHistory,assertPipelineHistoryCurrent} from './capturePipelineHistory.mjs';
import {captureWorkerStepExportRequest} from './workerStepExportRequest.mjs';
import {sketchRevision} from './sketchRevision.mjs';
import {AUTHORED_SOLID_KINDS} from 'engine/solid/authoredSolidKinds.mjs';
import {genericHistoryBuild} from 'engine/mount/selectedProfileBuildSelection.mjs';
import {selectedProfileHistoryBudget} from 'engine/mount/selectedProfileBudget.mjs';
import {physicalReadUnsupportedReason} from '../parameters/modernPhysicalBindings.mjs';

const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
const abort=()=>new DOMException('STEP export was cancelled or superseded.','AbortError');
const IDENTITY=[1,0,0,0,0,1,0,0,0,0,1,0];
const MATRIX_KEYS=['mxx','mxy','mxz','tx','myx','myy','myz','ty','mzx','mzy','mzz','tz'];
const CSYS_KEYS=['origin','x','y','z'];
const REMOVE_ABORT_LISTENER=Object.getPrototypeOf(AbortSignal.prototype).removeEventListener;
function options(value:any={}){
 const p=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
 if(!value||typeof value!=='object'||Array.isArray(value)||(p!==null&&Object.getPrototypeOf(p)!==null))fail('INVALID_REQUEST','Invalid STEP lifetime options.');
 const out:any={};for(const key of Reflect.ownKeys(value)){
  if(typeof key!=='string'||!['signal','valid'].includes(key))fail('INVALID_REQUEST','Invalid STEP lifetime options.');
  const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))fail('INVALID_REQUEST','STEP options must be own data.');out[key]=d.value;
 }
 if(out.valid!==undefined&&typeof out.valid!=='function')fail('INVALID_REQUEST','Invalid STEP lifetime guard.');
 if(out.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(out.signal);}catch{fail('INVALID_REQUEST','Invalid STEP cancellation signal.');}
 return out;
}
function capturePlacement(model:any){
 const location=model.location$,matrix=location.value,csys=model.csys,axes=CSYS_KEYS.map(k=>[csys[k].x,csys[k].y,csys[k].z]);
 if(MATRIX_KEYS.some((key,i)=>!Object.is(matrix[key],IDENTITY[i]))||axes.some((v,i)=>v.some((n,j)=>!Object.is(n,i===0?0:i-1===j?1:0))))fail('UNSUPPORTED_TARGET','STEP currently requires identity model placement; source-plane placement remains part of the actual BRep.');
 return {location,matrix,csys,axes};
}
function positiveMeasuredSolid(metrics:any,revision:string){
 return !!metrics&&Object.isFrozen(metrics)&&['single-solid','multi-solid'].includes(metrics.resultKind)&&Number.isSafeInteger(metrics.solidCount)&&metrics.solidCount>0&&metrics.resultKind===(metrics.solidCount===1?'single-solid':'multi-solid')&&metrics.nativeValidity?.valid===true&&Number.isFinite(metrics.nativeVolume)&&metrics.nativeVolume>0&&'sha256:'+metrics.runtime?.jsSha256+':'+metrics.runtime?.wasmSha256===revision;
}

// Private constructor dependencies supply only the registered staged build
// policy and existing exclusive read evaluator. Public callers supply neither.
export function createWorkerStepExportCommands(ctx:any,evaluateReadOnly:(input:any)=>Promise<any>,buildPolicy:any){
 if(typeof evaluateReadOnly!=='function'||typeof buildPolicy?.requireBuild!=='function'||typeof buildPolicy?.listBuilds!=='function')fail('INVALID_REQUEST','Shared STEP replay and staged build policy are required.');
 function inspectWorkerStepExports(){
  const craft=ctx.craftService,manager=ctx.projectManager,project=ctx.projectService,info=craft.inspectWorkerSolids(),history=craft.modifications$.value,e=ctx.expressionService;
  if(!Array.isArray(history.history)||history.history.length>256)fail('RESOURCE_LIMIT','The part exceeds the STEP history discovery bound.');
  const build=genericHistoryBuild(history.history);
  const available=buildPolicy.listBuilds();
  const parameterReason=physicalReadUnsupportedReason(e,history.history);
  let reason=!info.ready?info.reason||'The current part is unavailable.':!project.hasHostLifetime?'A current host-bound document is required.':manager.isRestoring?'Finish opening the document.':manager.unit!=='millimeter'?'Canonical millimeter geometry is required.':history.pointer!==history.history.length-1?'Select the complete authored tip.':parameterReason?parameterReason:ctx.services.sketcher.inPlaceEditor.inEditMode||ctx.wizardService.workingRequest$.value?'Finish the active operation.':ctx.assemblyService.constraints$.value.length?'Assembly placement is unsupported.':!available.includes(build)?'STEP export is not available for this part’s modeling engine.':null;
  if(!Array.isArray(info.bodies)||info.bodies.length>16384)fail('RESOURCE_LIMIT','STEP output discovery exceeds its bound.');
  const bodies=info.bodies.map((row:any)=>{
   let error=reason;const model=ctx.cadRegistry.find(row.id),metrics=model?.inspectKernelMetrics?.();
   if(!error)try{if(!(model instanceof MWorkerSolid)||model.featureId!==row.featureId||row.engine!=='occ'||row.metrics!==metrics||!positiveMeasuredSolid(metrics,build.revision))fail('UNSUPPORTED_TARGET','Select a current valid positive native solid output.');capturePlacement(model);}catch(cause){error=cause.message;}
   return Object.freeze({bodyId:row.id,featureId:row.featureId,solidCount:metrics?.solidCount??null,canExport:!error,reason:error||null});
  });
  if(!reason&&!bodies.some((row:any)=>row.canExport))reason='The current part has no exportable positive native solid output.';
  const revision=reason?null:manager.inspectDocumentRevision();
  if(craft!==ctx.craftService||manager!==ctx.projectManager||project!==ctx.projectService||craft.modifications$.value!==history||craft.inspectWorkerSolids().revision!==info.revision)throw abort();
  return Object.freeze({ready:!reason,reason:reason||null,revision,geometryRevision:info.revision,unit:'millimeter',engine:'occ',engineRevision:build?.revision??null,maxSelections:32,maxArtifactBytes:8388608,availableBuilds:Object.freeze(available.map((b:any)=>Object.freeze({engine:b.id,engineRevision:b.revision}))),bodies:Object.freeze(bodies),structure:'geometric-solid-set'});
 }
 async function exportWorkerSTEPBlob(input:any,rawOptions:any={}){
  const a=captureWorkerStepExportRequest(input),opts=options(rawOptions),build=buildPolicy.requireBuild(a.engine,a.engineRevision);
  if(build?.id!=='occ'||build.revision!==a.engineRevision||build.stepExportVersion!==1)fail('ENGINE_REVISION_MISMATCH','Select an explicitly registered staged STEP runtime.');
  const craft=ctx.craftService,project=ctx.projectService,storage=ctx.storageService,sketches=ctx.sketchStorageService,registry=ctx.cadRegistry,manager=ctx.projectManager,e=ctx.expressionService,operationService=ctx.operationService,info=inspectWorkerStepExports();
  if(!info.ready)fail('UNAVAILABLE',info.reason);if(a.revision!==info.revision||a.geometryRevision!==info.geometryRevision)throw abort();
  const before=craft.modifications$.value,models=craft.models$.value;
  if(!Array.isArray(before.history)||before.history.length>256||before.pointer!==before.history.length-1||genericHistoryBuild(before.history)!==build)fail('UNSUPPORTED_HISTORY','STEP requires a bounded complete part using the selected runtime.');
  const budget=selectedProfileHistoryBudget(before.history,a.engineRevision);if(!budget.withinLimit)fail(budget.reason||'RESOURCE_LIMIT','The part exceeds its replay budget.');
  const selected=a.bodies.map((body:any)=>{
   const model=registry.find(body.bodyId),row=info.bodies.find((r:any)=>r.bodyId===body.bodyId&&r.featureId===body.featureId),metrics=model?.inspectKernelMetrics?.();
   if(!(model instanceof MWorkerSolid)||!row?.canExport||model.featureId!==body.featureId||!positiveMeasuredSolid(metrics,a.engineRevision))fail('UNSUPPORTED_TARGET','Select current positive native solid outputs.');
   return {body,model,metrics,placement:capturePlacement(model)};
  });
  const epoch=craft.evaluationEpoch,generation=project.documentGeneration,namespace=project.sketchStorageNamespace,stamp=sketchRevision(storage,namespace),counter=project.counterGenerator,counters=counter.projectCounters,counterValue=counters.featureId;
  const streamList=()=>[craft.modifications$,craft.models$,craft.pipelineFailure$,craft.engineCleanupFailure$,e.script$,e.table$,e.list$,e.errors$,ctx.streams.sketcher.sketchingFace,ctx.wizardService.workingRequest$,ctx.workbenchService.currentWorkbench$,ctx.assemblyService.constraints$],tracked=streamList(),versions=tracked.map(s=>s.revision),sourceFaces=new Map<string,any>();
  const controller=new AbortController(),stop=()=>controller.abort(),signals=[project.documentSignal,opts.signal].filter(Boolean),subscriptions:AbortSignal[]=[];let timer:any,poll:any;
  const check=()=>{
   if(e.isTyped&&!e.hasCurrentPhysicalResult())throw abort();
   let host=false;try{host=!opts.valid||opts.valid()===true;}catch{}
   if(!host||controller.signal.aborted||ctx.projectService!==project||!project.hasHostLifetime||!project.isDocumentCurrent(generation)||ctx.craftService!==craft||craft.evaluationEpoch!==epoch||craft.modifications$.value!==before||craft.models$.value!==models||ctx.storageService!==storage||ctx.sketchStorageService!==sketches||ctx.cadRegistry!==registry||ctx.projectManager!==manager||manager.isRestoring||manager.unit!=='millimeter'||manager.inspectDocumentRevision()!==a.revision||craft.inspectWorkerSolids().revision!==a.geometryRevision||project.sketchStorageNamespace!==namespace||ctx.expressionService!==e||ctx.operationService!==operationService||streamList().some((s,i)=>s!==tracked[i]||s.revision!==versions[i])||sketchRevision(storage,namespace)!==stamp||counter!==project.counterGenerator||counter.projectCounters!==counters||counters.featureId!==counterValue)throw abort();
   for(const{body,model,metrics,placement:p}of selected)if(registry.find(body.bodyId)!==model||model.featureId!==body.featureId||model.inspectKernelMetrics()!==metrics||model.location$!==p.location||p.location.value!==p.matrix||model.csys!==p.csys||MATRIX_KEYS.some((key,i)=>!Object.is(p.matrix[key],IDENTITY[i]))||CSYS_KEYS.some((key,i)=>[p.csys[key].x,p.csys[key].y,p.csys[key].z].some((n,j)=>!Object.is(n,p.axes[i][j]))))throw abort();
   for(const[id,row]of sourceFaces){if(registry.findFace(id)!==row.face)throw abort();const frame=sketchBoundaryFrame(row.face);if(['origin','x','y','z'].some(key=>frame[key].some((n,i)=>!Object.is(n,row.frame[key][i]))))throw abort();}
  };
  try{
   for(const signal of signals){subscriptions.push(signal);signal.addEventListener('abort',stop,{once:true});if(signal.aborted)stop();}
   timer=setTimeout(stop,60000);poll=setInterval(()=>{try{check();}catch{stop();}},100);check();const history=await capturePipelineHistory(before.history,check);check();
   const operations=new Map();for(const entry of history){const type=entry.type,op=operationService.get(type);if(isSourcePlaneType(type)?!isRegisteredSourcePlane(type,op):!AUTHORED_SOLID_KINDS.includes(type))fail('UNSUPPORTED_HISTORY','Only standard planes and owned-solid features can be exported.');operations.set(type,Object.freeze({descriptor:op,run:op.run,admit:op.admitGeometry}));}
   const inventory=sketches.getAllSketches();if(!Array.isArray(inventory)||inventory.length>64)fail('RESOURCE_LIMIT','The source inventory exceeds the export bound.');const captured=new Map<string,string>(),frames=[];
   for(const item of inventory){check();const id=item?.id,face=registry.findFace(id),data=sketches.getSketchData(id);if(typeof id!=='string'||!id||id.length>256||captured.has(id)||!(face?.root instanceof MOpenFaceShell)||face.defaultSketchId!==id||!face.isPlaneBased||typeof data!=='string'||data.length>65536||new TextEncoder().encode(data).byteLength>65536)fail('UNSUPPORTED_SOURCE','Each source must retain its bounded independent plane.');captured.set(id,data);const frame=sketchBoundaryFrame(face);sourceFaces.set(id,{face,frame});frames.push(Object.freeze({id,frame:Object.freeze(Object.fromEntries(Object.entries(frame).map(([key,value]:any)=>[key,Object.freeze([...value])])))}));}
   const entries=Object.freeze([...captured].map(([id,data])=>Object.freeze({id,data}))),get=(id:string)=>{if(!captured.has(id))fail('STALE_SOURCE','Export attempted an uncaptured source.');return captured.get(id)!;};
   const frozenStorage=Object.freeze({getAllSketches:()=>entries.map(r=>Object.freeze({id:r.id})),getSketchData:get,hasSketch:(id:string)=>captured.has(id),readSketch:(id:string)=>ReadSketch(JSON.parse(get(id)),id,true),setSketchData:()=>fail('READ_ONLY','STEP cannot write source sketches.'),removeSketchData:()=>fail('READ_ONLY','STEP cannot remove source sketches.')});
   const current=()=>{check();for(const[type,row]of operations as any){const op=operationService.get(type);if(op!==row.descriptor||op.run!==row.run||op.admitGeometry!==row.admit)throw abort();}for(const[id,data]of captured)if(sketches.getSketchData(id)!==data)throw abort();};
   await assertPipelineHistoryCurrent(before.history,history,current);current();
   const result=await evaluateReadOnly({history,endIndex:before.pointer,epoch,generation,project,signal:controller.signal,valid:()=>{try{current();return true;}catch{return false;}},requireCurrent:current,sketchStorage:frozenStorage,sketchOverrides:entries,sketchSourceFrames:Object.freeze(frames),operations,query:Object.freeze({engine:a.engine,engineRevision:a.engineRevision,bodies:Object.freeze(selected.map(r=>Object.freeze({bodyId:r.body.bodyId,featureId:r.body.featureId,expectedMetrics:r.metrics})))} )});
   current();await assertPipelineHistoryCurrent(before.history,history,current);current();
   return Object.freeze({version:1,unit:'millimeter',revision:a.revision,geometryRevision:a.geometryRevision,engine:a.engine,engineRevision:a.engineRevision,bodies:a.bodies,quality:'native-part-step-export',blob:result.blob,metadata:result.metadata});
  }finally{
   clearTimeout(timer);clearInterval(poll);
   for(const signal of subscriptions)try{signal.removeEventListener('abort',stop);}catch{try{REMOVE_ABORT_LISTENER.call(signal,'abort',stop);}catch(cause){try{console.error('STEP export cleanup failed; listener release is unconfirmed.',cause);}catch{}}}
  }
 }
 return Object.freeze({inspectWorkerStepExports,exportWorkerSTEPBlob});
}
