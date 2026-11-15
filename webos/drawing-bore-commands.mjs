import {settleScopedCommand} from './scoped-command.mjs';
// Current Native read, no saved topology, borrowed handles or authored flags.
const fail=message=>Object.assign(Error(message),{code:'INVALID_REQUEST'});
function fields(value,keys){
 if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==keys.length)throw fail('Expected exact bore discovery fields.');
 const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw fail('Bore discovery fields must be own data.');out[key]=d.value;}return out;
}
const text=(v,max)=>{if(typeof v!=='string'||!v||v.length>max||/[\u0000-\u001f\u007f]/u.test(v))throw fail('Use bounded current inspected identities.');return v;};
const feature=v=>{if(!Number.isSafeInteger(v)||v<1)throw fail('Use an actual authored feature ID.');return v;};
export function registerDrawingBoreCommands(host,getTarget){
 const str=maxLength=>({type:'string',minLength:1,maxLength}),integer={type:'integer',minimum:1,maximum:Number.MAX_SAFE_INTEGER},record=properties=>({type:'object',additionalProperties:false,required:Object.keys(properties),properties});
 const parameters=record({version:{enum:[1]},unit:{enum:['millimeter']},revision:str(256),geometryRevision:str(256),target:record({featureId:integer,operationType:str(128),engine:{enum:['occ']},engineRevision:{type:'string',pattern:'^sha256:[a-f0-9]{64}:[a-f0-9]{64}$'},output:{enum:['complete-native-result']}}),datum:record({featureId:integer,faceId:str(256),regionId:str(8192)})});
 return host.commands.register({id:'inspect-linked-part-bore-references',description:'Observe current source-bound bore slots, centers, diameters and separately qualified THRU. Facts are revision-specific; unresolved refs never reattach by proximity.',parameters},args=>{
  const r=fields(args,['version','unit','revision','geometryRevision','target','datum']),target=fields(r.target,['featureId','operationType','engine','engineRevision','output']),datum=fields(r.datum,['featureId','faceId','regionId']);
  if(r.version!==1||r.unit!=='millimeter'||target.engine!=='occ'||target.output!=='complete-native-result'||typeof target.engineRevision!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(target.engineRevision))throw fail('Use explicit canonical bore discovery bindings.');
  text(r.revision,256);text(r.geometryRevision,256);feature(target.featureId);text(target.operationType,128);feature(datum.featureId);text(datum.faceId,256);text(datum.regionId,8192);
  const captured=getTarget(),session=host.session(),valid=()=>{try{return !!session&&!host.signal.aborted&&host.session()===session&&captured.valid()===true;}catch{return false;}};
  if(!valid()||typeof captured.craft?.inspectWorkerLinkedPartBores!=='function')throw Error('Native bore discovery is unavailable in this modeling window.');
  const input=Object.freeze({revision:r.revision,geometryRevision:r.geometryRevision,query:Object.freeze({version:1,unit:'millimeter',target:Object.freeze(target),datum:Object.freeze(datum)})});
  return settleScopedCommand(captured.craft.inspectWorkerLinkedPartBores(input,{signal:host.signal,valid}),{signal:host.signal,valid});
 });
}
