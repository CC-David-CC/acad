// Disposable fixture, with verified inputs and explicit source-derived faults.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const [out,gluePath,wasmPath]=process.argv.slice(2);if(!out||!gluePath||!wasmPath)throw Error('usage: node prepare-fixture.cjs EMPTY_OUTPUT GLUE WASM');
const root=path.resolve(__dirname,'../..'),dest=path.join(out,'static');fs.mkdirSync(dest,{recursive:true});
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');const glue=fs.readFileSync(gluePath),wasm=fs.readFileSync(wasmPath);
if(digest(glue)!=='a8774acbbe3a90d7c82fe294c769096179eae351e5a8c854d4d0a31737a706ee'||digest(wasm)!=='13617eda9a2118edfd1244b5d46523e7d9628a87ec995a0237b2b5cc58d532f2')throw Error('runtime pin mismatch');
for(const f of fs.readdirSync(path.join(root,'modules/engine/mount')).filter(f=>f.endsWith('.mjs')))fs.copyFileSync(path.join(root,'modules/engine/mount',f),path.join(dest,f),fs.constants.COPYFILE_EXCL);
const {embeddedWorker}=require(path.join(root,'build/embedded-oci-worker.cjs')),src=fs.readFileSync(path.join(root,'modules/engine/mount/oci-verified-worker.js'),'utf8');const worker=embeddedWorker(src,glue.toString());
const swap=(s,from,to)=>{if(s.split(from).length!==2)throw Error('fault marker mismatch');return s.replace(from,to)};
for(const [name,code] of [['worker.js',worker],['fault.js',swap(worker,"call('bopcut',[body]);","call('bopcut',[]);")],['noop.js',swap(worker,'cavity=mkbox(plan.body.cavity)','cavity=mkbox({origin:[200000,0,0],dimensions:[1,1,1]})')],['bad-mesh.js',swap(worker,"self.postMessage({kind:'result',seq:msg.seq,token:msg.token,role:record.role,triangleCount:triangles.length,buffer},[buffer]);","new Float64Array(buffer)[0]=NaN;self.postMessage({kind:'result',seq:msg.seq,token:msg.token,role:record.role,triangleCount:triangles.length,buffer},[buffer]);")],['slow-mesh.js',swap(worker,"record.read=true;","record.read=true;await new Promise(resolve=>setTimeout(resolve,1000));")]])fs.writeFileSync(path.join(dest,name),code,{flag:'wx'});
const manufacturingSend="self.postMessage({kind:'result',seq:msg.seq,token:msg.token,role:record.role,verticesBuffer:q.vertices.buffer,trianglesBuffer:q.triangles.buffer,evidence:q.evidence},[q.vertices.buffer,q.triangles.buffer]);",manufacturingRead="if(manufacturing)record.manufacturingRead=true;else record.read=true;";
for(const [name,code] of [['occ-bad-manufacturing.js',swap(worker,manufacturingSend,'q.vertices[0]=NaN;'+manufacturingSend)],['occ-slow-manufacturing.js',swap(worker,manufacturingRead,"if(manufacturing){record.manufacturingRead=true;await new Promise(resolve=>setTimeout(resolve,1000));}else record.read=true;")]])fs.writeFileSync(path.join(dest,name),code,{flag:'wx'});
fs.symlinkSync(path.resolve(wasmPath),path.join(dest,'oci.wasm'));fs.writeFileSync(path.join(dest,'index.html'),'<!doctype html>',{flag:'wx'});
// Optional separate pinned Manifold assets, embedded in a strict-CSP worker.
const manifoldJsPath=process.argv[5],manifoldWasmPath=process.argv[6];
if(Boolean(manifoldJsPath)!==Boolean(manifoldWasmPath))throw Error('provide both Manifold inputs');
if(manifoldJsPath){
 const js=fs.readFileSync(manifoldJsPath),binary=fs.readFileSync(manifoldWasmPath);
 if(digest(js)!=='cd2031fd75cbbc812b550dd228f95b9fd666ae4da6557f840e3d3ed4cbed268b'||digest(binary)!=='7bb5f8ee10fcafdab78799b1e5dd2cdc7c282ea0bf8e7939c43f3ad34b823e3d')throw Error('Manifold pin mismatch');
 const {embeddedManifoldWorker}=require(path.join(root,'build/embedded-manifold-worker.cjs')),bootstrap=fs.readFileSync(path.join(root,'modules/engine/mount/manifold-verified-worker.js'),'utf8'),mw=embeddedManifoldWorker(bootstrap,js.toString());
 const faults=[['manifold-worker.js',mw],['manifold-noop.js',swap(mw,'b=mk(plan.body.cavity)','b=mk({origin:[200000,0,0],dimensions:[1,1,1]})')],['manifold-slow.js',swap(mw,'record.read=true;','record.read=true;await new Promise(resolve=>setTimeout(resolve,1000));')],['manifold-badmesh.js',swap(mw,"self.postMessage({kind:'result',seq:msg.seq,token:msg.token,role:record.role,triangleCount:count,buffer},[buffer]);","new Float64Array(buffer)[0]=NaN;self.postMessage({kind:'result',seq:msg.seq,token:msg.token,role:record.role,triangleCount:count,buffer},[buffer]);")]];
 faults.push(['manifold-bad-manufacturing.js',swap(mw,manufacturingSend,'q.vertices[0]=NaN;'+manufacturingSend)],['manifold-slow-manufacturing.js',swap(mw,manufacturingRead,"if(manufacturing){record.manufacturingRead=true;await new Promise(resolve=>setTimeout(resolve,1000));}else record.read=true;")]);
 for(const [name,code] of faults)fs.writeFileSync(path.join(dest,name),code,{flag:'wx'});fs.symlinkSync(path.resolve(manifoldWasmPath),path.join(dest,'manifold.wasm'));
}
