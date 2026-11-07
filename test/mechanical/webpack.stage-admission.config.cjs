const path=require('path');
const config=require('./webpack.admission-io.config.cjs');
config.entry=path.join(__dirname,'stage-admission.test.mjs');
config.output={path:'/tmp/codi-jsketcher-stage-admission',filename:'stage-admission.cjs'};
module.exports=config;
