// Explicit generated entry for checked raw-query assets, never a model build.
const fs=require('node:fs'),path=require('node:path');
const {validateFiniteCurveSupportStage,writeFiniteCurveSupportNullEntry,
 DEFAULT_OUTPUT,DEFAULT_ENTRY,FINITE_CURVE_SUPPORT_FILES:files}=require('./prepare-finite-curve-support-assets.cjs');
async function main(){
 // Retire any previous advertised entry before validation. A failed/stale
 // configured stage cannot silently preserve last build's active import.
 writeFiniteCurveSupportNullEntry();
 const manifest=await validateFiniteCurveSupportStage(DEFAULT_OUTPUT);
 const modules=files.slice(3),imports=files.map((name,i)=>
  'import p'+i+' from '+JSON.stringify('./finite-curve-support-assets/'+name)+';').join('\n');
 const metadata={};
 for(const key of ['format','sourceQueryOnly','finiteCurveSupportReadVersion',
  'sourceCommit','sourceTree','jsSha256','wasmSha256','jsBytes','wasmBytes',
  'bootstrapSha256','workerSha256','queryImportRoots','sourceBindings','sources','files'])
  metadata[key]=manifest[key];
 const table=modules.map((name,i)=>JSON.stringify(name)+':p'+(i+3)).join(',');
 const source=imports+'\nexport default {'+
  Object.entries(metadata).map(([key,value])=>JSON.stringify(key)+':'+JSON.stringify(value)).join(',')+
  ',worker:p0,js:p1,wasm:p2,modules:{'+table+'}};\n';
 const temporary=DEFAULT_ENTRY+'.pending-'+process.pid;
 // This is owned build-output publication, not production/user file storage.
 fs.writeFileSync(temporary,source,{flag:'wx'});
 try{
  await validateFiniteCurveSupportStage(DEFAULT_OUTPUT);
  fs.renameSync(temporary,DEFAULT_ENTRY);
 }finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
 console.log(JSON.stringify({entry:DEFAULT_ENTRY,format:manifest.format,
  sourceQueryOnly:true,finiteCurveSupportReadVersion:1,scope:'raw-support-only-unqualified'}));
}
if(require.main===module){
 if(process.argv.length!==2){console.error('Usage: finite-curve-support-assets-entry.cjs');process.exitCode=1;}
 else main().catch(error=>{console.error(error);process.exitCode=1;});
}
module.exports={writeFiniteCurveSupportAssetEntry:main};
