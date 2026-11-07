// Bind our source-built CSP-compatible kernel to a static same-origin Worker.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const cache=path.join(root,'node_modules/.cache/codi-smlib');
const output=path.join(root,'.build/smlib-worker');
const expected={
 'smlib.mjs':'edf63120f9e08e7fbad9fa2e44bebb8b28eee0dfaae50b4b720fd084438f6c24',
 'smlib.wasm':'a48a3283760c21337881c5e2d5c973dbc62cf95cae46d1c012effd75389eb1ae'
};
for(const [name,digest] of Object.entries(expected)){
 const file=path.join(cache,name);
 if(!fs.existsSync(file)||crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==digest)throw Error('Missing or mismatched source-built SMLib '+name+'; see modules/engine/smlib/README.md');
}
fs.mkdirSync(output,{recursive:true});
execFileSync(process.execPath,[path.join(root,'node_modules/webpack/bin/webpack.js'),'--config',path.join(root,'modules/engine/smlib/webpack.worker.cjs')],{
 cwd:root,env:{...process.env,CODI_SMLIB_GLUE:path.join(cache,'smlib.mjs'),CODI_SMLIB_OUTPUT:output},stdio:'inherit'
});
fs.copyFileSync(path.join(cache,'smlib.wasm'),path.join(output,'smlib.wasm'));
const workerDigest=crypto.createHash('sha256').update(fs.readFileSync(path.join(output,'smlib-worker.js'))).digest('hex');
console.log(JSON.stringify({smlibWorkerSha256:workerDigest,wasmSha256:expected['smlib.wasm']}));
