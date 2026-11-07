const path=require('path');
const config=require('./webpack.signed-distance.config.cjs');
config.entry=path.join(__dirname,'rigid-group-solver-probe.test.mjs');
config.output={path:'/tmp/codi-rigid-group-solver-probe',filename:'test.cjs'};
module.exports=config;
