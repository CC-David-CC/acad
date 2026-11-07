// Explicit component only; no catalog/default/part revision promotion.
import {capturePolygonProfileRequest} from './selectedProfilePlan.mjs';
import {captureOwnedRevolveIntent,bindOwnedRevolveIntent} from '../solid/ownedRevolveIntent.mjs';
import {captureOwnedSweepIntent,bindOwnedSweepIntent} from '../solid/ownedSweepIntent.mjs';
import {captureOwnedLoftIntent,ownedLoftBindingFields,captureOwnedLoftBinding,equalOwnedLoftBinding,LOFT_NATIVE_REFUSALS,LOFT_PREPARATION_REFUSALS} from '../solid/ownedLoftIntent.mjs';
import {createWorkerMount} from './worker-controller.mjs';
export function createAdaptiveMetrologyOccMount(options){
 return createWorkerMount(options,Object.freeze({engine:'occ-adaptive-metrology-v1-component',representation:'occ-brep-worker-owned',mesh:false,profile:false,
  selectedProfile:true,selectedProfileVersion:3,edgeTreatments:true,booleanHistory:true,throughHoles:true,linearHolePatterns:true,revolve:true,sweep:true,loft:true,adaptiveMetrology:true,
  captureSelectedProfile:capturePolygonProfileRequest,captureRevolve:captureOwnedRevolveIntent,bindRevolve:bindOwnedRevolveIntent,captureSweep:captureOwnedSweepIntent,bindSweep:bindOwnedSweepIntent,
  captureLoft:captureOwnedLoftIntent,loftBindingFields:ownedLoftBindingFields,captureLoftBinding:captureOwnedLoftBinding,sameLoftBinding:equalOwnedLoftBinding,loftNativeCodes:LOFT_NATIVE_REFUSALS,loftPreparationCodes:LOFT_PREPARATION_REFUSALS,
  jsSha256:'ed06b634a3e81f9a51c89f75b3d65e03b8ace1fc483900ea2858eae8eff970a4',
  wasmSha256:'bc8895ceb123e33aad68c8a1cf6322b5c0ccef9bfb129207defe1b8a5a7c893a'}));
}
