// Semantic Worker only. Source hash/parse/region ownership are shared with the
// genuine depth-free face path; discovery never supplies a fictitious height.
import {captureSolvedPolygonSource,prepareSolvedPolygonSourceFace,describeSolvedPolygonSourceRegion} from './selectedSketchProfile.mjs';
import {captureProfileExtent} from '../solid/ownedProfileExtentFeature.mjs';
import {prepareOwnedProfileExtent} from '../mount/ownedProfileExtentPlan.mjs';
const fail=(message,code='INVALID_REQUEST')=>{throw Object.assign(Error(message),{code});};
const freeze=value=>{if(value&&typeof value==='object'){for(const item of Object.values(value))freeze(item);Object.freeze(value);}return value;};
function fields(value,keys){if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==keys.length)fail('Expected exact extent semantic data.');const r={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Extent semantic fields must be own data.');r[key]=d.value;}return r;}
export async function inspectSolvedProfileExtentRegions(input){
 const context=await captureSolvedPolygonSource(input,false),r=context.r;
 const regions=context.regions.map(region=>{
  const regionId='sketch-region:'+JSON.stringify(region),descriptor=describeSolvedPolygonSourceRegion(context,region);
  try{prepareSolvedPolygonSourceFace(context,regionId);return{regionId,support:'supported',reason:null,descriptor};}
  catch(error){if(!['INVALID_REQUEST','INVALID_FRAME','INVALID_PROFILE','UNSUPPORTED_PROFILE','UNSUPPORTED_REGION_TOPOLOGY','OPEN_OR_AMBIGUOUS_PROFILE','PROFILE_BELOW_RESOLUTION'].includes(error?.code))throw error;return{regionId,support:'unsupported',reason:{code:error.code,message:error.message},descriptor};}
 });
 return freeze({binding:{revision:r.revision,sketchDigest:r.sketchDigest,faceId:r.faceId},regions});
}
export async function prepareSolvedProfileExtent(input){
 const r=fields(input,['profile','featureId','authoredExtent','extent']);
 if(!Number.isSafeInteger(r.featureId)||r.featureId<1)fail('An actual authored extent feature identity is required.');
 // Capture both variants before source digest suspension; no caller alias may
 // change typed binding or mode between original-source and construction proof.
 const authoredExtent=captureProfileExtent(r.authoredExtent),extent=captureProfileExtent(r.extent,{numeric:true});
 const context=await captureSolvedPolygonSource(r.profile,true),source=context.r;
 const face=prepareSolvedPolygonSourceFace(context,source.regionId);
 const prepared=await prepareOwnedProfileExtent({op:'solid.profile.extrude.extents',version:1,unit:'millimeter',source:{featureId:r.featureId,faceId:source.faceId,sourceSha256:source.sketchDigest},authoredExtent,extent,frame:face.request.frame,region:face.request.region});
 return freeze({binding:{revision:source.revision,sketchDigest:source.sketchDigest,faceId:source.faceId,regionId:source.regionId},extentBinding:prepared.binding,request:prepared.request,expected:prepared.expected});
}
