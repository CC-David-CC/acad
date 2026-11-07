const path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const requestedGlue=process.env.CODI_RAW_SMLIB_GLUE;
if(!requestedGlue||!path.isAbsolute(requestedGlue))throw Error('Exact raw NVIDIA glue required');
// Webpack resolves resource symlinks before applying loader predicates. Match
// that actual identity, including when a fresh checkout shares a pinned cache.
// Otherwise the browser loader is skipped and import.meta.url becomes a local
// build-machine file URL. Input bytes and the resulting worker remain pinned.
const glue=fs.realpathSync(requestedGlue);
if(crypto.createHash('sha256').update(fs.readFileSync(glue)).digest('hex')!=='8e49622c97d839cf94d6c4d5e2de6cbd96d1166075741e08dcbda3b1a223d8fa')throw Error('Exact raw NVIDIA glue required');
module.exports={mode:'production',target:'webworker',entry:path.join(__dirname,'rawWorker.js'),resolve:{alias:{'codi-raw-smlib-glue':glue}},output:{path:path.resolve(process.env.CODI_RAW_SMLIB_OUTPUT||path.join(__dirname,'../../../.build/raw-smlib-worker')),filename:'raw-smlib-worker.js'},module:{parser:{javascript:{url:false}},rules:[{test:resource=>resource===glue,use:path.join(__dirname,'glue-loader.cjs')}]},optimization:{minimize:true},devtool:false};
