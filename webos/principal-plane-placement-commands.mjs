import {settleScopedCommand} from './scoped-command.mjs';

// Transport only. The Core owns real wizard origin, source proof, Native replay,
// document/J currentness and atomic prefix-to-tip publication. No host flag can
// waive an active draft or manufacture a source/frame/placement proof.
export function registerPrincipalPlanePlacementCommands(host,getTarget){
 const stops=[],keys=['revision','index','featureId','faceId','orientation','depth'];
 const text=maxLength=>({type:'string',minLength:1,maxLength});
 function capture(value,fields){
  const proto=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
  if(!value||typeof value!=='object'||Array.isArray(value)||(proto!==null&&Object.getPrototypeOf(proto)!==null)||Reflect.ownKeys(value).length!==fields.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!fields.includes(k)))throw Error('Expected exact principal placement fields.');
  const result={};for(const k of fields){const d=Object.getOwnPropertyDescriptor(value,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Principal placement fields must be own data.');result[k]=d.value;}return Object.freeze(result);
 }
 function target(method){
  const captured=getTarget(),session=host.session(),valid=()=>{try{return !!session&&!host.signal.aborted&&host.session()===session&&captured.valid()===true;}catch{return false;}};
  if(!valid()||typeof captured.craft?.[method]!=='function')throw Error('Principal placement commands are unavailable in this modeling window.');return{craft:captured.craft,valid};
 }
 try{
  stops.push(host.commands.register({id:'inspect-source-plane-placements',description:'Discover actual current numeric principal source identities and depth/orientation edit readiness. The revision is authored-session history, distinct from source-create discovery.',parameters:{type:'object',additionalProperties:false,required:[],properties:{}}},args=>{
   capture(args,[]);const t=target('inspectSourcePlanePlacements'),result=t.craft.inspectSourcePlanePlacements();if(!t.valid())throw Error('The window or account changed.');return result;
  }));
  stops.push(host.commands.register({id:'edit-source-plane-placement',description:'Edit an existing inspected numeric principal plane depth/orientation through source validation and complete Native suffix replay. Supported reviewed prefixes finish directly at tip, one shared authored event. Save separately; existing authored Undo/Redo preserves review position.',parameters:{type:'object',additionalProperties:false,required:keys.slice(),properties:{revision:text(256),index:{type:'integer',minimum:0,maximum:255},featureId:{type:'integer',minimum:1,maximum:Number.MAX_SAFE_INTEGER},faceId:text(256),orientation:{type:'string',enum:['XY','XZ','ZY']},depth:{type:'number',minimum:-1e8,maximum:1e8}}}},async args=>{
   const p=capture(args,keys);if(typeof p.revision!=='string'||!p.revision||p.revision.length>256||!Number.isSafeInteger(p.index)||p.index<0||p.index>255||!Number.isSafeInteger(p.featureId)||p.featureId<1||typeof p.faceId!=='string'||!p.faceId||p.faceId.length>256||!['XY','XZ','ZY'].includes(p.orientation)||typeof p.depth!=='number'||!Number.isFinite(p.depth)||Math.abs(p.depth)>1e8)throw Error('Use a current inspected principal identity and bounded signed millimeter placement.');
   const t=target('editSourcePlanePlacement'),scope=Object.freeze({signal:host.signal,valid:t.valid});return settleScopedCommand(t.craft.editSourcePlanePlacement(p,scope),scope);
  }));
 }catch(error){for(const stop of stops.reverse())stop();throw error;}
 return()=>{for(const stop of stops.splice(0).reverse())stop();};
}
