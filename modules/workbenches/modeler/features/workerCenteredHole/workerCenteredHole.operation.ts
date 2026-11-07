import {OperationDescriptor} from 'cad/craft/operationBundle';
import {EntityKind} from 'cad/model/entities';
import {MBrepShell} from 'cad/model/mshell';
import {centeredHoleIntentFromLid} from 'engine/extrusion/centeredHoleIntent.mjs';
import {resolveCandidatePrism} from 'engine/extrusion/candidatePrismLedger.mjs';

function selectedParent(params:any,ctx:any) {
  const {face,featureId,diameter}=params;
  if (!Number.isSafeInteger(featureId)||featureId<=0||face?.TYPE!==EntityKind.FACE||
      !(face.root instanceof MBrepShell)||ctx.cadRegistry.findFace(face.id)!==face)
    throw Error('Select the current LID of a worker rectangle extrusion.');
  const intent=centeredHoleIntentFromLid({featureId:String(featureId),lidFaceId:face.id,diameter});
  const parent=resolveCandidatePrism(ctx.engineEvaluation,intent);
  if(parent.model!==face.root||!parent.model.faces.includes(face))throw Error('The selected parent has changed.');
  parent.requireCurrent();
  return {intent,parent};
}

// Dependency injection keeps the history operation independent of a particular
// engine adapter. Register only with the qualified, owner-bound cut adapter.
// The operation ID makes rectangle-center + through-all explicit authored
// semantics; the saved face reference is never a native handle or ordinal.
export function createWorkerCenteredHoleOperation(runCut:(input:any)=>Promise<any>):OperationDescriptor<any> {
  if(typeof runCut!=='function')throw Error('A checked centered-hole adapter is required.');
  return {
    id:'WORKER_CENTERED_THROUGH_HOLE_V1',label:'Centered through-hole',icon:'img/cad/hole',
    info:'Cut a centered circular through-hole in a worker rectangle extrusion.',
    paramsInfo:({diameter})=>`(Ø${diameter} mm, centered, through all)`,
    form:[
      {type:'number',dimension:'length',name:'diameter',label:'Diameter (mm)',defaultValue:10},
      {type:'selection',name:'face',capture:[EntityKind.FACE],label:'Rectangle top face',multi:false,defaultValue:{usePreselection:true,preselectionIndex:0}},
    ],
    defaultActiveField:'face',
    admitGeometry:(params,ctx)=>{selectedParent(params,ctx);},
    run:async(params:any,ctx:any)=>{
      const {intent,parent}=selectedParent(params,ctx),evaluation=ctx.engineEvaluation;
      const project=ctx.projectService,storage=ctx.storageService,craft=ctx.craftService,
        manager=ctx.projectManager,registry=ctx.cadRegistry,expressions=ctx.expressionService;
      if(!project?.hasHostLifetime||manager?.unit!=='millimeter'||storage?.revision==null)
        throw Error('A current host-bound millimeter workspace is required.');
      const generation=project.documentGeneration,revision=storage.revision,epoch=craft.evaluationEpoch,
        history=craft.modifications$.value,script=expressions.script$.value,scriptRevision=expressions.script$.revision,
        listRevision=expressions.list$.revision,errorRevision=expressions.errors$.revision,
        table=JSON.stringify(expressions.table$.value);
      if(expressions.errors$.value.length)throw Error('Shared expressions are invalid.');
      const valid=()=>ctx.projectService===project&&project.hasHostLifetime&&project.isDocumentCurrent(generation)&&
        ctx.storageService===storage&&storage.revision===revision&&ctx.craftService===craft&&craft.evaluationEpoch===epoch&&
        craft.modifications$.value===history&&ctx.projectManager===manager&&manager.unit==='millimeter'&&
        ctx.cadRegistry===registry&&ctx.expressionService===expressions&&expressions.script$.value===script&&
        expressions.script$.revision===scriptRevision&&expressions.list$.revision===listRevision&&
        expressions.errors$.revision===errorRevision&&JSON.stringify(expressions.table$.value)===table;
      const current=()=>{evaluation.requireCurrent();parent.requireCurrent();if(!valid())throw new DOMException('Centered hole was superseded.','AbortError');};
      current();
      const result=await runCut({evaluation,intent,occupiedIds:new Set<string>(registry.modelIndex.keys()),valid,signal:evaluation.signal});
      result.requireCurrent();current();
      if(!(result.model instanceof MBrepShell)||result.model===parent.model)throw Error('The cut did not produce a new checked body.');
      if(typeof result.publicationCheck!=='function')throw Error('The cut has no publication guard.');
      evaluation.addPublicationCheck('centered-hole:'+intent.featureId,result.publicationCheck);
      result.requireCurrent();current();
      return {created:[result.model],consumed:[parent.model]};
    }
  };
}
