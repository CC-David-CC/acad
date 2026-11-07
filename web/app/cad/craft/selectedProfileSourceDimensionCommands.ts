import {runSketchTransition,verifyDrivingDimensionCandidate} from 'sketcher/headless/transitionClient';
import {runSketchSolve} from 'sketcher/headless/client';
import {captureDrivingDimensionIntent} from 'sketcher/headless/drivingDimensionTarget.mjs';
import {captureSketchFailure} from 'sketcher/constr/admissionCause.mjs';
import {runPrismSemantic} from 'engine/extrusion/prismSemanticClient';
import {captureSelectedRegionCurveIds,captureSelectedRegionInspection} from 'engine/extrusion/selectedRegionDescriptor.mjs';
import {captureSelectedProfileSolve} from 'workbenches/modeler/features/workerSelectedProfile/workerSelectedProfile.operation';
import {requireSelectedProfileBuild,selectedProfileVersion} from 'engine/mount/selectedProfileBuildSelection.mjs';
import {selectedProfileHistoryBudget} from 'engine/mount/selectedProfileBudget.mjs';
import {captureSelectedProfileDepthParameters,captureSelectedProfileSourceDimensionEdit} from './authoredEditJournal.mjs';
import {captureAuthoredHistory} from './captureAuthoredHistory.mjs';
import {sketchRevision} from './sketchRevision.mjs';
import {sketchBoundaryFrame} from '../sketch/boundaryValidity';
import {getSketchBoundaries} from '../sketch/sketchBoundaries';
import {MOpenFaceShell} from '../model/mopenFace';
import {PreparedSketchCommand} from './rectangleCreation';
import sketchWorker from 'codi-headless-sketch-worker';
import semanticWorker from 'codi-prism-semantic-worker';

const PARAMS=['version','unit','engine','engineRevision','featureId','faceId','regionId','depth','bodyPolicy'];
const BASE=['revision','sourceRevision','index','featureId','constraintId','value'];
const ABORTED=Function.call.bind(Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get);
const LISTEN=Function.call.bind(EventTarget.prototype.addEventListener),UNLISTEN=Function.call.bind(EventTarget.prototype.removeEventListener);
const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
const abort=(committed=false)=>Object.assign(new DOMException(committed?'Combined source/region edit committed before its caller changed.':'Combined source/region edit was cancelled or superseded.','AbortError'),{committed});
function fields(value:any,keys:string[]){const p=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;if(!value||typeof value!=='object'||Array.isArray(value)||(p!==null&&Object.getPrototypeOf(p)!==null)||Reflect.ownKeys(value).length!==keys.length)fail('INVALID_REQUEST','Expected exact combined source/region data.');const r:any={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(value,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','Combined source/region fields must be own data.');r[k]=d.value;}return r;}
function options(value:any={}){const keys=Reflect.ownKeys(value||{});if(keys.some(k=>typeof k!=='string'||!['signal','valid'].includes(k)))fail('INVALID_REQUEST','Invalid combined edit options.');const r=fields(value,keys as string[]);if(r.valid!==undefined&&typeof r.valid!=='function')fail('INVALID_REQUEST','Invalid lifetime guard.');if(r.signal!==undefined)try{ABORTED(r.signal);}catch{fail('INVALID_REQUEST','Expected native cancellation.');}return Object.freeze(r);}
function intent(value:any,edit=false){const a=fields(value,edit?[...BASE,'regionId','candidateSourceDigest']:BASE);if(['revision','sourceRevision'].some(k=>typeof a[k]!=='string'||!a[k]||a[k].length>256)||!Number.isSafeInteger(a.index)||a.index<0||a.index>255||!Number.isSafeInteger(a.featureId)||a.featureId<1)fail('INVALID_REQUEST','Use inspected feature/source revisions and identity.');const d=captureDrivingDimensionIntent({constraintId:a.constraintId,value:a.value},'edit');if(typeof d.value!=='number')fail('UNSUPPORTED_PARAMETERS','Combined edits require literal canonical millimeters.');if(edit&&(typeof a.regionId!=='string'||!a.regionId||a.regionId.length>8192||typeof a.candidateSourceDigest!=='string'||!/^[a-f0-9]{64}$/.test(a.candidateSourceDigest)))fail('INVALID_REQUEST','Choose a proposed region and candidate digest.');return Object.freeze(a);}
function bounded(text:any){if(typeof text!=='string'||!text||text.length>65536||new TextEncoder().encode(text).byteLength>65536)fail('RESOURCE_LIMIT','Selected-profile source exceeds64KiB.');return text;}
function frameCopy(face:any){const f=sketchBoundaryFrame(face),r:any={};for(const k of ['origin','x','y','z']){if(!Array.isArray(f[k])||f[k].length!==3||!f[k].every(Number.isFinite))fail('UNSUPPORTED_FACE','The source frame is unavailable.');r[k]=Object.freeze([...f[k]]);}return Object.freeze(r);}
function workerFailure(result:any){const e=captureSketchFailure(result.error);return Object.assign(Error(e.message),{code:e.code,...(e.cause?{cause:e.cause}:{})});}
function asset(value:string){const u=new URL(value,globalThis.location.href);if(u.origin!==globalThis.location.origin||!['http:','https:'].includes(u.protocol)||u.search||u.hash)fail('INVALID_REQUEST','Use trusted same-origin Workers.');return u.pathname;}

// Public inspection drops its private proposal; commit independently recomputes
// it. No source bytes, solver model, native handle or proposal factory is public.
export function createSelectedProfileSourceDimensionCommands(ctx:any,submitPreparedReplay:any,cancelEpoch:(epoch:number)=>void){
 if(typeof submitPreparedReplay!=='function'||typeof cancelEpoch!=='function')fail('UNAVAILABLE','The existing prepared replay coordinator is required.');let pending=0;
 function begin(a:any,opts:any){
  const craft=ctx.craftService,project=ctx.projectService,storage=ctx.storageService,sketches=ctx.sketchStorageService,registry=ctx.cadRegistry,manager=ctx.projectManager,e=ctx.expressionService,
   historyMethod=craft.inspectSelectedProfileHistory,sourceMethod=craft.inspectSketchTransitions,inspectMethod=craft.inspectClosedSketch;
  if([historyMethod,sourceMethod,inspectMethod].some(m=>typeof m!=='function'))fail('UNAVAILABLE','Shared source/feature discovery is unavailable.');
  const h=historyMethod(),s=sourceMethod(),state=craft.modifications$.value,entries=state.history,models=craft.models$.value;
  if(!h.ready||!s.ready)fail('UNAVAILABLE',h.reason||s.reason||'Return to a valid accepted history.');if(a.revision!==h.revision||a.sourceRevision!==s.revision)fail('STALE_HISTORY','The feature or source revision is stale.');
  if(!project.hasHostLifetime||manager.unit!=='millimeter'||manager.isRestoring||e.isTyped||e.script$.value.trim()||Reflect.ownKeys(e.table$.value||{}).length)fail('UNSUPPORTED_PARAMETERS','Use an owned millimeter part without project parameter bindings.');
  if(typeof manager.hasManufacturingMetadata!=='function'||manager.hasManufacturingMetadata())fail('UNSUPPORTED_MANUFACTURING_METADATA','Assigned manufacturing metadata is outside this source slice.');
  if(!Array.isArray(entries)||entries.length>256||state.pointer!==entries.length-1||ctx.assemblyService.getConstraints().length)fail('UNSUPPORTED_HISTORY','Use a bounded current part history without assembly constraints.');
  const listed=h.features.find((r:any)=>r.index===a.index&&r.featureId===a.featureId),entry=entries[a.index];if(!listed||entry?.type!=='WORKER_SELECTED_PROFILE_EXTRUDE_V2')fail('INVALID_FEATURE','Choose the actual existing selected extrusion.');
  const parameters:any=captureSelectedProfileDepthParameters(entry.params);if(parameters.featureId!==a.featureId||PARAMS.some(k=>listed[k]!==parameters[k]))fail('INVALID_FEATURE','The selected feature changed.');
  const build=requireSelectedProfileBuild(parameters.engine,parameters.engineRevision);if(selectedProfileVersion(build)!==3)fail('UNSUPPORTED_PROFILE_BUILD','Combined source repair requires the recorded version3 profile build.');const budget=selectedProfileHistoryBudget(entries,build.revision);if(!budget.withinLimit)fail(budget.reason||'RESOURCE_LIMIT','The existing replay exceeds its budget.');
  if(!s.candidates.some((r:any)=>r.faceId===parameters.faceId))fail('UNSUPPORTED_SOURCE','The current closed source is unavailable.');
  const face=registry.findFace(parameters.faceId),plane=face?.root;if(!(plane instanceof MOpenFaceShell)||plane.face!==face||face.isPlaneBased!==true||face.defaultSketchId!==parameters.faceId)fail('UNSUPPORTED_FACE','Use the owned independent source plane.');
  const source=bounded(sketches.getSketchData(parameters.faceId)),frame=frameCopy(face),frameText=JSON.stringify(frame),boundary=getSketchBoundaries(face);if(Object.values(boundary).some((v:any)=>!Array.isArray(v)||v.length))fail('UNSUPPORTED_SOURCE','Referenced model boundaries are outside this source slice.');
  const generation=project.documentGeneration,documentSignal=project.documentSignal,namespace=project.sketchStorageNamespace,key=project.sketchStorageKey(parameters.faceId),version=storage.versionOf(key),stamp=sketchRevision(storage,namespace),epoch=craft.evaluationEpoch,material=manager.inspectMaterialSurfaceRevision(),script=e.script$.value,table=e.table$.value;
  if(!Number.isSafeInteger(version)||version<1)fail('UNSUPPORTED_SOURCE','A versioned source sketch is required.');
  const services=()=>[ctx.craftService,ctx.projectService,ctx.storageService,ctx.sketchStorageService,ctx.cadRegistry,ctx.projectManager,ctx.expressionService,ctx.operationService,ctx.services.sketcher,ctx.wizardService,ctx.workbenchService,ctx.assemblyService],savedServices=services();
  const streams=()=>[craft.modifications$,craft.models$,craft.pipelineFailure$,craft.engineCleanupFailure$,e.script$,e.table$,e.list$,e.errors$,ctx.streams.sketcher.sketchingFace,ctx.wizardService.workingRequest$,ctx.workbenchService.currentWorkbench$,ctx.assemblyService.constraints$],savedStreams=streams(),versions=savedStreams.map(v=>v.revision);
  const controller=new AbortController(),scope:{epoch:number|null}={epoch:null};let done=false,workspace:any=null,signature:string=null,capturedHistory:any=null;
  const alive=()=>{try{return !done&&!ABORTED(controller.signal)&&(!opts.signal||!ABORTED(opts.signal))&&(!opts.valid||opts.valid()===true)&&!ABORTED(controller.signal)&&(!opts.signal||!ABORTED(opts.signal))&&services().every((v,i)=>v===savedServices[i])&&project.hasHostLifetime&&project.isDocumentCurrent(generation)&&project.documentSignal===documentSignal&&!ABORTED(documentSignal);}catch{return false;}};
  const current=()=>{
   if(!alive()||craft.evaluationEpoch!==(scope.epoch===null?epoch:scope.epoch)||craft.modifications$.value!==state||state.history!==entries||craft.models$.value!==models||state.pointer!==entries.length-1||streams().some((v,i)=>v!==savedStreams[i]||v.revision!==versions[i])||project.sketchStorageNamespace!==namespace||storage.versionOf(key)!==version||sketchRevision(storage,namespace)!==stamp||sketches.getSketchData(parameters.faceId)!==source||registry.findFace(parameters.faceId)!==face||face.root!==plane||plane.face!==face||face.isPlaneBased!==true||face.defaultSketchId!==parameters.faceId||JSON.stringify(frameCopy(face))!==frameText||manager.unit!=='millimeter'||manager.isRestoring||manager.inspectMaterialSurfaceRevision()!==material||manager.hasManufacturingMetadata()||e.isTyped||e.script$.value!==script||e.table$.value!==table||Reflect.ownKeys(table).length||craft.inspectSelectedProfileHistory!==historyMethod||craft.inspectSketchTransitions!==sourceMethod||craft.inspectClosedSketch!==inspectMethod)throw abort();
   const p:any=captureSelectedProfileDepthParameters(entries[a.index]?.params);if(PARAMS.some(k=>p[k]!==parameters[k]))throw abort();
   // Own replay advances the geometry inspection token before publication;
   // strong captured state/source guards still span that expected transition.
   if(scope.epoch===null&&(historyMethod().revision!==a.revision||sourceMethod().revision!==a.sourceRevision))throw abort();
  };
  const stop=()=>{controller.abort();if(!done&&scope.epoch!==null)cancelEpoch(scope.epoch);},signals=[...new Set([documentSignal,opts.signal].filter(Boolean))];let timer:any;
  const dispose=()=>{if(done)return;done=true;let failure:any=null;const clean=(f:()=>void)=>{try{f();}catch(cause){if(failure===null)failure={cause};}};clean(()=>clearInterval(timer));for(const signal of signals)clean(()=>UNLISTEN(signal,'abort',stop));clean(()=>workspace?.discard());if(failure)try{console.error('Combined source edit cleanup release unconfirmed',failure.cause);}catch{}};
  try{for(const signal of signals){ABORTED(signal);LISTEN(signal,'abort',stop,{once:true});if(ABORTED(signal))stop();}timer=setInterval(()=>{if(!alive())stop();},100);current();}catch(error){dispose();throw error;}
  const solveOptions={signal:controller.signal,valid:()=>{try{current();return true;}catch{return false;}}};
  const start=async()=>{current();const c=await captureAuthoredHistory(entries,current);signature=c.signature;capturedHistory=c.history;current();};
  const recheck=async()=>{if(!signature||(await captureAuthoredHistory(entries,current)).signature!==signature)throw abort();current();};
  const prepare=async(after:string,regionId:string)=>{
   await recheck();const expected=await captureAuthoredHistory(capturedHistory,current);expected.history[a.index].params.regionId=regionId;const candidate=await captureAuthoredHistory(expected.history,current);current();
   const preparation:PreparedSketchCommand={candidateScope:scope,sketchOverrides:Object.freeze([Object.freeze({id:parameters.faceId,data:after})]),sketchSourceFrames:Object.freeze([Object.freeze({id:parameters.faceId,frame})]),requireCurrent:current,requireCommittedCurrent(){if(!alive())throw abort(true);},async prepare(_models:any[],next:any){current();if((await captureAuthoredHistory(next.history,current)).signature!==candidate.signature)throw abort();current();workspace=storage.prepareWrites([{key,value:after}]);return workspace;}};
   return preparation;
  };
  return{parameters,source,frame,boundary,current,alive,dispose,solveOptions,start,recheck,prepare,craft,inspectMethod};
 }
 async function discover(job:any,after:string){
  bounded(after);const solved:any[]=[];
  for(let i=0;i<2;i++){
   job.current();const revision=crypto.randomUUID(),r:any=await runSketchSolve(asset(sketchWorker),{task:'rectangle-extrusion-solve',revision,sketchJSON:after,boundary:job.boundary,externalParameters:{}},job.solveOptions);job.current();if(!r?.ok)throw workerFailure(r);
   solved.push({...captureSelectedProfileSolve(r,revision),curveIds:captureSelectedRegionCurveIds(r.sketch)});
  }
  if(solved[0].source!==solved[1].source||solved[0].digest!==solved[1].digest||solved[0].evidence!==solved[1].evidence)fail('INVALID_RESPONSE','Independent proposed source reconstructions disagree.');
  const revision=crypto.randomUUID(),profile={unit:'millimeter',engine:'occ',profileVersion:3,revision,sketchDigest:solved[0].digest,faceId:job.parameters.faceId,frame:job.frame,depth:job.parameters.depth,sketchJSON:solved[0].source},expected={revision,sketchDigest:profile.sketchDigest,faceId:profile.faceId},rows:any[]=[];
  for(let i=0;i<2;i++){const result=await runPrismSemantic(asset(semanticWorker),{kind:'inspect-selected',profile},{...job.solveOptions,timeoutMs:30000});job.current();rows.push(captureSelectedRegionInspection(result,expected,solved[0].curveIds,true));}
  if(JSON.stringify(rows[0])!==JSON.stringify(rows[1]))fail('INVALID_RESPONSE','Independent proposed regions disagree.');await job.recheck();return{sourceDigest:profile.sketchDigest,regions:rows[0].regions,sourceAnalysis:rows[0].sourceAnalysis};
 }
 async function proposed(a:any,opts:any){const job=begin(a,opts);try{
  await job.start();const inspected=await job.inspectMethod({revision:a.sourceRevision,faceId:job.parameters.faceId},{signal:job.solveOptions.signal,valid:job.solveOptions.valid});job.current();if(!inspected.dimensionTargets.some((r:any)=>r.constraintId===a.constraintId&&r.canEdit&&r.unit==='millimeter'))fail('INVALID_TARGET','Choose an actual supported driving source dimension.');
  const revision=crypto.randomUUID(),request={revision,sketchJSON:job.source,externalParameters:{},action:'edit',intent:{constraintId:a.constraintId,value:a.value}},r:any=await runSketchTransition(sketchWorker,'sketch-transition-driving-dimension',request,job.solveOptions);job.current();if(!r?.ok)throw workerFailure(r);if(r.revision!==revision||r.changed!==true)fail('UNCHANGED_DIMENSION','Use the ordinary region command when the dimension is unchanged.');bounded(r.serializedSketch);
  const proof:any=await verifyDrivingDimensionCandidate(sketchWorker,{...request,candidateJSON:r.serializedSketch},job.solveOptions);job.current();if(!proof?.ok)throw workerFailure(proof);if(proof.revision!==revision||proof.verified!==true)fail('INVALID_RESPONSE','Independent dimension verification failed.');const discovery=await discover(job,r.serializedSketch);
  return{job,after:r.serializedSketch,dimension:r.dimension,discovery};
 }catch(error){job.dispose();throw error;}}
 function response(a:any,p:any){return Object.freeze({revision:a.revision,sourceRevision:a.sourceRevision,index:a.index,...p.job.parameters,constraintId:a.constraintId,value:a.value,candidateSourceDigest:p.discovery.sourceDigest,dimension:p.dimension,sourceFrame:p.job.frame,regions:p.discovery.regions,sourceAnalysis:p.discovery.sourceAnalysis,dependencyCompatibility:'requires-atomic-full-replay',proposalCustody:'recomputed-from-current-source'});}
 async function inspectSelectedProfileSourceDimensionRegions(input:any,rawOptions?:any){const a=intent(input),opts=options(rawOptions);if(pending>=2)fail('BUSY','Too many combined source proposals.');pending++;let p:any;try{p=await proposed(a,opts);return response(a,p);}finally{p?.job.dispose();pending--;}}
 async function submit(job:any,request:any,direction?:string){
  const edit=captureSelectedProfileSourceDimensionEdit(request),prepared=await job.prepare(edit.after,edit.regionId);job.current();
  await new Promise<void>((yes,no)=>submitPreparedReplay(yes,no,prepared,{kind:'selected-profile-source-dimension',...edit,...(direction?{direction}:{})}));
  if(!job.alive())throw abort(true);
  const entry=job.craft.modifications$.value.history[edit.index],parameters:any=entry?.type==='WORKER_SELECTED_PROFILE_EXTRUDE_V2'?captureSelectedProfileDepthParameters(entry.params):null;
  if(!parameters||PARAMS.some(k=>parameters[k]!== (k==='regionId'?edit.regionId:edit.parameters[k]))||ctx.sketchStorageService.getSketchData(edit.parameters.faceId)!==edit.after)throw abort(true);
  const revision=job.craft.inspectAuthoredEdits().revision;if(!job.alive())throw abort(true);
  return Object.freeze({changed:true,revision,index:edit.index,featureId:edit.featureId,faceId:edit.parameters.faceId,regionId:edit.regionId,unit:'millimeter',authoredUndo:true,persistence:'volatile-workspace',manufacturingAssignments:'unchanged'});
 }
 async function editSelectedProfileSourceDimensionRegion(input:any,rawOptions?:any){const a=intent(input,true),opts=options(rawOptions);if(pending)fail('BUSY','A combined source request is pending.');pending++;let p:any;try{
  p=await proposed(a,opts);if(p.discovery.sourceDigest!==a.candidateSourceDigest)fail('STALE_PROPOSAL','The proposed digest differs from current independent reconstruction.');
  const row=p.discovery.regions.find((r:any)=>r.regionId===a.regionId);if(!row)fail('STALE_REGION','Choose a region listed for the proposed source.');if(row.support!=='supported')fail('UNSUPPORTED_REGION',row.reason?.message||'The proposed region is unsupported.');
  return await submit(p.job,{index:a.index,featureId:a.featureId,parameters:p.job.parameters,before:p.job.source,after:p.after,regionId:a.regionId,dimension:{constraintId:a.constraintId,value:a.value}});
 }finally{p?.job.dispose();pending--;}}
 // Craft alone calls this with the actual current journal plan. Both directions
 // independently verify one complete dimension delta and rediscover its region.
 async function travelSelectedProfileSourceDimension(args:any,rawOptions:any,plan:any){
  const opts=options(rawOptions),source=ctx.craftService.inspectSketchTransitions(),a={revision:args.revision,sourceRevision:source.revision,index:plan.index,featureId:plan.featureId,constraintId:plan.dimension.constraintId,value:plan.dimension.value};
  if(pending)fail('BUSY','A combined source request is pending.');pending++;let job:any;try{
   job=begin(a,opts);if(!['undo','redo'].includes(args.direction)||job.source!==plan.before||PARAMS.some(k=>job.parameters[k]!==plan.parameters[k]))throw abort();await job.start();
   const revision=crypto.randomUUID(),proof:any=await verifyDrivingDimensionCandidate(sketchWorker,{revision,sketchJSON:job.source,candidateJSON:bounded(plan.after),externalParameters:{}},job.solveOptions,true);job.current();if(!proof?.ok)throw workerFailure(proof);if(proof.revision!==revision||proof.verified!==true)fail('INVALID_RESPONSE','The journal pair is not an independently verified dimension edit.');
   const d=await discover(job,plan.after),row=d.regions.find((r:any)=>r.regionId===plan.regionId);if(!row||row.support!=='supported')fail('UNSUPPORTED_REGION','The journal target region is no longer supported.');
   return await submit(job,{index:plan.index,featureId:plan.featureId,parameters:job.parameters,before:job.source,after:plan.after,regionId:plan.regionId,dimension:plan.dimension},args.direction);
  }finally{job?.dispose();pending--;}
 }
 return Object.freeze({inspectSelectedProfileSourceDimensionRegions,editSelectedProfileSourceDimensionRegion,travelSelectedProfileSourceDimension});
}
