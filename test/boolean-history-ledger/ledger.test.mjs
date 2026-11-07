// Ledger transport/projection tests over previously recorded genuine Chromium
// geometry. These do not run native code, a Worker, a browser or saved history.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,inputProof} from './fixture.mjs';
import {solidBodyId} from '../../modules/engine/solid/solidIntent.mjs';
const contextSummary=plan=>plan.sourceContexts.map(c=>[c.featureId,c.regionId]);
for(const index of [0,1])test(`recorded plate${index+1}: complete13-result chain preserves origins and infers both Boolean producers`,async()=>{
 const f=fixture(index);try{
  for(const step of f.steps){const before=f.objects.size,output=await f.apply(step),snapshot=f.inspect(output.model);
   assert.deepEqual(snapshot,step.observed.selection);assert(Object.isFrozen(snapshot));assert(Object.isFrozen(snapshot.plan.sourceContexts));assert(Object.isFrozen(snapshot.plan.edges));
   assert.equal(output.outputId,solidBodyId(step.intent.featureId));assert.equal(output.model.inspectKernelMetrics().nativeVolume,step.observed.result.evidence.nativeVolume);
   assert.equal(f.objects.size,before+1-output.consumed.length);
   assert.equal(output.consumed.length,step.kind==='profile'?0:step.kind==='boolean'?2:1);
   assert(!JSON.stringify(output.model).includes('recordedTransportId'));assert(!Object.hasOwn(output.model.ext.workerGeometry,'handle'));
  }
  assert.equal(f.factoryCalls,1);assert.equal(f.projections.length,13);assert.equal(f.meshReads.length,13);assert.equal(f.outputs.length,13);assert.equal(f.objects.size,1);
  const final=f.outputs.at(-1),plan=f.inspect(final.model).plan;assert.deepEqual(contextSummary(plan),[[10,'plate-region'],[20,'hole-region-0'],[21,'hole-region-1'],[22,'hole-region-2'],[23,'hole-region-3'],[24,'hole-region-4']]);
  assert.equal(plan.featureId,41);assert(!Object.hasOwn(plan,'regionId'));assert.equal(f.calls.filter(c=>c.op==='solid.selections.read').length,13);
  const bs=f.calls.filter(c=>c.op==='solid.boolean.subtract');assert.equal(bs.length,5);bs.forEach((c,i)=>{assert.equal(c.featureId,30+i);assert.equal(c.producerAFeatureId,i?29+i:10);assert.equal(c.producerBFeatureId,20+i);});
  const selected=f.calls.filter(c=>c.op==='solid.edge.treat');assert.deepEqual(selected.map(c=>[c.featureId,c.producerFeatureId]),[[40,34],[41,40]]);
  // Consumed outputs are not available for reuse through the current registry.
  const count=f.calls.length;await assert.rejects(f.run('boolean',{...f.steps[2].intent,featureId:90}),{code:'INVALID_OPERAND'});assert.equal(f.calls.length,count);
  f.outputs.forEach(o=>assert.doesNotThrow(o.publicationCheck));
 }finally{f.owner.close();}assert.equal(f.closes,1);
});
const badContexts={
 missing:p=>delete p.sourceContexts,
 empty:p=>p.sourceContexts=[],
 lostOrigin:p=>p.sourceContexts.pop(),
 foreignOrigin:p=>p.sourceContexts[0].featureId=999,
 changedRegion:p=>p.sourceContexts[0].regionId='wrong-region',
 duplicateOrigin:p=>p.sourceContexts[1]=structuredClone(p.sourceContexts[0]),
 wrongOrder:p=>p.sourceContexts.reverse(),
 legacyTopRegion:p=>p.regionId='invented-global-region',
 wrongPlanVersion:p=>p.version=1
};
for(const [name,change]of Object.entries(badContexts))test(`rejects ${name} result origins before mesh/projection/publication`,async()=>{
 const f=fixture(0,{selectionTransform:(s,step)=>{if(step.intent.featureId===30)change(s.plan);return s;}});try{
  await f.apply(f.steps[0]);await f.apply(f.steps[1]);const previous=[...f.objects.entries()],plans=previous.map(([,m])=>f.inspect(m)),projectionCount=f.projections.length,meshCount=f.meshReads.length;
  await assert.rejects(f.apply(f.steps[2]),{code:'ENGINE_FAILURE'});assert.equal(f.projections.length,projectionCount);assert.equal(f.meshReads.length,meshCount);assert.deepEqual([...f.objects.entries()],previous);assert.deepEqual(previous.map(([,m])=>f.inspect(m)),plans);assert.equal(f.outputs.length,2);assert.equal(f.owner.state,'closed');
 }finally{f.owner.close();}assert.equal(f.closes,1);
});
test('genuine geometry with explicit unavailable naming publishes while later edge request refuses before dispatch',async()=>{
 const f=fixture(0,{selectionTransform:(s,step)=>step.intent.featureId===30?{status:'unavailable',reason:'BOOLEAN_HISTORY_UNSUPPORTED'}:s});try{
  await f.apply(f.steps[0]);await f.apply(f.steps[1]);const output=await f.apply(f.steps[2]);assert.deepEqual(f.inspect(output.model),{status:'unavailable',reason:'BOOLEAN_HISTORY_UNSUPPORTED'});assert.equal(output.model.inspectKernelMetrics().nativeVolume,f.steps[2].observed.result.evidence.nativeVolume);assert.equal(f.projections.length,3);assert.equal(f.objects.size,1);
  const count=f.calls.length,intent={...f.steps.at(-2).intent,target:output.outputId,producerFeatureId:30};await assert.rejects(f.run('edge-treatment',intent),{code:'UNRESOLVED_SELECTION'});assert.equal(f.calls.length,count);assert.equal(f.objects.get(output.outputId),output.model);assert.doesNotThrow(output.publicationCheck);
 }finally{f.owner.close();}assert.equal(f.closes,1);
});
test('mutable parent featureId cannot change private Boolean producer bindings; restoration permits healthy continuation',async()=>{
 const f=fixture(0);try{
  const parent=await f.apply(f.steps[0]);await f.apply(f.steps[1]);const count=f.calls.length;parent.model.featureId=999;
  await assert.rejects(f.run('boolean',f.steps[2].intent),{code:'INVALID_OPERAND'});assert.equal(f.calls.length,count);assert.equal(f.projections.length,2);assert.equal(f.owner.state,'candidate');
  parent.model.featureId=10;const output=await f.apply(f.steps[2]);assert.equal(output.model.featureId,30);assert.equal(f.calls.find(c=>c.op==='solid.boolean.subtract').producerAFeatureId,10);
 }finally{f.owner.close();}assert.equal(f.closes,1);
});
test('recorded native evidence input binding is explicit and immutable',()=>{assert.equal(inputProof.componentSHA256,'dc2b5ab2c64a1b1e604a95bf43f9e29a006e84716e8e8a11bcd8dc3949e7935d');assert(Object.isFrozen(inputProof));});
