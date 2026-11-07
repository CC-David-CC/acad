// Ephemeral solved-request contract, not an authored history or source proof.
import {capturePolygonProfileFaceRequest} from '../mount/selectedProfilePlan.mjs';
export const REVOLVE_REFUSAL_CODES=Object.freeze(['REVOLVE_INVALID_REQUEST','REVOLVE_INVALID_PROFILE','REVOLVE_INVALID_AXIS','REVOLVE_AXIS_NOT_COPLANAR','REVOLVE_PROFILE_CROSSES_AXIS','REVOLVE_INVALID_ANGLE','REVOLVE_UNSUPPORTED_PROFILE','REVOLVE_FAILED','REVOLVE_INVALID_RESULT','REVOLVE_RESOURCE_LIMIT']);
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
function record(v,keys){
 if(!v||typeof v!=='object'||Array.isArray(v)||![null,Object.prototype].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length||Reflect.ownKeys(v).some(k=>typeof k!=='string'||!keys.includes(k)))fail('INVALID_REQUEST','Expected exact revolve data fields.');
 const r={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(v,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','Revolve fields must be own data.');r[k]=d.value;}return r;
}
function point(v){if(!Array.isArray(v)||v.length!==2||Reflect.ownKeys(v).length!==3)fail('INVALID_REQUEST','Expected dense source-local axis endpoints.');return [0,1].map(i=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value)||Math.abs(d.value)>1e6)fail('INVALID_REQUEST','Expected bounded axis coordinates.');return d.value;});}
const id=(v,max)=>typeof v==='string'&&v.length>0&&v.length<=max;
function freeze(v){if(v&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;}
export function captureOwnedRevolveIntent(input){
 const r=record(input,['op','version','unit','source','frame','region','axis','angleRadians']);
 if(r.op!=='solid.profile.revolve'||r.version!==1||r.unit!=='millimeter')fail('INVALID_REQUEST','Unsupported revolve operation, version or unit.');
 r.source=record(r.source,['faceId','sourceSha256']);if(!id(r.source.faceId,256)||typeof r.source.sourceSha256!=='string'||!/^[a-f0-9]{64}$/.test(r.source.sourceSha256))fail('INVALID_REQUEST','Expected exact solved source binding.');
 const face=capturePolygonProfileFaceRequest({version:1,unit:r.unit,frame:r.frame,region:r.region});r.frame=face.frame;r.region=face.region;
 r.axis=record(r.axis,['kind','id','a','b']);if(r.axis.kind!=='source-segment'||!id(r.axis.id,256))fail('INVALID_REQUEST','Expected a source segment axis.');r.axis.a=point(r.axis.a);r.axis.b=point(r.axis.b);
 if(r.axis.a.every((n,i)=>n===r.axis.b[i]))fail('REVOLVE_INVALID_AXIS','Axis endpoints must be distinct.');
 if(typeof r.angleRadians!=='number'||!Number.isFinite(r.angleRadians)||r.angleRadians===0||Math.abs(r.angleRadians)>2*Math.PI)fail('REVOLVE_INVALID_ANGLE','Expected nonzero signed angle with magnitude at most2π.');
 if(new TextEncoder().encode(JSON.stringify(r)).byteLength>1048576)fail('RESOURCE_LIMIT','Revolve request exceeds1MiB UTF-8.');
 return freeze(r);
}
// Call only with the detached capture above; also captures for standalone use.
export async function bindOwnedRevolveIntent(input){
 const r=captureOwnedRevolveIntent(input),bytes=new TextEncoder().encode(JSON.stringify(r));
 const hash=await crypto.subtle.digest('SHA-256',bytes),requestSha256=Array.from(new Uint8Array(hash),n=>n.toString(16).padStart(2,'0')).join('');
 return{version:1,unit:r.unit,source:{...r.source},regionId:r.region.id,axisId:r.axis.id,angleRadians:r.angleRadians,requestSha256};
}
