// The ordinary application entries, without research/test helper exports.
const config=require('../../webpack.config');
config.resolve.symlinks=false;config.devtool=false;module.exports=config;
