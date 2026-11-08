// Authored metadata only. Native intent parsers remain strictly numeric.
import {captureOwnedHoleIntent} from './ownedHoleIntent.mjs';
const name=/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/;
const fail=message=>{throw Object.assign(Error(message),{code:'INVALID_REQUEST'});};
export const isAuthoredLength=value=>typeof value==='number'&&Number.isFinite(value)&&value>0&&value<=1e6||typeof value==='string'&&name.test(value);
export function resolveAuthoredLength(value,expressions){
 if(!isAuthoredLength(value))fail('Expected a positive millimeter value or a named typed length.');
 if(typeof value==='number')return value;
 if(expressions?.isTyped!==true||!expressions.hasCurrentPhysicalResult())fail('A current typed parameter source is required.');
 const number=expressions.resolveQuantity(value,'length');
 if(typeof number!=='number'||!Number.isFinite(number)||number<=0||number>1e6)fail('Resolved length is outside the supported domain.');
 return number;
}
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
