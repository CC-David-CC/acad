const webpack=require('webpack'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),output=fs.mkdtempSync(path.join(os.tmpdir(),'codi-state-batch-'));
webpack({mode:'development',target:'node',devtool:false,context:root,
  entry:path.join(__dirname,'state-batch.test.js'),output:{path:output,filename:'test.cjs'},
  resolve:{extensions:['.js','.ts'],modules:[path.join(root,'modules'),path.join(root,'node_modules')]},
  module:{rules:[{test:/\.js$/,use:'babel-loader',include:[path.join(root,'modules'),__dirname]}]}
},(error,stats)=>{try{
  if(error||stats.hasErrors()){console.error(error||stats.toString({all:false,errors:true}));process.exitCode=1;return;}
  const run=spawnSync(process.execPath,[path.join(output,'test.cjs')],{stdio:'inherit'});process.exitCode=run.status??1;
}finally{fs.rmSync(output,{recursive:true,force:true});}});
