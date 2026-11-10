import {ANALYTIC_PROFILE_NATIVE_RUNTIME} from './analyticProfileNativeContract.mjs';
import {captureAnalyticProfileRequest,ANALYTIC_PROFILE_NATIVE_CODES} from './analyticProfilePlan.mjs';
import {capturePolygonProfileRequest} from './selectedProfilePlan.mjs';
import {captureStepExportRequest,captureStepExportResult,STEP_EXPORT_NATIVE_CODES,STEP_EXPORT_REFUSAL_CODES} from './ownedStepExportProtocol.mjs';
import {captureManufacturingMeshRequest,captureManufacturingMeshResult,MANUFACTURING_MESH_NATIVE_CODES,MANUFACTURING_MESH_REFUSAL_CODES} from './ownedManufacturingMeshProtocol.mjs';
import {createWorkerMount} from './worker-controller.mjs';
export function createAnalyticProfileOccMount(options){
 const runtime=ANALYTIC_PROFILE_NATIVE_RUNTIME;if(runtime===null)throw Object.assign(Error('The analytic profile Native pair is not compiled/staged.'),{code:'ENGINE_BUILD_UNAVAILABLE'});
 return createWorkerMount(options,Object.freeze({engine:'occ-analytic-profile-v1-component',representation:'occ-brep-worker-owned',mesh:false,profile:false,selectedProfile:true,selectedProfileVersion:3,analyticProfileVersion:1,captureAnalyticProfileRequest,analyticProfileNativeCodes:ANALYTIC_PROFILE_NATIVE_CODES,captureSelectedProfile:capturePolygonProfileRequest,stepExport:true,captureStepExportRequest,captureStepExportResult,stepNativeCodes:STEP_EXPORT_NATIVE_CODES,stepRefusalCodes:STEP_EXPORT_REFUSAL_CODES,manufacturingMesh:true,captureManufacturingMeshRequest,captureManufacturingMeshResult,manufacturingNativeCodes:MANUFACTURING_MESH_NATIVE_CODES,manufacturingRefusalCodes:MANUFACTURING_MESH_REFUSAL_CODES,jsSha256:runtime.jsSha256,wasmSha256:runtime.wasmSha256}));
}
