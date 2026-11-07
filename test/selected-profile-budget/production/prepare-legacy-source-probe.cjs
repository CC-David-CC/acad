// Build a private probe of current shared bootstrap in legacy mode. Does not
// overwrite the existing default assets or alter their native JS/WASM.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),root=path.resolve(__dirname,'../../..');
const{embeddedWorker}=require(path.join(root,'build/embedded-oci-worker.cjs'));
const source=fs.readFileSync(path.join(root,'modules/engine/mount/oci-verified-worker.js'),'utf8'),glue=fs.readFileSync(path.join(root,'.build/prism-assets/occ-portable.js'),'utf8');
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');if(hash(glue)!=='a84b31900e58e61a1d7e3f8d04978408455764ad149923359e7fba19d3d07884')throw Error('Default native JS identity changed.');
const output=embeddedWorker(source,glue),target=path.join(__dirname,'legacy-regenerated-worker.js');fs.writeFileSync(target,output,{flag:'wx'});console.log(JSON.stringify({scope:'Private current-source legacy probe, no default overwrite',sourceSha256:hash(source),jsSha256:hash(glue),workerSha256:hash(output)}));
