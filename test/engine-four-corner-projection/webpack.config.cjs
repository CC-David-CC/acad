const base=require('../prism-model-projection/webpack.config.cjs'),path=require('path');
module.exports={...base,entry:path.join(__dirname,'worker.js'),output:{...base.output,path:'/tmp/codi-four-corner-projection-build'}};
