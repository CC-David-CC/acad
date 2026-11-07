const path=require('path'),config=require('../closed-sketch/webpack.app.cjs');
config.resolve.alias['codi-project-validation-worker$']=path.resolve(__dirname,'../../.build/line-relation-project-worker/worker.js');
config.module.rules.push({test:/worker\.js$/,include:[path.resolve(__dirname,'../../.build/line-relation-project-worker')],type:'asset/resource',generator:{filename:'project-validator.[contenthash][ext]'}});
module.exports=config;
