// Explicit component native build; existing assets/defaults are unchanged.
const path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const bootstrapSha='44fbc4522d3dc9c5219b3908f53fcbda5c180d2e361d18bd31c5876d3c78b48e';
if(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../modules/engine/mount/oci-verified-worker.js'))).digest('hex')!==bootstrapSha)throw Error('Unexpected manufacturing-mesh bootstrap');
const {stageOwnedProfileComponent}=require('./stage-owned-profile-component.cjs');
const defaultOutput=path.resolve(__dirname,'../.build/manufacturing-mesh-assets');
if(fs.existsSync(process.argv[3]||defaultOutput))throw Error('Use a fresh manufacturing-mesh component output');
stageOwnedProfileComponent({selectedRegionArrangementVersion:1,input:process.argv[2],output:process.argv[3]||defaultOutput,defaultOutput,
 jsSha:'32eec74e3019d9e2d767c9016f05aa3daa49441c6102423a269d67b9c7f02a08',
 wasmSha:'abbf2aa02a6f2101c600aa1eedd20fa80ab2db206e677ca860d9c5103cdfbfcc',
 constructorModule:'modules/engine/mount/occ-manufacturing-mesh-mount.mjs',
 rootModules:['modules/engine/extrusion/isolatedOpenProfileComponents.mjs','modules/engine/mount/ownedDrawingReadProtocol.mjs','modules/engine/mount/drawingReferenceFacts.mjs','modules/engine/mount/cylinderCutWitness.mjs','modules/engine/extrusion/selectedRegionDescriptor.mjs','modules/drawing/linkedPartDrawingDefinition.mjs','modules/engine/mount/manufacturingMeshRecord.mjs','modules/engine/mount/orthographicAnalyticRecord.mjs','modules/engine/mount/ownedLoftPlan.mjs','modules/engine/mount/ownedSweepPlan.mjs','modules/engine/mount/ownedRevolvePlan.mjs','modules/engine/mount/ownedLinearHolePatternPlan.mjs','modules/engine/mount/ownedThroughHolePlan.mjs','modules/engine/mount/selectionLineageIndex.mjs','modules/engine/mount/ownedBooleanContract.mjs','modules/engine/mount/selectionAncestryIndex.mjs'],
 workerName:'manufacturing-mesh-worker.js',prefix:'manufacturing-mesh',format:'manufacturing-mesh-component/1'});
