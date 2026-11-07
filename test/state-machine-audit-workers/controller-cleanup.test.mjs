// Controlled Worker transport/termination faults only: no engine-success
// payload or fake geometry. The real controller must settle promises even if
// its terminal cleanup operation throws.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorkerMount} from '../../modules/engine/mount/worker-controller.mjs';
import {createEvaluationResourcePool} from '../../web/app/cad/craft/evaluationResources.mjs';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function mount(autoReady,reason,shouldThrow=reason!==null){
 const original=globalThis.Worker,records=[];
 globalThis.Worker=class{constructor(){this.calls=0;records.push(this);}postMessage(m){if(autoReady&&m.kind==='init')queueMicrotask(()=>this.onmessage?.({data:{kind:'ready'}}));}terminate(){this.calls++;if(shouldThrow)throw reason;}};
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

for(const [label,reason]of [['undefined',undefined],['null',null],['zero',0],['false',false],['empty','']])test('exact falsey termination failure remains visible: '+label,async()=>{
 const {m,record}=mount(true,reason,true);await m.ready;const pending=m.execute({op:'solid.box.create',version:1,unit:'millimeter',origin:[0,0,0],dimensions:[2,3,4]});let first=false,value;try{m.close();}catch(e){first=true;value=e;}assert(first);assert.equal(value,reason);assert.equal((await outcome(pending)).settled,true);let repeated=false;try{m.close();}catch(e){repeated=true;assert.equal(e,reason);}assert(repeated);assert.equal(record.calls,1);
});
for(const [label,reason]of [['Error',Error('injected owner cleanup failure')],['null',null]])test('resource owner observes controller failure after abort settlement: '+label,async()=>{
 const pool=createEvaluationResourcePool(),document=new AbortController(),owner=pool.begin({signal:document.signal,valid:()=>true}),{m,record}=mount(true,reason,true);owner.getOrCreateMount('controller',()=>m);await m.ready;const pending=m.execute({op:'solid.box.create',version:1,unit:'millimeter',origin:[0,0,0],dimensions:[2,3,4]},{signal:owner.signal});owner.close();const result=await outcome(pending);assert.equal(result.settled,true);assert.equal(result.value.code,'CANCELLED');assert.equal(record.calls,1);assert.deepEqual(pool.usage,{owners:0,mounts:0,candidates:0,accepted:0,detached:0,cleanupFailed:true});assert.throws(()=>pool.begin({signal:document.signal,valid:()=>true}),/cleanup failed/);
});
