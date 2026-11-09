// Numeric Native-bound intent only. Capture is not source/entry/geometry proof.
import {solidBodyId} from './solidIntent.mjs';
export const BLIND_HOLE_KEYS=Object.freeze(['version','unit','engine','engineRevision','featureId','target','producerFeatureId','sourceFeatureId','sourceFaceId','sourceRegionId','entryFaceId','kind','diameter','depth']);
export const BLIND_HOLE_GEOMETRY_CODES=Object.freeze(['UNSUPPORTED_BLIND_HOLE_BUILD','BLIND_UNSUPPORTED_TARGET','BLIND_ENTRY_UNRESOLVED','BLIND_DEPTH_NOT_INTERIOR','BLIND_HOLE_OUTSIDE_PROFILE','BLIND_FLOOR_UNQUALIFIED']);
export const BLIND_HOLE_CODES=Object.freeze(['INVALID_REQUEST','STALE_SOURCE','INVALID_OPERAND','ENGINE_REVISION_MISMATCH',...BLIND_HOLE_GEOMETRY_CODES,'RESOURCE_LIMIT']);
const fail=message=>{throw Object.assign(Error(message),{code:'INVALID_REQUEST'});};
const text=(v,max)=>typeof v==='string'&&v.length>0&&v.length<=max;
export function captureOwnedBlindHoleIntent(input){
 const p=input&&typeof input==='object'?Object.getPrototypeOf(input):undefined;
 if(!input||typeof input!=='object'||Array.isArray(input)||(p!==null&&Object.getPrototypeOf(p)!==null)||Reflect.ownKeys(input).length!==BLIND_HOLE_KEYS.length)fail('Expected exact centered blind-hole intent.');
 const r={};for(const key of BLIND_HOLE_KEYS){const d=Object.getOwnPropertyDescriptor(input,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Blind-hole fields must be own enumerable data.');r[key]=d.value;}
 if(r.version!==1||r.unit!=='millimeter'||r.engine!=='occ'||typeof r.engineRevision!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(r.engineRevision)||r.kind!=='centered-blind-flat')fail('Select the exact centered flat-bottom blind-hole version and build.');
 if(![r.featureId,r.producerFeatureId,r.sourceFeatureId].every(v=>Number.isSafeInteger(v)&&v>0)||r.featureId===r.producerFeatureId||r.producerFeatureId!==r.sourceFeatureId||r.target!==solidBodyId(r.producerFeatureId))fail('The blind parent must be its genuine selected constructor.');
 if(!text(r.sourceFaceId,256)||!text(r.sourceRegionId,8192)||!text(r.entryFaceId,16384)||![r.diameter,r.depth].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>0&&v<=1e6))fail('Blind dimensions and source/entry identities must be bounded.');
 let bytes=2;const encoder=new TextEncoder();for(const key of BLIND_HOLE_KEYS){bytes+=encoder.encode(JSON.stringify(key)).byteLength+1+encoder.encode(JSON.stringify(r[key])).byteLength+1;if(bytes>65536)throw Object.assign(Error('Blind-hole intent exceeds64KiB UTF-8.'),{code:'RESOURCE_LIMIT'});}
 return Object.freeze(r);
}
