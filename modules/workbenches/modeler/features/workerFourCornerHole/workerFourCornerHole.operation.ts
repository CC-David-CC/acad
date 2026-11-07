import {OperationDescriptor} from 'cad/craft/operationBundle';
import {EntityKind} from 'cad/model/entities';
import {MBrepShell} from 'cad/model/mshell';
import {validateFourCornerHoleIntent} from 'engine/extrusion/fourCornerHoleIntent.mjs';
import {resolveCandidateCenteredHole} from 'engine/extrusion/candidatePrismLedger.mjs';
const stable=(parts:any[])=>'worker-prism:1:'+JSON.stringify(parts);
function selectedParent(params:any,ctx:any){
 const {face,featureId,diameter,offsetX,offsetY,sideIds}=params;
 if(!Number.isSafeInteger(featureId)||featureId<=0||face?.TYPE!==EntityKind.FACE||!(face.root instanceof MBrepShell)||ctx.cadRegistry.findFace(face.id)!==face)throw Error('Select the current centered-hole wall.');
 const key=face.topology?.data?.portableIdentity?.key,source=key?.source;
 if(!key||key.kind!=='face'||key.role!=='HOLE_WALL'||face.id!==stable([key.featureId,'face',key.role,source])||!source||typeof source.parentFeatureId!=='string'||typeof source.regionId!=='string')throw Error('Select the current centered-hole wall.');
 const target={parentFeatureId:source.parentFeatureId,regionId:source.regionId,bodyId:stable([source.parentFeatureId,'body']),lidFaceId:stable([source.parentFeatureId,'face','LID',{regionId:source.regionId}])};
 const currentSides=face.root.ext?.fourCornerSideIds;
 if(!currentSides||!sideIds||['minX','maxX','minY','maxY'].some(k=>sideIds[k]!==currentSides[k]))throw Error('The authored rectangle sides have changed.');
 const intent:any=validateFourCornerHoleIntent({version:1,kind:'four-corner-through-holes',unit:'millimeter',featureId:String(featureId),centerFeatureId:key.featureId,target,sideIds,offsetX,offsetY,diameter,extent:'through-all'});
 const parent=resolveCandidateCenteredHole(ctx.engineEvaluation,intent);
 if(parent.model!==face.root||!parent.model.faces.includes(face))throw Error('The selected centered parent has changed.');
 parent.requireCurrent();return {intent,parent};
}
// Explicit side IDs are authored source relationships, never inferred from an
// arbitrary native edge order. Registration requires a producer for sideIds.
export function createWorkerFourCornerHoleOperation(runCut:(input:any)=>Promise<any>):OperationDescriptor<any>{
 if(typeof runCut!=='function')throw Error('A checked corner-hole adapter is required.');
 return {
  id:'WORKER_FOUR_CORNER_THROUGH_HOLES_V1',label:'Four corner through-holes',icon:'img/cad/hole',
  info:'Cut four offset holes through the centered worker plate.',
  paramsInfo:({diameter,offsetX,offsetY})=>`(Ø${diameter} mm; ${offsetX}, ${offsetY} mm)`,
  form:[
   {type:'number',dimension:'length',name:'diameter',label:'Diameter (mm)',defaultValue:4},
   {type:'number',name:'offsetX',label:'X edge offset (mm)',defaultValue:10,dimension:'length'},
   {type:'number',name:'offsetY',label:'Y edge offset (mm)',defaultValue:10,dimension:'length'},
   {type:'selection',name:'face',capture:[EntityKind.FACE],label:'Centered hole wall',multi:false,defaultValue:{usePreselection:true,preselectionIndex:0}},
  ],
  defaultActiveField:'face',admitGeometry:(params,ctx)=>{selectedParent({...params,sideIds:params.face?.root?.ext?.fourCornerSideIds},ctx);},
  run:async(params:any,ctx:any,raw:any)=>{
   const {intent,parent}=selectedParent({...params,sideIds:raw.sideIds},ctx),evaluation=ctx.engineEvaluation;
   const project=ctx.projectService,storage=ctx.storageService,craft=ctx.craftService,manager=ctx.projectManager,registry=ctx.cadRegistry,expressions=ctx.expressionService;
   if(!project?.hasHostLifetime||manager?.unit!=='millimeter'||storage?.revision==null)throw Error('A current host-bound millimeter workspace is required.');
   const generation=project.documentGeneration,revision=storage.revision,epoch=craft.evaluationEpoch,history=craft.modifications$.value,script=expressions.script$.value,scriptRevision=expressions.script$.revision,listRevision=expressions.list$.revision,errorRevision=expressions.errors$.revision,table=JSON.stringify(expressions.table$.value);
   if(expressions.errors$.value.length)throw Error('Shared expressions are invalid.');
   const valid=()=>ctx.projectService===project&&project.hasHostLifetime&&project.isDocumentCurrent(generation)&&ctx.storageService===storage&&storage.revision===revision&&ctx.craftService===craft&&craft.evaluationEpoch===epoch&&craft.modifications$.value===history&&ctx.projectManager===manager&&manager.unit==='millimeter'&&ctx.cadRegistry===registry&&ctx.expressionService===expressions&&expressions.script$.value===script&&expressions.script$.revision===scriptRevision&&expressions.list$.revision===listRevision&&expressions.errors$.revision===errorRevision&&JSON.stringify(expressions.table$.value)===table;
   const current=()=>{evaluation.requireCurrent();parent.requireCurrent();if(!valid())throw new DOMException('Corner holes were superseded.','AbortError');};
   current();const result=await runCut({evaluation,intent,occupiedIds:new Set<string>(registry.modelIndex.keys()),valid,signal:evaluation.signal});result.requireCurrent();current();
   if(!(result.model instanceof MBrepShell)||result.model===parent.model||typeof result.publicationCheck!=='function')throw Error('The cut did not produce a new checked body.');
   evaluation.addPublicationCheck('four-corner-holes:'+intent.featureId,result.publicationCheck);result.requireCurrent();current();
   return {created:[result.model],consumed:[parent.model]};
  }
 };
}
