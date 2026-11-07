const path=require('path');const config=require('./webpack.concentric.config.cjs');
config.entry=path.join(__dirname,'diameter.test.mjs');config.output={path:'/tmp/codi-jsketcher-diameter-tests',filename:'diameter.cjs'};module.exports=config;
