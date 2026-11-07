const path=require('path');
const config=require('../mechanical/webpack.config.cjs');
config.entry=path.join(__dirname,'lifecycle.test.mjs');
config.output={path:'/tmp/codi-shell-view-lifecycle',filename:'test.cjs'};
module.exports=config;
config.resolve.alias={dpr:path.join(__dirname,'dpr.mjs'),[path.resolve(__dirname,'../../modules/scene/utils/threeLoader.js')]:path.join(__dirname,'three.mjs')};
config.resolve.alias[path.resolve(__dirname,'../../modules/dpr/index.js')]=path.join(__dirname,'dpr.mjs');
