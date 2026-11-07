const path=require('path');const config=require('./webpack.config.cjs');
config.entry=path.join(__dirname,'basic-angle-branches.test.mjs');
config.output={path:'/tmp/codi-basic-angle-branches',filename:'branches.cjs'};
module.exports=config;
