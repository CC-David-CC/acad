import type {OperationDescriptor} from 'cad/craft/operationBundle';
import {Types} from 'cad/craft/schema/types';
import {MOpenFaceShell} from 'cad/model/mopenFace';
import {MWorkerSolid,WorkerSolidDisplay} from 'cad/model/mworkerSolid';
import {sketchBoundaryFrame} from 'cad/sketch/boundaryValidity';
import {getSketchBoundaries} from 'cad/sketch/sketchBoundaries';
import {sketchRevision} from 'cad/craft/sketchRevision.mjs';
import {requireModernPhysicalHistory} from 'cad/parameters/modernPhysicalBindings.mjs';
import {runSketchSolve} from 'sketcher/headless/client';
import {runPrismSemantic} from 'engine/extrusion/prismSemanticClient';
import {genericHistoryBuild} from 'engine/mount/selectedProfileBuildSelection.mjs';
import {requireCadEngineBuild} from 'engine/mount/engineCatalog.mjs';
import {captureProfileExtentIntent,captureProfileExtentBinding} from 'engine/mount/ownedProfileExtentPlan.mjs';
import {PROFILE_EXTENT_TYPE,materializeOwnedProfileExtentFeature,profileExtentDimensions} from 'engine/solid/ownedProfileExtentFeature.mjs';
import {evaluateWorkerSolid} from 'engine/solid/solidLedger.mjs';
import {captureSelectedProfileSolve,selectedProfileDataAdmission} from '../workerSelectedProfile/workerSelectedProfile.operation';
import sketchWorker from 'codi-headless-sketch-worker';
import semanticWorker from 'codi-prism-semantic-worker';

const {fields,boundedText,jsonData,assetPath,sameFrame,vector}=selectedProfileDataAdmission;
const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
const abort=()=>new DOMException('Profile-extent evaluation was cancelled or superseded.','AbortError');
function prepareResponse(value:any,profile:any,featureId:number,authoredExtent:any,extent:any){
 const r=fields(value,['binding','extentBinding','request','expected'],'INVALID_RESPONSE'),binding=fields(r.binding,['revision','sketchDigest','faceId','regionId'],'INVALID_RESPONSE');
 if(['revision','sketchDigest','faceId','regionId'].some(k=>binding[k]!==profile[k]))fail('INVALID_RESPONSE','Extent preparation changed its captured original source.');
 const request=captureProfileExtentIntent(r.request),proof=captureProfileExtentBinding(r.extentBinding);
 if(request.source.featureId!==featureId||request.source.faceId!==profile.faceId||request.source.sourceSha256!==profile.sketchDigest||request.region.id!==profile.regionId||!sameFrame(request.frame,profile.frame)||jsonData(request.authoredExtent)!==jsonData(authoredExtent)||jsonData(request.extent)!==jsonData(extent)||proof.featureId!==featureId||proof.faceId!==profile.faceId||proof.sourceSha256!==profile.sketchDigest||proof.regionId!==profile.regionId||jsonData(proof.authoredExtent)!==jsonData(authoredExtent)||jsonData(proof.extent)!==jsonData(extent))fail('INVALID_RESPONSE','Extent preparation changed its selection, frame, authored binding or resolved variant.');
 const expected=fields(r.expected,['volume','bounds'],'INVALID_RESPONSE'),bounds=fields(expected.bounds,['min','max'],'INVALID_RESPONSE'),min=vector(bounds.min),max=vector(bounds.max);
 if(typeof expected.volume!=='number'||!Number.isFinite(expected.volume)||expected.volume<=0||min.some((n:number,i:number)=>n>max[i]))fail('INVALID_RESPONSE','Invalid independent extent measurements.');
 return {request,extentBinding:proof,expected:Object.freeze({volume:expected.volume,bounds:Object.freeze({min:Object.freeze(min),max:Object.freeze(max)})}),signature:jsonData(r)};
}

// The operation owns original source/definition/frame capture. Neither the
// semantic request nor a caller-supplied construction binding grants authority.
export function createWorkerProfileExtentOperation(createMount:(engine:string,revision?:string)=>any,validateMount:(engine:string,mount:any,revision?:string)=>void):OperationDescriptor<any>{
 if(typeof createMount!=='function'||typeof validateMount!=='function')fail('INVALID_REQUEST','A checked runtime factory and validator are required.');
 const schema:any={version:{type:Types.number},unit:{type:Types.string},engine:{type:Types.string},engineRevision:{type:Types.string},featureId:{type:Types.number},faceId:{type:Types.string},regionId:{type:Types.string},bodyPolicy:{type:Types.string},extent:{type:Types.string}};
 for(const key of ['distance','length','positive','negative'])schema[key]={type:Types.number,dimension:'length',optional:true};
 return {id:PROFILE_EXTENT_TYPE,label:'Worker profile extents',icon:'img/cad/extrude',info:'Source-owned signed, symmetric or two-sided extrusion as a separate Worker solid.',form:[],schema,paramsInfo:()=>'',admitGeometry:()=>{},
  run:async(materialized:any,ctx:any,raw:any)=>{
   const owner=ctx.engineEvaluation,project=ctx.projectService,storage=ctx.storageService,craft=ctx.craftService,expressions=ctx.expressionService,manager=ctx.projectManager,registry=ctx.cadRegistry,sketchStorage=ctx.sketchStorageService;
   if(!owner||!project?.hasHostLifetime||!project.isDocumentCurrent(project.documentGeneration)||manager?.unit!=='millimeter'||registry?.isEvaluating!==true||typeof sketchStorage?.getSketchData!=='function')fail('INVALID_WORKSPACE','A current owned millimeter evaluation is required.');
   const {authored:p,resolved}=materializeOwnedProfileExtentFeature(raw,expressions,materialized),authoredExtent=profileExtentDimensions(p),extent=profileExtentDimensions(resolved);
   const build=requireCadEngineBuild(p.engine,p.engineRevision),historyBuild=genericHistoryBuild(craft.modifications$.value.history);
   if(build.profileExtentsVersion!==1||build.selectedProfileVersion!==3||build.selectionPlanVersion!==2)fail('UNSUPPORTED_PROFILE_EXTENT_BUILD','Select the explicit source-owned extent build.');
   if(historyBuild&&historyBuild!==build)fail('ENGINE_REVISION_MISMATCH','The authored part must retain its recorded backend.');
   const face=registry.findFace(p.faceId),plane=face?.root;
   if(!(plane instanceof MOpenFaceShell)||plane.face!==face||!face.isPlaneBased||face.defaultSketchId!==p.faceId)fail('STALE_REGION','Select a current owned independent source plane.');
   const typed=expressions?.isTyped===true;
   if(typeof expressions?.script$?.value!=='string'||!expressions.table$?.value||!Array.isArray(expressions.errors$?.value)||expressions.errors$.value.length||!typed&&(expressions.script$.value.trim()||Reflect.ownKeys(expressions.table$.value).length))fail('UNSUPPORTED_PARAMETERS','Use an empty or current authoritative typed parameter source.');
   if(typed){requireModernPhysicalHistory(craft.modifications$.value.history);if(!expressions.hasCurrentPhysicalResult())fail('UNSUPPORTED_PARAMETERS','The typed source is stale.');}
   const source=boundedText(sketchStorage.getSketchData(p.faceId),'UNSUPPORTED_SKETCH'),frame=sketchBoundaryFrame(face),boundary=getSketchBoundaries(face);
   if(Object.values(boundary).some((items:any)=>!Array.isArray(items)||items.length))fail('UNSUPPORTED_SKETCH','Only independent source planes with empty model boundaries are supported.');
   const generation=project.documentGeneration,namespace=project.sketchStorageNamespace,stamp=sketchRevision(storage,namespace),history=craft.modifications$.value,epoch=craft.evaluationEpoch,table=expressions.table$.value,script=expressions.script$.value,streams=[expressions.script$,expressions.table$,expressions.list$,expressions.errors$],versions=streams.map(s=>s.revision),boundaryText=JSON.stringify(boundary),frameText=JSON.stringify(frame);
   let completed=false,timedOut=false,nativeStarted=false;const deadline=performance.now()+30000;
   const valid=()=>{try{return !owner.signal.aborted&&(completed||performance.now()<deadline)&&ctx.engineEvaluation===owner&&ctx.projectService===project&&project.hasHostLifetime&&project.isDocumentCurrent(generation)&&project.sketchStorageNamespace===namespace&&ctx.storageService===storage&&sketchRevision(storage,namespace)===stamp&&ctx.craftService===craft&&craft.modifications$.value===history&&craft.evaluationEpoch===epoch&&ctx.expressionService===expressions&&expressions.isTyped===typed&&expressions.table$.value===table&&(typed?expressions.hasCurrentPhysicalResult():!Reflect.ownKeys(table).length)&&expressions.script$.value===script&&streams.every((s,i)=>s===[expressions.script$,expressions.table$,expressions.list$,expressions.errors$][i]&&s.revision===versions[i])&&!expressions.errors$.value.length&&ctx.projectManager===manager&&manager.unit==='millimeter'&&ctx.cadRegistry===registry&&registry.isEvaluating===true&&registry.findFace(p.faceId)===face&&face.root===plane&&plane.face===face&&face.defaultSketchId===p.faceId&&ctx.sketchStorageService===sketchStorage&&sketchStorage.getSketchData(p.faceId)===source&&JSON.stringify(sketchBoundaryFrame(face))===frameText&&JSON.stringify(getSketchBoundaries(face))===boundaryText;}catch{return false;}};
   const current=()=>{owner.requireCurrent();if(!valid())throw abort();owner.requireCurrent();};
   const remaining=()=>{current();const left=Math.ceil(deadline-performance.now());if(left<1)throw abort();return Math.min(30000,left);};
   const timer=setTimeout(()=>{timedOut=true;owner.close();},30000);
   try{
    current();const solve=async()=>{const revision=crypto.randomUUID(),value=await runSketchSolve(assetPath(sketchWorker),typed?{task:'typed-selected-profile-solve',revision,sketchJSON:source,boundary,parameterSource:script}:{task:'rectangle-extrusion-solve',revision,sketchJSON:source,boundary,externalParameters:{}},{signal:owner.signal,valid,timeoutMs:remaining()});current();if(value?.ok===false)fail(value.error?.code||'SOLVE_ERROR',value.error?.message||'Source verification failed.');return captureSelectedProfileSolve(value,revision);};
    const first=await solve(),second=await solve();if(first.source!==second.source||first.digest!==second.digest||first.evidence!==second.evidence)fail('INVALID_RESPONSE','Independent source Worker results differ.');
    const profile={unit:'millimeter',engine:'occ',profileVersion:3,revision:crypto.randomUUID(),sketchDigest:first.digest,faceId:p.faceId,regionId:p.regionId,frame,sketchJSON:first.source};
    const prepare=async()=>{const value=await runPrismSemantic(assetPath(semanticWorker),{kind:'prepare-profile-extents',extent:{profile,featureId:p.featureId,authoredExtent,extent}},{signal:owner.signal,valid,timeoutMs:remaining()});current();return prepareResponse(value,profile,p.featureId,authoredExtent,extent);};
    const prepared=await prepare(),verified=await prepare();if(prepared.signature!==verified.signature)fail('INVALID_RESPONSE','Independent extent semantic results differ.');
    nativeStarted=true;const result=await evaluateWorkerSolid({owner,kind:'profile-extents',sourceBinding:{featureId:p.featureId,faceId:p.faceId,regionId:p.regionId,sourceSnapshot:source,parameterSource:script},request:{version:1,unit:p.unit,engine:p.engine,engineRevision:p.engineRevision,featureId:p.featureId,profileExtent:prepared.request,extentBinding:prepared.extentBinding},registry,createMount,validateMount,createModel:(id:number,engine:'occ'|'manifold'|'smlib',display:Float64Array|WorkerSolidDisplay,runtime:Readonly<Record<string,string>>,metrics:Readonly<any>)=>new MWorkerSolid(id,engine,display,runtime,metrics),valid});
    current();if(!(result.model instanceof MWorkerSolid)||result.consumed.length)fail('INVALID_RESPONSE','The source-owned extent output is unavailable.');
    const expected=prepared.expected,metrics=result.model.inspectKernelMetrics(),measurements=()=>{if(typeof metrics.nativeVolume!=='number'||Math.abs(metrics.nativeVolume-expected.volume)>Math.max(1e-6,Math.abs(expected.volume)*1e-9)||!metrics.nativeBounds||['min','max'].some(k=>expected.bounds[k].some((n:number,i:number)=>Math.abs(metrics.nativeBounds[k][i]-n)>Math.max(1e-7,Math.abs(n)*1e-12))))fail('NATIVE_MEASUREMENT_MISMATCH','Native extent measurements differ from the independently prepared original-source interval.');};
    const publicationCheck=()=>{if(!valid())throw abort();result.publicationCheck();measurements();if(!valid())throw abort();};
    publicationCheck();owner.addPublicationCheck('profile-extents:'+p.featureId,publicationCheck);current();completed=true;return {created:[result.model],consumed:[]};
   }catch(error){if(nativeStarted)owner.close();if(timedOut)fail('TIMEOUT','Profile-extent evaluation timed out.');throw error;}finally{clearTimeout(timer);}
  }
 };
}
