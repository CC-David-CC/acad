// These are transport doubles using a recorded real result. No native/math pass.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {createRevolveProfileOccMount} from '../../modules/engine/mount/occ-revolve-profile-mount.mjs';
const require=createRequire(import.meta.url),request=require('./cases.cjs').cases[0].request,fixture=JSON.parse(fs.readFileSync(new URL('./recorded-revolve.json',import.meta.url)));
async function run(change){
 const original=globalThis.Worker,records=[];
 globalThis.Worker=class{constructor(){records.push(this);this.closed=false;}postMessage(m){queueMicrotask(()=>{if(m.kind==='init'){this.onmessage({data:{kind:'ready'}});return;}const data={kind:'result',seq:m.seq,evidence:structuredClone(fixture.evidence),binding:structuredClone(fixture.binding)};change?.(data);this.onmessage({data});});}terminate(){this.closed=true;}};
 try{const mount=createRevolveProfileOccMount({workerUrl:'/worker.js',jsPath:'/runtime.js',wasmPath:'/runtime.wasm'});await mount.ready;try{return{value:await mount.execute(request),worker:records[0]};}catch(error){return{error,worker:records[0]};}finally{mount.close();}}finally{globalThis.Worker=original;}
}
test('recorded valid reply demonstrates bridge routing only',async()=>{const r=await run();assert.equal(r.error,undefined);assert.equal(r.value.binding.requestSha256,fixture.binding.requestSha256);});
for(const [name,change]of [
 ['wrong full request digest',d=>d.binding.requestSha256='0'.repeat(64)],
 ['changed source digest',d=>d.binding.source.sourceSha256='0'.repeat(64)],
 ['changed source axis',d=>d.binding.axisId='unrelated'],
 ['changed signed angle',d=>d.binding.angleRadians=-Math.PI],
 ['extra binding field',d=>d.binding.extra=true],
 ['accessor binding field',d=>Object.defineProperty(d.binding,'axisId',{enumerable:true,get(){throw Error('getter must not execute');}})],
 ['extra envelope field',d=>d.extra=true],
 ['nonfinite native volume',d=>d.evidence.nativeVolume=NaN],
 ['reversed native bounds',d=>d.evidence.nativeBounds.min[0]=1e10],
 ['non-solid result',d=>d.evidence.solidCount=0],
 ['unsolicited provenance',d=>d.constructionProvenance={status:'available'}]
])test('refuse malformed '+name+' before handle publication',async()=>{const r=await run(change);assert.equal(r.value,undefined);assert.equal(r.error.code,'ENGINE_FAILURE');assert(r.worker.closed);});
