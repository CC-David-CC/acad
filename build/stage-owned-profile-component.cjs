// Private component staging; no deployment or default-engine promotion.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {embedDisplayProjection}=require('./embedded-display.cjs');
module.exports.stageOwnedProfileComponent=function({input,output,defaultOutput,jsSha,wasmSha,constructorModule,workerName,prefix,format,rootModules=[],selectedRegionArrangementVersion=0}){
const root=path.resolve(__dirname,'..');
if(![0,1].includes(selectedRegionArrangementVersion)||selectedRegionArrangementVersion===1&&!rootModules.includes('modules/engine/mount/selectionLineageIndex.mjs'))throw Error('Arrangement capability requires the complete common selection-plan-v2 graph');
if(!input)throw Error('Provide approved native artifacts');
if(fs.existsSync(output)&&path.resolve(output)!==path.resolve(defaultOutput))throw Error('Use a fresh component output');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');

const glue=fs.readFileSync(path.join(input,'occ-portable.js'),'utf8'),wasm=fs.readFileSync(path.join(input,'main.wasm'));
if(sha(glue)!==jsSha||sha(wasm)!==wasmSha||/\beval\s*\(|\bnew\s+Function\s*\(/.test(glue))throw Error('Unexpected native runtime');
if(fs.existsSync(output))fs.rmSync(output,{recursive:true,force:true});
let bootstrap=fs.readFileSync(path.join(root,'modules/engine/mount/oci-verified-worker.js'),'utf8');const bootstrapSha=sha(bootstrap);
function replace(before,after){if(bootstrap.split(before).length!==2)throw Error('Unexpected bootstrap');bootstrap=bootstrap.replace(before,after);}
replace('const [js,wasm] = await Promise.all([verifiedAsset(msg.manifest.js, 1048576),verifiedAsset(msg.manifest.wasm, 41943040)]);',`if(msg.manifest.js?.sha256!=='${jsSha}')bad('Unexpected embedded JS identity');const wasm=await verifiedAsset(msg.manifest.wasm,41943040);`);
replace("const blob=URL.createObjectURL(new Blob([js], {type:'text/javascript'}));\n      try {importScripts(blob);} finally {URL.revokeObjectURL(blob);}",'runEmbeddedRuntime();');
const names=['_malloc','_free','lengthBytesUTF8','stringToUTF8Array','HEAP8','HEAPF64','str2C'];
const worker=embedDisplayProjection(bootstrap+'\nfunction runEmbeddedRuntime(){\nvar Module=self.Module;\n'+glue+'\n'+names.map(n=>`Object.defineProperty(self,${JSON.stringify(n)},{configurable:true,get:()=>${n}});\n`).join('')+'self.Module=Module;\n}\n');
const files={},sources={};
function write(name,bytes){const target=path.join(output,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);files[name]={sha256:sha(bytes),bytes:Buffer.byteLength(bytes)};}
function stageModule(name){
 if(sources[name])return;const target=path.resolve(root,name);if(!target.startsWith(root+path.sep)||!name.endsWith('.mjs'))throw Error('Unexpected module dependency');
 const text=fs.readFileSync(target,'utf8');sources[name]=sha(text);write(name,text);
 const imports=/\b(?:import|export)\s+(?:[^'";]*?\s+from\s*)?['"]([^'"]+)['"]/g;let match;
 while((match=imports.exec(text))){if(!match[1].startsWith('.'))throw Error('External component dependency');stageModule(path.relative(root,path.resolve(path.dirname(target),match[1])));}
}
for(const name of [constructorModule,'modules/engine/mount/exactMeshVolume.mjs',...rootModules,'modules/engine/mount/polygonProfilePlan.mjs','modules/engine/mount/ownedTopologyContract.mjs','modules/engine/mount/prismSelectionIndex.mjs','modules/engine/mount/arrangedPrismSelectionIndex.mjs'])stageModule(name);
write('modules/engine/mount/'+workerName,worker);write(prefix+'-occ-portable.js',glue);write(prefix+'-occ.wasm',wasm);
const result={format,selectedRegionArrangementVersion,jsSha256:jsSha,wasmSha256:wasmSha,bootstrapSha256:bootstrapSha,workerSha256:sha(worker),sources,files,output};
fs.writeFileSync(path.join(output,'component.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));

return result;
};
