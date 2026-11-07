import {settleScopedCommand} from './scoped-command.mjs';

// Transport only. The shared source Worker, candidate evaluator and journal
// own source-frame validation, dependent replay and atomic publication.
export function registerSourcePlaneDepthCommands(host,getTarget){
 const stops=[],keys=['revision','index','featureId','faceId','depth'];
 const text=maxLength=>({type:'string',minLength:1,maxLength});
 function copy(value,fields){
  const proto=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
  if(!value||typeof value!=='object'||Array.isArray(value)||(proto!==null&&Object.getPrototypeOf(proto)!==null)||Reflect.ownKeys(value).length!==fields.length||Reflect.ownKeys(value).some(key=>typeof key!=='string'||!fields.includes(key)))throw Error('Expected exact source-plane command fields.');
  const result={};for(const field of fields){const d=Object.getOwnPropertyDescriptor(value,field);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Source-plane command fields must be own data.');result[field]=d.value;}return Object.freeze(result);
 }
 function target(method){
  const captured=getTarget(),session=host.session(),valid=()=>{try{return !!session&&!host.signal.aborted&&host.session()===session&&captured.valid()===true;}catch{return false;}};
  if(!valid()||typeof captured.craft?.[method]!=='function')throw Error('Source-plane commands are unavailable in this modeling window.');return{craft:captured.craft,valid};
 }
 try{
  stops.push(host.commands.register({id:'inspect-source-planes',description:'Discover current independent principal source planes and signed depth-edit readiness. Source validation and dependent replay remain required.',parameters:{type:'object',additionalProperties:false,required:[],properties:{}}},args=>{
   copy(args,[]);const t=target('inspectSourcePlanes'),result=t.craft.inspectSourcePlanes();if(!t.valid())throw Error('The window or account changed.');return result;
  }));
  stops.push(host.commands.register({id:'edit-source-plane-depth',description:'Edit one inspected independent principal plane’s signed millimeter depth through shared source validation and atomic dependent replay. Save separately; use authored edit travel for undo/redo.',parameters:{type:'object',additionalProperties:false,required:keys.slice(),properties:{revision:text(256),index:{type:'integer',minimum:0,maximum:255},featureId:{type:'integer',minimum:1,maximum:Number.MAX_SAFE_INTEGER},faceId:text(256),depth:{type:'number',minimum:-1e8,maximum:1e8}}}},async args=>{
   const input=copy(args,keys);if(typeof input.revision!=='string'||!input.revision||input.revision.length>256||!Number.isSafeInteger(input.index)||input.index<0||input.index>255||!Number.isSafeInteger(input.featureId)||input.featureId<1||typeof input.faceId!=='string'||!input.faceId||input.faceId.length>256||typeof input.depth!=='number'||!Number.isFinite(input.depth)||Math.abs(input.depth)>1e8)throw Error('Provide a current inspected plane identity and bounded numeric signed depth.');
   const t=target('editSourcePlaneDepth'),scope=Object.freeze({signal:host.signal,valid:t.valid});return settleScopedCommand(t.craft.editSourcePlaneDepth(input,scope),scope);
  }));
 }catch(error){for(const stop of stops.reverse())stop();throw error;}
 return()=>{for(const stop of stops.splice(0).reverse())stop();};
}
