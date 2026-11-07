const path=require('path');
const config=require('../../build/webpack.headless-sketch-worker.cjs');
config.entry=path.join(__dirname,'empty-sketch-factory-worker.js');
config.output={path:path.resolve(__dirname,'../../.build/empty-sketch-factory'),filename:'worker.js',globalObject:'self'};
module.exports=config;
