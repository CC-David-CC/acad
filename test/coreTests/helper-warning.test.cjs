const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),deps=path.resolve(process.env.CODI_TEST_NODE_MODULES||path.join(root,'node_modules'));
const webpack=require.resolve('webpack/bin/webpack.js',{paths:[deps]});
for(const [name,icon] of [['Serpinski helper',false],['direct icon identity',true]])test(name,()=>{
 const dir=fs.mkdtempSync(path.join(process.env.CODI_TEST_TMPDIR||os.tmpdir(),'jsketcher-helper-'));
 try{const env={...process.env,NODE_PATH:deps,CODI_TEST_NODE_MODULES:deps,CODI_TEST_OUTPUT:dir,CODI_ICON_IDENTITY:icon?'1':'0'};
  const result=spawnSync(process.execPath,[webpack,'--config',path.join(root,'test/coreTests/helper-warning-webpack.config.cjs')],{cwd:root,env,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr+'\n'+result.stdout);if(!icon)assert.doesNotMatch(result.stdout,/export .distance. .*not found/);
  const run=spawnSync(process.execPath,[path.join(dir,'helper.cjs')],{cwd:root,env,encoding:'utf8'});assert.equal(run.status,0,run.stderr+'\n'+run.stdout);assert.match(run.stdout,/^PASS/);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
