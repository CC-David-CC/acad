import {settleScopedCommand} from './scoped-command.mjs';

// Transport only. Proposed source stays private to the shared Worker/replay path.
export function registerSelectedProfileSourceDimensionCommands(host,getTarget){
 const stops=[],base=['revision','sourceRevision','index','featureId','constraintId','value'];
 const text=maxLength=>({type:'string',minLength:1,maxLength});
 const properties={revision:text(256),sourceRevision:text(256),index:{type:'integer',minimum:0,maximum:255},featureId:{type:'integer',minimum:1,maximum:Number.MAX_SAFE_INTEGER},constraintId:text(4096),value:{type:'number',exclusiveMinimum:0,maximum:1000000},regionId:text(8192),candidateSourceDigest:{type:'string',pattern:'^[a-f0-9]{64}$',minLength:64,maxLength:64}};
 const validText=(v,n)=>typeof v==='string'&&v.length>0&&v.length<=n;
 function capture(value,keys){
  const p=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
  if(!value||typeof value!=='object'||Array.isArray(value)||(p!==null&&Object.getPrototypeOf(p)!==null)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))throw Error('Expected exact source-dimension/region fields.');
  const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Source-dimension/region fields must be own data.');out[key]=d.value;}
  if(!validText(out.revision,256)||!validText(out.sourceRevision,256)||!Number.isSafeInteger(out.index)||out.index<0||out.index>255||!Number.isSafeInteger(out.featureId)||out.featureId<1||!validText(out.constraintId,4096)||typeof out.value!=='number'||!Number.isFinite(out.value)||out.value<=0||out.value>1e6||keys.includes('regionId')&&(!validText(out.regionId,8192)||typeof out.candidateSourceDigest!=='string'||!/^[a-f0-9]{64}$/.test(out.candidateSourceDigest)))throw Error('Use current inspected feature/source revisions, a driving dimension and explicit proposed region.');
  return Object.freeze(out);
 }
 function target(name){
  const captured=getTarget(),session=host.session(),signal=host.signal,commands=host.commands,documentToken=commands?.documentToken?.(),craft=captured.craft,method=craft?.[name];
  const owner=()=>host.signal===signal&&!signal.aborted&&host.session()===session&&host.commands===commands&&commands.documentToken()===documentToken&&captured.craft===craft&&craft?.[name]===method;
  const valid=()=>{try{return !!session&&validText(documentToken,256)&&owner()&&captured.valid()===true&&owner();}catch{return false;}};
  if(typeof method!=='function'||!valid())throw Error('Source-dimension/region commands require the current bound CAD document and shared service.');
  return {craft,method,scope:Object.freeze({signal,valid})};
 }
 try{for(const [id,name,editing] of [
  ['inspect-selected-profile-source-dimension-regions','inspectSelectedProfileSourceDimensionRegions',false],
  ['edit-selected-profile-source-dimension-region','editSelectedProfileSourceDimensionRegion',true]
 ]){
  const keys=[...base,...(editing?['regionId','candidateSourceDigest']:[])];
  stops.push(host.commands.register({id,description:editing?'Atomically edit one existing source dimension and explicitly reselect its extrusion region. Compatible children replay unchanged; incompatible children refuse. Shared Undo/Redo; Save separately.':'Discover actual descriptor-backed region choices after a proposed literal source-dimension edit. Does not publish source/model changes. Choose an opaque supported region explicitly.',parameters:{type:'object',additionalProperties:false,required:keys.slice(),properties:Object.fromEntries(keys.map(k=>[k,properties[k]]))}},args=>{
   const input=capture(args,keys),t=target(name);return settleScopedCommand(t.method.call(t.craft,input,t.scope),t.scope);
  }));
 }}catch(error){for(const stop of stops.splice(0).reverse())stop();throw error;}
 return()=>{for(const stop of stops.splice(0).reverse())stop();};
}
