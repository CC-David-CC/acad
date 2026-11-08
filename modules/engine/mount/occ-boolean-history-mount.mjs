// Explicit experimental build. Existing saved parts retain their original build.
import {capturePolygonProfileRequest} from './selectedProfilePlan.mjs';
import {createWorkerMount} from './worker-controller.mjs';
export function createBooleanHistoryOccMount(options){
 return createWorkerMount(options,Object.freeze({
  engine:'occ-boolean-history-v1-component',representation:'occ-brep-worker-owned',
  mesh:false,profile:false,selectedProfile:true,selectedProfileVersion:3,selectedRegionArrangementVersion:1,
  edgeTreatments:true,booleanHistory:true,throughHoles:true,linearHolePatterns:true,captureSelectedProfile:capturePolygonProfileRequest,
  jsSha256:'dd666902fe926d69cc3c8843f5568c2a3e569f38ff49291baa2f248165b5ea99',
  wasmSha256:'8d5e537e0d7f9e12b8ae0eaf239c0be1080934ed12a24bf6e7f849c9135ed5a2'
 }));
}
