import {settleScopedCommand} from './scoped-command.mjs';
import {captureDrawingCommandData} from './drawing-commands.mjs';

// Metadata only: the same protected Worker owns Native membership, reference
// facts and preservation. This adapter has no geometry arrays or proof flags.
const fail=message=>Object.assign(Error(message),{code:'INVALID_REQUEST'});
function fields(value,keys){
 if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==keys.length)throw fail('Expected exact drawing requirement command fields.');
 const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw fail('Drawing requirement fields must be own data.');out[key]=d.value;}return out;
}
const text=(v,max)=>{if(typeof v!=='string'||!v||v.length>max||/[\u0000-\u001f\u007f]/u.test(v))throw fail('Use bounded current inspected drawing identities.');return v;};
const feature=v=>{if(!Number.isSafeInteger(v)||v<1)throw fail('Use an actual inspected authored feature ID.');return v;};
export function registerDrawingRequirementCommands(host,getTarget){
 const stops=[],str=maxLength=>({type:'string',minLength:1,maxLength}),integer={type:'integer',minimum:1,maximum:Number.MAX_SAFE_INTEGER},record=properties=>({type:'object',additionalProperties:false,required:Object.keys(properties),properties});
 function target(method){
  const captured=getTarget(),session=host.session(),craft=captured.craft;
  const valid=()=>{try{return !!session&&!host.signal.aborted&&host.session()===session&&captured.valid()===true;}catch{return false;}};
  if(!valid()||typeof craft?.[method]!=='function')throw Error('Protected drawing requirement reads are unavailable in this modeling window.');
  return{craft,valid};
 }
 try{
  const parameters=record({version:{enum:[1]},unit:{enum:['millimeter']},revision:str(256),geometryRevision:str(256),target:record({featureId:integer,operationType:str(128),engine:{enum:['occ']},engineRevision:{type:'string',pattern:'^sha256:[a-f0-9]{64}:[a-f0-9]{64}$'},output:{enum:['complete-native-result']}}),datum:record({featureId:integer,faceId:str(256),regionId:str(8192)})});
  stops.push(host.commands.register({id:'inspect-worker-drawing-requirement-targets',description:'Discover actual current plane and bore references through protected Native replay. Results are geometry bindings, not manufactured conformance. Use the inspected document and geometry revisions.',parameters},args=>{
   const r=fields(captureDrawingCommandData(args),['version','unit','revision','geometryRevision','target','datum']),t=fields(r.target,['featureId','operationType','engine','engineRevision','output']),d=fields(r.datum,['featureId','faceId','regionId']);
   if(r.version!==1||r.unit!=='millimeter'||t.engine!=='occ'||t.output!=='complete-native-result'||typeof t.engineRevision!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(t.engineRevision))throw fail('Use canonical current requirement discovery bindings.');
   text(r.revision,256);text(r.geometryRevision,256);feature(t.featureId);text(t.operationType,128);feature(d.featureId);text(d.faceId,256);text(d.regionId,8192);
   const owner=target('inspectWorkerDrawingRequirementTargets'),query=Object.freeze({version:1,unit:'millimeter',target:Object.freeze(t),datum:Object.freeze(d)}),input=Object.freeze({revision:r.revision,geometryRevision:r.geometryRevision,query}),scope={signal:host.signal,valid:owner.valid};
   return settleScopedCommand(owner.craft.inspectWorkerDrawingRequirementTargets(input,scope),scope);
  }));
  stops.push(host.commands.register({id:'read-linked-part-drawing-requirements',description:'Read the accepted v4 datum and manufacturing requirement bindings through the shared protected Worker resolver. Authored requirements remain distinct from manufactured conformance. Returns metadata facts, without projection buffers.',parameters:record({revision:str(256),geometryRevision:str(256),definition:{type:'object'}})},args=>{
   const r=fields(captureDrawingCommandData(args),['revision','geometryRevision','definition']);text(r.revision,256);text(r.geometryRevision,256);
   const owner=target('readWorkerLinkedPartDrawingRequirements'),input=Object.freeze(r),scope={signal:host.signal,valid:owner.valid};
   return settleScopedCommand(owner.craft.readWorkerLinkedPartDrawingRequirements(input,scope),scope);
  }));
 }catch(error){for(const stop of stops.reverse())stop();throw error;}
 return()=>{for(const stop of stops.splice(0).reverse())stop();};
}
