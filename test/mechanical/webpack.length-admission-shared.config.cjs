const path=require('path');
const config=require('./webpack.config.cjs');
config.entry=path.join(__dirname,'length-admission-shared.test.mjs');
config.output={path:process.env.CODI_LENGTH_TEST_OUTPUT||'/tmp/codi-length-admission-shared-tests',filename:'admission.cjs'};
config.module.rules.push({test:/\.less$/,type:'asset/source'});
config.resolve.alias={'@dxfjs/parser':false};
module.exports=config;
