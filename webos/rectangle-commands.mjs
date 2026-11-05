// Both desktop commands and the visible dialog use this same guarded core API.
export function createRectangleController(host,getTarget){
 function target(){
  const captured=getTarget(),session=host.session();
  const valid=()=>!!session&&!host.signal.aborted&&host.session()===session&&captured.valid();
  if(!valid()||typeof captured.craft?.inspectRectangleCreation!=='function'||typeof captured.craft?.createRectangleSketch!=='function')throw Error('Dimensioned rectangle is unavailable in this version of jSketcher.');
  return {craft:captured.craft,valid};
 }
 function inspect(){const t=target(),result=t.craft.inspectRectangleCreation();if(!t.valid())throw Error('The window or account changed.');return result;}
 function inspectDimensions(provided){const t=provided||target();if(!t.valid()||typeof t.craft.inspectRectangleDimensions!=='function'||typeof t.craft.editRectangleDimensions!=='function')throw Error('Rectangle dimension editing is unavailable in this version of jSketcher.');const result=t.craft.inspectRectangleDimensions();if(!t.valid())throw Error('The window or account changed.');return result;}
 async function edit(args,provided,signal=host.signal){const t=provided||target();inspectDimensions(t);if(!t.valid())throw Error('The window or account changed.');return await t.craft.editRectangleDimensions(args,{signal,valid:t.valid});}
 async function create(args,provided,signal=host.signal){
  const t=provided||target();if(!t.valid())throw Error('The window or account changed.');
  return await t.craft.createRectangleSketch(args,{signal,valid:t.valid});
 }
 function register(){
  const registrations=[];
  const exact=(v,keys)=>{if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).sort().join(',')!==keys.slice().sort().join(','))throw Error('Invalid rectangle command arguments.');};
  try{
   registrations.push(host.commands.register({id:'inspect-rectangle-creation',description:'Inspect whether an XY dimensioned rectangle can be created and obtain its current revision.',parameters:{type:'object',additionalProperties:false}},args=>{exact(args,[]);return inspect();}));
   registrations.push(host.commands.register({id:'inspect-rectangle-dimensions',description:'List supported authored rectangles and obtain the current geometry revision.',parameters:{type:'object',additionalProperties:false}},args=>{exact(args,[]);return inspectDimensions();}));
   registrations.push(host.commands.register({id:'edit-rectangle-dimensions',description:'Edit a supported rectangle width and height using an inspected revision. Save separately to keep the result.',parameters:{type:'object',required:['revision','faceId','width','height'],additionalProperties:false,properties:{revision:{type:'string',maxLength:256},faceId:{type:'string',maxLength:1024},width:{type:'number',minimum:0.001,maximum:1000000},height:{type:'number',minimum:0.001,maximum:1000000}}}},args=>{exact(args,['revision','faceId','width','height']);return edit(args);}));
   registrations.push(host.commands.register({id:'create-rectangle-sketch',description:'Create a dimensioned XY rectangle using an inspected revision. The result remains in the workspace until saved to My files.',parameters:{type:'object',required:['revision','unit','origin','width','height','depth'],additionalProperties:false,properties:{revision:{type:'string',maxLength:256},unit:{enum:['millimeter']},origin:{type:'array',minItems:2,maxItems:2,items:{type:'number'}},width:{type:'number',minimum:0.001,maximum:1000000},height:{type:'number',minimum:0.001,maximum:1000000},depth:{type:'number',minimum:-100000000,maximum:100000000}}}},args=>{exact(args,['revision','unit','origin','width','height','depth']);return create(args);}));
  }catch(e){for(const stop of registrations.reverse())stop();throw e;}
  return ()=>{for(const stop of registrations.splice(0).reverse())stop();};
 }
 return {target,inspect,inspectDimensions,create,edit,register};
}
