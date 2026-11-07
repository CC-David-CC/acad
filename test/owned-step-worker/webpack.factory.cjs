const path=require('node:path'),config=require('../../webpack.config');
config.resolve.symlinks=false;config.devtool=false;config.entry={factory:'./test/owned-step-worker/factory-entry.ts'};
config.output.path=path.resolve(__dirname,'../../.build/step-catalog-factory');
config.module.rules[0].include.push(path.resolve(__dirname));module.exports=config;
