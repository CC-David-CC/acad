// Explicit new native build; no default or existing part is promoted.
import {capturePolygonProfileRequest} from './selectedProfilePlan.mjs';
import {captureOwnedRevolveIntent,bindOwnedRevolveIntent} from '../solid/ownedRevolveIntent.mjs';
import {createWorkerMount} from './worker-controller.mjs';
export function createRevolveProfileOccMount(options){
 return createWorkerMount(options,Object.freeze({engine:'occ-revolve-profile-v1-component',representation:'occ-brep-worker-owned',mesh:false,profile:false,
  selectedProfile:true,selectedProfileVersion:3,selectedRegionArrangementVersion:1,edgeTreatments:true,booleanHistory:true,throughHoles:true,linearHolePatterns:true,revolve:true,
  captureSelectedProfile:capturePolygonProfileRequest,captureRevolve:captureOwnedRevolveIntent,bindRevolve:bindOwnedRevolveIntent,
  jsSha256:'567419c13c78fff46cbc9cd07e5a993106b652a13cb9f6944831f68ef48729cc',
  wasmSha256:'ad9475c81ea2eecadd41c73f0b0860d7d06c53e4292b16047472f03995f3efdd'}));
}
