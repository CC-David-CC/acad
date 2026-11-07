import type {OperationDescriptor} from 'cad/craft/operationBundle';
import {Types} from 'cad/craft/schema/types';
import {MOpenFaceShell} from 'cad/model/mopenFace';
import {MWorkerSolid,WorkerSolidDisplay} from 'cad/model/mworkerSolid';
import {sketchBoundaryFrame} from 'cad/sketch/boundaryValidity';
import {getSketchBoundaries} from 'cad/sketch/sketchBoundaries';
import {sketchRevision} from 'cad/craft/sketchRevision.mjs';
import {runSketchSolve} from 'sketcher/headless/client';
import {runPrismSemantic} from 'engine/extrusion/prismSemanticClient';
import {captureOwnedRevolveFeature,captureOwnedRevolveEvaluation,captureRevolveSourceAxis} from 'engine/solid/ownedRevolveFeature.mjs';
import {captureOwnedRevolveIntent} from 'engine/solid/ownedRevolveIntent.mjs';
import sketchWorker from 'codi-headless-sketch-worker';
import semanticWorker from 'codi-prism-semantic-worker';
import {captureSelectedProfileSolve} from '../workerSelectedProfile/workerSelectedProfile.operation';

const MAX=65536;
const fail=(code:string,message:string):never=>{throw Object.assign(new Error(message),{code});};
const abort=()=>new DOMException('Revolve operation was cancelled or superseded.','AbortError');
function fields(value:any,keys:string[],code='INVALID_REQUEST'){
 if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))fail(code,'Expected exact selected-profile data fields.');
 const out:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))fail(code,'Revolve fields must be data.');out[key]=d.value;}return out;
}
function boundedText(value:any,code:string){if(typeof value!=='string'||value.length>MAX||new TextEncoder().encode(value).byteLength>MAX)fail(code,'Revolve source/response exceeds 64 KiB.');return value;}
// Bounded data admission only. No solve, hash, topology or geometry evaluation
// runs on the main thread. Dedicated Workers own those computations.
function jsonData(value:any,code='INVALID_RESPONSE'){
 const pending=[{value,depth:0}],seen=new Set();let nodes=0,characters=0;
 while(pending.length){const item=pending.pop(),v=item.value;if(++nodes>8192||item.depth>32)fail(code,'Revolve response tree exceeds its limit.');if(typeof v==='string'){characters+=v.length;}else if(typeof v==='number'){if(!Number.isFinite(v))fail(code,'Nonfinite selected-profile response.');}else if(v!==null&&typeof v==='object'){
  if(seen.has(v))fail(code,'Revolve response must be a tree.');seen.add(v);const proto=Object.getPrototypeOf(v);if(!Array.isArray(v)&&proto!==null&&proto!==Object.prototype)fail(code,'Revolve response must be plain data.');
  const keys=Reflect.ownKeys(v);if(keys.length>8193||Array.isArray(v)&&(v.length>8192||keys.length!==v.length+1))fail(code,'Revolve response arrays must be dense and bounded.');
  for(const key of keys){if(Array.isArray(v)&&key==='length')continue;const name=typeof key==='string'?key:fail(code,'Revolve response keys must be strings.');if(Array.isArray(v)&&(!/^(?:0|[1-9][0-9]*)$/.test(name)||Number(name)>=v.length))fail(code,'Revolve response arrays must be dense data.');characters+=name.length;const d=Object.getOwnPropertyDescriptor(v,name);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))fail(code,'Revolve response fields must be data.');pending.push({value:d.value,depth:item.depth+1});}
 }else if(v!==null&&typeof v!=='boolean')fail(code,'Unsupported selected-profile response value.');if(characters>MAX)fail(code,'Revolve response text exceeds its limit.');}
 return boundedText(JSON.stringify(value),code);
}
function assetPath(asset:string){const url=new URL(asset,globalThis.location.href);if(url.origin!==globalThis.location.origin||!['http:','https:'].includes(url.protocol)||url.search||url.hash)fail('INVALID_REQUEST','Revolve Workers must use trusted same-origin assets.');return url.pathname;}
function sameFrame(a:any,b:any){return ['origin','x','y','z'].every(key=>Array.isArray(a[key])&&Array.isArray(b[key])&&a[key].length===3&&b[key].length===3&&a[key].every((v:number,i:number)=>Object.is(v,b[key][i])));}
function preparedResponse(result:any,input:any,axis:any){
 const r=fields(result,['binding','request','revolveBinding'],'INVALID_RESPONSE'),binding=fields(r.binding,['revision','sketchDigest','faceId','regionId','axisSegmentId','angleRadians'],'INVALID_RESPONSE');
 if(Object.keys(binding).some(k=>binding[k]!==input[k]))fail('INVALID_RESPONSE','Revolve source/axis binding changed.');
 let request:any;try{request=captureOwnedRevolveIntent(r.request);}catch{fail('INVALID_RESPONSE','Invalid prepared revolve request.');}
 if(request.source.faceId!==input.faceId||request.source.sourceSha256!==input.sketchDigest||request.region.id!==input.regionId||request.axis.id!==input.axisSegmentId||request.angleRadians!==input.angleRadians||!sameFrame(request.frame,input.frame))fail('INVALID_RESPONSE','Prepared revolve changed the captured source, axis, angle or frame.');
 if(JSON.stringify(request.axis.a)!==JSON.stringify(axis.a)||JSON.stringify(request.axis.b)!==JSON.stringify(axis.b))fail('INVALID_RESPONSE','Prepared revolve changed actual source Segment endpoints.');
 const rb=fields(r.revolveBinding,['version','unit','source','regionId','axisId','angleRadians','requestSha256'],'INVALID_RESPONSE'),source=fields(rb.source,['faceId','sourceSha256'],'INVALID_RESPONSE');
 if(rb.version!==1||rb.unit!=='millimeter'||source.faceId!==input.faceId||source.sourceSha256!==input.sketchDigest||rb.regionId!==input.regionId||rb.axisId!==input.axisSegmentId||rb.angleRadians!==input.angleRadians||typeof rb.requestSha256!=='string'||!/^[a-f0-9]{64}$/.test(rb.requestSha256))fail('INVALID_RESPONSE','Invalid native revolve request binding.');
 return{request,signature:jsonData(r)};
}

// Factory supplies the REAL shared ledger. Its request is ephemeral; only the
// descriptor's exact ten authored fields are serialized into history.
export function createWorkerSelectedRevolveOperation({evaluate,buildPolicy}:{evaluate:(input:any)=>Promise<any>;buildPolicy:any}):OperationDescriptor<any>{
 if(typeof evaluate!=='function'||typeof buildPolicy?.requireBuild!=='function'||typeof buildPolicy?.historyBuild!=='function')fail('INVALID_REQUEST','Real evaluator and registered build policy are required.');
 const schema:any={version:{type:Types.number},unit:{type:Types.string},engine:{type:Types.string},engineRevision:{type:Types.string},featureId:{type:Types.number},faceId:{type:Types.string},regionId:{type:Types.string},axisSegmentId:{type:Types.string},angleRadians:{type:Types.number},bodyPolicy:{type:Types.string}},keys=Object.keys(schema);
 return {id:'WORKER_SELECTED_PROFILE_REVOLVE_V1',label:'Worker selected-region revolve',icon:'img/cad/revolve',info:'Revolve one source region about its actual source Segment; retain the source plane.',form:[],schema,paramsInfo:({angleRadians}:any)=>`(${angleRadians} rad)`,admitGeometry:()=>{},
  run:async(_params:any,ctx:any,raw:any)=>{
   fields(raw,keys);const p=captureOwnedRevolveFeature(raw);
   const owner=ctx.engineEvaluation,project=ctx.projectService,storage=ctx.storageService,craft=ctx.craftService,expressions=ctx.expressionService,manager=ctx.projectManager,registry=ctx.cadRegistry,sketchStorage=ctx.sketchStorageService;
   if(!owner||!project?.hasHostLifetime||!project.isDocumentCurrent(project.documentGeneration)||manager?.unit!=='millimeter'||registry?.isEvaluating!==true||typeof sketchStorage?.getSketchData!=='function')fail('INVALID_WORKSPACE','A current owned millimeter evaluation is required.');
   const build=buildPolicy.requireBuild(p.engine,p.engineRevision),historyBuild=buildPolicy.historyBuild(craft.modifications$.value.history);
   if(build?.id!==p.engine||build.revision!==p.engineRevision||build.revolveVersion!==1)fail('UNSUPPORTED_REVOLVE_BUILD','An explicit registered revolve build is required.');
   if(historyBuild&&(historyBuild.id!==build.id||historyBuild.revision!==build.revision))fail('ENGINE_REVISION_MISMATCH','The authored generic part must retain its recorded backend.');
   const face=registry.findFace(p.faceId),plane=face?.root;
   if(!(plane instanceof MOpenFaceShell)||plane.face!==face||!face.isPlaneBased||face.defaultSketchId!==p.faceId)fail('STALE_REGION','Select a current owned independent source plane.');

   if(expressions?.isTyped||typeof expressions?.script$?.value!=='string'||expressions.script$.value.trim()||!expressions.table$?.value||Reflect.ownKeys(expressions.table$.value).length||!Array.isArray(expressions.errors$?.value)||expressions.errors$.value.length)fail('UNSUPPORTED_PARAMETERS','This operation currently requires untyped sketches without project/external parameters.');
   const source=boundedText(sketchStorage.getSketchData(p.faceId),'UNSUPPORTED_SKETCH'),frame=sketchBoundaryFrame(face),boundary=getSketchBoundaries(face);
   if(Object.values(boundary).some((items:any)=>!Array.isArray(items)||items.length))fail('UNSUPPORTED_SKETCH','Only independent source planes with empty model boundaries are supported.');
   const generation=project.documentGeneration,namespace=project.sketchStorageNamespace,stamp=sketchRevision(storage,namespace),history=craft.modifications$.value,epoch=craft.evaluationEpoch,table=expressions.table$.value,script=expressions.script$.value,streams=[expressions.script$,expressions.table$,expressions.list$,expressions.errors$],versions=streams.map(s=>s.revision),boundaryText=JSON.stringify(boundary),frameText=JSON.stringify(frame);
   let completed=false,timedOut=false,nativeStarted=false;const deadline=performance.now()+30000;
   const valid=()=>{try{return !owner.signal.aborted&&(completed||performance.now()<deadline)&&ctx.engineEvaluation===owner&&ctx.projectService===project&&project.hasHostLifetime&&project.isDocumentCurrent(generation)&&project.sketchStorageNamespace===namespace&&ctx.storageService===storage&&sketchRevision(storage,namespace)===stamp&&ctx.craftService===craft&&craft.modifications$.value===history&&craft.evaluationEpoch===epoch&&ctx.expressionService===expressions&&!expressions.isTyped&&expressions.table$.value===table&&!Reflect.ownKeys(table).length&&expressions.script$.value===script&&streams.every((s,i)=>s===[expressions.script$,expressions.table$,expressions.list$,expressions.errors$][i]&&s.revision===versions[i])&&!expressions.errors$.value.length&&ctx.projectManager===manager&&manager.unit==='millimeter'&&ctx.cadRegistry===registry&&registry.isEvaluating===true&&registry.findFace(p.faceId)===face&&face.root===plane&&plane.face===face&&face.defaultSketchId===p.faceId&&ctx.sketchStorageService===sketchStorage&&sketchStorage.getSketchData(p.faceId)===source&&JSON.stringify(sketchBoundaryFrame(face))===frameText&&JSON.stringify(getSketchBoundaries(face))===boundaryText;}catch{return false;}};
   const current=()=>{owner.requireCurrent();if(!valid())throw abort();owner.requireCurrent();};
   const remaining=()=>{current();const left=Math.ceil(deadline-performance.now());if(left<1)throw abort();return Math.min(30000,left);};
   const timer=setTimeout(()=>{timedOut=true;owner.close();},30000);
   try{
    current();const solve=async()=>{const revision=crypto.randomUUID(),value=await runSketchSolve(assetPath(sketchWorker),{task:'rectangle-extrusion-solve',revision,sketchJSON:source,boundary,externalParameters:{}},{signal:owner.signal,valid,timeoutMs:remaining()});current();if(value?.ok===false)fail(value.error?.code||'SOLVE_ERROR',value.error?.message||'Sketch solving failed.');return {...captureSelectedProfileSolve(value,revision),axis:captureRevolveSourceAxis(value.sketch,p.axisSegmentId)};};
    const first=await solve(),second=await solve();if(first.source!==second.source||first.digest!==second.digest||first.evidence!==second.evidence||JSON.stringify(first.axis)!==JSON.stringify(second.axis))fail('INVALID_RESPONSE','Independent sketch Worker results differ.');
    const revision=crypto.randomUUID(),input={unit:'millimeter',engine:'occ',profileVersion:3,revision,sketchDigest:first.digest,faceId:p.faceId,regionId:p.regionId,axisSegmentId:p.axisSegmentId,angleRadians:p.angleRadians,frame,sketchJSON:first.source};
    const prepare=async()=>{const value=await runPrismSemantic(assetPath(semanticWorker),{kind:'prepare-revolve',profile:input},{signal:owner.signal,valid,timeoutMs:remaining()});current();return preparedResponse(value,input,first.axis);};
    const prepared=await prepare(),verified=await prepare();if(prepared.signature!==verified.signature)fail('INVALID_RESPONSE','Independent selected-profile semantic results differ.');
    nativeStarted=true;const result=await evaluate({owner,kind:'revolve',sourceBinding:Object.freeze({featureId:p.featureId,faceId:p.faceId,regionId:p.regionId,axisSegmentId:p.axisSegmentId}),request:captureOwnedRevolveEvaluation({version:1,unit:p.unit,engine:p.engine,engineRevision:p.engineRevision,featureId:p.featureId,revolve:prepared.request}),registry,createModel:(id:number,engine:'occ'|'manifold'|'smlib',display:Float64Array|WorkerSolidDisplay,runtime:Readonly<Record<string,string>>,metrics:Readonly<any>)=>new MWorkerSolid(id,engine,display,runtime,metrics),valid});
    current();if(!(result?.model instanceof MWorkerSolid)||result.model.featureId!==p.featureId||result.model.ext.workerGeometry.engine!=='occ'||!Array.isArray(result.consumed)||result.consumed.length||typeof result.publicationCheck!=='function')fail('INVALID_RESPONSE','One owned separate revolve model is required.');
    const metrics=result.model.inspectKernelMetrics(),measurements=()=>{if(metrics.resultKind!=='single-solid'||metrics.solidCount!==1||metrics.nativeValidity?.valid!==true||typeof metrics.nativeVolume!=='number'||!Number.isFinite(metrics.nativeVolume)||metrics.nativeVolume<=0||!metrics.nativeBounds||!['min','max'].every(k=>Array.isArray(metrics.nativeBounds[k])&&metrics.nativeBounds[k].length===3&&metrics.nativeBounds[k].every((n:any)=>typeof n==='number'&&Number.isFinite(n)))||metrics.nativeBounds.min.some((n:number,i:number)=>n>metrics.nativeBounds.max[i])||'sha256:'+metrics.runtime?.jsSha256+':'+metrics.runtime?.wasmSha256!==p.engineRevision)fail('NATIVE_MEASUREMENT_MISMATCH','Invalid native revolve measurements or runtime.');};
    const publicationCheck=()=>{if(!valid())throw abort();result.publicationCheck();measurements();if(!valid())throw abort();};
    publicationCheck();owner.addPublicationCheck('selected-revolve:'+p.featureId,publicationCheck);current();completed=true;return {created:[result.model],consumed:[]};
   }catch(error){if(nativeStarted)owner.close();if(timedOut)fail('TIMEOUT','Revolve evaluation timed out.');throw error;}finally{clearTimeout(timer);}
  }
 };
}
