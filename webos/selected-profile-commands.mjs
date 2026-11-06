import {settleScopedCommand} from './scoped-command.mjs';

// Public selected-profile intent only. Source reconstruction, region topology,
// native handles/history and publication remain owned by the craft coordinator.
export function registerSelectedProfileCommands(host,getTarget){
 const stops=[],revisionPattern='^sha256:[a-f0-9]{64}:[a-f0-9]{64}$',revisionRE=new RegExp(revisionPattern);
 const text=maxLength=>({type:'string',minLength:1,maxLength});
 const depth={type:'number',exclusiveMinimum:0,maximum:1000000};
 const spec=(keys,properties)=>({type:'object',additionalProperties:false,required:keys.slice(),properties});
 function copy(value,keys){
  const proto=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
  if(!value||typeof value!=='object'||Array.isArray(value)||(proto!==null&&Object.getPrototypeOf(proto)!==null)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))throw Error('Expected exact selected-profile command fields.');
  const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Selected-profile command fields must be data.');out[key]=d.value;}return out;
 }
 const bounded=(value,max)=>typeof value==='string'&&value.length>0&&value.length<=max;
 const positive=value=>typeof value==='number'&&Number.isFinite(value)&&value>0&&value<=1e6;
 function target(method){
  const captured=getTarget(),session=host.session();
  const valid=()=>{try{return !!session&&!host.signal.aborted&&host.session()===session&&captured.valid()===true;}catch{return false;}};
  if(!valid()||typeof captured.craft?.[method]!=='function')throw Error('Selected-profile commands are unavailable in this modeling window.');
  return{craft:captured.craft,valid};
 }
 function scoped(t){return Object.freeze({signal:host.signal,valid:t.valid});}
 try{
  stops.push(host.commands.register({id:'inspect-selected-profiles',description:'Discover readiness, source sketch planes and the qualified explicit OCC build for experimental selected-region extrusion.',parameters:spec([],{})},args=>{
   copy(args,[]);const t=target('inspectSelectedProfileCommands'),result=t.craft.inspectSelectedProfileCommands();if(!t.valid())throw Error('The window or account changed.');return result;
  }));
  const inspect=['revision','faceId','depth'];
  stops.push(host.commands.register({id:'inspect-selected-regions',description:'Inspect supported source regions through genuine sketch reconstruction and Worker-side discovery. Unsupported topology remains explicit; this does not save or create geometry.',parameters:spec(inspect,{revision:text(256),faceId:text(256),depth})},async args=>{
   const v=copy(args,inspect);if(!bounded(v.revision,256)||!bounded(v.faceId,256)||!positive(v.depth))throw Error('Provide a current source plane and positive bounded millimeter depth.');
   const intent=Object.freeze(v),t=target('inspectSelectedProfileRegions'),scope=scoped(t);return settleScopedCommand(t.craft.inspectSelectedProfileRegions(intent,scope),scope);
  }));
  const create=['revision','faceId','regionId','unit','engine','engineRevision','depth','bodyPolicy'];
  stops.push(host.commands.register({id:'create-selected-extrusion',description:'Create one inspected region as a separate body through the explicit qualified OCC build. No fallback or automatic save is performed. Supported source edits use full replay and may require region reselection; generated-face operations and typed project bindings remain unqualified.',parameters:spec(create,{revision:text(256),faceId:text(256),regionId:{...text(8192),pattern:'^sketch-region:'},unit:{enum:['millimeter']},engine:{enum:['occ']},engineRevision:{type:'string',minLength:136,maxLength:136,pattern:revisionPattern},depth,bodyPolicy:{enum:['separate']}})},async args=>{
   const v=copy(args,create);if(!bounded(v.revision,256)||!bounded(v.faceId,256)||!bounded(v.regionId,8192)||!v.regionId.startsWith('sketch-region:')||v.unit!=='millimeter'||v.engine!=='occ'||typeof v.engineRevision!=='string'||v.engineRevision.length!==136||!revisionRE.test(v.engineRevision)||!positive(v.depth)||v.bodyPolicy!=='separate')throw Error('Provide an inspected separate OCC region, explicit engine revision and positive bounded millimeter depth.');
   // Format validation does not select or substitute an engine build. The
   // core matches this exact opaque revision against its inspected qualified
   // build and remains authoritative for source/region membership/currentness.
   const intent=Object.freeze(v),t=target('createSelectedProfileExtrusion'),scope=scoped(t);return settleScopedCommand(t.craft.createSelectedProfileExtrusion(intent,scope),scope);
  }));
  stops.push(host.commands.register({id:'inspect-selected-profile-history',description:'Inspect selected-region feature identities, numeric depths and the current authored-edit revision. Typed depth bindings remain unsupported.',parameters:spec([],{})},args=>{
   copy(args,[]);const t=target('inspectSelectedProfileHistory'),result=t.craft.inspectSelectedProfileHistory();if(!t.valid())throw Error('The window or account changed.');return result;
  }));
  const edit=['revision','index','featureId','depth'];
  stops.push(host.commands.register({id:'edit-selected-profile-depth',description:'Edit an inspected numeric extrusion depth through the shared atomic history transaction. Use travel-authored-edit for undo/redo and save separately.',parameters:spec(edit,{revision:text(256),index:{type:'integer',minimum:0,maximum:255},featureId:{type:'integer',minimum:1},depth})},async args=>{
   const v=copy(args,edit);if(!bounded(v.revision,256)||!Number.isSafeInteger(v.index)||v.index<0||v.index>255||!Number.isSafeInteger(v.featureId)||v.featureId<1||!positive(v.depth))throw Error('Provide a current selected feature identity and positive bounded numeric depth.');
   const intent=Object.freeze(v),t=target('editSelectedProfileDepth'),scope=scoped(t);return settleScopedCommand(t.craft.editSelectedProfileDepth(intent,scope),scope);
  }));
 }catch(error){for(const stop of stops.reverse())stop();throw error;}
 return()=>{for(const stop of stops.splice(0).reverse())stop();};
}
