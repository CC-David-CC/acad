// Worker-only selected region + actual native Segment lookup from ONE solved
// source/frame. The caller must first obtain this source from the real solver.
import {captureSolvedPolygonSource,prepareSolvedPolygonSourceFace,describeSolvedPolygonSourceRegion} from './selectedSketchProfile.mjs';
import {prepareOwnedRevolve} from '../mount/ownedRevolvePlan.mjs';
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
function fields(v,keys){if(!v||typeof v!=='object'||Array.isArray(v)||Reflect.ownKeys(v).length!==keys.length||Reflect.ownKeys(v).some(k=>typeof k!=='string'||!keys.includes(k)))fail('INVALID_REQUEST','Expected exact source revolve preparation fields.');const r={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(v,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','Source revolve preparation must be data.');r[k]=d.value;}return r;}
const sourceKeys=['unit','engine','profileVersion','revision','sketchDigest','faceId','frame','sketchJSON'];
function axisData(object){
 const d=fields(object.data,['a','b']),point=v=>{const p=fields(v,['x','y']);if(![p.x,p.y].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e6))fail('REVOLVE_INVALID_AXIS','Axis endpoints exceed the source adapter domain.');return[p.x,p.y];};
 const a=point(d.a),b=point(d.b);if(a.every((n,i)=>n===b[i]))fail('REVOLVE_INVALID_AXIS','A source axis Segment must be nonzero.');return{kind:'source-segment',id:object.id,a,b};
}
export async function inspectSolvedRevolveSource(input){
 const p=fields(input,sourceKeys),context=await captureSolvedPolygonSource(p),r=context.r;
 const axes=context.sketch.objects.filter(o=>o.type==='Segment').map(o=>{try{const axis=axisData(o);return{axisSegmentId:o.id,role:o.role,stage:o.stage,a:axis.a,b:axis.b,supported:true,reason:null};}catch(e){if(e?.code!=='REVOLVE_INVALID_AXIS')throw e;return{axisSegmentId:o.id,role:o.role,stage:o.stage,supported:false,reason:{code:e.code,message:e.message}};}});
 const regions=context.regions.map(region=>{const regionId='sketch-region:'+JSON.stringify(region);prepareSolvedPolygonSourceFace(context,regionId);return{regionId,support:'supported',reason:null,descriptor:describeSolvedPolygonSourceRegion(context,region)};});
 return{binding:{revision:r.revision,sketchDigest:r.sketchDigest,faceId:r.faceId},axes,regions,qualification:'source-membership-only; selected profile and signed angle require native evaluation'};
}
export async function prepareSolvedRevolve(input){
 const p=fields(input,[...sourceKeys,'regionId','axisSegmentId','angleRadians']);
 if(typeof p.axisSegmentId!=='string'||!p.axisSegmentId||p.axisSegmentId.length>256)fail('INVALID_REQUEST','Choose a current actual source Segment identity.');
 const source=Object.fromEntries(sourceKeys.map(k=>[k,p[k]]));source.regionId=p.regionId;const context=await captureSolvedPolygonSource(source,true),r=context.r;
 const object=context.sketch.objects.find(o=>o.id===p.axisSegmentId);
 if(!object||object.type!=='Segment'||object.stage!==0||![null,'construction'].includes(object.role))fail('STALE_AXIS','The selected source Segment axis is unavailable.');
 const axis=axisData(object),face=prepareSolvedPolygonSourceFace(context,p.regionId),prepared=await prepareOwnedRevolve({op:'solid.profile.revolve',version:1,unit:r.unit,source:{faceId:r.faceId,sourceSha256:r.sketchDigest},frame:face.frame,region:face.request.region,axis,angleRadians:p.angleRadians});
 return{binding:{revision:r.revision,sketchDigest:r.sketchDigest,faceId:r.faceId,regionId:p.regionId,axisSegmentId:p.axisSegmentId,angleRadians:p.angleRadians},request:prepared.request,revolveBinding:prepared.binding};
}
