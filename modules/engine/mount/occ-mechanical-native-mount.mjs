import {MECHANICAL_NATIVE_CANDIDATE} from './ownedMechanicalNativeCandidate.mjs';
import {captureManufacturingMeshRequest,captureManufacturingMeshResult,MANUFACTURING_MESH_NATIVE_CODES,MANUFACTURING_MESH_REFUSAL_CODES} from './ownedManufacturingMeshProtocol.mjs';
import {captureOrthographicReadRequest,captureOrthographicReadResult,orthographicFrameValues,ORTHOGRAPHIC_NATIVE_CODES,ORTHOGRAPHIC_REFUSAL_CODES} from './ownedOrthographicReadProtocol.mjs';
import {captureStepExportRequest,captureStepExportResult,STEP_EXPORT_NATIVE_CODES,STEP_EXPORT_REFUSAL_CODES} from './ownedStepExportProtocol.mjs';
import {capturePolygonProfileRequest} from './selectedProfilePlan.mjs';
import {captureOwnedRevolveIntent,bindOwnedRevolveIntent} from '../solid/ownedRevolveIntent.mjs';
import {captureOwnedSweepIntent,bindOwnedSweepIntent} from '../solid/ownedSweepIntent.mjs';
import {captureOwnedLoftIntent,ownedLoftBindingFields,captureOwnedLoftBinding,equalOwnedLoftBinding,LOFT_NATIVE_REFUSALS,LOFT_PREPARATION_REFUSALS} from '../solid/ownedLoftIntent.mjs';
import {createWorkerMount} from './worker-controller.mjs';
// Private exact cohort factory. Availability belongs to the checked optional
// compiled entry, not this constructor or the historical candidate snapshot.
export function createMechanicalNativeOccMount(options){
 return createWorkerMount(options,Object.freeze({engine:'occ-mechanical-native-v1-component',representation:'occ-brep-worker-owned',mesh:false,profile:false,
  selectedProfile:true,selectedProfileVersion:3,profileSourceBindingVersion:1,selectedRegionArrangementVersion:1,
  edgeTreatments:true,booleanHistory:true,throughHoles:true,linearHolePatterns:true,revolve:true,sweep:true,loft:true,adaptiveMetrology:true,stepExport:true,orthographicRead:true,drawingReferences:true,manufacturingMesh:true,
  captureManufacturingMeshRequest,captureManufacturingMeshResult,manufacturingNativeCodes:MANUFACTURING_MESH_NATIVE_CODES,manufacturingRefusalCodes:MANUFACTURING_MESH_REFUSAL_CODES,
  captureOrthographicReadRequest,captureOrthographicReadResult,orthographicFrameValues,orthographicNativeCodes:ORTHOGRAPHIC_NATIVE_CODES,orthographicRefusalCodes:ORTHOGRAPHIC_REFUSAL_CODES,
  captureStepExportRequest,captureStepExportResult,stepNativeCodes:STEP_EXPORT_NATIVE_CODES,stepRefusalCodes:STEP_EXPORT_REFUSAL_CODES,
  captureSelectedProfile:capturePolygonProfileRequest,captureRevolve:captureOwnedRevolveIntent,bindRevolve:bindOwnedRevolveIntent,captureSweep:captureOwnedSweepIntent,bindSweep:bindOwnedSweepIntent,
  captureLoft:captureOwnedLoftIntent,loftBindingFields:ownedLoftBindingFields,captureLoftBinding:captureOwnedLoftBinding,sameLoftBinding:equalOwnedLoftBinding,loftNativeCodes:LOFT_NATIVE_REFUSALS,loftPreparationCodes:LOFT_PREPARATION_REFUSALS,
  jsSha256:MECHANICAL_NATIVE_CANDIDATE.jsSha256,wasmSha256:MECHANICAL_NATIVE_CANDIDATE.wasmSha256}));
}
