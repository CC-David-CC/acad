// Derived observation of an actual private ledger box publication. Capturing
// arbitrary serialized data does not authenticate a Native producer.
import {captureSolidBox,solidBodyId} from './solidIntent.mjs';
import {requireManufacturingMeshBuild} from '../mount/selectedProfileBuildSelection.mjs';
const fail=message=>{throw Object.assign(Error(message),{code:'SOURCE_BINDING_MISMATCH'});};
function fields(value,names){
 if(!value||typeof value!=='object'||Array.isArray(value)||![null,Object.prototype].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==names.length)fail('Expected exact box construction data.');
 const out={};for(const key of names){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Construction fields must be own data.');out[key]=d.value;}return out;
}
export function captureBoxConstructionWitness(value,expected=undefined){
 const v=fields(value,['version','kind','unit','engine','engineRevision','bodyId','featureId','origin','dimensions']);
 if(v.version!==1||v.kind!=='authored-axis-aligned-box'||v.unit!=='millimeter'||v.engine!=='occ'||typeof v.engineRevision!=='string'||v.bodyId!==solidBodyId(v.featureId))fail('Construction identity differs.');
 requireManufacturingMeshBuild(v.engine,v.engineRevision);
 const box=captureSolidBox({version:1,unit:v.unit,engine:v.engine,engineRevision:v.engineRevision,featureId:v.featureId,origin:v.origin,dimensions:v.dimensions});
 if(expected!==undefined){const e=fields(expected,['bodyId','featureId','engine','engineRevision']);for(const key of Object.keys(e))if(e[key]!==v[key])fail('Construction differs from the current artifact producer.');}
 return Object.freeze({...v,origin:box.origin,dimensions:box.dimensions});
}
