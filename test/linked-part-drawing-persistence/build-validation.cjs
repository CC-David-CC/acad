// Compile the actual production validator, reusing the established manager
// fixture's generated path. No production source/configuration is modified.
const path=require('node:path'),webpack=require('webpack');
const root=path.resolve(__dirname,'../..');process.chdir(root);
const config=require('../../build/webpack.project-validation-worker.cjs');
config.mode='production';config.devtool=false;config.context=root;
config.output={...config.output,path:path.join(root,'.build/display-units/validation'),filename:'worker.js'};
webpack(config,(error,stats)=>{if(error||stats.hasErrors()){console.error(error||stats.toString({all:false,errors:true}));process.exitCode=1;return;}console.log(stats.toString({all:false,assets:true,timings:true}));});
