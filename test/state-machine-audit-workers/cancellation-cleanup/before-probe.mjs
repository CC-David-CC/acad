import assert from 'node:assert/strict';
import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fixture,box,wait,observe} from './fixture.mjs';
const rows=[];
for(const native of [false,true]){
 const failure=Error('controlled remove failure'),signal=native?new AbortController().signal:{aborted:false,addEventListener(){}};
 Object.defineProperty(signal,'removeEventListener',{value(){throw failure;},configurable:true});
 const f=fixture();await f.mount.ready;const o=observe(f.mount.execute(box,{signal}));let dispatched;
 try{f.emitError();}catch(e){dispatched=e;}await wait(75);assert.equal(dispatched,failure);assert.equal(o.settled,false);f.mount.close();await wait(5);assert.equal(o.settled,false);
 rows.push({case:native?'native overridden remove':'duck remove',dispatchThrowsExactCause:true,unsettledAfterDeadline:true,unsettledAfterClose:true,terminations:f.worker.terminations});
}
for(const native of [false,true]){
 const failure=Error('controlled add failure'),signal=native?new AbortController().signal:{aborted:false,removeEventListener(){}};
 Object.defineProperty(signal,'addEventListener',{value(){throw failure;},configurable:true});
 const f=fixture({timeoutMs:100});await f.mount.ready;const o=observe(f.mount.execute(box,{signal}));await wait(1);assert.equal(o.error,failure);await assert.rejects(f.mount.execute(box),{code:'BUSY'});f.mount.close();
 rows.push({case:native?'native overridden add':'duck add',setupThrowsExactCause:true,retryBusy:true,postedJobs:f.worker.messages.filter(m=>m.kind!=='init').length,terminations:f.worker.terminations});
}
let coerced=0;const coercionFailure=Error('coercion failure'),original={toString(){coerced++;throw coercionFailure;}};
const f=fixture({timeoutMs:100,postError:{value:original}});await f.mount.ready;const o=observe(f.mount.execute(box));await wait(1);assert.equal(o.error,coercionFailure);assert.equal(coerced,1);await assert.rejects(f.mount.execute(box),{code:'BUSY'});f.mount.close();rows.push({case:'post failure throwing coercion',originalMasked:true,coerced,retryBusy:true});
const source=await readFile(new URL('../../../modules/engine/mount/worker-controller.mjs',import.meta.url));
const receipt={status:'CONFIRMED_SYNTHETIC_CONTRACT_DEFECTS',sourceSha256:createHash('sha256').update(source).digest('hex'),scope:'error-only synthetic offered API contract; no native result or incident claim',rows};
await writeFile(process.argv[2]||'/tmp/controller-before.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
