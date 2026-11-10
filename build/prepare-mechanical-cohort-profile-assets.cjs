// Exact optional mechanical Native component; never changes an old cohort.
const path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto'),{pathToFileURL}=require('node:url');
const bootstrapSha='982b1961d256843e81d90d74929b389c95600232c5f2188cc286d17847c1ac3a';
if(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../modules/engine/mount/oci-verified-worker.js'))).digest('hex')!==bootstrapSha)throw Error('Unexpected mechanical Native bootstrap');
const {stageOwnedProfileComponent}=require('./stage-owned-profile-component.cjs');
async function main(){
 const root=path.resolve(__dirname,'..'),defaultOutput=path.join(root,'.build/mechanical-native-assets');
 if(fs.existsSync(process.argv[3]||defaultOutput))throw Error('Use a fresh mechanical Native component output');
 const {MECHANICAL_NATIVE_CANDIDATE:c}=await import(pathToFileURL(path.join(root,'modules/engine/mount/ownedMechanicalNativeCandidate.mjs')).href);
 const {MECHANICAL_NATIVE_RESOURCE_MODULES:modules}=await import(pathToFileURL(path.join(root,'modules/engine/mount/ownedMechanicalNativeResources.mjs')).href);
 stageOwnedProfileComponent({profileSourceBindingVersion:1,selectedRegionArrangementVersion:1,input:process.argv[2],output:process.argv[3]||defaultOutput,defaultOutput,
  jsSha:c.jsSha256,wasmSha:c.wasmSha256,constructorModule:'modules/engine/mount/occ-mechanical-native-mount.mjs',
  rootModules:modules,workerName:'mechanical-native-worker.js',prefix:'mechanical-native',format:'mechanical-native-component/1'});
}
main().catch(error=>{console.error(error);process.exitCode=1;});
