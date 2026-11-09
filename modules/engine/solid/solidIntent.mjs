// Data-only intent. Runtime handles and derived geometry are forbidden.
import {captureSelectedProfileRequest,capturePolygonProfileRequest} from '../mount/selectedProfilePlan.mjs';
import {solidBodyId} from './solidBodyIdentity.mjs';
export {solidBodyId} from './solidBodyIdentity.mjs';
const fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_REQUEST'});};
function fields(value,keys) {
 if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==keys.length)fail('Invalid solid request fields.');
 const result=Object.create(null);
 for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))fail('Solid fields must be plain data.');result[key]=d.value;}
 return result;
}
function vector(value,positive=false) {
 if(!Array.isArray(value)||value.length!==3||Reflect.ownKeys(value).length!==4)fail('Invalid solid vector.');
 const copy=[];for(let i=0;i<3;i++){const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value)||(positive?(d.value<=0||d.value>1e6):Math.abs(d.value)>1e6))fail('Invalid solid coordinate.');copy.push(d.value);}return Object.freeze(copy);
}
function common(p){if(p.version!==1||p.unit!=='millimeter'||!['occ','manifold','smlib'].includes(p.engine)||!(typeof p.engineRevision==='string'&&/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(p.engineRevision))||!Number.isSafeInteger(p.featureId)||p.featureId<1)fail('Invalid engine or feature identity.');}
export function captureSolidBox(input){const p=fields(input,['version','unit','engine','engineRevision','featureId','origin','dimensions']);common(p);return Object.freeze({...p,origin:vector(p.origin),dimensions:vector(p.dimensions,true)});}
export function captureSolidBoolean(input){const p=fields(input,['version','unit','engine','engineRevision','featureId','kind','a','b']);common(p);if(!['union','join','subtract','common'].includes(p.kind)||![p.a,p.b].every(id=>typeof id==='string'&&id.length>0&&id.length<=1024)||p.a===p.b)fail('Invalid Boolean operands.');return Object.freeze({...p});}
export function captureSolidEdgeTreatment(input){
 const p=fields(input,['version','unit','engine','engineRevision','featureId','target','producerFeatureId','kind','edgeIds','size']);common(p);
 if(p.engine!=='occ'||!Number.isSafeInteger(p.producerFeatureId)||p.producerFeatureId<1||p.featureId===p.producerFeatureId||p.target!==solidBodyId(p.producerFeatureId)||!['fillet','chamfer-equal'].includes(p.kind)||typeof p.size!=='number'||!Number.isFinite(p.size)||p.size<=0||p.size>1e6)fail('Invalid authored edge treatment.');
 if(!Array.isArray(p.edgeIds)||p.edgeIds.length<1||p.edgeIds.length>16||Reflect.ownKeys(p.edgeIds).length!==p.edgeIds.length+1)fail('Select one to sixteen authored edges.');
 const ids=[];for(let i=0;i<p.edgeIds.length;i++){const d=Object.getOwnPropertyDescriptor(p.edgeIds,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='string'||!d.value||d.value.length>16384)fail('Expected bounded data-only edge identities.');ids.push(d.value);}
 if(new Set(ids).size!==ids.length)fail('Select distinct authored edges.');return Object.freeze({...p,edgeIds:Object.freeze(ids)});
}
// The profile is a detached, ephemeral preparation result. Saved feature intent
// retains its source/region references, never this duplicate solved geometry.
export function captureSolidProfile(input){
 const p=fields(input,['version','unit','engine','engineRevision','featureId','profile']);common(p);if(p.engine!=='occ')fail('Selected-profile solids require the explicit OCC backend.');
 const version=Object.getOwnPropertyDescriptor(p.profile||{},'version');if(!version?.enumerable||!Object.hasOwn(version,'value'))fail('Selected-profile version must be data.');
 const profile=(version.value===3?capturePolygonProfileRequest:captureSelectedProfileRequest)(p.profile),freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
 return Object.freeze({...p,profile:freeze(profile)});
}
