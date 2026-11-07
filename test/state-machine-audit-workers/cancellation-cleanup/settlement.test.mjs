// Controller transport/cancellation faults only; never engine-success payloads.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,box,wait,observe} from './fixture.mjs';
const closeFailure=(m,cause)=>{let thrown=false;try{m.close();}catch(e){thrown=true;assert.equal(e,cause);}assert(thrown);};
for(const native of [false,true])for(const cause of [Error('remove fault'),undefined,null,0,false,''])test(`remove failure settles original Worker error: native=${native}, cause=${String(cause)}`,async()=>{
 const signal=native?new AbortController().signal:{aborted:false,addEventListener(){}};let calls=0;
 Object.defineProperty(signal,'removeEventListener',{value(){calls++;throw cause;}});
 const f=fixture();await f.mount.ready;const o=observe(f.mount.execute(box,{signal}));assert.doesNotThrow(()=>f.emitError());await wait(1);assert.equal(o.code,'MEASUREMENT_PRECISION_UNRESOLVED');assert.equal(calls,1);assert.equal(f.worker.terminations,1);closeFailure(f.mount,cause);closeFailure(f.mount,cause);assert.equal(calls,1);
});
for(const native of [false,true])test(`registration failure retires mount immediately: native=${native}`,async()=>{
 const cause=Error('add fault'),signal=native?new AbortController().signal:{aborted:false,removeEventListener(){}};
 Object.defineProperty(signal,'addEventListener',{value(){throw cause;}});
 const f=fixture();await f.mount.ready;await assert.rejects(f.mount.execute(box,{signal}),e=>e.code==='ENGINE_FAILURE'&&e.cause===cause);await assert.rejects(f.mount.execute(box),{code:'MOUNT_CLOSED'});assert.equal(f.worker.messages.length,1);assert.equal(f.worker.terminations,1);f.mount.close();
});
test('transport opaque error is not coerced and exact cause is retained',async()=>{
 let coercions=0;const cause={toString(){coercions++;throw Error('must not coerce');}},f=fixture({postError:{value:cause}});await f.mount.ready;
 await assert.rejects(f.mount.execute(box),e=>e.code==='ENGINE_FAILURE'&&e.cause===cause);assert.equal(coercions,0);await assert.rejects(f.mount.execute(box),{code:'MOUNT_CLOSED'});assert.equal(f.worker.terminations,1);f.mount.close();
});
for(const cause of [undefined,null,0,false,''])test(`falsey transport failure preserved: ${String(cause)}`,async()=>{
 const f=fixture({postError:{value:cause}});await f.mount.ready;await assert.rejects(f.mount.execute(box),e=>e.code==='ENGINE_FAILURE'&&Object.hasOwn(e,'cause')&&e.cause===cause);assert.equal(f.worker.terminations,1);f.mount.close();
});
test('initial post failure settles readiness with exact uncoerced cause',async()=>{
 const cause={toString(){throw Error('must not coerce');}},f=fixture({initError:{value:cause}});await assert.rejects(f.mount.ready,e=>e.code==='ENGINE_FAILURE'&&e.cause===cause);await assert.rejects(f.mount.execute(box),{code:'MOUNT_CLOSED'});assert.equal(f.worker.terminations,1);f.mount.close();
});
for(const kind of ['abort','close','abort-then-throw'])test('synchronous registration '+kind+' prevents posting',async()=>{
 let f;const signal={aborted:false,addEventListener(type,cb){if(kind==='close')f.mount.close();else{this.aborted=true;cb();}if(kind==='abort-then-throw')throw Error('later setup failure');},removeEventListener(){}};
 f=fixture();await f.mount.ready;await assert.rejects(f.mount.execute(box,{signal}),{code:kind==='close'?'MOUNT_CLOSED':'CANCELLED'});assert.equal(f.worker.messages.length,1);assert.equal(f.worker.terminations,1);f.mount.close();
});
test('abort without callback during registration is detected before post',async()=>{
 const signal={aborted:false,addEventListener(){this.aborted=true;},removeEventListener(){}},f=fixture();await f.mount.ready;await assert.rejects(f.mount.execute(box,{signal}),{code:'CANCELLED'});assert.equal(f.worker.messages.length,1);f.mount.close();
});
test('reentrant remove cannot submit a second job before settlement',async()=>{
 let f,retry,calls=0;const signal={aborted:false,addEventListener(){},removeEventListener(){calls++;retry=f.mount.execute(box);retry.catch(()=>{});}};
 f=fixture();await f.mount.ready;const pending=f.mount.execute(box,{signal});f.emitError();await assert.rejects(pending,{code:'MEASUREMENT_PRECISION_UNRESOLVED'});await assert.rejects(retry,{code:'BUSY'});assert.equal(calls,1);assert.equal(f.worker.messages.length,2);f.mount.close();
});
test('reentrant remove close settles once without recursive cleanup',async()=>{
 let f,calls=0;const signal={aborted:false,addEventListener(){},removeEventListener(){calls++;f.mount.close();}};
 f=fixture();await f.mount.ready;const pending=f.mount.execute(box,{signal});assert.doesNotThrow(()=>f.emitError());await assert.rejects(pending,{code:'MOUNT_CLOSED'});assert.equal(calls,1);assert.equal(f.worker.terminations,1);f.mount.close();
});
test('native abort settles CANCELLED; listener removal and close remain ordinary',async()=>{
 const f=fixture(),controller=new AbortController();await f.mount.ready;const pending=f.mount.execute(box,{signal:controller.signal});controller.abort();await assert.rejects(pending,{code:'CANCELLED'});assert.equal(f.worker.terminations,1);f.mount.close();
});
test('native already aborted refuses before posting or reservation',async()=>{
 const f=fixture(),controller=new AbortController();await f.mount.ready;controller.abort();await assert.rejects(f.mount.execute(box,{signal:controller.signal}),{code:'CANCELLED'});assert.equal(f.worker.messages.length,1);f.mount.close();
});
test('ordinary no-signal adaptive failure remains exact',async()=>{
 const f=fixture();await f.mount.ready;const p=f.mount.execute(box);f.emitError();await assert.rejects(p,{code:'MEASUREMENT_PRECISION_UNRESOLVED'});f.mount.close();
});
test('aborted getter failure at reply preserves original Worker failure instead of escaping',async()=>{
 const cause=Error('aborted getter failed');let fail=false;const signal={get aborted(){if(fail)throw cause;return false;},addEventListener(){},removeEventListener(){}};
 const f=fixture();await f.mount.ready;const p=f.mount.execute(box,{signal});fail=true;assert.doesNotThrow(()=>f.emitError());await assert.rejects(p,{code:'MEASUREMENT_PRECISION_UNRESOLVED'});f.mount.close();
});
test('timeout with throwing removal still settles and preserves cleanup cause',async()=>{
 const cause=Error('timeout remove failed'),signal={aborted:false,addEventListener(){},removeEventListener(){throw cause;}},f=fixture({timeoutMs:10});await f.mount.ready;await assert.rejects(f.mount.execute(box,{signal}),{code:'TIMEOUT'});closeFailure(f.mount,cause);
});
for(const cause of [undefined,null,0,false,''])test(`falsey registration cause stays exact: ${String(cause)}`,async()=>{
 const signal={aborted:false,addEventListener(){throw cause;},removeEventListener(){}},f=fixture();await f.mount.ready;await assert.rejects(f.mount.execute(box,{signal}),e=>e.code==='ENGINE_FAILURE'&&Object.hasOwn(e,'cause')&&e.cause===cause);assert.equal(f.worker.messages.length,1);f.mount.close();
});
test('setup failure remains primary when removal also fails',async()=>{
 const setup=Error('setup'),cleanup=Error('cleanup'),signal={aborted:false,addEventListener(){throw setup;},removeEventListener(){throw cleanup;}},f=fixture();await f.mount.ready;await assert.rejects(f.mount.execute(box,{signal}),e=>e.code==='ENGINE_FAILURE'&&e.cause===setup);closeFailure(f.mount,cleanup);
});
test('native abort removal failure preserves CANCELLED and exact cleanup failure',async()=>{
 const f=fixture(),controller=new AbortController(),cause=Error('remove');Object.defineProperty(controller.signal,'removeEventListener',{value(){throw cause;}});await f.mount.ready;const pending=f.mount.execute(box,{signal:controller.signal});controller.abort();await assert.rejects(pending,{code:'CANCELLED'});closeFailure(f.mount,cause);
});
test('known unsupported result remains primary when removal fails',async()=>{
 const cause=Error('cleanup'),signal={aborted:false,addEventListener(){},removeEventListener(){throw cause;}},f=fixture();await f.mount.ready;const pending=f.mount.execute(box,{signal});const job=f.worker.messages.find(m=>m.kind==='box');assert.doesNotThrow(()=>f.worker.onmessage({data:{kind:'unsupported',seq:job.seq,code:'EMPTY_OR_NON_SOLID_UNSUPPORTED',error:'controlled refusal; no geometry'}}));await assert.rejects(pending,{code:'EMPTY_OR_NON_SOLID_UNSUPPORTED'});closeFailure(f.mount,cause);
});
test('changed remove method getter is guarded at terminal reply',async()=>{
 const cause=Error('getter'),signal={aborted:false,addEventListener(){},removeEventListener(){}},f=fixture();await f.mount.ready;const pending=f.mount.execute(box,{signal});Object.defineProperty(signal,'removeEventListener',{get(){throw cause;}});assert.doesNotThrow(()=>f.emitError());await assert.rejects(pending,{code:'MEASUREMENT_PRECISION_UNRESOLVED'});closeFailure(f.mount,cause);
});

test('ordinary unsupported completion clears pending and permits a healthy transport retry',async()=>{
 let adds=0,removes=0;const signal={aborted:false,addEventListener(){adds++;},removeEventListener(){removes++;}},f=fixture();await f.mount.ready;
 const first=f.mount.execute(box,{signal}),job=f.worker.messages.find(m=>m.kind==='box');f.worker.onmessage({data:{kind:'unsupported',seq:job.seq,code:'EMPTY_OR_NON_SOLID_UNSUPPORTED',error:'controlled refusal; no geometry'}});await assert.rejects(first,{code:'EMPTY_OR_NON_SOLID_UNSUPPORTED'});
 const retry=f.mount.execute(box,{signal}),last=f.worker.messages.at(-1);f.worker.onmessage({data:{kind:'error',seq:last.seq,code:'MESH_VOLUME_NUMERIC_RANGE',error:'controlled numerical refusal; no geometry'}});await assert.rejects(retry,{code:'MESH_VOLUME_NUMERIC_RANGE'});assert.equal(adds,2);assert.equal(removes,2);assert.equal(f.worker.terminations,1);f.mount.close();
});
