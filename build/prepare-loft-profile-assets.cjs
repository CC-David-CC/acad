// Explicit component native build; existing assets/defaults are unchanged.
const path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const bootstrapSha='d7ef4d7789dcc9f797f56ac4bd9247a9aa4832b79214505dbe790d2e659cff41';
if(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../modules/engine/mount/oci-verified-worker.js'))).digest('hex')!==bootstrapSha)throw Error('Unexpected loft bootstrap');
const {stageOwnedProfileComponent}=require('./stage-owned-profile-component.cjs');
const defaultOutput=path.resolve(__dirname,'../.build/loft-profile-assets');
if(fs.existsSync(process.argv[3]||defaultOutput))throw Error('Use a fresh loft component output');
stageOwnedProfileComponent({selectedRegionArrangementVersion:1,input:process.argv[2],output:process.argv[3]||defaultOutput,defaultOutput,
 jsSha:'5ce2aa94ecdd48dc16f0b9c3ad2a065ea1416ddb7d123c3168661e31ade0a1b5',
 wasmSha:'b18af4376fb0fb8b4aaa7478ede6b47346c331ee45e1198347c0a70232fd4180',
 constructorModule:'modules/engine/mount/occ-loft-profile-mount.mjs',
 rootModules:['modules/engine/mount/ownedLoftPlan.mjs','modules/engine/mount/ownedSweepPlan.mjs','modules/engine/mount/ownedRevolvePlan.mjs','modules/engine/mount/ownedLinearHolePatternPlan.mjs','modules/engine/mount/ownedThroughHolePlan.mjs','modules/engine/mount/selectionLineageIndex.mjs','modules/engine/mount/ownedBooleanContract.mjs','modules/engine/mount/selectionAncestryIndex.mjs'],
 workerName:'loft-profile-worker.js',prefix:'loft-profile',format:'loft-profile-component/1'});
