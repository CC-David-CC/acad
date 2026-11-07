import {captureSelectedProfileDepthParameters} from './authoredEditJournal.mjs';

const TYPE='WORKER_SELECTED_PROFILE_EXTRUDE_V2';
const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
function fields(value:any,keys:string[]){
 const proto=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
 if(!value||typeof value!=='object'||Array.isArray(value)||(proto!==null&&Object.getPrototypeOf(proto)!==null)||Reflect.ownKeys(value).length!==keys.length)fail('INVALID_REQUEST','Expected exact selected-profile depth fields.');
 const out:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))fail('INVALID_REQUEST','Selected-profile depth fields must be data.');out[key]=d.value;}return out;
}
export function createSelectedProfileDepthCommands(ctx:any){
 function inspectSelectedProfileHistory(){
  const craft=ctx.craftService,project=ctx.projectService,expressions=ctx.expressionService,base=craft.inspectRectangleCreation(),journal=craft.inspectAuthoredEdits(),state=craft.modifications$.value;
  let reason=base.ready?null:base.reason;
  if(!reason&&!project.hasHostLifetime)reason='A current host-bound workspace is required.';
  if(!reason&&(expressions.isTyped||expressions.script$.value.trim()||Reflect.ownKeys(expressions.table$.value||{}).length))reason='Numeric depth editing currently requires local constants without project parameter bindings.';
  if(!Array.isArray(state.history)||state.history.length>256)fail('RESOURCE_LIMIT','Selected-profile history exceeds its bound.');
  const features=state.history.flatMap((entry:any,index:number)=>entry.type===TYPE?[Object.freeze({index,...captureSelectedProfileDepthParameters(entry.params)})]:[]);
  const end=craft.inspectRectangleCreation(),endJournal=craft.inspectAuthoredEdits();
  if(ctx.craftService!==craft||ctx.projectService!==project||ctx.expressionService!==expressions||craft.modifications$.value!==state||end.revision!==base.revision||endJournal.revision!==journal.revision)throw new DOMException('Selected-profile history changed during inspection.','AbortError');
  return Object.freeze({ready:!reason,reason:reason||null,revision:journal.revision,canUndo:journal.canUndo,canRedo:journal.canRedo,features:Object.freeze(features),scope:'numeric-selected-profile-depth',typedBindings:'unsupported'});
 }
 async function editSelectedProfileDepth(input:any,rawOptions:any={}){
  const args=fields(input,['revision','index','featureId','depth']);
  if(typeof args.revision!=='string'||!args.revision||args.revision.length>256||!Number.isSafeInteger(args.index)||args.index<0||args.index>255||!Number.isSafeInteger(args.featureId)||args.featureId<1||typeof args.depth!=='number'||!Number.isFinite(args.depth)||args.depth<=0||args.depth>1e6)fail('INVALID_REQUEST','Use a current selected-profile identity and a positive bounded millimeter depth.');
  const keys=Reflect.ownKeys(rawOptions||{});if(keys.some(k=>typeof k!=='string'||!['signal','valid'].includes(k)))fail('INVALID_REQUEST','Invalid depth options.');
  const options=fields(rawOptions,keys as string[]);if(options.valid!==undefined&&typeof options.valid!=='function')fail('INVALID_REQUEST','Invalid lifetime guard.');
  if(options.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(options.signal);}catch{fail('INVALID_REQUEST','Invalid cancellation signal.');}
  const info=inspectSelectedProfileHistory();
  if(!info.ready)fail(ctx.expressionService.isTyped||ctx.expressionService.script$.value.trim()||Reflect.ownKeys(ctx.expressionService.table$.value||{}).length?'UNSUPPORTED_PARAMETERS':'UNAVAILABLE',info.reason);
  if(args.revision!==info.revision)fail('STALE_HISTORY','The authored selected-profile revision is stale.');
  if(!info.features.some((feature:any)=>feature.index===args.index&&feature.featureId===args.featureId))fail('INVALID_FEATURE','The selected-profile feature is unavailable.');
  return craftEdit(args,options);
 }
 function craftEdit(args:any,options:any){return ctx.craftService.authoredSelectedProfileDepthOperation(args,options);}
 return Object.freeze({inspectSelectedProfileHistory,editSelectedProfileDepth});
}
