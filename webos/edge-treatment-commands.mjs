import {settleScopedCommand} from './scoped-command.mjs';

// Host/window/account boundary only. Craft owns selection, native geometry,
// feature allocation, replay, journal publication and explicit build admission.
export function registerEdgeTreatmentCommands(host,context){
 const stops=[],revisionPattern='^sha256:[a-f0-9]{64}:[a-f0-9]{64}$',revisionRE=new RegExp(revisionPattern);
 const text=maxLength=>({type:'string',minLength:1,maxLength});
 const size={type:'number',exclusiveMinimum:0,maximum:1000000};
 const spec=(keys,properties)=>({type:'object',additionalProperties:false,required:keys.slice(),properties});
 function copy(value,keys){
  const proto=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
  if(!value||typeof value!=='object'||Array.isArray(value)||(proto!==null&&Object.getPrototypeOf(proto)!==null)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))throw Error('Expected exact edge-treatment command fields.');
  const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Edge-treatment command fields must be data.');out[key]=d.value;}return out;
 }
 const bounded=(value,max)=>typeof value==='string'&&value.length>0&&value.length<=max;
 const positive=value=>typeof value==='number'&&Number.isFinite(value)&&value>0&&value<=1e6;
 function edges(value){
  if(!Array.isArray(value)||value.length<1||value.length>16||Reflect.ownKeys(value).length!==value.length+1)throw Error('Provide one to sixteen unique inspected edge IDs.');
  const out=[];for(let i=0;i<value.length;i++){const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||!bounded(d.value,16384)||out.includes(d.value))throw Error('Provide one to sixteen unique inspected edge IDs.');out.push(d.value);}return Object.freeze(out);
 }
 function target(method){
  const captured=context(),session=host.session();
  const valid=()=>{try{return !!session&&!host.signal.aborted&&host.session()===session&&captured.valid()===true}catch{return false}};
  if(!valid()||typeof captured.craft?.[method]!=='function')throw Error('Edge-treatment commands are unavailable in this modeling window.');
  return{craft:captured.craft,valid};
 }
 const scoped=t=>Object.freeze({signal:host.signal,valid:t.valid});
 function inspect(command,method,description){stops.push(host.commands.register({id:command,description,parameters:spec([],{})},args=>{copy(args,[]);const t=target(method),result=t.craft[method]();if(!t.valid())throw Error('The window or account changed.');return result;}));}
 try{
  inspect('inspect-edge-treatments','inspectWorkerEdgeTreatments','Inspect current owned bodies, supported edge treatments, durable selection IDs and the explicit OCC build.');
  const create=['revision','version','unit','engine','engineRevision','bodyId','kind','edgeIds','size'];
  stops.push(host.commands.register({id:'create-edge-treatment',description:'Apply an inspected fillet or equal-distance chamfer through shared owned feature replay. Use inspected selection IDs and save separately.',parameters:spec(create,{revision:text(256),version:{type:'integer',enum:[1]},unit:{enum:['millimeter']},engine:{enum:['occ']},engineRevision:{type:'string',minLength:136,maxLength:136,pattern:revisionPattern},bodyId:text(1024),kind:{enum:['fillet','chamfer-equal']},edgeIds:{type:'array',minItems:1,maxItems:16,uniqueItems:true,items:text(16384)},size})},async args=>{
   const v=copy(args,create);if(!bounded(v.revision,256)||v.version!==1||v.unit!=='millimeter'||v.engine!=='occ'||typeof v.engineRevision!=='string'||v.engineRevision.length!==136||!revisionRE.test(v.engineRevision)||!bounded(v.bodyId,1024)||!['fillet','chamfer-equal'].includes(v.kind)||!positive(v.size))throw Error('Provide a current body, explicit OCC build and positive bounded millimeter edge-treatment size.');
   v.edgeIds=edges(v.edgeIds);const intent=Object.freeze(v),t=target('createWorkerEdgeTreatment'),scope=scoped(t);return settleScopedCommand(t.craft.createWorkerEdgeTreatment(intent,scope),scope);
  }));
  inspect('inspect-edge-treatment-history','inspectWorkerEdgeTreatmentHistory','Inspect numeric edge-treatment feature sizes and the current authored-edit revision. Typed size bindings remain unsupported.');
  const edit=['revision','index','featureId','size'];
  stops.push(host.commands.register({id:'edit-edge-treatment',description:'Edit only an inspected edge-treatment numeric size through shared atomic history replay. Use travel-authored-edit for undo/redo and save separately.',parameters:spec(edit,{revision:text(256),index:{type:'integer',minimum:0,maximum:255},featureId:{type:'integer',minimum:1},size})},async args=>{
   const v=copy(args,edit);if(!bounded(v.revision,256)||!Number.isSafeInteger(v.index)||v.index<0||v.index>255||!Number.isSafeInteger(v.featureId)||v.featureId<1||!positive(v.size))throw Error('Provide a current inspected feature identity and positive bounded numeric treatment size.');
   const intent=Object.freeze(v),t=target('editWorkerEdgeTreatment'),scope=scoped(t);return settleScopedCommand(t.craft.editWorkerEdgeTreatment(intent,scope),scope);
  }));
 }catch(error){for(const stop of stops.reverse())stop();throw error;}
 return()=>{for(const stop of stops.splice(0).reverse())stop();};
}
