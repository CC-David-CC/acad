import {settleScopedCommand} from './scoped-command.mjs';

// Transport only. Craft owns genuine source solving, region/path membership,
// explicit build admission, geometry, feature allocation and shared history.
export function registerSweepCommands(host,getTarget){
 const stops=[],buildPattern='^sha256:[a-f0-9]{64}:[a-f0-9]{64}$',buildRE=new RegExp(buildPattern);
 const text=maxLength=>({type:'string',minLength:1,maxLength});
 const bounded=(value,max)=>typeof value==='string'&&value.length>0&&value.length<=max;
 const schema=(keys,properties)=>({type:'object',additionalProperties:false,required:keys.slice(),properties});
 function copy(value,keys){
  const proto=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
  if(!value||typeof value!=='object'||Array.isArray(value)||(proto!==null&&Object.getPrototypeOf(proto)!==null)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))throw Error('Expected exact sweep command fields.');
  const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Sweep command fields must be own data.');out[key]=d.value;}return out;
 }
 function pathRefs(value){
  if(!Array.isArray(value)||value.length<1||value.length>128||Reflect.ownKeys(value).length!==value.length+1)throw Error('Provide one to128 dense unique source path references.');
  const refs=[],seen=new Set();for(let i=0;i<value.length;i++){const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Path references must be dense own data.');const ref=copy(d.value,['curveId','reversed']);if(!bounded(ref.curveId,256)||typeof ref.reversed!=='boolean'||seen.has(ref.curveId))throw Error('Path references need unique bounded source IDs and explicit direction.');seen.add(ref.curveId);refs.push(Object.freeze(ref));}return Object.freeze(refs);
 }
 const sourceKeys=['revision','faceId','pathFaceId','engineRevision'];
 const sourceProperties={revision:text(256),faceId:text(256),pathFaceId:text(256),engineRevision:{type:'string',minLength:136,maxLength:136,pattern:buildPattern}};
 const source=value=>bounded(value.revision,256)&&bounded(value.faceId,256)&&bounded(value.pathFaceId,256)&&value.faceId!==value.pathFaceId&&typeof value.engineRevision==='string'&&value.engineRevision.length===136&&buildRE.test(value.engineRevision);
 function target(method){
  const captured=getTarget(),session=host.session();
  const valid=()=>{try{return !!session&&!host.signal.aborted&&host.session()===session&&captured.valid()===true;}catch{return false;}};
  if(!valid()||typeof captured.craft?.[method]!=='function')throw Error('Sweep commands are unavailable in this modeling window.');
  return{craft:captured.craft,valid};
 }
 const scope=t=>Object.freeze({signal:host.signal,valid:t.valid});
 function inspect(id,method,description){stops.push(host.commands.register({id,description,parameters:schema([],{})},args=>{copy(args,[]);const t=target(method),result=t.craft[method]();if(!t.valid())throw Error('The window or account changed.');return result;}));}
 try{
  inspect('inspect-worker-sweeps','inspectWorkerSweeps','Discover source planes, actual path candidates and explicit experimental sweep builds. Readiness does not certify geometry.');
  stops.push(host.commands.register({id:'inspect-worker-sweep-regions',description:'Discover supported regions and directed path references through real source and semantic Workers. Source planes must be distinct.',parameters:schema(sourceKeys,sourceProperties)},async args=>{
   const input=copy(args,sourceKeys);if(!source(input))throw Error('Provide the inspected revision, distinct source/path faces and exact backend revision.');
   const intent=Object.freeze(input),t=target('inspectWorkerSweepRegions'),s=scope(t);return settleScopedCommand(t.craft.inspectWorkerSweepRegions(intent,s),s);
  }));
  const keys=['revision','version','unit','engine','engineRevision','faceId','regionId','pathFaceId','pathCurves','transport','bodyPolicy'];
  stops.push(host.commands.register({id:'create-worker-sweep',description:'Sweep one inspected region along its ordered directed source path using the explicit build and corrected-Frenet transport. Create a separate body and save separately.',parameters:schema(keys,{...sourceProperties,version:{type:'integer',enum:[1]},unit:{enum:['millimeter']},engine:{enum:['occ']},regionId:text(8192),pathCurves:{type:'array',minItems:1,maxItems:128,uniqueItems:true,items:schema(['curveId','reversed'],{curveId:text(256),reversed:{type:'boolean'}})},transport:{enum:['corrected-frenet']},bodyPolicy:{enum:['separate']}})},async args=>{
   const input=copy(args,keys);if(!source(input)||input.version!==1||input.unit!=='millimeter'||input.engine!=='occ'||!bounded(input.regionId,8192)||input.transport!=='corrected-frenet'||input.bodyPolicy!=='separate')throw Error('Provide exact inspected source intent, millimeter units, explicit OCC build and separate-body corrected-Frenet transport.');
   input.pathCurves=pathRefs(input.pathCurves);const intent=Object.freeze(input),t=target('createWorkerSweep'),s=scope(t);return settleScopedCommand(t.craft.createWorkerSweep(intent,s),s);
  }));
  inspect('inspect-worker-sweep-history','inspectWorkerSweepHistory','Inspect saved sweep source/path intent and history readiness. Geometry and replay qualification remain with Craft.');
 }catch(error){for(const stop of stops.reverse())stop();throw error;}
 return()=>{for(const stop of stops.splice(0).reverse())stop();};
}
