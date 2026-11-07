const path=require('path');const config=require('./webpack.signed-distance.config.cjs');
config.entry=path.join(__dirname,'fix-entity.test.mjs');
config.output={path:'/tmp/codi-fix-entity-tests',filename:'test.cjs'};module.exports=config;
