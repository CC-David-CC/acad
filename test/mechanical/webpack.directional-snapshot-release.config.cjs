const path=require('path');const config=require('./webpack.signed-distance.config.cjs');
config.entry=path.join(__dirname,'directional-snapshot-release.test.mjs');
config.output={path:'/tmp/codi-directional-snapshot-release-tests',filename:'test.cjs'};module.exports=config;
