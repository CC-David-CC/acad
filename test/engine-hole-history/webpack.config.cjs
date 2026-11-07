const path=require('path'),config=require('../worker-rectangle-adapter/webpack.config.cjs');
config[0].entry=path.join(__dirname,'entry.js');
for(const item of config)item.output={...item.output,path:'/tmp/codi-centered-hole-history-build'};
module.exports=config;
