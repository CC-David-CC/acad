// Normative BEFORE controls: intentionally RED on cb4e36dbc. These must pass
// unchanged after strict detached construction-provenance capture is added.
import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
async function run(mode){const worker=new Worker(new URL('./worker.mjs',import.meta.url),{workerData:{mode}});try{return await new Promise((resolve,reject)=>{worker.once('message',resolve);worker.once('error',reject);worker.once('exit',code=>{if(code)reject(Error('Review Worker exit '+code));});});}finally{await worker.terminate();}}
for(const mode of ['construction-status-getter','construction-edge-getter'])test('strict provenance capture refuses '+mode+' without executing or mutating input',async()=>{
 const result=await run(mode);
 assert.deepEqual({status:result.status,reads:result.reads,currentDepth:result.currentDepth},{status:'REFUSED',reads:0,currentDepth:result.originalDepth});
});
