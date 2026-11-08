import {canonicalAuthoredFeatureId} from '../../cad/craft/authoredFeatureIdentity.mjs';
import {captureSketchFailure} from '../constr/admissionCause.mjs';
// Pure bounded transport/identity data. No solver, model, DOM or geometry state.
export const SOURCE_PLANE_BYTES=65536;
export const SOURCE_PLANE_REPLY_BYTES=65536;
export const planeFailure=(code,message)=>Object.assign(Error(message),{code});
const fail=(code,message)=>{throw planeFailure(code,message)};
export function planeRecord(value,keys,code='INVALID_REQUEST'){
 const p=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
 if(!value||typeof value!=='object'||Array.isArray(value)||(p!==null&&Object.getPrototypeOf(p)!==null)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))fail(code,'Expected exact source-plane data.');
 const out=Object.create(null);for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail(code,'Source-plane fields must be own data.');out[key]=d.value;}return out;
}
export const sourcePlaneDepth=n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e8;
export function captureSourcePlaneParameters(value){
 const p=planeRecord(value,['featureId','orientation','datum','depth']);
 const id=p.featureId;
 if(!canonicalAuthoredFeatureId(id)||!['XY','XZ','ZY'].includes(p.orientation)||p.datum!==null||!sourcePlaneDepth(p.depth))fail('UNSUPPORTED_PLANE','Select an independent principal plane with a numeric signed depth.');
 return Object.freeze(p);
}
export function captureSourcePlaneFrame(value,code='INVALID_REQUEST'){
 const f=planeRecord(value,['origin','x','y','z'],code),out=Object.create(null);
 for(const key of ['origin','x','y','z']){const a=f[key];if(!Array.isArray(a)||a.length!==3||Reflect.ownKeys(a).length!==4)fail(code,'Expected a bounded dense source-plane frame.');out[key]=Object.freeze([0,1,2].map(i=>{const d=Object.getOwnPropertyDescriptor(a,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value)||Math.abs(d.value)>1e9)fail(code,'Source-plane frame values must be finite data.');return d.value;}));}
 return Object.freeze(out);
}
export function boundedPlaneSource(value,code='INVALID_REQUEST'){
 if(typeof value!=='string'||!value||value.length>SOURCE_PLANE_BYTES||new TextEncoder().encode(value).byteLength>SOURCE_PLANE_BYTES)fail(code,'Source-plane sketch exceeds64KiB.');return value;
}
export function captureSourcePlaneRequest(value){
 const r=planeRecord(value,['revision','unit','sketchJSON','frame','orientation','beforeDepth','afterDepth','candidateJSON']);
 if(typeof r.revision!=='string'||!r.revision||r.revision.length>256||r.unit!=='millimeter'||!['XY','XZ','ZY'].includes(r.orientation)||!sourcePlaneDepth(r.beforeDepth)||!sourcePlaneDepth(r.afterDepth))fail('INVALID_REQUEST','Invalid signed principal-plane transition.');
 r.sketchJSON=boundedPlaneSource(r.sketchJSON);r.frame=captureSourcePlaneFrame(r.frame);if(r.candidateJSON!==null)r.candidateJSON=boundedPlaneSource(r.candidateJSON);return Object.freeze(r);
}
export function captureSourcePlaneReply(value,revision){
 const error=value&&Object.getOwnPropertyDescriptor(value,'ok');
 if(error?.value===false){const r=planeRecord(value,['revision','ok','error'],'INVALID_RESPONSE');if(r.revision!==revision)fail('INVALID_RESPONSE','Invalid source-plane failure binding.');return Object.freeze({...r,error:captureSketchFailure(r.error)});}
 const r=planeRecord(value,['revision','ok','serializedSketch','frame'],'INVALID_RESPONSE');if(r.revision!==revision||r.ok!==true)fail('INVALID_RESPONSE','Invalid source-plane response binding.');r.serializedSketch=boundedPlaneSource(r.serializedSketch,'INVALID_RESPONSE');r.frame=captureSourcePlaneFrame(r.frame,'INVALID_RESPONSE');
 if(new TextEncoder().encode(JSON.stringify(r)).byteLength>SOURCE_PLANE_REPLY_BYTES)fail('RESOURCE_LIMIT','Source-plane response exceeds64KiB.');return Object.freeze(r);
}
