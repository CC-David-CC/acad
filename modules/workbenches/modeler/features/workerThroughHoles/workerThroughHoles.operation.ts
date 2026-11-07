import {OperationDescriptor} from 'cad/craft/operationBundle';
import {Types} from 'cad/craft/schema/types';
import {MWorkerSolid,WorkerSolidDisplay} from 'cad/model/mworkerSolid';
import {MOpenFaceShell} from 'cad/model/mopenFace';
import {evaluateWorkerSolid} from 'engine/solid/solidLedger.mjs';
import {captureOwnedHoleIntent} from 'engine/solid/ownedHoleIntent.mjs';

// One authored relationship; tools and through-all extents are Worker derived.
export function createWorkerThroughHolesOperation(createMount:(engine:string,revision?:string)=>any,validateMount:(engine:string,mount:any,revision?:string)=>void):OperationDescriptor<any>{
 const schema:any={};
 for(const key of ['version','featureId','producerFeatureId','sourceFeatureId','diameter'])schema[key]={type:Types.number};
 for(const key of ['unit','engine','engineRevision','target','sourceFaceId','sourceRegionId','kind'])schema[key]={type:Types.string};
 for(const key of ['offsetX','offsetY'])schema[key]={type:Types.number,optional:true};
 return {id:'WORKER_THROUGH_HOLES_V1',label:'Worker through holes',info:'Source-relative through-all holes.',icon:'img/cad/cube',form:[],schema,paramsInfo:()=>'',admitGeometry:()=>{},
  run:async(_params:any,ctx:any,raw:any)=>{
   const request=captureOwnedHoleIntent(raw),owner=ctx.engineEvaluation,project=ctx.projectService,craft=ctx.craftService,manager=ctx.projectManager,registry=ctx.cadRegistry,expressions=ctx.expressionService,storage=ctx.storageService;
   if(!owner||!project?.hasHostLifetime||manager?.unit!=='millimeter'||!project.isDocumentCurrent(project.documentGeneration))throw Error('A current host-bound millimeter workspace is required.');
   const face=registry.findFace(request.sourceFaceId),plane=face?.root;
   if(!(plane instanceof MOpenFaceShell)||plane.face!==face||!face.isPlaneBased||face.defaultSketchId!==request.sourceFaceId)throw Object.assign(Error('The current independent source plane is unavailable.'),{code:'STALE_SOURCE'});
   const generation=project.documentGeneration,storageRevision=storage.revision,epoch=craft.evaluationEpoch,history=craft.modifications$.value,script=expressions.script$.value,streams=[expressions.script$,expressions.list$,expressions.errors$],versions=streams.map(s=>s.revision);
   const valid=()=>ctx.engineEvaluation===owner&&ctx.projectService===project&&project.hasHostLifetime&&project.isDocumentCurrent(generation)&&ctx.storageService===storage&&storage.revision===storageRevision&&ctx.craftService===craft&&craft.evaluationEpoch===epoch&&craft.modifications$.value===history&&ctx.projectManager===manager&&manager.unit==='millimeter'&&ctx.cadRegistry===registry&&registry.findFace(request.sourceFaceId)===face&&face.isPlaneBased===true&&face.root===plane&&plane.face===face&&face.defaultSketchId===request.sourceFaceId&&ctx.expressionService===expressions&&expressions.script$.value===script&&streams.every((s,i)=>s.revision===versions[i])&&!expressions.errors$.value.length;
   const result=await evaluateWorkerSolid({owner,kind:'through-hole',request,registry,valid,createMount,validateMount,createModel:(featureId:number,engine:'occ'|'manifold'|'smlib',display:Float64Array|WorkerSolidDisplay,runtime:Readonly<Record<string,string>>,metrics:Readonly<any>)=>new MWorkerSolid(featureId,engine,display,runtime,metrics)});
   if(!(result.model instanceof MWorkerSolid))throw Error('The checked native through-hole result is unavailable.');
   owner.addPublicationCheck('worker-through-holes:'+request.featureId,result.publicationCheck);owner.requireCurrent();return {created:[result.model],consumed:[...result.consumed]};
  }
 };
}
