import {state} from 'lstream';
import {toast} from 'react-toastify';
import {surfacingState$} from 'surfacing/surfacingBundle';

// History cursor movement remains separate: these actions travel the bounded
// authored transaction journal through the same guarded operation as the host command.
export function createAuthoredHistoryActions(ctx) {
  const changes=state(0);
  let busy=false;
  const refresh=()=>changes.next(changes.value+1);
  const readiness=direction=>{
    try {
      if(busy||ctx.craftService.isProcessing||!ctx.craftService.inspectRectangleCreation().ready)return false;
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
      const service=ctx.projectService,generation=service.documentGeneration;
      let revision;
      try {revision=ctx.craftService.inspectAuthoredEdits().revision;} catch {refresh();return;}
      busy=true;refresh();
      Promise.resolve().then(()=>ctx.craftService.authoredEditTravel({revision,direction})).catch(()=>{
        if(ctx.projectService===service&&service.isDocumentCurrent(generation))toast.error('Could not '+direction+' this change.');
      }).finally(()=>{busy=false;refresh();});
    }
  }));
}
