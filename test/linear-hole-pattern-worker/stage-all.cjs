// Fresh private closure; existing source/assets are only read.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),out=process.argv[2];if(!out||fs.existsSync(out))throw Error('Use a fresh output');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),files={},sources={};
function copy(source,name){const b=fs.readFileSync(source),p=path.join(out,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b);files[name]={sha256:hash(b),bytes:b.length};}
function moduleGraph(name,prefix,seen=new Set()){
 if(seen.has(name))return;seen.add(name);copy(path.join(root,name),prefix+'/'+name);sources[name]=hash(fs.readFileSync(path.join(root,name)));
 const text=fs.readFileSync(path.join(root,name),'utf8'),imports=/\b(?:import|export)\s+(?:[^'";]*?\s+from\s*)?['"]([^'"]+)['"]/g;let m;
 while((m=imports.exec(text))){if(!m[1].startsWith('.'))throw Error('External source dependency');moduleGraph(path.relative(root,path.resolve(root,path.dirname(name),m[1])),prefix,seen);}
}
const specs=[
 {id:'legacy',dir:'prism-assets',constructor:'oci-verified-mount.mjs',export:'createVerifiedOciMount',worker:'oci-verified-worker.js',js:'occ-portable.js',wasm:'occ.wasm'},
 {id:'selected',dir:'selected-profile-assets',constructor:'occ-selected-profile-mount.mjs',export:'createSelectedProfileOccMount',worker:'selected-profile-worker.js',js:'selected-profile-occ-portable.js',wasm:'selected-profile-occ.wasm'},
 ...['polygon','mechanical','boolean-history'].map(id=>({id,dir:id+'-profile-assets',constructor:id==='boolean-history'?'occ-boolean-history-mount.mjs':'occ-'+id+'-profile-mount.mjs',export:id==='boolean-history'?'createBooleanHistoryOccMount':id==='polygon'?'createPolygonProfileOccMount':'createMechanicalProfileOccMount',worker:'modules/engine/mount/'+(id==='boolean-history'?'boolean-history-worker.js':id+'-profile-worker.js'),js:id==='boolean-history'?'boolean-history-occ-portable.js':id+'-profile-occ-portable.js',wasm:id==='boolean-history'?'boolean-history-occ.wasm':id+'-profile-occ.wasm'}))
];specs[4].dir='boolean-history-assets';
for(const s of specs){
 const base=path.join(root,'.build',s.dir);
 if(s.id==='legacy'||s.id==='selected'){
  for(const name of fs.readdirSync(base))if(/\.(mjs|js|wasm)$/.test(name))copy(path.join(base,name),s.id+'/'+name);
  moduleGraph('modules/engine/mount/'+s.constructor,s.id);
 }else{const m=JSON.parse(fs.readFileSync(path.join(base,'component.json')));for(const [name,pin]of Object.entries(m.files)){const b=fs.readFileSync(path.join(base,name));if(hash(b)!==pin.sha256||b.length!==pin.bytes)throw Error('Changed component');copy(path.join(base,name),s.id+'/'+name);}s.component=m;}
 s.constructorPath='/'+s.id+'/modules/engine/mount/'+s.constructor;s.options={workerUrl:'/'+s.id+'/'+s.worker,jsPath:'/'+s.id+'/'+s.js,wasmPath:'/'+s.id+'/'+s.wasm};
 const exactPath=s.id+'/'+(s.id==='legacy'||s.id==='selected'?'':'modules/engine/mount/')+'exactMeshVolume.mjs';if(files[exactPath]?.sha256!==hash(fs.readFileSync(path.join(root,'modules/engine/mount/exactMeshVolume.mjs'))))throw Error('Exact helper missing');
}
fs.writeFileSync(path.join(out,'component.json'),JSON.stringify({format:'exact-volume-all-oci-components/1',files,sources,specs},null,2)+'\n');console.log(JSON.stringify({out,files:Object.keys(files).length}));
