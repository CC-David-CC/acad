// Explicit component native build; existing assets/defaults are unchanged.
const path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const bootstrapSha='92bf651cb26a0ced09b91bb8bd2734bc09b9795fbdfc34271828a4024eb29b5f';
if(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../modules/engine/mount/oci-verified-worker.js'))).digest('hex')!==bootstrapSha)throw Error('Unexpected step-export bootstrap');
const {stageOwnedProfileComponent}=require('./stage-owned-profile-component.cjs');
const defaultOutput=path.resolve(__dirname,'../.build/step-export-assets');
if(fs.existsSync(process.argv[3]||defaultOutput))throw Error('Use a fresh step-export component output');
stageOwnedProfileComponent({selectedRegionArrangementVersion:1,input:process.argv[2],output:process.argv[3]||defaultOutput,defaultOutput,
 jsSha:'ca349411fc9e27677bf27072497abb22077d80c28e27ef073266966d16b07733',
 wasmSha:'c154a4e04961a9a50108fadcf72eca54169ba4db2e9564d24519f197e0568c2f',
 constructorModule:'modules/engine/mount/occ-step-export-mount.mjs',
 rootModules:['modules/engine/mount/ownedLoftPlan.mjs','modules/engine/mount/ownedSweepPlan.mjs','modules/engine/mount/ownedRevolvePlan.mjs','modules/engine/mount/ownedLinearHolePatternPlan.mjs','modules/engine/mount/ownedThroughHolePlan.mjs','modules/engine/mount/selectionLineageIndex.mjs','modules/engine/mount/ownedBooleanContract.mjs','modules/engine/mount/selectionAncestryIndex.mjs'],
 workerName:'step-export-worker.js',prefix:'step-export',format:'step-export-component/1'});
