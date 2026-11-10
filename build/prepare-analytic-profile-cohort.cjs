// Optional genuine analytic Native cohort; no old pair or silent fallback.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {stageOwnedProfileComponent}=require('./stage-owned-profile-component.cjs');
const {assertOwnedProfileResourceClosure}=require('./owned-profile-resource-closure.cjs');
const root=path.resolve(__dirname,'..'),configured=process.env.CODI_ANALYTIC_PROFILE_NATIVE_DIR?.trim();
const entry=path.join(root,'.build/analytic-profile-entry.mjs');
if(!configured){fs.mkdirSync(path.dirname(entry),{recursive:true});fs.writeFileSync(entry,'export default null;\n');}
else{
 const pinsText=fs.readFileSync(path.join(root,'modules/engine/mount/analyticProfileNativeContract.mjs'),'utf8');
 // The reviewed source pin leaf is data; never execute it to stage a Native pair.
 const pick=name=>{const matches=[...pinsText.matchAll(new RegExp("\\b"+name+"\\s*:\\s*'([a-f0-9]{"+(name==='nativeSourceCommit'?40:64)+"})'","g"))];if(matches.length!==1)throw Error('Analytic Native pair is not explicitly source-pinned: '+name);return matches[0][1];};
 const jsSha=pick('jsSha256'),wasmSha=pick('wasmSha256'),nativeSourceCommit=pick('nativeSourceCommit'),nativeHeaderSha256=pick('nativeHeaderSha256');
 const base=path.join(root,'.build/analytic-profile-assets');
 if(fs.existsSync(base))throw Error('Use a fresh task-owned analytic-profile output; do not overwrite a producing stage');
 const manifest=stageOwnedProfileComponent({input:path.resolve(configured),output:base,defaultOutput:base,jsSha,wasmSha,constructorModule:'modules/engine/mount/ownedAnalyticProfileWorker.mjs',workerName:'analytic-profile-worker.js',prefix:'analytic-profile',format:'analytic-profile-component/1',rootModules:['modules/engine/mount/analyticProfileNativeContract.mjs','modules/engine/mount/ownedStepExportProtocol.mjs','modules/engine/mount/ownedManufacturingMeshProtocol.mjs','modules/engine/mount/manufacturingMeshRecord.mjs']});
 const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
 const modules=Object.keys(manifest.sources).sort();if(modules.length>128)throw Error('Analytic Worker closure exceeds its bounded resource census');
 assertOwnedProfileResourceClosure(base,manifest,modules);
 const files=['modules/engine/mount/analytic-profile-worker.js','analytic-profile-occ-portable.js','analytic-profile-occ.wasm',...modules];
 if(Object.keys(manifest.files).sort().join('\n')!==files.slice().sort().join('\n'))throw Error('Analytic Worker file census differs');
 for(const file of files){const bytes=fs.readFileSync(path.join(base,file)),pin=manifest.files[file];if(bytes.length!==pin.bytes||sha(bytes)!==pin.sha256)throw Error('Analytic stage bytes changed');}
 const sourceFiles=['build/prepare-analytic-profile-cohort.cjs','build/stage-owned-profile-component.cjs','build/owned-profile-resource-closure.cjs','build/embedded-display.cjs','modules/engine/mount/displayProjection.mjs','modules/engine/mount/oci-verified-worker.js','modules/engine/mount/analyticProfileNativeContract.mjs','modules/engine/mount/occ-analytic-profile-mount.mjs'];
 const producerSources=Object.fromEntries(sourceFiles.map(name=>[name,sha(fs.readFileSync(path.join(root,name)))]));
 const imports=files.map((file,i)=>'import p'+i+' from '+JSON.stringify('./analytic-profile-assets/'+file)+';').join('\n');
 const metadata={format:manifest.format,jsSha256:jsSha,wasmSha256:wasmSha,nativeSourceCommit,nativeHeaderSha256,workerSha256:manifest.workerSha256,bootstrapSha256:manifest.bootstrapSha256,files:manifest.files,sources:manifest.sources,producerSources};
 const table=modules.map((name,i)=>JSON.stringify(name)+':p'+(i+3)).join(',');
 fs.writeFileSync(entry,imports+'\nexport default Object.freeze({...'+JSON.stringify(metadata)+',worker:p0,js:p1,wasm:p2,modules:{'+table+'}});\n');
}
