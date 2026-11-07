const path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto'),webpack=require('webpack');
const root=path.resolve(__dirname,'../..'),names=[...fs.readdirSync(path.join(root,'modules/lstream')).filter(name=>name.endsWith('.js')).map(name=>'modules/lstream/'+name),'.babelrc','test/manufacturing-publication-before/runtime-entry.mjs'];
const hashes=()=>Object.fromEntries(names.map(name=>[name,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex')])),before=hashes();
webpack({mode:'production',target:'node',context:root,entry:path.join(__dirname,'runtime-entry.mjs'),devtool:false,resolve:{extensions:['.js','.mjs'],modules:[path.join(root,'modules'),'node_modules']},module:{rules:[{test:/\.m?js$/,loader:'babel-loader',include:[path.join(root,'modules'),__dirname]}]},output:{path:path.join(root,'.build/manufacturing-publication-before'),filename:'runtime.cjs',library:{type:'commonjs2'}}},(error,stats)=>{
 if(error||stats.hasErrors()){console.error(error||stats.toString({all:false,errors:true}));process.exitCode=1;return;}
 if(JSON.stringify(hashes())!==JSON.stringify(before))throw Error('Runtime source changed during build');
 const bundle=path.join(root,'.build/manufacturing-publication-before/runtime.cjs');fs.writeFileSync(path.join(path.dirname(bundle),'pins.json'),JSON.stringify({node:process.version,sourceHashes:before,bundleSHA256:crypto.createHash('sha256').update(fs.readFileSync(bundle)).digest('hex')},null,2)+'\n');
 console.log(stats.toString({all:false,assets:true,timings:true}));
});
