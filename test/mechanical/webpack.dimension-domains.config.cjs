const path=require('path');const config=require('./webpack.config.cjs');
config.entry=path.join(__dirname,'dimension-domains.test.mjs');config.output={path:'/tmp/codi-dimension-domains',filename:'domains.cjs'};module.exports=config;
