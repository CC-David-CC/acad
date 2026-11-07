// Tiny Workers only. Preserve production guards; alter isolated fixture copies.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),assets=path.resolve(process.env.CODI_RAW_EXPERIMENT_ASSETS||path.join(root,'.build/multivoid'));
process.env.CODI_RAW_SMLIB_GLUE=path.join(assets,'raw-provider.mjs');
const webpack=require(path.join(root,'node_modules/webpack'));
const config=require(path.join(root,'modules/engine/raw-smlib/webpack.worker.cjs'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const source=fs.readFileSync(path.join(root,'modules/engine/raw-smlib/rawWorker.js'),'utf8');
const mount=fs.readFileSync(path.join(root,'modules/engine/raw-smlib/rawMount.mjs'),'utf8');
const gate="if(x.materialRegions>1&&x.voidRegions>0)fail('MULTI_MATERIAL_VOID_UNSUPPORTED');";
if(source.split(gate).length!==2||mount.split('e.materialRegions<2 || e.voidRegions>0').length!==2)throw Error('Expected exact production gates.');
for(const kind of ['baseline','candidate','direct'])fs.mkdirSync(path.join(assets,kind),{recursive:true});
fs.writeFileSync(path.join(assets,'baseline/rawMount.mjs'),mount);
const entry=path.join(assets,'candidate/entry.js');
fs.writeFileSync(entry,source.replace(gate,'').replace('../mount/displayProjection.mjs',path.join(root,'modules/engine/mount/displayProjection.mjs')));
const build=(entry,out)=>new Promise((resolve,reject)=>webpack({...config,entry,output:{...config.output,path:out}},(error,stats)=>error||stats.hasErrors()?reject(error||Error(stats.toString())):resolve()));
(async()=>{
 await build(entry,path.join(assets,'candidate'));
 const workerSha=sha(fs.readFileSync(path.join(assets,'candidate/raw-smlib-worker.js')));
 fs.writeFileSync(path.join(assets,'candidate/rawMount.mjs'),mount.replace('e.materialRegions<2 || e.voidRegions>0','e.materialRegions<2').replace('5c17193baaabef79fb4cc6ad4e552e56e36bc9d07fd1b0ebf03ea392eac5f45f',workerSha));
 await build(path.join(__dirname,'direct-worker.js'),path.join(assets,'direct'));
 console.log(JSON.stringify({candidateWorkerSha256:workerSha,directWorkerSha256:sha(fs.readFileSync(path.join(assets,'direct/raw-smlib-worker.js')))}));
})().catch(e=>{console.error(e);process.exitCode=1;});
