import {assertHistoryControlAppendAllowed} from 'engine/solid/authoredHistoryState.mjs';
import {OperationDescriptor} from 'cad/craft/operationBundle';
import {Types} from 'cad/craft/schema/types';
import {MWorkerSolid,WorkerSolidDisplay} from 'cad/model/mworkerSolid';
import {MOpenFaceShell} from 'cad/model/mopenFace';
import {evaluateWorkerSolid} from 'engine/solid/solidLedger.mjs';
import {materializeAuthoredCountersinkIntent} from 'engine/solid/authoredCountersinkIntent.mjs';
import {requireModernPhysicalHistory} from 'cad/parameters/modernPhysicalBindings.mjs';
import {requireCadEngineBuild} from 'engine/mount/engineCatalog.mjs';
import {sketchBoundaryFrame} from 'cad/sketch/boundaryValidity';

// One authored relationship; tools, conical transition and depth are Worker derived.
export function createWorkerCountersinkOperation(createMount:(engine:string,revision?:string)=>any,validateMount:(engine:string,mount:any,revision?:string)=>void):OperationDescriptor<any>{
 const schema:any={};
 for(const key of ['version','featureId','producerFeatureId','sourceFeatureId','throughDiameter','entryDiameter','includedAngleRadians'])schema[key]={type:Types.number};
 for(const key of ['unit','engine','engineRevision','target','sourceFaceId','sourceRegionId','entryFaceId','kind'])schema[key]={type:Types.string};
 for(const key of ['throughDiameter','entryDiameter'])schema[key].dimension='length';
 schema.includedAngleRadians.dimension='angle';
 return {id:'WORKER_CENTERED_COUNTERSINK_V1',label:'Worker centered countersink hole',info:'Source-top-relative conical countersink with a full included angle.',icon:'img/cad/cube',form:[],schema,paramsInfo:()=>'',admitGeometry:()=>{},
  run:async(_params:any,ctx:any,raw:any)=>{
   const request=materializeAuthoredCountersinkIntent(raw,ctx.expressionService,_params),owner=ctx.engineEvaluation,project=ctx.projectService,craft=ctx.craftService,manager=ctx.projectManager,registry=ctx.cadRegistry,expressions=ctx.expressionService,storage=ctx.storageService;
   if(!owner||!project?.hasHostLifetime||manager?.unit!=='millimeter'||!project.isDocumentCurrent(project.documentGeneration))throw Error('A current host-bound millimeter workspace is required.');
   const build=requireCadEngineBuild(request.engine,request.engineRevision);
   if(build.countersinkVersion!==1||build.selectedProfileVersion!==3||build.selectionPlanVersion!==2)throw Object.assign(Error('The recorded backend does not support source-bound conical countersinks.'),{code:'UNSUPPORTED_COUNTERSINK_BUILD'});
   assertHistoryControlAppendAllowed(craft.modifications$.value.history,'WORKER_CENTERED_COUNTERSINK_V1');
   if(expressions.isTyped){requireModernPhysicalHistory(craft.modifications$.value.history);if(!expressions.hasCurrentPhysicalResult())throw Object.assign(Error('The typed countersink parameter source is stale.'),{code:'UNSUPPORTED_PARAMETERS'});}
   else if(expressions.script$.value.trim()||Reflect.ownKeys(expressions.table$.value||{}).length)throw Object.assign(Error('Countersinks require empty or current typed parameters.'),{code:'UNSUPPORTED_PARAMETERS'});
   const face=registry.findFace(request.sourceFaceId),plane=face?.root;
   if(!(plane instanceof MOpenFaceShell)||plane.face!==face||!face.isPlaneBased||face.defaultSketchId!==request.sourceFaceId)throw Object.assign(Error('The current independent source plane is unavailable.'),{code:'STALE_SOURCE'});
   const generation=project.documentGeneration,storageRevision=storage.revision,epoch=craft.evaluationEpoch,history=craft.modifications$.value,script=expressions.script$.value,typed=expressions.isTyped,streams=[expressions.script$,expressions.list$,expressions.errors$,expressions.table$],versions=streams.map(s=>s.revision),sourceStorage=ctx.sketchStorageService,source=sourceStorage.getSketchData(request.sourceFaceId),frame=JSON.stringify(sketchBoundaryFrame(face));
   if(typeof source!=='string'||source.length>65536||new TextEncoder().encode(source).byteLength>65536)throw Object.assign(Error('The bounded actual countersink source is unavailable.'),{code:'STALE_SOURCE'});
   const valid=()=>ctx.engineEvaluation===owner&&ctx.projectService===project&&project.hasHostLifetime&&project.isDocumentCurrent(generation)&&ctx.storageService===storage&&storage.revision===storageRevision&&ctx.craftService===craft&&craft.evaluationEpoch===epoch&&craft.modifications$.value===history&&ctx.projectManager===manager&&manager.unit==='millimeter'&&ctx.cadRegistry===registry&&registry.findFace(request.sourceFaceId)===face&&face.isPlaneBased===true&&face.root===plane&&plane.face===face&&face.defaultSketchId===request.sourceFaceId&&ctx.sketchStorageService===sourceStorage&&sourceStorage.getSketchData(request.sourceFaceId)===source&&JSON.stringify(sketchBoundaryFrame(face))===frame&&ctx.expressionService===expressions&&expressions.isTyped===typed&&(!typed||expressions.hasCurrentPhysicalResult())&&expressions.script$.value===script&&streams.every((s,i)=>s===[expressions.script$,expressions.list$,expressions.errors$,expressions.table$][i]&&s.revision===versions[i])&&!expressions.errors$.value.length;
   const result=await evaluateWorkerSolid({owner,kind:'countersink',request,registry,valid,createMount,validateMount,createModel:(featureId:number,engine:'occ'|'manifold'|'smlib',display:Float64Array|WorkerSolidDisplay,runtime:Readonly<Record<string,string>>,metrics:Readonly<any>)=>new MWorkerSolid(featureId,engine,display,runtime,metrics)});
   if(!(result.model instanceof MWorkerSolid))throw Error('The checked native countersink result is unavailable.');
   owner.addPublicationCheck('worker-countersinks:'+request.featureId,result.publicationCheck);owner.requireCurrent();return {created:[result.model],consumed:[...result.consumed]};
  }
 };
}
