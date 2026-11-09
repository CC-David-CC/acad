// OFF by default. Known source identity never substitutes for actual installed
// bytes; reuse reproduces a current stage, and refuses any stale source output.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process'),{pathToFileURL}=require('node:url');
async function main(){
 const root=path.resolve(__dirname,'..'),base=path.join(root,'.build/mechanical-native-assets'),entry=path.join(root,'.build/mechanical-native-entry.mjs'),input=process.env.CODI_MECHANICAL_COHORT_NATIVE_DIR,sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
 fs.mkdirSync(path.dirname(entry),{recursive:true});
 if(typeof input!=='string'||!input.trim()){
  fs.writeFileSync(entry,fs.readFileSync(path.join(root,'build/mechanical-native-candidate-entry.mjs')));
  console.log(JSON.stringify({available:false,nativeInputsRead:false,entry}));return;
 }
 const {MECHANICAL_NATIVE_CANDIDATE:c}=await import(pathToFileURL(path.join(root,'modules/engine/mount/ownedMechanicalNativeCandidate.mjs')).href);
 if(sha(fs.readFileSync(path.join(input,'occ-portable.js')))!==c.jsSha256||sha(fs.readFileSync(path.join(input,'main.wasm')))!==c.wasmSha256)throw Error('Unexpected mechanical Native input');
 const producer=path.join(__dirname,'prepare-mechanical-cohort-profile-assets.cjs');
 if(fs.existsSync(base)){
  const temporary=fs.mkdtempSync(path.join(root,'.build/.mechanical-native-verify-'));
  try{
   const candidate=path.join(temporary,'component');execFileSync(process.execPath,[producer,input,candidate],{stdio:'pipe'});
   const actual=JSON.parse(fs.readFileSync(path.join(base,'component.json'),'utf8')),fresh=JSON.parse(fs.readFileSync(path.join(candidate,'component.json'),'utf8'));
   for(const key of ['format','profileSourceBindingVersion','jsSha256','wasmSha256','bootstrapSha256','workerSha256','selectedRegionArrangementVersion','sources','files'])if(JSON.stringify(actual[key])!==JSON.stringify(fresh[key]))throw Error('Stale mechanical Native stage; use a fresh task-owned output');
   for(const[name,pin]of Object.entries(fresh.files)){const bytes=fs.readFileSync(path.join(base,name));if(bytes.length!==pin.bytes||sha(bytes)!==pin.sha256)throw Error('Mechanical Native stage changed: '+name);}
  }finally{fs.rmSync(temporary,{recursive:true,force:true});}
 }else execFileSync(process.execPath,[producer,input,base],{stdio:'inherit'});
 execFileSync(process.execPath,[path.join(__dirname,'mechanical-native-assets-entry.cjs')],{stdio:'inherit'});
 console.log(JSON.stringify({available:true,entry,scope:'unqualified-initial-bound-mechanical-cohort',jsSha256:c.jsSha256,wasmSha256:c.wasmSha256}));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
