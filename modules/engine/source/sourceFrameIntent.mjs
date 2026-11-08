// Bounded metadata only. Disposable sketch Workers derive numerical frames.
import {canonicalAuthoredFeatureId} from '../../../web/app/cad/craft/authoredFeatureIdentity.mjs';
export const SOURCE_FRAME_TYPE='SOURCE_FRAME_V1';
export const sourceFrameFail=(code,message)=>{throw Object.assign(Error(message),{code});};
export function sourceFrameRecord(value,keys,code='INVALID_SOURCE_FRAME'){
 const p=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
 if(!value||typeof value!=='object'||Array.isArray(value)||(p!==null&&Object.getPrototypeOf(p)!==null)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))sourceFrameFail(code,'Expected exact source-frame data.');
 const r={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(value,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))sourceFrameFail(code,'Source-frame fields must be own data.');r[k]=d.value;}return r;
}
export function sourceFrameVector(value,limit=1e8){
 if(!Array.isArray(value)||value.length!==3||Reflect.ownKeys(value).length!==4)sourceFrameFail('INVALID_SOURCE_FRAME','Expected a dense three-coordinate vector.');
 return Object.freeze([0,1,2].map(i=>{const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value)||Math.abs(d.value)>limit)sourceFrameFail('INVALID_SOURCE_FRAME','Source-frame coordinates must be bounded finite numbers.');return d.value;}));
}
export function captureSourceFrame(value){const r=sourceFrameRecord(value,['origin','x','y','z']);return Object.freeze(Object.fromEntries(Object.keys(r).map(k=>[k,sourceFrameVector(r[k],k==='origin'?1e8:2)])));}
export function captureSourceFramePlacement(value){
 const d=value&&Object.getOwnPropertyDescriptor(value,'kind'),kind=d?.value;
 const p=sourceFrameRecord(value,kind==='basis'?['kind','frame']:['kind','frame','axis','angleDegrees','pivot','translation']);
 if(!['basis','rigid'].includes(kind))sourceFrameFail('INVALID_SOURCE_FRAME','Select an explicit basis or one rigid placement.');p.frame=captureSourceFrame(p.frame);
 if(kind==='rigid'){p.axis=sourceFrameVector(p.axis);p.pivot=sourceFrameVector(p.pivot);p.translation=sourceFrameVector(p.translation);if(typeof p.angleDegrees!=='number'||!Number.isFinite(p.angleDegrees)||Math.abs(p.angleDegrees)>360)sourceFrameFail('INVALID_SOURCE_FRAME','Rotation is bounded to signed360 degrees.');}
 return Object.freeze(p);
}
export function captureSourceFrameParent(value){if(value===null)return null;const p=sourceFrameRecord(value,['featureId','faceId']),id=canonicalAuthoredFeatureId(p.featureId);if(!id||typeof p.faceId!=='string'||!p.faceId||p.faceId.length>256)sourceFrameFail('INVALID_FRAME_DEPENDENCY','Use an actual earlier source-plane identity.');return Object.freeze({featureId:id,faceId:p.faceId});}
export function captureSourceFrameParameters(value){const p=sourceFrameRecord(value,['version','unit','featureId','parent','placement']);if(p.version!==1||p.unit!=='millimeter'||!canonicalAuthoredFeatureId(p.featureId))sourceFrameFail('INVALID_SOURCE_FRAME','Expected version1 canonical millimeter source identity.');p.parent=captureSourceFrameParent(p.parent);p.placement=captureSourceFramePlacement(p.placement);if(p.parent?.featureId===canonicalAuthoredFeatureId(p.featureId))sourceFrameFail('INVALID_FRAME_DEPENDENCY','A source cannot parent itself.');return Object.freeze(p);}
export function sourceFrameText(value){if(typeof value!=='string'||!value||value.length>65536||new TextEncoder().encode(value).byteLength>65536)sourceFrameFail('RESOURCE_LIMIT','Source-frame sketch exceeds64KiB.');return value;}
