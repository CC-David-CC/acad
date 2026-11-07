const path=require('node:path');
const root=path.resolve(process.env.CODI_READER_SOURCE_ROOT||path.join(__dirname,'../..'));
module.exports={mode:'production',devtool:false,target:'web',entry:path.join(__dirname,'entry.js'),
 output:{path:process.env.CODI_READER_OUTPUT,filename:'reader.js'},optimization:{minimize:false},
 resolve:{extensions:['.js','.jsx','.ts','.tsx'],modules:[path.join(root,'modules'),path.join(root,'web/app'),path.join(root,'node_modules')],alias:{numeric:path.join(root,'node_modules/.cache/codi-numeric/precompiled.js')}},
 module:{rules:[{test:/\.(js|jsx|ts|tsx)$/,loader:path.join(root,'node_modules/babel-loader'),include:[path.join(root,'modules'),path.join(root,'web/app')],options:{configFile:path.join(root,'.babelrc')}},{test:/\.svg$/,type:'asset/source'}]}};
