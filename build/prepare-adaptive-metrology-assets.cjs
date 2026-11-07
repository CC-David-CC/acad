// Optional native build. Existing builds neither need nor advertise adaptive-metrology.
// A stale configured output is refused, never silently loaded or overwritten.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),base=path.join(root,'.build/adaptive-metrology-assets'),entry=path.join(root,'.build/adaptive-metrology-entry.mjs'),input=process.env.CODI_ADAPTIVE_METROLOGY_NATIVE_DIR,sha=b=>crypto.createHash('sha256').update(b).digest('hex');
fs.mkdirSync(path.dirname(entry),{recursive:true});
if(typeof input!=='string'||!input.trim()){
 fs.writeFileSync(entry,'// Optional adaptive-metrology native assets were not explicitly configured.\nexport default null;\n');
 console.log(JSON.stringify({available:false,nativeInputsRead:false,entry}));
}else{
 const expected={js:'ed06b634a3e81f9a51c89f75b3d65e03b8ace1fc483900ea2858eae8eff970a4',wasm:'bc8895ceb123e33aad68c8a1cf6322b5c0ccef9bfb129207defe1b8a5a7c893a'};
 if(sha(fs.readFileSync(path.join(input,'occ-portable.js')))!==expected.js||sha(fs.readFileSync(path.join(input,'main.wasm')))!==expected.wasm)throw Error('Unexpected adaptive-metrology native input');
 if(fs.existsSync(base)){
  // Reproduce into an own temporary directory rather than trusting an editable
  // cache manifest. Reuse only an exact current source/native-byte stage.
  const temporary=fs.mkdtempSync(path.join(root,'.build/.adaptive-metrology-verify-'));
  try{
   const candidate=path.join(temporary,'component');
   execFileSync(process.execPath,[path.join(__dirname,'prepare-adaptive-metrology-profile-assets.cjs'),input,candidate],{stdio:'pipe'});
   const actual=JSON.parse(fs.readFileSync(path.join(base,'component.json'),'utf8')),fresh=JSON.parse(fs.readFileSync(path.join(candidate,'component.json'),'utf8'));
   for(const key of ['format','jsSha256','wasmSha256','bootstrapSha256','workerSha256','sources','files'])if(JSON.stringify(actual[key])!==JSON.stringify(fresh[key]))throw Error('Stale adaptive-metrology stage; use a fresh task-owned output');
   for(const[name,pin]of Object.entries(fresh.files)){const b=fs.readFileSync(path.join(base,name));if(b.length!==pin.bytes||sha(b)!==pin.sha256)throw Error('Adaptive metrology stage changed: '+name);}
  }finally{fs.rmSync(temporary,{recursive:true,force:true});}
 }else execFileSync(process.execPath,[path.join(__dirname,'prepare-adaptive-metrology-profile-assets.cjs'),input,base],{stdio:'inherit'});
 execFileSync(process.execPath,[path.join(__dirname,'adaptive-metrology-assets-entry.cjs')],{stdio:'inherit'});
 console.log(JSON.stringify({available:true,entry,jsSha256:expected.js,wasmSha256:expected.wasm}));
}
