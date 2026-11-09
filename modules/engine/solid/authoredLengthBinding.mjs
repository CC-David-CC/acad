// Authored metadata only. Native intent parsers remain strictly numeric.
import {captureOwnedHoleIntent} from './ownedHoleIntent.mjs';
import {isAuthoredLength,resolveAuthoredLength} from './authoredLengthQuantity.mjs';
export {isAuthoredLength,resolveAuthoredLength} from './authoredLengthQuantity.mjs';
const fail=message=>{throw Object.assign(Error(message),{code:'INVALID_REQUEST'});};
export function captureAuthoredHoleIntent(input){
 if(!input||typeof input!=='object'||Array.isArray(input))fail('Expected authored through-hole data.');
 const keys=Reflect.ownKeys(input);if(![12,14].includes(keys.length))fail('Unexpected authored through-hole fields.');
 const copy=Object.create(null);for(const key of keys){const d=Object.getOwnPropertyDescriptor(input,key);if(typeof key!=='string'||!d?.enumerable||!Object.hasOwn(d,'value'))fail('Expected own authored through-hole fields.');copy[key]=d.value;}
 const dimensions=copy.kind==='centered-through'?['diameter']:['diameter','offsetX','offsetY'];
 // Schema-only sentinel validates the unchanged identity parser. It is never
 // evaluated or returned as geometry; the numeric parser runs again only after
 // names resolve against the authoritative current typed facade.
 const numeric={...copy};for(const key of dimensions){if(!isAuthoredLength(copy[key]))fail('Invalid authored through-hole length.');numeric[key]=typeof copy[key]==='number'?copy[key]:1;}
 const admitted=captureOwnedHoleIntent(numeric);
 return Object.freeze(Object.fromEntries(Object.keys(admitted).map(key=>[key,dimensions.includes(key)?copy[key]:admitted[key]])));
}
export function materializeAuthoredHoleIntent(input,expressions,materialized){
 const authored=captureAuthoredHoleIntent(input),numeric={...authored};
 for(const key of authored.kind==='centered-through'?['diameter']:['diameter','offsetX','offsetY']){
  numeric[key]=resolveAuthoredLength(authored[key],expressions);
  if(materialized&&!Object.is(materialized[key],numeric[key]))fail('Materialized through-hole length differs from the current typed source.');
 }
 return captureOwnedHoleIntent(numeric);
}
