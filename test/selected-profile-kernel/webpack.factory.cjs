const path=require('path'),config=require('../../webpack.config');
config.resolve.symlinks=false;config.devtool=false;
config.entry={factory:'./test/selected-profile-kernel/factory-entry.ts'};
config.output.path=path.resolve(__dirname,'../../.build/selected-profile-factory');
config.module.rules[0].include.push(path.resolve(__dirname));
module.exports=config;
