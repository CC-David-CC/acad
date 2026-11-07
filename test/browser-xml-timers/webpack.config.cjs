const path=require('path'),prod=require('../../webpack.config.js');
module.exports={mode:'production',devtool:false,target:'web',entry:{entry:path.join(__dirname,'entry.js'),worker:path.join(__dirname,'worker.js')},output:{path:'/tmp/codi-xml-timers-test',filename:'[name].js'},resolve:prod.resolve};
