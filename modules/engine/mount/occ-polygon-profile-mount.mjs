// Explicit V3 component. The kernel owns transient shapes, never the authored
// document; no automatic backend conversion or default-engine promotion.
import {capturePolygonProfileRequest} from './selectedProfilePlan.mjs';
import {createWorkerMount} from './worker-controller.mjs';
export function createPolygonProfileOccMount(options){
 return createWorkerMount(options,Object.freeze({engine:'occ-polygon-profile-v3-component',representation:'occ-brep-worker-owned',mesh:false,profile:false,selectedProfile:true,selectedProfileVersion:3,captureSelectedProfile:capturePolygonProfileRequest,
  jsSha256:'5414a24c96eff09b77f7d3fe758287c9696e63127c91e73011f6f2939de2a8eb',
  wasmSha256:'534ffdd2d88632a7878d654742f2df72c16691f3c814085e4f525efc74961e19'}));
}
