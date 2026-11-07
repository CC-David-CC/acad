// The real normal webpack alias/resource generators, asset entry only. This
// deliberately does not build the public app before its shared sweep operation.
const path=require('node:path'),config=require('../../webpack.config');
config.resolve.symlinks=false;config.devtool=false;
config.entry={assets:'./.build/sweep-profile-entry.mjs'};
config.output.path=path.resolve(__dirname,'../../.build/sweep-registration-assets');
module.exports=config;
