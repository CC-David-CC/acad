import {settleScopedCommand} from './scoped-command.mjs';
// Transport only. Point discovery, genuine PCoincident admission, two original
// request reconstructions, full history and publication stay in shared Core.
export function registerCoincidenceCommands(host,getTarget){
 const keys=['revision','faceId','ids'],text=maxLength=>({type:'string',minLength:1,maxLength}),nativeAborted=Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get;
 const fail=message=>Object.assign(Error(message),{code:'COINCIDENCE_TARGET'});
 const stop=host.commands.register({id:'apply-closed-sketch-coincidence',description:'Relate two inspected nongenerated authored points with genuine PCoincident equations. Existing unordered pair is a no-op; point identities remain distinct. Shared source journal and full replay; save separately.',parameters:{type:'object',additionalProperties:false,required:keys.slice(),properties:{revision:text(256),faceId:text(1024),ids:{type:'array',minItems:2,maxItems:2,items:text(256)}}}},args=>{
  const p=args&&typeof args==='object'?Object.getPrototypeOf(args):undefined;if(!args||typeof args!=='object'||Array.isArray(args)||(p!==null&&Object.getPrototypeOf(p)!==null)||Reflect.ownKeys(args).length!==keys.length)throw fail('Expected exact coincidence fields.');
  const a={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(args,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw fail('Coincidence fields must be own data.');a[key]=d.value;}
  if(![a.revision,a.faceId].every((v,i)=>typeof v==='string'&&v.length>0&&v.length<=[256,1024][i])||!Array.isArray(a.ids)||a.ids.length!==2||Reflect.ownKeys(a.ids).length!==3)throw fail('Use a current source revision and exactly two point IDs.');
  a.ids=Object.freeze([0,1].map(i=>{const d=Object.getOwnPropertyDescriptor(a.ids,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='string'||!d.value||d.value.length>256)throw fail('Point IDs must be bounded own data.');return d.value;}));if(a.ids[0]===a.ids[1])throw fail('Choose two distinct inspected point identities.');
  const t=getTarget(),craft=t.craft,method=craft?.applyClosedSketchCoincidence,session=host.session(),signal=host.signal,commands=host.commands,token=commands?.documentToken?.();
  const owner=()=>host.signal===signal&&!nativeAborted.call(signal)&&host.session()===session&&host.commands===commands&&commands.documentToken()===token&&t.craft===craft&&craft?.applyClosedSketchCoincidence===method;
  const valid=()=>{try{return !!session&&typeof token==='string'&&token.length>0&&token.length<=256&&owner()&&t.valid()===true&&owner();}catch{return false;}};
  if(typeof method!=='function'||!valid())throw Error('Coincidence requires the current bound CAD document.');const scope=Object.freeze({signal,valid});return settleScopedCommand(method.call(craft,Object.freeze(a),scope),scope);
 });let disposed=false;return()=>{if(!disposed){disposed=true;stop();}};
}
