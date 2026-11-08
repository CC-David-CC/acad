// Private staging of final native artifacts; no default engine promotion.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {embedDisplayProjection}=require('./embedded-display.cjs');
const root=path.resolve(__dirname,'..'),input=process.argv[2];
if(!input)throw Error('Provide the approved selected-profile native artifact directory.');
const nativeRoot=fs.realpathSync(input),output=path.join(root,'.build/selected-profile-assets');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const jsSha='cbd49d63d0900f50dda7fc53518d5f06183e85b1dea720522cc2994b0876adc9',wasmSha='a81af0b78dd585124f3f2d05d09b4a387b276bd1f655f0234002a6ab4646a637';
const bootstrapSha='44ad4cff5b13e3585e8a00a0c16c61f3be212d0f3dced71de6ed2287ae530214';
const glue=fs.readFileSync(path.join(nativeRoot,'occ-portable.js'),'utf8'),wasm=fs.readFileSync(path.join(nativeRoot,'main.wasm'));
let bootstrap=fs.readFileSync(path.join(root,'modules/engine/mount/oci-verified-worker.js'),'utf8');
if(hash(glue)!==jsSha||hash(wasm)!==wasmSha||hash(bootstrap)!==bootstrapSha)throw Error('Selected-profile native/worker source does not match reviewed pins.');
if(/\beval\s*\(|\bnew\s+Function\s*\(/.test(glue))throw Error('Dynamic JavaScript execution is unsupported.');
const replace=(before,after)=>{if(bootstrap.split(before).length!==2)throw Error('Unexpected selected-profile bootstrap structure.');bootstrap=bootstrap.replace(before,after);};
replace('const [js,wasm] = await Promise.all([verifiedAsset(msg.manifest.js, 1048576),verifiedAsset(msg.manifest.wasm, 41943040)]);',`if(msg.manifest.js?.sha256!=='${jsSha}') bad('Unexpected embedded JS identity'); const wasm=await verifiedAsset(msg.manifest.wasm,41943040);`);
replace("const blob=URL.createObjectURL(new Blob([js], {type:'text/javascript'}));\n      try {importScripts(blob);} finally {URL.revokeObjectURL(blob);}",'runEmbeddedRuntime();');
// The raw canonical bootstrap pin above is checked BEFORE this flat rewrite.
bootstrap=bootstrap.split('../extrusion/selectedArrangementDescriptor.mjs').join('./selectedArrangementDescriptor.mjs');
// The v2 binary input uses doubles. Both heap getters must follow native memory
// growth rather than retaining the views present at initialization.
const exposedNames=['_malloc','_free','lengthBytesUTF8','stringToUTF8Array','HEAP8','HEAPF64','str2C'];
const worker=embedDisplayProjection(bootstrap+'\nfunction runEmbeddedRuntime(){\nvar Module=self.Module;\n'+glue+'\n'+exposedNames.map(name=>`Object.defineProperty(self,${JSON.stringify(name)},{configurable:true,get:()=>${name}});\n`).join('')+'self.Module=Module;\n}\n');
fs.mkdirSync(output,{recursive:true});
for(const [name,bytes]of [['selected-profile-occ-portable.js',glue],['selected-profile-occ.wasm',wasm],['selected-profile-worker.js',worker]])fs.writeFileSync(path.join(output,name),bytes);
const plan=fs.readFileSync(path.join(root,'modules/engine/mount/selectedProfilePlan.mjs'),'utf8').split('../extrusion/selectedArrangementDescriptor.mjs').join('./selectedArrangementDescriptor.mjs');
fs.writeFileSync(path.join(output,'selectedProfilePlan.mjs'),plan);
fs.copyFileSync(path.join(root,'modules/engine/extrusion/selectedArrangementDescriptor.mjs'),path.join(output,'selectedArrangementDescriptor.mjs'));
// Asset/resource does not traverse .mjs imports. Explicitly emit the complete
// active V2 metadata graph while preserving the original plan URL contract.
fs.writeFileSync(path.join(root,'.build/selected-profile-plan-entry.mjs'),
 "import plan from './selected-profile-assets/selectedProfilePlan.mjs';\nimport metadata from './selected-profile-assets/selectedArrangementDescriptor.mjs';\nif(plan.slice(0,plan.lastIndexOf('/')+1)!==metadata.slice(0,metadata.lastIndexOf('/')+1))throw Error('Selected-profile metadata modules are not colocated.');\nexport default plan;\n");
console.log(JSON.stringify({bootstrapSha256:bootstrapSha,jsSha256:jsSha,wasmSha256:wasmSha,workerSha256:hash(worker),output}));

fs.copyFileSync(path.join(root,'modules/engine/mount/exactMeshVolume.mjs'),path.join(output,'exactMeshVolume.mjs'));
