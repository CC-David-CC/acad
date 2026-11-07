import {OperationDescriptor} from 'cad/craft/operationBundle';
import {Types} from 'cad/craft/schema/types';
import {MWorkerSolid,WorkerSolidDisplay} from 'cad/model/mworkerSolid';
import {MWorkerEmpty} from 'cad/model/mworkerEmpty';
import {evaluateWorkerSolid} from 'engine/solid/solidLedger.mjs';

// Registered, data-only history operations. No raw engine tokens are accepted.
export function createWorkerSolidOperation(kind:'box'|'boolean'|'edge-treatment',createMount:(engine:string,revision?:string)=>any,validateMount:(engine:string,mount:any,revision?:string)=>void):OperationDescriptor<any>{
 if(!['box','boolean','edge-treatment'].includes(kind)||typeof createMount!=='function'||typeof validateMount!=='function')throw Error('A checked engine factory is required.');
 const common:any={version:{type:Types.number},unit:{type:Types.string},engine:{type:Types.string},engineRevision:{type:Types.string},featureId:{type:Types.number}};
 const specific:any=kind==='box'?{x:{type:Types.number},y:{type:Types.number},z:{type:Types.number},width:{type:Types.number},depth:{type:Types.number},height:{type:Types.number}}:kind==='edge-treatment'?{target:{type:Types.string},producerFeatureId:{type:Types.number},kind:{type:Types.string},edgeIds:{type:Types.array,items:{type:Types.string},min:1,max:16},size:{type:Types.number}}:{kind:{type:Types.string},a:{type:Types.string},b:{type:Types.string}};
 const schema={...common,...specific},keys=Object.keys(schema);
 return {
  id:kind==='box'?'WORKER_SOLID_BOX_V1':kind==='edge-treatment'?'WORKER_SOLID_EDGE_TREATMENT_V1':'WORKER_SOLID_BOOLEAN_V1',label:kind==='box'?'Worker solid box':kind==='edge-treatment'?'Worker edge treatment':'Worker solid Boolean',info:'Explicit engine worker solid operation.',icon:'img/cad/cube',form:[],schema,
  paramsInfo:()=>'',
  // The private ledger validates each exact live operand, including its engine.
  admitGeometry:()=>{},
  run:async(params:any,ctx:any,raw:any)=>{
   if(!raw||typeof raw!=='object'||Array.isArray(raw)||Reflect.ownKeys(raw).length!==keys.length||keys.some(key=>{const d=Object.getOwnPropertyDescriptor(raw,key);return !d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value');}))throw Object.assign(Error('Invalid authored solid request.'),{code:'INVALID_REQUEST'});
   const owner=ctx.engineEvaluation,project=ctx.projectService,craft=ctx.craftService,manager=ctx.projectManager,registry=ctx.cadRegistry,expressions=ctx.expressionService,storage=ctx.storageService;
   if(!owner||!project?.hasHostLifetime||manager?.unit!=='millimeter'||!project.isDocumentCurrent(project.documentGeneration))throw Error('A current host-bound millimeter workspace is required.');
   const generation=project.documentGeneration,storageRevision=storage.revision,epoch=craft.evaluationEpoch,history=craft.modifications$.value,script=expressions.script$.value,streams=[expressions.script$,expressions.list$,expressions.errors$],versions=streams.map(s=>s.revision);
   const valid=()=>ctx.projectService===project&&project.hasHostLifetime&&project.isDocumentCurrent(generation)&&ctx.storageService===storage&&storage.revision===storageRevision&&ctx.craftService===craft&&craft.evaluationEpoch===epoch&&craft.modifications$.value===history&&ctx.projectManager===manager&&manager.unit==='millimeter'&&ctx.cadRegistry===registry&&ctx.expressionService===expressions&&expressions.script$.value===script&&streams.every((s,i)=>s.revision===versions[i])&&!expressions.errors$.value.length;
   const request=kind==='box'?{version:raw.version,unit:raw.unit,engine:raw.engine,engineRevision:raw.engineRevision,featureId:raw.featureId,origin:[raw.x,raw.y,raw.z],dimensions:[raw.width,raw.depth,raw.height]}:kind==='edge-treatment'?{version:raw.version,unit:raw.unit,engine:raw.engine,engineRevision:raw.engineRevision,featureId:raw.featureId,target:raw.target,producerFeatureId:raw.producerFeatureId,kind:raw.kind,edgeIds:raw.edgeIds,size:raw.size}:{version:raw.version,unit:raw.unit,engine:raw.engine,engineRevision:raw.engineRevision,featureId:raw.featureId,kind:raw.kind,a:raw.a,b:raw.b};
   const result=await evaluateWorkerSolid({owner,kind,request,registry,valid,createMount,validateMount,createModel:(featureId:number,engine:'occ'|'manifold'|'smlib',triangles:Float64Array|WorkerSolidDisplay,runtime:Readonly<Record<string,string>>,metrics:Readonly<any>)=>new MWorkerSolid(featureId,engine,triangles,runtime,metrics),createEmptyModel:(featureId:number,engine:'occ'|'manifold'|'smlib',runtime:Readonly<Record<string,string>>,metrics:Readonly<any>)=>new MWorkerEmpty(featureId,engine,runtime,metrics)});
   if(result.resultKind==='empty'?!(result.model instanceof MWorkerEmpty):!(result.model instanceof MWorkerSolid))throw Error('The checked native result is unavailable.');
   owner.addPublicationCheck('worker-solid:'+raw.featureId,result.publicationCheck);
   owner.requireCurrent();return {created:[result.model],consumed:[...result.consumed]};
  }
 };
}
