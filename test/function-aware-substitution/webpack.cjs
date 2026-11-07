const path=require('path'),config=require('../mechanical/webpack.line-relations.config.cjs');
config.entry=path.resolve(__dirname,'system.test.mjs');config.output={path:path.resolve(__dirname,'../../.build/function-aware-substitution'),filename:'system.cjs'};config.module.rules[0].include.push(__dirname);module.exports=config;
