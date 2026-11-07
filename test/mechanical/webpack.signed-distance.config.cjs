const path=require('path');
const webpack=require('webpack');
const config=require('./webpack.diameter.config.cjs');
config.entry=[path.join(__dirname,'signed-distance.test.mjs'),path.join(__dirname,'sketch-revision-guard.test.mjs')];
config.output={path:'/tmp/codi-jsketcher-signed-distance-tests',filename:'test.cjs'};
// React's browser fixture must not leave Node's MessagePort alive after tests.
config.plugins.push(new webpack.BannerPlugin({banner:'global.MessageChannel=undefined;',raw:true,entryOnly:true}));
module.exports=config;
