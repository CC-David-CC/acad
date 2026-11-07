// Experimental owned profile/edge-treatment runtime; no implicit conversion.
import {capturePolygonProfileRequest} from './selectedProfilePlan.mjs';
import {createWorkerMount} from './worker-controller.mjs';
export function createMechanicalProfileOccMount(options){
 return createWorkerMount(options,Object.freeze({engine:'occ-mechanical-profile-v1-component',representation:'occ-brep-worker-owned',mesh:false,profile:false,selectedProfile:true,selectedProfileVersion:3,edgeTreatments:true,captureSelectedProfile:capturePolygonProfileRequest,
  jsSha256:'b3d91cbb02f90ba56732039283d787b92eda97c51091fafbd933ecf4db30dd97',
  wasmSha256:'28e8e2c2752cef100a98e24ec487f7d90021edb98fb060fdd1160fe63501bbe2'}));
}
