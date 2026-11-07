const path=require('path');
const config=require('./webpack.signed-distance.config.cjs');
config.entry=path.join(__dirname,'line-relations.test.mjs');
config.output={path:'/tmp/codi-line-relations-tests',filename:'test.cjs'};
module.exports=config;
