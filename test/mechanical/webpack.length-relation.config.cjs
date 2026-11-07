const path=require('path');
const config=require('./webpack.config.cjs');
config.entry=path.join(__dirname,'length-relation.test.mjs');
config.output={path:process.env.CODI_LENGTH_TEST_OUTPUT||'/tmp/codi-length-relation-tests',filename:'length.cjs'};
config.module.rules.push({test:/\.less$/,type:'asset/source'});
config.resolve.alias={'@dxfjs/parser':false};
config.plugins.push(new (require('webpack').BannerPlugin)({banner:"global.window=globalThis;window.location={search:'?webos=1'};global.document={};global.MessageChannel=undefined;",raw:true,entryOnly:true}));
module.exports=config;
