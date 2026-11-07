// Real nonvisual backend source controls; not browser/Worker qualification.
const webpack=require('webpack'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../../../..'),out=fs.mkdtempSync(path.join(os.tmpdir(),'reduction-control-'));
const config={mode:'development',target:'node',node:{__filename:false,__dirname:false},devtool:false,context:root,entry:path.join(__dirname,'source-control.ts'),output:{path:out,filename:'test.cjs'},resolve:{extensions:['.ts','.tsx','.js','.jsx','.mjs'],modules:[path.join(root,'modules'),path.join(root,'web/app'),path.join(root,'node_modules')]},module:{rules:[{test:/\.[jt]sx?$/,exclude:/node_modules/,use:{loader:path.join(root,'node_modules/babel-loader'),options:{configFile:path.join(root,'.babelrc')}}},{test:/\.(svg|less|css)$/,type:'asset/source'}]}};
webpack(config,(error,stats)=>{try{if(error||stats.hasErrors()){console.error(error||stats.toString({all:false,errors:true,errorDetails:true}));process.exitCode=1;return;}
 const bootstrap='global.window=global;window.location={search:"?webos=1"};window.addEventListener=()=>{};window.removeEventListener=()=>{};global.verb={eval:{Analyze:{rationalSurfaceClosestParam(){throw Error("unexpected NURBS evaluation")}}}};require(process.argv[1]);';
 const run=spawnSync(process.execPath,['-e',bootstrap,path.join(out,'test.cjs')],{cwd:root,stdio:'inherit'});process.exitCode=run.status===null?1:run.status;
}finally{fs.rmSync(out,{recursive:true,force:true});}});
