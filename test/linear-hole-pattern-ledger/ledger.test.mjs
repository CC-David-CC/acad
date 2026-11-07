// Recorded genuine geometry, doubled transport/projection; not native execution.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,revision} from '../through-hole-ledger/fixture.mjs';
import {inspectWorkerSolidPatternSeeds} from '../../modules/engine/solid/solidLedger.mjs';
import {solidBodyId} from '../../modules/engine/solid/solidIntent.mjs';
import {selectedProfileHistoryBudget} from '../../modules/engine/mount/selectedProfileBudget.mjs';
import {genericHistoryBuild} from '../../modules/engine/mount/selectedProfileBuildSelection.mjs';
const intent=(patch={})=>({version:1,unit:'millimeter',engine:'occ',engineRevision:revision,featureId:50,target:solidBodyId(41),producerFeatureId:41,seedFeatureId:20,axis:'source-local-x-positive',count:3,spacing:20,...patch});
async function build(f){for(const step of f.steps)await f.apply(step);return f.outputs.at(-1).model;}
test('unknown or non-centered seeds and count1 refuse before dispatch',async()=>{
 for(const [patch,code] of [[{seedFeatureId:99},'UNSUPPORTED_SEED'],[{seedFeatureId:21},'UNSUPPORTED_SEED'],[{count:1},'UNSUPPORTED_IDENTITY_OPERATION']]){
  const f=fixture();try{await build(f);const n=f.calls.length;await assert.rejects(f.run('linear-hole-pattern',intent(patch)),{code});assert.equal(f.calls.length,n);assert.equal(f.objects.size,1);}finally{f.owner.close();}
 }
});
test('pattern source and target custody remain current',async()=>{
 for(const source of [true,false]){const f=fixture();try{const model=await build(f);if(source)f.faces.set(f.face.id,{});else f.objects.set(model.id,{});const n=f.calls.length;await assert.rejects(f.run('linear-hole-pattern',intent()),{code:source?'STALE_SOURCE':'INVALID_OPERAND'});assert.equal(f.calls.length,n);}finally{f.owner.close();}}
});
test('old mounts cannot silently evaluate a newly registered pattern',async()=>{
 const f=fixture();try{await build(f);const n=f.calls.length;await assert.rejects(f.run('linear-hole-pattern',intent()),{code:'ENGINE_CAPABILITY_UNAVAILABLE'});assert.equal(f.calls.length,n);assert.equal(f.owner.state,'closed');assert.equal(f.objects.size,1);}finally{f.owner.close();}
});
test('whole-part budget includes every transient pattern result and preserves build identity',()=>{
 const f=fixture();try{
  const history=f.steps.map(s=>({type:s.kind==='profile'?'WORKER_SELECTED_PROFILE_EXTRUDE_V2':s.kind==='through-hole'?'WORKER_THROUGH_HOLES_V1':'WORKER_SOLID_EDGE_TREATMENT_V1',params:s.kind==='profile'?{...s.intent,faceId:f.face.id,regionId:f.steps[0].intent.profile.region.id}:s.intent}));
  const before=selectedProfileHistoryBudget(history,revision),next=[...history,{type:'WORKER_LINEAR_HOLE_PATTERN_V1',params:intent()}];
  assert.equal(selectedProfileHistoryBudget(next,revision).plannedNativeResults,before.plannedNativeResults+4);assert.equal(genericHistoryBuild(history),genericHistoryBuild(next));
  const exhausted=[...history,{type:'WORKER_LINEAR_HOLE_PATTERN_V1',params:intent({count:17})}];assert.equal(selectedProfileHistoryBudget(exhausted,revision).withinLimit,false);
  let reads=0;const p=intent();Object.defineProperty(p,'count',{enumerable:true,get(){reads++;return 3;}});assert.throws(()=>selectedProfileHistoryBudget([...history,{type:'WORKER_LINEAR_HOLE_PATTERN_V1',params:p}],revision));assert.equal(reads,0);
 }finally{f.owner.close();}
});
test('centered seed witnesses survive corner cuts and treatments as immutable data only',async()=>{
 const f=fixture();try{
  for(const step of f.steps){const out=await f.apply(step),s=inspectWorkerSolidPatternSeeds(out.model);assert.equal(s.status,'available');assert.equal(s.sourceFeatureId,10);assert.equal(s.sourceFaceId,f.face.id);assert(Object.isFrozen(s));assert(Object.isFrozen(s.seeds));assert.deepEqual(s.seeds,step.kind==='profile'?[]:[{seedFeatureId:20,kind:'centered-through'}]);assert(!JSON.stringify(s).includes('recordedTransportId'));}
 }finally{f.owner.close();}
});
