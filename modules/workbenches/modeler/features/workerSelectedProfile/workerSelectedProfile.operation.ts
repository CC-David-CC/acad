import {captureAnalyticProfileRequest} from 'engine/mount/analyticProfilePlan.mjs';
import {isMechanicalConstructorRuntime,captureProfileConstructorBinding,captureProfileConstructorSource} from 'engine/mount/profileConstructorSourceBinding.mjs';
import {isAuthoredLength,resolveAuthoredLength} from 'engine/solid/authoredLengthBinding.mjs';
import {requireModernPhysicalHistory} from 'cad/parameters/modernPhysicalBindings.mjs';
import type {OperationDescriptor} from 'cad/craft/operationBundle';
import {Types} from 'cad/craft/schema/types';
import {MOpenFaceShell} from 'cad/model/mopenFace';
import {MSketchRegion} from 'cad/model/msketchRegion';
import {MWorkerSolid,WorkerSolidDisplay} from 'cad/model/mworkerSolid';
import {sketchBoundaryFrame} from 'cad/sketch/boundaryValidity';
import {getSketchBoundaries} from 'cad/sketch/sketchBoundaries';
import {sketchRevision} from 'cad/craft/sketchRevision.mjs';
import {runSketchSolve} from 'sketcher/headless/client';
import {runPrismSemantic} from 'engine/extrusion/prismSemanticClient';
import {captureSelectedProfileRequest,capturePolygonProfileRequest} from 'engine/mount/selectedProfilePlan.mjs';
import {requireSelectedProfileBuild,selectedProfileVersion,genericHistoryBuild} from 'engine/mount/selectedProfileBuildSelection.mjs';
import {evaluateWorkerSolid} from 'engine/solid/solidLedger.mjs';
import {captureCircularCellRequest} from 'engine/mount/ownedCircularArrangementProtocol.mjs';
import sketchWorker from 'codi-headless-sketch-worker';
import semanticWorker from 'codi-prism-semantic-worker';

const MAX=65536;
const fail=(code:string,message:string):never=>{throw Object.assign(new Error(message),{code});};
const abort=()=>new DOMException('Selected-profile operation was cancelled or superseded.','AbortError');
function fields(value:any,keys:string[],code='INVALID_REQUEST'){
 if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))fail(code,'Expected exact selected-profile data fields.');
 const out:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))fail(code,'Selected-profile fields must be data.');out[key]=d.value;}return out;
}
function boundedText(value:any,code:string){if(typeof value!=='string'||value.length>MAX||new TextEncoder().encode(value).byteLength>MAX)fail(code,'Selected-profile source/response exceeds 64 KiB.');return value;}
// Bounded data admission only. No solve, hash, topology or geometry evaluation
// runs on the main thread. Dedicated Workers own those computations.
function jsonData(value:any,code='INVALID_RESPONSE'){
 const pending=[{value,depth:0}],seen=new Set();let nodes=0,characters=0;
 while(pending.length){const item=pending.pop(),v=item.value;if(++nodes>8192||item.depth>32)fail(code,'Selected-profile response tree exceeds its limit.');if(typeof v==='string'){characters+=v.length;}else if(typeof v==='number'){if(!Number.isFinite(v))fail(code,'Nonfinite selected-profile response.');}else if(v!==null&&typeof v==='object'){
  if(seen.has(v))fail(code,'Selected-profile response must be a tree.');seen.add(v);const proto=Object.getPrototypeOf(v);if(!Array.isArray(v)&&proto!==null&&proto!==Object.prototype)fail(code,'Selected-profile response must be plain data.');
  const keys=Reflect.ownKeys(v);if(keys.length>8193||Array.isArray(v)&&(v.length>8192||keys.length!==v.length+1))fail(code,'Selected-profile response arrays must be dense and bounded.');
  for(const key of keys){if(Array.isArray(v)&&key==='length')continue;const name=typeof key==='string'?key:fail(code,'Selected-profile response keys must be strings.');if(Array.isArray(v)&&(!/^(?:0|[1-9][0-9]*)$/.test(name)||Number(name)>=v.length))fail(code,'Selected-profile response arrays must be dense data.');characters+=name.length;const d=Object.getOwnPropertyDescriptor(v,name);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))fail(code,'Selected-profile response fields must be data.');pending.push({value:d.value,depth:item.depth+1});}
 }else if(v!==null&&typeof v!=='boolean')fail(code,'Unsupported selected-profile response value.');if(characters>MAX)fail(code,'Selected-profile response text exceeds its limit.');}
 return boundedText(JSON.stringify(value),code);
}
function assetPath(asset:string){const url=new URL(asset,globalThis.location.href);if(url.origin!==globalThis.location.origin||!['http:','https:'].includes(url.protocol)||url.search||url.hash)fail('INVALID_REQUEST','Selected-profile Workers must use trusted same-origin assets.');return url.pathname;}
function sameFrame(a:any,b:any){return ['origin','x','y','z'].every(key=>Array.isArray(a[key])&&Array.isArray(b[key])&&a[key].length===3&&b[key].length===3&&a[key].every((v:number,i:number)=>Object.is(v,b[key][i])));}
function vector(value:any){if(!Array.isArray(value)||value.length!==3||Reflect.ownKeys(value).length!==4)fail('INVALID_RESPONSE','Expected dense native bounds.');return [0,1,2].map(i=>{const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value)||Math.abs(d.value)>4e6)fail('INVALID_RESPONSE','Expected bounded finite native bounds.');return d.value;});}
export function captureSelectedProfileSolve(result:any,revision:string){
 const r=fields(result,['revision','ok','sketch','evidence','serializedSketch','sketchDigest'],'INVALID_RESPONSE');
 if(r.ok!==true||r.revision!==revision||typeof r.sketchDigest!=='string'||!/^[a-f0-9]{64}$/.test(r.sketchDigest)||!r.sketch||typeof r.sketch!=='object'||Array.isArray(r.sketch)||!Array.isArray(r.evidence)||r.evidence.length>4096)fail('INVALID_RESPONSE','Invalid selected-profile solve response.');
 boundedText(r.serializedSketch,'INVALID_RESPONSE');if(jsonData(r.sketch)!==r.serializedSketch)fail('INVALID_RESPONSE','Solve source and serialized source differ.');
 const evidence=jsonData(r.evidence);return {source:r.serializedSketch,digest:r.sketchDigest,evidence};
}
function preparedResponse(result:any,input:any,featureId?:number){
 const r=fields(result,['binding','request','expected',...(featureId===undefined?[]:['sourceCreationBinding'])],'INVALID_RESPONSE'),binding=fields(r.binding,['revision','sketchDigest','faceId','regionId'],'INVALID_RESPONSE');
 if(['revision','sketchDigest','faceId','regionId'].some(k=>binding[k]!==input[k]))fail('INVALID_RESPONSE','Selected-profile semantic binding changed.');
 let request:any;try{const analytic=Object.getOwnPropertyDescriptor(r.request||{},'version')?.value===5;if(analytic&&input.analyticProfileVersion!==1)fail('INVALID_RESPONSE','Analytic preparation lacks its exact backend capability.');const circular=Object.getOwnPropertyDescriptor(r.request||{},'version')?.value===4;if(circular&&input.circularArrangementVersion!==1)fail('INVALID_RESPONSE','Circular preparation lacks its recorded build capability.');request=analytic?captureAnalyticProfileRequest(r.request):circular?captureCircularCellRequest(r.request):(input.profileVersion===3?capturePolygonProfileRequest:captureSelectedProfileRequest)(r.request);}catch{fail('INVALID_RESPONSE','Invalid prepared selected-profile request.');}if(request.region.id!==input.regionId||request.depth!==input.depth||!sameFrame(request.frame,input.frame)||request.version===4&&request.region.faceId!==input.faceId)fail('INVALID_RESPONSE','Selected-profile request changed its selection, source, depth or frame.');
 const expected=fields(r.expected,['volume','bounds'],'INVALID_RESPONSE'),b=fields(expected.bounds,['min','max'],'INVALID_RESPONSE'),min=vector(b.min),max=vector(b.max);
 if(typeof expected.volume!=='number'||!Number.isFinite(expected.volume)||expected.volume<=0||min.some((v,i)=>v>max[i]))fail('INVALID_RESPONSE','Invalid expected native measurements.');
 const sourceCreationBinding=featureId===undefined?undefined:captureProfileConstructorBinding(r.sourceCreationBinding);
 if(sourceCreationBinding&&(sourceCreationBinding.featureId!==featureId||sourceCreationBinding.faceId!==input.faceId||sourceCreationBinding.regionId!==input.regionId||sourceCreationBinding.sourceSha256!==input.sketchDigest))fail('INVALID_RESPONSE','Bound constructor receipt changed actual authored source identity.');
 return {request,expected:Object.freeze({volume:expected.volume,bounds:Object.freeze({min:Object.freeze(min),max:Object.freeze(max)})}),...(sourceCreationBinding?{sourceCreationBinding}:{}),signature:jsonData(r)};
}

export const selectedProfileDataAdmission=Object.freeze({fields,boundedText,jsonData,assetPath,sameFrame,vector});

export function createWorkerSelectedProfileOperation(createMount:(engine:string,revision?:string)=>any,validateMount:(engine:string,mount:any,revision?:string)=>void):OperationDescriptor<any>{
 if(typeof createMount!=='function'||typeof validateMount!=='function')fail('INVALID_REQUEST','Checked runtime factory and validator are required.');
 const schema:any={version:{type:Types.number},unit:{type:Types.string},engine:{type:Types.string},engineRevision:{type:Types.string},featureId:{type:Types.number},faceId:{type:Types.string},regionId:{type:Types.string},depth:{type:Types.number,dimension:'length'},bodyPolicy:{type:Types.string}},keys=Object.keys(schema);
 return {id:'WORKER_SELECTED_PROFILE_EXTRUDE_V2',label:'Worker selected-region extrusion',icon:'img/cad/extrude',info:'Extrude one supported region as a separate OCC Worker solid; retain its source sketch.',form:[],schema,paramsInfo:({depth}:any)=>`(${depth} mm)`,admitGeometry:()=>{},
  run:async(_params:any,ctx:any,raw:any)=>{
   const p=fields(raw,keys);if(p.version!==1||p.unit!=='millimeter'||p.engine!=='occ'||typeof p.engineRevision!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(p.engineRevision)||!Number.isSafeInteger(p.featureId)||p.featureId<=0||p.bodyPolicy!=='separate'||!isAuthoredLength(p.depth)||typeof p.faceId!=='string'||!p.faceId||p.faceId.length>256||typeof p.regionId!=='string'||!p.regionId.startsWith('sketch-region:')||p.regionId.length>8192)fail('INVALID_REQUEST','Expected one explicitly separate bounded OCC region feature.');
   const owner=ctx.engineEvaluation,project=ctx.projectService,storage=ctx.storageService,craft=ctx.craftService,expressions=ctx.expressionService,manager=ctx.projectManager,registry=ctx.cadRegistry,sketchStorage=ctx.sketchStorageService;
   if(!owner||!project?.hasHostLifetime||!project.isDocumentCurrent(project.documentGeneration)||manager?.unit!=='millimeter'||registry?.isEvaluating!==true||typeof sketchStorage?.getSketchData!=='function')fail('INVALID_WORKSPACE','A current owned millimeter evaluation is required.');
   const build=requireSelectedProfileBuild(p.engine,p.engineRevision),profileVersion=selectedProfileVersion(build),historyBuild=genericHistoryBuild(craft.modifications$.value.history);
   if(historyBuild&&historyBuild!==build)fail('ENGINE_REVISION_MISMATCH','The authored generic part must retain its recorded backend.');
   const boundConstructor=isMechanicalConstructorRuntime(p.engineRevision),bindingVersion=(build as any).profileSourceBindingVersion??0;
   if(boundConstructor?(bindingVersion!==1||profileVersion!==3||build.selectionPlanVersion!==2):bindingVersion!==0)fail('UNSUPPORTED_PROFILE_BUILD','Constructor source binding requires its exact closed mechanical cohort.');
   const face=registry.findFace(p.faceId),region=profileVersion===2?registry.find(p.regionId):null,plane=face?.root;
   if(!(plane instanceof MOpenFaceShell)||plane.face!==face||!face.isPlaneBased||face.defaultSketchId!==p.faceId)fail('STALE_REGION','Select a current owned independent source plane.');
   // V2 retains the legacy render-region proof. V3 membership is established
   // by two genuine source reconstructions and two explicit version3 semantic
   // preparations, bound to this source/frame/face/history, before native work.
   const legacyRegionCurrent=()=>profileVersion===3||registry.find(p.regionId)===region&&region instanceof MSketchRegion&&region.face===face&&face.sketchRegions.includes(region)&&'sketch-region:'+JSON.stringify(region.descriptor)===p.regionId;
   if(!legacyRegionCurrent())fail('STALE_REGION','Select one current region on an owned source plane.');
   const typed=expressions?.isTyped===true;
   if(typeof expressions?.script$?.value!=='string'||!expressions.table$?.value||!Array.isArray(expressions.errors$?.value)||expressions.errors$.value.length||!typed&&(expressions.script$.value.trim()||Reflect.ownKeys(expressions.table$.value).length))fail('UNSUPPORTED_PARAMETERS','Use an empty or current authoritative typed parameter source.');
   if(typed){requireModernPhysicalHistory(craft.modifications$.value.history);if(profileVersion!==3||!expressions.hasCurrentPhysicalResult())fail('UNSUPPORTED_PARAMETERS','Typed selected profiles require a current version3 source path.');}
   const resolvedDepth=resolveAuthoredLength(p.depth,expressions);if(!Object.is(_params.depth,resolvedDepth))fail('INVALID_REQUEST','Materialized depth differs from the current authored typed binding.');p.depth=resolvedDepth;
   const source=boundedText(sketchStorage.getSketchData(p.faceId),'UNSUPPORTED_SKETCH'),frame=sketchBoundaryFrame(face),boundary=getSketchBoundaries(face);
   if(Object.values(boundary).some((items:any)=>!Array.isArray(items)||items.length))fail('UNSUPPORTED_SKETCH','Only independent source planes with empty model boundaries are supported.');
   const generation=project.documentGeneration,namespace=project.sketchStorageNamespace,stamp=sketchRevision(storage,namespace),history=craft.modifications$.value,epoch=craft.evaluationEpoch,table=expressions.table$.value,script=expressions.script$.value,streams=[expressions.script$,expressions.table$,expressions.list$,expressions.errors$],versions=streams.map(s=>s.revision),boundaryText=JSON.stringify(boundary),frameText=JSON.stringify(frame);
   let completed=false,timedOut=false,nativeStarted=false;const deadline=performance.now()+30000;
   const valid=()=>{try{return !owner.signal.aborted&&(completed||performance.now()<deadline)&&ctx.engineEvaluation===owner&&ctx.projectService===project&&project.hasHostLifetime&&project.isDocumentCurrent(generation)&&project.sketchStorageNamespace===namespace&&ctx.storageService===storage&&sketchRevision(storage,namespace)===stamp&&ctx.craftService===craft&&craft.modifications$.value===history&&craft.evaluationEpoch===epoch&&ctx.expressionService===expressions&&expressions.isTyped===typed&&expressions.table$.value===table&&(typed?expressions.hasCurrentPhysicalResult():!Reflect.ownKeys(table).length)&&expressions.script$.value===script&&streams.every((s,i)=>s===[expressions.script$,expressions.table$,expressions.list$,expressions.errors$][i]&&s.revision===versions[i])&&!expressions.errors$.value.length&&ctx.projectManager===manager&&manager.unit==='millimeter'&&ctx.cadRegistry===registry&&registry.isEvaluating===true&&registry.findFace(p.faceId)===face&&face.root===plane&&plane.face===face&&face.defaultSketchId===p.faceId&&legacyRegionCurrent()&&ctx.sketchStorageService===sketchStorage&&sketchStorage.getSketchData(p.faceId)===source&&JSON.stringify(sketchBoundaryFrame(face))===frameText&&JSON.stringify(getSketchBoundaries(face))===boundaryText;}catch{return false;}};
   const current=()=>{owner.requireCurrent();if(!valid())throw abort();owner.requireCurrent();};
   const remaining=()=>{current();const left=Math.ceil(deadline-performance.now());if(left<1)throw abort();return Math.min(30000,left);};
   const timer=setTimeout(()=>{timedOut=true;owner.close();},30000);
   try{
    current();const solve=async()=>{const revision=crypto.randomUUID(),value=await runSketchSolve(assetPath(sketchWorker),typed?{task:'typed-selected-profile-solve',revision,sketchJSON:source,boundary,parameterSource:script}:{task:'rectangle-extrusion-solve',revision,sketchJSON:source,boundary,externalParameters:{}},{signal:owner.signal,valid,timeoutMs:remaining()});current();if(value?.ok===false)fail(value.error?.code||'SOLVE_ERROR',value.error?.message||'Sketch solving failed.');return captureSelectedProfileSolve(value,revision);};
    const first=await solve(),second=await solve();if(first.source!==second.source||first.digest!==second.digest||first.evidence!==second.evidence)fail('INVALID_RESPONSE','Independent sketch Worker results differ.');
    const revision=crypto.randomUUID(),input={unit:'millimeter',engine:'occ',profileVersion,...((build as any).analyticProfileVersion===1?{analyticProfileVersion:1}:{}),...((build as any).circularArrangementVersion===1?{circularArrangementVersion:1}:{}),revision,sketchDigest:first.digest,faceId:p.faceId,regionId:p.regionId,frame,depth:p.depth,sketchJSON:first.source};
    const constructorSource=boundConstructor?captureProfileConstructorSource(input):null;
    const prepare=async()=>{const value=await runPrismSemantic(assetPath(semanticWorker),boundConstructor?{kind:'prepare-selected-bound',featureId:p.featureId,profile:constructorSource}:{kind:'prepare-selected',profile:input},{signal:owner.signal,valid,timeoutMs:remaining()});current();return preparedResponse(value,input,boundConstructor?p.featureId:undefined);};
    const prepared=await prepare(),verified=await prepare();if(prepared.signature!==verified.signature)fail('INVALID_RESPONSE','Independent selected-profile semantic results differ.');
    if(prepared.request.version===4&&((build as any).circularArrangementVersion!==1||build.selectionPlanVersion!==2))fail('UNSUPPORTED_PROFILE_BUILD','Circular cells require the exact registered circular/selection-plan-v2 runtime.');
    if(prepared.request.version===4&&typed)fail('UNSUPPORTED_PARAMETERS','Circular arrangement cells are outside the integrated ordinary typed profile family.');
    if(prepared.request.region.boundaryProvenance&&build.selectionPlanVersion!==2)fail('UNSUPPORTED_PROFILE_BUILD','Arrangement cells require the recorded selection-plan-v2 build.');
    if(prepared.request.region.boundaryProvenance&&typed)fail('UNSUPPORTED_PARAMETERS','Derived arrangement cells are outside the qualified canonical typed rectangle family.');
    nativeStarted=true;const result=await evaluateWorkerSolid({owner,kind:'profile',sourceBinding:{featureId:p.featureId,faceId:p.faceId,regionId:p.regionId,...(boundConstructor?{constructorSource,sourceCreationBinding:prepared.sourceCreationBinding}:{})},request:{version:1,unit:p.unit,engine:p.engine,engineRevision:p.engineRevision,featureId:p.featureId,profile:prepared.request},registry,createMount,validateMount,createModel:(id:number,engine:'occ'|'manifold'|'smlib',display:Float64Array|WorkerSolidDisplay,runtime:Readonly<Record<string,string>>,metrics:Readonly<any>)=>new MWorkerSolid(id,engine,display,runtime,metrics),valid});
    current();if(!(result.model instanceof MWorkerSolid)||result.consumed.length)fail('INVALID_RESPONSE','Selected-profile solid projection is unavailable.');
    const expected=prepared.expected,metrics=result.model.inspectKernelMetrics(),measurements=()=>{if(typeof metrics.nativeVolume!=='number'||Math.abs(metrics.nativeVolume-expected.volume)>Math.max(1e-6,Math.abs(expected.volume)*1e-9)||!metrics.nativeBounds||['min','max'].some(k=>expected.bounds[k].some((v:number,i:number)=>Math.abs(metrics.nativeBounds[k][i]-v)>Math.max(1e-7,Math.abs(v)*1e-12))))fail('NATIVE_MEASUREMENT_MISMATCH','Native result does not match the selected region measurements.');};
    const publicationCheck=()=>{if(!valid())throw abort();result.publicationCheck();measurements();if(!valid())throw abort();};
    publicationCheck();owner.addPublicationCheck('selected-profile:'+p.featureId,publicationCheck);current();completed=true;return {created:[result.model],consumed:[]};
   }catch(error){if(nativeStarted)owner.close();if(timedOut)fail('TIMEOUT','Selected-profile evaluation timed out.');throw error;}finally{clearTimeout(timer);}
  }
 };
}
