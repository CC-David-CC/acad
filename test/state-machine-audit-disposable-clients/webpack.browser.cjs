const path=require('node:path'),config=require('./webpack.cjs');
config.target='web';config.output={path:path.resolve(__dirname,'../../.build/disposable-client-browser'),filename:'clients.js',library:{name:'codiDisposable',type:'var'}};
module.exports=config;
