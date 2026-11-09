// Explicit component native build; existing assets/defaults are unchanged.
const path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const bootstrapSha='9d3823b386516cedbdb0e1567559a2fb0650210e74f5543641caf0f148d9fce8';
if(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../modules/engine/mount/oci-verified-worker.js'))).digest('hex')!==bootstrapSha)throw Error('Unexpected adaptive-metrology bootstrap');
const {stageOwnedProfileComponent}=require('./stage-owned-profile-component.cjs');
const defaultOutput=path.resolve(__dirname,'../.build/adaptive-metrology-assets');
if(fs.existsSync(process.argv[3]||defaultOutput))throw Error('Use a fresh adaptive-metrology component output');
stageOwnedProfileComponent({selectedRegionArrangementVersion:1,input:process.argv[2],output:process.argv[3]||defaultOutput,defaultOutput,
 jsSha:'ed06b634a3e81f9a51c89f75b3d65e03b8ace1fc483900ea2858eae8eff970a4',
 wasmSha:'bc8895ceb123e33aad68c8a1cf6322b5c0ccef9bfb129207defe1b8a5a7c893a',
 constructorModule:'modules/engine/mount/occ-adaptive-metrology-mount.mjs',
 rootModules:['modules/engine/mount/ownedLoftPlan.mjs','modules/engine/mount/ownedSweepPlan.mjs','modules/engine/mount/ownedRevolvePlan.mjs','modules/engine/mount/ownedLinearHolePatternPlan.mjs','modules/engine/mount/ownedThroughHolePlan.mjs','modules/engine/mount/selectionLineageIndex.mjs','modules/engine/mount/ownedBooleanContract.mjs','modules/engine/mount/selectionAncestryIndex.mjs'],
 workerName:'adaptive-metrology-worker.js',prefix:'adaptive-metrology',format:'adaptive-metrology-component/1'});
