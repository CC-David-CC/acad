// Explicit polygon R2 native component; no default-engine promotion.
const path=require('node:path');
const {stageOwnedProfileComponent}=require('./stage-owned-profile-component.cjs');
const defaultOutput=path.resolve(__dirname,'../.build/polygon-profile-assets');
stageOwnedProfileComponent({input:process.argv[2],output:process.argv[3]||defaultOutput,defaultOutput,
 jsSha:'5414a24c96eff09b77f7d3fe758287c9696e63127c91e73011f6f2939de2a8eb',
 wasmSha:'534ffdd2d88632a7878d654742f2df72c16691f3c814085e4f525efc74961e19',
 constructorModule:'modules/engine/mount/occ-polygon-profile-mount.mjs',workerName:'polygon-profile-worker.js',prefix:'polygon-profile',format:'polygon-profile-component/3'});
