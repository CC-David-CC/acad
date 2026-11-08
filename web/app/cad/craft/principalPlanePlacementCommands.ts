import {capturePrincipalPlanePlacementRequest,capturePrincipalPlanePlacementDraft,capturePrincipalPlaneReviewPosition} from './principalPlanePlacementIntent.mjs';
import {readHistoryReviewApply} from './wizard/wizardBundle';
import {captureAuthoredHistory} from './captureAuthoredHistory.mjs';
import {sourcePlaneFaceId} from './sourcePlaneIdentity.mjs';
import {canonicalAuthoredFeatureId as fid} from './authoredFeatureIdentity.mjs';
import {sketchRevision} from './sketchRevision.mjs';
import {isSourcePlaneType,isRegisteredSourcePlane} from './sourcePlanePolicy';
import {captureSourcePlaneParameters,planeRecord as fields} from 'sketcher/headless/sourcePlaneDepthEnvelope.mjs';
import {captureSourceFrameParameters} from 'engine/source/sourceFrameIntent.mjs';
import {AUTHORED_SOLID_KINDS} from 'engine/solid/authoredSolidKinds.mjs';
import {genericHistoryBuild} from 'engine/mount/selectedProfileBuildSelection.mjs';
import {selectedProfileHistoryBudget} from 'engine/mount/selectedProfileBudget.mjs';
import {acceptedPrincipalSourceRows,readPrincipalSourceBasis,releasePrincipalSourceBasis,issueNativeSourceReplay,sourceAttachmentDepths,nativeSourceDescendants,releasePrincipalSourceProof} from './sourceFrameReplay';
import {sameSketchSaveFrame,hasOnlyUnconsumedSketchHistory} from './unconsumedSketchSave.mjs';
import {runSourceFramePreparation} from 'sketcher/headless/sourceFrameClient';
import workerUrl from 'codi-headless-sketch-worker';
const aborted=Function.call.bind(Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted')!.get!);
const listen=Function.call.bind(EventTarget.prototype.addEventListener),unlisten=Function.call.bind(EventTarget.prototype.removeEventListener);
const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
const abort=(committed=false)=>Object.assign(new DOMException('Principal placement was cancelled or superseded.','AbortError'),{committed});
function options(value:any={}){const keys=Reflect.ownKeys(value||{});if(keys.some(k=>typeof k!=='string'||!['signal','valid'].includes(k)))fail('INVALID_REQUEST','Invalid placement lifetime.');const p:any=fields(value,keys as string[]);if(p.valid!==undefined&&typeof p.valid!=='function')fail('INVALID_REQUEST','Invalid placement lifetime.');if(p.signal!==undefined)aborted(p.signal);return p;}

// All callbacks are the actual private Craft coordinator, not caller hooks.
export function createPrincipalPlanePlacementCommands(ctx:any,readContext:()=>any,readBasis:any,prove:any,submit:any,cancelEpoch:any,requireBuild:any){
 let pending=false;
 function job(rawOptions:any={},review?:any){
  const opts=options(rawOptions),craft=ctx.craftService,project=ctx.projectService,manager=ctx.projectManager,storage=ctx.storageService,
    sketches=ctx.sketchStorageService,expressions=ctx.expressionService,registry=ctx.cadRegistry,operations=ctx.operationService,
    state=craft.modifications$.value,history=state.history,models=craft.models$.value,context=readContext(),journal=context.journal,
    generation=project.documentGeneration,signal=project.documentSignal,namespace=project.sketchStorageNamespace,stamp=sketchRevision(storage,namespace),epoch=craft.evaluationEpoch,
    material=manager.inspectMaterialSurfaceRevision(),drawing=manager.getLinkedPartDrawingDefinition(),presentation=manager.getPresentationMetadata(),
    documentRevision=manager.inspectDocumentRevision(),wizard=ctx.wizardService,request=wizard.workingRequest$.value,
    counter=project.counterGenerator,counters=counter.projectCounters,highwater=counters.featureId;
  if(!project.hasHostLifetime||manager.isRestoring||craft.isProcessing||craft.pipelineFailure$.value||craft.engineCleanupFailure$.value||ctx.services.sketcher.inPlaceEditor.inEditMode||manager.unit!=='millimeter')fail('UNAVAILABLE','Use a current idle millimeter part.');
  if(review){const origin=readHistoryReviewApply(review,ctx);if(origin.state!==state||origin.pointer!==state.pointer||origin.entry!==history[state.pointer+1])fail('STALE_HISTORY','The actual wizard review changed.');}
  else if(typeof wizard.hasActiveOperation!=='function'||wizard.hasActiveOperation()!==false)fail('UNAVAILABLE','Finish the active operation draft first.');
  const workbench=ctx.workbenchService.currentWorkbench$.value;if(workbench&&!workbench.internal&&workbench.workbenchId!==ctx.workbenchService.defaultWorkbenchId)fail('UNAVAILABLE','Use the ordinary part workbench.');
  if(expressions.isTyped||expressions.script$.value.trim()||Reflect.ownKeys(expressions.table$.value||{}).length||expressions.errors$.value.length)fail('UNSUPPORTED_PARAMETERS','Principal placement preserves typed/formula intent; this operation requires numeric source history.');
  if(ctx.assemblyService.getConstraints().length||ctx.surfacingService?.scene?.surfaces.length)fail('UNSUPPORTED_HISTORY','Principal placement requires an ordinary part.');
  if(!context.ready||context.state!==state||journal.document!==generation||!Array.isArray(history)||history.length>256)fail('UNAVAILABLE','The complete authored definition is unavailable.');
  const opBindings=new Map();for(const entry of history){if(Object.hasOwn(entry,'suppressed'))fail('UNSUPPORTED_HISTORY','Unsuppressed numeric source history is required.');const op=operations.get(entry.type);if(isSourcePlaneType(entry.type)?!isRegisteredSourcePlane(entry.type,op):!AUTHORED_SOLID_KINDS.includes(entry.type)||typeof op?.run!=='function')fail('UNSUPPORTED_HISTORY','Use registered source and owned-solid operations.');opBindings.set(entry.type,{op,run:op.run,admit:op.admitGeometry});}
  if(!hasOnlyUnconsumedSketchHistory(history,'\u0000'))fail('UNSUPPORTED_HISTORY','The shared structural source provenance guard refused this part.');
  sourceAttachmentDepths(history);const build=genericHistoryBuild(history);
  if(build&&(build.id!=='occ'||build.selectedProfileVersion!==3||requireBuild(build.id,build.revision)!==build))fail('ENGINE_CAPABILITY_UNAVAILABLE','Retain the actual staged modern OCC part build.');
  if(build&&!selectedProfileHistoryBudget(history,build.revision).withinLimit)fail('RESOURCE_LIMIT','The complete part exceeds its recorded replay budget.');
  const inventory=sketches.getAllSketches(),sources=new Map<string,string>(),sourceVersions=new Map();let units=0;
  if(!Array.isArray(inventory)||inventory.length>64)fail('RESOURCE_LIMIT','Principal source inventory exceeds64.');
  for(const row of inventory){const text=sketches.getSketchData(row.id),key=project.sketchStorageKey(row.id),version=storage.versionOf(key);if(typeof row.id!=='string'||!row.id||row.id.length>256||sources.has(row.id)||typeof text!=='string'||text.length>65536||(units+=text.length)>262144||storage.get(key)!==text||version===null)fail('UNRESOLVED_SOURCE','Capture every actual bounded source.');sources.set(row.id,text);sourceVersions.set(row.id,{key,version});}
  const expected=history.filter(e=>isSourcePlaneType(e.type)).map(e=>sourcePlaneFaceId(fid(e.params.featureId)));if(expected.length!==sources.size||new Set(expected).size!==expected.length||expected.some(id=>!sources.has(id)))fail('UNRESOLVED_SOURCE','Saved sources must match genuine authored producers.');
  const services=()=>[ctx.craftService,ctx.projectService,ctx.projectManager,ctx.storageService,ctx.sketchStorageService,ctx.cadRegistry,ctx.expressionService,ctx.operationService,ctx.wizardService,ctx.services.sketcher,ctx.workbenchService,ctx.assemblyService,ctx.surfacingService,ctx.services.craft,ctx.services.projectManager,ctx.services.wizard],saved=services(),
    streams=()=>[craft.modifications$,craft.models$,craft.pipelineFailure$,craft.engineCleanupFailure$,expressions.script$,expressions.list$,expressions.table$,expressions.errors$,wizard.workingRequest$,wizard.state$,ctx.streams.sketcher.sketchingFace,ctx.workbenchService.currentWorkbench$,ctx.assemblyService.constraints$],tracked=streams(),versions=tracked.map(s=>s.revision),
    controller=new AbortController(),scope:{epoch:number|null}={epoch:null},signals=[signal,opts.signal].filter(Boolean),added:any[]=[];
  let settled=false,poll:any;
  const alive=()=>{try{if(opts.valid&&opts.valid()!==true)return false;return !controller.signal.aborted&&!aborted(signal)&&(opts.signal===undefined||!aborted(opts.signal))&&ctx.craftService===craft&&ctx.projectService===project&&ctx.projectManager===manager&&project.documentSignal===signal&&project.hasHostLifetime&&project.isDocumentCurrent(generation);}catch{return false;}};
  const current=()=>{
   const next=readContext();if(!alive()||manager.isRestoring||ctx.services.sketcher.inPlaceEditor.inEditMode||services().some((v,i)=>v!==saved[i])||streams().some((s,i)=>s!==tracked[i]||s.revision!==versions[i])||
     craft.modifications$.value!==state||craft.models$.value!==models||next.state!==state||next.journal!==journal||next.signature!==context.signature||!next.ready||
     craft.evaluationEpoch!==(scope.epoch===null?epoch:scope.epoch)||project.sketchStorageNamespace!==namespace||sketchRevision(storage,namespace)!==stamp||
     manager.inspectMaterialSurfaceRevision()!==material||manager.getLinkedPartDrawingDefinition()!==drawing||manager.getPresentationMetadata()!==presentation||manager.inspectDocumentRevision()!==documentRevision||
     counter!==project.counterGenerator||counter.projectCounters!==counters||counters.featureId!==highwater)throw abort();
   for(const[type,r]of opBindings){const op=operations.get(type);if(op!==r.op||op.run!==r.run||op.admitGeometry!==r.admit)throw abort();}
   const now=sketches.getAllSketches();if(now.length!==sources.size||now.some(r=>!sources.has(r.id)))throw abort();for(const[id,text]of sources){const r=sourceVersions.get(id);if(storage.versionOf(r.key)!==r.version||storage.get(r.key)!==text||sketches.getSketchData(id)!==text)throw abort();}
   if(review){if(readHistoryReviewApply(review,ctx).state!==state||wizard.workingRequest$.value!==request)throw abort();}else if(wizard.hasActiveOperation()!==false)throw abort();
  };
  const stop=()=>{controller.abort();if(!settled&&scope.epoch!==null)cancelEpoch(scope.epoch);};
  try{for(const s of signals){added.push(s);listen(s,'abort',stop,{once:true});if(aborted(s))stop();}poll=setInterval(()=>{try{current();}catch{stop();}},100);current();}catch(error){for(const s of added)unlisten(s,'abort',stop);clearInterval(poll);throw error;}
  return {ctx,craft,project,manager,storage,sketches,state,history,models,context,journal,generation,epoch,scope,signal:controller.signal,sources,build,stamp,material,current,alive,review,
    input(captured:any){return{history:captured.history,endIndex:captured.history.length-1,epoch,generation,project,signal:controller.signal,valid:()=>{try{current();return true;}catch{return false;}},operations:new Map([...opBindings].map(([type,r]:any)=>[type,{descriptor:r.op,run:r.run,admit:r.admit}])),requireCurrent:current};},
    dispose(){settled=true;clearInterval(poll);for(const s of added)unlisten(s,'abort',stop);}};
 }
 function reviewed(j:any){if(j.state.pointer===j.history.length-1)return;const p=j.journal.entries[j.journal.cursor-1];if(p?.kind!=='history-position'||p.afterPointer!==j.state.pointer||p.beforeSignature!==j.context.signature||p.afterSignature!==j.context.signature)fail('STALE_HISTORY','Use the actual applied registered history position.');}
 const run=(j:any,input:any)=>runSourceFramePreparation(workerUrl,{revision:crypto.randomUUID(),...input},{signal:j.signal,valid:()=>{try{j.current();return true;}catch{return false;}}});
 async function sources(j:any,next:any[],rows:any[],targets:any[]=[]){
  const frames=new Map(),changes:any[]=[],prepared:any[]=[],deferred=nativeSourceDescendants(next);
  for(let index=0;index<next.length;index++){const entry=next[index];if(!isSourcePlaneType(entry.type))continue;const featureId=fid(entry.params.featureId),old=rows.find(r=>r.index===index&&r.featureId===featureId);if(!old)fail('UNRESOLVED_SOURCE','The original complete source basis is unavailable.');let frame:any;
   if(entry.type==='PLANE'){const before=(await run(j,{mode:'principal',parameters:old.parameters})).frame;if(!sameSketchSaveFrame(before,old.frame))fail('STALE_FRAME','The original principal source differs from its authored orientation/depth.');frame=(await run(j,{mode:'principal',parameters:captureSourcePlaneParameters(entry.params)})).frame;}
   else{if(deferred.has(featureId))continue;const p=captureSourceFrameParameters(entry.params),parent=p.parent?frames.get(p.parent.featureId):null;if(p.parent&&(!parent||parent.id!==p.parent.faceId))fail('INVALID_FRAME_DEPENDENCY','The actual earlier source parent changed.');frame=(await run(j,{mode:'derive',parameters:p,parentFrame:parent?.frame||null})).frame;}
   const target=targets.find(r=>r.faceId===old.id),reply=await run(j,{mode:'reframe',sketchJSON:old.data,beforeFrame:old.frame,afterFrame:frame,candidateJSON:target?.after??null});j.current();if(target&&reply.serializedSketch!==target.after)fail('INTENT_CHANGED','Source travel changed its recorded bytes.');
   if(reply.serializedSketch!==old.data)changes.push(Object.freeze({faceId:old.id,before:old.data,after:reply.serializedSketch}));prepared.push(Object.freeze({id:old.id,index,frame}));frames.set(featureId,{id:old.id,frame});
  }return{changes:Object.freeze(changes),frames:Object.freeze(prepared)};
 }
 async function execute(input:any,rawOptions:any={},review?:any,travel?:any){
  if(pending)fail('BUSY','A principal placement request is pending.');pending=true;let j:any,basis:any,proof:any;
  try{
   j=job(rawOptions,review);let a:any;
   if(review){const origin=readHistoryReviewApply(review,ctx),index=j.state.pointer+1,beforeOperation=j.history[index];if(beforeOperation?.type!=='PLANE')fail('UNSUPPORTED_PLANE','The real wizard is not a principal PLANE.');a=capturePrincipalPlanePlacementDraft({revision:j.craft.inspectAuthoredEdits().revision,index,featureId:fid(beforeOperation.params.featureId),faceId:sourcePlaneFaceId(fid(beforeOperation.params.featureId)),beforeOperation,draft:origin.wizard.workingRequest$.value.params}).request;}
   else a=capturePrincipalPlanePlacementRequest(input);
   if(a.revision!==j.craft.inspectAuthoredEdits().revision)fail('STALE_HISTORY','The inspected principal placement changed.');const beforeOperation=j.history[a.index];if(beforeOperation?.type!=='PLANE'||fid(beforeOperation.params.featureId)!==a.featureId||sourcePlaneFaceId(a.featureId)!==a.faceId||!j.sources.has(a.faceId))fail('STALE_SOURCE','Choose the actual inspected principal source.');
   const before=captureSourcePlaneParameters(beforeOperation.params);if(!travel?.reviewPosition)reviewed(j);if(j.state.pointer<j.history.length-1&&j.state.pointer!==a.index-1)fail('UNAVAILABLE','Review the actual target PLANE as the next feature.');
   const captured=await captureAuthoredHistory(j.history,j.current);j.current();const next=[...captured.history],afterOperation={type:'PLANE',params:{...before,orientation:a.orientation,depth:a.depth}},changed=before.orientation!==a.orientation||before.depth!==a.depth;
   if(!changed){if(travel)fail('STALE_HISTORY','Source travel must change placement.');if(j.state.pointer===next.length-1){j.current();return Object.freeze({changed:false,committed:false,revision:a.revision,unit:'millimeter',index:a.index,featureId:a.featureId,faceId:a.faceId,orientation:before.orientation,depth:before.depth,pointer:j.state.pointer,authoredUndo:false,persistence:'volatile-workspace'});}return await submit({job:j,request:a,nextCapture:captured,positionOnly:true,pointer:next.length-1});}
   next[a.index]=afterOperation;const nextCapture=await captureAuthoredHistory(next,j.current);j.current();let rows:any;
   if(j.state.pointer===j.history.length-1)rows=acceptedPrincipalSourceRows(ctx,j.current);else{basis=await readBasis(j.input(captured));j.current();rows=readPrincipalSourceBasis(basis,ctx);}
   const graph=await sources(j,nextCapture.history,rows,travel?.sketches||[]);j.current();const permit=issueNativeSourceReplay(ctx,{history:nextCapture.history,kind:'source-frame',direction:travel?.direction,expectedSketches:travel?.sketches,sourceBasis:basis,requireCurrent:j.current});basis=null;
   const pointer=travel?.pointer??nextCapture.history.length-1,reviewPosition=travel?.reviewPosition||(j.state.pointer===j.history.length-1?undefined:capturePrincipalPlaneReviewPosition({beforePointer:j.state.pointer,afterPointer:nextCapture.history.length-1,beforeSignature:captured.signature,afterSignature:nextCapture.signature},{index:a.index,historyLength:nextCapture.history.length}));
   if(pointer!==nextCapture.history.length-1){proof=await prove({...j.input(nextCapture),sketchOverrides:graph.changes.map(r=>({id:r.faceId,data:r.after})),nativeSourceReplay:permit},permit);j.current();}
   return await submit({job:j,request:a,nextCapture,beforeOperation,afterOperation,graph,permit:proof?undefined:permit,proof,pointer,reviewPosition,travel});
  }finally{if(basis)releasePrincipalSourceBasis(basis);if(proof)releasePrincipalSourceProof(proof);j?.dispose();pending=false;}
 }
 function inspectSourcePlanePlacements(){
  let j:any;try{if(pending)fail('BUSY','A principal placement is pending.');j=job();const revision=j.craft.inspectAuthoredEdits().revision,features=j.history.flatMap((entry:any,index:number)=>{
   if(entry.type!=='PLANE')return[];const featureId=fid(entry.params.featureId),faceId=sourcePlaneFaceId(featureId);let p:any,reason:any=null;try{p=captureSourcePlaneParameters(entry.params);if(j.state.pointer<j.history.length-1){reviewed(j);if(j.state.pointer!==index-1)reason='REVIEW_DIFFERENT_FEATURE';}}catch{reason='UNSUPPORTED_PARAMETERS';}
   return[Object.freeze({index,featureId,faceId,orientation:p?.orientation??null,depth:p?.depth??null,canEdit:!reason,reason})];
  });j.current();return Object.freeze({version:1,unit:'millimeter',revision,ready:features.some(r=>r.canEdit),reason:features.some(r=>r.canEdit)?null:'NO_SUPPORTED_PRINCIPAL_SOURCE',pointer:j.state.pointer,features:Object.freeze(features),scope:'numeric-principal-placement-v1'});
  }catch{const craft=ctx.craftService,state=craft.modifications$.value,features=Array.isArray(state.history)&&state.history.length<=256?state.history.flatMap((e:any,index:number)=>{if(e.type!=='PLANE')return[];let featureId:any=null,faceId:any=null;try{featureId=fid(e.params.featureId);faceId=sourcePlaneFaceId(featureId);}catch{}return[Object.freeze({index,featureId,faceId,orientation:['XY','XZ','ZY'].includes(e.params?.orientation)?e.params.orientation:null,depth:typeof e.params?.depth==='number'?e.params.depth:null,canEdit:false,reason:'PRINCIPAL_PLACEMENT_UNAVAILABLE'})];}):[];return Object.freeze({version:1,unit:'millimeter',revision:craft.inspectAuthoredEdits().revision,ready:false,reason:'PRINCIPAL_PLACEMENT_UNAVAILABLE',pointer:state.pointer,features:Object.freeze(features),scope:'numeric-principal-placement-v1'});}finally{j?.dispose();}}
 async function setSourceFrameHistoryPrefix(input:any,opts:any={}){
  if(pending)fail('BUSY','A principal source/history request is pending.');pending=true;let j:any;try{const a:any=fields(input,['revision','afterFeatureId']);j=job(opts);if(a.revision!==j.craft.inspectAuthoredEdits().revision)fail('STALE_HISTORY','The position revision changed.');const pointer=a.afterFeatureId===null?-1:j.history.findIndex(row=>fid(row.params.featureId)===a.afterFeatureId);if(pointer< -1||a.afterFeatureId!==null&&pointer<0)fail('INVALID_FEATURE','Choose an actual authored feature.');const captured=await captureAuthoredHistory(j.history,j.current);j.current();if(pointer===j.state.pointer)return Object.freeze({changed:false,revision:a.revision,pointer,afterFeatureId:a.afterFeatureId});return await submit({job:j,nextCapture:captured,positionOnly:true,pointer});}finally{j?.dispose();pending=false;}
 }
 function inspectSourceFramePositionHistory(){let j:any;try{if(pending)fail('BUSY','A principal source/history preparation is pending.');j=job();const revision=j.craft.inspectAuthoredEdits().revision,features=j.history.map((entry:any,index:number)=>Object.freeze({index,featureId:fid(entry.params.featureId),type:entry.type,state:'active',canSuppress:false,canUnsuppress:false,reason:'POSITION_ONLY_SOURCE_FRAME_HISTORY'}));j.current();return Object.freeze({version:1,revision,geometryRevision:j.craft.inspectWorkerSolids().revision,ready:true,unit:'millimeter',engine:j.build?.id??null,engineRevision:j.build?.revision??null,pointer:j.state.pointer,afterFeatureId:j.state.pointer<0?null:fid(j.history[j.state.pointer].params.featureId),fullTipIndex:j.history.length-1,canBranch:false,branchReason:'SOURCE_FRAME_POSITION_ONLY',features:Object.freeze(features),authoredUndo:'shared-session-journal-v1',scope:'numeric-source-frame-position-v1'});}finally{j?.dispose();}}
 // Cancel authenticates accepted origin/head only. It intentionally does NOT
 // capture, parse, materialize or validate any edited placement field.
 function validateSourceFrameReview(capture:any){let j:any;try{j=job({},capture);reviewed(j);j.current();}finally{j?.dispose();}}
 async function travelSourceFrameHistoryPosition(args:any,opts:any,plan:any){
  if(pending)fail('BUSY','A source/history request is pending.');pending=true;let j:any;
  try{j=job(opts);if(args.revision!==j.craft.inspectAuthoredEdits().revision||plan.entry?.kind!=='history-position'||plan.signature!==j.context.signature)fail('STALE_HISTORY','The registered position changed.');
   const captured=await captureAuthoredHistory(j.history,j.current);j.current();return await submit({job:j,nextCapture:captured,positionOnly:true,pointer:plan.pointer,positionTravel:plan});
  }finally{j?.dispose();pending=false;}
 }
 return Object.freeze({inspectSourcePlanePlacements,editSourcePlanePlacement:(a:any,o:any={})=>execute(a,o),applyPrincipalPlaneDraft:(capture:any,o:any={})=>execute(null,o,capture),
  travelPrincipalPlanePlacement:(args:any,o:any,plan:any)=>execute({revision:args.revision,index:plan.index,featureId:plan.featureId,faceId:plan.faceId,orientation:plan.afterOperation.params.orientation,depth:plan.afterOperation.params.depth},o,undefined,{...plan,direction:args.direction}),
  setSourceFrameHistoryPrefix,inspectSourceFramePositionHistory,travelSourceFrameHistoryPosition,validateSourceFrameReview});
}
