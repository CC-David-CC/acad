import {toast} from 'react-toastify';
const aborted=Function.call.bind(Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted')!.get!);

// Capture at render/action invocation, before an event can become stale. Only
// the existing real shared Craft operation authors the resulting position.
export function captureHistoryNavigation(ctx:any,history:any[]){
 const craft=ctx.craftService,project=ctx.projectService,manager=ctx.projectManager,
  generation=project.documentGeneration,signal=project.documentSignal,method=craft.navigateHistoryPosition;
 const alive=()=>{try{return ctx.craftService===craft&&ctx.projectService===project&&ctx.projectManager===manager&&
  project.hasHostLifetime&&project.documentGeneration===generation&&project.documentSignal===signal&&
  !aborted(signal)&&project.isDocumentCurrent(generation)&&craft.navigateHistoryPosition===method;}catch{return false;}};
 return async(after:any|null,valid:()=>boolean=()=>true)=>{
  const current=()=>{try{return alive()&&valid()===true;}catch{return false;}};
  try{
   if(!current()||craft.modifications$.value.history!==history||after!==null&&!history.includes(after))throw Object.assign(Error('The rendered feature history changed.'),{code:'STALE_HISTORY'});
   const value=await method.call(craft,history,after,{signal,valid:current});
   return current()?{ok:true,value}:{ok:false};
  }catch(error){
   if(current()){
    const field=error&&Object.getOwnPropertyDescriptor(error,'code'),code=field&&Object.hasOwn(field,'value')&&typeof field.value==='string'&&field.value.length<=64?field.value:'UNAVAILABLE';
    toast.error('History navigation refused: '+code+'.');
   }
   return {ok:false};
  }
 };
}
