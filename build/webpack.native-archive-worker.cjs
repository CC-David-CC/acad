const path=require('path');
const fs=require('fs');
const webpack=require('webpack');
// Same CSP-safe project preflight/solver dependencies as the existing native
// validation Worker; no new evaluator or external ZIP codec is introduced.
const config=require('../webpack.config');
const numeric=path.join(__dirname,'../node_modules/.cache/codi-numeric/precompiled.js');
if(!fs.existsSync(numeric))throw Error('Build the CSP-safe numeric module before the native archive Worker.');
const zipPackage=path.dirname(require.resolve('@zip.js/zip.js/package.json'));
const zip=JSON.parse(fs.readFileSync(path.join(zipPackage,'package.json'),'utf8'));
if(zip.version!=='2.24.0')throw Error('Native archive requires the reviewed zip.js 2.24.0.');
config.resolve.alias.numeric=numeric;
config.resolve.alias['@zip.js/zip.js/lib/zip-core-native.js$']=path.join(zipPackage,'lib/zip-core-native.js');
config.target='webworker';config.devtool=false;
config.entry=path.join(__dirname,'../web/app/cad/projectManager/nativeArchiveCodec.worker.ts');
config.output={path:path.join(__dirname,'../.build/native-archive-worker'),filename:'worker.js',globalObject:'self'};
config.optimization={splitChunks:false,runtimeChunk:false};
config.plugins=[...(config.plugins||[]),new webpack.optimize.LimitChunkCountPlugin({maxChunks:1})];
config.module.rules=[config.module.rules.find(rule=>rule.loader==='babel-loader'),{test:/\.(css|less)$/,type:'asset/source'},...config.module.rules.slice(-3)];
module.exports=config;
