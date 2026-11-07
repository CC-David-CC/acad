const path=require('path');
module.exports={mode:'production',target:'webworker',devtool:false,
 entry:path.join(__dirname,'../web/app/cad/projectManager/manufacturingPublicationWorker.mjs'),
 resolve:{extensions:['.js','.mjs'],modules:[path.join(__dirname,'../modules'),path.join(__dirname,'../web/app'),'node_modules']},
 output:{path:path.join(__dirname,'../.build/manufacturing-publication-worker'),filename:'worker.js',globalObject:'self'},
 optimization:{splitChunks:false,runtimeChunk:false}};
