// Full production service with explicit target/services admission doubles.
// Evaluator only throws. These are routing/custody tests, not native geometry.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,counted,listenerCount,release,loadService,nativeRemove} from './fixture.mjs';
for(const afterRegister of [false,true])for(const cause of [Error('add'),undefined,null,0,false,''])test(`caller registration unwinds every attempted subscription: afterRegister=${afterRegister}, cause=${String(cause)}`,async()=>{
 const f=fixture(),caller=new AbortController(),add=caller.signal.addEventListener,project=counted(f.document.signal),before=f.snapshot();Object.defineProperty(caller.signal,'addEventListener',{value(...args){if(afterRegister)add.apply(this,args);throw cause;}});await assert.rejects(f.api.classifyWorkerSolidPoints(f.request,{signal:caller.signal}),e=>e===cause);assert.equal(project.adds,1);assert.equal(project.removes,1);assert.equal(listenerCount(f.document.signal),0);assert.equal(listenerCount(caller.signal),0);assert.equal(f.calls.length,0);assert.deepEqual(f.snapshot(),before);f.close();
});
for(const primary of [Error('NATIVE_NOT_RUN'),undefined,null,0,false,''])test(`remove fallback preserves exact error-only evaluator failure: ${String(primary)}`,async()=>{
 const f=fixture({evaluator:async()=>{throw primary;}}),caller=new AbortController(),before=f.snapshot();Object.defineProperty(caller.signal,'removeEventListener',{value(){throw Error('cleanup');}});await assert.rejects(f.api.classifyWorkerSolidPoints(f.request,{signal:caller.signal}),e=>e===primary);assert.equal(f.calls.length,1);assert.equal(listenerCount(f.document.signal),0);assert.equal(listenerCount(caller.signal),0);assert.deepEqual(f.snapshot(),before);f.close();
});
test('both instance removers may throw; each native fallback runs',async()=>{
 const f=fixture(),caller=new AbortController(),before=f.snapshot();let attempts=0;for(const signal of [f.document.signal,caller.signal])Object.defineProperty(signal,'removeEventListener',{value(){attempts++;throw Error('remove');}});await assert.rejects(f.api.classifyWorkerSolidPoints(f.request,{signal:caller.signal}),e=>e===f.error);assert.equal(attempts,2);assert.equal(listenerCount(f.document.signal),0);assert.equal(listenerCount(caller.signal),0);assert.deepEqual(f.snapshot(),before);f.close();
});
test('project register-then-throw is unwound before caller registration',async()=>{
 const f=fixture(),caller=new AbortController(),counts=counted(caller.signal),add=f.document.signal.addEventListener,cause=Error('project setup');Object.defineProperty(f.document.signal,'addEventListener',{value(...args){add.apply(this,args);throw cause;}});await assert.rejects(f.api.classifyWorkerSolidPoints(f.request,{signal:caller.signal}),e=>e===cause);assert.equal(counts.adds,0);assert.equal(counts.removes,0);assert.equal(listenerCount(f.document.signal),0);assert.equal(f.calls.length,0);f.close();
});
test('native branded signal with non-callable add still releases prior project listener',async()=>{
 const f=fixture(),caller=new AbortController();Object.defineProperty(caller.signal,'addEventListener',{value:null});await assert.rejects(f.api.classifyWorkerSolidPoints(f.request,{signal:caller.signal}),e=>e.name==='TypeError');assert.equal(listenerCount(f.document.signal),0);assert.equal(f.calls.length,0);f.close();
});
test('remover getter throw uses native fallback and preserves evaluator error',async()=>{
 const f=fixture(),caller=new AbortController();Object.defineProperty(caller.signal,'removeEventListener',{get(){throw Error('get remove');}});await assert.rejects(f.api.classifyWorkerSolidPoints(f.request,{signal:caller.signal}),e=>e===f.error);assert.equal(listenerCount(caller.signal),0);assert.equal(listenerCount(f.document.signal),0);f.close();
});
test('ordinary error-only completion releases listeners and permits another guarded read attempt',async()=>{
 const f=fixture(),caller=new AbortController(),counts=counted(caller.signal),before=f.snapshot();for(let i=0;i<2;i++)await assert.rejects(f.api.classifyWorkerSolidPoints(f.request,{signal:caller.signal}),e=>e===f.error);assert.equal(f.calls.length,2);assert.equal(counts.adds,2);assert.equal(counts.removes,2);assert.equal(listenerCount(caller.signal),0);assert.deepEqual(f.snapshot(),before);f.close();
});
for(const documentLoss of [false,true])test(`held error-only evaluator cancellation survives throwing cleanup: document=${documentLoss}`,async()=>{
 let started;const entered=new Promise(r=>started=r),reason=new DOMException('controlled evaluator cancellation','AbortError'),f=fixture({evaluator:async input=>{started();await new Promise((yes,no)=>{input.signal.addEventListener('abort',()=>no(reason),{once:true});});throw Error('unreachable');}}),caller=new AbortController(),before=f.snapshot();Object.defineProperty(caller.signal,'removeEventListener',{value(){throw Error('remove');}});const p=f.api.classifyWorkerSolidPoints(f.request,{signal:caller.signal});await entered;if(documentLoss)f.close();else caller.abort();await assert.rejects(p,e=>e===reason);assert.equal(listenerCount(caller.signal),0);assert.equal(listenerCount(f.document.signal),0);assert.deepEqual(f.snapshot(),before);f.close();
});
test('already-aborted caller refuses before evaluator and leaves no subscriptions',async()=>{
 const f=fixture(),caller=new AbortController();caller.abort();await assert.rejects(f.api.classifyWorkerSolidPoints(f.request,{signal:caller.signal}),e=>e.name==='AbortError');assert.equal(f.calls.length,0);assert.equal(listenerCount(caller.signal),0);assert.equal(listenerCount(f.document.signal),0);f.close();
});
test('synchronous registration document loss does not enter evaluator',async()=>{
 const f=fixture(),caller=new AbortController(),add=caller.signal.addEventListener;Object.defineProperty(caller.signal,'addEventListener',{value(...args){add.apply(this,args);f.close();}});await assert.rejects(f.api.classifyWorkerSolidPoints(f.request,{signal:caller.signal}),e=>e.name==='AbortError');assert.equal(f.calls.length,0);assert.equal(listenerCount(caller.signal),0);assert.equal(listenerCount(f.document.signal),0);
});
for(const mutate of [f=>f.request.revision='stale',f=>f.request.featureId=2,f=>f.request.points=[[NaN,0,0]]])test('ordinary stale/target/malformed refusal never registers',async()=>{
 const f=fixture(),caller=new AbortController(),counts=counted(caller.signal);mutate(f);await assert.rejects(f.api.classifyWorkerSolidPoints(f.request,{signal:caller.signal}));assert.equal(counts.adds,0);assert.equal(f.calls.length,0);f.close();
});
test('duck signal remains rejected before registration or evaluator',async()=>{
 const f=fixture();await assert.rejects(f.api.classifyWorkerSolidPoints(f.request,{signal:{aborted:false,addEventListener(){},removeEventListener(){}}}),{code:'INVALID_REQUEST'});assert.equal(f.calls.length,0);f.close();
});
for(const loggerThrows of [false,true])test(`irrecoverable cleanup attempts all and diagnoses exact causes, loggerThrows=${loggerThrows}`,async()=>{
 const old=EventTarget.prototype.removeEventListener,targets=new Map(),diagnostics=[];
 EventTarget.prototype.removeEventListener=function(...args){if(targets.has(this))throw targets.get(this);return old.apply(this,args);};
 let create;try{create=loadService({logger:{error(message,cause){diagnostics.push({message,cause});if(loggerThrows)throw Error('logger');}}});}finally{EventTarget.prototype.removeEventListener=old;}
 const f=fixture({create}),caller=new AbortController(),projectCause={exact:'opaque cleanup'},callerCause=null,before=f.snapshot();targets.set(f.document.signal,projectCause);targets.set(caller.signal,callerCause);for(const signal of targets.keys())Object.defineProperty(signal,'removeEventListener',{value(){throw Error('own removal');}});
 try{await assert.rejects(f.api.classifyWorkerSolidPoints(f.request,{signal:caller.signal}),e=>e===f.error);assert.equal(diagnostics.length,2);assert.equal(diagnostics[0].cause,projectCause);assert.equal(diagnostics[1].cause,callerCause);assert(diagnostics.every(r=>r.message.includes('release is unconfirmed')));assert.deepEqual(f.snapshot(),before);assert.equal(listenerCount(f.document.signal),1);assert.equal(listenerCount(caller.signal),1);}finally{release(f.document.signal);release(caller.signal);f.close();}
});
