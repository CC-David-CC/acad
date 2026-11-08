import {verifyTypedSignedCoordinateTravel} from './typedSignedCoordinateTravel';
import {classifyFixedEntityDelta,verifyFixedEntityTravel} from './fixedEntityTransition';
import {classifyDrivingDimensionDelta} from './drivingDimensionTarget.mjs';
import {verifyDrivingDimension} from './drivingDimensionTransition';
import {coordinateTravelPoints,verifyCoordinateTravel} from './coordinateTravel';
import {failureCause} from '../constr/admissionCause.mjs';
// Worker-only dispatch. A malformed/unsupported metadata edit never falls
// through as a geometry operation, and no caller permission flag is accepted.
export function verifyTypedSketchTravel(request:any){const revision=typeof request?.revision==='string'?request.revision:'';try{
 const keys=['revision','sketchJSON','candidateJSON','externalParameters'];
 if(!request||typeof request!=='object'||Array.isArray(request)||Reflect.ownKeys(request).length!==keys.length||keys.some(k=>!Object.getOwnPropertyDescriptor(request,k)?.enumerable||!Object.hasOwn(Object.getOwnPropertyDescriptor(request,k),'value'))||!revision||revision.length>256||[request.sketchJSON,request.candidateJSON].some(v=>typeof v!=='string'||v.length>1048576||new TextEncoder().encode(v).byteLength>1048576))throw Object.assign(Error('Invalid typed sketch journal source pair.'),{code:'INVALID_CANDIDATE'});
 const before=JSON.parse(request.sketchJSON),after=JSON.parse(request.candidateJSON);if(classifyFixedEntityDelta(before,after))return verifyFixedEntityTravel(request);const delta=classifyDrivingDimensionDelta(before,after,coordinateTravelPoints(before),coordinateTravelPoints(after));
 // Creation/removal of a numeric signed coordinate may move its genuine
 // free component. Prove the original forward insertion as well as retaining
 // the existing removal proof; numerical removal is not a geometric inverse.
 if(delta&&['SignedDistanceX','SignedDistanceY'].includes(delta.typeId)&&['insert','remove'].includes(delta.action))return verifyTypedSignedCoordinateTravel(request,delta);
 return delta?verifyDrivingDimension(request,true):verifyCoordinateTravel(request);
 }catch(error){const cause=failureCause(error);return{revision,ok:false as const,error:{code:typeof error?.code==='string'?error.code.slice(0,64):'INVALID_CANDIDATE',message:typeof error?.message==='string'?error.message.slice(0,512):'Unsupported typed sketch journal delta.',...(cause?{cause}:{})}};}}
