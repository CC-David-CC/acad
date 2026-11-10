// Optional build-time preparation only. No runtime/model/default promotion.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {prepareFiniteCurveSupportAssets,validateFiniteCurveSupportStage,
 writeFiniteCurveSupportNullEntry,DEFAULT_OUTPUT,DEFAULT_ENTRY}=require('./prepare-finite-curve-support-assets.cjs');
async function main(){
 // Always reset the generated entry first, including a configured failure.
 // Existing stage bytes are retained and checked; never deleted/repaired/reused
 // as another pair or silently substituted when the env is absent.
 writeFiniteCurveSupportNullEntry();
 const input=process.env.CODI_FINITE_CURVE_SUPPORT_NATIVE_DIR;
 if(typeof input!=='string'||!input.trim()){
  console.log(JSON.stringify({available:false,nativeInputsRead:false,entry:DEFAULT_ENTRY,
   scope:'optional-finite-curve-support-off'}));return;
 }
 const root=path.resolve(__dirname,'..');
 if(fs.existsSync(DEFAULT_OUTPUT)){
  // Reproduce from actual supplied Native input into a NEW owned directory.
  // Compare all identity/source/file metadata apart from its truthful output
  // location, then validate all original staged bytes against current sources.
  const temporary=fs.mkdtempSync(path.join(root,'.build/.finite-curve-support-verify-'));
  try{
   const fresh=await prepareFiniteCurveSupportAssets(input,path.join(temporary,'component'));
   const actual=await validateFiniteCurveSupportStage(DEFAULT_OUTPUT);
   const withoutOutput=m=>{const {output,...rest}=m;return rest;};
   if(JSON.stringify(withoutOutput(actual))!==JSON.stringify(withoutOutput(fresh)))
    throw Error('Stale finite-curve stage; use a fresh task-owned output');
  }finally{fs.rmSync(temporary,{recursive:true,force:true});}
 }else await prepareFiniteCurveSupportAssets(input,DEFAULT_OUTPUT);
 execFileSync(process.execPath,[path.join(__dirname,'finite-curve-support-assets-entry.cjs')],{stdio:'inherit'});
 console.log(JSON.stringify({available:true,entry:DEFAULT_ENTRY,
  scope:'prepared-assets-only-raw-support-unqualified',sourceQueryOnly:true,
  finiteCurveSupportReadVersion:1}));
}
if(require.main===module){
 if(process.argv.length!==2){console.error('Usage: prepare-finite-curve-support-cohort.cjs');process.exitCode=1;}
 else main().catch(error=>{console.error(error);process.exitCode=1;});
}
module.exports={prepareFiniteCurveSupportCohort:main};
