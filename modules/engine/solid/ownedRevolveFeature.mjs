// Saved design definition and separate ephemeral evaluator input. Native
// handles, solved curves, frames and digests never belong to saved parameters.
import {captureOwnedRevolveIntent} from './ownedRevolveIntent.mjs';
const fail=message=>{throw Object.assign(Error(message),{code:'INVALID_REQUEST'});};
const savedKeys=['version','unit','engine','engineRevision','featureId','faceId','regionId','axisSegmentId','angleRadians','bodyPolicy'];
function fields(v,keys){if(!v||typeof v!=='object'||Array.isArray(v)||![Object.prototype,null].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length||Reflect.ownKeys(v).some(k=>typeof k!=='string'||!keys.includes(k)))fail('Expected exact revolve feature fields.');const r=Object.create(null);for(const k of keys){const d=Object.getOwnPropertyDescriptor(v,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Revolve feature fields must be own data.');r[k]=d.value;}return r;}
const text=(v,max)=>typeof v==='string'&&v.length>0&&v.length<=max;
function common(r){if(r.version!==1||r.unit!=='millimeter'||r.engine!=='occ'||typeof r.engineRevision!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(r.engineRevision)||!Number.isSafeInteger(r.featureId)||r.featureId<=0)fail('Expected an explicit OCC feature/build identity.');}
export function captureOwnedRevolveFeature(input){
 const r=fields(input,savedKeys);common(r);
 if(!text(r.faceId,256)||!text(r.regionId,8192)||!r.regionId.startsWith('sketch-region:')||!text(r.axisSegmentId,256)||r.bodyPolicy!=='separate')fail('Expected an owned source face, opaque region and source Segment axis.');
 if(typeof r.angleRadians!=='number'||!Number.isFinite(r.angleRadians)||r.angleRadians===0||Math.abs(r.angleRadians)>2*Math.PI)throw Object.assign(Error('Expected nonzero signed radians with magnitude at most2π.'),{code:'REVOLVE_INVALID_ANGLE'});
 return Object.freeze(r);
}
export function captureOwnedRevolveEvaluation(input){
 const r=fields(input,['version','unit','engine','engineRevision','featureId','revolve']);common(r);r.revolve=captureOwnedRevolveIntent(r.revolve);return Object.freeze(r);
}
// Read-only locator corroboration against the real solver's serialized native
// object. No child-ID synthesis or coordinate-dependent identity selection.
export function captureRevolveSourceAxis(sketch,axisSegmentId){
 if(!sketch||!Array.isArray(sketch.objects)||sketch.objects.length>4096)fail('Expected a bounded solved object inventory.');
 const found=sketch.objects.filter(o=>o?.id===axisSegmentId);
 if(found.length!==1||found[0].type!=='Segment'||found[0].stage!==0||![null,'construction'].includes(found[0].role))throw Object.assign(Error('The selected source Segment is unavailable.'),{code:'STALE_AXIS'});
 const o=found[0],d=fields(o.data,['a','b']),point=v=>{const p=fields(v,['x','y']);if(![p.x,p.y].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e6))throw Object.assign(Error('Axis endpoints exceed the source adapter domain.'),{code:'REVOLVE_INVALID_AXIS'});return Object.freeze([p.x,p.y]);};
 return Object.freeze({axisSegmentId:o.id,role:o.role,stage:o.stage,a:point(d.a),b:point(d.b)});
}
