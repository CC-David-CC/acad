import {MILLIMETERS_PER_INCH,RADIANS_PER_DEGREE} from '../parameters/physicalUnitConstants.mjs';

// Native metadata stores only the nondefault presentation. Default mm is
// represented by absence; canonical geometry and authored input never change.
/** @returns {Readonly<{version:1,lengthUnit:'inch'}>} */
export function captureDisplayUnitsMetadata(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==2)throw Error('Invalid display-unit metadata.');
 const result={};for(const key of ['version','lengthUnit']){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Display-unit metadata must be own data.');result[key]=d.value;}
 if(result.version!==1||result.lengthUnit!=='inch')throw Error('Unsupported display-unit metadata.');
 return Object.freeze(result);
}
const dimensions=Object.freeze({length:{power:1,canonical:'millimeter',metric:'millimeter',imperial:'inch',metricSymbol:'mm',imperialSymbol:'in'},area:{power:2,canonical:'square-millimeter',metric:'square-millimeter',imperial:'square-inch',metricSymbol:'mm²',imperialSymbol:'in²'},volume:{power:3,canonical:'cubic-millimeter',metric:'cubic-millimeter',imperial:'cubic-inch',metricSymbol:'mm³',imperialSymbol:'in³'}});
export function formatDisplayQuantity(canonicalValue,dimension,presentation=null,digits=2){
 if(typeof canonicalValue!=='number'||!Number.isFinite(canonicalValue)||!Number.isInteger(digits)||digits<0||digits>12)throw Error('Invalid display quantity.');
 const inch=presentation!==null&&(captureDisplayUnitsMetadata(presentation).lengthUnit==='inch');let value,unit,canonicalUnit,symbol;
 if(dimension==='angle'){value=canonicalValue/RADIANS_PER_DEGREE;unit='degree';canonicalUnit='radian';symbol='°';}
 else{if(typeof dimension!=='string'||!Object.hasOwn(dimensions,dimension))throw Error('Unsupported display dimension.');const d=dimensions[dimension];value=inch?canonicalValue/MILLIMETERS_PER_INCH**d.power:canonicalValue;unit=inch?d.imperial:d.metric;canonicalUnit=d.canonical;symbol=inch?d.imperialSymbol:d.metricSymbol;}
 if(!Number.isFinite(value)||canonicalValue!==0&&value===0)throw Error('Display quantity is outside the representable range.');
 return Object.freeze({canonicalValue,canonicalUnit,value,unit,text:value.toFixed(digits)+(dimension==='angle'?'':' ')+symbol});
}
