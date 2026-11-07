// Actual service/plane/Workers; submit is error-only, not native publication.
import test from 'node:test';
import assert from 'node:assert/strict';
import {getEventListeners} from 'node:events';
import {api,source,counted,withSubmit,drain,lifecycle,requests} from './fixture.mjs';
let text;test('prepare actual authored Circle source',async()=>{text=await source();});
const listeners=signal=>getEventListeners(signal,'abort').length;
for(const afterRegister of [false,true])for(const cause of [Error('own add failure'),undefined,null,0,false,''])test(`registration failure unwinds earlier project subscription, afterRegister=${afterRegister}, cause=${String(cause)}`,async()=>{
 const f=api.fixture(text),project=counted(f.ctx.projectService.documentSignal),caller=new AbortController(),nativeAdd=caller.signal.addEventListener;
 Object.defineProperty(caller.signal,'addEventListener',{value(...args){if(afterRegister)nativeAdd.apply(this,args);throw cause;}});
 const n=requests.length;await assert.rejects(f.api.editSourcePlaneDepth(f.request(12),{signal:caller.signal}),e=>e===cause);assert.equal(project.adds,1);assert.equal(project.removes,1);assert.equal(listeners(f.ctx.projectService.documentSignal),0);assert.equal(listeners(caller.signal),0);assert.equal(requests.length,n);assert.equal(f.events.writes.length,0);f.close();
});
for(const cause of [Error('own remove failure'),undefined,null,0,false,''])test(`remove fallback preserves ordinary no-op receipt and removes native listener: ${String(cause)}`,async()=>{
 const f=api.fixture(text),caller=new AbortController();Object.defineProperty(caller.signal,'removeEventListener',{value(){throw cause;}});const n=requests.length,result=await f.api.editSourcePlaneDepth(f.request(0),{signal:caller.signal});assert.equal(result.changed,false);assert.equal(result.committed,false);assert.equal(listeners(caller.signal),0);assert.equal(listeners(f.ctx.projectService.documentSignal),0);assert.equal(requests.length,n);f.close();
});
for(const committed of [false,true])test(`real preparation + error-only submit preserves exact primary and discards workspace: committed marker=${committed}`,async()=>{
 const primary=Object.assign(Error('controlled submit; native not run'),{code:'NATIVE_NOT_RUN',...(committed?{committed:true}:{})}),f=withSubmit(text,primary),caller=new AbortController(),project=counted(f.ctx.projectService.documentSignal);
 Object.defineProperty(caller.signal,'removeEventListener',{value(){throw Error('cleanup');}});await assert.rejects(f.api.editSourcePlaneDepth(f.request(12),{signal:caller.signal}),e=>e===primary);assert.equal(f.events.writes.length,1);assert.equal(f.events.discards,1);assert.equal(f.events.commits,0);assert.equal(project.removes,1);assert.equal(listeners(caller.signal),0);assert.equal(listeners(f.ctx.projectService.documentSignal),0);assert.equal(f.source(),text);assert.equal(f.ctx.craftService.modifications$.value.history[0].params.depth,0);f.close();
});
test('both instance removals may throw; all native fallbacks and workspace discard still run',async()=>{
 const primary=Object.assign(Error('controlled submit; native not run'),{code:'NATIVE_NOT_RUN'}),f=withSubmit(text,primary),caller=new AbortController();let removals=0;
 for(const signal of [f.ctx.projectService.documentSignal,caller.signal])Object.defineProperty(signal,'removeEventListener',{value(){removals++;throw Error('own cleanup');}});
 await assert.rejects(f.api.editSourcePlaneDepth(f.request(12),{signal:caller.signal}),e=>e===primary);assert.equal(removals,2);assert.equal(listeners(caller.signal),0);assert.equal(listeners(f.ctx.projectService.documentSignal),0);assert.equal(f.events.discards,1);assert.equal(f.events.commits,0);f.close();
});
test('ordinary caller abort stays cancelled and releases both subscriptions',async()=>{
 const f=api.fixture(text),caller=new AbortController(),n=requests.length;caller.abort();await assert.rejects(f.api.editSourcePlaneDepth(f.request(12),{signal:caller.signal}),e=>e.name==='AbortError'&&e.committed===false);assert.equal(listeners(caller.signal),0);assert.equal(listeners(f.ctx.projectService.documentSignal),0);assert.equal(requests.length,n);f.close();
});
test('synchronous registration document loss dispatches no source Worker',async()=>{
 const f=api.fixture(text),caller=new AbortController(),add=caller.signal.addEventListener,n=requests.length;Object.defineProperty(caller.signal,'addEventListener',{value(...args){add.apply(this,args);f.close();}});await assert.rejects(f.api.editSourcePlaneDepth(f.request(12),{signal:caller.signal}),e=>e.name==='AbortError');assert.equal(requests.length,n);assert.equal(listeners(caller.signal),0);assert.equal(listeners(f.ctx.projectService.documentSignal),0);
});
test('false signal remains rejected by native-brand validation',async()=>{
 const f=api.fixture(text),n=requests.length;await assert.rejects(f.api.editSourcePlaneDepth(f.request(12),{signal:{aborted:false,addEventListener(){},removeEventListener(){}}}),{code:'INVALID_REQUEST'});assert.equal(requests.length,n);f.close();
});
test('all real production Workers physically retire',async()=>{await drain();assert.equal(lifecycle.started,lifecycle.terminated);});
