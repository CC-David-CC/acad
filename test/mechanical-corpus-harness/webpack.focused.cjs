const path=require('path'),config=require('./webpack.broad.cjs');
config.entry=['noop-sketch-save.test.mjs','rigid-group-solver-probe.test.mjs'].map(name=>path.resolve(__dirname,'../mechanical',name));
config.output={path:path.resolve(__dirname,'../../.build/mechanical-corpus-harness/focused'),filename:'test.cjs'};
module.exports=config;
