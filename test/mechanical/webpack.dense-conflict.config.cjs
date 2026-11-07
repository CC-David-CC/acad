const path=require('path');
const config=require('./webpack.config.cjs');
config.entry=path.join(__dirname,'dense-conflict-benchmark.mjs');
config.output={path:'/tmp/codi-jsketcher-dense-conflict',filename:'bench.cjs'};
module.exports=config;
