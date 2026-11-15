import {settleScopedCommand} from './scoped-command.mjs';

// Transport only. Core owns the one authored graph/journal, native replay,
// source/dependency checks and atomic candidate publication. No auto-save.
export function registerFeatureHistoryCommands(host,getTarget){
 const stops=[],positive={type:'integer',minimum:1,maximum:Number.MAX_SAFE_INTEGER};
 const properties={revision:{type:'string',minLength:1,maxLength:256},index:{type:'integer',minimum:0,maximum:255},featureId:positive,suppressed:{type:'boolean'},afterFeatureId:{anyOf:[positive,{type:'null'}]}};
 const schema=keys=>({type:'object',additionalProperties:false,required:keys,properties:Object.fromEntries(keys.map(k=>[k,properties[k]]))});
 const aborted=Function.call.bind(Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get);
 function capture(value,keys){
  const p=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
  if(!value||typeof value!=='object'||Array.isArray(value)||(p!==null&&Object.getPrototypeOf(p)!==null)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))throw Error('Expected exact history-control fields.');
  const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('History-control fields must be own data.');out[key]=d.value;}
  if(keys.length&&(typeof out.revision!=='string'||!out.revision||out.revision.length>256))throw Error('Use an inspected history revision.');
  if(keys.includes('featureId')&&(!Number.isSafeInteger(out.featureId)||out.featureId<1||!Number.isSafeInteger(out.index)||out.index<0||out.index>255||typeof out.suppressed!=='boolean'))throw Error('Use an actual feature identity and boolean suppression.');
  if(keys.includes('afterFeatureId')&&out.afterFeatureId!==null&&(!Number.isSafeInteger(out.afterFeatureId)||out.afterFeatureId<1))throw Error('Use an actual history anchor, or null for the beginning.');
  return Object.freeze(out);
 }
 function target(name){
  const captured=getTarget(),commands=host.commands,session=host.session(),signal=host.signal,token=commands?.documentToken?.(),craft=captured.craft,method=craft?.[name];
  const owner=()=>host.commands===commands&&host.signal===signal&&!aborted(signal)&&host.session()===session&&commands.documentToken()===token&&captured.craft===craft&&craft?.[name]===method;
  const valid=()=>{try{return !!session&&typeof token==='string'&&token.length>0&&token.length<=256&&owner()&&captured.valid()===true&&owner();}catch{return false;}};
  if(typeof method!=='function'||!valid())throw Error('History controls require a current bound CAD document.');
  return{craft,method,valid,scope:Object.freeze({signal,valid})};
 }
 function register(id,name,keys,description,read=false){stops.push(host.commands.register({id,description,parameters:schema(keys)},args=>{
  const input=capture(args,keys),t=target(name);
  if(read){const result=t.method.call(t.craft);if(!t.valid())throw Error('The CAD document changed during inspection.');return result;}
  return settleScopedCommand(t.method.call(t.craft,input,t.scope),t.scope);
 }));}
 try{
  register('inspect-worker-history-controls','inspectWorkerHistoryControls',[],'Inspect the finite numeric modern-part suppression, dependencies and prefix branch capability. Eligibility still requires genuine complete replay.',true);
  register('set-worker-feature-suppressed','setWorkerFeatureSuppressed',['revision','index','featureId','suppressed'],'Set one inspected feature suppression state through shared replay and Undo. Active dependents and assigned output disappearance refuse. The saved feature and IDs remain; Save separately.');
  register('set-worker-history-prefix','setWorkerHistoryPrefix',['revision','afterFeatureId'],'Evaluate an inspected authored prefix without deleting the future. null selects the beginning. Save and ordinary new authoring remain unavailable until return-to-tip or explicit branch commit. Shared Undo/Redo.');
  register('commit-worker-history-branch','commitWorkerHistoryBranch',['revision','afterFeatureId'],'Commit the current inspected prefix as the active branch. Discards only supported solid suffix definitions, preserves source/counters, refuses source-plane/material dependencies; shared Undo retains a bounded authored delta. Save separately.');
 }catch(error){for(const stop of stops.splice(0).reverse())stop();throw error;}
 return()=>{for(const stop of stops.splice(0).reverse())stop();};
}
