import {captureOrthographicReadRequest,captureOrthographicReadResult,orthographicFrameValues,ORTHOGRAPHIC_NATIVE_CODES,ORTHOGRAPHIC_REFUSAL_CODES} from './ownedOrthographicReadProtocol.mjs';
import {captureStepExportRequest,captureStepExportResult,STEP_EXPORT_NATIVE_CODES,STEP_EXPORT_REFUSAL_CODES} from './ownedStepExportProtocol.mjs';
// Explicit component only; no catalog/default/part revision promotion.
import {capturePolygonProfileRequest} from './selectedProfilePlan.mjs';
import {captureOwnedRevolveIntent,bindOwnedRevolveIntent} from '../solid/ownedRevolveIntent.mjs';
import {captureOwnedSweepIntent,bindOwnedSweepIntent} from '../solid/ownedSweepIntent.mjs';
import {captureOwnedLoftIntent,ownedLoftBindingFields,captureOwnedLoftBinding,equalOwnedLoftBinding,LOFT_NATIVE_REFUSALS,LOFT_PREPARATION_REFUSALS} from '../solid/ownedLoftIntent.mjs';
import {createWorkerMount} from './worker-controller.mjs';
export function createOrthographicOccMount(options){
 return createWorkerMount(options,Object.freeze({engine:'occ-orthographic-v1-component',representation:'occ-brep-worker-owned',mesh:false,profile:false,
  selectedProfile:true,selectedProfileVersion:3,edgeTreatments:true,booleanHistory:true,throughHoles:true,linearHolePatterns:true,revolve:true,sweep:true,loft:true,adaptiveMetrology:true,stepExport:true,orthographicRead:true,captureOrthographicReadRequest,captureOrthographicReadResult,orthographicFrameValues,orthographicNativeCodes:ORTHOGRAPHIC_NATIVE_CODES,orthographicRefusalCodes:ORTHOGRAPHIC_REFUSAL_CODES,captureStepExportRequest,captureStepExportResult,stepNativeCodes:STEP_EXPORT_NATIVE_CODES,stepRefusalCodes:STEP_EXPORT_REFUSAL_CODES,
  captureSelectedProfile:capturePolygonProfileRequest,captureRevolve:captureOwnedRevolveIntent,bindRevolve:bindOwnedRevolveIntent,captureSweep:captureOwnedSweepIntent,bindSweep:bindOwnedSweepIntent,
  captureLoft:captureOwnedLoftIntent,loftBindingFields:ownedLoftBindingFields,captureLoftBinding:captureOwnedLoftBinding,sameLoftBinding:equalOwnedLoftBinding,loftNativeCodes:LOFT_NATIVE_REFUSALS,loftPreparationCodes:LOFT_PREPARATION_REFUSALS,
  jsSha256:'2f2e9f92b2b57024b372143c3f2f4aa3dc4999bad7f6636c36f0b0f599f04cb7',
  wasmSha256:'26d94303a8561b0922acae5b921f486e857083d8febaa9638d1ebd0eff590018'}));
}
