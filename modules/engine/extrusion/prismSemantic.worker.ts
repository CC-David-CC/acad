import {prepareSolvedProfileExtent,validateSolvedProfileExtent,inspectSolvedProfileExtentRegions} from './selectedSketchProfileExtent.mjs';
import {PROFILE_EXTENT_REFUSALS} from '../mount/ownedProfileExtentPlan.mjs';
import {prepareProfileConstructorSource} from './profileConstructorSourcePreparation.mjs';
import {prepareSolvedLoft,inspectSolvedLoftSources} from './selectedSketchLoft.mjs';
import {LOFT_PREPARATION_REFUSALS} from '../solid/ownedLoftIntent.mjs';
import {deriveRectanglePrismRoles} from 'engine/provenance/rectanglePrismRoles';
import {prepareRectangleExtrusion} from 'workbenches/modeler/features/extrude/rectangleProfileRequest.mjs';
import {discoverFourCornerSideIds} from '../mount/fourCornerSideIds.mjs';
import {prepareSolvedSelectedRegion,inspectSolvedSelectedRegions} from './selectedSketchProfile.mjs';
import {prepareSolvedRevolve,inspectSolvedRevolveSource} from './selectedSketchRevolve.mjs';
import {prepareSolvedSweep} from './selectedSketchSweep.mjs';
import {inspectSolvedSweepSources} from './selectedSketchSweepDiscovery.mjs';
import {SWEEP_PREPARATION_REFUSALS} from '../solid/ownedSweepIntent.mjs';
// Dedicated data-only Worker: no DOM, canvas, native pointers or model publish.
self.onmessage = async event => {
 const m=event.data,loftJob=m?.kind==='prepare-loft'||m?.kind==='inspect-loft';
 try {
  if(!m||typeof m.jobId!=='string'||m.jobId.length>128||loftJob&&!m.jobId)throw loftJob?Object.assign(Error('Invalid semantic job'),{code:'INVALID_REQUEST'}):Error('Invalid semantic job');
  if(['prepare-profile-extents','validate-profile-extents','inspect-profile-extent-regions'].includes(m.kind)){
   const prepare=m.kind!=='inspect-profile-extent-regions',key=prepare?'extent':'profile';
   if(!m.jobId||Object.keys(m).sort().join(',')!==['jobId','kind',key].sort().join(','))throw Object.assign(Error('Invalid profile-extent semantic job'),{code:'INVALID_REQUEST'});
   const value=await (prepare?(m.kind==='prepare-profile-extents'?prepareSolvedProfileExtent:validateSolvedProfileExtent)(m.extent):inspectSolvedProfileExtentRegions(m.profile));
   const reply={jobId:m.jobId,ok:true,value};
   if(new TextEncoder().encode(JSON.stringify(reply)).byteLength>65536)throw Object.assign(Error('Profile-extent reply exceeds the existing semantic budget'),{code:'RESOURCE_LIMIT'});
   self.postMessage(reply);return;
  }
  if(m.kind==='prepare-loft'||m.kind==='inspect-loft'){
   if(Object.keys(m).sort().join(',')!=='jobId,kind,loft')throw Object.assign(Error('Invalid loft semantic job'),{code:'INVALID_REQUEST'});
   const value=await (m.kind==='prepare-loft'?prepareSolvedLoft(m.loft):inspectSolvedLoftSources(m.loft));
   if(new TextEncoder().encode(JSON.stringify(value)).byteLength>65536)throw Object.assign(Error('Loft source response exceeds limit'),{code:'RESOURCE_LIMIT'});
   const reply={jobId:m.jobId,ok:true,value};
   if(new TextEncoder().encode(JSON.stringify(reply)).byteLength>65536)throw Object.assign(Error('Loft reply envelope exceeds limit'),{code:'RESOURCE_LIMIT'});
   self.postMessage(reply);return;
  }
  if(m.kind==='prepare-sweep'||m.kind==='inspect-sweep'){
   if(Object.keys(m).sort().join(',')!=='jobId,kind,sweep')throw Error('Invalid sweep semantic job');
   const value=await (m.kind==='prepare-sweep'?prepareSolvedSweep(m.sweep):inspectSolvedSweepSources(m.sweep));
   if(new TextEncoder().encode(JSON.stringify(value)).byteLength>65536)throw Object.assign(Error('Sweep source response exceeds limit'),{code:'RESOURCE_LIMIT'});
   self.postMessage({jobId:m.jobId,ok:true,value});return;
  }
  if(m.kind==='prepare-revolve'||m.kind==='inspect-revolve'){
   if(Object.keys(m).sort().join(',')!=='jobId,kind,profile')throw Error('Invalid revolve semantic job');
   const value=await (m.kind==='prepare-revolve'?prepareSolvedRevolve(m.profile):inspectSolvedRevolveSource(m.profile));
   if(new TextEncoder().encode(JSON.stringify(value)).byteLength>65536)throw Object.assign(Error('Revolve source response exceeds limit'),{code:'RESOURCE_LIMIT'});
   self.postMessage({jobId:m.jobId,ok:true,value});return;
  }
  if(m.kind==='prepare-selected-bound'){
   if(Object.keys(m).sort().join(',')!=='featureId,jobId,kind,profile')throw Error('Invalid bound constructor semantic job');
   const value=await prepareProfileConstructorSource(m.profile,m.featureId);
   if(new TextEncoder().encode(JSON.stringify(value)).byteLength>65536)throw Object.assign(Error('Bound constructor response exceeds limit'),{code:'RESOURCE_LIMIT'});
   self.postMessage({jobId:m.jobId,ok:true,value});return;
  }
  if(m.kind==='prepare-selected'||m.kind==='inspect-selected'){
   if(Object.keys(m).sort().join(',')!=='jobId,kind,profile')throw Error('Invalid selected-region semantic job');
   const value=await (m.kind==='prepare-selected'?prepareSolvedSelectedRegion(m.profile):inspectSolvedSelectedRegions(m.profile));
   if(new TextEncoder().encode(JSON.stringify(value)).byteLength>65536)throw Object.assign(Error('Selected-region response exceeds limit'),{code:'RESOURCE_LIMIT'});
   self.postMessage({jobId:m.jobId,ok:true,value});return;
  }
  if(m.kind==='prepare'){await prepareRectangleExtrusion(m.profile);self.postMessage({jobId:m.jobId,ok:true,value:true});return;}
  if(m.kind==='side-ids'){
   const prepared=await prepareRectangleExtrusion(m.profile);let value;
   try{value=discoverFourCornerSideIds(prepared);}catch(error){if(error?.code!=='UNSUPPORTED_PROFILE')throw error;}
   self.postMessage({jobId:m.jobId,ok:true,value});return;
  }
  if(m.kind!=='derive')throw Error('Unsupported semantic job');
  const roles=await deriveRectanglePrismRoles(m.featureId,m.profile,m.result);
  if(new TextEncoder().encode(JSON.stringify(roles)).byteLength>65536)throw Error('Semantic response exceeds limit');
  self.postMessage({jobId:m.jobId,ok:true,value:roles});
 } catch(error) { const allowed=['PROFILE_CONSTRUCTOR_BINDING_MISMATCH','INVALID_REQUEST','UNSUPPORTED_ENGINE','INVALID_FRAME','UNSUPPORTED_FRAME','STALE_SKETCH','INVALID_SKETCH','UNSUPPORTED_SKETCH','UNSUPPORTED_CONSTRAINT','STALE_FRAME','UNSUPPORTED_PROFILE','UNSUPPORTED_REGION_TOPOLOGY','RESOURCE_LIMIT','OPEN_OR_AMBIGUOUS_PROFILE','INVALID_PROFILE','STALE_REGION','STALE_SOURCE','STALE_SEAM','STALE_AXIS','REVOLVE_INVALID_AXIS','REVOLVE_INVALID_ANGLE','PROFILE_BELOW_RESOLUTION','ZERO_LENGTH_EDGE','OVERLAPPING_EDGES','SELF_INTERSECTION','SELF_TOUCHING_BOUNDARY','ZERO_AREA_PROFILE','UNREPRESENTABLE_AREA',...SWEEP_PREPARATION_REFUSALS,...LOFT_PREPARATION_REFUSALS,...PROFILE_EXTENT_REFUSALS];const code=allowed.includes(error?.code)?error.code:'PRISM_VALIDATION_FAILED';self.postMessage({jobId:loftJob?(typeof m?.jobId==='string'&&m.jobId.length<=128?m.jobId:undefined):m?.jobId,ok:false,code,error:String(error?.message||'Prism validation failed').slice(0,512)}); }
};
