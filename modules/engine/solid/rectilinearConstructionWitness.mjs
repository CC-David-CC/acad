// Data-only capture, not a source-authority factory. The actual private ledger
// alone may issue a verified Native box-subtract construction observation.
import {captureBoxConstructionWitness} from './boxConstructionWitness.mjs';
import {solidBodyId} from './solidIntent.mjs';
import {requireManufacturingMeshBuild} from '../mount/selectedProfileBuildSelection.mjs';
const fail=message=>{throw Object.assign(Error(message),{code:'SOURCE_BINDING_MISMATCH'});};
function fields(value,names){
 if(!value||typeof value!=='object'||Array.isArray(value)||![null,Object.prototype].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==names.length)fail('Expected exact construction data.');
 const out={};for(const name of names){const d=Object.getOwnPropertyDescriptor(value,name);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Construction fields must be own data.');out[name]=d.value;}return out;
}
function vector(value){
 if(!Array.isArray(value)||value.length!==3||Reflect.ownKeys(value).length!==4)fail('Expected bounded Native bounds.');
 return Object.freeze([0,1,2].map(i=>{const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value)||Math.abs(d.value)>1e9)fail('Invalid Native bound.');return d.value;}));
}
export function captureBoxSubtractConstruction(value,expected=undefined){
 const v=fields(value,['version','kind','unit','engine','engineRevision','bodyId','featureId','operation','a','b','native']);
 if(v.version!==1||v.kind!=='authored-box-subtract'||v.unit!=='millimeter'||v.engine!=='occ'||typeof v.engineRevision!=='string'||v.bodyId!==solidBodyId(v.featureId)||v.operation!=='subtract')fail('Invalid actual subtract identity.');
 requireManufacturingMeshBuild(v.engine,v.engineRevision);
 const a=captureBoxConstructionWitness(v.a),b=captureBoxConstructionWitness(v.b);
 if(a.engine!==v.engine||b.engine!==v.engine||a.engineRevision!==v.engineRevision||b.engineRevision!==v.engineRevision||a.bodyId===b.bodyId||a.featureId===b.featureId||[a.featureId,b.featureId].includes(v.featureId))fail('Subtract sources differ from their actual producer.');
 const native=fields(v.native,['volume','bounds']),bounds=fields(native.bounds,['min','max']);
 if(typeof native.volume!=='number'||!Number.isFinite(native.volume)||native.volume<=0)fail('Missing positive actual Native measurement.');
 const min=vector(bounds.min),max=vector(bounds.max);if(min.some((x,i)=>x>=max[i]))fail('Invalid actual Native extent.');
 if(expected!==undefined){const e=fields(expected,['bodyId','featureId','engine','engineRevision']);for(const k of Object.keys(e))if(v[k]!==e[k])fail('Subtract construction differs from current artifact.');}
 return Object.freeze({...v,a,b,native:Object.freeze({volume:native.volume,bounds:Object.freeze({min,max})})});
}
export function captureManufacturingConstruction(value,expected=undefined){
 const d=value&&typeof value==='object'?Object.getOwnPropertyDescriptor(value,'kind'):null;
 if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Expected construction discriminator data.');
 if(d.value==='authored-axis-aligned-box')return captureBoxConstructionWitness(value,expected);
 if(d.value==='authored-box-subtract')return captureBoxSubtractConstruction(value,expected);
 fail('Unqualified manufacturing source construction.');
}

