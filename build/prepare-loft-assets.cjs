// Optional native build. Existing builds neither need nor advertise loft.
// A stale configured output is refused, never silently loaded or overwritten.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),base=path.join(root,'.build/loft-profile-assets'),entry=path.join(root,'.build/loft-profile-entry.mjs'),input=process.env.CODI_LOFT_NATIVE_DIR,sha=b=>crypto.createHash('sha256').update(b).digest('hex');
fs.mkdirSync(path.dirname(entry),{recursive:true});
if(typeof input!=='string'||!input.trim()){
 fs.writeFileSync(entry,'// Optional loft native assets were not explicitly configured.\nexport default null;\n');
 console.log(JSON.stringify({available:false,nativeInputsRead:false,entry}));
}else{
 const expected={js:'5ce2aa94ecdd48dc16f0b9c3ad2a065ea1416ddb7d123c3168661e31ade0a1b5',wasm:'b18af4376fb0fb8b4aaa7478ede6b47346c331ee45e1198347c0a70232fd4180'};
 if(sha(fs.readFileSync(path.join(input,'occ-portable.js')))!==expected.js||sha(fs.readFileSync(path.join(input,'main.wasm')))!==expected.wasm)throw Error('Unexpected loft native input');
 if(fs.existsSync(base)){
  // Reproduce into an own temporary directory rather than trusting an editable
  // cache manifest. Reuse only an exact current source/native-byte stage.
  const temporary=fs.mkdtempSync(path.join(root,'.build/.loft-verify-'));
  try{
   const candidate=path.join(temporary,'component');
   execFileSync(process.execPath,[path.join(__dirname,'prepare-loft-profile-assets.cjs'),input,candidate],{stdio:'pipe'});
   const actual=JSON.parse(fs.readFileSync(path.join(base,'component.json'),'utf8')),fresh=JSON.parse(fs.readFileSync(path.join(candidate,'component.json'),'utf8'));
   for(const key of ['format','jsSha256','wasmSha256','bootstrapSha256','workerSha256','selectedRegionArrangementVersion','sources','files'])if(JSON.stringify(actual[key])!==JSON.stringify(fresh[key]))throw Error('Stale loft stage; use a fresh task-owned output');
   for(const[name,pin]of Object.entries(fresh.files)){const b=fs.readFileSync(path.join(base,name));if(b.length!==pin.bytes||sha(b)!==pin.sha256)throw Error('Loft stage changed: '+name);}
  }finally{fs.rmSync(temporary,{recursive:true,force:true});}
 }else execFileSync(process.execPath,[path.join(__dirname,'prepare-loft-profile-assets.cjs'),input,base],{stdio:'inherit'});
 execFileSync(process.execPath,[path.join(__dirname,'loft-profile-assets-entry.cjs')],{stdio:'inherit'});
 console.log(JSON.stringify({available:true,entry,jsSha256:expected.js,wasmSha256:expected.wasm}));
}
