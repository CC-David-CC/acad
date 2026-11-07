const path=require('node:path'),config=require('../../webpack.config');
config.resolve.symlinks=false;config.devtool=false;config.entry={factory:'./test/revolve-build-registration/factory-entry.ts'};
config.output.path=path.resolve(__dirname,'../../.build/revolve-catalog-factory');
config.module.rules[0].include.push(path.resolve(__dirname));module.exports=config;
