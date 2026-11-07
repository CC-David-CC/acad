// Controlled Worker transport/termination faults only: no engine-success
// payload or fake geometry. The real controller must settle promises even if
// its terminal cleanup operation throws.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorkerMount} from '../../modules/engine/mount/worker-controller.mjs';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function mount(autoReady,reason){
 const original=globalThis.Worker,records=[];
 globalThis.Worker=class{constructor(){this.calls=0;records.push(this);}postMessage(m){if(autoReady&&m.kind==='init')queueMicrotask(()=>this.onmessage?.({data:{kind:'ready'}}));}terminate(){this.calls++;if(reason)throw reason;}};
 try{return{m:createWorkerMount({workerUrl:'/test-worker.js',jsPath:'/runtime.js',wasmPath:'/runtime.wasm',timeoutMs:50},{engine:'controller-protocol-double',representation:'occ-brep-worker-owned',mesh:false,profile:false,jsSha256:'a'.repeat(64),wasmSha256:'b'.repeat(64)}),record:records[0]};}finally{globalThis.Worker=original;}
}
async function outcome(p){let settled=false,value;p.then(v=>{settled=true;value={resolved:v};},e=>{settled=true;value={code:e?.code,name:e?.name};});await wait(100);return{settled,value};}
test('terminal cleanup failure settles initialization readiness and stays observable',async()=>{
 const failure=Error('injected termination failure'),{m,record}=mount(false,failure);assert.throws(()=>m.close(),e=>e===failure);const result=await outcome(m.ready);assert.equal(result.settled,true,'Closing must reject ready even if termination throws');assert.equal(result.value.code,'MOUNT_CLOSED');assert.throws(()=>m.close(),e=>e===failure,'A later resource-owner close must still observe cleanup failure');assert.equal(record.calls,1,'No unbounded cleanup retries');
});
test('terminal cleanup failure settles in-flight request even after its deadline',async()=>{
 const failure=Error('injected termination failure'),{m,record}=mount(true,failure);await m.ready;const pending=m.execute({op:'solid.box.create',version:1,unit:'millimeter',origin:[0,0,0],dimensions:[2,3,4]});assert.throws(()=>m.close(),e=>e===failure);const result=await outcome(pending);assert.equal(result.settled,true,'Pending operation must not remain hung after closed+deadline');assert.equal(result.value.code,'MOUNT_CLOSED');assert.throws(()=>m.close(),e=>e===failure);assert.equal(record.calls,1);
});
test('ordinary close still rejects pending work and remains idempotent',async()=>{
 const {m,record}=mount(true,null);await m.ready;const pending=m.execute({op:'solid.box.create',version:1,unit:'millimeter',origin:[0,0,0],dimensions:[2,3,4]});m.close();const result=await outcome(pending);assert.equal(result.settled,true);assert.equal(result.value.code,'MOUNT_CLOSED');m.close();assert.equal(record.calls,1);
});
