import {runSketchTransition,verifyDrivingDimensionCandidate,verifySignedDistanceCandidate,verifyLineRelationCandidate,verifyPointsCoordinatesCandidate,verifyPrimitiveRemovalCandidate} from 'sketcher/headless/transitionClient';
import {runConcentricTransition} from 'sketcher/headless/concentricClient';
import {runClosedSketchInspection} from 'sketcher/headless/inspectionClient';
import workerUrl from 'codi-headless-sketch-worker';
import {sketchBoundaryFrame} from '../sketch/boundaryValidity';
import {MOpenFaceShell} from '../model/mopenFace';
import {sameSketchSaveFrame,hasOnlyUnconsumedSketchHistory} from './unconsumedSketchSave.mjs';
import {captureAuthoredHistory} from './captureAuthoredHistory.mjs';
import {sketchRevision} from './sketchRevision.mjs';
import {PreparedSketchCommand} from './rectangleCreation';
import {captureAdmissionCause} from 'sketcher/constr/admissionCause.mjs';
import {prepareTypedClosedSketchInspection} from './typedClosedSketchInspection.mjs';
import {captureDrivingDimensionIntent} from 'sketcher/headless/drivingDimensionTarget.mjs';
import {captureConstraintGroupIntent} from 'sketcher/headless/constraintGroupIntent.mjs';
import {verifyConstraintGroupCandidate} from 'sketcher/headless/transitionClient';

const MAX=1024*1024;
function workerFailure(result:any,code:string,message:string){
 const details=result?.error,error=Object.assign(new Error(details?.message||message),{code:details?.code||code});
 const cause=details&&Object.getOwnPropertyDescriptor(details,'cause');
 if(cause){if(!cause.enumerable||!Object.prototype.hasOwnProperty.call(cause,'value'))throw Error('Invalid sketch failure cause.');Object.defineProperty(error,'cause',{value:captureAdmissionCause(cause.value),enumerable:true});}
 return error;
}
const lineRelationContracts=Object.freeze([
 Object.freeze({kind:'collinear',typeId:'Collinear',targets:Object.freeze(['Segment','Segment']),semantics:'infinite-supporting-lines',duplicate:'unordered-pair-noop'}),
 Object.freeze({kind:'axis-symmetry',typeId:'AxisSymmetry',targets:Object.freeze(['inspected-point','inspected-point','Segment']),semantics:'reflection-about-infinite-live-axis',duplicate:'unordered-points-same-axis-noop'})
]);
function aborted(committed=false){const e=new DOMException(committed?'Accepted sketch edit was superseded.':'Sketch edit was cancelled or superseded.','AbortError');Object.defineProperty(e,'committed',{value:committed,enumerable:true});return e;}
function record(value:any,keys:string[]){const proto=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;if(!value||typeof value!=='object'||Array.isArray(value)||(proto!==null&&Object.getPrototypeOf(proto)!==null)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))throw Error('Invalid closed sketch request.');const out:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Sketch request fields must be data.');out[key]=d.value}return out;}
function options(value:any){if(value===undefined)value={};if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!['signal','valid'].includes(k)))throw Error('Invalid sketch command options.');const out:any={};for(const key of Reflect.ownKeys(value) as string[]){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Invalid sketch command options.');out[key]=d.value}if(out.valid!==undefined&&typeof out.valid!=='function')throw Error('Invalid lifetime guard.');if(out.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(out.signal)}catch{throw Error('Invalid cancellation signal.')}return out;}
function faceId(value:any){if(typeof value!=='string'||!value||value.length>1024)throw Error('Invalid sketch face.');return value;}
function revision(value:any){if(typeof value!=='string'||!value||value.length>256)throw Error('Invalid sketch revision.');return value;}
function relation(value:any){const a=record(value,['revision','faceId','ids','factor','offset']);revision(a.revision);faceId(a.faceId);if(!Array.isArray(a.ids)||a.ids.length!==2||Reflect.ownKeys(a.ids).length!==3)throw Error('Provide two distinct segment IDs.');a.ids=[0,1].map(i=>{const d=Object.getOwnPropertyDescriptor(a.ids,String(i));if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='string'||!d.value||d.value.length>256)throw Error('Invalid segment ID.');return d.value});if(a.ids[0]===a.ids[1]||typeof a.factor!=='number'||!Number.isFinite(a.factor)||a.factor<0||typeof a.offset!=='number'||!Number.isFinite(a.offset))throw Error('Invalid length relation.');return a;}
function concentric(value:any){
 const a=record(value,['revision','faceId','ids']);revision(a.revision);faceId(a.faceId);
 if(!Array.isArray(a.ids)||a.ids.length!==2||Reflect.ownKeys(a.ids).length!==3)throw Error('Provide two distinct circle or arc IDs.');
 a.ids=Object.freeze([0,1].map(i=>{const d=Object.getOwnPropertyDescriptor(a.ids,String(i));if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='string'||!d.value||d.value.length>256)throw Error('Invalid circle or arc ID.');return d.value}));
 if(a.ids[0]===a.ids[1])throw Error('Provide two distinct circle or arc IDs.');return Object.freeze(a);
}
function coordinate(value:any){const a=record(value,['revision','faceId','id','x','y']);revision(a.revision);faceId(a.faceId);if(typeof a.id!=='string'||!a.id||a.id.length>256||![a.x,a.y].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e8))throw Error('Provide a current point ID and finite sketch coordinates.');return Object.freeze(a);}
function signedDistance(value:any){const a=record(value,['revision','faceId','axis','ids','distance']);revision(a.revision);faceId(a.faceId);if(!['x','y','projected'].includes(a.axis)||!Array.isArray(a.ids)||a.ids.length!==(a.axis==='projected'?3:2)||Reflect.ownKeys(a.ids).length!==a.ids.length+1)throw Error('Choose two points and, for projection, a live direction segment.');a.ids=Object.freeze(Array.from({length:a.ids.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(a.ids,String(i));if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='string'||!d.value||d.value.length>256)throw Error('Invalid signed distance target.');return d.value}));if(a.ids[0]===a.ids[1]||typeof a.distance!=='number'||!Number.isFinite(a.distance)||Math.abs(a.distance)>1e6)throw Error('Provide distinct point IDs and finite signed millimeters within ±1,000,000.');return Object.freeze(a);}
function lineRelation(value:any){const a=record(value,['revision','faceId','kind','ids']);revision(a.revision);faceId(a.faceId);if(!['collinear','axis-symmetry'].includes(a.kind)||!Array.isArray(a.ids)||a.ids.length!==(a.kind==='collinear'?2:3)||Reflect.ownKeys(a.ids).length!==a.ids.length+1)throw Error('Choose current primary relation IDs and a live axis when required.');a.ids=Object.freeze(Array.from({length:a.ids.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(a.ids,String(i));if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='string'||!d.value||d.value.length>256)throw Error('Invalid line relation ID.');return d.value;}));if(a.ids[0]===a.ids[1])throw Error('Choose distinct primary relation IDs.');return Object.freeze(a);}
function diameter(value:any){const a=record(value,['revision','faceId','id','diameter']);revision(a.revision);faceId(a.faceId);if(typeof a.id!=='string'||!a.id||a.id.length>256||typeof a.diameter!=='number'||!Number.isFinite(a.diameter)||a.diameter<=0||a.diameter>1e6)throw Error('Provide a current circle or arc ID and positive diameter in millimeters.');return Object.freeze(a);}
// Capture the public intent before yielding. The coordinator owns new IDs.
function primitiveRemoval(value:any){const a=record(value,['revision','faceId','id']);revision(a.revision);faceId(a.faceId);if(typeof a.id!=='string'||!a.id||a.id.length>256)throw Error('Choose an inspected Segment identity.');return Object.freeze(a);}
function primitive(value:any){
 const a=record(value,['revision','faceId','kind','role','stage','data']);revision(a.revision);faceId(a.faceId);
 if(!['Point','Segment','Circle','Arc'].includes(a.kind)||![null,'construction'].includes(a.role)||!Number.isSafeInteger(a.stage)||a.stage<0||a.stage>31)throw Error('Invalid primitive intent.');
 const point=(value:any)=>{const p=record(value,['x','y']);if(![p.x,p.y].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e8))throw Error('Invalid primitive coordinate.');return Object.freeze(p)};
 if(a.kind==='Point')a.data=point(a.data);
 else if(a.kind==='Circle'){const d=record(a.data,['c','r']);if(typeof d.r!=='number'||!Number.isFinite(d.r)||d.r<=1e-9||d.r>1e8)throw Error('Invalid circle radius.');a.data=Object.freeze({c:point(d.c),r:d.r})}
 else {const d=record(a.data,a.kind==='Arc'?['a','b','c']:['a','b']);a.data=Object.freeze(a.kind==='Arc'?{a:point(d.a),b:point(d.b),c:point(d.c)}:{a:point(d.a),b:point(d.b)})}
 return Object.freeze(a);
}
function coordinates(value:any){
 const a=record(value,['revision','faceId','points']);revision(a.revision);faceId(a.faceId);
 // The desktop invokes this service across its same-origin iframe boundary.
 // Array.isArray is realm-independent; own dense fields below define the data.
 if(!Array.isArray(a.points)||a.points.length<1||a.points.length>32||Reflect.ownKeys(a.points).length!==a.points.length+1)throw Error('Choose one to32 unique inspected points.');
 const points=[];for(let i=0;i<a.points.length;i++){const d=Object.getOwnPropertyDescriptor(a.points,String(i));if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Coordinate points must be dense data.');const p=record(d.value,['id','x','y']);if(typeof p.id!=='string'||!p.id||p.id.length>256||![p.x,p.y].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e8))throw Error('Provide current point IDs and finite sketch coordinates.');points.push(Object.freeze({id:p.id,x:p.x,y:p.y}));}
 if(new Set(points.map(p=>p.id)).size!==points.length)throw Error('Choose distinct inspected point IDs.');return Object.freeze({...a,points:Object.freeze(points)});
}
function openFace(registry:any,id:string){const f=registry.findFace(id);return f&&f.id===id&&f.defaultSketchId===id&&f.root instanceof MOpenFaceShell&&!f.root?.ext?.workerGeometry?f:null;}
function params(table:any){const proto=table&&typeof table==='object'?Object.getPrototypeOf(table):undefined;if(!table||typeof table!=='object'||Array.isArray(table)||(proto!==null&&Object.getPrototypeOf(proto)!==null)||Reflect.ownKeys(table).length>1024)throw Error('Invalid sketch parameter table.');const out=Object.create(null);for(const key of Reflect.ownKeys(table)){if(typeof key!=='string'||!key||key.length>256)throw Error('Invalid sketch parameter.');const d=Object.getOwnPropertyDescriptor(table,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value)||Math.abs(d.value)>1e9)throw Error('Invalid sketch parameter.');out[key]=d.value}return Object.freeze(out);}

// Public requests contain only IDs and revisions. Prepared writes and native
// source strings remain private to the existing candidate replay coordinator.
export function createClosedSketchTransitionCommands(ctx:any,submitPreparedReplay:any,cancelEpoch:(epoch:number)=>void,registerTravel?:(callback:any)=>void){
 const streams=()=>[ctx.craftService.modifications$,ctx.craftService.models$,ctx.craftService.pipelineFailure$,ctx.craftService.engineCleanupFailure$,ctx.expressionService.script$,ctx.expressionService.list$,ctx.expressionService.errors$,ctx.expressionService.table$,ctx.streams.sketcher.sketchingFace,ctx.wizardService.workingRequest$,ctx.workbenchService.currentWorkbench$,ctx.assemblyService.constraints$];
 const services=()=>[ctx.projectService,ctx.storageService,ctx.craftService,ctx.cadRegistry,ctx.sketchStorageService,ctx.operationService,ctx.expressionService,ctx.projectManager,ctx.services.sketcher,ctx.wizardService,ctx.workbenchService,ctx.assemblyService];
 let token:string=null,prior:any[]=[];
 function stamp(){const p=ctx.projectService,s=ctx.storageService;return [...services(),p.documentGeneration,ctx.craftService.evaluationEpoch,sketchRevision(s,p.sketchStorageNamespace),ctx.projectManager.inspectMaterialSurfaceRevision(),...streams().flatMap(x=>[x,x.revision])];}
 function currentRevision(){const now=stamp();if(!token||now.length!==prior.length||now.some((v,i)=>v!==prior[i])){prior=now;token=crypto.randomUUID()}return token;}
 function planeSource(history:any,id:string,face:any){
  // The existing strict allowlist rejects every unknown/implicit consumer.
  // A sentinel admits known ancestry for classification without treating it as
  // unrelated; the candidate evaluator independently verifies plane identity.
  if(!hasOnlyUnconsumedSketchHistory(history,'\u0000'))return null;
  const references=history.map((entry:any,index:number)=>entry?.type==='WORKER_RECTANGLE_EXTRUDE_V1'&&entry.params?.face===id?index:-1).filter((index:number)=>index>=0);
  if(references.length>1)return null;
  let planeIndex:number;
  if(face){planeIndex=face.root.originatingOperation;if(!Number.isSafeInteger(planeIndex)||planeIndex<0||planeIndex>=history.length)return null;}
  else {if(references.length!==1||!history.some((entry:any,index:number)=>entry?.type==='PLANE'&&index<references[0]))return null;return Object.freeze({planeIndex:null,planeFeatureId:null});}
  const plane=history[planeIndex],raw=plane?.params?.featureId,planeFeatureId=Number(raw);
  if(plane?.type!=='PLANE'||!Number.isSafeInteger(planeFeatureId)||planeFeatureId<1||(typeof raw!=='number'&&typeof raw!=='string')||references.some((index:number)=>index<=planeIndex))return null;
  return Object.freeze({planeIndex,planeFeatureId});
 }
 function inspectSketchTransitions(){
  const info=ctx.craftService.inspectRectangleCreation();if(!info.ready)return Object.freeze({ready:false,reason:info.reason,revision:info.revision,candidates:Object.freeze([])});
  if(!ctx.projectService.hasHostLifetime)return Object.freeze({ready:false,reason:'A current host-bound workspace is required.',revision:info.revision,candidates:Object.freeze([])});
  const expressions=ctx.expressionService,typed=expressions.isTyped;
  if(typed&&(!expressions.hasCurrentPhysicalResult||!expressions.hasCurrentPhysicalResult()))return Object.freeze({ready:false,reason:'Typed parameter result is unavailable or stale.',revision:info.revision,candidates:Object.freeze([])});
  const rev=currentRevision(),items=ctx.sketchStorageService.getAllSketches(),history=ctx.craftService.modifications$.value;
  if(!Array.isArray(items)||items.length>64||!Array.isArray(history.history)||history.history.length>256)throw Error('Sketch inventory exceeds its limit.');
  const ids:string[]=[],unsupported:any[]=[],seen=new Set();
  for(const item of items){
   const id=faceId(item?.id);if(seen.has(id))throw Error('Duplicate sketch identity.');seen.add(id);
   const found=ctx.cadRegistry.findFace(id),face=openFace(ctx.cadRegistry,id);
   if((face||!found)&&planeSource(history.history,id,face)){
    if(typed)try{prepareTypedClosedSketchInspection(ctx.sketchStorageService.getSketchData(id),name=>expressions.resolveQuantity(name,'length'));}
    catch(error){unsupported.push(Object.freeze({faceId:id,reason:error.message||'Unsupported typed sketch inspection source.'}));continue;}
    ids.push(id);
   }else if(typed)unsupported.push(Object.freeze({faceId:id,reason:'Typed inspection requires a supported authored plane and known history ancestry.'}));
  }
  const finalInfo=ctx.craftService.inspectRectangleCreation();
  if(!finalInfo.ready||finalInfo.revision!==info.revision||currentRevision()!==rev||ctx.expressionService!==expressions||expressions.isTyped!==typed||typed&&!expressions.hasCurrentPhysicalResult())throw aborted();
  return Object.freeze({ready:true,reason:null,revision:rev,candidates:Object.freeze(ids.map(id=>Object.freeze({faceId:id}))),
   ...(typed?{unsupported:Object.freeze(unsupported),capabilities:Object.freeze({inspection:'supported-typed-length-fields',mutations:'driving-dimension-edit-remove-only'})}:{})});
 }
 function captureJob(id:string,expected:string,opts:any,readOnly=false,dimensionAccess?:{value?:number|string,travelSource?:string}){
  if(ctx.expressionService.isTyped&&!readOnly&&!dimensionAccess)throw Object.assign(Error('Typed sketch mutations are not supported by this transition; inspection is read-only.'),{code:'TYPED_SKETCH_MUTATION_UNSUPPORTED'});
  const info=inspectSketchTransitions();if(!info.ready)throw Error(info.reason||'Sketch editing is unavailable.');if(info.revision!==expected||!info.candidates.some((item:any)=>item.faceId===id))throw aborted();
  const project=ctx.projectService,storage=ctx.storageService,craft=ctx.craftService,sketchStorage=ctx.sketchStorageService,registry=ctx.cadRegistry,manager=ctx.projectManager,expressions=ctx.expressionService,
    generation=project.documentGeneration,capturedEpoch=craft.evaluationEpoch,namespace=project.sketchStorageNamespace,namespaceStamp=sketchRevision(storage,namespace),key=project.sketchStorageKey(id),version=storage.versionOf(key),source=sketchStorage.getSketchData(id),
    history=craft.modifications$.value,entries=history.history,pointer=history.pointer,tracked=streams(),versions=tracked.map(s=>s.revision),capturedServices=services(),table=expressions.table$.value,parameterTable=params(table),typed=expressions.isTyped,physicalSource=expressions.script$.value,physicalList=expressions.list$.value,unit=manager.unit,external=typed?dimensionParameters(source,name=>expressions.resolveQuantity(name,'length'),dimensionAccess):parameterTable,material=manager.inspectMaterialSurfaceRevision(),face=openFace(registry,id),originalFace=registry.findFace(id),originalFrame=face?sketchBoundaryFrame(face):null,sourcePlane=planeSource(entries,id,face);
  if(typed&&unit!=='millimeter')throw Error('Typed sketch inspection requires canonical millimeter geometry.');
  if(!Number.isSafeInteger(version)||version<1||typeof source!=='string'||source.length>MAX||pointer!==entries.length-1||entries.length>256||!sourcePlane||(!face&&originalFace))throw Error('The closed sketch source is unavailable or exceeds its limit.');
  const controller=new AbortController(),scope:{epoch:number|null}={epoch:null};let settled=false,prepared:any=null,historySignature:string=null,frame:any=null;
  const stop=()=>{controller.abort();if(!settled&&scope.epoch!==null)cancelEpoch(scope.epoch)};const signals=[project.documentSignal,opts.signal].filter(Boolean);for(const signal of signals){signal.addEventListener('abort',stop,{once:true});if(signal.aborted)stop()}
  const alive=()=>{try{if(controller.signal.aborted||opts.signal?.aborted||!project.isDocumentCurrent(generation)||opts.valid&&opts.valid()!==true)return false;return !controller.signal.aborted&&!opts.signal?.aborted&&ctx.projectService===project&&project.hasHostLifetime&&project.isDocumentCurrent(generation)&&ctx.storageService===storage&&ctx.craftService===craft&&ctx.sketchStorageService===sketchStorage}catch{return false}};
  const current=()=>{if(!alive()||craft.evaluationEpoch!==(scope.epoch===null?capturedEpoch:scope.epoch)||services().some((v,i)=>v!==capturedServices[i])||project.sketchStorageNamespace!==namespace||sketchRevision(storage,namespace)!==namespaceStamp||storage.versionOf(key)!==version||sketchStorage.getSketchData(id)!==source||craft.modifications$.value!==history||history.history!==entries||history.pointer!==pointer||expressions.isTyped!==typed||typed&&(!expressions.hasCurrentPhysicalResult()||expressions.script$.value!==physicalSource||expressions.list$.value!==physicalList)||expressions.table$.value!==table||streams().some((s,i)=>s!==tracked[i]||s.revision!==versions[i])||manager.inspectMaterialSurfaceRevision()!==material||manager.unit!==unit||ctx.services.sketcher.inPlaceEditor.inEditMode||ctx.wizardService.workingRequest$.value||registry.findFace(id)!==originalFace||(face&&(!sameSketchSaveFrame(sketchBoundaryFrame(face),originalFrame)||openFace(registry,id)!==face)))throw aborted();for(const name of Object.keys(parameterTable)){const d=Object.getOwnPropertyDescriptor(table,name);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||!Object.is(d.value,parameterTable[name]))throw aborted()}if(Reflect.ownKeys(table).length!==Object.keys(parameterTable).length)throw aborted();if(typed)try{for(const name of Object.keys(external))if(!Object.is(expressions.resolveQuantity(name,'length'),external[name]))throw aborted();}catch{throw aborted();}};
  const timer=setInterval(()=>{if(!alive())stop()},100);
  const dispose=()=>{if(settled)return;settled=true;clearInterval(timer);try{prepared?.discard()}finally{for(const signal of signals)signal.removeEventListener('abort',stop)}};
  const start=async()=>{current();const captured=await captureAuthoredHistory(entries,current),plane=planeSource(captured.history,id,face);if(!plane||plane.planeIndex!==sourcePlane.planeIndex||plane.planeFeatureId!==sourcePlane.planeFeatureId)throw aborted();historySignature=captured.signature;current();};
  const recheckHistory=async()=>{if(!historySignature||(await captureAuthoredHistory(entries,current)).signature!==historySignature)throw aborted();current();};
  const inspect=async(text:string)=>{current();const nonce=crypto.randomUUID(),result:any=await runClosedSketchInspection(workerUrl,{revision:nonce,sketchJSON:text,externalParameters:external},{signal:controller.signal,valid:()=>{try{current();return true}catch{return false}}});current();if(!result?.ok)throw Object.assign(new Error(result?.error?.message||'Sketch inspection failed.'),{code:result?.error?.code||'SOLVE_ERROR'});if(result.revision!==nonce||result.emptyBoundary!==true||!sameSketchSaveFrame(result.boundaryFrame,result.boundaryFrame)||(originalFrame&&!sameSketchSaveFrame(result.boundaryFrame,originalFrame))||(frame&&!sameSketchSaveFrame(result.boundaryFrame,frame)))throw Error('The authored sketch frame or boundary is unsupported or stale.');if(!frame){const f=result.boundaryFrame;frame=Object.freeze({origin:Object.freeze([...f.origin]),x:Object.freeze([...f.x]),y:Object.freeze([...f.y]),z:Object.freeze([...f.z])});}return result;};
  const prepare=async(after:string,committedValid?:()=>boolean)=>{await recheckHistory();if(!frame)throw Error('Sketch frame provenance is unavailable.');const override=Object.freeze({id,data:after}),sourceFrame=Object.freeze({id,frame});const preparation:PreparedSketchCommand & {readonly sketchSourceFrames:ReadonlyArray<any>}={candidateScope:scope,sketchOverrides:Object.freeze([override]),sketchSourceFrames:Object.freeze([sourceFrame]),requireCurrent:current,requireCommittedCurrent(){let valid=false;try{valid=!controller.signal.aborted&&!opts.signal?.aborted&&(committedValid?committedValid()===true:(!opts.valid||opts.valid()===true))&&!controller.signal.aborted&&!opts.signal?.aborted&&ctx.projectService===project&&project.hasHostLifetime&&project.isDocumentCurrent(generation)&&ctx.storageService===storage&&ctx.craftService===craft&&ctx.sketchStorageService===sketchStorage}catch{}if(!valid)throw aborted(true)},async prepare(_models:any[],next:any){current();if((await captureAuthoredHistory(next.history,current)).signature!==historySignature)throw aborted();current();prepared=storage.prepareWrites([{key,value:after}]);return prepared;}};return {preparation,override};};
  return {source,controller,current,alive,dispose,start,recheckHistory,inspect,prepare,external,craft,typed};
 }
 function dimensionParameters(source:string,resolveLength:(name:string)=>number,access?:{value?:number|string,travelSource?:string}){
  const out={...prepareTypedClosedSketchInspection(source,resolveLength)};
  if(access?.travelSource)Object.assign(out,prepareTypedClosedSketchInspection(access.travelSource,resolveLength));
  if(typeof access?.value==='string'){const n=resolveLength(access.value);if(typeof n!=='number'||!Number.isFinite(n)||n<=0||n>1e6)throw Error('A current positive typed length is required.');out[access.value]=n;}
  if(Object.keys(out).length>1024)throw Error('Typed dimension bindings exceed limits.');return Object.freeze(out);
 }
 async function changeClosedSketchDimension(input:any,rawOptions:any,action:'edit'|'remove'){
  const a=record(input,action==='edit'?['revision','faceId','constraintId','value']:['revision','faceId','constraintId']);revision(a.revision);faceId(a.faceId);
  const intent=captureDrivingDimensionIntent(action==='edit'?{constraintId:a.constraintId,value:a.value}:{constraintId:a.constraintId},action),opts=options(rawOptions);
  if(action==='edit'&&typeof intent.value==='string'&&!ctx.expressionService.isTyped)throw Error('Named dimension replacement requires a typed length document.');
  const job=captureJob(a.faceId,a.revision,opts,false,action==='edit'?{value:intent.value}:{});let committed=false;
  try{
   await job.start();await job.inspect(job.source);job.current();const nonce=crypto.randomUUID(),request={revision:nonce,sketchJSON:job.source,externalParameters:job.external,action,intent},solveOptions={signal:job.controller.signal,valid:()=>{try{job.current();return true}catch{return false}}};
   const result:any=await runSketchTransition(workerUrl,'sketch-transition-driving-dimension',request,solveOptions);job.current();
   if(!result?.ok)throw workerFailure(result,'DIMENSION_INVALID','The existing dimension could not be changed.');
   if(result.revision!==nonce||typeof result.serializedSketch!=='string')throw Error('Invalid dimension transition response.');
   const verified=await verifyDrivingDimensionCandidate(workerUrl,{...request,candidateJSON:result.serializedSketch},solveOptions);job.current();
   if(!verified?.ok||verified.revision!==nonce||verified.verified!==true)throw workerFailure(verified,'INVALID_CANDIDATE','Dimension candidate verification failed.');
   if(!result.changed){if(result.serializedSketch!==job.source)throw Error('A dimension no-op changed source bytes.');await job.recheckHistory();return Object.freeze({changed:false,faceId:a.faceId,dimension:result.dimension,revision:a.revision,persistence:'volatile-workspace',authoredUndo:false,manufacturingAssignments:'unchanged'});}
   const staged=await job.prepare(result.serializedSketch);job.current();await new Promise<void>((yes,no)=>submitPreparedReplay(yes,no,staged.preparation,{kind:'sketch-bytes',faceId:a.faceId,before:job.source,after:staged.override.data}));
   committed=true;if(!job.alive())throw aborted(true);const latest=inspectSketchTransitions();if(!latest.ready||!job.alive())throw aborted(true);
   return Object.freeze({changed:true,faceId:a.faceId,dimension:result.dimension,revision:latest.revision,persistence:'volatile-workspace',authoredUndo:true,manufacturingAssignments:'review-if-present'});
  }catch(error){if(committed&&!error?.committed)throw aborted(true);if(!job.alive()&&!error?.committed)throw aborted();throw error;}finally{job.dispose()}
 }
 async function editClosedSketchDimension(input:any,rawOptions?:any){return changeClosedSketchDimension(input,rawOptions,'edit');}
 async function removeClosedSketchDimension(input:any,rawOptions?:any){return changeClosedSketchDimension(input,rawOptions,'remove');}
 async function applyClosedConstraintGroup(input:any,rawOptions:any,kind:'midpoint'|'angle-chain'){
  const a=record(input,kind==='midpoint'?['revision','faceId','pointId','segmentId']:['revision','faceId','action','ids','angleDegrees']);revision(a.revision);faceId(a.faceId);
  const intent=captureConstraintGroupIntent(kind==='midpoint'?{kind,action:'create',ids:[a.pointId,a.segmentId]}:{kind,action:a.action,ids:a.ids,angleDegrees:a.angleDegrees}),opts=options(rawOptions),job=captureJob(a.faceId,a.revision,opts);let committed=false;
  try{
   await job.start();await job.inspect(job.source);job.current();const nonce=crypto.randomUUID(),request={revision:nonce,sketchJSON:job.source,externalParameters:job.external,intent},solveOptions={signal:job.controller.signal,valid:()=>{try{job.current();return true}catch{return false}}};
   const result:any=await runSketchTransition(workerUrl,'sketch-transition-constraint-group',request,solveOptions);job.current();if(!result?.ok)throw workerFailure(result,'CONSTRAINT_GROUP_INVALID','Constraint group failed.');
   if(result.revision!==nonce||typeof result.serializedSketch!=='string'||typeof result.changed!=='boolean')throw Error('Invalid constraint group candidate.');
   const verified:any=await verifyConstraintGroupCandidate(workerUrl,{...request,candidateJSON:result.serializedSketch},solveOptions);job.current();if(!verified?.ok||verified.revision!==nonce||verified.verified!==true)throw workerFailure(verified,'INVALID_CANDIDATE','Independent constraint group verification failed.');
   if(!result.changed){if(result.serializedSketch!==job.source)throw Error('A group no-op changed source.');await job.recheckHistory();return Object.freeze({changed:false,faceId:a.faceId,group:result.group,revision:a.revision,persistence:'volatile-workspace',authoredUndo:false,manufacturingAssignments:'unchanged'});}
   const staged=await job.prepare(result.serializedSketch);job.current();await new Promise<void>((yes,no)=>submitPreparedReplay(yes,no,staged.preparation,{kind:'sketch-bytes',faceId:a.faceId,before:job.source,after:staged.override.data}));
   committed=true;if(!job.alive())throw aborted(true);const latest=inspectSketchTransitions();if(!latest.ready||!job.alive())throw aborted(true);
   return Object.freeze({changed:true,faceId:a.faceId,group:result.group,revision:latest.revision,persistence:'volatile-workspace',authoredUndo:true,manufacturingAssignments:'review-if-present'});
  }catch(error){if(committed&&!error?.committed)throw aborted(true);if(!job.alive()&&!error?.committed)throw aborted();throw error;}finally{job.dispose();}
 }
 async function applyClosedSketchMidpoint(input:any,rawOptions?:any){return applyClosedConstraintGroup(input,rawOptions,'midpoint');}
 async function applyClosedSketchAngleGroup(input:any,rawOptions?:any){return applyClosedConstraintGroup(input,rawOptions,'angle-chain');}
 async function inspectClosedSketch(input:any,rawOptions?:any){const a=record(input,['revision','faceId']);revision(a.revision);faceId(a.faceId);const opts=options(rawOptions),job=captureJob(a.faceId,a.revision,opts,true);try{await job.start();const result=await job.inspect(job.source);await job.recheckHistory();return Object.freeze({revision:a.revision,faceId:a.faceId,objects:result.objects,points:result.points,constraints:result.constraints,dimensionTargets:result.dimensionTargets,stageCount:result.stageCount,boundaryFrame:result.boundaryFrame,emptyBoundary:true,lineRelations:lineRelationContracts,constraintGroups:Object.freeze({midpoint:Object.freeze({schema:'PointInMiddle',semantics:'two-coordinate-midpoint',targets:Object.freeze(['inspected-point','Segment'])}),angleChain:Object.freeze({schema:'AngleBetween',semantics:'same-directed-angle-each-consecutive-pair',minSegments:2,maxSegments:16,minDegreesExclusive:0,maxDegreesExclusive:180,branch:'positive-polar-no-zero-crossing'}),sourceScope:'one-nongenerated-ordinary-analytic-stage',eligibility:'requires-worker-validation',mutations:job.typed?'unsupported-typed':'available'}),...(job.typed?{capabilities:Object.freeze({inspection:'supported-typed-length-fields',mutations:'driving-dimension-edit-remove-only'})}:{})});}finally{job.dispose()}}
 // Both mutations use the private full replay and atomic sketch-byte journal.
 async function applyTransition(a:any,opts:any,task:'sketch-transition-remove-primitive'|'sketch-transition-length-relation'|'sketch-transition-primitive'|'sketch-transition-concentric'|'sketch-transition-point-coordinate'|'sketch-transition-point-coordinates'|'sketch-transition-diameter'|'sketch-transition-signed-distance'|'sketch-transition-line-relation'){
  const job=captureJob(a.faceId,a.revision,opts);let committed=false;
  try{
   await job.start();const inspected=await job.inspect(job.source);job.current();
   if(task==='sketch-transition-primitive'&&a.stage!==inspected.stageCount-1)throw Error('Append primitives to the last authored sketch stage.');
   const nonce=crypto.randomUUID(),request:any={revision:nonce,sketchJSON:job.source,externalParameters:job.external};
   if(task==='sketch-transition-primitive')request.primitive=Object.freeze({id:'agent-primitive-'+crypto.randomUUID(),kind:a.kind,role:a.role,stage:a.stage,data:a.data});
   else request.intent=task==='sketch-transition-remove-primitive'?{id:a.id}:task==='sketch-transition-concentric'?{ids:a.ids}:task==='sketch-transition-point-coordinate'?{id:a.id,x:a.x,y:a.y}:task==='sketch-transition-point-coordinates'?{points:a.points}:task==='sketch-transition-diameter'?{id:a.id,diameter:a.diameter}:task==='sketch-transition-signed-distance'?{axis:a.axis,ids:a.ids,distance:a.distance}:task==='sketch-transition-line-relation'?{kind:a.kind,ids:a.ids}:{ids:a.ids,factor:a.factor,offset:a.offset};
   const solveOptions={signal:job.controller.signal,valid:()=>{try{job.current();return true}catch{return false}}};
   const result:any=task==='sketch-transition-concentric'?await runConcentricTransition(request,solveOptions):await runSketchTransition(workerUrl,task,request,solveOptions);
   job.current();if(!result?.ok)throw workerFailure(result,'SOLVE_ERROR','Sketch transition failed.');
   if(result.revision!==nonce||typeof result.serializedSketch!=='string')throw Error('Invalid sketch transition result.');
   if(task==='sketch-transition-remove-primitive'){const verified=await verifyPrimitiveRemovalCandidate(workerUrl,{...request,candidateJSON:result.serializedSketch,removed:result.removed},solveOptions);job.current();if(!verified?.ok||verified.revision!==nonce||verified.verified!==true)throw workerFailure(verified,'INVALID_CANDIDATE','Primitive removal verification failed.');}
   if(task==='sketch-transition-signed-distance'){const verified=await verifySignedDistanceCandidate(workerUrl,{...request,candidateJSON:result.serializedSketch,status:result.dimension.status},solveOptions);job.current();if(!verified?.ok||verified.revision!==nonce||verified.verified!==true)throw workerFailure(verified,'INVALID_CANDIDATE','Signed candidate verification failed.');}
   if(task==='sketch-transition-line-relation'){const verified=await verifyLineRelationCandidate(workerUrl,{...request,candidateJSON:result.serializedSketch,status:result.relation.status,relation:result.relation},solveOptions);job.current();if(!verified?.ok||verified.revision!==nonce||verified.verified!==true)throw workerFailure(verified,'INVALID_CANDIDATE','Line relation candidate verification failed.');}
   if(task==='sketch-transition-point-coordinates'){const verified=await verifyPointsCoordinatesCandidate(workerUrl,{...request,candidateJSON:result.serializedSketch,points:result.points},solveOptions);job.current();if(!verified?.ok||verified.revision!==nonce||verified.verified!==true)throw workerFailure(verified,'INVALID_CANDIDATE','Coordinate candidate verification failed.');}
   if(result.serializedSketch===job.source){
    if(!['sketch-transition-point-coordinate','sketch-transition-point-coordinates'].includes(task)&&!(task==='sketch-transition-line-relation'&&result.relation.existing===true))throw Error('Invalid sketch transition result.');
    await job.recheckHistory();job.current();return Object.freeze({changed:false,faceId:a.faceId,...(task==='sketch-transition-point-coordinate'?{point:result.point}:task==='sketch-transition-point-coordinates'?{points:result.points}:{relation:result.relation}),revision:a.revision,persistence:'volatile-workspace',authoredUndo:false,manufacturingAssignments:'unchanged'});
   }
   const staged=await job.prepare(result.serializedSketch);job.current();
   await new Promise<void>((yes,no)=>submitPreparedReplay(yes,no,staged.preparation,{kind:'sketch-bytes',faceId:a.faceId,before:job.source,after:staged.override.data}));
   committed=true;if(!job.alive())throw aborted(true);const latest=inspectSketchTransitions();if(!latest.ready||!job.alive())throw aborted(true);
   return Object.freeze({changed:true,faceId:a.faceId,...(task==='sketch-transition-remove-primitive'?{removed:result.removed}:task==='sketch-transition-primitive'?{primitive:result.primitive}:task==='sketch-transition-point-coordinate'?{point:result.point}:task==='sketch-transition-point-coordinates'?{points:result.points}:(task==='sketch-transition-diameter'||task==='sketch-transition-signed-distance')?{dimension:result.dimension}:{relation:result.relation}),revision:latest.revision,persistence:'volatile-workspace',authoredUndo:true,manufacturingAssignments:'review-if-present'});
  }catch(error){if(committed&&!error?.committed)throw aborted(true);if(!job.alive()&&!error?.committed)throw aborted();throw error}finally{job.dispose()}
 }
 async function applySketchLengthRelation(input:any,rawOptions?:any){return applyTransition(relation(input),options(rawOptions),'sketch-transition-length-relation')}
 async function applySketchConcentric(input:any,rawOptions?:any){return applyTransition(concentric(input),options(rawOptions),'sketch-transition-concentric')}
 async function editClosedSketchPoints(input:any,rawOptions?:any){return applyTransition(coordinates(input),options(rawOptions),'sketch-transition-point-coordinates')}
 async function editClosedSketchPoint(input:any,rawOptions?:any){return applyTransition(coordinate(input),options(rawOptions),'sketch-transition-point-coordinate')}
 async function applySketchSignedDistance(input:any,rawOptions?:any){return applyTransition(signedDistance(input),options(rawOptions),'sketch-transition-signed-distance')}
 async function applySketchLineRelation(input:any,rawOptions?:any){return applyTransition(lineRelation(input),options(rawOptions),'sketch-transition-line-relation')}
 async function applySketchDiameter(input:any,rawOptions?:any){return applyTransition(diameter(input),options(rawOptions),'sketch-transition-diameter')}
 async function removeClosedSketchPrimitive(input:any,rawOptions?:any){return applyTransition(primitiveRemoval(input),options(rawOptions),'sketch-transition-remove-primitive')}
 async function appendClosedSketchPrimitive(input:any,rawOptions?:any){return applyTransition(primitive(input),options(rawOptions),'sketch-transition-primitive')}
 if(registerTravel)registerTravel(async(id:string,expected:string,target:string,rawOptions:any)=>{faceId(id);const travel=record(rawOptions,['signal','valid','committedValid']);if(typeof expected!=='string'||typeof target!=='string'||expected.length>MAX||target.length>MAX||typeof travel.valid!=='function'||typeof travel.committedValid!=='function')throw Error('Invalid private sketch travel.');const info=inspectSketchTransitions(),job=captureJob(id,info.revision,options({signal:travel.signal,valid:travel.valid}),false,ctx.expressionService.isTyped?{travelSource:target}:undefined);try{if(job.source!==expected)throw aborted();await job.start();await job.inspect(expected);await job.inspect(target);job.current();if(job.typed){const checked=await verifyDrivingDimensionCandidate(workerUrl,{revision:crypto.randomUUID(),sketchJSON:expected,candidateJSON:target,externalParameters:job.external},{signal:job.controller.signal,valid:()=>{try{job.current();return true}catch{return false}}},true);job.current();if(!checked?.ok||checked.verified!==true)throw workerFailure(checked,'INVALID_CANDIDATE','Typed journal travel is not a supported dimension delta.');}const nonce=crypto.randomUUID(),result=await runSketchTransition(workerUrl,'sketch-transition-replay',{revision:nonce,sketchJSON:target,externalParameters:job.external},{signal:job.controller.signal,valid:()=>{try{job.current();return true}catch{return false}}});job.current();if(!result?.ok||result.revision!==nonce)throw Object.assign(new Error(result?.error?.message||'Sketch travel validation failed.'),{code:result?.error?.code||'SOLVE_ERROR'});const staged=await job.prepare(target,travel.committedValid);return {preparation:staged.preparation,dispose:job.dispose};}catch(error){job.dispose();throw error;}});
 return {inspectSketchTransitions,inspectClosedSketch,applyClosedSketchMidpoint,applyClosedSketchAngleGroup,editClosedSketchDimension,removeClosedSketchDimension,applySketchLengthRelation,applySketchConcentric,editClosedSketchPoint,editClosedSketchPoints,applySketchDiameter,applySketchSignedDistance,applySketchLineRelation,appendClosedSketchPrimitive,removeClosedSketchPrimitive};
}
