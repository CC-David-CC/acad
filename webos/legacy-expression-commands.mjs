import {settleScopedCommand} from './scoped-command.mjs';

// The existing craft transaction owns validation, model replay and history.
// This adapter adds the same account/window lifetime used by the other commands.
export function registerLegacyExpressionCommands(host,getTarget){
 const stops=[];
 function fields(input,keys){
  if(!input||typeof input!=='object'||Array.isArray(input)||Reflect.ownKeys(input).length!==keys.length||Reflect.ownKeys(input).some(key=>typeof key!=='string'||!keys.includes(key)))throw Error('Invalid numeric expression arguments.');
  const copy={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(input,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Numeric expression fields must be data.');copy[key]=d.value;}return copy;
 }
 function target(method){
  const captured=getTarget(),session=host.session();
  const valid=()=>{try{return !!session&&!host.signal.aborted&&host.session()===session&&captured.valid()===true}catch{return false}};
  if(!valid()||typeof captured.craft?.[method]!=='function')throw Error('Numeric expression editing is unavailable in this modeling window.');
  return {craft:captured.craft,valid};
 }
 try{
  stops.push(host.commands.register({id:'inspect-numeric-expressions',description:'Inspect the accepted numeric expression script and its current authored revision.',parameters:{type:'object',additionalProperties:false}},args=>{
   fields(args,[]);const t=target('inspectLegacyExpressions'),result=t.craft.inspectLegacyExpressions();if(!t.valid())throw Error('The window or account changed.');return result;
  }));
  stops.push(host.commands.register({id:'apply-numeric-expressions',description:'Apply a numeric expression script through validated Worker replay and authored undo. Save separately.',parameters:{type:'object',additionalProperties:false,required:['revision','source'],properties:{revision:{type:'string',minLength:1,maxLength:256},source:{type:'string',maxLength:65536}}}},async args=>{
   const copy=fields(args,['revision','source']);
   if(typeof copy.revision!=='string'||!copy.revision||copy.revision.length>256||typeof copy.source!=='string'||copy.source.length>65536||new TextEncoder().encode(copy.source).byteLength>65536)throw Error('Provide a current revision and a numeric script within 64 KiB.');
   const t=target('applyLegacyExpressions');return settleScopedCommand(t.craft.applyLegacyExpressions(Object.freeze(copy),{signal:host.signal,valid:t.valid}),{signal:host.signal,valid:t.valid});
  }));
 }catch(error){for(const stop of stops.reverse())stop();throw error;}
 return ()=>{for(const stop of stops.splice(0).reverse())stop();};
}
