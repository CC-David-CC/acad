const path=require('path');
module.exports={mode:'production',target:'webworker',devtool:false,entry:path.join(__dirname,'../web/app/cad/parameters/physicalQuantitiesWorker.mjs'),output:{path:path.join(__dirname,'../.build/physical-parameters-worker'),filename:'worker.js',globalObject:'self'}};
