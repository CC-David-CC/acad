import {settleScopedCommand} from './scoped-command.mjs';

// Uses the same assignment review and authorized export as the UI. This
// adapter never edits metadata, geometry, history or files itself.
export function registerManufacturingCommands(host,{getTarget,inspect,exportModel}){
 const stops=[];
 const text=maxLength=>({type:'string',minLength:1,maxLength});
 function fields(input,keys){
  if(!input||typeof input!=='object'||Array.isArray(input)||Reflect.ownKeys(input).length!==keys.length)throw Error('Invalid manufacturing command fields.');
  const copy={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(input,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Manufacturing arguments must be data properties.');copy[key]=d.value;}
  return copy;
 }
 function bounded(value,max){if(typeof value!=='string'||!value.trim()||value.length>max)throw Error('Invalid manufacturing text.');return value;}
 function target(method){
  const captured=getTarget(),session=host.session();
  const valid=()=>!!session&&!host.signal.aborted&&host.session()===session&&captured.valid();
  if(!valid()||typeof captured.manager?.[method]!=='function')throw Error('Manufacturing is unavailable in this window.');
  return {manager:captured.manager,valid};
 }
 try{
  stops.push(host.commands.register({id:'inspect-manufacturing',description:'Inspect material metadata and the document revision. This does not validate manufacturing geometry.',parameters:{type:'object',additionalProperties:false}},args=>{
   fields(args,[]);const t=target('getManufacturingMetadata'),document=inspect(),metadata=t.manager.getManufacturingMetadata();
   if(!t.valid())throw Error('The window or account changed.');
   return {revision:document.revision,metadata,note:'Core model 3MF export is limited to supported, current, assigned geometry.'};
  }));
  stops.push(host.commands.register({id:'propose-material-rebind',description:'Inspect a revision-bound proposal to preserve material assignments after regeneration. Confirm its token explicitly; this is not geometry or manufacturing validation.',parameters:{type:'object',additionalProperties:false,required:['revision'],properties:{revision:text(256)}}},async args=>{
   const captured=fields(args,['revision']);bounded(captured.revision,256);const t=target('proposeHostManufacturingRebind');
   if(inspect().revision!==captured.revision)throw Error('The document changed; inspect it again.');
   return await settleScopedCommand(t.manager.proposeHostManufacturingRebind({signal:host.signal,valid:t.valid}),{signal:host.signal,valid:t.valid});
  }));
  stops.push(host.commands.register({id:'confirm-material-rebind',description:'Accept an inspected material-rebind token through the same transaction as the UI. The core refuses changed or ambiguous references. Save separately.',parameters:{type:'object',additionalProperties:false,required:['token'],properties:{token:text(256)}}},args=>{
   const captured=fields(args,['token']);bounded(captured.token,256);const t=target('confirmHostManufacturingRebind');
   t.manager.confirmHostManufacturingRebind(captured.token);
   if(!t.valid())throw Object.assign(Error('Accepted assignments were superseded; inspect the document before retrying.'),{committed:true});
   return {status:'accepted',saved:false,revision:inspect().revision};
  }));
  stops.push(host.commands.register({id:'export-core-3mf',description:'Export the inspected supported model to a new My files .3mf path. Uses the same exporter and authorized write as the UI; server synchronization is reported separately.',parameters:{type:'object',additionalProperties:false,required:['revision','path'],properties:{revision:text(256),path:text(1024)}}},async args=>{
   const captured=fields(args,['revision','path']);bounded(captured.revision,256);bounded(captured.path,1024);
   if(!/\.3mf$/i.test(captured.path))throw Error('Use a .3mf filename.');
   const session=host.session(),valid=()=>!!session&&!host.signal.aborted&&host.session()===session;
   if(!valid())throw Error('The window or account changed.');
   if(inspect().revision!==captured.revision)throw Error('The document changed; inspect it again.');
   const result=await settleScopedCommand(exportModel(Object.freeze(captured)),{signal:host.signal,valid});
   if(!valid()||!result)throw Error('The export outcome is unavailable; inspect My files before retrying.');
   return result;
  }));
 }catch(error){for(const stop of stops.reverse())stop();throw error;}
 return ()=>{for(const stop of stops.splice(0).reverse())stop();};
}
