import {requireActiveFeature} from 'engine/solid/authoredHistoryState.mjs';
import {captureSelectedProfileDepthParameters} from './authoredEditJournal.mjs';
import {captureAuthoredHistory} from './captureAuthoredHistory.mjs';
import {sketchRevision} from './sketchRevision.mjs';
import {sketchBoundaryFrame} from '../sketch/boundaryValidity';
import {MOpenFaceShell} from '../model/mopenFace';
import {requireSelectedProfileBuild,selectedProfileVersion} from 'engine/mount/selectedProfileBuildSelection.mjs';
import {captureSelectedRegionCurveIds,captureSelectedRegionInspection} from 'engine/extrusion/selectedRegionDescriptor.mjs';
import {CIRCULAR_REGION_CAPTURE} from 'engine/extrusion/circularArrangementDescriptor.mjs';

const PARAMS=['version','unit','engine','engineRevision','featureId','faceId','regionId','depth','bodyPolicy'];
const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
function abort(committed=false){return Object.assign(new DOMException(committed?'Selected-region edit committed before its caller changed.':'Selected-region selection was cancelled or superseded.','AbortError'),{committed});}
function fields(value:any,keys:string[]){const proto=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;if(!value||typeof value!=='object'||Array.isArray(value)||(proto!==null&&Object.getPrototypeOf(proto)!==null)||Reflect.ownKeys(value).length!==keys.length)fail('INVALID_REQUEST','Expected exact selected-profile region fields.');const out:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))fail('INVALID_REQUEST','Selected-profile region fields must be data.');out[key]=d.value;}return out;}
function options(value:any={}){const keys=Reflect.ownKeys(value||{});if(keys.some(k=>typeof k!=='string'||!['signal','valid'].includes(k)))fail('INVALID_REQUEST','Invalid selected-profile region options.');const out=fields(value,keys as string[]);if(out.valid!==undefined&&typeof out.valid!=='function')fail('INVALID_REQUEST','Invalid caller lifetime guard.');if(out.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(out.signal);}catch{fail('INVALID_REQUEST','Invalid cancellation signal.');}return Object.freeze(out);}
function intent(input:any,editing=false){const a=fields(input,editing?['revision','index','featureId','regionId']:['revision','index','featureId']);if(typeof a.revision!=='string'||!a.revision||a.revision.length>256||!Number.isSafeInteger(a.index)||a.index<0||a.index>255||!Number.isSafeInteger(a.featureId)||a.featureId<1||editing&&(typeof a.regionId!=='string'||!a.regionId||a.regionId.length>8192))fail('INVALID_REQUEST','Use a current inspected feature identity and bounded opaque region ID.');return Object.freeze(a);}
function frameCopy(face:any){const frame=sketchBoundaryFrame(face),out:any={};for(const key of ['origin','x','y','z']){const a=frame[key];if(!Array.isArray(a)||a.length!==3||!a.every(Number.isFinite))fail('UNSUPPORTED_FACE','The authored source frame is unavailable.');out[key]=Object.freeze([...a]);}return Object.freeze(out);}

// Root supplies its existing synchronous-entry prepared full-history operation.
// No feature IDs, native handles, source writes or publication are allocated here.
export function createSelectedProfileRegionCommands(ctx:any,submitRegionEdit:(args:any,options:any)=>Promise<any>){
 if(typeof submitRegionEdit!=='function')fail('UNAVAILABLE','The shared selected-profile region operation is unavailable.');let pending=0;
 function begin(a:any,opts:any){
  const craft=ctx.craftService,project=ctx.projectService,storage=ctx.storageService,sketches=ctx.sketchStorageService,registry=ctx.cadRegistry,expressions=ctx.expressionService,manager=ctx.projectManager;
  const historyMethod=craft.inspectSelectedProfileHistory,regionMethod=craft.inspectSelectedProfileRegions,sourceMethod=craft.inspectSelectedProfileCommands;
  if([historyMethod,regionMethod,sourceMethod].some(m=>typeof m!=='function'))fail('UNAVAILABLE','Shared selected-profile discovery is unavailable.');
  const historyInfo=historyMethod(),creationInfo=sourceMethod(),state=craft.modifications$.value,entries=state?.history;
  if(!historyInfo.ready||!creationInfo.ready)fail(expressions.isTyped?'UNSUPPORTED_PARAMETERS':'UNAVAILABLE',historyInfo.reason||creationInfo.reason||'Selected-profile editing is unavailable.');
  if(historyInfo.revision!==a.revision)fail('STALE_HISTORY','The authored feature revision is stale.');
  if(!project.hasHostLifetime||manager.unit!=='millimeter'||expressions.isTyped||expressions.script$.value.trim()||Reflect.ownKeys(expressions.table$.value||{}).length)fail('UNSUPPORTED_PARAMETERS','Region reselection requires an owned canonical millimeter document without project parameter bindings.');
  if(!Array.isArray(entries)||entries.length>256||state.pointer!==entries.length-1)fail('UNAVAILABLE','Return to the accepted full history before selecting a region.');
  const listed=historyInfo.features.find((v:any)=>v.index===a.index&&v.featureId===a.featureId),entry=entries[a.index];if(!listed||entry?.type!=='WORKER_SELECTED_PROFILE_EXTRUDE_V2')fail('INVALID_FEATURE','The selected-profile feature is unavailable.');
  requireActiveFeature(entry);
  const parameters:any=captureSelectedProfileDepthParameters(entry.params);if(PARAMS.some(key=>listed[key]!==parameters[key])||parameters.featureId!==a.featureId)fail('INVALID_FEATURE','The selected-profile identity changed.');
  const build=requireSelectedProfileBuild(parameters.engine,parameters.engineRevision),profileVersion=selectedProfileVersion(build);
  if(creationInfo.engineRevision!==parameters.engineRevision||creationInfo.profileVersion!==profileVersion)fail('ENGINE_REVISION_MISMATCH','Retain the exact recorded whole-part backend.');
  const face=registry.findFace(parameters.faceId),plane=face?.root;if(!(plane instanceof MOpenFaceShell)||plane.face!==face||face.isPlaneBased!==true||face.defaultSketchId!==parameters.faceId)fail('UNSUPPORTED_FACE','The current owned source plane is unavailable.');
  const source=sketches.getSketchData(parameters.faceId);if(typeof source!=='string'||source.length>65536||new TextEncoder().encode(source).byteLength>65536)fail('UNSUPPORTED_SOURCE','A bounded saved source sketch is required.');
  const frame=frameCopy(face),frameText=JSON.stringify(frame),namespace=project.sketchStorageNamespace,key=project.sketchStorageKey(parameters.faceId),version=storage.versionOf(key),namespaceVersion=sketchRevision(storage,namespace),generation=project.documentGeneration,epoch=craft.evaluationEpoch,script=expressions.script$.value,table=expressions.table$.value,list=expressions.list$.value,errors=expressions.errors$.value;
  if(!Number.isSafeInteger(version)||version<1)fail('UNSUPPORTED_SOURCE','A versioned source sketch is required.');
  const alive=()=>{try{return !opts.signal?.aborted&&(!opts.valid||opts.valid()===true)&&!opts.signal?.aborted&&ctx.craftService===craft&&ctx.projectService===project&&project.hasHostLifetime&&project.isDocumentCurrent(generation)&&ctx.storageService===storage&&ctx.sketchStorageService===sketches&&ctx.cadRegistry===registry&&ctx.expressionService===expressions&&ctx.projectManager===manager&&craft.inspectSelectedProfileHistory===historyMethod&&craft.inspectSelectedProfileRegions===regionMethod&&craft.inspectSelectedProfileCommands===sourceMethod;}catch{return false;}};
  const current=()=>{if(!alive()||craft.evaluationEpoch!==epoch||craft.modifications$.value!==state||state.history!==entries||state.pointer!==entries.length-1||project.sketchStorageNamespace!==namespace||storage.versionOf(key)!==version||sketchRevision(storage,namespace)!==namespaceVersion||sketches.getSketchData(parameters.faceId)!==source||registry.findFace(parameters.faceId)!==face||face.root!==plane||plane.face!==face||face.isPlaneBased!==true||face.defaultSketchId!==parameters.faceId||JSON.stringify(frameCopy(face))!==frameText||expressions.isTyped||expressions.script$.value!==script||expressions.table$.value!==table||Reflect.ownKeys(table).length||expressions.list$.value!==list||expressions.errors$.value!==errors)throw abort();const h=historyMethod(),s=sourceMethod();if(!h.ready||!s.ready||h.revision!==a.revision||s.revision!==creationInfo.revision||s.engineRevision!==parameters.engineRevision||s.profileVersion!==profileVersion)throw abort();const now:any=captureSelectedProfileDepthParameters(entries[a.index]?.params);if(PARAMS.some(key=>now[key]!==parameters[key]))throw abort();};
  current();return{craft,parameters,profileVersion,circularArrangementVersion:(build as any).circularArrangementVersion,source,frame,creationRevision:creationInfo.revision,entries,current,alive,regionMethod};
 }
 async function discover(a:any,opts:any){
  const job=begin(a,opts),captured=await captureAuthoredHistory(job.entries,job.current);job.current();
  const result=await job.regionMethod({revision:job.creationRevision,faceId:job.parameters.faceId,depth:job.parameters.depth},{signal:opts.signal,valid:()=>{try{job.current();return true}catch{return false}}});job.current();
  const r=fields(result,['revision','faceId','sourceDigest','depth','unit','engine','engineRevision','profileVersion','regions',...(job.profileVersion===3?['sourceAnalysis']:[])]);
  if(r.revision!==job.creationRevision||r.faceId!==job.parameters.faceId||r.depth!==job.parameters.depth||r.unit!=='millimeter'||r.engine!==job.parameters.engine||r.engineRevision!==job.parameters.engineRevision||r.profileVersion!==job.profileVersion||typeof r.sourceDigest!=='string'||!/^[a-f0-9]{64}$/.test(r.sourceDigest))fail('INVALID_RESPONSE','Region discovery changed its captured source/feature/build.');
  // Reuse descriptor capture against the captured native source curve census;
  // the digest comes from genuine bound discovery, never from the opaque ID.
  let source:any;try{source=JSON.parse(job.source);}catch{fail('UNSUPPORTED_SOURCE','The saved source is invalid.');}
  if(!Array.isArray(source.objects))fail('UNSUPPORTED_SOURCE','The saved source curve census is unavailable.');
  const ids=captureSelectedRegionCurveIds({objects:source.objects.map((o:any)=>({id:o.id,type:o.type,role:o.role??null,stage:o.stage??0}))});
  const descriptors=captureSelectedRegionInspection({binding:{revision:r.revision,sketchDigest:r.sourceDigest,faceId:r.faceId},regions:r.regions,...(job.profileVersion===3?{sourceAnalysis:r.sourceAnalysis}:{})},{revision:job.creationRevision,sketchDigest:r.sourceDigest,faceId:job.parameters.faceId},ids,job.profileVersion===3,job.circularArrangementVersion===1?CIRCULAR_REGION_CAPTURE:undefined);
  if((await captureAuthoredHistory(job.entries,job.current)).signature!==captured.signature)throw abort();job.current();
  return{job,value:Object.freeze({revision:a.revision,regionRevision:job.creationRevision,index:a.index,...job.parameters,currentSourceDigest:r.sourceDigest,profileVersion:job.profileVersion,sourceFrame:job.frame,regions:descriptors.regions,...(descriptors.sourceAnalysis?{sourceAnalysis:descriptors.sourceAnalysis}:{}),dependencyCompatibility:'requires-full-replay'})};
 }
 async function inspectSelectedProfileRegionChoices(input:any,rawOptions?:any){const a=intent(input),opts=options(rawOptions);if(pending>=2)fail('BUSY','Too many pending selected-profile region requests.');pending++;try{return(await discover(a,opts)).value;}finally{pending--;}}
 async function editSelectedProfileRegion(input:any,rawOptions?:any){const a=intent(input,true),opts=options(rawOptions);if(pending>=2)fail('BUSY','Too many pending selected-profile region requests.');pending++;
  try{
   const {job,value}=await discover(a,opts),row=value.regions.find((r:any)=>r.regionId===a.regionId);if(!row)fail('STALE_REGION','Choose a region currently listed for this captured source.');if(row.support!=='supported')fail('UNSUPPORTED_REGION',row.reason?.message||'The chosen region is unsupported by the recorded build.');job.current();
   // Root must synchronously enter its existing authored transaction here.
   // Its own source/history/epoch guards span expected candidate processing.
   const result=await submitRegionEdit(Object.freeze({revision:a.revision,index:a.index,featureId:a.featureId,regionId:a.regionId}),Object.freeze({signal:opts.signal,valid:job.alive}));
   let receipt:any;try{const changed=result&&Object.getOwnPropertyDescriptor(result,'changed');if(!changed?.enumerable||!Object.prototype.hasOwnProperty.call(changed,'value')||typeof changed.value!=='boolean')throw Error();receipt=fields(result,changed.value?['changed','revision','index','featureId','regionId']:['changed','revision']);if(typeof receipt.revision!=='string'||!receipt.revision||receipt.revision.length>256||receipt.changed&&(receipt.index!==a.index||receipt.featureId!==a.featureId||receipt.regionId!==a.regionId))throw Error();}
   catch{throw Object.assign(Error('Selected-region edit outcome is unavailable; inspect before retrying.'),{code:'INVALID_RESPONSE',possiblyCommitted:true});}
   if(!job.alive())throw abort(receipt.changed);
   return Object.freeze({changed:receipt.changed,revision:receipt.revision,index:a.index,featureId:a.featureId,regionId:a.regionId});
  }finally{pending--;}
 }
 return Object.freeze({inspectSelectedProfileRegionChoices,editSelectedProfileRegion});
}
