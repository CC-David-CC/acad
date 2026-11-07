// Recorded REAL native reply replay, for protocol validation only. No fresh
// native execution, source solve, model generation or public acceptance claim.
import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import {createRequire} from 'node:module';
import {createSweepProfileOccMount} from '../../modules/engine/mount/occ-sweep-profile-mount.mjs';
const receipt=JSON.parse(fs.readFileSync(new URL('../owned-sweep-worker/evidence-r1/receipt-r2.json',import.meta.url)));
assert.equal(receipt.status,'PASS');const row=receipt.actual.rows[0];
const request=createRequire(import.meta.url)('../owned-sweep-worker/cases.cjs').cases.find(c=>c.name===row.name).request;
async function replay(change){
 const original=globalThis.Worker;let closed=false,reads=0;
 globalThis.Worker=class{postMessage(message){queueMicrotask(()=>{if(message.kind==='init'){this.onmessage({data:{kind:'ready'}});return;}const result={kind:'result',seq:message.seq,binding:structuredClone(row.result.binding),evidence:structuredClone(row.result.evidence)};change?.(result,()=>reads++);this.onmessage({data:result});});}terminate(){closed=true;}};
 let mount;try{mount=createSweepProfileOccMount({workerUrl:'/worker.js',jsPath:'/native.js',wasmPath:'/native.wasm'});await mount.ready;try{return{result:await mount.execute(request),closed,reads};}catch(error){return{error,closed,reads};}}finally{mount?.close();globalThis.Worker=original;}
}
test('recorded genuine result is routable without claiming another native success',async()=>{const r=await replay();assert.equal(r.error,undefined);assert.equal(r.result.binding.requestSha256,row.result.binding.requestSha256);});
for(const [name,change] of [
 ['profile identity',r=>r.binding.source.faceId='other'],
 ['path identity',r=>r.binding.pathSource.faceId='other'],
 ['path digest',r=>r.binding.pathSource.sourceSha256='0'.repeat(64)],
 ['path source reference',r=>r.binding.pathCurves[0].curveId='other'],
 ['path direction',r=>r.binding.pathCurves[0].reversed=!r.binding.pathCurves[0].reversed],
 ['transport',r=>r.binding.transport='automatic'],
 ['full request digest',r=>r.binding.requestSha256='0'.repeat(64)],
 ['extra source data',r=>r.binding.pathSource.frame={}],
 ['native nonpositive volume',r=>r.evidence.nativeVolume=0],
 ['extra response provenance',r=>r.constructionProvenance={status:'available'}]
])test('changed '+name+' refuses before handle publication',async()=>{const r=await replay(change);assert.equal(r.result,undefined);assert.equal(r.error.code,'ENGINE_FAILURE');assert.equal(r.closed,true);});
test('nested path accessor is rejected without executing it',async()=>{const r=await replay((value,read)=>Object.defineProperty(value.binding.pathCurves[0],'reversed',{enumerable:true,get(){read();return false;}}));assert.equal(r.result,undefined);assert.equal(r.error.code,'ENGINE_FAILURE');assert.equal(r.reads,0);assert.equal(r.closed,true);});
