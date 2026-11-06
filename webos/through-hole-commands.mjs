import {settleScopedCommand} from './scoped-command.mjs';

// Host/window/account admission only. Craft owns source/target relationships,
// native through extent, feature IDs, full replay and journal publication.
export function registerThroughHoleCommands(host,context){
 const stops=[],revisionPattern='^sha256:[a-f0-9]{64}:[a-f0-9]{64}$',revisionRE=new RegExp(revisionPattern);
 const text=maxLength=>({type:'string',minLength:1,maxLength}),positiveSchema={type:'number',exclusiveMinimum:0,maximum:1000000};
 const featureSchema={type:'integer',minimum:1,maximum:Number.MAX_SAFE_INTEGER};
 const spec=(keys,properties)=>({type:'object',additionalProperties:false,required:keys.slice(),properties});
 function copy(value,common,corner=common){
  const proto=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
  if(!value||typeof value!=='object'||Array.isArray(value)||(proto!==null&&Object.getPrototypeOf(proto)!==null))throw Error('Expected exact through-hole command fields.');
  const own=Reflect.ownKeys(value),keys=own.length===common.length?common:own.length===corner.length?corner:null;
  if(!keys||own.some(k=>typeof k!=='string'||!keys.includes(k)))throw Error('Expected exact through-hole command fields.');
  const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Through-hole command fields must be data.');out[key]=d.value;}return out;
 }
 const bounded=(v,max)=>typeof v==='string'&&v.length>0&&v.length<=max,positive=v=>typeof v==='number'&&Number.isFinite(v)&&v>0&&v<=1e6,feature=v=>Number.isSafeInteger(v)&&v>0;
 function target(method){const captured=context(),session=host.session(),valid=()=>{try{return !!session&&!host.signal.aborted&&host.session()===session&&captured.valid()===true}catch{return false}};if(!valid()||typeof captured.craft?.[method]!=='function')throw Error('Through-hole commands are unavailable in this modeling window.');return{craft:captured.craft,valid};}
 const scoped=t=>Object.freeze({signal:host.signal,valid:t.valid});
 function inspect(command,method,description){stops.push(host.commands.register({id:command,description,parameters:spec([],{})},args=>{copy(args,[]);const t=target(method),result=t.craft[method]();if(!t.valid())throw Error('The window or account changed.');return result;}));}
 try{
  inspect('inspect-through-holes','inspectWorkerThroughHoles','Inspect supported rectangular source features, current owned targets and explicit OCC through-hole capabilities.');
  const create=['revision','version','unit','engine','engineRevision','bodyId','sourceFeatureId','kind','diameter'],createCorner=[...create,'offsetX','offsetY'];
  stops.push(host.commands.register({id:'create-through-hole',description:'Create an inspected centered or four-corner through-hole feature from its rectangular source through shared owned replay; save separately.',parameters:spec(create,{revision:text(256),version:{type:'integer',enum:[1]},unit:{enum:['millimeter']},engine:{enum:['occ']},engineRevision:{type:'string',minLength:136,maxLength:136,pattern:revisionPattern},bodyId:text(1024),sourceFeatureId:featureSchema,kind:{enum:['centered-through','four-corner-through']},diameter:positiveSchema,offsetX:positiveSchema,offsetY:positiveSchema})},async args=>{
   const v=copy(args,create,createCorner),corner=v.kind==='four-corner-through';
   if(!bounded(v.revision,256)||v.version!==1||v.unit!=='millimeter'||v.engine!=='occ'||typeof v.engineRevision!=='string'||v.engineRevision.length!==136||!revisionRE.test(v.engineRevision)||!bounded(v.bodyId,1024)||!feature(v.sourceFeatureId)||!['centered-through','four-corner-through'].includes(v.kind)||!positive(v.diameter)||(corner?Object.keys(v).length!==createCorner.length||!positive(v.offsetX)||!positive(v.offsetY):Object.keys(v).length!==create.length))throw Error('Provide a current target, inspected source, explicit OCC build and positive numeric hole dimensions.');
   const intent=Object.freeze(v),t=target('createWorkerThroughHole'),scope=scoped(t);return settleScopedCommand(t.craft.createWorkerThroughHole(intent,scope),scope);
  }));
  inspect('inspect-through-hole-history','inspectWorkerThroughHoleHistory','Inspect numeric through-hole diameter/offset features and the current authored-edit revision.');
  const edit=['revision','index','featureId','diameter'],editCorner=[...edit,'offsetX','offsetY'];
  stops.push(host.commands.register({id:'edit-through-hole',description:'Edit only an inspected through-hole diameter and both corner offsets when applicable through shared atomic replay. Use travel-authored-edit for edit undo/redo; save separately.',parameters:spec(edit,{revision:text(256),index:{type:'integer',minimum:0,maximum:255},featureId:featureSchema,diameter:positiveSchema,offsetX:positiveSchema,offsetY:positiveSchema})},async args=>{
   const v=copy(args,edit,editCorner),corner=Object.keys(v).length===editCorner.length;
   if(!bounded(v.revision,256)||!Number.isSafeInteger(v.index)||v.index<0||v.index>255||!feature(v.featureId)||!positive(v.diameter)||corner&&(!positive(v.offsetX)||!positive(v.offsetY)))throw Error('Provide a current inspected feature and positive numeric diameter/offsets.');
   // Current feature kind is authoritative in Craft; the bridge never guesses
   // it from an ID or adds source/kind changes to an edit request.
   const intent=Object.freeze(v),t=target('editWorkerThroughHole'),scope=scoped(t);return settleScopedCommand(t.craft.editWorkerThroughHole(intent,scope),scope);
  }));
 }catch(error){for(const stop of stops.reverse())stop();throw error;}
 return()=>{for(const stop of stops.splice(0).reverse())stop();};
}
