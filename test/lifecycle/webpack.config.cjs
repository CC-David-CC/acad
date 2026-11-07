const path=require('node:path');
module.exports={mode:'development',target:'node',devtool:false,
 entry:path.join(__dirname,'startup.test.mjs'),
 output:{path:'/tmp/codi-cad-lifecycle-tests',filename:'startup.cjs'},
 resolve:{extensions:['.js','.mjs'],modules:[path.resolve(__dirname,'../../modules'),'node_modules']}};
