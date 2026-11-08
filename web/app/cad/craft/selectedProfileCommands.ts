import {captureSelectedRegionCurveIds,captureSelectedRegionInspection} from 'engine/extrusion/selectedRegionDescriptor.mjs';
import {MOpenFaceShell} from '../model/mopenFace';
import {MWorkerSolid} from '../model/mworkerSolid';
import {sketchBoundaryFrame} from '../sketch/boundaryValidity';
import {getSketchBoundaries} from '../sketch/sketchBoundaries';
import {runSketchSolve} from 'sketcher/headless/client';
import {runPrismSemantic} from 'engine/extrusion/prismSemanticClient';
import {CIRCULAR_REGION_CAPTURE} from 'engine/extrusion/circularArrangementDescriptor.mjs';
import {selectSelectedProfileHistoryBuild,selectedProfileVersion,requireSelectedProfileBuild,genericHistoryBuild} from 'engine/mount/selectedProfileBuildSelection.mjs';
import {solidBodyId} from 'engine/solid/solidIntent.mjs';
import sketchWorker from 'codi-headless-sketch-worker';
import semanticWorker from 'codi-prism-semantic-worker';
import {captureSelectedProfileSolve} from 'workbenches/modeler/features/workerSelectedProfile/workerSelectedProfile.operation';
import {captureSketchFailure} from 'sketcher/constr/admissionCause.mjs';
import {sketchRevision} from './sketchRevision.mjs';
import {selectedProfileHistoryBudget} from 'engine/mount/selectedProfileBudget.mjs';
import {admitArrangementRegionsForBuild} from 'engine/extrusion/selectedArrangementDescriptor.mjs';

const OP='WORKER_SELECTED_PROFILE_EXTRUDE_V2',MAX_SOURCE=65536,MAX_RESPONSE=65536;
function fail(code:string,message:string):never{throw Object.assign(Error(message),{code});}
function abort(committed=false){const e=new DOMException('Selected-region operation was cancelled or superseded.','AbortError');Object.defineProperty(e,'committed',{value:committed,enumerable:true});return e;}
function fields(value:any,keys:string[]){
 const proto=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
 if(!value||typeof value!=='object'||Array.isArray(value)||(proto!==null&&Object.getPrototypeOf(proto)!==null)||Reflect.ownKeys(value).length!==keys.length)fail('INVALID_REQUEST','Expected exact selected-region fields.');
 const out:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))fail('INVALID_REQUEST','Selected-region fields must be data.');out[key]=d.value;}return out;
}
function id(value:any,max:number){if(typeof value!=='string'||!value||value.length>max)fail('INVALID_REQUEST','Expected a bounded current model identity.');return value;}
function options(value:any={}){
 const keys=Reflect.ownKeys(value||{});if(keys.some(k=>typeof k!=='string'||!['signal','valid'].includes(k)))fail('INVALID_REQUEST','Invalid selected-region options.');
 const out=fields(value,keys as string[]);if(out.valid!==undefined&&typeof out.valid!=='function')fail('INVALID_REQUEST','Invalid lifetime guard.');
 if(out.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(out.signal);}catch{fail('INVALID_REQUEST','Invalid cancellation signal.');}return out;
}
function assetPath(asset:string){const u=new URL(asset,globalThis.location.href);if(u.origin!==globalThis.location.origin||u.search||u.hash)fail('INVALID_ASSET','Selected-region Workers require same-origin assets.');return u.pathname;}

// Caller admission/currentness is shared by public entry points. Registered
// operations own reconstruction, native geometry and atomic publication.
export function createSelectedProfileCommands(ctx:any,submit:any,cancelEpoch:(epoch:number)=>void,buildPolicy:any=null){
 const services=()=>[ctx.projectService,ctx.storageService,ctx.craftService,ctx.cadRegistry,ctx.operationService,ctx.expressionService,ctx.projectManager,ctx.services.sketcher,ctx.wizardService,ctx.workbenchService,ctx.assemblyService];
 const streams=()=>[ctx.craftService.modifications$,ctx.craftService.models$,ctx.craftService.pipelineFailure$,ctx.craftService.engineCleanupFailure$,ctx.expressionService.script$,ctx.expressionService.list$,ctx.expressionService.errors$,ctx.expressionService.table$,ctx.streams.sketcher.sketchingFace,ctx.wizardService.workingRequest$,ctx.workbenchService.currentWorkbench$,ctx.assemblyService.constraints$];
 let inspecting=0;
 function choiceRequest(value:any={}){const keys=Reflect.ownKeys(value||{});if(keys.some(k=>k!=='engineRevision'))fail('INVALID_REQUEST','Only an optional explicit engine revision is supported.');const out=fields(value,keys as string[]);if(keys.length&& (typeof out.engineRevision!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(out.engineRevision)))fail('INVALID_REQUEST','Expected an exact registered engine revision.');return out;}
 function availableBuilds(){
  if(!buildPolicy)return Object.freeze([]);
  const listed=buildPolicy.listBuilds();if(!Array.isArray(listed)||listed.length>32||Reflect.ownKeys(listed).length!==listed.length+1)fail('INVALID_RESPONSE','Invalid staged selected-profile build inventory.');
  const seen=new Set(),rows=[];for(let i=0;i<listed.length;i++){const d=Object.getOwnPropertyDescriptor(listed,String(i));if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))fail('INVALID_RESPONSE','Build inventory must be dense data.');const row=fields(d.value,['engine','engineRevision']);if(row.engine!=='occ')fail('INVALID_RESPONSE','Unexpected selected-profile engine.');choiceRequest({engineRevision:row.engineRevision});const build=requireSelectedProfileBuild(row.engine,row.engineRevision),available=buildPolicy.requireBuild(row.engine,row.engineRevision);if(available!==build||seen.has(build.revision))fail('INVALID_RESPONSE','Invalid staged build identity.');seen.add(build.revision);rows.push(Object.freeze(row));}return Object.freeze(rows);
 }
 function chooseBuild(request:any){
  const history=ctx.craftService.modifications$.value.history,recorded=genericHistoryBuild(history),build=request.engineRevision?requireSelectedProfileBuild('occ',request.engineRevision):selectSelectedProfileHistoryBuild(history);
  if(recorded&&recorded!==build)fail('ENGINE_REVISION_MISMATCH','The authored whole part must retain its recorded engine revision.');
  if(buildPolicy){if(buildPolicy.requireBuild('occ',build.revision)!==build)fail('UNSUPPORTED_PROFILE_BUILD','The exact selected-profile build is not staged.');}
  else if(request.engineRevision&&build!==selectSelectedProfileHistoryBuild(history))fail('UNSUPPORTED_PROFILE_BUILD','Explicit selected-profile builds require a staged build policy.');
  return build;
 }
 function inspectSelectedProfileCommands(input:any={}){
  const request=choiceRequest(input),available=availableBuilds();
  const base=ctx.craftService.inspectRectangleCreation(),project=ctx.projectService,registry=ctx.cadRegistry,models=ctx.craftService.models$.value;let reason=base.reason;
  if(!reason&&!project.hasHostLifetime)reason='A current host workspace is required.';
  if(!reason)try{ctx.operationService.get(OP);}catch{reason='Selected-region extrusion is unavailable in this build.';}
  const expressions=ctx.expressionService;
  if(!reason&&(expressions.isTyped||expressions.script$.value.trim()||Object.keys(expressions.table$.value||{}).length))reason='Selected-region extrusion currently supports native local constants without project parameter bindings.';
  if(!Array.isArray(models)||models.length>16384)fail('RESOURCE_LIMIT','The model inventory exceeds selected-region limits.');const sourceFaces=[];
  for(const model of models){if(!(model instanceof MOpenFaceShell))continue;const face=model.face;if(!face?.isPlaneBased||registry.findFace(face.id)!==face||face.defaultSketchId!==face.id)continue;const source=ctx.sketchStorageService.getSketchData(face.id);sourceFaces.push(Object.freeze({faceId:face.id,source:typeof source==='string'?'saved':'empty'}));}
  if(sourceFaces.length>128)fail('RESOURCE_LIMIT','Too many source planes for selected-region discovery.');if(ctx.craftService.inspectRectangleCreation().revision!==base.revision)throw abort();
  let build=null,buildReason=null;try{build=chooseBuild(request);}catch(error){buildReason=error.code||'ENGINE_REVISION_MISMATCH';if(!reason)reason=error.message;}
  const budget=build?selectedProfileHistoryBudget(ctx.craftService.modifications$.value.history,build.revision):null;
  return Object.freeze({ready:!reason,reason:reason||null,canCreate:!reason&&!!budget?.canAppend,creationReason:buildReason||reason||budget?.reason||(!budget?.canAppend?'RESOURCE_LIMIT':null),budget,availableBuilds:available,revision:base.revision,unit:'millimeter',engine:'occ',engineRevision:build?.revision||null,profileVersion:build?selectedProfileVersion(build):null,selectedRegionArrangementVersion:build?.selectedRegionArrangementVersion??null,circularArrangementVersion:(build as any)?.circularArrangementVersion??null,bodyPolicies:Object.freeze(['separate']),sourceFaces:Object.freeze(sourceFaces),limits:Object.freeze({sourceBytes:MAX_SOURCE,regions:128,responseBytes:MAX_RESPONSE}),scope:build?'selected-profile-v'+selectedProfileVersion(build)+'-experimental':'selected-profile-unavailable',note:'The recorded whole-part backend determines supported regions. Supported source edits use full replay and may require region reselection. Generated-face operations and typed project bindings remain unqualified.'});
 }
 function begin(revision:string,faceId:string,opts:any,writing:boolean,engineRevision?:string){
  const request=engineRevision===undefined?{}:{engineRevision},info=inspectSelectedProfileCommands(request);id(revision,256);id(faceId,256);if(!info.ready)fail(info.creationReason||'UNAVAILABLE',info.reason);if(revision!==info.revision)throw abort();
  if(writing&&!info.canCreate)fail(info.budget.reason==='INCOMPATIBLE_ENGINE_BUILD'?'ENGINE_REVISION_MISMATCH':info.budget.reason||'RESOURCE_LIMIT',info.budget.reason==='INCOMPATIBLE_ENGINE_BUILD'?'The authored generic history uses a different engine build. Re-evaluate explicitly before appending selected geometry.':info.budget.reason==='UNSUPPORTED_HISTORY'?'The selected runtime cannot establish the cost of this authored history.':'Selected evaluation native-result budget exhausted. Existing results remain available for inspection and editing.');
  const project=ctx.projectService,craft=ctx.craftService,storage=ctx.storageService,registry=ctx.cadRegistry,sketches=ctx.sketchStorageService,face=registry.findFace(faceId);
  if(!(face?.root instanceof MOpenFaceShell)||!face.isPlaneBased||face.id!==faceId||face.defaultSketchId!==faceId)fail('UNSUPPORTED_FACE','Select a current source sketch plane.');
  const source=sketches.getSketchData(faceId);if(typeof source!=='string'||source.length>MAX_SOURCE)fail('UNSUPPORTED_SOURCE','A saved bounded native sketch is required.');
  const frame=sketchBoundaryFrame(face),frameText=JSON.stringify(frame),boundary=getSketchBoundaries(face);
  if(['lines','arcs','circles','nurbses'].some(k=>!Array.isArray(boundary[k])||boundary[k].length))fail('UNSUPPORTED_FACE','Referenced boundary geometry is not yet supported.');
  const generation=project.documentGeneration,namespace=project.sketchStorageNamespace,sourceRevision=sketchRevision(storage,namespace),epoch=craft.evaluationEpoch,capturedServices=services(),capturedStreams=streams(),versions=capturedStreams.map(s=>s.revision),controller=new AbortController(),scope:{epoch:number|null}={epoch:null};
  const host=()=>{try{return !opts.signal?.aborted&&(!opts.valid||opts.valid()===true);}catch{return false;}};
  const alive=()=>host()&&!controller.signal.aborted&&ctx.projectService===project&&project.hasHostLifetime&&project.isDocumentCurrent(generation)&&ctx.craftService===craft&&ctx.storageService===storage&&ctx.cadRegistry===registry&&ctx.sketchStorageService===sketches;
  const current=()=>{const build=chooseBuild(request);if(build.revision!==info.engineRevision)throw abort();if(!alive()||project.sketchStorageNamespace!==namespace||services().some((s,i)=>s!==capturedServices[i])||sketchRevision(storage,namespace)!==sourceRevision||streams().some((s,i)=>s!==capturedStreams[i]||s.revision!==versions[i])||registry.findFace(faceId)!==face||sketches.getSketchData(faceId)!==source||JSON.stringify(sketchBoundaryFrame(face))!==frameText||craft.evaluationEpoch!==(writing&&scope.epoch!==null?scope.epoch:epoch))throw abort();};
  const stop=()=>{controller.abort();if(writing&&scope.epoch!==null)cancelEpoch(scope.epoch);},signals=[project.documentSignal,opts.signal].filter(Boolean);
  for(const signal of signals)signal.addEventListener('abort',stop,{once:true});if(signals.some(signal=>signal.aborted))stop();const timer=setInterval(()=>{if(!alive())stop();},100);
  return{source,frame,boundary,face,scope,controller,current,alive,engineRevision:info.engineRevision,profileVersion:info.profileVersion,circularArrangementVersion:info.circularArrangementVersion,dispose(){clearInterval(timer);for(const signal of signals)signal.removeEventListener('abort',stop);}};
 }
 function captureInspection(value:any,expected:any,sourceCurveIds:any,profileVersion:number,circularVersion:any){return captureSelectedRegionInspection(value,expected,sourceCurveIds,profileVersion===3,circularVersion===1?CIRCULAR_REGION_CAPTURE:undefined);}
 async function inspectSelectedProfileRegions(input:any,rawOptions:any){
  const keys=Reflect.ownKeys(input||{}),args=fields(input,keys.includes('engineRevision')?['revision','faceId','depth','engineRevision']:['revision','faceId','depth']),opts=options(rawOptions);if(Object.prototype.hasOwnProperty.call(args,'engineRevision'))choiceRequest({engineRevision:args.engineRevision});if(typeof args.depth!=='number'||!Number.isFinite(args.depth)||args.depth<=0||args.depth>1e6)fail('INVALID_REQUEST','Use a positive bounded millimeter depth.');
  if(inspecting>=2)fail('BUSY','Too many pending selected-region inspections.');const job=begin(args.revision,args.faceId,opts,false,args.engineRevision);inspecting++;
  const valid=()=>{try{job.current();return true;}catch{return false;}};
  try{
   job.current();const results=[];
   for(let i=0;i<2;i++){
    const revision=crypto.randomUUID(),result:any=await runSketchSolve(assetPath(sketchWorker),{task:'rectangle-extrusion-solve',revision,sketchJSON:job.source,boundary:job.boundary,externalParameters:{}},{signal:job.controller.signal,valid});job.current();
    const ok=Object.getOwnPropertyDescriptor(result||{},'ok');if(!ok?.enumerable||!Object.prototype.hasOwnProperty.call(ok,'value'))fail('INVALID_RESPONSE','Invalid source reconstruction response.');
    if(ok.value===false){const error=fields(result,['revision','ok','error']);if(error.revision!==revision)fail('INVALID_RESPONSE','Source failure revision changed.');const captured=captureSketchFailure(error.error);throw Object.assign(Error(captured.message),{code:captured.code,...(captured.cause?{cause:captured.cause}:{})});}
    const solved=captureSelectedProfileSolve(result,revision),curveIds=captureSelectedRegionCurveIds(Object.getOwnPropertyDescriptor(result,'sketch').value);results.push({...solved,curveIds});
   }
   if(results[0].source!==results[1].source||results[0].digest!==results[1].digest||results[0].evidence!==results[1].evidence)fail('INVALID_RESPONSE','Independent source reconstruction disagreed.');
   const revision=crypto.randomUUID(),profile={unit:'millimeter',engine:'occ',...(job.profileVersion===3?{profileVersion:3}:{}),...(job.circularArrangementVersion===1?{circularArrangementVersion:1}:{}),revision,sketchDigest:results[0].digest,faceId:args.faceId,frame:job.frame,depth:args.depth,sketchJSON:results[0].source},expected={revision,sketchDigest:profile.sketchDigest,faceId:args.faceId},verified=[];
   for(let i=0;i<2;i++){const result=await runPrismSemantic(assetPath(semanticWorker),{kind:'inspect-selected',profile},{signal:job.controller.signal,valid,timeoutMs:30000});job.current();verified.push(captureInspection(result,expected,results[0].curveIds,job.profileVersion,job.circularArrangementVersion));}
   if(JSON.stringify(verified[0])!==JSON.stringify(verified[1]))fail('INVALID_RESPONSE','Independent region discovery disagreed.');
   job.current();const regions=admitArrangementRegionsForBuild(verified[0].regions,requireSelectedProfileBuild('occ',job.engineRevision).selectionPlanVersion);return Object.freeze({revision:args.revision,faceId:args.faceId,sourceDigest:profile.sketchDigest,depth:args.depth,unit:'millimeter',engine:'occ',engineRevision:job.engineRevision,profileVersion:job.profileVersion,regions,...(verified[0].sourceAnalysis?{sourceAnalysis:verified[0].sourceAnalysis}:{})});
  }finally{inspecting--;job.dispose();}
 }
 async function createSelectedProfileExtrusion(input:any,rawOptions:any){
  const args=fields(input,['revision','faceId','regionId','unit','engine','engineRevision','depth','bodyPolicy']),opts=options(rawOptions);id(args.regionId,8192);
  if(args.unit!=='millimeter'||args.engine!=='occ'||args.bodyPolicy!=='separate'||!args.regionId.startsWith('sketch-region:')||typeof args.depth!=='number'||!Number.isFinite(args.depth)||args.depth<=0||args.depth>1e6)fail('UNSUPPORTED_REQUEST','Select a qualified separate OCC region extrusion.');
  requireSelectedProfileBuild(args.engine,args.engineRevision);
  const job=begin(args.revision,args.faceId,opts,true,args.engineRevision),project=ctx.projectService;let featureId:string=null,receipt:any=null,committed=false;
  try{
   job.current();if(args.engineRevision!==job.engineRevision)fail('ENGINE_REVISION_MISMATCH','Use the inspected whole-part backend without substitution.');featureId=project.counterGenerator.generateFeatureId();const outputId=solidBodyId(Number(featureId));
   const preparation={candidateScope:job.scope,requireCurrent:job.current,requireCommittedCurrent(){if(!job.alive())throw abort(true);},async prepare(models:any[]){job.current();const found=models.filter(model=>model.id===outputId),planes=models.filter(model=>model instanceof MOpenFaceShell&&model.face.id===args.faceId);if(found.length!==1||!(found[0] instanceof MWorkerSolid)||found[0].featureId!==Number(featureId)||found[0].ext.workerGeometry.engine!=='occ'||planes.length!==1)fail('INVALID_RESPONSE','The qualified native output and retained source are unavailable.');receipt=Object.freeze({featureId:Number(featureId),outputId,bodyId:outputId,sourceFaceId:args.faceId,regionId:args.regionId,engine:'occ',engineRevision:args.engineRevision,unit:'millimeter',bodyPolicy:'separate',persistence:'volatile-workspace'});return null;}};
   const params={version:1,unit:args.unit,engine:args.engine,engineRevision:args.engineRevision,featureId:Number(featureId),faceId:args.faceId,regionId:args.regionId,depth:args.depth,bodyPolicy:args.bodyPolicy};
   await new Promise<void>((resolve,reject)=>submit({type:OP,params},resolve,reject,preparation));committed=true;
   if(!receipt)fail('INVALID_RESPONSE','Selected-region publication did not return a receipt.');
   if(!job.alive())throw abort(true);const revision=inspectSelectedProfileCommands().revision;if(!job.alive())throw abort(true);
   return Object.freeze({...receipt,revision});
  }catch(error){if(committed&&!error?.committed)throw abort(true);if(!job.alive()&&!error?.committed)throw abort();throw error;}
  finally{job.dispose();if(featureId!==null)project.counterGenerator.releaseFeatureId(featureId);}
 }
 return Object.freeze({inspectSelectedProfileCommands,inspectSelectedProfileRegions,createSelectedProfileExtrusion});
}
