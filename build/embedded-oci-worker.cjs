// Statically bind the already-reviewed OCI JS glue into the pinned Worker.
// The resulting Worker is executable solely as a trusted package asset; WASM
// is still fetched and hashed before the embedded glue is started.
const crypto=require('crypto');
const {embedDisplayProjection}=require('./embedded-display.cjs');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const bootstrapHash='44ad4cff5b13e3585e8a00a0c16c61f3be212d0f3dced71de6ed2287ae530214';
const glueHash='a84b31900e58e61a1d7e3f8d04978408455764ad149923359e7fba19d3d07884';
function replaceOnce(source,before,after){if(source.split(before).length!==2)throw Error('Unexpected OCI bootstrap shape.');return source.replace(before,after);}
function embeddedWorker(bootstrap,glue){
 if(hash(bootstrap)!==bootstrapHash||hash(glue)!==glueHash)throw Error('Unexpected OCI bootstrap or wrapper hash.');
 if(/\beval\s*\(|\bnew\s+Function\s*\(/.test(glue))throw Error('Dynamic JavaScript execution is not supported.');
 let source=replaceOnce(bootstrap,
  'const [js,wasm] = await Promise.all([verifiedAsset(msg.manifest.js, 1048576),verifiedAsset(msg.manifest.wasm, 41943040)]);',
  `if(msg.manifest.js?.sha256!=='${glueHash}') bad('Unexpected embedded JS identity'); const wasm=await verifiedAsset(msg.manifest.wasm,41943040);`);
 source=replaceOnce(source,"const blob=URL.createObjectURL(new Blob([js], {type:'text/javascript'}));\n      try {importScripts(blob);} finally {URL.revokeObjectURL(blob);}",'runEmbeddedRuntime();');
 const names=['_malloc','_free','lengthBytesUTF8','stringToUTF8Array','HEAP8','str2C'];
 // The glue's heap variables can change on memory growth. Accessors, not
 // snapshots, preserve the current WASM views for the Worker commands.
 return embedDisplayProjection(source+'\nfunction runEmbeddedRuntime(){\nvar Module=self.Module;\n'+glue+'\n'+names.map(n=>`Object.defineProperty(self,${JSON.stringify(n)},{configurable:true,get:()=>${n}});\n`).join('')+'self.Module=Module;\n}\n');
}
module.exports={embeddedWorker,bootstrapHash,glueHash};
