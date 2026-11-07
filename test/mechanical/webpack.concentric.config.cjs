const path=require('path');
const config=require('./webpack.config.cjs');
config.entry=path.join(__dirname,'concentric.test.mjs');
config.output={path:'/tmp/codi-jsketcher-concentric-tests',filename:'concentric.cjs'};
module.exports=config;
config.module.rules.push({test:/\.less$/,type:'asset/source'});
config.resolve.alias={'@dxfjs/parser':false};
config.plugins.push(new (require('webpack').BannerPlugin)({banner:"global.window=globalThis;window.location={search:'?webos=1'};global.document={};",raw:true,entryOnly:true}));
