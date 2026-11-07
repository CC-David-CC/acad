import {OperationDescriptor} from 'cad/craft/operationBundle';
import {Types} from 'cad/craft/schema/types';
import {MWorkerSolid, WorkerSolidDisplay} from 'cad/model/mworkerSolid';
import {MOpenFaceShell} from 'cad/model/mopenFace';
import {sketchBoundaryFrame} from 'cad/sketch/boundaryValidity';
import {evaluateWorkerSolid, inspectWorkerSolidPatternSeeds} from 'engine/solid/solidLedger.mjs';
import {captureOwnedLinearHolePatternIntent} from 'engine/solid/ownedLinearHolePatternIntent.mjs';

export function createWorkerLinearHolePatternOperation(createMount:(engine:string,revision?:string)=>any,validateMount:(engine:string,mount:any,revision?:string)=>void):OperationDescriptor<any>{
 const schema:any={};
 for(const key of ['version','featureId','producerFeatureId','seedFeatureId','count','spacing'])schema[key]={type:Types.number};
 for(const key of ['unit','engine','engineRevision','target','axis'])schema[key]={type:Types.string};
 return {id:'WORKER_LINEAR_HOLE_PATTERN_V1',label:'Linear hole pattern',info:'Source-relative copies of an authored centered through-hole.',icon:'img/cad/patternLinear',form:[],schema,paramsInfo:()=>'',admitGeometry:()=>{},
  run:async(_params:any,ctx:any,raw:any)=>{
   const request=captureOwnedLinearHolePatternIntent(raw),owner=ctx.engineEvaluation,project=ctx.projectService,craft=ctx.craftService,manager=ctx.projectManager,registry=ctx.cadRegistry,expressions=ctx.expressionService,storage=ctx.storageService;
   if(!owner||!project?.hasHostLifetime||manager?.unit!=='millimeter'||!project.isDocumentCurrent(project.documentGeneration))throw Error('A current host-bound millimeter workspace is required.');
   const parent=registry.find(request.target),path=inspectWorkerSolidPatternSeeds(parent);
   if(!(parent instanceof MWorkerSolid)||path.status!=='available'||!path.seeds.some(seed=>seed.seedFeatureId===request.seedFeatureId))throw Object.assign(Error('The actual centered-hole dependency is unavailable.'),{code:'UNSUPPORTED_SEED'});
   const face=registry.findFace(path.sourceFaceId),plane=face?.root;
   if(!(plane instanceof MOpenFaceShell)||plane.face!==face||!face.isPlaneBased||face.defaultSketchId!==path.sourceFaceId)throw Object.assign(Error('The current independent source plane is unavailable.'),{code:'STALE_SOURCE'});
   const generation=project.documentGeneration,storageRevision=storage.revision,epoch=craft.evaluationEpoch,history=craft.modifications$.value,script=expressions.script$.value,frame=JSON.stringify(sketchBoundaryFrame(face)),streams=[expressions.script$,expressions.list$,expressions.errors$],versions=streams.map(s=>s.revision);
   const valid=()=>ctx.engineEvaluation===owner&&ctx.projectService===project&&project.hasHostLifetime&&project.isDocumentCurrent(generation)&&ctx.storageService===storage&&storage.revision===storageRevision&&ctx.craftService===craft&&craft.evaluationEpoch===epoch&&craft.modifications$.value===history&&ctx.projectManager===manager&&manager.unit==='millimeter'&&ctx.cadRegistry===registry&&registry.findFace(path.sourceFaceId)===face&&face.isPlaneBased===true&&face.root===plane&&plane.face===face&&face.defaultSketchId===path.sourceFaceId&&JSON.stringify(sketchBoundaryFrame(face))===frame&&ctx.expressionService===expressions&&expressions.script$.value===script&&streams.every((s,i)=>s.revision===versions[i])&&!expressions.errors$.value.length;
   const result=await evaluateWorkerSolid({owner,kind:'linear-hole-pattern',request,registry,valid,createMount,validateMount,createModel:(featureId:number,engine:'occ'|'manifold'|'smlib',display:Float64Array|WorkerSolidDisplay,runtime:Readonly<Record<string,string>>,metrics:Readonly<any>)=>new MWorkerSolid(featureId,engine,display,runtime,metrics)});
   if(!(result.model instanceof MWorkerSolid))throw Error('The checked native pattern result is unavailable.');
   owner.addPublicationCheck('worker-linear-hole-pattern:'+request.featureId,result.publicationCheck);owner.requireCurrent();return {created:[result.model],consumed:[...result.consumed]};
  }
 };
}
