const path=require('path'),root=path.resolve(__dirname,'../..'),config=require('../../webpack.config');
config.cache=false;config.mode='production';config.devtool=false;config.target='webworker';config.entry=path.join(__dirname,'worker.ts');config.resolve.alias.numeric=path.join(root,'node_modules/.cache/codi-numeric/precompiled.js');config.resolve.symlinks=false;
config.output={path:process.env.CODI_CONCENTRIC_OUTPUT,filename:'worker.js',globalObject:'self'};config.optimization={splitChunks:false,runtimeChunk:false};
const babel=config.module.rules.find(r=>r.loader==='babel-loader');babel.include=[...babel.include,__dirname];config.module.rules=[babel,{test:/\.(css|less)$/,type:'asset/source'},...config.module.rules.slice(-3)];module.exports=config;
