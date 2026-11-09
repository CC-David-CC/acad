export {MECHANICAL_NATIVE_INITIAL_PORTS} from '../mount/ownedMechanicalNativeResources.mjs';
// Dedicated semantic / OCI Worker only. Main imports the bounded protocol only.
import {prepareSolvedSelectedRegion} from './selectedSketchProfile.mjs';
import {preparePolygonProfileExtrusion} from '../mount/polygonProfilePlan.mjs';
import {PROFILE_CONSTRUCTOR_BINDING_RUNTIME,captureProfileConstructorSource,captureProfileConstructorBinding,captureBoundProfileConstructor,sameProfileConstructorBinding} from '../mount/profileConstructorSourceBinding.mjs';
const fail=message=>{throw Object.assign(Error(message),{code:'PROFILE_CONSTRUCTOR_BINDING_MISMATCH'});};
// Both inputs are already bounded detached own-data trees. Preserve signed
// zero and all numeric fields, rather than using JSON equality for this proof.
function sameData(a,b){if(Object.is(a,b))return true;if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;const x=Object.keys(a),y=Object.keys(b);return x.length===y.length&&x.every((key,i)=>key===y[i]&&sameData(a[key],b[key]));}
async function prepare(value,featureId){
 const source=captureProfileConstructorSource(value);if(!Number.isSafeInteger(featureId)||featureId<1)fail('Expected actual authored constructor identity.');
 // prepareSolvedSelectedRegion independently SHA-checks exact source bytes and
 // derives the selected request from that source and original frame/region.
 const prepared=await prepareSolvedSelectedRegion(source);if(prepared.request.version!==3)fail('This binding admits only the actual V3 constructor.');
 const native=preparePolygonProfileExtrusion(prepared.request),header=new TextEncoder().encode(JSON.stringify({domain:'codi-profile-constructor-input:1',runtime:PROFILE_CONSTRUCTOR_BINDING_RUNTIME,featureId,faceId:source.faceId,sourceSha256:source.sketchDigest,regionId:source.regionId,nativeVersion:3,nativeEncoding:'float64-le',nativeCount:native.nativeValues.length}));
 // Hash the exact Float64 input, including signed zero, not rounded JSON values.
 const payload=new Uint8Array(header.byteLength+1+native.nativeValues.length*8);payload.set(header);const view=new DataView(payload.buffer);native.nativeValues.forEach((value,i)=>view.setFloat64(header.byteLength+1+i*8,value,true));
 const requestSha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',payload)),b=>b.toString(16).padStart(2,'0')).join('');
 const sourceCreationBinding=captureProfileConstructorBinding({featureId,faceId:source.faceId,sourceSha256:source.sketchDigest,regionId:source.regionId,requestSha256});Object.freeze(native.nativeValues);return Object.freeze({value:Object.freeze({...prepared,sourceCreationBinding}),native});
}
export async function prepareProfileConstructorSource(value,featureId){return(await prepare(value,featureId)).value;}
export async function verifyProfileConstructorSource(value){const captured=captureBoundProfileConstructor(value),result=await prepare(captured.source,captured.sourceCreationBinding.featureId),prepared=result.value;if(!sameProfileConstructorBinding(prepared.sourceCreationBinding,captured.sourceCreationBinding)||!sameData(prepared.request,captured.request))fail('Independent constructor source/request digest differs.');return Object.freeze({source:captured.source,...prepared,native:result.native});}
