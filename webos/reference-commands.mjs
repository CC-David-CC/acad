import {settleScopedCommand} from './scoped-command.mjs';

// Transport only: shared Craft owns checked replay, authentic parent/source
// admission, the existing authored journal and accepted-state publication.
export function registerReferenceCommands(host,getTarget){
 const stops=[],base=['revision','index','featureId'],repair=[...base,'bodyId','sourceFeatureId'];
 const text=maxLength=>({type:'string',minLength:1,maxLength}),positive={type:'integer',minimum:1,maximum:Number.MAX_SAFE_INTEGER};
 const properties={revision:text(256),index:{type:'integer',minimum:0,maximum:255},featureId:positive,bodyId:text(1024),sourceFeatureId:positive};
 const schema=keys=>({type:'object',additionalProperties:false,required:keys.slice(),properties:Object.fromEntries(keys.map(k=>[k,properties[k]]))});
 function capture(value,keys){
  const p=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
  if(!value||typeof value!=='object'||Array.isArray(value)||(p!==null&&Object.getPrototypeOf(p)!==null)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))throw Error('Expected exact reference command fields.');
  const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Reference command fields must be enumerable own data.');out[key]=d.value;}
  if(keys.length&&(typeof out.revision!=='string'||!out.revision||out.revision.length>256||!Number.isSafeInteger(out.index)||out.index<0||out.index>255||!Number.isSafeInteger(out.featureId)||out.featureId<1))throw Error('Use an inspected authored revision, index and positive feature ID.');
  if(keys.includes('bodyId')&&(typeof out.bodyId!=='string'||!out.bodyId||out.bodyId.length>1024||!Number.isSafeInteger(out.sourceFeatureId)||out.sourceFeatureId<1))throw Error('Choose an actual advertised body and source feature pair.');
  return Object.freeze(out);
 }
 function target(name){
  const captured=getTarget(),session=host.session(),signal=host.signal,commands=host.commands,documentToken=commands?.documentToken?.(),craft=captured.craft,method=craft?.[name];
  const owner=()=>host.signal===signal&&!signal.aborted&&host.session()===session&&host.commands===commands&&commands.documentToken()===documentToken&&captured.craft===craft&&craft?.[name]===method;
  const valid=()=>{try{return !!session&&typeof documentToken==='string'&&documentToken.length>0&&documentToken.length<=256&&owner()&&captured.valid()===true&&owner();}catch{return false;}};
  if(typeof method!=='function'||!valid())throw Error('Reference commands require a current bound CAD window and matching shared service.');
  return{craft,method,valid,scope:Object.freeze({signal,valid})};
 }
 function register(id,name,keys,description,asyncCall=true){
  stops.push(host.commands.register({id,description,parameters:schema(keys)},args=>{
   const input=capture(args,keys),t=target(name);
   if(!asyncCall){const result=t.method.call(t.craft);if(!t.valid())throw Error('The modeling window, account or document changed.');return result;}
   return settleScopedCommand(t.method.call(t.craft,input,t.scope),t.scope);
  }));
 }
 try{
  register('inspect-worker-feature-deletions','inspectWorkerFeatureDeletions',[],'Inspect selected-profile extrusion deletion candidates. Eligibility permits an attempted full-suffix replay; it does not certify that dependent features will survive.',false);
  register('delete-worker-feature','deleteWorkerFeature',base,'Delete one inspected selected-profile extrusion through checked replay. Dependents may force an atomic refusal. Source planes remain. Unsaved authored edit; use shared Undo/Redo and Save separately.');
  register('inspect-through-hole-parents','inspectWorkerThroughHoleParents',base,'Inspect actual independent parent/source alternatives for one authored centered-through hole. Choose an explicit candidate; compatibility still requires complete checked replay.');
  register('repair-through-hole-parent','repairWorkerThroughHoleParent',repair,'Rebind one inspected centered-through hole to an explicitly advertised body/source pair. Preserves feature and dimensions; incompatible children refuse atomically. Unsaved authored edit; Save separately.');
 }catch(error){for(const stop of stops.splice(0).reverse())stop();throw error;}
 return()=>{for(const stop of stops.splice(0).reverse())stop();};
}
