import {settleScopedCommand} from './scoped-command.mjs';
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
const aborted=Function.call.bind(Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get);
// Transport only. Current Native bounds, placement and real display admission
// belong to the shared Core; callers never supply geometry or camera bounds.
export function registerViewCommands(host,getTarget){
 const stop=host.commands.register({id:'fit-worker-solids',description:'Fit1–32 inspected current Native solid outputs in the viewport. Preserves view direction/up; excludes source planes/helpers. Changes only the camera, not the authored document or saved state.',parameters:{type:'object',additionalProperties:false,required:['revision','bodyIds'],properties:{revision:{type:'string',minLength:1,maxLength:256},bodyIds:{type:'array',minItems:1,maxItems:32,uniqueItems:true,items:{type:'string',minLength:1,maxLength:1024}}}}},async args=>{
  const proto=args&&typeof args==='object'?Object.getPrototypeOf(args):undefined;
  if(!args||typeof args!=='object'||Array.isArray(args)||(proto!==null&&Object.getPrototypeOf(proto)!==null)||Reflect.ownKeys(args).length!==2)fail('INVALID_REQUEST','Provide exactly revision and bodyIds.');
  const data={};for(const key of['revision','bodyIds']){const d=Object.getOwnPropertyDescriptor(args,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','View fields must be own data.');data[key]=d.value;}
  if(typeof data.revision!=='string'||!data.revision||data.revision.length>256||!Array.isArray(data.bodyIds)||data.bodyIds.length<1||data.bodyIds.length>32||Reflect.ownKeys(data.bodyIds).length!==data.bodyIds.length+1)fail('INVALID_REQUEST','Select1–32 current inspected solid output IDs.');
  data.bodyIds=Object.freeze(Array.from({length:data.bodyIds.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(data.bodyIds,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='string'||!d.value||d.value.length>1024)fail('INVALID_REQUEST','Solid output IDs must be dense bounded own data.');return d.value;}));
  if(new Set(data.bodyIds).size!==data.bodyIds.length)fail('INVALID_REQUEST','Select each solid output once.');
  const input=Object.freeze(data),target=getTarget(),craft=target.craft,session=host.session();
  const valid=()=>{try{return !!session&&!aborted(host.signal)&&host.session()===session&&target.valid()===true;}catch{return false;}};
  if(!valid())fail('CANCELLED','View command was cancelled.');
  if(typeof craft?.fitWorkerSolids!=='function')fail('UNAVAILABLE','Current solid fitting is unavailable in this modeling window.');
  const scope=Object.freeze({signal:host.signal,valid});return settleScopedCommand(craft.fitWorkerSolids(input,scope),scope);
 });
 let disposed=false;return()=>{if(!disposed){disposed=true;stop();}};
}
