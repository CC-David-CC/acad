const path=require('path');
const config=require('../shell-view-lifecycle/webpack.config.cjs');
config.entry=path.join(__dirname,'display.test.mjs');
config.output={path:'/tmp/codi-enclosure-display',filename:'test.cjs'};
module.exports=config;
