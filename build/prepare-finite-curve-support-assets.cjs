// Optional raw analytic-query assets ONLY. No Native glue/Worker evaluation:
// this producer hashes/copies text/bytes and embeds the reviewed static loader.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const ROOT=path.resolve(__dirname,'..');
const DEFAULT_OUTPUT=path.join(ROOT,'.build/finite-curve-support-assets');
const DEFAULT_ENTRY=path.join(ROOT,'.build/finite-curve-support-entry.mjs');
// Actual reviewed common query-only bootstrap; all normal cohort guards use
// this same source identity. Native pair identities remain cohort-specific.
const BOOTSTRAP_SHA='982b1961d256843e81d90d74929b389c95600232c5f2188cc286d17847c1ac3a';
const FORMAT='finite-curve-support-component/1';
const JS_SHA='479f0620b6dfe131dac05131a3798fc533e05a2bd11e8074ef240284f61bbe86';
const WASM_SHA='746da919c8457e98daa821fae98c62c0a6c9ad1acafd1c3d5412e0207d6b6325';
const WORKER='modules/engine/mount/finite-curve-support-worker.js';
const GLUE='finite-curve-support-occ-portable.js',WASM='finite-curve-support-occ.wasm';
const MODULES=Object.freeze([
 'modules/engine/mount/finiteCurveNativeCalls.mjs',
 'modules/engine/mount/finiteCurveReadProtocol.mjs'
]);
const QUERY_IMPORT=Object.freeze({
 module:MODULES[0],
 literal:"await import(new URL('./finiteCurveNativeCalls.mjs',self.location.href))"
});
const SOURCE_PATHS=Object.freeze([
 'modules/engine/mount/oci-verified-worker.js',
 'build/embedded-display.cjs',
 'modules/engine/mount/displayProjection.mjs',
 'build/owned-profile-resource-closure.cjs',
 'build/prepare-finite-curve-support-assets.cjs',
 'build/finite-curve-support-assets-entry.cjs',
 'build/finite-curve-support-candidate-entry.mjs',
 'build/prepare-finite-curve-support-cohort.cjs',
 'modules/engine/mount/ownedFiniteCurveSupportCandidate.mjs',
 'modules/engine/mount/ownedFiniteCurveSupportResources.mjs',
 'modules/engine/mount/finiteCurveSupportRequest.mjs',
 'modules/engine/mount/occ-finite-curve-support-mount.mjs',
 ...MODULES
]);
const FILES=Object.freeze([WORKER,GLUE,WASM,...MODULES]);
const MANIFEST_KEYS=Object.freeze([
 'format','sourceQueryOnly','finiteCurveSupportReadVersion','sourceCommit','sourceTree',
 'jsSha256','wasmSha256','jsBytes','wasmBytes','bootstrapSha256','workerSha256',
 'queryImportRoots','sourceBindings','sources','files','output'
]);
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const pin=bytes=>({sha256:sha(bytes),bytes:bytes.length});
function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function keys(value,expected,label){
 if(!value||typeof value!=='object'||Array.isArray(value)||
    Object.keys(value).length!==expected.length||expected.some(k=>!Object.hasOwn(value,k)))
  throw Error('Unexpected finite-curve '+label+' fields');
}
function readBounded(name,limit,expectedBytes){
 const st=fs.lstatSync(name);
 if(!st.isFile()||!Number.isSafeInteger(st.size)||st.size<0||st.size>limit||
    expectedBytes!==undefined&&st.size!==expectedBytes)
  throw Error('Unexpected bounded finite-curve file: '+name);
 const bytes=fs.readFileSync(name);
 if(bytes.length!==st.size)throw Error('Finite-curve file size changed: '+name);
 return bytes;
}
function sourceBindings(){
 const result={};
 for(const name of SOURCE_PATHS)result[name]=pin(readBounded(path.join(ROOT,name),1048576));
 return result;
}
function unchangedSources(expected){
 if(!same(sourceBindings(),expected))throw Error('Finite-curve preparation source changed');
}
async function ingredients(){
 // Imports are pure source data, never Native glue or the emitted Worker.
 const {FINITE_CURVE_SUPPORT_CANDIDATE:c}=await import(pathToFileURL(path.join(ROOT,'modules/engine/mount/ownedFiniteCurveSupportCandidate.mjs')).href);
 const {FINITE_CURVE_SUPPORT_RESOURCE_MODULES:modules}=await import(pathToFileURL(path.join(ROOT,'modules/engine/mount/ownedFiniteCurveSupportResources.mjs')).href);
 if(c.jsSha256!==JS_SHA||c.wasmSha256!==WASM_SHA||c.jsBytes!==316530||c.wasmBytes!==36216184||
    c.sourceCommit!=='d3b2afa0524807d04021eeeba3ca37298dabd160'||
    c.sourceTree!=='b3800d4e4c858b003b8a3cdead4b77e8e8918ba5'||
    c.sourceQueryOnly!==true||c.finiteCurveSupportReadVersion!==1||!same(modules,MODULES))
  throw Error('Unexpected finite-curve source/pair/resource ingredients');
 return c;
}
function currentBootstrap(bindings){
 const bytes=readBounded(path.join(ROOT,SOURCE_PATHS[0]),1048576),text=bytes.toString('utf8');
 if(sha(bytes)!==BOOTSTRAP_SHA||sha(bytes)!==bindings[SOURCE_PATHS[0]].sha256)
  throw Error('Unexpected finite-curve bootstrap; Root coherent hash refresh required');
 // Whole-source SHA is the reviewed mode/branch authority. These literal
 // checks additionally refuse missing/renamed roots; they are NOT a parser or
 // independent proof that arbitrary source text implements a safe mode.
 if(text.split(QUERY_IMPORT.literal).length!==2||
    !text.includes('finiteCurveSupportReadVersion')||!text.includes('finiteCurveSupportMode'))
  throw Error('Approved finite-curve query-only mode/import is not composed');
 return text;
}
function embeddedWorker(bootstrap,glue,bindings){
 // Existing embedded-oci-worker.cjs cannot be called for this pair: it
 // intentionally pins old a84 glue. Preserve its actual replace-once and
 // lexical runEmbeddedRuntime convention, using the existing display helper.
 const {embedDisplayProjection,displayProjectionSha256}=require('./embedded-display.cjs');
 if(displayProjectionSha256!==bindings['modules/engine/mount/displayProjection.mjs'].sha256)
  throw Error('Finite-curve embedding helper projection differs');
 function replace(before,after){
  if(bootstrap.split(before).length!==2)throw Error('Unexpected finite-curve bootstrap embedding seam');
  bootstrap=bootstrap.replace(before,after);
 }
 replace('const [js,wasm] = await Promise.all([verifiedAsset(msg.manifest.js, 1048576),verifiedAsset(msg.manifest.wasm, 41943040)]);',
  "if(msg.manifest.js?.sha256!=='"+JS_SHA+"')bad('Unexpected embedded JS identity');const wasm=await verifiedAsset(msg.manifest.wasm,41943040);");
 replace("const blob=URL.createObjectURL(new Blob([js], {type:'text/javascript'}));\n      try {importScripts(blob);} finally {URL.revokeObjectURL(blob);}",'runEmbeddedRuntime();');
 const names=['_malloc','_free','lengthBytesUTF8','stringToUTF8Array','HEAP8','HEAPF64','str2C'];
 const exports=names.map(name=>'Object.defineProperty(self,'+JSON.stringify(name)+',{configurable:true,get:()=>'+name+'});\n').join('');
 const worker=Buffer.from(embedDisplayProjection(bootstrap+'\nfunction runEmbeddedRuntime(){\nvar Module=self.Module;\n'+glue+'\n'+exports+'self.Module=Module;\n}\n'),'utf8');
 if(worker.length>4194304)throw Error('Finite-curve embedded Worker exceeds preparation bound');
 return worker;
}
function nativeBytes(directory,c){
 const glue=readBounded(path.join(directory,'occ-portable.js'),1048576,c.jsBytes);
 const wasm=readBounded(path.join(directory,'main.wasm'),41943040,c.wasmBytes);
 if(sha(glue)!==JS_SHA||sha(wasm)!==WASM_SHA||/\beval\s*\(|\bnew\s+Function\s*\(/.test(glue.toString('utf8')))
  throw Error('Unexpected finite-curve portable Native inputs');
 return {glue,wasm};
}
function leafBytes(){
 const out={};
 for(const name of MODULES)out[name]=readBounded(path.join(ROOT,name),1048576);
 return out;
}
function metadata(c,bindings,worker,leaves,output){
 const files={[WORKER]:pin(worker),[GLUE]:{sha256:JS_SHA,bytes:c.jsBytes},[WASM]:{sha256:WASM_SHA,bytes:c.wasmBytes}},sources={};
 for(const name of MODULES){files[name]=pin(leaves[name]);sources[name]=files[name].sha256;}
 return {format:FORMAT,sourceQueryOnly:true,finiteCurveSupportReadVersion:1,
  sourceCommit:c.sourceCommit,sourceTree:c.sourceTree,jsSha256:JS_SHA,wasmSha256:WASM_SHA,
  jsBytes:c.jsBytes,wasmBytes:c.wasmBytes,bootstrapSha256:BOOTSTRAP_SHA,workerSha256:sha(worker),
  queryImportRoots:[QUERY_IMPORT],sourceBindings:bindings,sources,files,output};
}
function assertStageCensus(base,withManifest){
 const names=[...FILES,...(withManifest?['component.json']:[])],allowed=new Set(names),seen=new Set();
 for(const name of names){
  let parent=path.posix.dirname(name);
  while(parent!=='.'){allowed.add(parent);parent=path.posix.dirname(parent);}
 }
 const pending=[''];
 while(pending.length){
  const relative=pending.pop(),entries=fs.readdirSync(path.join(base,relative),{withFileTypes:true});
  if(entries.length>allowed.size)throw Error('Unexpected finite-curve stage entry census');
  for(const item of entries){
   const name=relative?relative+'/'+item.name:item.name;
   if(!allowed.has(name)||seen.has(name))throw Error('Unregistered finite-curve stage entry: '+name);
   seen.add(name);
   if(item.isDirectory())pending.push(name);
   else if(!item.isFile()||!names.includes(name))throw Error('Unexpected finite-curve stage file: '+name);
  }
 }
 if(seen.size!==allowed.size)throw Error('Incomplete finite-curve stage entry census');
}
async function prepareFiniteCurveSupportAssets(input,output=DEFAULT_OUTPUT){
 if(typeof input!=='string'||!input.trim()||typeof output!=='string'||!output)
  throw Error('Provide exact Native input and a fresh finite-curve output path');
 const target=path.resolve(output);
 if(fs.existsSync(target))throw Error('Use a fresh finite-curve component output');
 const bindings=sourceBindings(),bootstrap=currentBootstrap(bindings),c=await ingredients();
 unchangedSources(bindings);
 const native=nativeBytes(path.resolve(input),c),leaves=leafBytes();
 const worker=embeddedWorker(bootstrap,native.glue.toString('utf8'),bindings);
 const manifest=metadata(c,bindings,worker,leaves,target);
 fs.mkdirSync(path.dirname(target),{recursive:true});fs.mkdirSync(target);
 function write(name,bytes){const p=path.join(target,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,bytes,{flag:'wx'});}
 write(WORKER,worker);write(GLUE,native.glue);write(WASM,native.wasm);
 for(const name of MODULES)write(name,leaves[name]);
 const {assertOwnedProfileResourceClosure}=require('./owned-profile-resource-closure.cjs');
 assertOwnedProfileResourceClosure(target,manifest,MODULES);
 // Preserve actual Native/source custody through the copy, before publishing
 // the last manifest. A partial failed stage is never an admissible entry.
 const after=nativeBytes(path.resolve(input),c);
 if(!after.glue.equals(native.glue)||!after.wasm.equals(native.wasm))throw Error('Finite-curve Native inputs changed during preparation');
 unchangedSources(bindings);
 for(const name of FILES){
  const actual=readBounded(path.join(target,name),name===WASM?41943040:4194304);
  if(!same(pin(actual),manifest.files[name]))throw Error('Finite-curve output readback differs: '+name);
 }
 assertStageCensus(target,false);
 write('component.json',JSON.stringify(manifest,null,2)+'\n');
 assertStageCensus(target,true);
 return manifest;
}
async function validateFiniteCurveSupportStage(output=DEFAULT_OUTPUT){
 const target=path.resolve(output),bindings=sourceBindings(),bootstrap=currentBootstrap(bindings),c=await ingredients();
 const manifest=JSON.parse(readBounded(path.join(target,'component.json'),65536).toString('utf8'));
 keys(manifest,MANIFEST_KEYS,'manifest');
 assertStageCensus(target,true);
 if(manifest.output!==target)throw Error('Finite-curve manifest belongs to a different output directory');
 const glue=readBounded(path.join(target,GLUE),1048576,c.jsBytes),wasm=readBounded(path.join(target,WASM),41943040,c.wasmBytes);
 if(sha(glue)!==JS_SHA||sha(wasm)!==WASM_SHA)throw Error('Finite-curve stage Native pair changed');
 const leaves=leafBytes(),worker=embeddedWorker(bootstrap,glue.toString('utf8'),bindings);
 const expected=metadata(c,bindings,worker,leaves,target);
 if(!same(manifest,expected))throw Error('Stale or unbound finite-curve source/component manifest');
 for(const name of FILES){
  const bytes=readBounded(path.join(target,name),name===WASM?41943040:4194304);
  if(!same(pin(bytes),expected.files[name]))throw Error('Finite-curve staged file changed: '+name);
 }
 const {assertOwnedProfileResourceClosure}=require('./owned-profile-resource-closure.cjs');
 assertOwnedProfileResourceClosure(target,manifest,MODULES);
 unchangedSources(bindings);
 return manifest;
}
function writeFiniteCurveSupportNullEntry(){
 fs.mkdirSync(path.dirname(DEFAULT_ENTRY),{recursive:true});
 fs.writeFileSync(DEFAULT_ENTRY,readBounded(path.join(ROOT,'build/finite-curve-support-candidate-entry.mjs'),4096));
 return DEFAULT_ENTRY;
}
module.exports={prepareFiniteCurveSupportAssets,validateFiniteCurveSupportStage,
 writeFiniteCurveSupportNullEntry,DEFAULT_OUTPUT,DEFAULT_ENTRY,FINITE_CURVE_SUPPORT_FILES:FILES};
if(require.main===module){
 if(process.argv.length<3||process.argv.length>4){console.error('Usage: prepare-finite-curve-support-assets.cjs EXACT_NATIVE_INPUT [NEW_OUTPUT]');process.exitCode=1;}
 else prepareFiniteCurveSupportAssets(process.argv[2],process.argv[3]||DEFAULT_OUTPUT)
  .then(result=>console.log(JSON.stringify(result))).catch(error=>{console.error(error);process.exitCode=1;});
}
