import {settleScopedCommand} from './scoped-command.mjs';
// Public data-only commands; the craft coordinator owns IDs and publication.
export function registerPrimitiveCommands(host,getTarget){
 const stops=[],id=maxLength=>({type:'string',minLength:1,maxLength}),coordinate={type:'number',minimum:-100000000,maximum:100000000};
 const point={type:'object',additionalProperties:false,required:['x','y'],properties:{x:coordinate,y:coordinate}};
 const spec=(keys,properties)=>({type:'object',additionalProperties:false,required:keys,properties});
 function record(value,keys){if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))throw Error('Invalid sketch primitive command.');const out={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(value,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Invalid sketch primitive command.');out[k]=d.value;}return out;}
 const bounded=(n,max)=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=max;
 function copyPoint(value){const p=record(value,['x','y']);if(!bounded(p.x,1e8)||!bounded(p.y,1e8))throw Error('Invalid sketch coordinate.');return Object.freeze(p);}
 function target(method){const captured=getTarget(),session=host.session();const valid=()=>{try{return !!session&&!host.signal.aborted&&host.session()===session&&captured.valid()===true}catch{return false}};if(!valid()||typeof captured.craft?.[method]!=='function')throw Error('This sketch creation command is unavailable in this modeling window.');return {craft:captured.craft,valid};}
 function checkId(value,max){return typeof value==='string'&&value.length>0&&value.length<=max;}
 try{
  stops.push(host.commands.register({id:'inspect-sketch-creation',description:'Discover supported empty sketch planes and the current revision.',parameters:{type:'object',additionalProperties:false}},args=>{record(args,[]);const t=target('inspectPrimitiveCreation'),result=t.craft.inspectPrimitiveCreation();if(!t.valid())throw Error('The window or account changed.');return result;}));
  const planeFields=['revision','unit','plane','depth'];
  stops.push(host.commands.register({id:'create-empty-sketch-plane',description:'Create an empty authored sketch plane; save separately.',parameters:spec(planeFields,{revision:id(256),unit:{enum:['millimeter']},plane:{enum:['XY','XZ','ZY']},depth:coordinate})},async args=>{const v=record(args,planeFields);if(!checkId(v.revision,256)||v.unit!=='millimeter'||!['XY','XZ','ZY'].includes(v.plane)||!bounded(v.depth,1e8))throw Error('Invalid sketch plane.');const t=target('createEmptySketchPlane');return settleScopedCommand(t.craft.createEmptySketchPlane(Object.freeze(v),{signal:host.signal,valid:t.valid}),{signal:host.signal,valid:t.valid});}));
  const fields=['revision','faceId','kind','role','stage','data'];
  const dataSchema={oneOf:[point,spec(['a','b'],{a:point,b:point}),spec(['c','r'],{c:point,r:{type:'number',exclusiveMinimum:0,maximum:100000000}}),spec(['a','b','c'],{a:point,b:point,c:point})]};
  stops.push(host.commands.register({id:'append-sketch-primitive',description:'Append one Point, Segment, Circle or Arc to an inspected closed sketch. IDs are assigned by CAD; save separately.',parameters:spec(fields,{revision:id(256),faceId:id(1024),kind:{enum:['Point','Segment','Circle','Arc']},role:{enum:[null,'construction']},stage:{type:'integer',minimum:0,maximum:31},data:dataSchema})},async args=>{
   const v=record(args,fields);if(!checkId(v.revision,256)||!checkId(v.faceId,1024)||!['Point','Segment','Circle','Arc'].includes(v.kind)||![null,'construction'].includes(v.role)||!Number.isSafeInteger(v.stage)||v.stage<0||v.stage>31)throw Error('Invalid sketch primitive command.');
   if(v.kind==='Point')v.data=copyPoint(v.data);
   else if(v.kind==='Segment'){const d=record(v.data,['a','b']);v.data=Object.freeze({a:copyPoint(d.a),b:copyPoint(d.b)});}
   else if(v.kind==='Circle'){const d=record(v.data,['c','r']);if(!bounded(d.r,1e8)||d.r<=0)throw Error('Invalid circle radius.');v.data=Object.freeze({c:copyPoint(d.c),r:d.r});}
   else {const d=record(v.data,['a','b','c']);v.data=Object.freeze({a:copyPoint(d.a),b:copyPoint(d.b),c:copyPoint(d.c)});}
   const t=target('appendClosedSketchPrimitive');return settleScopedCommand(t.craft.appendClosedSketchPrimitive(Object.freeze(v),{signal:host.signal,valid:t.valid}),{signal:host.signal,valid:t.valid});
  }));
 }catch(error){for(const stop of stops.reverse())stop();throw error;}
 return ()=>{for(const stop of stops.splice(0).reverse())stop();};
}
