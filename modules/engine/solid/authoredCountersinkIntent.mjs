// Shared authored metadata: raw names stay source intent; only the actual
// accepted/candidate typed facade materializes canonical mm and FULL radians.
import {captureNumericCountersinkIntent,COUNTERSINK_NUMERIC_KEYS,COUNTERSINK_LENGTH_KEYS,assertCountersinkDiameterOrder} from './ownedCountersinkIntent.mjs';
import {isAuthoredLength,resolveAuthoredLength} from './authoredLengthQuantity.mjs';
import {isAuthoredIncludedAngleRadians,resolveAuthoredIncludedAngleRadians} from './authoredIncludedAngleBinding.mjs';
const fail=(message,code='INVALID_REQUEST')=>{throw Object.assign(Error(message),{code});};
function fields(value,keys){
 const p=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
 if(!value||typeof value!=='object'||Array.isArray(value)||(p!==null&&Object.getPrototypeOf(p)!==null)||Reflect.ownKeys(value).length!==keys.length)fail('Expected exact authored countersink fields.');const out={};
 for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Authored countersink fields must be own data.');out[key]=d.value;}return out;
}
const dimensionKeys=Object.freeze([...COUNTERSINK_LENGTH_KEYS,'includedAngleRadians']);
function captureDimensions(value){
 for(const key of COUNTERSINK_LENGTH_KEYS)if(!isAuthoredLength(value[key]))fail('Expected positive millimeter diameters or named typed lengths.');
 if(!isAuthoredIncludedAngleRadians(value.includedAngleRadians))fail('Expected a full included angle strictly between zero and pi radians, or a named typed angle.');
 if(typeof value.throughDiameter==='number'&&typeof value.entryDiameter==='number')assertCountersinkDiameterOrder(value.throughDiameter,value.entryDiameter);return value;
}
export function captureAuthoredCountersinkIntent(input){
 const raw=captureDimensions(fields(input,COUNTERSINK_NUMERIC_KEYS));
 // Schema-only sentinels validate actual identity fields without inventing an
 // identity or resolving a partial named pair. They never leave this function
 // as dimensions, reach Native, seed source geometry or prove admission.
 const admitted=captureNumericCountersinkIntent({...raw,throughDiameter:1,entryDiameter:2,includedAngleRadians:Math.PI/2});
 const captured={...admitted,...Object.fromEntries(dimensionKeys.map(k=>[k,raw[k]]))};
 if(new TextEncoder().encode(JSON.stringify(captured)).byteLength>65536)fail('Authored countersink intent exceeds64KiB.','RESOURCE_LIMIT');return Object.freeze(captured);
}
export function materializeAuthoredCountersinkIntent(input,expressions,materialized){
 const authored=captureAuthoredCountersinkIntent(input),numeric={...authored};
 for(const key of COUNTERSINK_LENGTH_KEYS)numeric[key]=resolveAuthoredLength(authored[key],expressions);
 numeric.includedAngleRadians=resolveAuthoredIncludedAngleRadians(authored.includedAngleRadians,expressions);
 // Numeric order applies only after BOTH actual length values have resolved.
 const result=captureNumericCountersinkIntent(numeric);
 if(materialized!==undefined){const prior=captureNumericCountersinkIntent(materialized);for(const key of COUNTERSINK_NUMERIC_KEYS)if(!Object.is(prior[key],result[key]))fail('Materialized countersink identity or dimensions differ from the current authored source.');}
 return result;
}
// Preallocation dimension admission: no fake producer/source/feature IDs.
export function captureAuthoredCountersinkDimensions(input){return Object.freeze(captureDimensions(fields(input,dimensionKeys)));}
export function materializeAuthoredCountersinkDimensions(input,expressions){
 const raw=captureAuthoredCountersinkDimensions(input),out={};for(const key of COUNTERSINK_LENGTH_KEYS)out[key]=resolveAuthoredLength(raw[key],expressions);
 out.includedAngleRadians=resolveAuthoredIncludedAngleRadians(raw.includedAngleRadians,expressions);assertCountersinkDiameterOrder(out.throughDiameter,out.entryDiameter);return Object.freeze(out);
}
// Direct edits may retain or introduce a current named quantity, but may not
// erase/rebind an existing name. The shared physical transaction owns that edit.
export function assertCountersinkBindingsPreserved(before,after){
 const a=captureAuthoredCountersinkDimensions(before),b=captureAuthoredCountersinkDimensions(after);
 for(const key of dimensionKeys)if(typeof a[key]==='string'&&!Object.is(a[key],b[key]))fail('Edit the authoritative physical binding rather than erasing or rebinding a countersink name.','BOUND_DIMENSION');
 return b;
}
