import {OperationDescriptor} from 'cad/craft/operationBundle';
import {MWorkerEnclosureBody} from 'cad/model/mworkerEnclosure';
import ociWorker from 'codi-oci-verified-worker';
import occJs from 'codi-occ-portable';
import occWasm from 'codi-occ-wasm';
import enclosurePlanModule from 'codi-enclosure-plan-module';
import enclosureMeshModule from 'codi-enclosure-mesh-module';
import enclosureContactModule from 'codi-enclosure-contact-module';
function assetPath(asset:string):string{const url=new URL(asset,globalThis.location.href);if(url.origin!==globalThis.location.origin||url.search||url.hash)throw Error('Invalid enclosure worker asset.');return url.pathname;}
// The inputs are the persisted authored dimensions. No kernel handles or
// preview triangles are serialized into project history.
export function createWorkerEnclosureOperation(run:(input:any)=>Promise<any>,version:1|2=1):OperationDescriptor<any>{
 if(typeof run!=='function')throw Error('A checked enclosure adapter is required.');
 return {
  id:'WORKER_ENCLOSURE_V'+version,label:version===1?'Enclosure':'Enclosure with inset label',icon:'img/cad/cube',info:'Create a body and separate lid with a locating lip using the OCC worker.',
  paramsInfo:({width,length,height})=>`(${width} × ${length} × ${height} mm)`,
  form:[
   {type:'number',dimension:'length',name:'width',label:'Width (mm)',defaultValue:100},
   {type:'number',dimension:'length',name:'length',label:'Length (mm)',defaultValue:70},
   {type:'number',dimension:'length',name:'height',label:'Height (mm)',defaultValue:30},
   {type:'number',dimension:'length',name:'wall',label:'Wall (mm)',defaultValue:2},
   {type:'number',dimension:'length',name:'clearance',label:'Clearance (mm)',defaultValue:0.3},
   {type:'number',dimension:'length',name:'lidThickness',label:'Lid thickness (mm)',defaultValue:2},
   {type:'number',dimension:'length',name:'lipDepth',label:'Lip depth (mm)',defaultValue:3},
   ...(version===2?[{type:'number' as const,dimension:'length' as const,name:'labelWidth',label:'Label width (mm)',defaultValue:40},{type:'number' as const,dimension:'length' as const,name:'labelLength',label:'Label length (mm)',defaultValue:20},{type:'number' as const,dimension:'length' as const,name:'labelDepth',label:'Label depth (mm)',defaultValue:1}]:[]),
  ],
  defaultActiveField:'width',
  run:async(params:any,ctx:any)=>{
   const evaluation=ctx.engineEvaluation,project=ctx.projectService,storage=ctx.storageService,craft=ctx.craftService,manager=ctx.projectManager,registry=ctx.cadRegistry,expressions=ctx.expressionService;
   if(!evaluation||!project?.hasHostLifetime||manager?.unit!=='millimeter'||storage?.revision==null||!Number.isSafeInteger(params.featureId)||params.featureId<=0)throw Error('A current host-bound millimeter workspace is required.');
   const generation=project.documentGeneration,revision=storage.revision,epoch=craft.evaluationEpoch,history=craft.modifications$.value,script=expressions.script$.value,scriptRevision=expressions.script$.revision,listRevision=expressions.list$.revision,errorRevision=expressions.errors$.revision,table=JSON.stringify(expressions.table$.value);
   if(expressions.errors$.value.length)throw Error('Shared expressions are invalid.');
   const valid=()=>ctx.projectService===project&&project.hasHostLifetime&&project.isDocumentCurrent(generation)&&ctx.storageService===storage&&storage.revision===revision&&ctx.craftService===craft&&craft.evaluationEpoch===epoch&&craft.modifications$.value===history&&ctx.projectManager===manager&&manager.unit==='millimeter'&&ctx.cadRegistry===registry&&ctx.expressionService===expressions&&expressions.script$.value===script&&expressions.script$.revision===scriptRevision&&expressions.list$.revision===listRevision&&expressions.errors$.revision===errorRevision&&JSON.stringify(expressions.table$.value)===table;
   const current=()=>{evaluation.requireCurrent();if(!valid())throw new DOMException('Enclosure was superseded.','AbortError');};
   const workerUrl=assetPath(ociWorker),directory=workerUrl.slice(0,workerUrl.lastIndexOf('/')+1);
   for(const asset of [enclosurePlanModule,enclosureMeshModule,enclosureContactModule]){const path=assetPath(asset);if(path.slice(0,path.lastIndexOf('/')+1)!==directory)throw Error('Enclosure worker modules are not colocated.');}
   const plan={unit:'millimeter',width:params.width,length:params.length,height:params.height,wall:params.wall,clearance:params.clearance,lidThickness:params.lidThickness,lipDepth:params.lipDepth};
   if(version===2)(plan as any).label={width:params.labelWidth,length:params.labelLength,depth:params.labelDepth};
   current();const result=await run({evaluation,featureId:params.featureId,version,plan,occupiedIds:new Set<string>(registry.modelIndex.keys()),assets:{workerUrl,jsPath:assetPath(occJs),wasmPath:assetPath(occWasm)},valid,signal:evaluation.signal});
   result.requireCurrent();current();if(!Array.isArray(result.models)||result.models.length!==(version===2?3:2)||!result.models.every((model:any)=>model instanceof MWorkerEnclosureBody&&model.featureId===params.featureId&&model.id==='worker-enclosure:'+version+':'+JSON.stringify([params.featureId,model.outputRole]))||new Set(result.models.map((model:any)=>model.outputRole)).size!==(version===2?3:2)||typeof result.publicationCheck!=='function')throw Error('A complete checked enclosure result is required.');
   evaluation.addPublicationCheck('enclosure:'+params.featureId,result.publicationCheck);result.requireCurrent();current();return {created:result.models,consumed:[]};
  }
 };
}
