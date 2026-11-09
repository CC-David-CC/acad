// Pure bounded numeric metadata. No Native topology, tool plan, handle or proof.
import {solidBodyId} from './solidBodyIdentity.mjs';
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
export const COUNTERSINK_NUMERIC_KEYS=Object.freeze(['version','unit','engine','engineRevision','featureId','target','producerFeatureId','sourceFeatureId','sourceFaceId','sourceRegionId','entryFaceId','kind','throughDiameter','entryDiameter','includedAngleRadians']);
export const COUNTERSINK_LENGTH_KEYS=Object.freeze(['throughDiameter','entryDiameter']);
export const COUNTERSINK_DIMENSION_KEYS=Object.freeze([...COUNTERSINK_LENGTH_KEYS,'includedAngleRadians']);
export const COUNTERSINK_GEOMETRY_CODES=Object.freeze(['PROFILE_BELOW_RESOLUTION','UNSUPPORTED_COUNTERSINK_BUILD','COUNTERSINK_UNSUPPORTED_TARGET','COUNTERSINK_ENTRY_UNRESOLVED','COUNTERSINK_DIAMETER_ORDER','COUNTERSINK_DEPTH_NOT_INTERIOR','COUNTERSINK_OUTSIDE_PROFILE','COUNTERSINK_TOOL_UNQUALIFIED','COUNTERSINK_CONE_UNQUALIFIED']);
export const COUNTERSINK_CODES=Object.freeze(['INVALID_REQUEST','STALE_SOURCE','INVALID_OPERAND','ENGINE_REVISION_MISMATCH',...COUNTERSINK_GEOMETRY_CODES,'RESOURCE_LIMIT']);
export function assertCountersinkDiameterOrder(through,entry){if(!(through<entry))fail('COUNTERSINK_DIAMETER_ORDER','The entry diameter must exceed the through diameter.');}
function numericFields(value){
 const p=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
 // Preserve the prior private numeric capture's own-data/error contract while
 // removing its dependency on the Worker conical/topology response tree.
 if(!value||typeof value!=='object'||Array.isArray(value)||(p!==null&&Object.getPrototypeOf(p)!==null)||Reflect.ownKeys(value).length!==COUNTERSINK_NUMERIC_KEYS.length)fail('ENGINE_FAILURE','Expected exact private conical data.');
 const out={};for(const key of COUNTERSINK_NUMERIC_KEYS){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('ENGINE_FAILURE','Conical fields must be own data.');out[key]=d.value;}return out;
}
export function captureNumericCountersinkIntent(value){
 const r=numericFields(value),id=n=>Number.isSafeInteger(n)&&n>0,text=(n,max)=>typeof n==='string'&&n.length>0&&n.length<=max;
 if(r.version!==1||r.unit!=='millimeter'||r.engine!=='occ'||typeof r.engineRevision!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(r.engineRevision)||r.kind!=='centered-countersink-conical'||![r.featureId,r.producerFeatureId,r.sourceFeatureId].every(id)||r.featureId===r.producerFeatureId||r.producerFeatureId!==r.sourceFeatureId||r.target!==solidBodyId(r.producerFeatureId)||!text(r.sourceFaceId,256)||!text(r.sourceRegionId,8192)||!text(r.entryFaceId,16384))fail('INVALID_REQUEST','Expected the exact private source-bound countersink intent.');
 if(COUNTERSINK_LENGTH_KEYS.some(k=>typeof r[k]!=='number'||!Number.isFinite(r[k])||r[k]<=0||r[k]>1e6)||typeof r.includedAngleRadians!=='number'||!Number.isFinite(r.includedAngleRadians)||r.includedAngleRadians<=0||r.includedAngleRadians>=Math.PI)fail('INVALID_REQUEST','Use positive numeric millimeter diameters and a full included angle strictly between zero and pi radians.');
 assertCountersinkDiameterOrder(r.throughDiameter,r.entryDiameter);
 if(new TextEncoder().encode(JSON.stringify(r)).byteLength>65536)fail('RESOURCE_LIMIT','Countersink intent exceeds64KiB.');return Object.freeze(r);
}
