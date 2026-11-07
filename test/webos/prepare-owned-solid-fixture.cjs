// Requires the reviewed build/prepare-prism-assets.cjs output. No UI bundle.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),out=process.argv[2];
if(!out||fs.existsSync(out))throw Error('Provide a new disposable fixture directory');
const dest=path.join(out,'static');fs.mkdirSync(dest,{recursive:true});
for(const name of fs.readdirSync(path.join(root,'modules/engine/mount')).filter(n=>n.endsWith('.mjs')))fs.copyFileSync(path.join(root,'modules/engine/mount',name),path.join(dest,name));
for(const name of ['oci-verified-worker.js','manifold-verified-worker.js','occ-portable.js'])fs.copyFileSync(path.join(root,'.build/prism-assets',name),path.join(dest,name));
for(const [name,file] of [['occ.wasm','occ.wasm'],['manifold.wasm','manifold-worker.wasm']])fs.symlinkSync(path.join(root,'.build/prism-assets',file),path.join(dest,name));
fs.writeFileSync(path.join(dest,'index.html'),'<!doctype html><title>Owned solid worker test</title>');
