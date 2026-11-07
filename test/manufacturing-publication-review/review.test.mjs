// Actual production PM/Craft functions plus real preparation/hash Workers.
// Accepted models/replay remain explicitly protocol fixtures, not Native geometry.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {getEventListeners} from 'node:events';
import {setup,snapshot,assign,roles} from '../manufacturing-publication/harness.mjs';
const stable=s=>({A:s.A,J:s.J,T:s.T,material:s.material,revision:s.revision,history:s.history,models:s.models,epoch:s.epoch,counters:s.counters,storageRevision:s.storageRevision});
async function use(fn){const f=setup();try{await fn(f);}finally{await f.cleanup();}}
test('unmodified native pre-aborted signal refuses before Worker allocation',()=>use(async f=>{
 const c=new AbortController();c.abort();const before=snapshot(f);
 await assert.rejects(assign(f,roles(),{signal:c.signal}),{name:'AbortError'});
 assert.deepEqual(stable(snapshot(f)),stable(before));assert.equal(f.workers.hash,0);assert.equal(f.publicationWorkers.usage.created,0);
}));
test('native pre-aborted signal remains cancelled when its aborted property is shadowed',()=>use(async f=>{
 const c=new AbortController();c.abort();Object.defineProperty(c.signal,'aborted',{value:false,configurable:true});
 assert.equal(Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(c.signal),true);
 const before=snapshot(f);let error=null;
 try{await assign(f,roles(),{signal:c.signal});}catch(cause){error={name:cause?.name,code:cause?.code,message:cause?.message};}
 const after=snapshot(f);if(process.env.CODI_MANUFACTURING_REVIEW_OUTPUT)fs.writeFileSync(process.env.CODI_MANUFACTURING_REVIEW_OUTPUT,JSON.stringify({scope:'Actual PM/Craft and Workers; protocol accepted geometry only',nativeAborted:Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(c.signal),ownAborted:c.signal.aborted,error,before:stable(before),after:stable(after),hashWorkers:f.workers.hash,metadataWorkers:f.publicationWorkers.usage.created},null,2)+'\n');
 assert.equal(error?.name,'AbortError');assert.deepEqual(stable(after),stable(before));assert.equal(f.workers.hash,0);assert.equal(f.publicationWorkers.usage.created,0);
}));
test('native cancellation after hash completion preserves A/J/T and healthy concurrent caller may commit',()=>use(async f=>{
 const c=new AbortController();let stopped=false;f.setReplyHook(kind=>{if(kind==='hash'&&!stopped){stopped=true;c.abort();}});
 const a=assign(f,roles(),{signal:c.signal}),b=assign(f,roles());
 const results=await Promise.allSettled([a,b]);assert.equal(results[0].status,'rejected');assert.match(results[0].reason.message,/cancel/i);assert.equal(results[1].status,'fulfilled');assert.equal(f.journal$.value.entries.length,2);assert.notEqual(f.manager.getManufacturingMetadata(),null);assert.equal(f.craft.tip(),f.manager.inspectMaterialSurfaceRevision());assert.equal(f.publicationWorkers.usage.created,1);
}));
test('native cancellation during final valid callback after genuine Worker cleanup preserves exact state',()=>use(async f=>{
 const c=new AbortController(),before=snapshot(f);let stopped=false;
 await assert.rejects(assign(f,roles(),{signal:c.signal,valid(){if(f.publicationWorkers.usage.terminated&&!stopped){stopped=true;c.abort();}return true;}}),{name:'AbortError'});
 assert.ok(stopped);assert.deepEqual(stable(snapshot(f)),stable(before));await assign(f);assert.equal(f.journal$.value.entries.length,2);
}));
test('native signal own accessors and add/remove overrides cannot change normal assignment or cleanup',()=>use(async f=>{
 const c=new AbortController();let calls=0;
 Object.defineProperty(c.signal,'aborted',{get(){calls++;throw false;},configurable:true});
 for(const name of ['addEventListener','removeEventListener'])Object.defineProperty(c.signal,name,{value(){calls++;throw 0;},configurable:true});
 await assign(f,roles(),{signal:c.signal});assert.equal(calls,0);assert.equal(getEventListeners(c.signal,'abort').length,0);assert.equal(f.journal$.value.entries.length,2);
}));
test('hash cancellation uses native signal even with own method/property overrides, then healthy retry succeeds',()=>use(async f=>{
 const c=new AbortController(),before=snapshot(f);let calls=0,stopped=false;
 Object.defineProperty(c.signal,'aborted',{value:false,configurable:true});for(const name of ['addEventListener','removeEventListener'])Object.defineProperty(c.signal,name,{value(){calls++;throw false;},configurable:true});
 f.setReplyHook(kind=>{if(kind==='hash'&&!stopped){stopped=true;c.abort();}});
 await assert.rejects(assign(f,roles(),{signal:c.signal}),error=>/cancel/i.test(error.message));
 assert.ok(stopped);assert.equal(calls,0);assert.equal(getEventListeners(c.signal,'abort').length,0);assert.equal(f.workers.hash,1);assert.equal(f.publicationWorkers.usage.created,0);assert.deepEqual(stable(snapshot(f)),stable(before));
 f.setReplyHook(null);await assign(f);assert.equal(f.journal$.value.entries.length,2);
}));
test('held genuine preparation abort ignores own remove override, preserves state and leaves healthy module',()=>use(async f=>{
 const c=new AbortController(),before=snapshot(f),ready=f.publicationWorkers.hold(),pending=assign(f,roles(),{signal:c.signal});await ready;let calls=0;
 Object.defineProperty(c.signal,'aborted',{value:false,configurable:true});Object.defineProperty(c.signal,'removeEventListener',{value(){calls++;throw '';},configurable:true});c.abort();
 await assert.rejects(pending,{name:'AbortError'});f.publicationWorkers.release();await f.publicationWorkers.drain();assert.equal(calls,0);assert.equal(getEventListeners(c.signal,'abort').length,0);assert.deepEqual(stable(snapshot(f)),stable(before));
 await assign(f);assert.equal(f.journal$.value.entries.length,2);
}));
