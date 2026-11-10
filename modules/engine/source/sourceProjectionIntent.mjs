import {canonicalAuthoredFeatureId as fid} from '../metadata/authoredFeatureIdentity.mjs';
import {sourceFrameRecord as record} from './sourceFrameIntent.mjs';
export const SOURCE_PROJECTION_TYPE='SOURCE_PROJECTION_V1';
export const SOURCE_PROJECTION_LIMITS=Object.freeze({roots:16,sources:64,sourceBytes:65536,history:256,retainedCharacters:32768,replyBytes:65536});
export const projectionFail=(code,message)=>{throw Object.assign(Error(message),{code});};
export function projectionId(value){if(typeof value!=='string'||!value||value.length>256||/[\u0000-\u001f\u007f]/u.test(value))projectionFail('INVALID_PROJECTION','Expected a bounded actual projection identity.');return value;}
export function projectionArray(value,minimum=1,maximum=16){if(!Array.isArray(value)||value.length<minimum||value.length>maximum||Reflect.ownKeys(value).length!==value.length+1)projectionFail('INVALID_PROJECTION','Expected a bounded dense projection array.');return Array.from({length:value.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))projectionFail('INVALID_PROJECTION','Projection entries must be own data.');return d.value;});}
export function captureSourceProjection(value){
 const p=record(value,['version','unit','featureId','source','target','outputs'],'INVALID_PROJECTION');
 if(p.version!==1||p.unit!=='millimeter')projectionFail('INVALID_PROJECTION','Expected version1 millimeter projection intent.');p.featureId=fid(p.featureId);
 const s=record(p.source,['featureId','faceId','objectIds'],'INVALID_PROJECTION');s.featureId=fid(s.featureId);s.faceId=projectionId(s.faceId);s.objectIds=Object.freeze(projectionArray(s.objectIds).map(projectionId));
 if(s.featureId===p.featureId||new Set(s.objectIds).size!==s.objectIds.length)projectionFail('INVALID_PROJECTION','Projection requires an earlier source and unique actual source objects.');p.source=Object.freeze(s);
 const t=record(p.target,['plane','depth'],'INVALID_PROJECTION');if(t.plane!=='XY'||t.depth!==0||Object.is(t.depth,-0))projectionFail('INVALID_PROJECTION','Projection target is principal XY at exact z0.');p.target=Object.freeze(t);
 const seen=new Set();p.outputs=Object.freeze(projectionArray(p.outputs).map((value,i)=>{const r=record(value,['sourceObjectId','referenceId'],'INVALID_PROJECTION');r.sourceObjectId=projectionId(r.sourceObjectId);r.referenceId=projectionId(r.referenceId);if(r.sourceObjectId!==s.objectIds[i]||seen.has(r.referenceId))projectionFail('INVALID_PROJECTION','Projection outputs must bind each actual source once in selected order.');seen.add(r.referenceId);return Object.freeze(r);}));
 if(p.outputs.length!==s.objectIds.length)projectionFail('INVALID_PROJECTION','Projection source/output census differs.');return Object.freeze(p);
}
export function projectionSourceText(value){if(typeof value!=='string'||!value||value.length>SOURCE_PROJECTION_LIMITS.sourceBytes||new TextEncoder().encode(value).byteLength>SOURCE_PROJECTION_LIMITS.sourceBytes)projectionFail('RESOURCE_LIMIT','Projection source exceeds64KiB.');return value;}
export const SOURCE_PROJECTION_CODES=Object.freeze(['INVALID_PROJECTION','PROJECTION_REFERENCE_MISSING','PROJECTION_REFERENCE_TYPE','PROJECTION_REFERENCE_GENERATED','PROJECTION_SOURCE_UNAVAILABLE','PROJECTION_FRAME_MISMATCH','PROJECTION_CIRCLE_FRAME_UNQUALIFIED','PROJECTION_COLLAPSED_SEGMENT','PROJECTION_COORDINATE_UNQUALIFIED','PROJECTION_CACHE_MISMATCH','PROJECTION_DEPENDENCY','PROJECTION_REFERENCE_READONLY','PROJECTION_PUBLICATION_FAILED','STALE_SOURCE','INVALID_WORKSPACE','RESOURCE_LIMIT']);
