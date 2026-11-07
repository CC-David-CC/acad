import type {OperationDescriptor} from 'cad/craft/operationBundle';
import {Types} from 'cad/craft/schema/types';
import {MWorkerSolid,WorkerSolidDisplay} from 'cad/model/mworkerSolid';
import {captureOwnedShellFeature} from 'engine/solid/ownedShellFeature.mjs';
import {solidBodyId} from 'engine/solid/solidIntent.mjs';

const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
const abort=()=>new DOMException('Shell evaluation was cancelled or superseded.','AbortError');

// Root factory injects the REAL shared candidate ledger/factory and registered
// build policy. This descriptor owns neither native handles nor a second graph.
export function createWorkerShellOperation({evaluate,buildPolicy}:{evaluate:(input:any)=>Promise<any>;buildPolicy:any}):OperationDescriptor<any>{
 if(typeof evaluate!=='function'||typeof buildPolicy?.requireBuild!=='function'||typeof buildPolicy?.historyBuild!=='function')fail('INVALID_REQUEST','The shared evaluator and explicit shell build policy are required.');
 const schema:any={version:{type:Types.number},unit:{type:Types.string},engine:{type:Types.string},engineRevision:{type:Types.string},featureId:{type:Types.number},target:{type:Types.string},producerFeatureId:{type:Types.number},removedFaceIds:{type:Types.array,items:{type:Types.string},min:1,max:16},thickness:{type:Types.number},direction:{type:Types.string}};
 return {id:'WORKER_SOLID_SHELL_V1',label:'Worker shell',icon:'img/cad/cube',info:'Create an inward constant-wall shell using actual authored face selections.',form:[],schema,paramsInfo:({thickness}:any)=>`(${thickness} mm inward)`,admitGeometry:()=>{},
  run:async(_params:any,ctx:any,raw:any)=>{
   const p=captureOwnedShellFeature(raw),owner=ctx.engineEvaluation,project=ctx.projectService,craft=ctx.craftService,registry=ctx.cadRegistry,storage=ctx.storageService,manager=ctx.projectManager,expressions=ctx.expressionService;
   if(!owner||!project?.hasHostLifetime||!project.isDocumentCurrent(project.documentGeneration)||manager?.unit!=='millimeter'||registry?.isEvaluating!==true)fail('INVALID_WORKSPACE','A current owned millimeter evaluation is required.');
   const build=buildPolicy.requireBuild(p.engine,p.engineRevision),historyBuild=buildPolicy.historyBuild(craft.modifications$.value.history);
   if(build?.id!==p.engine||build.revision!==p.engineRevision||build.shellVersion!==1)fail('UNSUPPORTED_SHELL_BUILD','Select the registered shell-capable backend explicitly.');
   if(historyBuild&&(historyBuild.id!==build.id||historyBuild.revision!==build.revision))fail('ENGINE_REVISION_MISMATCH','The whole authored part must retain its recorded backend.');
   const target=registry.find(p.target);
   if(!(target instanceof MWorkerSolid)||target.featureId!==p.producerFeatureId||target.id!==solidBodyId(p.producerFeatureId))fail('INVALID_OPERAND','The current shell target belongs to another producer or is unavailable.');
   const generation=project.documentGeneration,history=craft.modifications$.value,epoch=craft.evaluationEpoch,storageRevision=storage.revision,streams=[expressions.script$,expressions.table$,expressions.list$,expressions.errors$],versions=streams.map(s=>s.revision),modelMetrics=target.inspectKernelMetrics(),tag=target.ext.workerGeometry;
   const valid=()=>{try{return ctx.engineEvaluation===owner&&ctx.projectService===project&&project.hasHostLifetime&&project.isDocumentCurrent(generation)&&ctx.craftService===craft&&craft.modifications$.value===history&&craft.evaluationEpoch===epoch&&ctx.storageService===storage&&storage.revision===storageRevision&&ctx.projectManager===manager&&manager.unit==='millimeter'&&ctx.expressionService===expressions&&streams.every((s,i)=>s===[expressions.script$,expressions.table$,expressions.list$,expressions.errors$][i]&&s.revision===versions[i])&&!expressions.errors$.value.length&&ctx.cadRegistry===registry&&registry.isEvaluating===true&&target.ext.workerGeometry===tag&&target.inspectKernelMetrics()===modelMetrics;}catch{return false;}};
   const current=()=>{owner.requireCurrent();if(!valid())throw abort();owner.requireCurrent();};current();
   if(registry.find(p.target)!==target)throw abort();
   const result=await evaluate({owner,kind:'shell',request:p,registry,valid,createModel:(featureId:number,engine:'occ'|'manifold'|'smlib',display:Float64Array|WorkerSolidDisplay,runtime:Readonly<Record<string,string>>,metrics:Readonly<any>)=>new MWorkerSolid(featureId,engine,display,runtime,metrics)});
   current();if(!(result?.model instanceof MWorkerSolid)||result.model.id!==solidBodyId(p.featureId)||result.model.featureId!==p.featureId||result.model.ext.workerGeometry.engine!=='occ'||!Array.isArray(result.consumed)||result.consumed.length!==1||result.consumed[0]!==target||typeof result.publicationCheck!=='function')fail('INVALID_RESPONSE','One owned shell output must consume exactly its authenticated source body.');
   const metrics=result.model.inspectKernelMetrics();
   const publicationCheck=()=>{
    // Owner.requireCurrent already invokes this leaf proof. Re-entering the
    // owner-wide proof set would recurse instead of checking this result.
    if(!valid())throw abort();result.publicationCheck();
    if(result.model.inspectKernelMetrics()!==metrics||metrics?.resultKind!=='single-solid'||metrics.solidCount!==1||metrics.nativeValidity?.valid!==true||typeof metrics.nativeVolume!=='number'||!Number.isFinite(metrics.nativeVolume)||metrics.nativeVolume<=0||!metrics.nativeBounds||!['min','max'].every(k=>Array.isArray(metrics.nativeBounds[k])&&metrics.nativeBounds[k].length===3&&metrics.nativeBounds[k].every((n:any)=>typeof n==='number'&&Number.isFinite(n)))||metrics.nativeBounds.min.some((n:number,i:number)=>n>metrics.nativeBounds.max[i])||'sha256:'+metrics.runtime?.jsSha256+':'+metrics.runtime?.wasmSha256!==p.engineRevision)fail('NATIVE_MEASUREMENT_MISMATCH','The checked shell result or exact runtime differs.');
    if(!valid())throw abort();
   };
   publicationCheck();owner.addPublicationCheck('worker-shell:'+p.featureId,publicationCheck);current();return {created:[result.model],consumed:[target]};
  }
 };
}
