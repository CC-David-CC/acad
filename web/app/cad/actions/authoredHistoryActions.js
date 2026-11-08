import {state} from 'lstream';
import {toast} from 'react-toastify';
import {surfacingState$} from 'surfacing/surfacingBundle';
const aborted=Function.call.bind(Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get);

// History cursor movement remains separate: these actions travel the bounded
// authored transaction journal through the same guarded operation as the host command.
export function createAuthoredHistoryActions(ctx) {
  const changes=state(0);
  let busy=false;
  const refresh=()=>changes.next(changes.value+1);
  const readiness=direction=>{
    try {
      const craft=ctx.craftService,wizard=ctx.wizardService,project=ctx.projectService;
      if(busy||craft.isProcessing||craft.pipelineFailure$.value||craft.engineCleanupFailure$.value||ctx.projectManager.isRestoring||
          !project.hasHostLifetime||aborted(project.documentSignal)||ctx.services.sketcher.inPlaceEditor.inEditMode||
          typeof wizard.hasActiveOperation!=='function'||wizard.hasActiveOperation()!==false)return false;
      const info=ctx.craftService.inspectAuthoredEdits();
      return direction==='undo'?info.canUndo===true:info.canRedo===true;
    } catch {return false;}
  };
  for(const source of [ctx.streams.craft.update,ctx.streams.craft.modifications,ctx.streams.craft.models,
    ctx.streams.storage.update,ctx.streams.sketcher.sketchingFace,ctx.wizardService.workingRequest$,surfacingState$]) source?.attach(refresh);
  // Assembly and workbench services may activate after UIConfig.
  queueMicrotask(()=>{
    ctx.workbenchService?.currentWorkbench$?.attach(refresh);
    ctx.assemblyService?.constraints$?.attach(refresh);
    refresh();
  });
  return ['undo','redo'].map(direction=>({
    id:direction==='undo'?'AuthoredUndo':'AuthoredRedo',
    appearance:{cssIcons:[direction==='undo'?'undo':'repeat'],label:direction==='undo'?'Undo':'Redo',info:'Travel supported authored changes'},
    listens:()=>changes,
    update:action=>{action.enabled=readiness(direction);},
    invoke:()=>{
      if(!readiness(direction))return;
      const service=ctx.projectService,generation=service.documentGeneration,signal=service.documentSignal,craft=ctx.craftService,manager=ctx.projectManager;
      const current=()=>{try{return ctx.projectService===service&&ctx.craftService===craft&&ctx.projectManager===manager&&service.hasHostLifetime&&service.documentSignal===signal&&!aborted(signal)&&service.isDocumentCurrent(generation);}catch{return false;}};
      let revision;
      try {revision=ctx.craftService.inspectAuthoredEdits().revision;} catch {refresh();return;}
      busy=true;refresh();
      Promise.resolve().then(()=>{if(!current())throw new DOMException('History action was superseded.','AbortError');return craft.authoredEditTravel({revision,direction},{signal,valid:current});}).catch(()=>{
        if(current())toast.error('Could not '+direction+' this change.');
      }).finally(()=>{busy=false;refresh();});
    }
  }));
}
