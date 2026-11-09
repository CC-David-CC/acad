import {createCircularOccMount} from './occ-circular-mount.mjs';
import circularAssets from 'codi-circular-assets';
import {createShellOccMount} from './occ-shell-mount.mjs';
import shellAssets from 'codi-shell-assets';
import {createManufacturingMeshOccMount} from './occ-manufacturing-mesh-mount.mjs';
import {createVerifiedOciMount} from './oci-verified-mount.mjs';
import {createSelectedProfileOccMount} from './occ-selected-profile-mount.mjs';
import {createPolygonProfileOccMount} from './occ-polygon-profile-mount.mjs';
import {createMechanicalProfileOccMount} from './occ-mechanical-profile-mount.mjs';
import {createBooleanHistoryOccMount} from './occ-boolean-history-mount.mjs';
import {createStepExportOccMount} from './occ-step-export-mount.mjs';
import {createAdaptiveMetrologyOccMount} from './occ-adaptive-metrology-mount.mjs';
import {createLoftProfileOccMount} from './occ-loft-profile-mount.mjs';
import {createSweepProfileOccMount} from './occ-sweep-profile-mount.mjs';
import {createRevolveProfileOccMount} from './occ-revolve-profile-mount.mjs';
import {createVerifiedManifoldMount} from './manifold-verified-mount.mjs';
import {createRawSmlibMount} from '../raw-smlib/rawMount.mjs';
import {CAD_ENGINES,preferredCadEngineBuild,requireCadEngineBuild,OCC_SELECTED_PROFILE_BUILD,OCC_POLYGON_PROFILE_BUILD,OCC_MECHANICAL_PROFILE_BUILD,OCC_BOOLEAN_HISTORY_BUILD,OCC_REVOLVE_PROFILE_BUILD,OCC_SWEEP_PROFILE_BUILD,OCC_LOFT_PROFILE_BUILD,OCC_ADAPTIVE_METROLOGY_BUILD,OCC_STEP_EXPORT_BUILD,OCC_MANUFACTURING_MESH_BUILD,OCC_SHELL_BUILD,OCC_CIRCULAR_BUILD} from './engineCatalog.mjs';
import polygonAssets from 'codi-polygon-profile-assets';
import mechanicalAssets from 'codi-mechanical-profile-assets';
import booleanAssets from 'codi-boolean-history-assets';
import revolveAssets from 'codi-revolve-profile-assets';
import sweepAssets from 'codi-sweep-profile-assets';
import loftAssets from 'codi-loft-profile-assets';
import adaptiveAssets from 'codi-adaptive-metrology-assets';
import stepAssets from 'codi-step-export-assets';
import manufacturingAssets from 'codi-manufacturing-mesh-assets';
import {listSweepBuilds,listRevolveBuilds,requireSweepBuild,requireRevolveBuild,requireSelectedProfileBuild,requireShellBuild} from './selectedProfileBuildSelection.mjs';
import selectedWorker from 'codi-selected-profile-worker';
import selectedGlue from 'codi-selected-profile-occ-portable';
import selectedWasm from 'codi-selected-profile-occ-wasm';
import selectedExactVolume from 'codi-selected-profile-exact-volume';
import occExactVolume from 'codi-exact-mesh-volume-module';
import selectedPlan from 'codi-selected-profile-plan';
import occWorker from 'codi-oci-verified-worker';
import occGlue from 'codi-occ-portable';
import occWasm from 'codi-occ-wasm';
import manifoldWorker from 'codi-manifold-worker';
import manifoldWasm from 'codi-manifold-worker-wasm';
import smlibWorker from 'codi-smlib-worker';
import smlibWasm from 'codi-smlib-wasm';
import type {SolidKernel} from '../solid/SolidKernel';

function assetPath(asset:string):string{
 const url=new URL(asset,globalThis.location.href);
 if(url.origin!==globalThis.location.origin||url.search||url.hash)throw Error('Engine assets must be same-origin package files.');
 return url.pathname;
}
// This is availability/colocation admission, not a Native operation. The entry
// producer already binds every emitted module and Worker byte to its source.
function requireArrangementAssets(assets:any,prefix:string){
 if(!assets||assets.selectedRegionArrangementVersion!==1)throw Object.assign(Error('The complete arrangement source graph is not staged for this cohort.'),{code:'ENGINE_BUILD_UNAVAILABLE'});
 const worker=assetPath(assets.worker),suffix='modules/engine/mount/'+prefix+'-worker.js';if(!worker.endsWith('/'+suffix))throw Error('Unexpected arrangement Worker package path');
 const base=worker.slice(0,-suffix.length),required=['modules/engine/mount/arrangedPrismSelectionIndex.mjs','modules/engine/extrusion/selectedArrangementDescriptor.mjs','modules/engine/mount/selectedProfilePlan.mjs','modules/engine/mount/ownedTopologyContract.mjs','modules/engine/mount/selectionLineageIndex.mjs'];
 if(!assets.modules||required.some(name=>!Object.prototype.hasOwnProperty.call(assets.modules,name)||assetPath(assets.modules[name])!==base+name))throw Error('Arrangement source/provenance modules are incomplete or not colocated');
}
// Construction is synchronous: the candidate owner retains cleanup authority
// before asynchronous readiness or provenance validation. No implicit fallback.
function loftMountOptions(assets=loftAssets,prefix='loft-profile',extras:string[]=[]){
 if(!assets)throw Object.assign(Error('Loft native assets are not staged in this app build.'),{code:'ENGINE_BUILD_UNAVAILABLE'});
 requireArrangementAssets(assets,prefix);
  const workerPath=assetPath(assets.worker),suffix='modules/engine/mount/'+prefix+'-worker.js';
  if(!workerPath.endsWith('/'+suffix))throw Error('Unexpected loft Worker package path');
  const base=workerPath.slice(0,-suffix.length),required=['modules/engine/mount/ownedLoftPlan.mjs','modules/engine/solid/ownedLoftIntent.mjs','modules/engine/mount/ownedSweepPlan.mjs', 'modules/engine/solid/ownedSweepIntent.mjs', 'modules/engine/solid/sweepLimits.mjs','modules/engine/mount/ownedRevolvePlan.mjs','modules/engine/solid/ownedRevolveIntent.mjs','modules/engine/mount/exactMeshVolume.mjs','modules/engine/mount/ownedLinearHolePatternPlan.mjs','modules/engine/solid/ownedLinearHolePatternIntent.mjs','modules/engine/mount/ownedThroughHolePlan.mjs','modules/engine/solid/ownedHoleIntent.mjs','modules/engine/solid/solidIntent.mjs','modules/engine/mount/selectionLineageIndex.mjs','modules/engine/mount/ownedBooleanContract.mjs','modules/engine/mount/booleanSelectionClaims.mjs','modules/engine/mount/polygonProfilePlan.mjs','modules/engine/mount/selectedProfilePlan.mjs','modules/engine/mount/ownedTopologyContract.mjs','modules/engine/mount/prismSelectionIndex.mjs','modules/engine/mount/selectionAncestryIndex.mjs','modules/engine/extrusion/simplePolygon.mjs','modules/engine/extrusion/exactExternalVertexContact.mjs','modules/engine/extrusion/selectedArrangementDescriptor.mjs','modules/engine/mount/arrangedPrismSelectionIndex.mjs',...extras];
  if(Object.keys(assets.modules).sort().join(',')!==required.slice().sort().join(',')||required.some(name=>assetPath(assets.modules[name])!==base+name)||assetPath(assets.js)!==base+prefix+'-occ-portable.js'||assetPath(assets.wasm)!==base+prefix+'-occ.wasm')throw Error('Loft Worker module graph is not colocated');
  return {workerUrl:workerPath,jsPath:assetPath(assets.js),wasmPath:assetPath(assets.wasm),timeoutMs:30000};
}
export function createCatalogMount(id:string,revision?:string):SolidKernel{
 const build=requireCadEngineBuild(id,revision);
 if(build===OCC_CIRCULAR_BUILD){requireAvailableShellBuild(id,build.revision);return createCircularOccMount(loftMountOptions(circularAssets,'circular',circularModules)) as SolidKernel;}
 if(build===OCC_SHELL_BUILD){requireAvailableShellBuild(id,build.revision);return createShellOccMount(loftMountOptions(shellAssets,'shell',shellModules)) as SolidKernel;}
 if(build===OCC_MANUFACTURING_MESH_BUILD){requireAvailableManufacturingMeshBuild(id,build.revision);return createManufacturingMeshOccMount(loftMountOptions(manufacturingAssets,'manufacturing-mesh',blindManufacturingModules)) as SolidKernel;}
 if(build===OCC_STEP_EXPORT_BUILD){requireAvailableStepExportBuild(id,build.revision);return createStepExportOccMount(loftMountOptions(stepAssets,'step-export',['modules/engine/mount/ownedStepExportProtocol.mjs'])) as SolidKernel;}
 if(build===OCC_ADAPTIVE_METROLOGY_BUILD){requireAvailableLoftBuild(id,build.revision);return createAdaptiveMetrologyOccMount(loftMountOptions(adaptiveAssets,'adaptive-metrology')) as SolidKernel;}
 if(build===OCC_LOFT_PROFILE_BUILD){requireAvailableLoftBuild(id,build.revision);return createLoftProfileOccMount(loftMountOptions()) as SolidKernel;}
 if(build===OCC_SWEEP_PROFILE_BUILD){
  requireArrangementAssets(sweepAssets,'sweep-profile');
  const workerPath=assetPath(sweepAssets.worker),suffix='modules/engine/mount/sweep-profile-worker.js';
  if(!workerPath.endsWith('/'+suffix))throw Error('Unexpected sweep Worker package path');
  const base=workerPath.slice(0,-suffix.length),required=['modules/engine/mount/ownedSweepPlan.mjs', 'modules/engine/solid/ownedSweepIntent.mjs', 'modules/engine/solid/sweepLimits.mjs','modules/engine/mount/ownedRevolvePlan.mjs','modules/engine/solid/ownedRevolveIntent.mjs','modules/engine/mount/exactMeshVolume.mjs','modules/engine/mount/ownedLinearHolePatternPlan.mjs','modules/engine/solid/ownedLinearHolePatternIntent.mjs','modules/engine/mount/ownedThroughHolePlan.mjs','modules/engine/solid/ownedHoleIntent.mjs','modules/engine/solid/solidIntent.mjs','modules/engine/mount/selectionLineageIndex.mjs','modules/engine/mount/ownedBooleanContract.mjs','modules/engine/mount/booleanSelectionClaims.mjs','modules/engine/mount/polygonProfilePlan.mjs','modules/engine/mount/selectedProfilePlan.mjs','modules/engine/mount/ownedTopologyContract.mjs','modules/engine/mount/prismSelectionIndex.mjs','modules/engine/mount/selectionAncestryIndex.mjs','modules/engine/extrusion/simplePolygon.mjs','modules/engine/extrusion/exactExternalVertexContact.mjs','modules/engine/extrusion/selectedArrangementDescriptor.mjs','modules/engine/mount/arrangedPrismSelectionIndex.mjs'];
  if(Object.keys(sweepAssets.modules).sort().join(',')!==required.slice().sort().join(',')||required.some(name=>assetPath(sweepAssets.modules[name])!==base+name)||assetPath(sweepAssets.js)!==base+'sweep-profile-occ-portable.js'||assetPath(sweepAssets.wasm)!==base+'sweep-profile-occ.wasm')throw Error('Sweep Worker module graph is not colocated');
  return createSweepProfileOccMount({workerUrl:workerPath,jsPath:assetPath(sweepAssets.js),wasmPath:assetPath(sweepAssets.wasm),timeoutMs:30000}) as SolidKernel;
 }
 if(build===OCC_REVOLVE_PROFILE_BUILD){
  requireArrangementAssets(revolveAssets,'revolve-profile');
  const workerPath=assetPath(revolveAssets.worker),suffix='modules/engine/mount/revolve-profile-worker.js';
  if(!workerPath.endsWith('/'+suffix))throw Error('Unexpected revolve Worker package path');
  const base=workerPath.slice(0,-suffix.length),required=['modules/engine/mount/ownedRevolvePlan.mjs','modules/engine/solid/ownedRevolveIntent.mjs','modules/engine/mount/exactMeshVolume.mjs','modules/engine/mount/ownedLinearHolePatternPlan.mjs','modules/engine/solid/ownedLinearHolePatternIntent.mjs','modules/engine/mount/ownedThroughHolePlan.mjs','modules/engine/solid/ownedHoleIntent.mjs','modules/engine/solid/solidIntent.mjs','modules/engine/mount/selectionLineageIndex.mjs','modules/engine/mount/ownedBooleanContract.mjs','modules/engine/mount/booleanSelectionClaims.mjs','modules/engine/mount/polygonProfilePlan.mjs','modules/engine/mount/selectedProfilePlan.mjs','modules/engine/mount/ownedTopologyContract.mjs','modules/engine/mount/prismSelectionIndex.mjs','modules/engine/mount/selectionAncestryIndex.mjs','modules/engine/extrusion/simplePolygon.mjs','modules/engine/extrusion/exactExternalVertexContact.mjs','modules/engine/extrusion/selectedArrangementDescriptor.mjs','modules/engine/mount/arrangedPrismSelectionIndex.mjs'];
  if(Object.keys(revolveAssets.modules).sort().join(',')!==required.slice().sort().join(',')||required.some(name=>assetPath(revolveAssets.modules[name])!==base+name)||assetPath(revolveAssets.js)!==base+'revolve-profile-occ-portable.js'||assetPath(revolveAssets.wasm)!==base+'revolve-profile-occ.wasm')throw Error('Revolve Worker module graph is not colocated');
  return createRevolveProfileOccMount({workerUrl:workerPath,jsPath:assetPath(revolveAssets.js),wasmPath:assetPath(revolveAssets.wasm),timeoutMs:30000}) as SolidKernel;
 }
 if(build===OCC_BOOLEAN_HISTORY_BUILD){
  requireArrangementAssets(booleanAssets,'boolean-history');
  const workerPath=assetPath(booleanAssets.worker),suffix='modules/engine/mount/boolean-history-worker.js';
  if(!workerPath.endsWith('/'+suffix))throw Error('Unexpected mechanical Worker package path');
  const base=workerPath.slice(0,-suffix.length),required=['modules/engine/mount/exactMeshVolume.mjs','modules/engine/mount/ownedLinearHolePatternPlan.mjs','modules/engine/solid/ownedLinearHolePatternIntent.mjs','modules/engine/mount/ownedThroughHolePlan.mjs','modules/engine/solid/ownedHoleIntent.mjs','modules/engine/solid/solidIntent.mjs','modules/engine/mount/selectionLineageIndex.mjs','modules/engine/mount/ownedBooleanContract.mjs','modules/engine/mount/booleanSelectionClaims.mjs','modules/engine/mount/polygonProfilePlan.mjs','modules/engine/mount/selectedProfilePlan.mjs','modules/engine/mount/ownedTopologyContract.mjs','modules/engine/mount/prismSelectionIndex.mjs','modules/engine/mount/selectionAncestryIndex.mjs','modules/engine/extrusion/simplePolygon.mjs','modules/engine/extrusion/exactExternalVertexContact.mjs','modules/engine/extrusion/selectedArrangementDescriptor.mjs','modules/engine/mount/arrangedPrismSelectionIndex.mjs'];
  if(Object.keys(booleanAssets.modules).sort().join(',')!==required.slice().sort().join(',')||required.some(name=>assetPath(booleanAssets.modules[name])!==base+name)||assetPath(booleanAssets.js)!==base+'boolean-history-occ-portable.js'||assetPath(booleanAssets.wasm)!==base+'boolean-history-occ.wasm')throw Error('Boolean-history Worker module graph is not colocated');
  return createBooleanHistoryOccMount({workerUrl:workerPath,jsPath:assetPath(booleanAssets.js),wasmPath:assetPath(booleanAssets.wasm),timeoutMs:30000}) as SolidKernel;
 }
 if(build===OCC_MECHANICAL_PROFILE_BUILD){
  const workerPath=assetPath(mechanicalAssets.worker),suffix='modules/engine/mount/mechanical-profile-worker.js';
  if(!workerPath.endsWith('/'+suffix))throw Error('Unexpected mechanical Worker package path');
  const base=workerPath.slice(0,-suffix.length),required=['modules/engine/mount/exactMeshVolume.mjs','modules/engine/mount/polygonProfilePlan.mjs','modules/engine/mount/selectedProfilePlan.mjs','modules/engine/mount/ownedTopologyContract.mjs','modules/engine/mount/prismSelectionIndex.mjs','modules/engine/mount/selectionAncestryIndex.mjs','modules/engine/extrusion/simplePolygon.mjs','modules/engine/extrusion/exactExternalVertexContact.mjs','modules/engine/extrusion/selectedArrangementDescriptor.mjs','modules/engine/mount/arrangedPrismSelectionIndex.mjs'];
  if(Object.keys(mechanicalAssets.modules).sort().join(',')!==required.slice().sort().join(',')||required.some(name=>assetPath(mechanicalAssets.modules[name])!==base+name)||assetPath(mechanicalAssets.js)!==base+'mechanical-profile-occ-portable.js'||assetPath(mechanicalAssets.wasm)!==base+'mechanical-profile-occ.wasm')throw Error('Mechanical Worker module graph is not colocated');
  return createMechanicalProfileOccMount({workerUrl:workerPath,jsPath:assetPath(mechanicalAssets.js),wasmPath:assetPath(mechanicalAssets.wasm),timeoutMs:30000}) as SolidKernel;
 }
 if(build===OCC_POLYGON_PROFILE_BUILD){
  const workerPath=assetPath(polygonAssets.worker),suffix='modules/engine/mount/polygon-profile-worker.js';
  if(!workerPath.endsWith('/'+suffix))throw Error('Unexpected polygon Worker package path');
  const base=workerPath.slice(0,-suffix.length),required=['modules/engine/mount/exactMeshVolume.mjs','modules/engine/mount/polygonProfilePlan.mjs','modules/engine/mount/selectedProfilePlan.mjs','modules/engine/mount/ownedTopologyContract.mjs','modules/engine/mount/prismSelectionIndex.mjs','modules/engine/extrusion/simplePolygon.mjs','modules/engine/extrusion/exactExternalVertexContact.mjs','modules/engine/extrusion/selectedArrangementDescriptor.mjs','modules/engine/mount/arrangedPrismSelectionIndex.mjs'];
  if(Object.keys(polygonAssets.modules).sort().join(',')!==required.slice().sort().join(',')||required.some(name=>assetPath(polygonAssets.modules[name])!==base+name)||assetPath(polygonAssets.js)!==base+'polygon-profile-occ-portable.js'||assetPath(polygonAssets.wasm)!==base+'polygon-profile-occ.wasm')throw Error('Polygon Worker module graph is not colocated');
  return createPolygonProfileOccMount({workerUrl:workerPath,jsPath:assetPath(polygonAssets.js),wasmPath:assetPath(polygonAssets.wasm),timeoutMs:30000}) as SolidKernel;
 }
 if(build===OCC_SELECTED_PROFILE_BUILD){
  const workerPath=assetPath(selectedWorker),planPath=assetPath(selectedPlan);
  if(workerPath.slice(0,workerPath.lastIndexOf('/')+1)!==planPath.slice(0,planPath.lastIndexOf('/')+1)||!planPath.endsWith('/selectedProfilePlan.mjs')||assetPath(selectedExactVolume)!==workerPath.slice(0,workerPath.lastIndexOf('/')+1)+'exactMeshVolume.mjs')throw Error('Selected-profile Worker modules must be colocated.');
  return createSelectedProfileOccMount({workerUrl:workerPath,jsPath:assetPath(selectedGlue),wasmPath:assetPath(selectedWasm),timeoutMs:30000}) as SolidKernel;
 }
 // JS adapters expose a larger legacy API and widen literal result tags in
 // inferred types. This port narrows the supported request vocabulary; the
 // owner validates mount identity and each adapter validates its live results.
 if(id==='occ'&&assetPath(occExactVolume)!==assetPath(occWorker).slice(0,assetPath(occWorker).lastIndexOf('/')+1)+'exactMeshVolume.mjs')throw Error('OCI measurement module is not colocated');
 if(id==='occ')return createVerifiedOciMount({workerUrl:assetPath(occWorker),jsPath:assetPath(occGlue),wasmPath:assetPath(occWasm),timeoutMs:30000}) as SolidKernel;
 // The reviewed Manifold glue is statically embedded in this bootstrap; its
 // manifest JS path is unused. Descriptor digests identify the actual glue.
 if(id==='manifold')return createVerifiedManifoldMount({workerUrl:assetPath(manifoldWorker),jsPath:assetPath(manifoldWorker),wasmPath:assetPath(manifoldWasm),timeoutMs:30000}) as SolidKernel;
 return createRawSmlibMount({workerUrl:assetPath(smlibWorker),wasmPath:assetPath(smlibWasm),timeoutMs:30000}) as SolidKernel;
}
const manufacturingModules=['modules/engine/extrusion/isolatedOpenProfileComponents.mjs','modules/engine/extrusion/articulatedRegionSegments.mjs','modules/engine/mount/ownedDrawingDerivedProtocol.mjs','modules/engine/mount/ownedDrawingSectionProtocol.mjs','modules/engine/mount/ownedDrawingSectionWorker.mjs','modules/engine/mount/drawingDetailClip.mjs','modules/engine/mount/ownedDrawingReadProtocol.mjs','modules/engine/mount/drawingReferenceFacts.mjs','modules/engine/mount/prismaticBoreFacts.mjs','modules/engine/mount/ownedBoreReadProtocol.mjs','modules/engine/mount/ownedBoreAnnotationProtocol.mjs','modules/engine/mount/cylinderCutWitness.mjs','modules/engine/extrusion/selectedRegionDescriptor.mjs','modules/drawing/linkedPartDrawingDefinition.mjs','modules/engine/mount/ownedStepExportProtocol.mjs','modules/engine/mount/ownedOrthographicReadProtocol.mjs','modules/engine/mount/orthographicAnalyticRecord.mjs','modules/engine/mount/ownedManufacturingMeshProtocol.mjs','modules/engine/mount/manufacturingMeshRecord.mjs'];
const blindManufacturingModules=[...manufacturingModules,'modules/engine/mount/nativePlanarAttachmentFacts.mjs','modules/engine/mount/ownedPlanarAttachmentProtocol.mjs','modules/engine/mount/ownedBlindHolePlan.mjs','modules/engine/mount/blindHoleFacts.mjs','modules/engine/solid/ownedBlindHoleIntent.mjs','modules/engine/mount/ownedProfileExtentPlan.mjs','modules/engine/mount/ownedProfileExtentWorker.mjs','modules/engine/mount/profileExtentHolePlan.mjs','modules/engine/mount/profileExtentSelectionIndex.mjs','modules/engine/solid/ownedProfileExtentFeature.mjs'];
const shellModules=[...manufacturingModules,'modules/engine/mount/ownedShellProtocol.mjs','modules/engine/mount/ownedShellWorker.mjs','modules/engine/mount/ownedShellNativeContract.mjs','modules/engine/mount/boxSelectionIndex.mjs','modules/engine/mount/nativePlanarAttachmentFacts.mjs','modules/engine/mount/ownedPlanarAttachmentProtocol.mjs'];
// Availability is a property of this compiled app, not catalog registration.
const circularModules=[...shellModules,"modules/engine/mount/ownedCircularNativeContract.mjs","modules/engine/mount/ownedCircularWorker.mjs","modules/engine/mount/ownedCircularArrangementProtocol.mjs","modules/engine/mount/circularArrangementPlan.mjs","modules/engine/mount/circularPrismSelectionIndex.mjs","modules/engine/extrusion/circularArrangementDescriptor.mjs","modules/engine/extrusion/circularTopology.mjs"];
export function listAvailableShellBuilds(){const out=[];if(shellAssets){requireAvailableShellBuild('occ',OCC_SHELL_BUILD.revision);out.push(OCC_SHELL_BUILD);}if(circularAssets){requireAvailableShellBuild('occ',OCC_CIRCULAR_BUILD.revision);out.push(OCC_CIRCULAR_BUILD);}return Object.freeze(out);}
export function requireAvailableShellBuild(engine:string,revision:string){const spec=requireShellBuild(engine,revision);if(spec===OCC_CIRCULAR_BUILD){if(!circularAssets||circularAssets.circularArrangementVersion!==1)throw Object.assign(Error('The circular cohort is not staged.'),{code:'ENGINE_BUILD_UNAVAILABLE'});loftMountOptions(circularAssets,'circular',circularModules);return spec;}if(spec!==OCC_SHELL_BUILD)throw Object.assign(Error('The registered shell cohort is not installed.'),{code:'ENGINE_BUILD_UNAVAILABLE'});loftMountOptions(shellAssets,'shell',shellModules);return spec;}
export function listAvailableLoftBuilds(){const out=[];if(loftAssets){loftMountOptions();out.push(OCC_LOFT_PROFILE_BUILD);}if(adaptiveAssets){loftMountOptions(adaptiveAssets,'adaptive-metrology');out.push(OCC_ADAPTIVE_METROLOGY_BUILD);}if(stepAssets){requireAvailableStepExportBuild('occ',OCC_STEP_EXPORT_BUILD.revision);out.push(OCC_STEP_EXPORT_BUILD);}if(manufacturingAssets){requireAvailableManufacturingMeshBuild('occ',OCC_MANUFACTURING_MESH_BUILD.revision);out.push(OCC_MANUFACTURING_MESH_BUILD);}return Object.freeze([...out,...listAvailableShellBuilds()]);}
export function requireAvailableLoftBuild(engine:string,revision:string){
 const spec=requireCadEngineBuild(engine,revision);
 if(spec.loftVersion!==1)throw Object.assign(Error('Select a registered loft build explicitly.'),{code:'UNSUPPORTED_LOFT_BUILD'});
 if(spec.shellVersion===1)return requireAvailableShellBuild(engine,revision);
 if(spec.manufacturingMeshVersion===1)return requireAvailableManufacturingMeshBuild(engine,revision);
 if(spec.stepExportVersion===1)return requireAvailableStepExportBuild(engine,revision);
 if(spec===OCC_ADAPTIVE_METROLOGY_BUILD)loftMountOptions(adaptiveAssets,'adaptive-metrology');
 else if(spec===OCC_LOFT_PROFILE_BUILD)loftMountOptions();
 else throw Object.assign(Error('The registered loft cohort is not installed.'),{code:'ENGINE_BUILD_UNAVAILABLE'});
 return spec;
}
// Inherited eligibility follows declared capabilities; assets remain exact cohorts.
export function listAvailableSweepBuilds(){return Object.freeze([...listSweepBuilds(),...listAvailableLoftBuilds()]);}
export function listAvailableRevolveBuilds(){return Object.freeze([...listRevolveBuilds(),...listAvailableLoftBuilds()]);}
export function requireAvailableSweepBuild(engine:string,revision:string){const spec=requireSweepBuild(engine,revision);if(spec.loftVersion===1)requireAvailableLoftBuild(engine,revision);return spec;}
export function requireAvailableRevolveBuild(engine:string,revision:string){const spec=requireRevolveBuild(engine,revision);if(spec.loftVersion===1)requireAvailableLoftBuild(engine,revision);return spec;}
export function requireAvailablePointBuild(engine:string,revision:string){const spec=requireCadEngineBuild(engine,revision);if(spec.pointObservationVersion!==1)throw Object.assign(Error('Select an exact registered native point-observation build.'),{code:'ENGINE_REVISION_MISMATCH'});if(spec.loftVersion===1)requireAvailableLoftBuild(engine,revision);return spec;}
export function listAvailableBoxBuilds(){return Object.freeze([...Object.values(CAD_ENGINES).map((entry:any)=>preferredCadEngineBuild(entry.id)),...listAvailableShellBuilds()]);}
export function requireAvailableBoxBuild(engine:string,revision:string){const spec=requireCadEngineBuild(engine,revision);if(spec.shellVersion===1)return requireAvailableShellBuild(engine,revision);if(spec===CAD_ENGINES[engine]||spec===preferredCadEngineBuild(engine))return spec;return requireAvailableSelectedProfileBuild(engine,revision);}
export function inspectCatalogSolidCapabilities(){
 const boxes=listAvailableBoxBuilds();
 return Object.freeze(Object.values(CAD_ENGINES).map((entry:any)=>{const spec=preferredCadEngineBuild(entry.id);return Object.freeze({id:spec.id,name:entry.name,revision:spec.revision,
  representation:spec.representation,operations:Object.freeze({box:true,boolean:true}),
  availableBuilds:Object.freeze(boxes.filter(build=>build.id===entry.id).map(build=>Object.freeze({engine:build.id,engineRevision:build.revision,boxConstructionVersion:build.boxConstructionVersion??null,shellVersion:build.shellVersion??null,drawingDetailVersion:build.drawingDetailVersion??null,drawingSectionVersion:build.drawingSectionVersion??null}))),
  scope:'bounded-worker-solid-v1',maxDisplayTriangles:100000,qualification:'research',
  note:spec.id==='smlib'?'Experimental patched kernel; whole multi-material results with voids retain native geometry with preview unavailable. Some partial cavity fills fail native validation. Preview winding and manufacturing remain unqualified. No automatic fallback.':spec.id==='occ'?'New parts use this declared native-evidence build. Existing parts retain their saved build. No automatic fallback, conversion or STEP export.':'Explicit kernel; no automatic fallback, conversion, STEP or arbitrary sketch extrusion.'});}));
}

export function listAvailableStepExportBuilds(){const out=[];if(stepAssets){requireAvailableStepExportBuild('occ',OCC_STEP_EXPORT_BUILD.revision);out.push(OCC_STEP_EXPORT_BUILD);}if(manufacturingAssets){requireAvailableManufacturingMeshBuild('occ',OCC_MANUFACTURING_MESH_BUILD.revision);out.push(OCC_MANUFACTURING_MESH_BUILD);}return Object.freeze([...out,...listAvailableShellBuilds()]);}
export function requireAvailableStepExportBuild(engine:string,revision:string){const spec=requireCadEngineBuild(engine,revision);if(spec.stepExportVersion!==1)throw Object.assign(Error('Select an owned STEP native build.'),{code:'UNSUPPORTED_STEP_BUILD'});if(spec.shellVersion===1)return requireAvailableShellBuild(engine,revision);if(spec.manufacturingMeshVersion===1)return requireAvailableManufacturingMeshBuild(engine,revision);if(spec!==OCC_STEP_EXPORT_BUILD)throw Object.assign(Error('The registered STEP cohort is not installed.'),{code:'ENGINE_BUILD_UNAVAILABLE'});loftMountOptions(stepAssets,'step-export',['modules/engine/mount/ownedStepExportProtocol.mjs']);return spec;}
export function listAvailableManufacturingMeshBuilds(){const out=[];if(manufacturingAssets){requireAvailableManufacturingMeshBuild('occ',OCC_MANUFACTURING_MESH_BUILD.revision);out.push(OCC_MANUFACTURING_MESH_BUILD);}return Object.freeze([...out,...listAvailableShellBuilds()]);}
export function requireAvailableManufacturingMeshBuild(engine:string,revision:string){const spec=requireCadEngineBuild(engine,revision);if(spec.manufacturingMeshVersion!==1)throw Object.assign(Error('Select a controlled manufacturing mesh build explicitly.'),{code:'UNSUPPORTED_MANUFACTURING_MESH_BUILD'});if(spec.shellVersion===1)return requireAvailableShellBuild(engine,revision);if(spec!==OCC_MANUFACTURING_MESH_BUILD)throw Object.assign(Error('The registered manufacturing cohort is not installed.'),{code:'ENGINE_BUILD_UNAVAILABLE'});loftMountOptions(manufacturingAssets,'manufacturing-mesh',blindManufacturingModules);return spec;}

// Discovery allocates no Worker. Optional cohorts validate their closed graph
// before advertising authoring; selecting one never migrates existing history.
export function listAvailableSelectedProfileBuilds(){
 const out=[OCC_SELECTED_PROFILE_BUILD];
 for(const [spec,assets,prefix] of [[OCC_POLYGON_PROFILE_BUILD,polygonAssets,'polygon-profile'],[OCC_MECHANICAL_PROFILE_BUILD,mechanicalAssets,'mechanical-profile'],[OCC_BOOLEAN_HISTORY_BUILD,booleanAssets,'boolean-history'],[OCC_REVOLVE_PROFILE_BUILD,revolveAssets,'revolve-profile'],[OCC_SWEEP_PROFILE_BUILD,sweepAssets,'sweep-profile']])if(assets){if((spec as any).selectedRegionArrangementVersion===1)requireArrangementAssets(assets,prefix as string);out.push(spec);}
 return Object.freeze([...out,...listAvailableLoftBuilds()]);
}
export function requireAvailableSelectedProfileBuild(engine:string,revision:string){const spec=requireSelectedProfileBuild(engine,revision);if(!listAvailableSelectedProfileBuilds().includes(spec))throw Object.assign(Error('The selected profile runtime is not available in this app.'),{code:'ENGINE_BUILD_UNAVAILABLE'});return spec;}
