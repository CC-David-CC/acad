const path=require('path');
module.exports={mode:'development',target:'node',devtool:false,entry:path.join(__dirname,'block-guards.test.mjs'),output:{path:'/tmp/codi-block-guards',filename:'tests.cjs'},module:{rules:[{test:/\.js$/,include:path.resolve(__dirname,'../../web/app'),loader:'babel-loader'}]}};
