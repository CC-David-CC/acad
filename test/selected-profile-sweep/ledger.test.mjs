// Admission-only controls. Never fabricate a successful native result/model.
import test from 'node:test';import assert from 'node:assert/strict';
import {evaluateWorkerSolid} from '../../modules/engine/solid/solidLedger.mjs';
import {prepareSolvedSweep} from '../../modules/engine/extrusion/selectedSketchSweep.mjs';
import {sweepSourceFixture} from './source-fixture.mjs';
const prepared=await prepareSolvedSweep(await sweepSourceFixture());
const binding=()=>({featureId:4,faceId:'section',regionId:prepared.request.region.id,pathFaceId:'spine',pathCurves:[{curveId:'line',reversed:false}]});
function fixture(){
 const counts={mounts:0,executions:0,closed:0},faces={section:{},spine:{}};
 const owner={state:'candidate',signal:new AbortController().signal,requireCurrent(){},getOrCreateMount(_key,create){return create();},close(){counts.closed++;}};
 return{counts,faces,input:{owner,kind:'sweep',request:{version:1,unit:'millimeter',engine:'occ',engineRevision:'sha256:'+'a'.repeat(64)+':'+'b'.repeat(64),featureId:4,sweep:prepared.request},sourceBinding:binding(),registry:{find(){return null;},findFace(id){return faces[id]||null;}},createMount(){counts.mounts++;throw Error('Must refuse before allocation');},validateMount(){},createModel(){throw Error('No synthetic native model');},valid:()=>true}};
}
for(const [label,patch] of [['missing',()=>undefined],['feature',()=>({...binding(),featureId:5})],['profile',()=>({...binding(),faceId:'other'})],['region',()=>({...binding(),regionId:'other'})],['path face',()=>({...binding(),pathFaceId:'other'})],['path identity',()=>({...binding(),pathCurves:[{curveId:'other',reversed:false}]})],['path direction',()=>({...binding(),pathCurves:[{curveId:'line',reversed:true}]})]])test('sweep refuses stale '+label+' before native allocation',async()=>{
 const f=fixture();f.input.sourceBinding=patch();await assert.rejects(evaluateWorkerSolid(f.input),{code:'STALE_SOURCE'});assert.equal(f.counts.mounts,0);assert.equal(f.counts.closed,0);
});
test('removed path face refuses even with matching authored identity',async()=>{const f=fixture();delete f.faces.spine;await assert.rejects(evaluateWorkerSolid(f.input),{code:'STALE_SOURCE'});assert.equal(f.counts.mounts,0);});
test('path accessor refuses without executing code',async()=>{const f=fixture();let calls=0;Object.defineProperty(f.input.sourceBinding.pathCurves[0],'reversed',{enumerable:true,get(){calls++;return false;}});await assert.rejects(evaluateWorkerSolid(f.input),{code:'INVALID_REQUEST'});assert.equal(calls,0);assert.equal(f.counts.mounts,0);});
test('mount without explicit sweep capability refuses before dispatch and closes candidate',async()=>{
 const f=fixture();f.input.createMount=()=>{f.counts.mounts++;return{descriptor:{operations:[{id:'solid.profile.revolve',version:1}]},execute(){f.counts.executions++;throw Error('No dispatch expected');}};};
 await assert.rejects(evaluateWorkerSolid(f.input),{code:'ENGINE_CAPABILITY_UNAVAILABLE'});assert.equal(f.counts.mounts,1);assert.equal(f.counts.executions,0);assert.equal(f.counts.closed,1);
});
