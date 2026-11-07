const path=require('node:path'),root=path.resolve(__dirname,'../..');
module.exports={cache:false,mode:'development',target:'node',devtool:false,
 entry:path.join(__dirname,'entry.ts'),output:{path:path.join(root,'.build/disposable-client-audit'),filename:'clients.cjs',library:{type:'commonjs2'}},
 resolve:{extensions:['.ts','.js','.mjs'],modules:[path.join(root,'modules'),path.join(root,'web/app'),'node_modules']},
 module:{rules:[{test:/\.(js|ts|mjs)$/,loader:'babel-loader',include:[path.join(root,'modules'),path.join(root,'web/app'),__dirname]}]}};
