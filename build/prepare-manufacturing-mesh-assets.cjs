// Optional native build. Existing builds neither need nor advertise manufacturing-mesh.
// A stale configured output is refused, never silently loaded or overwritten.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),base=path.join(root,'.build/manufacturing-mesh-assets'),entry=path.join(root,'.build/manufacturing-mesh-entry.mjs'),input=process.env.CODI_MANUFACTURING_MESH_NATIVE_DIR,sha=b=>crypto.createHash('sha256').update(b).digest('hex');
fs.mkdirSync(path.dirname(entry),{recursive:true});
if(typeof input!=='string'||!input.trim()){
 fs.writeFileSync(entry,'// Optional manufacturing-mesh native assets were not explicitly configured.\nexport default null;\n');
 console.log(JSON.stringify({available:false,nativeInputsRead:false,entry}));
}else{
 const expected={js:'32eec74e3019d9e2d767c9016f05aa3daa49441c6102423a269d67b9c7f02a08',wasm:'abbf2aa02a6f2101c600aa1eedd20fa80ab2db206e677ca860d9c5103cdfbfcc'};
 if(sha(fs.readFileSync(path.join(input,'occ-portable.js')))!==expected.js||sha(fs.readFileSync(path.join(input,'main.wasm')))!==expected.wasm)throw Error('Unexpected manufacturing-mesh native input');
 if(fs.existsSync(base)){
  // Reproduce into an own temporary directory rather than trusting an editable
  // cache manifest. Reuse only an exact current source/native-byte stage.
  const temporary=fs.mkdtempSync(path.join(root,'.build/.manufacturing-mesh-verify-'));
  try{
   const candidate=path.join(temporary,'component');
   execFileSync(process.execPath,[path.join(__dirname,'prepare-manufacturing-mesh-profile-assets.cjs'),input,candidate],{stdio:'pipe'});
   const actual=JSON.parse(fs.readFileSync(path.join(base,'component.json'),'utf8')),fresh=JSON.parse(fs.readFileSync(path.join(candidate,'component.json'),'utf8'));
   for(const key of ['format','jsSha256','wasmSha256','bootstrapSha256','workerSha256','selectedRegionArrangementVersion','sources','files'])if(JSON.stringify(actual[key])!==JSON.stringify(fresh[key]))throw Error('Stale manufacturing-mesh stage; use a fresh task-owned output');
   for(const[name,pin]of Object.entries(fresh.files)){const b=fs.readFileSync(path.join(base,name));if(b.length!==pin.bytes||sha(b)!==pin.sha256)throw Error('Manufacturing mesh stage changed: '+name);}
  }finally{fs.rmSync(temporary,{recursive:true,force:true});}
 }else execFileSync(process.execPath,[path.join(__dirname,'prepare-manufacturing-mesh-profile-assets.cjs'),input,base],{stdio:'inherit'});
 execFileSync(process.execPath,[path.join(__dirname,'manufacturing-mesh-assets-entry.cjs')],{stdio:'inherit'});
 console.log(JSON.stringify({available:true,entry,jsSha256:expected.js,wasmSha256:expected.wasm}));
}
