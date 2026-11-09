// Explicit component native build; existing assets/defaults are unchanged.
const path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const bootstrapSha='b5dc2d70389cc0c7b2b206b48f292ae17d654dcff8c8b9615f9cb2b4d5f43831';
if(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../modules/engine/mount/oci-verified-worker.js'))).digest('hex')!==bootstrapSha)throw Error('Unexpected shell bootstrap');
const {stageOwnedProfileComponent}=require('./stage-owned-profile-component.cjs');
const defaultOutput=path.resolve(__dirname,'../.build/shell-assets');
if(fs.existsSync(process.argv[3]||defaultOutput))throw Error('Use a fresh shell component output');
stageOwnedProfileComponent({selectedRegionArrangementVersion:1,input:process.argv[2],output:process.argv[3]||defaultOutput,defaultOutput,
 jsSha:'57b74074e0a249b917ac68357fbd003c37d1ab61897206886b575088e6995858',
 wasmSha:'60dc956b08e01f43d08a48035a384e478e63bb34fb55f21a152c8cd12e8b8947',
 constructorModule:'modules/engine/mount/occ-shell-mount.mjs',
 rootModules:['modules/engine/mount/nativePlanarAttachmentFacts.mjs','modules/engine/mount/ownedPlanarAttachmentProtocol.mjs','modules/engine/extrusion/isolatedOpenProfileComponents.mjs','modules/engine/mount/ownedShellWorker.mjs','modules/engine/mount/ownedDrawingDerivedProtocol.mjs','modules/engine/mount/ownedDrawingSectionProtocol.mjs','modules/engine/mount/ownedDrawingSectionWorker.mjs','modules/engine/mount/drawingDetailClip.mjs','modules/engine/mount/ownedDrawingReadProtocol.mjs','modules/engine/mount/drawingReferenceFacts.mjs','modules/engine/mount/prismaticBoreFacts.mjs','modules/engine/mount/ownedBoreReadProtocol.mjs','modules/engine/mount/ownedBoreAnnotationProtocol.mjs','modules/engine/mount/cylinderCutWitness.mjs','modules/engine/extrusion/selectedRegionDescriptor.mjs','modules/drawing/linkedPartDrawingDefinition.mjs','modules/engine/mount/manufacturingMeshRecord.mjs','modules/engine/mount/orthographicAnalyticRecord.mjs','modules/engine/mount/ownedLoftPlan.mjs','modules/engine/mount/ownedSweepPlan.mjs','modules/engine/mount/ownedRevolvePlan.mjs','modules/engine/mount/ownedLinearHolePatternPlan.mjs','modules/engine/mount/ownedThroughHolePlan.mjs','modules/engine/mount/selectionLineageIndex.mjs','modules/engine/mount/ownedBooleanContract.mjs','modules/engine/mount/selectionAncestryIndex.mjs'],
 workerName:'shell-worker.js',prefix:'shell',format:'shell-component/1'});
