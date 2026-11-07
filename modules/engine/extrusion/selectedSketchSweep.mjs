// Dedicated semantic Worker seam. Both inputs must come from genuine solver
// results captured under one caller-owned document generation. A matching
// revision string alone is not proof of that ownership or of a valid solid.
import {captureSolvedPolygonSource,prepareSolvedPolygonSourceFace} from './selectedSketchProfile.mjs';
import {captureSolvedSweepPath} from './selectedSketchSweepPath.mjs';
import {prepareOwnedSweep} from '../mount/ownedSweepPlan.mjs';
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
function fields(value,keys){
 if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))fail('INVALID_REQUEST','Expected exact two-source sweep fields.');
 const r={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','Sweep source fields must be data.');r[key]=d.value;}return r;
}
export async function prepareSolvedSweep(input){
 const r=fields(input,['profile','path','transport']);
 if(r.transport!=='corrected-frenet')fail('INVALID_REQUEST','Select explicit corrected-Frenet transport.');
 const profile=fields(r.profile,['unit','engine','profileVersion','revision','sketchDigest','faceId','frame','sketchJSON','regionId']);
 const path=fields(r.path,['unit','revision','sketchDigest','faceId','frame','sketchJSON','pathCurves']);
 if(profile.revision!==path.revision||profile.unit!==path.unit)fail('STALE_SOURCE','Capture profile and path from one document state and unit.');
 // Start both captures before suspension; neither mutable frame/reference list
 // is read for the first time after the other source digest has completed.
 const captured=await Promise.all([captureSolvedPolygonSource(profile,true),captureSolvedSweepPath(path)]);
 const context=captured[0],spine=captured[1],face=prepareSolvedPolygonSourceFace(context,profile.regionId);
 const curves=spine.objects.map((object,index)=>({kind:object.type==='Segment'?'segment':'arc',id:object.id,
  a:[object.data.a.x,object.data.a.y],b:[object.data.b.x,object.data.b.y],
  ...(object.type==='Arc'?{c:[object.data.c.x,object.data.c.y]}:{}),reversed:spine.binding.pathCurves[index].reversed}));
 const prepared=await prepareOwnedSweep({op:'solid.profile.sweep',version:1,unit:'millimeter',source:{faceId:context.r.faceId,sourceSha256:context.r.sketchDigest},
  frame:face.frame,region:face.request.region,path:{source:{faceId:spine.binding.faceId,sourceSha256:spine.binding.sketchDigest},frame:spine.frame,curves},transport:r.transport});
 return{binding:{revision:profile.revision,faceId:profile.faceId,sketchDigest:profile.sketchDigest,regionId:profile.regionId,
  pathFaceId:path.faceId,pathDigest:path.sketchDigest,pathCurves:spine.binding.pathCurves,transport:r.transport},request:prepared.request,sweepBinding:prepared.binding};
}
