// Pure authored-length metadata/resolution policy; actual values come ONLY
// from the accepted/prepared expression facade supplied by its current owner.
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
