// Private component candidate. No application/catalog asset changes implied.
import {captureSelectedProfileRequest} from './selectedProfilePlan.mjs';
import {createWorkerMount} from './worker-controller.mjs';
export function createSelectedProfileOccMount(options){
 return createWorkerMount(options,Object.freeze({engine:'occ-selected-profile-v2-component',representation:'occ-brep-worker-owned',mesh:false,profile:false,selectedProfile:true,captureSelectedProfile:captureSelectedProfileRequest,
  jsSha256:'cbd49d63d0900f50dda7fc53518d5f06183e85b1dea720522cc2994b0876adc9',
  wasmSha256:'a81af0b78dd585124f3f2d05d09b4a387b276bd1f655f0234002a6ab4646a637'}));
}
