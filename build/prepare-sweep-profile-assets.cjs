// Explicit component native build; existing assets/defaults are unchanged.
const path=require('node:path');
const {stageOwnedProfileComponent}=require('./stage-owned-profile-component.cjs');
const defaultOutput=path.resolve(__dirname,'../.build/sweep-profile-assets');
stageOwnedProfileComponent({selectedRegionArrangementVersion:1,input:process.argv[2],output:process.argv[3]||defaultOutput,defaultOutput,
 jsSha:'a9cfa6e53a8bc14f2fb035e33afd1a82d9ae36ace1cf9f66169c739d2de72580',
 wasmSha:'e105bdfe7c7bcb113eee5398d8202831cb8e8b1608dcc1730fc4461c9f24263d',
 constructorModule:'modules/engine/mount/occ-sweep-profile-mount.mjs',
 rootModules:['modules/engine/mount/ownedSweepPlan.mjs','modules/engine/mount/ownedRevolvePlan.mjs','modules/engine/mount/ownedLinearHolePatternPlan.mjs','modules/engine/mount/ownedThroughHolePlan.mjs','modules/engine/mount/selectionLineageIndex.mjs','modules/engine/mount/ownedBooleanContract.mjs','modules/engine/mount/selectionAncestryIndex.mjs'],
 workerName:'sweep-profile-worker.js',prefix:'sweep-profile',format:'sweep-profile-component/1'});
