// Explicit component only; no catalog/default/part revision promotion.
import {capturePolygonProfileRequest} from './selectedProfilePlan.mjs';
import {captureOwnedRevolveIntent,bindOwnedRevolveIntent} from '../solid/ownedRevolveIntent.mjs';
import {captureOwnedSweepIntent,bindOwnedSweepIntent} from '../solid/ownedSweepIntent.mjs';
import {captureOwnedLoftIntent,ownedLoftBindingFields,captureOwnedLoftBinding,equalOwnedLoftBinding,LOFT_NATIVE_REFUSALS,LOFT_PREPARATION_REFUSALS} from '../solid/ownedLoftIntent.mjs';
import {createWorkerMount} from './worker-controller.mjs';
export function createLoftProfileOccMount(options){
 return createWorkerMount(options,Object.freeze({engine:'occ-loft-profile-v1-component',representation:'occ-brep-worker-owned',mesh:false,profile:false,
  selectedProfile:true,selectedProfileVersion:3,selectedRegionArrangementVersion:1,edgeTreatments:true,booleanHistory:true,throughHoles:true,linearHolePatterns:true,revolve:true,sweep:true,loft:true,
  captureSelectedProfile:capturePolygonProfileRequest,captureRevolve:captureOwnedRevolveIntent,bindRevolve:bindOwnedRevolveIntent,captureSweep:captureOwnedSweepIntent,bindSweep:bindOwnedSweepIntent,
  captureLoft:captureOwnedLoftIntent,loftBindingFields:ownedLoftBindingFields,captureLoftBinding:captureOwnedLoftBinding,sameLoftBinding:equalOwnedLoftBinding,loftNativeCodes:LOFT_NATIVE_REFUSALS,loftPreparationCodes:LOFT_PREPARATION_REFUSALS,
  jsSha256:'5ce2aa94ecdd48dc16f0b9c3ad2a065ea1416ddb7d123c3168661e31ade0a1b5',
  wasmSha256:'b18af4376fb0fb8b4aaa7478ede6b47346c331ee45e1198347c0a70232fd4180'}));
}
