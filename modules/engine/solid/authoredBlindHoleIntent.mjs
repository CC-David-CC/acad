import {captureOwnedBlindHoleIntent,BLIND_HOLE_KEYS} from './ownedBlindHoleIntent.mjs';
import {isAuthoredLength,resolveAuthoredLength} from './authoredLengthBinding.mjs';
const fail=()=>{throw Object.assign(Error('Expected exact authored blind-hole lengths and source identity.'),{code:'INVALID_REQUEST'});};
export function captureAuthoredBlindHoleIntent(input){
 const p=input&&typeof input==='object'?Object.getPrototypeOf(input):undefined;
 if(!input||typeof input!=='object'||Array.isArray(input)||(p!==null&&Object.getPrototypeOf(p)!==null)||Reflect.ownKeys(input).length!==14)fail();
 const r={};for(const key of BLIND_HOLE_KEYS){const d=Object.getOwnPropertyDescriptor(input,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail();r[key]=d.value;}
 for(const key of ['diameter','depth'])if(!isAuthoredLength(r[key]))fail();
 // Schema sentinel only; never evaluated or returned as physical geometry.
 const admitted=captureOwnedBlindHoleIntent({...r,diameter:typeof r.diameter==='number'?r.diameter:1,depth:typeof r.depth==='number'?r.depth:1});
 return Object.freeze({...admitted,diameter:r.diameter,depth:r.depth});
}
export function materializeAuthoredBlindHoleIntent(input,expressions,materialized){
 const r={...captureAuthoredBlindHoleIntent(input)};
 for(const key of ['diameter','depth']){r[key]=resolveAuthoredLength(r[key],expressions);if(materialized&&!Object.is(materialized[key],r[key]))fail();}
 return captureOwnedBlindHoleIntent(r);
}
