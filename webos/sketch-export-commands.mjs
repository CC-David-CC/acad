import {settleScopedCommand} from './scoped-command.mjs';

// The host export function owns file claims, version checks and the actual
// write; this adapter never receives geometry bytes or account credentials.
export function registerSketchExportCommands(host,{getTarget,exportDxf}) {
 const stops=[];
 const text=maxLength=>({type:'string',minLength:1,maxLength});
 function fields(value,keys){
  if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==keys.length)throw Error('Invalid sketch export fields.');
  const copy={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Sketch export fields must be data.');copy[key]=d.value;}return copy;
 }
 function bounded(value,max){if(typeof value!=='string'||!value.trim()||value.length>max)throw Error('Invalid sketch export target.');return value;}
 try{
  stops.push(host.commands.register({id:'inspect-sketch-dxf-exports',description:'Inspect revision-bound saved sketches available for sketch-local DXF export.',parameters:{type:'object',additionalProperties:false}},args=>{
   fields(args,[]);const target=getTarget(),session=host.session(),valid=()=>!!session&&!host.signal.aborted&&host.session()===session&&target.valid();
   if(!valid()||typeof target.craft?.inspectSketchDXFExports!=='function')throw Error('Sketch DXF export is unavailable in this window.');
   const result=target.craft.inspectSketchDXFExports();if(!valid())throw Error('The window or account changed.');return result;
  }));
  stops.push(host.commands.register({id:'export-sketch-dxf',description:'Export an inspected saved sketch in sketch-local millimeters to a new My files .dxf path.',parameters:{type:'object',additionalProperties:false,required:['revision','faceId','path'],properties:{revision:text(256),faceId:text(1024),path:text(1024)}}},async args=>{
   const captured=fields(args,['revision','faceId','path']);bounded(captured.revision,256);bounded(captured.faceId,1024);bounded(captured.path,1024);
   if(!/\.dxf$/i.test(captured.path))throw Error('Use a .dxf filename.');
   const session=host.session(),valid=()=>!!session&&!host.signal.aborted&&host.session()===session;
   if(!valid())throw Error('The window or account changed.');
   const result=await settleScopedCommand(exportDxf(Object.freeze(captured)),{signal:host.signal,valid});
   if(!valid()||!result)throw Error('The export outcome is unavailable; inspect My files before retrying.');return result;
  }));
 }catch(error){for(const stop of stops.reverse())stop();throw error;}
 return ()=>{for(const stop of stops.splice(0).reverse())stop();};
}
