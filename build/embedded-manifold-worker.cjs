// Bind audited Manifold JS statically; verify WASM bytes at runtime.
const crypto=require('crypto');const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const {embedDisplayProjection}=require('./embedded-display.cjs');
const glueHash='cd2031fd75cbbc812b550dd228f95b9fd666ae4da6557f840e3d3ed4cbed268b';
const bootstrapHash='5495f4c7a33e1587bad0d41bd510e0e9b5b2708fe35e0ea296bfe1a1b5428bee';
function replaceOnce(s,a,b){if(s.split(a).length!==2)throw Error('Unexpected Manifold source');return s.replace(a,b)}
function embeddedManifoldWorker(bootstrap,glue){
 if(hash(bootstrap)!==bootstrapHash||hash(glue)!==glueHash||/\beval\s*\(|\bnew\s+Function\s*\(/.test(glue))throw Error('Unexpected Manifold runtime');
 let source=replaceOnce(bootstrap,'const [js,binary]=await Promise.all([verifiedAsset(msg.manifest.js,1048576),verifiedAsset(msg.manifest.wasm,41943040)]);',`if(msg.manifest.js?.sha256!=='${glueHash}')bad('Unexpected embedded JS identity');const binary=await verifiedAsset(msg.manifest.wasm,41943040);`);
 source=replaceOnce(source,"const url=URL.createObjectURL(new Blob([js],{type:'text/javascript'}));\n      try{const init=(await import(url)).default;wasm=await init({wasmBinary:binary,locateFile:()=>new URL(msg.manifest.wasm.path,self.location.origin).href});wasm.setup();}\n      finally{URL.revokeObjectURL(url);}","const init=runEmbeddedManifold();wasm=await init({wasmBinary:binary,locateFile:()=>new URL(msg.manifest.wasm.path,self.location.origin).href});wasm.setup();");
 if(glue.split('import.meta.url').length!==4)throw Error('Unexpected runtime URL references');glue=glue.replaceAll('import.meta.url','self.location.href');
 glue=replaceOnce(glue,'export default Module;','');return embedDisplayProjection(source+'\nfunction runEmbeddedManifold(){\n'+glue+'\nreturn Module;\n}\n');
}
module.exports={embeddedManifoldWorker,bootstrapHash,glueHash};
