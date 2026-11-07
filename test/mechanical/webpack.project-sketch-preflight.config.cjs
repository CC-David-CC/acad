const path=require('path');
const config=require('./webpack.admission-io.config.cjs');
config.entry=path.join(__dirname,'project-sketch-preflight.test.mjs');
config.output={path:'/tmp/codi-jsketcher-project-preflight',filename:'preflight.cjs'};
module.exports=config;
