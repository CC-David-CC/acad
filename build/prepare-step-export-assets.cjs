// Optional native build. Existing builds neither need nor advertise step-export.
// A stale configured output is refused, never silently loaded or overwritten.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),base=path.join(root,'.build/step-export-assets'),entry=path.join(root,'.build/step-export-entry.mjs'),input=process.env.CODI_STEP_NATIVE_DIR,sha=b=>crypto.createHash('sha256').update(b).digest('hex');
fs.mkdirSync(path.dirname(entry),{recursive:true});
if(typeof input!=='string'||!input.trim()){
 fs.writeFileSync(entry,'// Optional step-export native assets were not explicitly configured.\nexport default null;\n');
 console.log(JSON.stringify({available:false,nativeInputsRead:false,entry}));
}else{
 const expected={js:'ca349411fc9e27677bf27072497abb22077d80c28e27ef073266966d16b07733',wasm:'c154a4e04961a9a50108fadcf72eca54169ba4db2e9564d24519f197e0568c2f'};
 if(sha(fs.readFileSync(path.join(input,'occ-portable.js')))!==expected.js||sha(fs.readFileSync(path.join(input,'main.wasm')))!==expected.wasm)throw Error('Unexpected step-export native input');
 if(fs.existsSync(base)){
  // Reproduce into an own temporary directory rather than trusting an editable
  // cache manifest. Reuse only an exact current source/native-byte stage.
  const temporary=fs.mkdtempSync(path.join(root,'.build/.step-export-verify-'));
  try{
   const candidate=path.join(temporary,'component');
   execFileSync(process.execPath,[path.join(__dirname,'prepare-step-export-profile-assets.cjs'),input,candidate],{stdio:'pipe'});
   const actual=JSON.parse(fs.readFileSync(path.join(base,'component.json'),'utf8')),fresh=JSON.parse(fs.readFileSync(path.join(candidate,'component.json'),'utf8'));
   for(const key of ['format','jsSha256','wasmSha256','bootstrapSha256','workerSha256','sources','files'])if(JSON.stringify(actual[key])!==JSON.stringify(fresh[key]))throw Error('Stale step-export stage; use a fresh task-owned output');
   for(const[name,pin]of Object.entries(fresh.files)){const b=fs.readFileSync(path.join(base,name));if(b.length!==pin.bytes||sha(b)!==pin.sha256)throw Error('Adaptive metrology stage changed: '+name);}
  }finally{fs.rmSync(temporary,{recursive:true,force:true});}
 }else execFileSync(process.execPath,[path.join(__dirname,'prepare-step-export-profile-assets.cjs'),input,base],{stdio:'inherit'});
 execFileSync(process.execPath,[path.join(__dirname,'step-export-assets-entry.cjs')],{stdio:'inherit'});
 console.log(JSON.stringify({available:true,entry,jsSha256:expected.js,wasmSha256:expected.wasm}));
}
