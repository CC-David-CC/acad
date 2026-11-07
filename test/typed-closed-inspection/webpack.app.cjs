process.env.CODI_EMBED_NUMERIC='1';process.env.CODI_EMBED_MANIFOLD='1';
const path=require('path'),root=path.resolve(__dirname,'../..'),config=require('../../webpack.config');
config.resolve.symlinks=false;config.devtool=false;config.entry={index:config.entry.index};
const project=path.join(root,'.build/typed-inspection-project-worker');
config.resolve.alias['codi-project-validation-worker$']=path.join(project,'worker.js');
config.module.rules.splice(1,0,{include:[project],type:'asset/resource',generator:{filename:'project-validator.[contenthash][ext]'}});
module.exports=config;
