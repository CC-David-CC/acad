import test from 'node:test';import assert from 'node:assert/strict';import {Worker} from 'node:worker_threads';import fs from 'node:fs';
import {measureSignedMeshVolume,MAX_VOLUME_TRIANGLES} from '../../modules/engine/mount/localMeshVolume.mjs';import {box,reverse,globalIntegral} from './fixtures.mjs';
const close=(a,b,rel=2e-14)=>assert(Math.abs(a-b)<=Math.abs(b)*rel,`${a} != ${b}`);
async function inWorker(work){const worker=new Worker(new URL('./worker.mjs',import.meta.url));let id=0;try{return await work((positions,options)=>new Promise((yes,no)=>{const request=++id;worker.once('message',reply=>{assert.equal(reply.id,request);reply.error?no(Object.assign(Error(reply.error.message),{code:reply.error.code})):yes(reply.result)});worker.postMessage({id:request,positions,options})}))}finally{await worker.terminate()}}
test('actual Worker: compact boxes retain represented volume over translations, scales and winding',async()=>inWorker(async run=>{
 for(const origin of[[0,0,0],[1e6,1e6,1e6],[-1e6,1e6,-1e6],[.125,-.375,1.5]])for(const size of[[1e-6,2e-6,3e-6],[2,3,4],[.25,.5,.125]]){
  const positions=box(origin,size),before=positions.slice(),effective=size.map((n,i)=>(origin[i]+n)-origin[i]),expected=effective.reduce((a,b)=>a*b,1);
  const forward=await run(positions),backward=await run(reverse(positions));close(forward.signedVolume,expected);close(backward.signedVolume,-expected);assert.equal(forward.triangles,12);assert.deepEqual(positions,before);
 }
}));
test('actual Worker: cavities subtract, disconnected solids add, opposite shells cancel without abs',async()=>inWorker(async run=>{
 const outer=box([1e6,1e6,1e6],[8,8,8]),inner=reverse(box([1e6+2,1e6+2,1e6+2],[4,4,4])),remote=box([1e6+20,1e6-30,1e6+40],[2,3,4]);
 close((await run([...outer,...inner])).signedVolume,512-64);close((await run([...outer,...inner,...remote])).signedVolume,512-64+24);
 assert.equal((await run([...outer,...reverse(outer)])).signedVolume,0);
 const tiny=box([1e6+2,1e6+2,1e6+2],[.125,.25,.5]);close((await run([...outer,...tiny,...reverse(outer)])).signedVolume,.015625,1e-11);
}));
test('actual Worker: exact signed tetrahedron, degenerate and empty arithmetic do not claim validity',async()=>inWorker(async run=>{
 const tetra=[0,0,0,0,1,0,1,0,0, 0,0,0,1,0,0,0,0,1, 0,0,0,0,0,1,0,1,0, 1,0,0,0,1,0,0,0,1];close((await run(tetra)).signedVolume,1/6);close((await run(reverse(tetra))).signedVolume,-1/6);
 assert.equal((await run(Array(9).fill(1))).signedVolume,0);assert.deepEqual(await run([]),{signedVolume:0,triangles:0,anchor:null,absoluteTetrahedronSum:0,cancellationSensitive:false});
}));
test('bounds, finite data, dense arrays and conservative arithmetic range refusals are explicit',()=>{
 let reads=0;const getter=Array(9).fill(0);Object.defineProperty(getter,'0',{enumerable:true,get(){reads++;return 0}});
 for(const value of[null,{},Array(9),getter,new Float32Array(9),[0],Array(9).fill(NaN),Array(9).fill(Infinity),Array(9).fill('0')])assert.throws(()=>measureSignedMeshVolume(value),e=>e.code==='INVALID_MESH');assert.equal(reads,0);
 assert.throws(()=>measureSignedMeshVolume(new Float64Array((MAX_VOLUME_TRIANGLES+1)*9)),{code:'RESOURCE_LIMIT'});
 assert.throws(()=>measureSignedMeshVolume(box([0,0,0],[1,1,1]),{maxTriangles:11}),{code:'RESOURCE_LIMIT'});
 for(const maxTriangles of[0,100001,1.5])assert.throws(()=>measureSignedMeshVolume([],{maxTriangles}),{code:'INVALID_MESH'});
 assert.throws(()=>measureSignedMeshVolume(new Float64Array(new SharedArrayBuffer(72))),{code:'INVALID_MESH'});
 assert.throws(()=>measureSignedMeshVolume(box([0,0,0],[1e200,1e200,1e200])),{code:'MESH_VOLUME_NUMERIC_RANGE'});
 assert.throws(()=>measureSignedMeshVolume(box([0,0,0],[1e-200,1e-200,1e-200])),{code:'MESH_VOLUME_NUMERIC_RANGE'});
 for(const options of[null,[],{unknown:1}])assert.throws(()=>measureSignedMeshVolume([],options),{code:'INVALID_MESH'});
 const options={};Object.defineProperty(options,'maxTriangles',{enumerable:true,get(){reads++;return 12}});assert.throws(()=>measureSignedMeshVolume([],options),{code:'INVALID_MESH'});assert.equal(reads,0);
 const detached=new Float64Array(9);structuredClone(detached,{transfer:[detached.buffer]});assert.throws(()=>measureSignedMeshVolume(detached),{code:'INVALID_MESH'});
 const flat=new Float64Array(box([1e6,1e6,1e6],[1e-6,2e-6,3e-6])),before=flat.slice();assert.equal(measureSignedMeshVolume(flat).triangles,12);assert.deepEqual(flat,before);
});
test('actual recorded native mesh corrects integral cancellation without rewriting geometry or drift',async()=>{
 const path=new URL('./actual-native-mesh.json',import.meta.url);assert(fs.existsSync(path),'Actual component mesh capture required; no catalog-derived replacement.');
 const captured=JSON.parse(fs.readFileSync(path)),oracle=JSON.parse(fs.readFileSync(new URL('./fraction-oracle.json',import.meta.url)));assert.equal(captured.status,'PASS');assert.equal(oracle.status,'PASS');
 await inWorker(async run=>{for(const row of captured.rows){const local=await run(new Float64Array(row.positions));close(local.signedVolume,row.evidence.nativeVolume,5e-14);close(local.signedVolume,oracle.rows.find(r=>r.id===row.id).nearestBinary64,5e-14);if(row.id==='tiny-large-origin'){assert(globalIntegral(row.positions)<-1e-6);assert.equal(row.evidence.signedVolume,-2.6667257770895962e-6);assert(local.signedVolume>0);assert(Math.abs(local.signedVolume/6e-18-1)>2e-5,'Native dimensional drift remains visible.')}}});
});

test('retained unresolved counterexample: one anchor cannot certify widely separated tiny solids',async()=>inWorker(async run=>{
 const a=box([1e6,1e6,1e6],[1e-6,2e-6,3e-6]),b=box([-1e6,-1e6,-1e6],[1e-6,2e-6,3e-6]),result=await run([...a,...b]);
 const exact=JSON.parse(fs.readFileSync(new URL('./fraction-oracle.json',import.meta.url)));const expected=exact.rows.find(r=>r.id==='separated-tiny-boxes-analytic-oracle').nearestBinary64;assert.equal(expected,1.2000274123848626e-17);assert.equal(result.signedVolume,1.2000551038462114e-17);assert(Math.abs(result.signedVolume/expected-1)>2e-5);assert.equal(result.cancellationSensitive,true);
 // Separate known analytic closed boxes are an oracle only, not production
 // guessed grouping or a hidden per-shell fix. Existing module uses ONE anchor.
 close((await run(a)).signedVolume+(await run(b)).signedVolume,expected);
}));

test('actual Worker accepts the fixed 100000-triangle ceiling without mutating its input',async()=>inWorker(async run=>{
 const unit=box([1e6,1e6,1e6],[1,2,3]),positions=new Float64Array(MAX_VOLUME_TRIANGLES*9);for(let t=0;t<99996;t++)positions.set(unit.slice((t%12)*9,(t%12)*9+9),t*9);
 const before=positions.slice(),start=performance.now(),result=await run(positions);close(result.signedVolume,8333*6);assert.equal(result.triangles,MAX_VOLUME_TRIANGLES);assert.deepEqual(positions,before);console.log(JSON.stringify({scope:'one Node Worker roundtrip, including clone/init/measurement; not native or RSS',triangles:result.triangles,elapsedMs:performance.now()-start}));
}));
