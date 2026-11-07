// Persistent authored relationships only; no runtime handles or coordinates.
import {validateCenteredHoleTarget} from './centeredHoleIntent.mjs';
const fail=()=>{throw Object.assign(new Error('Invalid four-corner hole intent.'),{code:'INVALID_HOLE_INTENT'});};
function fields(value,keys){
 if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==keys.length)fail();
 const out={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(value,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail();out[k]=d.value;}
 if(Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))fail();return out;
}
const feature=v=>typeof v==='string'&&/^[1-9][0-9]{0,15}$/.test(v)&&Number.isSafeInteger(Number(v));
export function validateFourCornerHoleIntent(value){
 const input=fields(value,['version','kind','unit','featureId','centerFeatureId','target','sideIds','offsetX','offsetY','diameter','extent']);
 if(input.version!==1||input.kind!=='four-corner-through-holes'||input.unit!=='millimeter'||input.extent!=='through-all'||!feature(input.featureId)||!feature(input.centerFeatureId))fail();
 const target=validateCenteredHoleTarget(input.target);
 if(new Set([input.featureId,input.centerFeatureId,target.parentFeatureId]).size!==3)fail();
 const sideIds=fields(input.sideIds,['minX','maxX','minY','maxY']);
 const region=JSON.parse(target.regionId.slice('sketch-region:'.length));
 const sides=Object.values(sideIds);
 if(sides.some(v=>typeof v!=='string'||!region.outer.includes(v))||new Set(sides).size!==4)fail();
 for(const key of ['offsetX','offsetY','diameter'])if(!Number.isFinite(input[key])||input[key]<=0||input[key]>1e6)fail();
 return Object.freeze({...input,target,sideIds:Object.freeze(sideIds)});
}
