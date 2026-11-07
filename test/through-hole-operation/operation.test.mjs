// Actual adapter/ledger admission and lifecycle; doubled native transport/model.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,SolidDouble} from './fixture.mjs';
const reject=async(f,raw,code)=>{const n=f.calls.length;await assert.rejects(f.run(raw),{code});assert.equal(f.calls.length,n);assert.equal(f.objects.size,1);};

test('schema exposes exactly 12 required authored fields and two optional numeric offsets',async()=>{
 const f=await fixture();try{assert.equal(f.operation.id,'WORKER_THROUGH_HOLES_V1');const schema=f.operation.schema;assert.equal(Object.keys(schema).length,14);assert.deepEqual(Object.keys(schema).filter(k=>schema[k].optional).sort(),['offsetX','offsetY']);for(const key of ['offsetX','offsetY'])assert.equal(schema[key].type,'number');}finally{f.close();}
});
test('center/corners route exact raw intent, retain source handle, and publish one measured model',async()=>{
 const f=await fixture();try{
  const base=f.base.model,first=await f.run(undefined,{materialized:{diameter:999,offsetX:999}});assert(first.created[0] instanceof SolidDouble);assert.equal(first.consumed.length,1);assert.equal(first.consumed[0],base);assert.equal(first.created.length,1);f.publish(first);f.owner.requireCurrent();
  const next=await f.run(f.steps[2].intent,{step:f.steps[2]});assert.equal(next.consumed.length,1);assert.equal(next.consumed[0],first.created[0]);f.publish(next);f.owner.requireCurrent();
  const calls=f.calls.filter(c=>c.request.op==='solid.holes.through').map(c=>c.request);assert.equal(calls.length,2);assert.equal(calls[0].sourceHandle,calls[1].sourceHandle);assert.notEqual(calls[1].handle,calls[1].sourceHandle);
  for(let i=0;i<2;i++){const {op,handle,sourceHandle,...raw}=calls[i];assert.deepEqual(raw,f.steps[i+1].intent);assert.equal(Object.keys(raw).length,i===0?12:14);assert.equal(f.inspect(i===0?first.created[0]:next.created[0]).plan.sourceContexts.length,1);}
  assert.equal(f.factoryCalls,1);assert.equal(f.objects.size,1);assert(f.calls.every(c=>c.signal===f.owner.signal));assert(!JSON.stringify(next.created).includes('recordedTransportId'));
 }finally{f.close();}assert.equal(f.closes,1);assert.equal(f.pool.usage.mounts,0);
});
test('invalid extra fields, wrong types and undefined corner offsets refuse before dispatch',async()=>{
 const f=await fixture();try{
  for(const patch of [{handle:{}},{sourceHandle:{}},{depth:20},{diameter:'10'},{diameter:0},{offsetX:undefined,offsetY:undefined},{sourceFeatureId:20}])await reject(f,{...f.steps[1].intent,...patch},'INVALID_REQUEST');
  const corner={...f.steps[2].intent};delete corner.offsetY;await reject(f,corner,'INVALID_REQUEST');assert.equal(f.owner.state,'candidate');
 }finally{f.close();}
});
test('raw capture rejects accessors without invoking them; materialized values cannot replace raw',async()=>{
 const f=await fixture();try{let reads=0;const raw={...f.steps[1].intent};Object.defineProperty(raw,'diameter',{enumerable:true,get(){reads++;return 10;}});await reject(f,raw,'INVALID_REQUEST');assert.equal(reads,0);await assert.rejects(f.operation.run(f.steps[1].intent,f.ctx,undefined),{code:'INVALID_REQUEST'});assert.equal(f.calls.length,0);}finally{f.close();}
});
test('initial independent-plane predicate rejects matching plain objects and stale ownership',async()=>{
 for(const mutate of [f=>{f.face.root={face:f.face};},f=>{f.plane.face={...f.face};},f=>{f.face.defaultSketchId='other';},f=>{f.face.surface.simpleSurface.isPlane=false;},f=>{f.faces.delete(f.face.id);}]){
  const f=await fixture();try{mutate(f);await reject(f,f.steps[1].intent,'STALE_SOURCE');}finally{f.close();}
 }
});
test('wrong source origin/face/region and wrong producer refuse without consuming candidate input',async()=>{
 const f=await fixture();try{
  for(const [patch,code] of [[{sourceFeatureId:99},'STALE_SOURCE'],[{sourceFaceId:'other'},'STALE_SOURCE'],[{sourceRegionId:'other'},'STALE_SOURCE'],[{producerFeatureId:99,target:'worker-solid:1:[99,"body"]'},'INVALID_OPERAND']])await reject(f,{...f.steps[1].intent,...patch},code);
  const first=await f.run();f.publish(first);const n=f.calls.length;await assert.rejects(f.run({...f.steps[1].intent,featureId:90}),{code:'INVALID_OPERAND'});assert.equal(f.calls.length,n);assert.equal(f.objects.size,1);
 }finally{f.close();}
});
test('all await phases honor document cancellation and close mount exactly once',async()=>{
 for(const phase of ['result','selection','mesh']){
  const f=await fixture();try{const gate=f.hold(phase),pending=f.run();await gate.reached;f.doc.abort();gate.release();await assert.rejects(pending,{name:'AbortError'});assert.equal(f.objects.get(f.base.outputId),f.base.model);assert.equal(f.owner.state,'closed');assert.equal(f.pool.usage.mounts,0);assert.equal(f.closes,1);}finally{f.close();}assert.equal(f.closes,1);
 }
});
test('pending result rechecks services, storage, history, expressions, owner and plane identity',async()=>{
 const mutations=[f=>{f.ctx.projectService={...f.ctx.projectService};},f=>{f.ctx.projectService.documentGeneration=2;f.ctx.projectService.isDocumentCurrent=()=>false;},f=>{f.ctx.projectService.hasHostLifetime=false;},f=>{f.ctx.storageService.revision++;},f=>{f.ctx.craftService.evaluationEpoch++;},f=>{f.ctx.craftService.modifications$.value={history:[]};},f=>{f.ctx.expressionService.script$.revision++;},f=>{f.ctx.expressionService.errors$.value=['error'];},f=>{f.ctx.projectManager.unit='inch';},f=>{f.ctx.engineEvaluation={};},f=>{f.faces.set(f.face.id,{});},f=>{f.face.root={};},f=>{f.plane.face={};}];
 for(const mutate of mutations){const f=await fixture();try{const gate=f.hold('result'),pending=f.run();await gate.reached;mutate(f);gate.release();await assert.rejects(pending);assert.equal(f.objects.get(f.base.outputId),f.base.model);assert.equal(f.owner.state,'closed');assert.equal(f.closes,1);}finally{f.close();}}
});
test('registered owner publication checks remain live after operation return',async()=>{
 for(const mutate of [f=>{f.ctx.storageService.revision++;},f=>{f.ctx.engineEvaluation={};},f=>{f.face.defaultSketchId='changed';}]){const f=await fixture();try{const result=await f.run();f.publish(result);f.owner.requireCurrent();mutate(f);assert.throws(()=>f.owner.requireCurrent());}finally{f.close();}}
});
test('projection placement changes invalidate registered publication',async()=>{
 const f=await fixture();try{const result=await f.run();result.created[0].location$.value.tx=1;assert.throws(()=>f.owner.requireCurrent(),{code:'ENGINE_FAILURE'});}finally{f.close();}
});
test('unavailable selection remains explicit and cannot authorize a later dependent hole',async()=>{
 const f=await fixture({selectionTransform:(s,step)=>step.kind==='through-hole'?{status:'unavailable',reason:'BOOLEAN_HISTORY_UNSUPPORTED'}:s});try{const first=await f.run();f.publish(first);assert.deepEqual(f.inspect(first.created[0]),{status:'unavailable',reason:'BOOLEAN_HISTORY_UNSUPPORTED'});assert(Object.isFrozen(f.inspect(first.created[0])));const n=f.calls.length;await assert.rejects(f.run(f.steps[2].intent,{step:f.steps[2]}),{code:'UNRESOLVED_SELECTION'});assert.equal(f.calls.length,n);assert.equal(f.owner.state,'candidate');}finally{f.close();}
});
test('invented tool origin cannot publish as an authored sketch context',async()=>{
 const f=await fixture({selectionTransform:(s,step)=>{if(step.kind==='through-hole')s.plan.sourceContexts.push({kind:'sketch-profile',featureId:99,regionId:'derived-tool'});return s;}});try{await assert.rejects(f.run(),{code:'ENGINE_FAILURE'});assert.equal(f.objects.get(f.base.outputId),f.base.model);assert.equal(f.owner.state,'closed');assert.equal(f.closes,1);}finally{f.close();}
});
test('unmeasured or invalid native result cannot become a hole projection',async()=>{
 for(const value of [null,0]){const f=await fixture({meshTransform:(mesh,step)=>{if(step.kind==='through-hole')mesh.evidence.nativeVolume=value;return mesh;}});try{await assert.rejects(f.run());assert.equal(f.objects.get(f.base.outputId),f.base.model);assert.equal(f.owner.state,'closed');}finally{f.close();}}
});
