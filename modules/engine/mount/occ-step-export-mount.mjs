import {captureStepExportRequest,captureStepExportResult,STEP_EXPORT_NATIVE_CODES,STEP_EXPORT_REFUSAL_CODES} from './ownedStepExportProtocol.mjs';
// Explicit component only; no catalog/default/part revision promotion.
import {capturePolygonProfileRequest} from './selectedProfilePlan.mjs';
import {captureOwnedRevolveIntent,bindOwnedRevolveIntent} from '../solid/ownedRevolveIntent.mjs';
import {captureOwnedSweepIntent,bindOwnedSweepIntent} from '../solid/ownedSweepIntent.mjs';
import {captureOwnedLoftIntent,ownedLoftBindingFields,captureOwnedLoftBinding,equalOwnedLoftBinding,LOFT_NATIVE_REFUSALS,LOFT_PREPARATION_REFUSALS} from '../solid/ownedLoftIntent.mjs';
import {createWorkerMount} from './worker-controller.mjs';
export function createStepExportOccMount(options){
 return createWorkerMount(options,Object.freeze({engine:'occ-step-export-v1-component',representation:'occ-brep-worker-owned',mesh:false,profile:false,
  selectedProfile:true,selectedProfileVersion:3,selectedRegionArrangementVersion:1,edgeTreatments:true,booleanHistory:true,throughHoles:true,linearHolePatterns:true,revolve:true,sweep:true,loft:true,adaptiveMetrology:true,stepExport:true,captureStepExportRequest,captureStepExportResult,stepNativeCodes:STEP_EXPORT_NATIVE_CODES,stepRefusalCodes:STEP_EXPORT_REFUSAL_CODES,
  captureSelectedProfile:capturePolygonProfileRequest,captureRevolve:captureOwnedRevolveIntent,bindRevolve:bindOwnedRevolveIntent,captureSweep:captureOwnedSweepIntent,bindSweep:bindOwnedSweepIntent,
  captureLoft:captureOwnedLoftIntent,loftBindingFields:ownedLoftBindingFields,captureLoftBinding:captureOwnedLoftBinding,sameLoftBinding:equalOwnedLoftBinding,loftNativeCodes:LOFT_NATIVE_REFUSALS,loftPreparationCodes:LOFT_PREPARATION_REFUSALS,
  jsSha256:'ca349411fc9e27677bf27072497abb22077d80c28e27ef073266966d16b07733',
  wasmSha256:'c154a4e04961a9a50108fadcf72eca54169ba4db2e9564d24519f197e0568c2f'}));
}
