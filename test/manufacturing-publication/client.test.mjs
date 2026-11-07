import test from 'node:test';
import assert from 'node:assert/strict';
import {transport} from './transport.mjs';
import {readManufacturingWorkerPreparation} from '../../web/app/cad/projectManager/documentMetadataPreparation.mjs';
import {emptyAuthoredEditJournal,recordPreparedManufacturingEdit,planPreparedManufacturingTravel,captureDocumentMetadataRecord} from '../../web/app/cad/craft/authoredEditJournal.mjs';
let instance=0;
const fresh=()=>import('../../web/app/cad/projectManager/manufacturingPublicationClient.mjs?fixture='+ ++instance);
const rev='sha256-'+'a'.repeat(64);
function request(){return{action:'enclosure',before:null,args:{geometryRevision:rev,featureId:7,history:[{type:'WORKER_ENCLOSURE_V1',params:{featureId:7}}],bodies:['BODY','LID'].map(outputRole=>({id:'worker-enclosure:1:'+JSON.stringify([7,outputRole]),featureId:7,originatingOperation:0,outputRole})),roles:Object.fromEntries(['BODY','LID'].map(role=>[role,{material:{id:role,name:role},appearance:null}]))}};}
async function use(fn){const t=transport(),previous=globalThis.Worker;globalThis.Worker=t.Adapter;try{await fn(await fresh(),t);}finally{await t.close();globalThis.Worker=previous;}}
test('actual Worker generation/noop/travel binds private clone without claiming cloned freeze',()=>use(async(c,t)=>{
 const input=request(),pending=c.prepareManufacturingInWorker('publication',input);input.args.roles.BODY.material.name='later caller mutation';const cap=await pending,p=readManufacturingWorkerPreparation(cap);
 assert.equal(Object.keys(cap).length,0);assert.equal(p.after.materials[0].name,'BODY');assert.equal(Object.isFrozen(p.after),false,'structured clone is not a deep-freeze proof');assert.ok(Object.isFrozen(p.entry));
 const j=recordPreparedManufacturingEdit(emptyAuthoredEditJournal(1,0),{document:1,revision:0,preparation:cap}),strict=captureDocumentMetadataRecord(j.entries[0]);assert.notEqual(strict,j.entries[0]);assert.ok(Object.isFrozen(strict.after.objects));const nextInput=request();nextInput.before=p.after;
 const noop=readManufacturingWorkerPreparation(await c.prepareManufacturingInWorker('publication',nextInput));assert.equal(noop.changed,false);assert.equal(noop.after,p.after);
 const a={action:'travel',before:p.after,args:{entry:j.entries[0],direction:'undo'}},job=c.prepareManufacturingInWorker('publication',a);a.args.direction='redo';const u=await job,plan=planPreparedManufacturingTravel(j,{document:1,revision:1,direction:'undo',current:p.after,preparation:u});assert.equal(plan.after,null);assert.equal(plan.next.cursor,0);assert.equal(t.usage.created,3);assert.equal(t.usage.terminated,3);
 assert.throws(()=>recordPreparedManufacturingEdit(j,{document:1,revision:1,preparation:{byteSize:1,trusted:true}}),{code:'INVALID_PREPARATION'});
}));
test('actual Worker semantic refusal remains healthy for retry',()=>use(async(c,t)=>{
 const bad=request();bad.args.roles.BODY.material.extra='not admitted';await assert.rejects(c.prepareManufacturingInWorker('publication',bad));
 const cap=await c.prepareManufacturingInWorker('publication',request());assert.equal(readManufacturingWorkerPreparation(cap).changed,true);assert.equal(t.usage.created,t.usage.terminated);
}));
test('genuine Worker result with corrupted small transport header refuses before capability',()=>use(async(c,t)=>{
 t.setReplyMap(data=>data.kind==='manufacturing-prepared'?{...data,id:data.id+1}:data);await assert.rejects(c.prepareManufacturingInWorker('publication',request()),{code:'INVALID_RESPONSE'});
 t.setReplyMap(null);await c.prepareManufacturingInWorker('publication',request());assert.equal(t.usage.created,t.usage.terminated);
}));
test('preabort has no allocation; held genuine result abort cleans and late release cannot succeed',()=>use(async(c,t)=>{
 const pre=new AbortController();pre.abort();await assert.rejects(c.prepareManufacturingInWorker('publication',request(),{signal:pre.signal}),{name:'AbortError'});assert.equal(t.usage.created,0);
 const ready=t.hold(),controller=new AbortController(),job=c.prepareManufacturingInWorker('publication',request(),{signal:controller.signal});await ready;controller.abort();await assert.rejects(job,{name:'AbortError'});t.release();await t.drain();
 await c.prepareManufacturingInWorker('publication',request());assert.equal(t.usage.created,2);assert.equal(t.usage.terminated,2);
}));
test('real four-owner bound refuses a fifth allocation and cancel permits healthy retry',()=>use(async(c,t)=>{
 const ready=t.hold(),controller=new AbortController(),jobs=Array.from({length:4},()=>c.prepareManufacturingInWorker('publication',request(),{signal:controller.signal}));await ready;
 await assert.rejects(c.prepareManufacturingInWorker('publication',request()),{code:'BUSY'});assert.equal(t.usage.created,4);controller.abort();const results=await Promise.allSettled(jobs);assert.ok(results.every(r=>r.status==='rejected'));t.release();await t.drain();
 await c.prepareManufacturingInWorker('publication',request());assert.equal(t.usage.created,5);assert.equal(t.usage.terminated,5);
}));
test('transport double: falsy operation failure settles, preserves cause and does not fence successful release',()=>use(async(c,t)=>{
 let terminated=0;globalThis.Worker=class extends EventTarget{postMessage(){throw false;}terminate(){terminated++;}};
 await assert.rejects(c.prepareManufacturingInWorker('publication',request()),error=>{assert.equal(error.cause,false);return true;});assert.equal(terminated,1);
 globalThis.Worker=t.Adapter;await c.prepareManufacturingInWorker('publication',request());
}));
test('transport doubles: falsy termination causes latch cleanup fence and refuse all subsequent allocation',async()=>{
 const previous=globalThis.Worker;
 try{for(const cause of [null,undefined,0,false,'']){
  const c=await fresh();let allocated=0,terminated=0;const operationError=Object.freeze({injected:'operation failure'});
  globalThis.Worker=class extends EventTarget{constructor(){super();allocated++;}postMessage(){throw operationError;}terminate(){terminated++;throw cause;}};
  let failure;await assert.rejects(c.prepareManufacturingInWorker('publication',request()),error=>{failure=error;assert.equal(error.code,'WORKER_CLEANUP_FAILED');assert.equal(error.cause,cause);assert.equal(error.operationError,operationError);assert.equal(error.operationFailed,true);return true;});
  await assert.rejects(c.prepareManufacturingInWorker('publication',request()),error=>error===failure);assert.equal(allocated,1);assert.equal(terminated,1);
 }}finally{globalThis.Worker=previous;}
});
test('transport double: throwing listener cleanup still terminates and settles before fencing',async()=>{
 const c=await fresh(),previous=globalThis.Worker;let terminated=0;
 globalThis.Worker=class extends EventTarget{postMessage(){throw 0;}get removeEventListener(){throw false;}terminate(){terminated++;}};
 try{await assert.rejects(c.prepareManufacturingInWorker('publication',request()),error=>{assert.equal(error.code,'WORKER_CLEANUP_FAILED');assert.equal(error.cause,false);assert.equal(error.operationError,0);return true;});assert.equal(terminated,1);}finally{globalThis.Worker=previous;}
});
