import type {OperationDescriptor} from 'cad/craft/operationBundle';
import {Types} from 'cad/craft/schema/types';
import {MOpenFaceShell} from 'cad/model/mopenFace';
import {MWorkerSolid,WorkerSolidDisplay} from 'cad/model/mworkerSolid';
import {sketchBoundaryFrame} from 'cad/sketch/boundaryValidity';
import {getSketchBoundaries} from 'cad/sketch/sketchBoundaries';
import {sketchRevision} from 'cad/craft/sketchRevision.mjs';
import {runSketchSolve} from 'sketcher/headless/client';
import {runPrismSemantic} from 'engine/extrusion/prismSemanticClient';
import {verifiedSweepSourceTuple,requireSweepSourceProofCurrent} from './verifiedSweepSourceTuple';
import {captureOwnedSweepFeature,captureOwnedSweepEvaluation,captureSweepPathReferences} from 'engine/solid/ownedSweepFeature.mjs';
import {captureOwnedSweepIntent} from 'engine/solid/ownedSweepIntent.mjs';
import sketchWorker from 'codi-headless-sketch-worker';
import semanticWorker from 'codi-prism-semantic-worker';
import {captureSelectedProfileSolve} from '../workerSelectedProfile/workerSelectedProfile.operation';

const MAX_SOURCE=65536,MAX_RESPONSE=262144;
const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
const abort=()=>new DOMException('Sweep operation was cancelled or superseded.','AbortError');
function fields(value:any,keys:string[],code='INVALID_REQUEST'){
 if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))fail(code,'Expected exact sweep data fields.');
 const out:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))fail(code,'Sweep fields must be own data.');out[key]=d.value;}return out;
}
function boundedText(value:any,code:string,max=MAX_SOURCE){if(typeof value!=='string'||value.length>max||new TextEncoder().encode(value).byteLength>max)fail(code,'Sweep source/response exceeds its byte limit.');return value;}
// Data admission only; source solving, hashing and geometric preparation run
// solely in the actual dedicated Workers, never in this operation thread.
function jsonData(value:any,code='INVALID_RESPONSE'){
 const pending=[{value,depth:0}],seen=new Set();let nodes=0,characters=0;
 while(pending.length){const item=pending.pop(),v=item.value;if(++nodes>16384||item.depth>32)fail(code,'Sweep response tree exceeds its limit.');if(typeof v==='string'){characters+=v.length;}else if(typeof v==='number'){if(!Number.isFinite(v))fail(code,'Nonfinite sweep response.');}else if(v!==null&&typeof v==='object'){
  if(seen.has(v))fail(code,'Sweep response must be a tree.');seen.add(v);const proto=Object.getPrototypeOf(v);if(!Array.isArray(v)&&proto!==null&&proto!==Object.prototype)fail(code,'Sweep response must be plain data.');
  const keys=Reflect.ownKeys(v);if(keys.length>16385||Array.isArray(v)&&(v.length>16384||keys.length!==v.length+1))fail(code,'Sweep response arrays must be dense and bounded.');
  for(const key of keys){if(Array.isArray(v)&&key==='length')continue;const name=typeof key==='string'?key:fail(code,'Sweep response keys must be strings.');if(Array.isArray(v)&&(!/^(?:0|[1-9][0-9]*)$/.test(name)||Number(name)>=v.length))fail(code,'Sweep response arrays must be dense data.');characters+=name.length;const d=Object.getOwnPropertyDescriptor(v,name);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))fail(code,'Sweep response fields must be data.');pending.push({value:d.value,depth:item.depth+1});}
 }else if(v!==null&&typeof v!=='boolean')fail(code,'Unsupported sweep response value.');if(characters>MAX_RESPONSE)fail(code,'Sweep response text exceeds its limit.');}
 return boundedText(JSON.stringify(value),code,MAX_RESPONSE);
}
function assetPath(asset:string){const url=new URL(asset,globalThis.location.href);if(url.origin!==globalThis.location.origin||!['http:','https:'].includes(url.protocol)||url.search||url.hash)fail('INVALID_ASSET','Sweep Workers must use trusted same-origin assets.');return url.pathname;}
function sameFrame(a:any,b:any){return ['origin','x','y','z'].every(k=>Array.isArray(a[k])&&Array.isArray(b[k])&&a[k].length===3&&b[k].length===3&&a[k].every((n:number,i:number)=>Object.is(n,b[k][i])));}
function sameReferences(value:any,expected:any){let refs:any;try{refs=captureSweepPathReferences(value);}catch{fail('INVALID_RESPONSE','Invalid directed path binding.');}return refs.length===expected.length&&refs.every((r:any,i:number)=>r.curveId===expected[i].curveId&&r.reversed===expected[i].reversed);}
function sourcePath(sketch:any,references:any){
 if(!Array.isArray(sketch.objects)||sketch.objects.length>4096)fail('INVALID_RESPONSE','Expected a bounded solved path inventory.');const inventory=new Map();
 for(const object of sketch.objects){if(!object||typeof object.id!=='string'||!object.id||object.id.length>256||inventory.has(object.id))fail('INVALID_RESPONSE','Ambiguous solved path identity.');inventory.set(object.id,object);}
 const point=(value:any)=>{const p=fields(value,['x','y'],'INVALID_RESPONSE');if(![p.x,p.y].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e6))fail('INVALID_RESPONSE','Invalid solved path coordinates.');return[p.x,p.y];};
 // Corroborate data from the genuine solve, without choosing branches, welding
 // endpoints, deriving topology or importing a Worker-only planner here.
 return references.map((ref:any)=>{const o:any=inventory.get(ref.curveId);if(!o)fail('STALE_PATH','Selected source path identity is unavailable.');if(!['Segment','Arc'].includes(o.type))fail('SWEEP_UNSUPPORTED_PATH','The selected current primitive is not a supported Segment or open Arc path.');if(o.stage!==0||![null,'construction'].includes(o.role))fail('UNSUPPORTED_SKETCH','Path preparation requires stage-zero ordinary or construction curves.');const data=fields(o.data,o.type==='Segment'?['a','b']:['a','b','c'],'INVALID_RESPONSE');return{kind:o.type==='Segment'?'segment':'arc',id:o.id,a:point(data.a),b:point(data.b),...(o.type==='Arc'?{c:point(data.c)}:{}),reversed:ref.reversed};});
}
function preparedResponse(result:any,input:any,actualPath:any){
 const signature=jsonData(result),r=fields(result,['binding','request','sweepBinding'],'INVALID_RESPONSE'),b=fields(r.binding,['revision','faceId','sketchDigest','regionId','pathFaceId','pathDigest','pathCurves','transport'],'INVALID_RESPONSE');
 if(b.revision!==input.profile.revision||b.faceId!==input.profile.faceId||b.sketchDigest!==input.profile.sketchDigest||b.regionId!==input.profile.regionId||b.pathFaceId!==input.path.faceId||b.pathDigest!==input.path.sketchDigest||b.transport!==input.transport||!sameReferences(b.pathCurves,input.path.pathCurves))fail('INVALID_RESPONSE','Sweep source/path binding changed.');
 let request:any;try{request=captureOwnedSweepIntent(r.request);}catch{fail('INVALID_RESPONSE','Invalid prepared sweep request.');}
 if(request.source.faceId!==input.profile.faceId||request.source.sourceSha256!==input.profile.sketchDigest||request.region.id!==input.profile.regionId||!sameFrame(request.frame,input.profile.frame)||request.path.source.faceId!==input.path.faceId||request.path.source.sourceSha256!==input.path.sketchDigest||!sameFrame(request.path.frame,input.path.frame)||request.transport!==input.transport||JSON.stringify(request.path.curves)!==JSON.stringify(actualPath))fail('INVALID_RESPONSE','Prepared sweep changed source/frame/region or actual path geometry/direction.');
 const sb=fields(r.sweepBinding,['version','unit','source','regionId','pathSource','pathCurves','transport','requestSha256'],'INVALID_RESPONSE'),s=fields(sb.source,['faceId','sourceSha256'],'INVALID_RESPONSE'),ps=fields(sb.pathSource,['faceId','sourceSha256'],'INVALID_RESPONSE');
 if(sb.version!==1||sb.unit!=='millimeter'||s.faceId!==input.profile.faceId||s.sourceSha256!==input.profile.sketchDigest||sb.regionId!==input.profile.regionId||ps.faceId!==input.path.faceId||ps.sourceSha256!==input.path.sketchDigest||!sameReferences(sb.pathCurves,input.path.pathCurves)||sb.transport!==input.transport||typeof sb.requestSha256!=='string'||!/^[a-f0-9]{64}$/.test(sb.requestSha256))fail('INVALID_RESPONSE','Invalid native sweep request binding.');
 return{request,signature};
}

// Registration is deliberately separate. The real catalog/ledger are injected;
// only these eleven authored fields belong to persistent feature history.
export function createWorkerSelectedSweepOperation({evaluate,buildPolicy}:{evaluate:(input:any)=>Promise<any>;buildPolicy:any}):OperationDescriptor<any>{
 if(typeof evaluate!=='function'||typeof buildPolicy?.requireBuild!=='function'||typeof buildPolicy?.historyBuild!=='function')fail('INVALID_REQUEST','A real shared evaluator and explicit registered build policy are required.');
 const schema:any={version:{type:Types.number},unit:{type:Types.string},engine:{type:Types.string},engineRevision:{type:Types.string},featureId:{type:Types.number},faceId:{type:Types.string},regionId:{type:Types.string},pathFaceId:{type:Types.string},pathCurves:{type:Types.array,items:{type:Types.object,schema:{curveId:{type:Types.string},reversed:{type:Types.boolean}}},min:1,max:128},transport:{type:Types.string},bodyPolicy:{type:Types.string}},keys=Object.keys(schema);
 return{id:'WORKER_SELECTED_PROFILE_SWEEP_V1',label:'Worker selected-region sweep',icon:'img/cad/sweep',info:'Sweep one source region along an ordered source path; retain both independent sketch planes.',form:[],schema,paramsInfo:()=>'(corrected Frenet)',admitGeometry:()=>{},
  run:async(_params:any,ctx:any,raw:any)=>{
   fields(raw,keys);const p=captureOwnedSweepFeature(raw);
   const owner=ctx.engineEvaluation,project=ctx.projectService,storage=ctx.storageService,craft=ctx.craftService,expressions=ctx.expressionService,manager=ctx.projectManager,registry=ctx.cadRegistry,sketchStorage=ctx.sketchStorageService;
   if(!owner||!project?.hasHostLifetime||manager?.unit!=='millimeter'||registry?.isEvaluating!==true||typeof sketchStorage?.getSketchData!=='function')fail('INVALID_WORKSPACE','A current owned millimeter evaluation is required.');
   owner.requireCurrent();
   const generation=project.documentGeneration,namespace=project.sketchStorageNamespace,stamp=sketchRevision(storage,namespace),history=craft.modifications$.value,epoch=craft.evaluationEpoch,table=expressions.table$?.value,script=expressions.script$?.value,streams=[expressions.script$,expressions.table$,expressions.list$,expressions.errors$],versions=streams.map(s=>s?.revision);
   if(!project.isDocumentCurrent(generation))throw abort();
   if(expressions.isTyped||typeof script!=='string'||script.trim()||!table||Reflect.ownKeys(table).length||!Array.isArray(expressions.errors$?.value)||expressions.errors$.value.length)fail('UNSUPPORTED_PARAMETERS','Sweep currently requires untyped native sources without project/external parameter bindings.');
   const build=buildPolicy.requireBuild(p.engine,p.engineRevision),part=buildPolicy.historyBuild(history.history);
   if(build?.id!==p.engine||build.revision!==p.engineRevision||build.sweepVersion!==1)fail('UNSUPPORTED_SWEEP_BUILD','An explicit registered sweep-capable backend is required.');
   if(part&&(part.id!==build.id||part.revision!==build.revision))fail('ENGINE_REVISION_MISMATCH','The complete authored part must retain one backend revision.');
   if(p.faceId===p.pathFaceId)fail('UNSUPPORTED_SOURCE','This operation requires two distinct independent source planes.');
   const captureSource=(id:string)=>{
    const face=registry.findFace(id),plane=face?.root;
    if(!(plane instanceof MOpenFaceShell)||plane.face!==face||face.id!==id||face.isPlaneBased!==true||face.defaultSketchId!==id)fail('STALE_SOURCE','Select a current owned independent source plane.');
    const source=boundedText(sketchStorage.getSketchData(id),'UNSUPPORTED_SKETCH'),frame=sketchBoundaryFrame(face),boundary=getSketchBoundaries(face);
    const b=fields(boundary,['lines','arcs','circles','nurbses'],'UNSUPPORTED_SKETCH');
    if(Object.values(b).some((v:any)=>!Array.isArray(v)||v.length))fail('UNSUPPORTED_SKETCH','Only independent source planes with empty model boundaries are supported.');
    return{id,face,plane,source,frame,boundary,frameText:JSON.stringify(frame),boundaryText:JSON.stringify(boundary)};
   };
   // Capture both complete source snapshots before any Worker/digest suspension.
   const profile=captureSource(p.faceId),path=captureSource(p.pathFaceId);
   let completed=false,timedOut=false;const deadline=performance.now()+30000;
   const validSource=(s:any)=>registry.findFace(s.id)===s.face&&s.face.root===s.plane&&s.plane.face===s.face&&s.face.id===s.id&&s.face.isPlaneBased===true&&s.face.defaultSketchId===s.id&&sketchStorage.getSketchData(s.id)===s.source&&JSON.stringify(sketchBoundaryFrame(s.face))===s.frameText&&JSON.stringify(getSketchBoundaries(s.face))===s.boundaryText;
   const valid=()=>{try{return !owner.signal.aborted&&(completed||performance.now()<deadline)&&ctx.engineEvaluation===owner&&ctx.projectService===project&&project.hasHostLifetime&&project.isDocumentCurrent(generation)&&project.sketchStorageNamespace===namespace&&ctx.storageService===storage&&sketchRevision(storage,namespace)===stamp&&ctx.craftService===craft&&craft.modifications$.value===history&&craft.evaluationEpoch===epoch&&ctx.expressionService===expressions&&!expressions.isTyped&&expressions.table$.value===table&&!Reflect.ownKeys(table).length&&expressions.script$.value===script&&streams.every((s,i)=>s===[expressions.script$,expressions.table$,expressions.list$,expressions.errors$][i]&&s.revision===versions[i])&&!expressions.errors$.value.length&&ctx.projectManager===manager&&manager.unit==='millimeter'&&ctx.cadRegistry===registry&&registry.isEvaluating===true&&ctx.sketchStorageService===sketchStorage&&validSource(profile)&&validSource(path);}catch{return false;}};
   const current=()=>{owner.requireCurrent();if(!valid())throw abort();owner.requireCurrent();};
   const remaining=()=>{current();const left=Math.ceil(deadline-performance.now());if(left<1)throw abort();return Math.min(30000,left);};
   const timer=setTimeout(()=>{timedOut=true;owner.close();},30000);
   try{
    current();const solve=async(s:any)=>{const revision=crypto.randomUUID(),value:any=await runSketchSolve(assetPath(sketchWorker),{task:'rectangle-extrusion-solve',revision,sketchJSON:s.source,boundary:s.boundary,externalParameters:{}},{signal:owner.signal,valid,timeoutMs:remaining()});current();if(value?.ok===false)fail(value.error?.code||'SOLVE_ERROR',value.error?.message||'Sweep source solve failed.');return{...captureSelectedProfileSolve(value,revision),sketch:value.sketch};};
    const sourceKey={identities:[project,storage,craft,expressions,manager,registry,sketchStorage,history,table,...streams,profile.face,profile.plane,path.face,path.plane],values:[generation,namespace,stamp,epoch,script,...versions,p.unit,p.engine,p.engineRevision,'rectangle-extrusion-solve',assetPath(sketchWorker),'externalParameters:{}','remaining-deadline<=30000',profile.id,profile.source,profile.frameText,profile.boundaryText,path.id,path.source,path.frameText,path.boundaryText]};
    const first=await verifiedSweepSourceTuple(owner,sourceKey,current,async()=>{
     const first=await Promise.all([solve(profile),solve(path)]),second=await Promise.all([solve(profile),solve(path)]);
     for(let i=0;i<2;i++)if(first[i].source!==second[i].source||first[i].digest!==second[i].digest||first[i].evidence!==second[i].evidence)fail('INVALID_RESPONSE','Independent source Worker reconstructions differ.');
     return first;
    });
    requireSweepSourceProofCurrent(owner,current);
    const actualPath=sourcePath(first[1].sketch,p.pathCurves),revision=crypto.randomUUID(),input={profile:{unit:p.unit,engine:p.engine,profileVersion:3,revision,sketchDigest:first[0].digest,faceId:p.faceId,regionId:p.regionId,frame:profile.frame,sketchJSON:first[0].source},path:{unit:p.unit,revision,sketchDigest:first[1].digest,faceId:p.pathFaceId,frame:path.frame,sketchJSON:first[1].source,pathCurves:p.pathCurves},transport:p.transport};
    const prepare=async()=>{const value=await runPrismSemantic(assetPath(semanticWorker),{kind:'prepare-sweep',sweep:input},{signal:owner.signal,valid,timeoutMs:remaining()});current();return preparedResponse(value,input,actualPath);};
    const prepared=await prepare(),verified=await prepare();if(prepared.signature!==verified.signature)fail('INVALID_RESPONSE','Independent two-source sweep preparations differ.');
    const result=await evaluate({owner,kind:'sweep',sourceBinding:Object.freeze({featureId:p.featureId,faceId:p.faceId,regionId:p.regionId,pathFaceId:p.pathFaceId,pathCurves:p.pathCurves}),request:captureOwnedSweepEvaluation({version:1,unit:p.unit,engine:p.engine,engineRevision:p.engineRevision,featureId:p.featureId,sweep:prepared.request}),registry,createModel:(id:number,engine:'occ'|'manifold'|'smlib',display:Float64Array|WorkerSolidDisplay,runtime:Readonly<Record<string,string>>,metrics:Readonly<any>)=>new MWorkerSolid(id,engine,display,runtime,metrics),valid});
    current();if(!(result?.model instanceof MWorkerSolid)||result.model.featureId!==p.featureId||result.model.ext.workerGeometry.engine!=='occ'||!Array.isArray(result.consumed)||result.consumed.length||typeof result.publicationCheck!=='function')fail('INVALID_RESPONSE','One owned separate sweep model is required without consuming either source plane.');
    const metrics=result.model.inspectKernelMetrics(),measurements=()=>{if(metrics.resultKind!=='single-solid'||metrics.solidCount!==1||metrics.nativeValidity?.valid!==true||typeof metrics.nativeVolume!=='number'||!Number.isFinite(metrics.nativeVolume)||metrics.nativeVolume<=0||!metrics.nativeBounds||!['min','max'].every(k=>Array.isArray(metrics.nativeBounds[k])&&metrics.nativeBounds[k].length===3&&metrics.nativeBounds[k].every((n:any)=>typeof n==='number'&&Number.isFinite(n)))||metrics.nativeBounds.min.some((n:number,i:number)=>n>metrics.nativeBounds.max[i])||'sha256:'+metrics.runtime?.jsSha256+':'+metrics.runtime?.wasmSha256!==p.engineRevision)fail('NATIVE_MEASUREMENT_MISMATCH','Invalid native sweep measurements or runtime.');};
    const publicationCheck=()=>{if(!valid())throw abort();result.publicationCheck();measurements();if(!valid())throw abort();};
    publicationCheck();owner.addPublicationCheck('selected-sweep:'+p.featureId,publicationCheck);current();completed=true;return{created:[result.model],consumed:[]};
   }catch(error){try{owner.close();}catch(cause){throw Object.assign(Error('Sweep candidate cleanup failed.'),{code:'WORKER_CLEANUP_FAILED',cause,operationError:error});}if(timedOut)fail('TIMEOUT','Sweep evaluation timed out.');throw error;}finally{clearTimeout(timer);}
  }
 };
}
