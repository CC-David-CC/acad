// Numeric Native-bound intent; capture supplies no topology/entry authority.
import {solidBodyId} from './solidIntent.mjs';
export const COUNTERBORE_KEYS=Object.freeze(['version','unit','engine','engineRevision','featureId','target','producerFeatureId','sourceFeatureId','sourceFaceId','sourceRegionId','entryFaceId','kind','throughDiameter','stepDiameter','stepDepth']);
export const COUNTERBORE_LENGTH_KEYS=Object.freeze(['throughDiameter','stepDiameter','stepDepth']);
export const COUNTERBORE_GEOMETRY_CODES=Object.freeze(['PROFILE_BELOW_RESOLUTION','UNSUPPORTED_COUNTERBORE_BUILD','COUNTERBORE_UNSUPPORTED_TARGET','COUNTERBORE_ENTRY_UNRESOLVED','COUNTERBORE_DIAMETER_ORDER','COUNTERBORE_STEP_NOT_INTERIOR','COUNTERBORE_OUTSIDE_PROFILE','COUNTERBORE_CYLINDERS_UNQUALIFIED','COUNTERBORE_SHOULDER_UNQUALIFIED']);
export const COUNTERBORE_CODES=Object.freeze(['INVALID_REQUEST','STALE_SOURCE','INVALID_OPERAND','ENGINE_REVISION_MISMATCH',...COUNTERBORE_GEOMETRY_CODES,'RESOURCE_LIMIT']);
const fail=(message,code='INVALID_REQUEST')=>{throw Object.assign(Error(message),{code});};
export function assertCounterboreDiameterOrder(small,large){if(!(small<large))fail('The through diameter must be strictly less than the step diameter.','COUNTERBORE_DIAMETER_ORDER');}
export function captureOwnedCounterboreIntent(input){
 const p=input&&typeof input==='object'?Object.getPrototypeOf(input):undefined;
 if(!input||typeof input!=='object'||Array.isArray(input)||(p!==null&&Object.getPrototypeOf(p)!==null)||Reflect.ownKeys(input).length!==15)fail('Expected exact centered counterbore intent.');
 const r={};for(const key of COUNTERBORE_KEYS){const d=Object.getOwnPropertyDescriptor(input,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Counterbore fields must be own enumerable data.');r[key]=d.value;}
 if(r.version!==1||r.unit!=='millimeter'||r.engine!=='occ'||typeof r.engineRevision!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(r.engineRevision)||r.kind!=='centered-counterbore-flat')fail('Select the exact centered flat-step counterbore version and build.');
 if(![r.featureId,r.producerFeatureId,r.sourceFeatureId].every(v=>Number.isSafeInteger(v)&&v>0)||r.featureId===r.producerFeatureId||r.producerFeatureId!==r.sourceFeatureId||r.target!==solidBodyId(r.producerFeatureId))fail('The counterbore parent must be its genuine selected constructor.');
 const text=(v,max)=>typeof v==='string'&&v.length>0&&v.length<=max;
 if(!text(r.sourceFaceId,256)||!text(r.sourceRegionId,8192)||!text(r.entryFaceId,16384)||COUNTERBORE_LENGTH_KEYS.some(k=>typeof r[k]!=='number'||!Number.isFinite(r[k])||r[k]<=0||r[k]>1e6))fail('Counterbore lengths and source/entry identities must be bounded.');
 assertCounterboreDiameterOrder(r.throughDiameter,r.stepDiameter);
 if(new TextEncoder().encode(JSON.stringify(r)).byteLength>65536)fail('Counterbore intent exceeds64KiB UTF-8.','RESOURCE_LIMIT');return Object.freeze(r);
}
