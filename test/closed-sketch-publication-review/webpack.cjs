const path=require('node:path'),base=require('../sketch-transition-transport/webpack.config.cjs');
base.entry=path.join(__dirname,'inspection-entry.ts');base.output={...base.output,path:process.env.CODI_INSPECTION_OUTPUT,filename:'inspection-client.js'};base.module.rules[0].include.push(__dirname);module.exports=base;
