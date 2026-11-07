import test from 'node:test';import assert from 'node:assert/strict';import {fixture,api,recorded} from './fixture.mjs';
const state=f=>({history:f.ctx.craftService.modifications$.value,models:f.ctx.craftService.models$.value,epoch:f.ctx.craftService.evaluationEpoch,counters:{...f.project.counterGenerator.projectCounters},storage:f.storage.revision,metadata:f.manager.getManufacturingMetadata(),revision:f.manager.inspectDocumentRevision()});
async function use(fn,options){const f=await fixture(options);try{await fn(f);}finally{await f.close();}}
test('actual factory +PM Workers issue opaque one-shot after protocol read, preserving state and per-part region IDs',()=>use(async f=>{
 const before=state(f),token=await f.service.prepareWorkerManufacturingMeshes(f.request());assert.deepEqual(Object.keys(token),[]);assert.equal(f.calls.length,1);assert.deepEqual(state(f),before);const batch=api.consumeWorkerManufacturingMeshes(token);assert.equal(batch.parts.length,2);assert.equal(batch.parts[0].regions[0].id,batch.parts[1].regions[0].id);assert.equal(batch.artifacts.length,2);assert.equal(batch.isCurrent(),true);assert.equal(batch.manufacturingRevision,f.metadata.revision);assert.equal(batch.encodingRevision,f.metadata.revision.slice(7));assert.throws(()=>api.consumeWorkerManufacturingMeshes(token),{code:'INVALID_PREPARATION'});assert.equal(f.workers.geometry,0);
},{count:2}));
test('forged/stale/currentness-lost capabilities refuse without model publication',()=>use(async f=>{
 assert.throws(()=>api.consumeWorkerManufacturingMeshes({}),{code:'INVALID_PREPARATION'});const token=await f.service.prepareWorkerManufacturingMeshes(f.request());f.project.dispose();assert.throws(()=>api.consumeWorkerManufacturingMeshes(token));assert.throws(()=>api.consumeWorkerManufacturingMeshes(token),{code:'INVALID_PREPARATION'});
}));
test('stale revision, unsupported build, preabort native shadow refuse without read',()=>use(async f=>{
 await assert.rejects(f.service.prepareWorkerManufacturingMeshes({...f.request(),revision:'stale'}));await assert.rejects(f.service.prepareWorkerManufacturingMeshes({...f.request(),engineRevision:api.OCC_STEP_EXPORT_BUILD.revision}));const c=new AbortController();c.abort();Object.defineProperty(c.signal,'aborted',{value:false});await assert.rejects(f.service.prepareWorkerManufacturingMeshes(f.request(),{signal:c.signal}),{name:'AbortError'});assert.equal(f.calls.length,0);
}));
test('actual PM saved assignments cannot silently omit a new current output',()=>use(async f=>{
 f.ctx.craftService.inspectWorkerSolids=()=>({ready:true,revision:'PROTOCOL_GEOMETRY_TIP',outputs:[{outputId:f.models[0].id,featureId:1,engine:'occ',metrics:f.models[0].inspectKernelMetrics()},{outputId:'orphan-output',featureId:2,engine:'occ',metrics:f.models[0].inspectKernelMetrics()}]});await assert.rejects(f.service.prepareWorkerManufacturingMeshes(f.request()));assert.equal(f.calls.length,0);
}));
test('held protocol read cancellation/refusal never issues, preserving accepted state',()=>use(async f=>{
 const c=new AbortController(),before=state(f);f.release=()=>{};const job=f.service.prepareWorkerManufacturingMeshes(f.request(),{signal:c.signal});while(!f.calls.length)await new Promise(r=>setTimeout(r,5));c.abort();f.release();await assert.rejects(job);assert.deepEqual(state(f),before);
},{evaluate:async(input,f)=>{await new Promise(r=>f.release=r);input.requireCurrent();throw Error('NATIVE_NOT_RUN_PROTOCOL_FIXTURE');}}));
