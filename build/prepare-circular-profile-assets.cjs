// Explicit component native build; existing assets/defaults are unchanged.
const path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const bootstrapSha='44ad4cff5b13e3585e8a00a0c16c61f3be212d0f3dced71de6ed2287ae530214';
if(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../modules/engine/mount/oci-verified-worker.js'))).digest('hex')!==bootstrapSha)throw Error('Unexpected circular bootstrap');
const {stageOwnedProfileComponent}=require('./stage-owned-profile-component.cjs');
const defaultOutput=path.resolve(__dirname,'../.build/circular-assets');
if(fs.existsSync(process.argv[3]||defaultOutput))throw Error('Use a fresh circular component output');
stageOwnedProfileComponent({circularArrangementVersion:1,selectedRegionArrangementVersion:1,input:process.argv[2],output:process.argv[3]||defaultOutput,defaultOutput,
 jsSha:'9789a61709dc680cce64dfa29030a3862ee636319594bdc839c0ed92e9d3571b',
 wasmSha:'ad06c43be5d895c6cb41a562b53dee3f819c8b003182c5c99b65258e0b000c0d',
 constructorModule:'modules/engine/mount/occ-circular-mount.mjs',
 rootModules:["modules/engine/mount/ownedCircularNativeContract.mjs","modules/engine/mount/ownedCircularWorker.mjs","modules/engine/mount/ownedCircularArrangementProtocol.mjs","modules/engine/mount/circularArrangementPlan.mjs","modules/engine/mount/circularPrismSelectionIndex.mjs","modules/engine/extrusion/circularArrangementDescriptor.mjs","modules/engine/extrusion/circularTopology.mjs",'modules/engine/mount/nativePlanarAttachmentFacts.mjs','modules/engine/mount/ownedPlanarAttachmentProtocol.mjs','modules/engine/extrusion/isolatedOpenProfileComponents.mjs','modules/engine/mount/ownedShellWorker.mjs','modules/engine/mount/ownedDrawingReadProtocol.mjs','modules/engine/mount/drawingReferenceFacts.mjs','modules/engine/mount/cylinderCutWitness.mjs','modules/engine/extrusion/selectedRegionDescriptor.mjs','modules/drawing/linkedPartDrawingDefinition.mjs','modules/engine/mount/manufacturingMeshRecord.mjs','modules/engine/mount/orthographicAnalyticRecord.mjs','modules/engine/mount/ownedLoftPlan.mjs','modules/engine/mount/ownedSweepPlan.mjs','modules/engine/mount/ownedRevolvePlan.mjs','modules/engine/mount/ownedLinearHolePatternPlan.mjs','modules/engine/mount/ownedThroughHolePlan.mjs','modules/engine/mount/selectionLineageIndex.mjs','modules/engine/mount/ownedBooleanContract.mjs','modules/engine/mount/selectionAncestryIndex.mjs'],
 workerName:'circular-worker.js',prefix:'circular',format:'circular-component/1'});
