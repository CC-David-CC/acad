import {settleScopedCommand} from './scoped-command.mjs';

// Region identity and dependency compatibility remain authoritative in Craft.
export function registerSelectedProfileRegionCommands(host,getTarget){
 const stops=[],text=maxLength=>({type:'string',minLength:1,maxLength});
 const validText=(v,n)=>typeof v==='string'&&v.length>0&&v.length<=n;
 function capture(value,keys){
  const prototype=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
  if(!value||typeof value!=='object'||Array.isArray(value)||(prototype!==null&&Object.getPrototypeOf(prototype)!==null)||Reflect.ownKeys(value).length!==keys.length)throw Error('Expected exact selected-region feature fields.');
  const copy={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Selected-region feature fields must be data.');copy[key]=d.value;}
  if(!validText(copy.revision,256)||!Number.isSafeInteger(copy.index)||copy.index<0||copy.index>255||!Number.isSafeInteger(copy.featureId)||copy.featureId<1||keys.includes('regionId')&&!validText(copy.regionId,8192))throw Error('Provide a current inspected feature and opaque region identity.');
  return Object.freeze(copy);
 }
 function target(method){
  const captured=getTarget(),session=host.session();
  const valid=()=>{try{return !!session&&!host.signal.aborted&&host.session()===session&&captured.valid()===true;}catch{return false;}};
  if(!valid()||typeof captured.craft?.[method]!=='function')throw Error('Region reselection is unavailable in this modeling window.');
  return {craft:captured.craft,valid};
 }
 try{
  for(const [id,method,editing] of [
   ['inspect-selected-profile-region-choices','inspectSelectedProfileRegionChoices',false],
   ['edit-selected-profile-region','editSelectedProfileRegion',true]
  ]){
   const keys=['revision','index','featureId',...(editing?['regionId']:[])];
   const properties={revision:text(256),index:{type:'integer',minimum:0,maximum:255},featureId:{type:'integer',minimum:1,maximum:Number.MAX_SAFE_INTEGER},...(editing?{regionId:text(8192)}:{})};
   stops.push(host.commands.register({id,description:editing?'Replace one existing extrusion’s selected region using an inspected opaque ID. Shared history replay preserves compatible dependents or rejects the edit. Save separately.':'Discover current source-bound region choices for an existing selected extrusion. Unsupported choices remain explicit; no geometry is changed.',parameters:{type:'object',additionalProperties:false,required:keys.slice(),properties}},async args=>{
    const input=capture(args,keys),t=target(method),scope=Object.freeze({signal:host.signal,valid:t.valid});
    return settleScopedCommand(t.craft[method](input,scope),scope);
   }));
  }
 }catch(error){for(const stop of stops.reverse())stop();throw error;}
 return()=>{for(const stop of stops.splice(0).reverse())stop();};
}
