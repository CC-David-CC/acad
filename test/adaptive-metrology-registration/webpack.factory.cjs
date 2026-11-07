const path=require('node:path'),config=require('../../webpack.config');
config.resolve.symlinks=false;config.devtool=false;config.entry={factory:'./test/adaptive-metrology-registration/factory-entry.ts'};
config.output.path=path.resolve(__dirname,'../../.build/adaptive-catalog-factory');
config.module.rules[0].include.push(path.resolve(__dirname));module.exports=config;
