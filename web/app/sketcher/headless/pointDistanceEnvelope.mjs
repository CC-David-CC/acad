import {captureSketchFailure} from '../constr/admissionCause.mjs';
import {drivingDimensionValueValid} from './drivingDimensionTarget.mjs';
const data=(v,keys)=>{if(!v||typeof v!=='object'||Array.isArray(v)||![Object.prototype,null].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length)throw Error('Invalid point distance data.');const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(v,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Point distance fields must be own data.');out[key]=d.value;}return out;};
export function capturePointDistanceIntent(value){
 const r=data(value,['ids','distance']),a=r.ids;if(!Array.isArray(a)||a.length!==2||Reflect.ownKeys(a).length!==3||!drivingDimensionValueValid('DistancePP',r.distance))throw Error('Choose two distinct points and Euclidean millimeters from0 to1,000,000.');
 const ids=[0,1].map(i=>{const d=Object.getOwnPropertyDescriptor(a,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='string'||!d.value||d.value.length>256)throw Error('Point distance IDs must be dense own data.');return d.value;});if(ids[0]===ids[1])throw Error('Point distance requires distinct actual point IDs.');return Object.freeze({ids:Object.freeze(ids),distance:r.distance});
}
// Cheap transport boundary only. Full bounded evidence and independent captured
// operation reconstruction remain in the transition coordinator/Workers.
export function capturePointDistanceEnvelope(value,revision){
 const ok=Object.getOwnPropertyDescriptor(value||{},'ok');if(!ok?.enumerable||!Object.hasOwn(ok,'value')||typeof ok.value!=='boolean')throw Error('Invalid point distance outcome.');
 const r=data(value,ok.value?['revision','ok','changed','serializedSketch','evidence','dimension']:['revision','ok','error']);if(r.revision!==revision)throw Error('Point distance response revision changed.');if(!r.ok)return Object.freeze({...r,error:captureSketchFailure(r.error)});
 if(typeof r.changed!=='boolean'||typeof r.serializedSketch!=='string'||r.serializedSketch.length>1048576||!Array.isArray(r.evidence)||r.evidence.length>10000)throw Error('Invalid point distance candidate.');
 const d=data(r.dimension,['typeId','objects','distance','status','stage','index']),intent=capturePointDistanceIntent({ids:d.objects,distance:d.distance});if(d.typeId!=='DistancePP'||!['accepted','redundant'].includes(d.status)||d.stage!==0||!Number.isSafeInteger(d.index)||d.index<0||d.index>=10000)throw Error('Invalid point distance identity.');r.dimension=Object.freeze({...d,objects:intent.ids});return Object.freeze(r);
}
