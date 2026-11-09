// Explicit component native build; existing assets/defaults are unchanged.
const path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const bootstrapSha='7864b6ca0e29ccc3a985d4950e02b0faf720d83f95b71e2f7e388310b4525945';
if(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../modules/engine/mount/oci-verified-worker.js'))).digest('hex')!==bootstrapSha)throw Error('Unexpected orthographic-profile bootstrap');
const {stageOwnedProfileComponent}=require('./stage-owned-profile-component.cjs');
const defaultOutput=path.resolve(__dirname,'../.build/orthographic-profile-assets');
if(fs.existsSync(process.argv[3]||defaultOutput))throw Error('Use a fresh orthographic-profile component output');
stageOwnedProfileComponent({input:process.argv[2],output:process.argv[3]||defaultOutput,defaultOutput,
 jsSha:'2f2e9f92b2b57024b372143c3f2f4aa3dc4999bad7f6636c36f0b0f599f04cb7',
 wasmSha:'26d94303a8561b0922acae5b921f486e857083d8febaa9638d1ebd0eff590018',
 constructorModule:'modules/engine/mount/occ-orthographic-profile-mount.mjs',
 rootModules:['modules/engine/mount/orthographicAnalyticRecord.mjs','modules/engine/mount/ownedLoftPlan.mjs','modules/engine/mount/ownedSweepPlan.mjs','modules/engine/mount/ownedRevolvePlan.mjs','modules/engine/mount/ownedLinearHolePatternPlan.mjs','modules/engine/mount/ownedThroughHolePlan.mjs','modules/engine/mount/selectionLineageIndex.mjs','modules/engine/mount/ownedBooleanContract.mjs','modules/engine/mount/selectionAncestryIndex.mjs'],
 workerName:'orthographic-profile-worker.js',prefix:'orthographic-profile',format:'orthographic-profile-component/1'});
