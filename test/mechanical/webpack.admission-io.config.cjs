// Node-only mock-viewer test. The DXF parser and styles are not used here.
const path = require('path');
const webpack = require('webpack');
const config = require('./webpack.config.cjs');
config.entry = path.join(__dirname, 'admission-io.test.mjs');
config.output = {path: '/tmp/codi-jsketcher-admission-io', filename: 'admission-io.cjs'};
config.resolve.alias = {'@dxfjs/parser': false};
config.module.rules.push({test: /\.less$/, type: 'asset/source'});
config.plugins.push(new webpack.BannerPlugin({banner: "global.window=globalThis;window.location={search:'?webos=1'};global.document={};", raw:true, entryOnly:true}));
module.exports = config;
