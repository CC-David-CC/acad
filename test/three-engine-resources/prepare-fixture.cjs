// Only trusted, hash-pinned research assets are accepted. Generated Workers
// are test instruments, not release bootstraps.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=process.env.CODI_RESOURCE_FIXTURE;if(!root||!path.isAbsolute(root))throw Error('Set an absolute private CODI_RESOURCE_FIXTURE');
const staticDir=path.join(root,'static');fs.mkdirSync(staticDir,{recursive:true});
const expected={
 occ:{worker:'d1dfb0c42929870f07037a9e83590e0568d92803873053879042d1f820035fd1',wasm:'13617eda9a2118edfd1244b5d46523e7d9628a87ec995a0237b2b5cc58d532f2'},
 manifold:{worker:'494a336a665759a1c3002b2cbcc6881f375bc78711186c65a254a3bb7dbef301',wasm:'7bb5f8ee10fcafdab78799b1e5dd2cdc7c282ea0bf8e7939c43f3ad34b823e3d'},
 smlib:{worker:'078dc881c488e82fff16cfdcdaef077c107a61e8b7ab45e522f32f7509f403ed',wasm:'a48a3283760c21337881c5e2d5c973dbc62cf95cae46d1c012effd75389eb1ae'}
};
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const prefix=`// Test-only WebAssembly linear-memory observation; no production artifact.\nlet observedMemory=null,observedInstances=0;\nconst nativeInstantiate=WebAssembly.instantiate.bind(WebAssembly);\nWebAssembly.instantiate=async(...args)=>{const result=await nativeInstantiate(...args);const instance=result.instance||result;const memories=Object.values(instance.exports).filter(value=>value instanceof WebAssembly.Memory);if(memories.length!==1||++observedInstances!==1)throw Error('Expected one WASM instance and one exported memory');observedMemory=memories[0];return result};\nconst nativePost=self.postMessage.bind(self);\nself.postMessage=(message,transfer)=>nativePost({...message,testLinearBytes:observedMemory?.buffer.byteLength??null,testMemoryInstances:observedInstances},transfer||[]);\n`;
const receipt={version:1,scope:'test-derived bootstrap; WASM bytes unchanged',engines:{}};
for(const [name,pins] of Object.entries(expected)){
 const workerPath=process.env[`CODI_${name.toUpperCase()}_WORKER`],wasmPath=process.env[`CODI_${name.toUpperCase()}_WASM`];if(!workerPath||!wasmPath)throw Error('Missing exact asset path: '+name);
 const worker=fs.readFileSync(workerPath),wasm=fs.readFileSync(wasmPath);if(hash(worker)!==pins.worker||hash(wasm)!==pins.wasm)throw Error('Input pin mismatch: '+name);
 const derived=Buffer.concat([Buffer.from(prefix),worker]);fs.writeFileSync(path.join(staticDir,name+'-resource-worker.js'),derived,{flag:'wx'});fs.symlinkSync(path.resolve(wasmPath),path.join(staticDir,name+'.wasm'));
 receipt.engines[name]={inputWorkerSha256:pins.worker,wasmSha256:pins.wasm,instrumentedWorkerSha256:hash(derived)};
}
fs.writeFileSync(path.join(staticDir,'index.html'),'<!doctype html><title>Private linear-memory research</title>',{flag:'wx'});fs.writeFileSync(path.join(root,'pins.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
