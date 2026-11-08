// Explicit component native build; existing assets/defaults are unchanged.
const path=require('node:path');
const {stageOwnedProfileComponent}=require('./stage-owned-profile-component.cjs');
const defaultOutput=path.resolve(__dirname,'../.build/revolve-profile-assets');
stageOwnedProfileComponent({selectedRegionArrangementVersion:1,input:process.argv[2],output:process.argv[3]||defaultOutput,defaultOutput,
 jsSha:'567419c13c78fff46cbc9cd07e5a993106b652a13cb9f6944831f68ef48729cc',
 wasmSha:'ad9475c81ea2eecadd41c73f0b0860d7d06c53e4292b16047472f03995f3efdd',
 constructorModule:'modules/engine/mount/occ-revolve-profile-mount.mjs',
 rootModules:['modules/engine/mount/ownedRevolvePlan.mjs','modules/engine/mount/ownedLinearHolePatternPlan.mjs','modules/engine/mount/ownedThroughHolePlan.mjs','modules/engine/mount/selectionLineageIndex.mjs','modules/engine/mount/ownedBooleanContract.mjs','modules/engine/mount/selectionAncestryIndex.mjs'],
 workerName:'revolve-profile-worker.js',prefix:'revolve-profile',format:'revolve-profile-component/1'});
