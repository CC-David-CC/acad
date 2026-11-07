// Worker-only ephemeral solved request. This is not source-membership proof or
// saved design intent. The source adapter must bind both genuine solver results.
import {capturePolygonProfileFaceRequest} from '../mount/selectedProfilePlan.mjs';
import {MAX_SWEEP_PATH_CURVES} from './sweepLimits.mjs';
// Share preparation-specific failure admission between the actual semantic
// Worker and its client. Kernel/solver states retain their own contracts.
export const SWEEP_PREPARATION_REFUSALS=Object.freeze(['STALE_SOURCE','STALE_PATH','SWEEP_INVALID_PATH','SWEEP_UNSUPPORTED_PATH','SWEEP_DISCONNECTED_PATH']);
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
function fields(value,keys){
 if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(key=>typeof key!=='string'||!keys.includes(key)))fail('INVALID_REQUEST','Expected exact sweep data fields.');
 const result={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','Sweep fields must be own data.');result[key]=d.value;}return result;
}
function array(value,min,max){if(!Array.isArray(value)||value.length<min||value.length>max||Reflect.ownKeys(value).length!==value.length+1)fail('INVALID_REQUEST','Expected dense bounded sweep data.');return Array.from({length:value.length},(_,index)=>{const d=Object.getOwnPropertyDescriptor(value,String(index));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','Sweep array entries must be data.');return d.value;});}
function point(value,n){return array(value,n,n).map(number=>{if(typeof number!=='number'||!Number.isFinite(number)||Math.abs(number)>1e6)fail('INVALID_REQUEST','Expected finite bounded sweep coordinates.');return number;});}
function id(value){if(typeof value!=='string'||!value||value.length>256)fail('INVALID_REQUEST','Expected an authored sweep identity.');return value;}
function source(value){const result=fields(value,['faceId','sourceSha256']);result.faceId=id(result.faceId);if(typeof result.sourceSha256!=='string'||!/^[a-f0-9]{64}$/.test(result.sourceSha256))fail('INVALID_REQUEST','Expected a solved source digest.');return result;}
function freeze(value){if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;}
export function captureOwnedSweepIntent(input){
 const r=fields(input,['op','version','unit','source','frame','region','path','transport']);
 if(r.op!=='solid.profile.sweep'||r.version!==1||r.unit!=='millimeter'||r.transport!=='corrected-frenet')fail('INVALID_REQUEST','Select explicit sweep version, units and transport.');
 r.source=source(r.source);const profile=capturePolygonProfileFaceRequest({version:1,unit:r.unit,frame:r.frame,region:r.region});r.frame=profile.frame;r.region=profile.region;
 r.path=fields(r.path,['source','frame','curves']);r.path.source=source(r.path.source);
 const f=fields(r.path.frame,['origin','x','y','z']);r.path.frame=Object.fromEntries(Object.entries(f).map(([key,value])=>[key,point(value,3)]));
 const seen=new Set();r.path.curves=array(r.path.curves,1,MAX_SWEEP_PATH_CURVES).map(value=>{
  const d=Object.getOwnPropertyDescriptor(value||{},'kind');if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','Path kind must be own data.');
  if(!['segment','arc'].includes(d.value))fail('SWEEP_UNSUPPORTED_PATH','Only directed source Segments and open circular Arcs are admitted.');
  const curve=fields(value,d.value==='segment'?['kind','id','a','b','reversed']:['kind','id','a','b','c','reversed']);curve.id=id(curve.id);
  if(seen.has(curve.id)||typeof curve.reversed!=='boolean')fail('INVALID_REQUEST','Path identities must be unique and direction explicit.');seen.add(curve.id);
  curve.a=point(curve.a,2);curve.b=point(curve.b,2);if(curve.kind==='arc')curve.c=point(curve.c,2);
  return curve;
 });
 if(new TextEncoder().encode(JSON.stringify(r)).byteLength>1048576)fail('RESOURCE_LIMIT','Ephemeral sweep request exceeds1MiB UTF-8.');
 return freeze(r);
}
export async function bindOwnedSweepIntent(input){
 const r=captureOwnedSweepIntent(input),hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(r)));
 return{version:1,unit:r.unit,source:{...r.source},regionId:r.region.id,pathSource:{...r.path.source},pathCurves:r.path.curves.map(curve=>({curveId:curve.id,reversed:curve.reversed})),transport:r.transport,
  requestSha256:Array.from(new Uint8Array(hash),number=>number.toString(16).padStart(2,'0')).join('')};
}

// Native input-change reports are integrity failures, never ordinary refusals.
export const SWEEP_NATIVE_REFUSALS=Object.freeze(['SWEEP_CLOSED_PATH_UNSUPPORTED','SWEEP_FAILED','SWEEP_INVALID_FRAME','SWEEP_INVALID_PATH','SWEEP_INVALID_PROFILE','SWEEP_INVALID_REQUEST','SWEEP_INVALID_RESULT','SWEEP_PATH_BELOW_RESOLUTION','SWEEP_PROFILE_NOT_ATTACHED','SWEEP_PROFILE_NOT_NORMAL','SWEEP_RESOURCE_LIMIT','SWEEP_UNSUPPORTED_AXIS_CONTACT','SWEEP_UNSUPPORTED_PATH','SWEEP_UNSUPPORTED_PROFILE','SWEEP_ZERO_PATH']);
