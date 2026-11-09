// Worker-only. The original selected face is authored source; the placed face
// and positive height below are private inputs to ONE existing Native V3 prism.
import {capturePolygonProfileFaceRequest} from './selectedProfilePlan.mjs';
import {preparePolygonProfileFace} from './polygonProfilePlan.mjs';
import {captureProfileExtent,profileExtentFields,profileExtentInterval} from '../solid/ownedProfileExtentFeature.mjs';
export const PROFILE_EXTENT_REFUSALS=Object.freeze(['INVALID_REQUEST','INVALID_FRAME','INVALID_PROFILE','UNSUPPORTED_PROFILE','UNSUPPORTED_REGION_TOPOLOGY','PROFILE_BELOW_RESOLUTION','OPEN_OR_AMBIGUOUS_PROFILE','ZERO_LENGTH_EDGE','OVERLAPPING_EDGES','SELF_INTERSECTION','SELF_TOUCHING_BOUNDARY','ZERO_AREA_PROFILE','UNREPRESENTABLE_AREA','RESOURCE_LIMIT','PROFILE_EXTENT_UNREPRESENTABLE','PROFILE_EXTENT_CONSTRUCTION_FAILED']);
export const PROFILE_EXTENT_OPERATION=Object.freeze({id:'solid.profile.extrude.extents',version:1,input:'source-owned-profile-extents-mm-v1',output:'oci-shape-result-v1',nativeProfileVersion:3,nativeResultCost:1,variants:Object.freeze(['one-sided','symmetric','two-sided']),capRoles:Object.freeze(['lower-cap','upper-cap']),qualification:'workflow-unqualified'});
const fail=(message,code='INVALID_REQUEST')=>{throw Object.assign(Error(message),{code});};
function fields(value,keys){
 if(!value||typeof value!=='object'||Array.isArray(value)||![null,Object.prototype].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length)fail('Expected exact profile-extent preparation fields.');
 const r={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Profile-extent preparation must be own data.');r[key]=d.value;}return r;
}
const freeze=value=>{if(value&&typeof value==='object'){for(const item of Object.values(value))freeze(item);Object.freeze(value);}return value;};
const hex=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const identity=(value,max)=>typeof value==='string'&&value.length>0&&value.length<=max;
export function captureProfileExtentIntent(input){
 const r=fields(input,['op','version','unit','source','authoredExtent','extent','frame','region']);
 if(r.op!=='solid.profile.extrude.extents'||r.version!==1||r.unit!=='millimeter')fail('Unsupported profile-extent operation.');
 r.source=fields(r.source,['featureId','faceId','sourceSha256']);
 if(!Number.isSafeInteger(r.source.featureId)||r.source.featureId<1||!identity(r.source.faceId,256)||!hex(r.source.sourceSha256))fail('Actual feature, source face and solved source digest are required.');
 r.authoredExtent=captureProfileExtent(r.authoredExtent);r.extent=captureProfileExtent(r.extent,{numeric:true});
 if(r.authoredExtent.extent!==r.extent.extent||profileExtentFields(r.extent).some(key=>typeof r.authoredExtent[key]==='number'&&!Object.is(r.authoredExtent[key],r.extent[key])))fail('Resolved extents differ from their actual authored literals.');
 const face=capturePolygonProfileFaceRequest({version:1,unit:r.unit,frame:r.frame,region:r.region});
 if(!face.region.id.startsWith('sketch-region:'))fail('Select an actual opaque source region.');
 if(Object.hasOwn(face.region,'boundaryProvenance'))fail('Extent extrusion currently requires whole ordinary source boundaries.','UNSUPPORTED_PROFILE');
 r.frame=face.frame;r.region=face.region;return freeze(r);
}
export function captureProfileExtentBinding(input){
 const r=fields(input,['version','featureId','faceId','sourceSha256','regionId','requestSha256','authoredExtent','extent','interval']);
 if(r.version!==1||!Number.isSafeInteger(r.featureId)||r.featureId<1||!identity(r.faceId,256)||!identity(r.regionId,8192)||!r.regionId.startsWith('sketch-region:')||!hex(r.sourceSha256)||!hex(r.requestSha256))fail('Invalid profile-extent result binding.');
 r.authoredExtent=captureProfileExtent(r.authoredExtent);r.extent=captureProfileExtent(r.extent,{numeric:true});
 const keys=profileExtentFields(r.extent);
 if(r.extent.extent!==r.authoredExtent.extent||keys.some(key=>typeof r.authoredExtent[key]==='number'&&!Object.is(r.authoredExtent[key],r.extent[key])))fail('Invalid resolved profile-extent binding.');
 r.interval=fields(r.interval,['lower','upper','span','sourcePlane']);
 // Scalar association only; geometry/derivation is independently repeated in
 // the semantic/native Workers. Main never derives a translated source frame.
 if(![r.interval.lower,r.interval.upper,r.interval.span].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e6)||!(r.interval.upper>r.interval.lower)||!(r.interval.span>0)||!['lower-boundary','upper-boundary','interior'].includes(r.interval.sourcePlane))fail('Invalid bounded construction interval binding.');
 return freeze(r);
}
export function sameProfileExtentBinding(a,b){
 const x=captureProfileExtentBinding(a),y=captureProfileExtentBinding(b);
 const same=(left,right)=>{if(Object.is(left,right))return true;if(!left||!right||typeof left!=='object'||typeof right!=='object')return false;const keys=Object.keys(left);return keys.length===Object.keys(right).length&&keys.every(key=>Object.hasOwn(right,key)&&same(left[key],right[key]));};
 return same(x,y);
}
export function captureProfileExtentEvaluation(input){
 const r=fields(input,['version','unit','engine','engineRevision','featureId','profileExtent','extentBinding']);
 if(r.version!==1||r.unit!=='millimeter'||r.engine!=='occ'||typeof r.engineRevision!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(r.engineRevision)||!Number.isSafeInteger(r.featureId)||r.featureId<1)fail('An explicit OCC millimeter extent evaluation is required.');
 r.profileExtent=captureProfileExtentIntent(r.profileExtent);r.extentBinding=captureProfileExtentBinding(r.extentBinding);
 const source=r.profileExtent.source,binding=r.extentBinding;
 if(r.featureId!==source.featureId||binding.featureId!==source.featureId||binding.faceId!==source.faceId||binding.sourceSha256!==source.sourceSha256||binding.regionId!==r.profileExtent.region.id)fail('Profile-extent evaluation changed its original source identities.');
 for(const field of ['authoredExtent','extent']){
  if(binding[field].extent!==r.profileExtent[field].extent||profileExtentFields(binding[field]).some(key=>!Object.is(binding[field][key],r.profileExtent[field][key])))fail('Profile-extent evaluation changed its actual authored/resolved variant.');
 }
 return freeze(r);
}
function bounds(face,frame,lower,upper){
 const world=(p,t)=>frame.origin.map((n,i)=>n+frame.x[i]*p[0]+frame.y[i]*p[1]+frame.z[i]*t),outer=face.loops[0];let min,max;
 if(outer.kind==='polygon'){
  const points=outer.vertices.flatMap(p=>[world(p,lower),world(p,upper)]);
  min=[0,1,2].map(i=>Math.min(...points.map(p=>p[i])));max=[0,1,2].map(i=>Math.max(...points.map(p=>p[i])));
 }else{
  const center=world(outer.center,0),radial=[0,1,2].map(i=>outer.radius*Math.hypot(frame.x[i],frame.y[i]));
  min=center.map((n,i)=>n-radial[i]+Math.min(frame.z[i]*lower,frame.z[i]*upper));max=center.map((n,i)=>n+radial[i]+Math.max(frame.z[i]*lower,frame.z[i]*upper));
 }
 if([...min,...max].some(n=>!Number.isFinite(n)||Math.abs(n)>4e6))fail('Extent geometry exceeds the existing Native world domain.','INVALID_PROFILE');
 return {min,max};
}
export async function prepareOwnedProfileExtent(input,expectedRequestSha256){
 // Detach every caller array BEFORE the first suspension. Both the digest
 // and Native values derive from this immutable capture, never a reread.
 const request=captureProfileExtentIntent(input),encoded=new TextEncoder().encode(JSON.stringify(request));
 if(encoded.byteLength>1048576)fail('Profile-extent request exceeds its Worker byte budget.','RESOURCE_LIMIT');
 if(expectedRequestSha256!==undefined&&!hex(expectedRequestSha256))fail('Invalid independent profile-extent request digest.');
 const digest=await crypto.subtle.digest('SHA-256',encoded),requestSha256=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
 if(expectedRequestSha256!==undefined&&requestSha256!==expectedRequestSha256)fail('Profile-extent input changed from independent semantic preparation.','PROFILE_EXTENT_INPUT_CHANGED');
 const originalFace=preparePolygonProfileFace({version:1,unit:request.unit,frame:request.frame,region:request.region});
 const interval=profileExtentInterval(request.extent),sourcePlane=interval.lower===0?'lower-boundary':interval.upper===0?'upper-boundary':'interior';
 const workingFrame={...originalFace.frame,origin:originalFace.frame.origin.map((n,i)=>n+originalFace.frame.z[i]*interval.lower)};
 if(workingFrame.origin.some(n=>!Number.isFinite(n)||Math.abs(n)>4e6)||workingFrame.origin.every((n,i)=>Object.is(n,n+workingFrame.z[i]*interval.span)))fail('The private placed prism endpoints cannot be represented.','PROFILE_EXTENT_UNREPRESENTABLE');
 const expectedBounds=bounds(originalFace,originalFace.frame,interval.lower,interval.upper),workingBounds=bounds(originalFace,workingFrame,0,interval.span);
 // This is a conditioning guard on the actual private reparameterization,
 // using the existing Native incidence scale, not source-coordinate rounding.
 if(['min','max'].some(key=>expectedBounds[key].some((n,i)=>Math.abs(n-workingBounds[key][i])>1e-7)))fail('Private extent placement exceeds the Native incidence budget.','PROFILE_EXTENT_UNREPRESENTABLE');
 const volume=originalFace.area*interval.span;
 if(!Number.isFinite(volume)||!(volume>0))fail('Extent volume is not representable in the Native numeric domain.','PROFILE_EXTENT_UNREPRESENTABLE');
 const nativeValues=originalFace.nativeValues.slice();nativeValues[0]=interval.span;for(let i=0;i<3;i++)nativeValues[1+i]=workingFrame.origin[i];
 const binding=captureProfileExtentBinding({version:1,...request.source,regionId:request.region.id,requestSha256,authoredExtent:request.authoredExtent,extent:request.extent,interval:{...interval,sourcePlane}});
 return freeze({request,binding,originalFace,frame:workingFrame,depth:interval.span,loops:originalFace.loops,nativeValues,expected:{volume,bounds:expectedBounds}});
}
