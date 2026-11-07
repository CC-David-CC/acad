// Worker-only two-source membership discovery. No native allocation/solve or
// attachment/transport/result claim. Each source is parsed and hashed once.
import {captureSolvedPolygonSource,prepareSolvedPolygonSourceFace,describeSolvedPolygonSourceRegion} from './selectedSketchProfile.mjs';
import {captureSolvedSweepPathSource,inspectCapturedSweepPath} from './selectedSketchSweepPath.mjs';
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
function fields(value,keys){if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))fail('INVALID_REQUEST','Expected exact sweep discovery fields.');const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','Sweep discovery fields must be data.');out[key]=d.value;}return out;}
function sourceLimit(value){if(typeof value!=='string')fail('INVALID_REQUEST','Expected source text.');if(value.length>65536||new TextEncoder().encode(value).byteLength>65536)fail('RESOURCE_LIMIT','Sweep discovery source exceeds64KiB UTF-8.');}
function freeze(value){if(value&&typeof value==='object'){for(const x of Object.values(value))freeze(x);Object.freeze(value);}return value;}
export const SWEEP_DISCOVERY_QUALIFICATION='source-membership-only; path ordering, attachment, transport and native result require evaluation';
export async function inspectSolvedSweepSources(input){
 const r=fields(input,['profile','path']),profile=fields(r.profile,['unit','engine','profileVersion','revision','sketchDigest','faceId','frame','sketchJSON']),path=fields(r.path,['unit','revision','sketchDigest','faceId','frame','sketchJSON']);
 if(profile.revision!==path.revision||profile.unit!==path.unit)fail('STALE_SOURCE','Capture both sweep sources from the same document state.');
 sourceLimit(profile.sketchJSON);sourceLimit(path.sketchJSON);
 // Both captures detach frames before either digest can complete. No loop
 // invokes the raw byte capture again for individual regions/candidates.
 const [context,spine]=await Promise.all([captureSolvedPolygonSource(profile,false),captureSolvedSweepPathSource(path)]);
 const regions=context.regions.map(region=>{
  const regionId='sketch-region:'+JSON.stringify(region),descriptor=describeSolvedPolygonSourceRegion(context,region);
  try{prepareSolvedPolygonSourceFace(context,regionId);return{regionId,support:'supported',reason:null,descriptor};}
  catch(error){if(!['INVALID_REQUEST','INVALID_FRAME','INVALID_PROFILE','UNSUPPORTED_PROFILE','OPEN_OR_AMBIGUOUS_PROFILE','PROFILE_BELOW_RESOLUTION','ZERO_LENGTH_EDGE','OVERLAPPING_EDGES','SELF_INTERSECTION','SELF_TOUCHING_BOUNDARY','ZERO_AREA_PROFILE','UNREPRESENTABLE_AREA'].includes(error?.code))throw error;return{regionId,support:'unsupported',reason:{code:error.code,message:String(error.message).slice(0,512)},descriptor};}
 });
 const value={profileBinding:{revision:context.r.revision,sketchDigest:context.r.sketchDigest,faceId:context.r.faceId},regions,pathBinding:spine.binding,pathCurves:inspectCapturedSweepPath(spine),qualification:SWEEP_DISCOVERY_QUALIFICATION};
 if(new TextEncoder().encode(JSON.stringify(value)).byteLength>65536)fail('RESOURCE_LIMIT','Sweep discovery response exceeds64KiB UTF-8; no rows were truncated.');
 return freeze(value);
}
