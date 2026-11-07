// Direct NVIDIA-source backend; older third-party bridge assets cannot substitute.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),cache=process.env.CODI_RAW_SMLIB_CACHE||path.join(root,'node_modules/.cache/codi-raw-smlib'),out=path.join(root,'.build/raw-smlib-worker');
const expected={
 'raw-provider.mjs':'8e49622c97d839cf94d6c4d5e2de6cbd96d1166075741e08dcbda3b1a223d8fa',
 'raw-provider.wasm':'f33f19cd0098b610756db70ae0d25ac1dcba315e9af9eb90e387d0668be90daa'
};
// Fixed scratch avoids retaining another complete native file while checking
// the copied temporary output. Verify BOTH inputs before touching any output.
const scratch=Buffer.allocUnsafe(65536);
function fileHash(file){const hash=crypto.createHash('sha256'),fd=fs.openSync(file,'r');try{let n;while((n=fs.readSync(fd,scratch,0,scratch.length,null))!==0)hash.update(scratch.subarray(0,n));}finally{fs.closeSync(fd);}return hash.digest('hex');}
for(const [name,hash] of Object.entries(expected))if(!fs.existsSync(path.join(cache,name))||fileHash(path.join(cache,name))!==hash)throw Error('Missing or mismatched direct NVIDIA runtime '+name+'; see test/raw-smlib-corpus/README.md');
fs.mkdirSync(out,{recursive:true});
execFileSync(process.execPath,[path.join(root,'node_modules/webpack/bin/webpack.js'),'--config',path.join(root,'modules/engine/raw-smlib/webpack.worker.cjs')],{cwd:root,env:{...process.env,CODI_RAW_SMLIB_GLUE:path.join(cache,'raw-provider.mjs'),CODI_RAW_SMLIB_OUTPUT:out},stdio:'inherit'});
const workerHash=crypto.createHash('sha256').update(fs.readFileSync(path.join(out,'raw-smlib-worker.js'))).digest('hex');
if(workerHash!=='bbfdfe916d879fcc1ee84f59453f6b3dd67eb08ea92c06614e505aa35b413a65')throw Error('Unexpected direct NVIDIA worker output');
// Immutable cache inputs produce a readonly destination. Replace only the
// generated target by verified same-directory rename so repeat builds work.
const temporary=path.join(out,'.raw-provider-'+crypto.randomBytes(12).toString('hex')+'.tmp');
try{
 fs.copyFileSync(path.join(cache,'raw-provider.wasm'),temporary,fs.constants.COPYFILE_EXCL);
 if(fileHash(temporary)!==expected['raw-provider.wasm'])throw Error('Copied direct NVIDIA runtime changed');
 fs.renameSync(temporary,path.join(out,'raw-provider.wasm'));
}finally{fs.rmSync(temporary,{force:true});}
console.log(JSON.stringify({rawSmlibWorkerSha256:workerHash,wasmSha256:expected['raw-provider.wasm']}));
