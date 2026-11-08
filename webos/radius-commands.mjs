import {settleScopedCommand} from './scoped-command.mjs';
// Transport only. Actual Circle/Arc ownership, original-request Worker proof,
// full replay and the existing source journal remain in the shared Core.
export function registerRadiusCommands(host,getTarget){
 const keys=['revision','faceId','id','radius'],text=maxLength=>({type:'string',minLength:1,maxLength}),nativeAborted=Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get;
 const stop=host.commands.register({id:'apply-closed-sketch-radius',description:'Create a genuine numeric RadiusLength on one inspected Circle or Arc. Canonical millimeters; shared source/history UndoRedo; save separately. Typed/formula creation is explicitly unsupported.',parameters:{type:'object',additionalProperties:false,required:keys.slice(),properties:{revision:text(256),faceId:text(1024),id:text(256),radius:{type:'number',exclusiveMinimum:0,maximum:1000000}}}},args=>{
  const p=args&&typeof args==='object'?Object.getPrototypeOf(args):undefined;
  if(!args||typeof args!=='object'||Array.isArray(args)||(p!==null&&Object.getPrototypeOf(p)!==null)||Reflect.ownKeys(args).length!==keys.length)throw Error('Expected exact radius fields.');
  const a={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(args,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Radius fields must be own data.');a[key]=d.value;}
  if(![a.revision,a.faceId,a.id].every((v,i)=>typeof v==='string'&&v.length>0&&v.length<=[256,1024,256][i])||typeof a.radius!=='number'||!Number.isFinite(a.radius)||a.radius<=0||a.radius>1e6)throw Error('Use a current Circle or Arc and positive numeric radius at most1,000,000mm.');
  const t=getTarget(),session=host.session(),signal=host.signal,commands=host.commands,token=commands?.documentToken?.(),craft=t.craft,method=craft?.applyClosedSketchRadius;
  const owner=()=>host.signal===signal&&!nativeAborted.call(signal)&&host.session()===session&&host.commands===commands&&commands.documentToken()===token&&t.craft===craft&&craft?.applyClosedSketchRadius===method;
  const valid=()=>{try{return !!session&&typeof token==='string'&&token.length>0&&token.length<=256&&owner()&&t.valid()===true&&owner();}catch{return false;}};
  if(typeof method!=='function'||!valid())throw Error('Radius creation requires the current bound CAD document.');
  const scope=Object.freeze({signal,valid});return settleScopedCommand(method.call(craft,Object.freeze(a),scope),scope);
 });
 let disposed=false;return()=>{if(!disposed){disposed=true;stop();}};
}
