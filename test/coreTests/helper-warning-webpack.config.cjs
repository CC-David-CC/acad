const path=require('path');
const root=path.resolve(__dirname,'../..');
const deps=path.resolve(process.env.CODI_TEST_NODE_MODULES||path.join(root,'node_modules'));
if(!process.env.CODI_TEST_OUTPUT)throw Error('CODI_TEST_OUTPUT is required');
const entry=process.env.CODI_ICON_IDENTITY==='1'?'helper-icon-entry.js':'helper-warning-entry.js';
module.exports={mode:'development',target:'node',devtool:false,entry:path.join(root,'test/coreTests',entry),output:{path:path.resolve(process.env.CODI_TEST_OUTPUT),filename:'helper.cjs',library:{type:'commonjs2'}},resolve:{modules:[path.join(root,'modules'),path.join(root,'web/app'),deps],extensions:['.js','.jsx','.ts','.tsx']},resolveLoader:{modules:[deps]},module:{rules:[{test:/\.(js|jsx|ts|tsx)$/,include:[path.join(root,'modules'),path.join(root,'web/app'),path.join(root,'test')],loader:'babel-loader'}]}};
