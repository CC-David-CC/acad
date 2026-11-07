const path=require('path');
const config=require('./webpack.config.cjs');
config.entry=path.join(__dirname,'external-stage-reclassification.test.mjs');
config.output={path:'/tmp/codi-jsketcher-external-stage',filename:'external-stage.cjs'};
module.exports=config;
