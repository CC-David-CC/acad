// The same finite roster drives preparation, real emitted resources and factory.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{pathToFileURL}=require('node:url');
const {assertOwnedProfileResourceClosure}=require('./owned-profile-resource-closure.cjs');
async function main(){
 const root=path.resolve(__dirname,'..'),base=path.join(root,'.build/mechanical-native-assets');
 const {MECHANICAL_NATIVE_CANDIDATE:c}=await import(pathToFileURL(path.join(root,'modules/engine/mount/ownedMechanicalNativeCandidate.mjs')).href);
 const {MECHANICAL_NATIVE_RESOURCE_MODULES:modules}=await import(pathToFileURL(path.join(root,'modules/engine/mount/ownedMechanicalNativeResources.mjs')).href);
 const manifest=JSON.parse(fs.readFileSync(path.join(base,'component.json'),'utf8'));
 if(manifest.format!=='mechanical-native-component/1'||manifest.profileSourceBindingVersion!==1||manifest.selectedRegionArrangementVersion!==1||manifest.circularArrangementVersion!==undefined||manifest.jsSha256!==c.jsSha256||manifest.wasmSha256!==c.wasmSha256)throw Error('Unexpected mechanical Native source/pair contract');
 const files=['modules/engine/mount/mechanical-native-worker.js','mechanical-native-occ-portable.js','mechanical-native-occ.wasm',...modules];
 for(const name of files){const bytes=fs.readFileSync(path.join(base,name)),pin=manifest.files[name];if(!pin||bytes.length!==pin.bytes||crypto.createHash('sha256').update(bytes).digest('hex')!==pin.sha256)throw Error('Mechanical Native component input changed: '+name);}
 assertOwnedProfileResourceClosure(base,manifest,modules);
 const imports=files.map((name,i)=>`import p${i} from ${JSON.stringify('./mechanical-native-assets/'+name)};`).join('\n'),table=Object.fromEntries(modules.map((name,i)=>[name,'p'+(i+3)]));
 const metadata={format:manifest.format,profileSourceBindingVersion:1,selectedRegionArrangementVersion:1,jsSha256:manifest.jsSha256,wasmSha256:manifest.wasmSha256,bootstrapSha256:manifest.bootstrapSha256,workerSha256:manifest.workerSha256};
 const source=imports+'\nexport default {'+Object.entries(metadata).map(([key,value])=>JSON.stringify(key)+':'+JSON.stringify(value)).join(',')+',worker:p0,js:p1,wasm:p2,modules:{'+Object.entries(table).map(([key,value])=>JSON.stringify(key)+':'+value).join(',')+'}};\n';
 fs.writeFileSync(path.join(root,'.build/mechanical-native-entry.mjs'),source);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
