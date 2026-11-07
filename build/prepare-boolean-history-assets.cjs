// Experimental owned Boolean history component; no deployment/default change.
const path=require('node:path');
const {stageOwnedProfileComponent}=require('./stage-owned-profile-component.cjs');
const defaultOutput=path.resolve(__dirname,'../.build/boolean-history-assets');
stageOwnedProfileComponent({input:process.argv[2],output:process.argv[3]||defaultOutput,defaultOutput,
 jsSha:'dd666902fe926d69cc3c8843f5568c2a3e569f38ff49291baa2f248165b5ea99',
 wasmSha:'8d5e537e0d7f9e12b8ae0eaf239c0be1080934ed12a24bf6e7f849c9135ed5a2',
 constructorModule:'modules/engine/mount/occ-boolean-history-mount.mjs',
 rootModules:['modules/engine/mount/ownedLinearHolePatternPlan.mjs','modules/engine/mount/ownedThroughHolePlan.mjs','modules/engine/mount/selectionLineageIndex.mjs','modules/engine/mount/ownedBooleanContract.mjs','modules/engine/mount/selectionAncestryIndex.mjs'],
 workerName:'boolean-history-worker.js',prefix:'boolean-history',format:'boolean-history-component/1'});
