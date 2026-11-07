// Explicit new native build; no default or existing part is promoted.
import {capturePolygonProfileRequest} from './selectedProfilePlan.mjs';
import {captureOwnedRevolveIntent,bindOwnedRevolveIntent} from '../solid/ownedRevolveIntent.mjs';
import {captureOwnedSweepIntent,bindOwnedSweepIntent} from '../solid/ownedSweepIntent.mjs';
import {createWorkerMount} from './worker-controller.mjs';
export function createSweepProfileOccMount(options){
 return createWorkerMount(options,Object.freeze({engine:'occ-sweep-profile-v1-component',representation:'occ-brep-worker-owned',mesh:false,profile:false,
  selectedProfile:true,selectedProfileVersion:3,edgeTreatments:true,booleanHistory:true,throughHoles:true,linearHolePatterns:true,revolve:true,sweep:true,
  captureSelectedProfile:capturePolygonProfileRequest,captureRevolve:captureOwnedRevolveIntent,bindRevolve:bindOwnedRevolveIntent,captureSweep:captureOwnedSweepIntent,bindSweep:bindOwnedSweepIntent,
  jsSha256:'a9cfa6e53a8bc14f2fb035e33afd1a82d9ae36ace1cf9f66169c739d2de72580',
  wasmSha256:'e105bdfe7c7bcb113eee5398d8202831cb8e8b1608dcc1730fc4461c9f24263d'}));
}
