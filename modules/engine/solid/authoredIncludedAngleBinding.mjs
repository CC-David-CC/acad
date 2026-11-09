// Authored metadata only; exact Native intent remains numeric. This is the
// FULL included angle in canonical radians, not degrees or a half angle.
// It grants no feature, Native mode, history, capability or fallback.
const name=/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/;
const fail=message=>{throw Object.assign(Error(message),{code:'INVALID_REQUEST'});};
const included=value=>typeof value==='number'&&Number.isFinite(value)&&value>0&&value<Math.PI;
export const isAuthoredIncludedAngleRadians=value=>included(value)||typeof value==='string'&&name.test(value);
export function resolveAuthoredIncludedAngleRadians(value,expressions){
 if(!isAuthoredIncludedAngleRadians(value))fail('Expected a full included angle strictly between zero and pi radians, or a named typed angle.');
 if(typeof value==='number')return value;
 if(expressions?.isTyped!==true||!expressions.hasCurrentPhysicalResult())fail('A current typed parameter source is required.');
 const number=expressions.resolveQuantity(value,'angle');
 if(!included(number))fail('Resolved included angle must be strictly between zero and pi radians.');
 return number;
}
