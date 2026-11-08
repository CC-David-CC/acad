import {MOpenFaceShell} from '../model/mopenFace';
import {sketchBoundaryFrame} from '../sketch/boundaryValidity';
import {sketchRevision} from './sketchRevision.mjs';
import {captureAuthoredHistory} from './captureAuthoredHistory.mjs';
import {canonicalAuthoredFeatureId} from './authoredFeatureIdentity.mjs';
import {SUPPRESSIBLE_FEATURE_TYPES} from 'engine/solid/authoredHistoryState.mjs';
import {genericHistoryBuild} from 'engine/mount/selectedProfileBuildSelection.mjs';
import {selectedProfileHistoryBudget} from 'engine/mount/selectedProfileBudget.mjs';
import {validateControlledHistory,assertActiveHistoryDependencies,planHistoryControl,historyControlFailure} from './authoredHistoryControls.mjs';
import standardPlaneOperation from 'workbenches/modeler/features/plane/simplePlaneOperation';

const aborted=Function.call.bind(Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted')!.get!);
const listen=Function.call.bind(EventTarget.prototype.addEventListener),unlisten=Function.call.bind(EventTarget.prototype.removeEventListener);
const fail=(code:string,message:string):never=>{throw historyControlFailure(code,message);};
const abort=(committed=false)=>Object.assign(new DOMException(committed?'History edit committed before its caller changed.':'History edit was cancelled or superseded.','AbortError'),{committed});
function fields(value:any,keys:string[]){const p=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;if(!value||typeof value!=='object'||Array.isArray(value)||(p!==null&&Object.getPrototypeOf(p)!==null)||Reflect.ownKeys(value).length!==keys.length)fail('INVALID_REQUEST','Expected exact history-control data.');const out:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','History-control fields must be own data.');out[key]=d.value;}return Object.freeze(out);}
function options(value:any={}){const keys=Reflect.ownKeys(value||{});if(keys.some(k=>typeof k!=='string'||!['signal','valid'].includes(k)))fail('INVALID_REQUEST','Invalid history-control lifetime.');const r=fields(value,keys as string[]);if(r.valid!==undefined&&typeof r.valid!=='function')fail('INVALID_REQUEST','Invalid history-control validity.');if(r.signal!==undefined)try{aborted(r.signal);}catch{fail('INVALID_REQUEST','Expected a native AbortSignal.');}return r;}
const id=(value:any)=>Number.isSafeInteger(value)&&value>0;
const operationSupported=(type:string,build:any)=>type==='WORKER_THROUGH_HOLES_V1'?build.throughHoleVersion===1:type==='WORKER_SOLID_EDGE_TREATMENT_V1'?build.edgeTreatmentVersion===1:type==='WORKER_SELECTED_PROFILE_EXTRUDE_V2'?build.selectedProfileVersion===3:true;
const equalMetrics=(a:any,b:any)=>a&&b&&a.resultKind===b.resultKind&&a.solidCount===b.solidCount&&Object.is(a.nativeVolume,b.nativeVolume)&&a.nativeValidity?.valid===b.nativeValidity?.valid&&a.runtime?.jsSha256===b.runtime?.jsSha256&&a.runtime?.wasmSha256===b.runtime?.wasmSha256&&['min','max'].every(k=>a.nativeBounds?.[k]?.length===3&&b.nativeBounds?.[k]?.length===3&&a.nativeBounds[k].every((v:number,i:number)=>Object.is(v,b.nativeBounds[k][i])));

// readContext supplies only private existing Craft state. No public caller can
// provide source-plane witnesses, histories, publication hooks or native names.
export function createWorkerHistoryControlCommands(ctx:any,submit:(input:any)=>Promise<any>,readContext:()=>any,cancel:(epoch:number)=>void,requireBuild:(engine:string,revision:string)=>any){
 if(typeof requireBuild!=='function')fail('INVALID_REQUEST','The actual staged build policy is required.');
 let pending=false;
 function captureJob(opts:any){
  const craft=ctx.craftService,project=ctx.projectService,manager=ctx.projectManager,storage=ctx.storageService,registry=ctx.cadRegistry,sketches=ctx.sketchStorageService,expressions=ctx.expressionService,operations=ctx.operationService;
  craft.inspectAuthoredEdits();
  const documentRevision=manager.inspectDocumentRevision(),presentation=manager.getPresentationMetadata();
  const context=readContext(),state=craft.modifications$.value,history=state.history,models=craft.models$.value,generation=project.documentGeneration,epoch=craft.evaluationEpoch,namespace=project.sketchStorageNamespace,stamp=sketchRevision(storage,namespace),signal=project.documentSignal,scope:{epoch:number|null}={epoch:null};
  const services=()=>[ctx.craftService,ctx.projectService,ctx.projectManager,ctx.storageService,ctx.cadRegistry,ctx.sketchStorageService,ctx.expressionService,ctx.operationService,ctx.services.sketcher,ctx.wizardService,ctx.workbenchService,ctx.assemblyService,ctx.surfacingService],savedServices=services();
  const wizard=ctx.wizardService,wizardAdmission=wizard.hasActiveOperation;
  const activeOperation=()=>typeof wizardAdmission!=='function'||wizard.hasActiveOperation!==wizardAdmission||wizardAdmission.call(wizard)!==false;
  const alive=()=>{try{return !aborted(signal)&&(opts.signal===undefined||!aborted(opts.signal))&&(!opts.valid||opts.valid()===true)&&services().every((s,i)=>s===savedServices[i])&&project.hasHostLifetime&&project.isDocumentCurrent(generation)&&project.documentSignal===signal;}catch{return false;}};
  if(!alive())throw abort();
  if(craft.isProcessing)fail('UNAVAILABLE','Wait for the current model operation before controlling history.');
  if(craft.pipelineFailure$.value)fail('UNAVAILABLE','Resolve the retained model evaluation failure before controlling history.');
  if(craft.engineCleanupFailure$.value)fail('UNAVAILABLE','Native resource cleanup is unresolved; history controls are unavailable.');
  if(manager.isRestoring)fail('UNAVAILABLE','Finish restoring the document before controlling history.');
  if(manager.unit!=='millimeter')fail('UNAVAILABLE','History controls require canonical millimeter geometry.');
  if(ctx.services.sketcher.inPlaceEditor.inEditMode)fail('UNAVAILABLE','Finish the active sketch editor before controlling history.');
  if(typeof wizardAdmission!=='function')fail('UNAVAILABLE','The current wizard operation admission service is unavailable.');
  if(activeOperation())fail('UNAVAILABLE','Finish the active operation draft before controlling history; a pristine history preview is allowed.');
  if(expressions.isTyped||expressions.script$.value.trim()||Reflect.ownKeys(expressions.table$.value||{}).length||expressions.errors$.value.length)fail('UNSUPPORTED_PARAMETERS','History controls currently require literal local dimensions.');
  if(ctx.assemblyService.getConstraints().length||ctx.surfacingService?.scene?.surfaces.length)fail('UNSUPPORTED_HISTORY','Assembly and surfacing branches are outside this finite history capability.');
  const workbench=ctx.workbenchService.currentWorkbench$.value;if(workbench&&!workbench.internal&&workbench.workbenchId!==ctx.workbenchService.defaultWorkbenchId)fail('UNSUPPORTED_WORKBENCH','Use the ordinary modeling workbench.');
  if(!context.ready||context.history!==history||context.journal.document!==generation||!Number.isSafeInteger(state.pointer)||state.pointer< -1||state.pointer>=history.length)fail('UNAVAILABLE','The authenticated accepted definition is unavailable.');
  const sourceParents=new Map<string,number>(),sourceChecks:any[]=[],operationBindings=new Map(),sourceModels=context.sourceModels;
  if(!Array.isArray(sourceModels)||sourceModels.length>1024)fail('RESOURCE_LIMIT','Source metadata exceeds the history-control limit.');
  for(const model of sourceModels)if(model instanceof MOpenFaceShell){const face=model.face,index=model.originatingOperation,entry=history[index];if(!face||face.root!==model||face.defaultSketchId!==face.id||!face.isPlaneBased||entry?.type!=='PLANE'||sourceParents.has(face.id))fail('UNRESOLVED_SOURCE','Independent source ownership is ambiguous.');sourceParents.set(face.id,canonicalAuthoredFeatureId(entry.params.featureId));sourceChecks.push({model,face,index});}
  const rows=validateControlledHistory(history,sourceParents);assertActiveHistoryDependencies(rows);
  for(const row of rows){const op=operations.get(row.type);if(typeof op?.run!=='function'||row.type==='PLANE'&&(op.run!==standardPlaneOperation.run||!!op.admitGeometry))fail('UNSUPPORTED_HISTORY','Use the genuine registered operation implementations.');operationBindings.set(row.type,{op,run:op.run,admit:op.admitGeometry});}
  const inventory=sketches.getAllSketches();if(!Array.isArray(inventory)||inventory.length>64)fail('RESOURCE_LIMIT','History controls support at most64 independent sketch sources.');
  const sourceRows=inventory.map((item:any)=>{const source=sketches.getSketchData(item.id),owner=sourceChecks.find(r=>r.face.id===item.id);if(!owner||typeof source!=='string'||source.length>65536)fail('UNSUPPORTED_SOURCE','Every saved sketch must retain a bounded authentic source plane.');const frame=JSON.stringify(sketchBoundaryFrame(owner.face)),liveFace=registry.findFace(item.id);if(liveFace&&JSON.stringify(sketchBoundaryFrame(liveFace))!==frame)fail('UNRESOLVED_SOURCE','The retained source frame differs from the accepted prefix.');return{id:item.id,source,frame,owner,liveFace};});
  const build=genericHistoryBuild(history);if(!build||build.id!=='occ'||build.selectedProfileVersion!==3)fail('ENGINE_CAPABILITY_UNAVAILABLE','Use one explicit modern OCC part build.');
  if(requireBuild(build.id,build.revision)!==build)fail('ENGINE_CAPABILITY_UNAVAILABLE','The exact recorded runtime is not staged for this part.');
  const budget=selectedProfileHistoryBudget(history,build.revision);if(!budget.withinLimit)fail(budget.reason||'RESOURCE_LIMIT','The existing part exceeds its genuine replay budget.');
  if(models.length>1024)fail('RESOURCE_LIMIT','Accepted model metadata exceeds the history-control bound.');
  const placementKeys=['mxx','mxy','mxz','tx','myx','myy','myz','ty','mzx','mzy','mzz','tz'];
  const modelChecks=models.map((model:any)=>({model,id:model.id,method:model.inspectKernelMetrics,metrics:model.inspectKernelMetrics?.(),location:model.location$,matrix:model.location$?.value,coordinates:model.location$?.value?placementKeys.map(k=>model.location$.value[k]):[],csys:model.csys,axes:model.csys?['origin','x','y','z'].map(k=>[model.csys[k].x,model.csys[k].y,model.csys[k].z]):[]}));
  const protectedRefs=manager.inspectAuthoredManufacturingReferences(),material=protectedRefs.materialRevision,drawing=manager.getLinkedPartDrawingDefinition(),counter=project.counterGenerator,counters=counter.projectCounters,highWater=counters.featureId;
  const protectedBodies=protectedRefs.references.map((ref:any)=>{const matches=sourceModels.filter(m=>m.featureId===ref.featureId);if(matches.length!==1||history[matches[0].originatingOperation]?.type!==ref.operationType)fail('UNRESOLVED_MANUFACTURING_REFERENCE','Review unresolved assigned outputs before changing history.');const model=matches[0],metrics=model.inspectKernelMetrics?.();if(!metrics||metrics.nativeValidity?.valid!==true)fail('UNRESOLVED_MANUFACTURING_REFERENCE','An assigned output needs its authentic native measurement.');return{ref,model,metrics};});
  const streams=()=>[craft.modifications$,craft.models$,craft.pipelineFailure$,craft.engineCleanupFailure$,expressions.script$,expressions.table$,expressions.list$,expressions.errors$,ctx.streams.sketcher.sketchingFace,ctx.wizardService.workingRequest$,ctx.workbenchService.currentWorkbench$,ctx.assemblyService.constraints$,...(ctx.surfacingService?[ctx.surfacingService.state$]:[])],savedStreams=streams(),versions=savedStreams.map(s=>s.revision);
  const current=()=>{
   if(!alive()||activeOperation()||scope.epoch===null&&manager.inspectDocumentRevision()!==documentRevision||manager.getPresentationMetadata()!==presentation||craft.evaluationEpoch!==(scope.epoch===null?epoch:scope.epoch)||craft.modifications$.value!==state||state.history!==history||craft.models$.value!==models||readContext().journal!==context.journal||readContext().history!==history||streams().some((s,i)=>s!==savedStreams[i]||s.revision!==versions[i])||project.sketchStorageNamespace!==namespace||sketchRevision(storage,namespace)!==stamp||manager.inspectMaterialSurfaceRevision()!==material||manager.getLinkedPartDrawingDefinition()!==drawing||counter!==project.counterGenerator||counter.projectCounters!==counters||counters.featureId!==highWater)throw abort();
   for(const r of modelChecks)if(registry.find(r.id)!==r.model||r.model.id!==r.id||r.model.inspectKernelMetrics!==r.method||r.model.inspectKernelMetrics?.()!==r.metrics||r.model.location$!==r.location||r.location?.value!==r.matrix||r.matrix&&placementKeys.some((k,i)=>!Object.is(r.matrix[k],r.coordinates[i]))||r.model.csys!==r.csys||r.csys&&['origin','x','y','z'].some((k,i)=>['x','y','z'].some((axis,j)=>!Object.is(r.csys[k][axis],r.axes[i][j]))))throw abort();
   for(const[type,r]of operationBindings){const op=operations.get(type);if(op!==r.op||op.run!==r.run||op.admitGeometry!==r.admit)throw abort();}
   const now=sketches.getAllSketches();if(now.length!==sourceRows.length||now.some((r:any)=>!sourceRows.some(v=>v.id===r.id)))throw abort();
   for(const r of sourceRows)if(sketches.getSketchData(r.id)!==r.source||r.owner.model.face!==r.owner.face||r.owner.face.root!==r.owner.model||JSON.stringify(sketchBoundaryFrame(r.owner.face))!==r.frame||registry.findFace(r.id)!==r.liveFace||r.liveFace&&JSON.stringify(sketchBoundaryFrame(r.liveFace))!==r.frame)throw abort();
  };
  current();return{craft,project,manager,state,history,rows,models,context,sourceParents,protectedRefs:protectedRefs.references,scope,signals:[signal,opts.signal].filter(Boolean),alive,current,build,budget,sourceStamp:stamp,materialRevision:material,
   requireProtected(models:any[],nextHistory:any[]){for(const r of protectedBodies){const next=models.filter(m=>m.id===r.model.id&&m.featureId===r.ref.featureId);if(next.length!==1||nextHistory[next[0].originatingOperation]?.type!==r.ref.operationType||!equalMetrics(r.metrics,next[0].inspectKernelMetrics?.()))fail('REFERENCED_MANUFACTURING_OUTPUT','This history edit changes an assigned output. Rebind its materials explicitly first.');}}
  };
 }
 function inspectWorkerHistoryControls(){
  const job=captureJob(Object.freeze({})),journal=job.craft.inspectAuthoredEdits(),features=job.rows.map(row=>{
   const missingParents=row.dependencies.filter(id=>job.rows.find(r=>r.featureId===id)?.suppressed),assignedParent=['WORKER_THROUGH_HOLES_V1','WORKER_SOLID_EDGE_TREATMENT_V1'].includes(row.type)&&job.protectedRefs.some((r:any)=>r.featureId===row.params.producerFeatureId),dependents=job.rows.filter(r=>!r.suppressed&&r.dependencies.includes(row.featureId)).map(r=>r.featureId),assigned=job.protectedRefs.some((r:any)=>r.featureId===row.featureId),full=job.state.pointer===job.history.length-1,supported=SUPPRESSIBLE_FEATURE_TYPES.includes(row.type),available=operationSupported(row.type,job.build);
   return Object.freeze({index:row.index,featureId:row.featureId,type:row.type,state:row.suppressed?'suppressed':'active',dependencies:row.dependencies,activeDependents:Object.freeze(dependents),canSuppress:full&&supported&&available&&!row.suppressed&&!dependents.length&&!assigned,canUnsuppress:full&&supported&&available&&row.suppressed&&!missingParents.length&&!assignedParent,reason:!full?'PREFIX_MODE':!supported?'UNSUPPORTED_FEATURE':!available?'ENGINE_CAPABILITY_UNAVAILABLE':assigned||row.suppressed&&assignedParent?'REFERENCED_MANUFACTURING_OUTPUT':row.suppressed&&missingParents.length?'SUPPRESSED_DEPENDENCY':dependents.length?'ACTIVE_DEPENDENTS':null});
  });
  const afterFeatureId=job.state.pointer<0?null:job.rows[job.state.pointer].featureId,suffix=job.rows.slice(job.state.pointer+1),retainsConstructor=job.rows.slice(0,job.state.pointer+1).some(r=>['WORKER_SOLID_BOX_V1','WORKER_SELECTED_PROFILE_EXTRUDE_V2'].includes(r.type)),canBranch=retainsConstructor&&!!suffix.length&&!suffix.some(r=>r.type==='PLANE'||job.protectedRefs.some((ref:any)=>ref.featureId===r.featureId));
  const result={version:1,revision:journal.revision,geometryRevision:job.craft.inspectWorkerSolids().revision,ready:true,unit:'millimeter',engine:'occ',engineRevision:job.build.revision,pointer:job.state.pointer,afterFeatureId,fullTipIndex:job.history.length-1,canBranch,branchReason:canBranch?null:!suffix.length?'NO_FUTURE_HISTORY':suffix.some(r=>r.type==='PLANE')?'BRANCH_SOURCE_OWNERSHIP':!retainsConstructor?'BRANCH_CONSTRUCTOR_REQUIRED':'REFERENCED_MANUFACTURING_OUTPUT',features:Object.freeze(features),authoredUndo:'shared-session-journal-v1',qualification:'requires-checked-native-replay',scope:'numeric-modern-feature-history-v1'};
  if(new TextEncoder().encode(JSON.stringify(result)).byteLength>65536)fail('RESOURCE_LIMIT','History-control discovery exceeds64KiB.');job.current();return Object.freeze(result);
 }
 async function execute(kind:string,input:any,rawOptions:any={}){
  const opts=options(rawOptions),a=fields(input,kind==='feature-suppression'?['revision','index','featureId','suppressed']:['revision','afterFeatureId']);
  if(typeof a.revision!=='string'||!a.revision||a.revision.length>256||kind==='feature-suppression'&&(!Number.isSafeInteger(a.index)||a.index<0||a.index>255||!id(a.featureId)||typeof a.suppressed!=='boolean')||kind!=='feature-suppression'&&a.afterFeatureId!==null&&!id(a.afterFeatureId))fail('INVALID_REQUEST','Use an inspected authored revision and feature identity.');
  if(pending)fail('BUSY','A history-control request is pending.');pending=true;let job:any,poll:any;const installed:any[]=[];let done=false;
  const stop=()=>{if(!done&&job&&job.scope.epoch!==null)cancel(job.scope.epoch);};
  try{
   job=captureJob(opts);if(a.revision!==job.craft.inspectAuthoredEdits().revision)fail('STALE_HISTORY','The history-control revision is stale.');
   for(const signal of job.signals){if(aborted(signal))throw abort();listen(signal,'abort',stop,{once:true});installed.push(signal);}
   poll=setInterval(()=>{try{job.current();}catch{stop();}},100);
   const captured=await captureAuthoredHistory(job.history,job.current);job.current();
   if(kind==='feature-suppression'&&job.rows[a.index]?.suppressed!==a.suppressed&&!operationSupported(job.rows[a.index]?.type,job.build))fail('ENGINE_CAPABILITY_UNAVAILABLE','The recorded runtime does not advertise this operation.');
   const plan=planHistoryControl(captured.history,job.state.pointer,job.rows,{kind,...a},job.protectedRefs);
   if(!plan.changed)return Object.freeze({changed:false,revision:a.revision,pointer:job.state.pointer,afterFeatureId:job.state.pointer<0?null:job.rows[job.state.pointer].featureId});
   return await submit({job,captured,plan,options:opts});
  }finally{done=true;clearInterval(poll);for(const signal of installed)unlisten(signal,'abort',stop);pending=false;}
 }
 return Object.freeze({inspectWorkerHistoryControls,setWorkerFeatureSuppressed:(a:any,o:any={})=>execute('feature-suppression',a,o),setWorkerHistoryPrefix:(a:any,o:any={})=>execute('history-position',a,o),commitWorkerHistoryBranch:(a:any,o:any={})=>execute('history-branch',a,o),captureHistoryControlJob:(raw:any={})=>captureJob(options(raw))});
}
