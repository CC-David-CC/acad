import {SOURCE_PROJECTION_TYPE,isRegisteredSourceProjection,captureProjectionReadGuard} from './capturedProjectionRead';
import {isSourcePlaneType,isRegisteredSourcePlane} from './sourcePlanePolicy';
import {MWorkerSolid} from '../model/mworkerSolid';
import {MOpenFaceShell} from '../model/mopenFace';
import {ReadSketch} from '../sketch/sketchReader';
import {sketchBoundaryFrame} from '../sketch/boundaryValidity';
import {capturePipelineHistory,assertPipelineHistoryCurrent} from './capturePipelineHistory.mjs';
import {sketchRevision} from './sketchRevision.mjs';
import {captureGenericManufacturingBodies} from '../projectManager/genericManufacturingBodies';
import {AUTHORED_SOLID_KINDS} from 'engine/solid/authoredSolidKinds.mjs';
import {genericHistoryBuild,requireManufacturingMeshBuild} from 'engine/mount/selectedProfileBuildSelection.mjs';
import {selectedProfileHistoryBudget} from 'engine/mount/selectedProfileBudget.mjs';
import {physicalReadUnsupportedReason} from '../parameters/modernPhysicalBindings.mjs';
import {issueWorkerManufacturingMeshes} from './manufacturingMeshReplayResult.mjs';
const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
const abort=()=>new DOMException('Manufacturing replay was cancelled or superseded.','AbortError');
const aborted=Function.call.bind(Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get),listen=Function.call.bind(EventTarget.prototype.addEventListener),unlisten=Function.call.bind(EventTarget.prototype.removeEventListener);
const IDENTITY=[1,0,0,0,0,1,0,0,0,0,1,0],TRANSFORM=[1,0,0,0,1,0,0,0,1,0,0,0],MATRIX=['mxx','mxy','mxz','tx','myx','myy','myz','ty','mzx','mzy','mzz','tz'],AXES=['origin','x','y','z'];
function fields(v:any,keys:string[]){const p=v&&typeof v==='object'?Object.getPrototypeOf(v):undefined;if(!v||typeof v!=='object'||Array.isArray(v)||(p!==null&&Object.getPrototypeOf(p)!==null)||Reflect.ownKeys(v).length!==keys.length)fail('INVALID_REQUEST','Expected exact manufacturing replay data.');const r:any={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(v,k);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))fail('INVALID_REQUEST','Manufacturing replay requires own data.');r[k]=d.value;}return r;}
function dense(v:any,max:number){if(!Array.isArray(v)||v.length>max||Reflect.ownKeys(v).length!==v.length+1)fail('UNSUPPORTED_MANUFACTURING_METADATA','Manufacturing metadata exceeds the supported generic slice.');return Array.from({length:v.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))fail('UNSUPPORTED_MANUFACTURING_METADATA','Manufacturing arrays must be dense data.');return d.value;});}
function manifest(metadata:any,history:any[],targets:readonly any[],registry:any,engineRevision:string){
 if(!metadata||metadata.version!==1||metadata.unit!=='millimeter'||typeof metadata.revision!=='string'||!/^sha256-[a-f0-9]{64}$/.test(metadata.revision))fail('UNSUPPORTED_MANUFACTURING_METADATA','Saved millimeter manufacturing assignments are required.');
 dense(metadata.materials,128);dense(metadata.appearances,128);const bindings=new Map<string,any>();for(const b of dense(metadata.bindings,128)){if(bindings.has(b.id)||!AUTHORED_SOLID_KINDS.includes(b.operationType))fail('UNSUPPORTED_MANUFACTURING_METADATA','Only uniquely bound generic assignments can be replayed.');bindings.set(b.id,b);}
 const selected:any[]=[],parts:any[]=[],sourceBindings:any[]=[],used=new Set<string>(),partIds=new Set<string>();
 for(const p of dense(metadata.objects,32)){
  if(partIds.has(p.id))fail('UNSUPPORTED_MANUFACTURING_METADATA','Duplicate printable part.');partIds.add(p.id);const regions:any[]=[],ids=new Set<string>();
  for(const r of dense(p.regions,32)){
   if(selected.length>=32||ids.has(r.id)||!Array.isArray(r.transform)||r.transform.length!==12||r.transform.some((v:any,i:number)=>!Object.is(v,TRANSFORM[i])))fail('UNSUPPORTED_MANUFACTURING_METADATA','Generic regions require unique identities and identity placement.');ids.add(r.id);
   const b=bindings.get(r.bodyId),matches=b?targets.filter(t=>t.featureId===b.featureId&&t.operationType===b.operationType):[];
   if(matches.length!==1||!matches[0].canAssign||matches[0].engineRevision!==engineRevision)fail('INCOMPLETE_ASSIGNMENTS','A saved region has no unique current printable output.');
   const t=matches[0],model=registry.find(t.bodyId),indices=history.flatMap((op,i)=>op?.params?.featureId===b.featureId?[i]:[]);
   if(used.has(t.bodyId)||indices.length!==1||history[indices[0]].type!==b.operationType||!(model instanceof MWorkerSolid)||model.inspectKernelMetrics!==MWorkerSolid.prototype.inspectKernelMetrics||model.originatingOperation!==indices[0])fail('INCOMPLETE_ASSIGNMENTS','A region producer is duplicate or no longer current.');used.add(t.bodyId);
   const metrics=model.inspectKernelMetrics(),location=model.location$,matrix=location.value,csys=model.csys,axes=AXES.map(k=>[csys[k].x,csys[k].y,csys[k].z]);
   if(MATRIX.some((k,i)=>!Object.is(matrix[k],IDENTITY[i]))||axes.some((v,i)=>v.some((n,j)=>!Object.is(n,i===0?0:i-1===j?1:0))))fail('UNSUPPORTED_PLACEMENT','Manufacturing requires canonical model placement.');
   const body=Object.freeze({bodyId:t.bodyId,featureId:b.featureId,expectedMetrics:metrics});selected.push({body,model,metrics,location,matrix,csys,axes});
   regions.push(Object.freeze({id:r.id,bodyId:t.bodyId,featureId:b.featureId,engine:'occ',engineRevision,materialId:r.materialId,appearanceId:r.appearanceId}));sourceBindings.push(Object.freeze({partId:p.id,regionId:r.id,bindingId:b.id,bodyId:t.bodyId,featureId:b.featureId,operationType:b.operationType}));
  }
  if(!regions.length)fail('INCOMPLETE_ASSIGNMENTS','An assigned part is empty.');parts.push(Object.freeze({id:p.id,name:p.name,regions:Object.freeze(regions)}));
 }
 if(!selected.length||selected.length!==targets.length||targets.some(t=>!t.canAssign||!used.has(t.bodyId)))fail('INCOMPLETE_ASSIGNMENTS','Assign every current printable output exactly once.');
 return {selected,parts:Object.freeze(parts),sourceBindings:Object.freeze(sourceBindings)};
}
// Private service; build/evaluator dependencies never come from public input.
export function createWorkerManufacturingMeshReplay(ctx:any,evaluateReadOnly:(input:any)=>Promise<any>,policy:any){
 if(typeof evaluateReadOnly!=='function'||typeof policy?.requireBuild!=='function')fail('INVALID_REQUEST','Protected manufacturing replay is unavailable.');
 async function prepareWorkerManufacturingMeshes(input:any,rawOptions:any={}){
  const a=fields(input,['revision','engine','engineRevision']);if(typeof a.revision!=='string'||!a.revision||a.revision.length>256||a.engine!=='occ'||typeof a.engineRevision!=='string')fail('ENGINE_REVISION_MISMATCH','Select the explicit controlled manufacturing build.');
  const opts=fields(rawOptions,Reflect.ownKeys(rawOptions||{}) as string[]);if(Reflect.ownKeys(opts).some(k=>!['signal','valid'].includes(k as string))||opts.valid!==undefined&&typeof opts.valid!=='function')fail('INVALID_REQUEST','Invalid manufacturing lifetime.');if(opts.signal!==undefined)try{aborted(opts.signal);}catch{fail('INVALID_REQUEST','Expected a native cancellation signal.');}
  const registered=requireManufacturingMeshBuild(a.engine,a.engineRevision),build=policy.requireBuild(a.engine,a.engineRevision);if(build!==registered)fail('ENGINE_REVISION_MISMATCH','The registered manufacturing runtime is not staged.');
  const craft=ctx.craftService,project=ctx.projectService,storage=ctx.storageService,sketches=ctx.sketchStorageService,registry=ctx.cadRegistry,manager=ctx.projectManager,e=ctx.expressionService,operationService=ctx.operationService,save=manager.prepareHostSave,info=craft.inspectWorkerSolids(),before=craft.modifications$.value,models=craft.models$.value;
  if(!info.ready||craft.isProcessing||!project.hasHostLifetime||manager.isRestoring||manager.unit!=='millimeter'||typeof save!=='function')fail('UNAVAILABLE','Finish the current document operation.');if(manager.inspectDocumentRevision()!==a.revision)throw abort();
  const parameterReason=physicalReadUnsupportedReason(e,before.history);if(parameterReason)fail('UNSUPPORTED_PARAMETERS',parameterReason);
  if(!Array.isArray(before.history)||before.history.length>256||before.pointer!==before.history.length-1||genericHistoryBuild(before.history)!==build)fail('UNSUPPORTED_HISTORY','Manufacturing needs the complete bounded part on one exact build.');const budget=selectedProfileHistoryBudget(before.history,a.engineRevision);if(!budget.withinLimit)fail('RESOURCE_LIMIT','The part exceeds its replay budget.');
  const epoch=craft.evaluationEpoch,generation=project.documentGeneration,namespace=project.sketchStorageNamespace,stamp=sketchRevision(storage,namespace),counter=project.counterGenerator,counters=counter.projectCounters,counterValue=counters.featureId;
  const streamList=()=>[craft.modifications$,craft.models$,craft.pipelineFailure$,craft.engineCleanupFailure$,e.script$,e.table$,e.list$,e.errors$,ctx.streams.sketcher.sketchingFace,ctx.wizardService.workingRequest$,ctx.workbenchService.currentWorkbench$,ctx.assemblyService.constraints$],tracked=streamList(),versions=tracked.map(s=>s.revision),sourceFaces=new Map<string,any>();let selected:any[]=[];
  const controller=new AbortController(),stop=()=>controller.abort(),signals=[project.documentSignal,opts.signal].filter(s=>s!==undefined),subscriptions:any[]=[];let projectionRead:ReturnType<typeof captureProjectionReadGuard>=null;let timer:any,poll:any;
  const check=()=>{
   if(e.isTyped&&!e.hasCurrentPhysicalResult())throw abort();
   let host=false;try{host=!opts.valid||opts.valid()===true;}catch{}
   if(!host||aborted(controller.signal)||signals.some(s=>aborted(s))||ctx.projectService!==project||!project.hasHostLifetime||!project.isDocumentCurrent(generation)||project.documentSignal!==signals[0]||ctx.craftService!==craft||craft.evaluationEpoch!==epoch||craft.modifications$.value!==before||craft.models$.value!==models||ctx.storageService!==storage||ctx.sketchStorageService!==sketches||ctx.cadRegistry!==registry||ctx.projectManager!==manager||manager.prepareHostSave!==save||manager.isRestoring||manager.unit!=='millimeter'||manager.inspectDocumentRevision()!==a.revision||craft.inspectWorkerSolids().revision!==info.revision||project.sketchStorageNamespace!==namespace||ctx.expressionService!==e||ctx.operationService!==operationService||streamList().some((s,i)=>s!==tracked[i]||s.revision!==versions[i])||sketchRevision(storage,namespace)!==stamp||counter!==project.counterGenerator||counter.projectCounters!==counters||counters.featureId!==counterValue)throw abort();
   for(const{body,model,metrics,location,matrix,csys,axes}of selected)if(registry.find(body.bodyId)!==model||model.featureId!==body.featureId||model.inspectKernelMetrics!==MWorkerSolid.prototype.inspectKernelMetrics||model.inspectKernelMetrics()!==metrics||model.location$!==location||location.value!==matrix||model.csys!==csys||MATRIX.some((k,i)=>!Object.is(matrix[k],IDENTITY[i]))||AXES.some((k,i)=>[csys[k].x,csys[k].y,csys[k].z].some((n,j)=>!Object.is(n,axes[i][j]))))throw abort();
   projectionRead?.requireCurrent();
   for(const[id,row]of sourceFaces){if(registry.findFace(id)!==row.face)throw abort();const frame=sketchBoundaryFrame(row.face);if(AXES.some(k=>frame[k].some((n,i)=>!Object.is(n,row.frame[k][i]))))throw abort();}
  };
  try{
   for(const signal of signals){subscriptions.push(signal);listen(signal,'abort',stop,{once:true});if(aborted(signal))stop();}timer=setTimeout(stop,60000);poll=setInterval(()=>{try{check();}catch{stop();}},100);check();
   const prepared=await save.call(manager,{signal:controller.signal,valid:()=>{try{check();return true;}catch{return false;}}});check();if(!prepared.isCurrent())throw abort();
   const admission=captureGenericManufacturingBodies(ctx);admission.requireCurrent();if(!admission.ready)fail('UNAVAILABLE',admission.reason);const metadata=prepared.envelope.manufacturing,plan=manifest(metadata,before.history,admission.targets,registry,a.engineRevision);selected=plan.selected;
   const history=await capturePipelineHistory(before.history,check);await assertPipelineHistoryCurrent(before.history,prepared.envelope.project.model.history,check);check();
   const operations=new Map();for(const entry of history){const type=entry.type,op=operationService.get(type);if(type===SOURCE_PROJECTION_TYPE?!isRegisteredSourceProjection(op):isSourcePlaneType(type)?!isRegisteredSourcePlane(type,op):!AUTHORED_SOLID_KINDS.includes(type))fail('UNSUPPORTED_HISTORY','Only registered source-plane, associative projection and owned-solid producers can be replayed.');operations.set(type,Object.freeze({descriptor:op,run:op.run,admit:op.admitGeometry}));}
   projectionRead=captureProjectionReadGuard(ctx,before.history);check();
   const inventory=sketches.getAllSketches();if(!Array.isArray(inventory)||inventory.length>64||inventory.length!==prepared.envelope.project.sketches.length)fail('UNSUPPORTED_SOURCE','The captured source inventory differs.');const captured=new Map<string,string>(),frames=[];
   for(const item of inventory){check();const id=item?.id,face=registry.findFace(id),data=sketches.getSketchData(id);if(typeof id!=='string'||!id||id.length>256||captured.has(id)||!prepared.envelope.project.sketches.some((r:any)=>r.id===id)||!(face?.root instanceof MOpenFaceShell)||face.defaultSketchId!==id||!face.isPlaneBased||typeof data!=='string'||data.length>65536||new TextEncoder().encode(data).byteLength>65536)fail('UNSUPPORTED_SOURCE','Every source must own a bounded independent plane.');captured.set(id,data);const frame=sketchBoundaryFrame(face);sourceFaces.set(id,{face,frame});frames.push(Object.freeze({id,frame:Object.freeze(Object.fromEntries(Object.entries(frame).map(([key,v]:any)=>[key,Object.freeze([...v])])))}));}
   const entries=Object.freeze([...captured].map(([id,data])=>Object.freeze({id,data}))),get=(id:string)=>{if(!captured.has(id))fail('STALE_SOURCE','Replay attempted uncaptured source.');return captured.get(id)!;},frozenStorage=Object.freeze({getAllSketches:()=>entries.map(r=>Object.freeze({id:r.id})),getSketchData:get,hasSketch:(id:string)=>captured.has(id),readSketch:(id:string)=>ReadSketch(JSON.parse(get(id)),id,true),setSketchData:()=>fail('READ_ONLY','Manufacturing cannot write source.'),removeSketchData:()=>fail('READ_ONLY','Manufacturing cannot remove source.')});
   const current=()=>{check();for(const[type,row]of operations as any){const op=operationService.get(type);if(op!==row.descriptor||op.run!==row.run||op.admitGeometry!==row.admit)throw abort();}for(const[id,data]of captured)if(sketches.getSketchData(id)!==data)throw abort();};
   await assertPipelineHistoryCurrent(before.history,history,current);admission.requireCurrent();if(!prepared.isCurrent())throw abort();current();const bodies=Object.freeze(selected.map(r=>r.body));
   const artifacts=await evaluateReadOnly({history,endIndex:before.pointer,epoch,generation,project,signal:controller.signal,valid:()=>{try{current();return true;}catch{return false;}},requireCurrent:current,sketchStorage:frozenStorage,sketchOverrides:entries,sketchSourceFrames:Object.freeze(frames),operations,query:Object.freeze({engine:'occ',engineRevision:a.engineRevision,bodies})});
   current();await assertPipelineHistoryCurrent(before.history,history,current);admission.requireCurrent();if(!prepared.isCurrent())throw abort();
   const requireIssuedCurrent=()=>{current();admission.requireCurrent();if(!prepared.isCurrent())throw abort();};
   return issueWorkerManufacturingMeshes({version:1,unit:'millimeter',revision:a.revision,manufacturingRevision:metadata.revision,encodingRevision:metadata.revision.slice(7),engine:'occ',engineRevision:a.engineRevision,bodies,materials:metadata.materials,appearances:metadata.appearances,parts:plan.parts,sourceBindings:plan.sourceBindings,artifacts,isCurrent:()=>{try{requireIssuedCurrent();return true;}catch{return false;}}},requireIssuedCurrent);
  }finally{clearTimeout(timer);clearInterval(poll);for(const signal of subscriptions)unlisten(signal,'abort',stop);}
 }
 return Object.freeze({prepareWorkerManufacturingMeshes});
}
