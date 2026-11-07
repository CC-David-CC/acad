import {settleScopedCommand} from './scoped-command.mjs';

// Intent only: source/region/axis identities and signed radians. Craft owns
// geometry, exact build admission, shared transactions and resource custody.
export function registerRevolveCommands(host,getTarget){
 const stops=[],text=maxLength=>({type:'string',minLength:1,maxLength});
 const buildPattern='^sha256:[a-f0-9]{64}:[a-f0-9]{64}$',buildRE=new RegExp(buildPattern);
 const bounded=(v,max)=>typeof v==='string'&&v.length>0&&v.length<=max;
 const angle=v=>typeof v==='number'&&Number.isFinite(v)&&v!==0&&Math.abs(v)<=2*Math.PI;
 const angleSchema={type:'number',minimum:-2*Math.PI,maximum:2*Math.PI};
 const sourceProperties={revision:text(256),faceId:text(256),engineRevision:{type:'string',minLength:136,maxLength:136,pattern:buildPattern}};
 const source=v=>bounded(v.revision,256)&&bounded(v.faceId,256)&&typeof v.engineRevision==='string'&&buildRE.test(v.engineRevision);
 function capture(value,keys){
  const proto=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
  if(!value||typeof value!=='object'||Array.isArray(value)||(proto!==null&&Object.getPrototypeOf(proto)!==null)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))throw Error('Expected exact revolve command fields.');
  const copy={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Revolve fields must be data.');copy[key]=d.value;}return Object.freeze(copy);
 }
 function target(method){
  const captured=getTarget(),session=host.session();
  const valid=()=>{try{return !!session&&!host.signal.aborted&&host.session()===session&&captured.valid()===true;}catch{return false;}};
  if(!valid()||typeof captured.craft?.[method]!=='function')throw Error('Revolve is unavailable in this modeling window.');
  return{craft:captured.craft,valid};
 }
 const definitions=[
  ['inspect-worker-revolves','inspectWorkerRevolves',[],{},()=>true,false,'Discover source planes and explicit experimental revolve builds. Readiness does not certify geometry.'],
  ['inspect-worker-revolve-regions','inspectWorkerRevolveRegions',['revision','faceId','engineRevision'],sourceProperties,source,true,'Discover source-bound regions and actual Segment axes through the sketch and semantic Workers.'],
  ['create-worker-revolve','createWorkerRevolve',['revision','unit','engine','engineRevision','faceId','regionId','axisSegmentId','angleRadians','bodyPolicy'],{...sourceProperties,unit:{enum:['millimeter']},engine:{enum:['occ']},regionId:text(8192),axisSegmentId:text(256),angleRadians:angleSchema,bodyPolicy:{enum:['separate']}},v=>source(v)&&v.unit==='millimeter'&&v.engine==='occ'&&bounded(v.regionId,8192)&&v.regionId.startsWith('sketch-region:')&&bounded(v.axisSegmentId,256)&&angle(v.angleRadians)&&v.bodyPolicy==='separate',true,'Revolve one inspected source region about its source Segment using explicit OCC build and signed radians. Create a separate body; Save separately.'],
  ['inspect-worker-revolve-history','inspectWorkerRevolveHistory',[],{},()=>true,false,'Inspect revolve intent and the authored-edit revision. Discovery/create revisions have a separate role.'],
  ['edit-worker-revolve','editWorkerRevolve',['revision','index','featureId','angleRadians'],{revision:text(256),index:{type:'integer',minimum:0,maximum:255},featureId:{type:'integer',minimum:1,maximum:Number.MAX_SAFE_INTEGER},angleRadians:angleSchema},v=>bounded(v.revision,256)&&Number.isSafeInteger(v.index)&&v.index>=0&&v.index<=255&&Number.isSafeInteger(v.featureId)&&v.featureId>0&&angle(v.angleRadians),true,'Edit the signed angle through shared atomic replay. Source/region/axis/build stay fixed; use shared authored undo/redo and Save separately.']
 ];
 try{for(const [id,method,keys,properties,validate,async,description] of definitions){
  stops.push(host.commands.register({id,description,parameters:{type:'object',additionalProperties:false,required:keys.slice(),properties}},args=>{
   const input=capture(args,keys);if(!validate(input))throw Error('Provide inspected identities, an explicit build and nonzero signed radians with magnitude at most 2π.');
   const t=target(method),scope=Object.freeze({signal:host.signal,valid:t.valid});
   if(async)return settleScopedCommand(t.craft[method](input,scope),scope);
   const result=t.craft[method]();if(!t.valid())throw Error('The window or account changed.');return result;
  }));
 }}catch(error){for(const stop of stops.reverse())stop();throw error;}
 return()=>{for(const stop of stops.splice(0).reverse())stop();};
}
