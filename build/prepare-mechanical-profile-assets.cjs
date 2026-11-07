// Explicit experimental main edge-treatment native runtime.
const path=require('node:path');
const {stageOwnedProfileComponent}=require('./stage-owned-profile-component.cjs');
const defaultOutput=path.resolve(__dirname,'../.build/mechanical-profile-assets');
stageOwnedProfileComponent({input:process.argv[2],output:process.argv[3]||defaultOutput,defaultOutput,
 jsSha:'b3d91cbb02f90ba56732039283d787b92eda97c51091fafbd933ecf4db30dd97',
 wasmSha:'28e8e2c2752cef100a98e24ec487f7d90021edb98fb060fdd1160fe63501bbe2',
 constructorModule:'modules/engine/mount/occ-mechanical-profile-mount.mjs',rootModules:['modules/engine/mount/selectionAncestryIndex.mjs'],workerName:'mechanical-profile-worker.js',prefix:'mechanical-profile',format:'mechanical-profile-component/1'});
