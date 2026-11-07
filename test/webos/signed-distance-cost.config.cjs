const path=require('path');
const config=require('./headless-sketch-client.config.cjs');
config.entry=path.join(__dirname,'signed-distance-cost-entry.js');
config.output={path:'/tmp/codi-m02-worker/static',filename:'cost.js'};
config.resolve.alias.numeric=path.resolve(__dirname,'../../node_modules/.cache/codi-numeric/precompiled.js');
module.exports=config;
