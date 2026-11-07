// Actual preparation client + genuine metadata Worker, synthetic metadata only.
import test from 'node:test';import assert from 'node:assert/strict';import {getEventListeners} from 'node:events';
import {transport} from '../manufacturing-publication/transport.mjs';
const request=()=>({action:'enclosure',before:null,args:{geometryRevision:'sha256-'+'a'.repeat(64),featureId:7,history:[{type:'WORKER_ENCLOSURE_V1',params:{featureId:7}}],bodies:['BODY','LID'].map(outputRole=>({id:'worker-enclosure:1:'+JSON.stringify([7,outputRole]),featureId:7,originatingOperation:0,outputRole})),roles:Object.fromEntries(['BODY','LID'].map(role=>[role,{material:{id:role,name:role},appearance:null}]))}});
let nonce=0;async function use(fn){const t=transport(),prior=globalThis.Worker,c=await import('../../web/app/cad/projectManager/manufacturingPublicationClient.mjs?native-signal-review='+ ++nonce);globalThis.Worker=t.Adapter;try{await fn(c,t);}finally{await t.close();globalThis.Worker=prior;}}
test('direct preparation client rejects native preabort despite own false data, zero allocation',()=>use(async(c,t)=>{
 for(const key of ['signal','cancellationSignal']){const a=new AbortController();a.abort();Object.defineProperty(a.signal,'aborted',{value:false});await assert.rejects(c.prepareManufacturingInWorker('publication',request(),{[key]:a.signal}),{name:'AbortError'});}assert.equal(t.usage.created,0);
}));
test('direct client uses native signal operations, including one signal in both slots and exact listener cleanup',()=>use(async(c,t)=>{
 const a=new AbortController();let called=0;Object.defineProperty(a.signal,'aborted',{get(){called++;throw false;}});for(const key of ['addEventListener','removeEventListener'])Object.defineProperty(a.signal,key,{value(){called++;throw 0;}});
 await c.prepareManufacturingInWorker('publication',request(),{signal:a.signal,cancellationSignal:a.signal});assert.equal(called,0);assert.equal(getEventListeners(a.signal,'abort').length,0);assert.equal(t.usage.created,1);assert.equal(t.usage.terminated,1);
}));
test('direct held genuine result abort cannot be masked and own remove overrides cannot invent cleanup failure',()=>use(async(c,t)=>{
 const a=new AbortController(),ready=t.hold(),pending=c.prepareManufacturingInWorker('publication',request(),{signal:a.signal});await ready;let called=0;
 Object.defineProperty(a.signal,'aborted',{value:false});Object.defineProperty(a.signal,'removeEventListener',{value(){called++;throw '';}});a.abort();await assert.rejects(pending,{name:'AbortError'});t.release();await t.drain();assert.equal(called,0);assert.equal(getEventListeners(a.signal,'abort').length,0);
 await c.prepareManufacturingInWorker('publication',request());assert.equal(t.usage.created,2);assert.equal(t.usage.terminated,2);
}));
