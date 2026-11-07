const path=require('path'),config=require('./webpack.config.cjs');
config[0].entry=path.join(__dirname,'candidate-entry.js');
for(const item of config)item.output={...item.output,path:'/tmp/codi-candidate-ledger-build'};
module.exports=config;
