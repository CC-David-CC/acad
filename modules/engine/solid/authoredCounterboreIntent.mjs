import {captureOwnedCounterboreIntent,COUNTERBORE_KEYS,COUNTERBORE_LENGTH_KEYS,assertCounterboreDiameterOrder} from './ownedCounterboreIntent.mjs';
import {isAuthoredLength,resolveAuthoredLength} from './authoredLengthBinding.mjs';
const fail=()=>{throw Object.assign(Error('Expected exact authored counterbore lengths and source identity.'),{code:'INVALID_REQUEST'});};
export function captureAuthoredCounterboreIntent(input){
 const p=input&&typeof input==='object'?Object.getPrototypeOf(input):undefined;
 if(!input||typeof input!=='object'||Array.isArray(input)||(p!==null&&Object.getPrototypeOf(p)!==null)||Reflect.ownKeys(input).length!==15)fail();
 const r={};for(const key of COUNTERBORE_KEYS){const d=Object.getOwnPropertyDescriptor(input,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail();r[key]=d.value;}
 for(const key of COUNTERBORE_LENGTH_KEYS)if(!isAuthoredLength(r[key]))fail();
 // Schema sentinels ONLY: partially named pairs have no numeric order until
 // the authoritative expression facade materializes BOTH real values.
 const admitted=captureOwnedCounterboreIntent({...r,throughDiameter:1,stepDiameter:2,stepDepth:1});
 if(typeof r.throughDiameter==='number'&&typeof r.stepDiameter==='number')assertCounterboreDiameterOrder(r.throughDiameter,r.stepDiameter);
 return Object.freeze({...admitted,...Object.fromEntries(COUNTERBORE_LENGTH_KEYS.map(k=>[k,r[k]]))});
}
export function materializeAuthoredCounterboreIntent(input,expressions,materialized){
 const r={...captureAuthoredCounterboreIntent(input)};for(const key of COUNTERBORE_LENGTH_KEYS){r[key]=resolveAuthoredLength(r[key],expressions);if(materialized&&!Object.is(materialized[key],r[key]))fail();}return captureOwnedCounterboreIntent(r);
}

// Admission before app feature allocation; these are lengths, not a pretend
// authored feature/Native relationship. Full identity is captured after the
// real counter allocator supplies its one actual featureId.
export function captureAuthoredCounterboreLengths(input){
 const p=input&&typeof input==='object'?Object.getPrototypeOf(input):undefined;if(!input||typeof input!=='object'||Array.isArray(input)||(p!==null&&Object.getPrototypeOf(p)!==null)||Reflect.ownKeys(input).length!==3)fail();const out={};
 for(const k of COUNTERBORE_LENGTH_KEYS){const d=Object.getOwnPropertyDescriptor(input,k);if(!d?.enumerable||!Object.hasOwn(d,'value')||!isAuthoredLength(d.value))fail();out[k]=d.value;}
 if(typeof out.throughDiameter==='number'&&typeof out.stepDiameter==='number')assertCounterboreDiameterOrder(out.throughDiameter,out.stepDiameter);return Object.freeze(out);
}
export function materializeAuthoredCounterboreLengths(input,expressions){const raw=captureAuthoredCounterboreLengths(input),out={};for(const k of COUNTERBORE_LENGTH_KEYS)out[k]=resolveAuthoredLength(raw[k],expressions);assertCounterboreDiameterOrder(out.throughDiameter,out.stepDiameter);return Object.freeze(out);}
