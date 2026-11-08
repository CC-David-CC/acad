import {settleScopedCommand} from './scoped-command.mjs';
// Thin host transport; original native equation/side, two Workers, source and
// full suffix/J authority belong to the shared Core, never this scalar DTO.
export function registerPointLineDistanceCommands(host,getTarget){
 const keys=['revision','faceId','pointId','lineId','distance','inverted'],text=maxLength=>({type:'string',minLength:1,maxLength}),aborted=Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get;
 const stop=host.commands.register({id:'apply-closed-sketch-point-line-distance',description:'Create a genuine nonnegative point-to-infinite-supporting-line DistancePL in canonical millimeters. inverted selects the opposite of the actual polar normal, not finite-segment proximity. Shared source/history UndoRedo; save separately.',parameters:{type:'object',additionalProperties:false,required:keys.slice(),properties:{revision:text(256),faceId:text(1024),pointId:text(256),lineId:text(256),distance:{type:'number',minimum:0,maximum:1000000},inverted:{type:'boolean'}}}},args=>{
  const p=args&&typeof args==='object'?Object.getPrototypeOf(args):undefined;if(!args||typeof args!=='object'||Array.isArray(args)||(p!==null&&Object.getPrototypeOf(p)!==null)||Reflect.ownKeys(args).length!==keys.length)throw Error('Expected exact point-line distance fields.');
  const a={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(args,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Point-line distance fields must be own data.');a[k]=d.value;}
  if(![a.revision,a.faceId,a.pointId,a.lineId].every((v,i)=>typeof v==='string'&&v.length>0&&v.length<=[256,1024,256,256][i])||a.pointId===a.lineId||typeof a.distance!=='number'||!Number.isFinite(a.distance)||a.distance<0||a.distance>1e6||typeof a.inverted!=='boolean')throw Error('Use current point/line identities, nonnegative millimeters and a literal polar-normal side.');
  const t=getTarget(),session=host.session(),signal=host.signal,commands=host.commands,token=commands?.documentToken?.(),craft=t.craft,method=craft?.applyClosedSketchPointLineDistance;
  const owner=()=>host.signal===signal&&!aborted.call(signal)&&host.session()===session&&host.commands===commands&&commands.documentToken()===token&&t.craft===craft&&craft?.applyClosedSketchPointLineDistance===method;
  const valid=()=>{try{return !!session&&typeof token==='string'&&token.length>0&&token.length<=256&&owner()&&t.valid()===true&&owner();}catch{return false;}};
  if(typeof method!=='function'||!valid())throw Error('Point-line distance requires the current bound CAD document.');
  const scope=Object.freeze({signal,valid});return settleScopedCommand(method.call(craft,Object.freeze(a),scope),scope);
 });
 let disposed=false;return()=>{if(!disposed){disposed=true;stop();}};
}
