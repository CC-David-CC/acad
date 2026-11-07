const path=require('path'),fs=require('fs');
const config=require('../mechanical/webpack.line-relations.config.cjs');
const folder=path.resolve(__dirname,'../mechanical');
config.entry=fs.readdirSync(folder).filter(name=>name.endsWith('.test.mjs')).sort().map(name=>path.join(folder,name));
config.output={path:path.resolve(__dirname,'../../.build/mechanical-corpus-harness/broad'),filename:'test.cjs'};
module.exports=config;
