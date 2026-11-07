// Normal single app entry with explicit optional loft, own output/project
// Worker, and retained byte-pinned providers. No packaging policy is changed.
const path=require('node:path');
if(!process.env.CODI_LOFT_NATIVE_DIR?.trim())throw Error('Explicit loft provider required');
const config=require('../polygon-profile-app-history/webpack.app.cjs');
const project=path.resolve(__dirname,'../../.build/line-relation-project-worker');
config.resolve.alias['codi-project-validation-worker$']=path.join(project,'worker.js');
config.module.rules.push({test:/worker\.js$/,include:[project],type:'asset/resource',generator:{filename:'project-validator.[contenthash][ext]'}});
config.output={...config.output,path:path.resolve(__dirname,'../../.build/public-worker-loft/with-loft-app')};
module.exports=config;
