// Transient planner and binding controls only. No native allocation or success.
import test from 'node:test';
import assert from 'node:assert/strict';
import {captureOwnedSweepIntent,bindOwnedSweepIntent} from '../../modules/engine/solid/ownedSweepIntent.mjs';
import {prepareOwnedSweep} from '../../modules/engine/mount/ownedSweepPlan.mjs';
const frame=()=>({origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]});
function fixture(){return{op:'solid.profile.sweep',version:1,unit:'millimeter',source:{faceId:'section',sourceSha256:'a'.repeat(64)},frame:frame(),region:{id:'sketch-region:opaque',outer:[{kind:'circle',id:'outer',center:[0,0],radius:2}],holes:[]},path:{source:{faceId:'spine',sourceSha256:'b'.repeat(64)},frame:{origin:[0,0,0],x:[1,0,0],y:[0,0,1],z:[0,-1,0]},curves:[{kind:'segment',id:'line',a:[0,0],b:[0,10],reversed:false}]},transport:'corrected-frenet'};}
test('depth-free profile and separate source-frame path retain their exact authored placement',async()=>{
 const input=fixture(),p=await prepareOwnedSweep(input);
 assert.equal(p.nativeValues[0],1);assert.deepEqual(p.nativeValues.slice(1,13),[...input.frame.origin,...input.frame.x,...input.frame.y,...input.frame.z]);
 assert.deepEqual(p.nativePathValues,[1,0,0,0,0,1,0,0,0,0,1,0,-1,0,1,0,0,0,0,10,0]);
 assert.equal(p.binding.source.faceId,'section');assert.equal(p.binding.pathSource.faceId,'spine');
 assert.deepEqual(p.binding.pathCurves,[{curveId:'line',reversed:false}]);
 assert(!Object.hasOwn(p.request,'depth'));assert(!Object.hasOwn(p,'expected'));
});
test('Arc source endpoints/center/direction reach native payload without a minor-arc conversion',async()=>{
 const r=fixture();r.path.curves=[{kind:'arc',id:'arc',a:[10,0],b:[0,10],c:[0,0],reversed:true}];
 const p=await prepareOwnedSweep(r);assert.deepEqual(p.nativePathValues.slice(15),[1,10,0,0,10,0,0,1]);
 assert.deepEqual(p.binding.pathCurves,[{curveId:'arc',reversed:true}]);
});
test('request hash binds both sources, source frames, directed path and transport',async()=>{
 const original=fixture(),baseline=(await bindOwnedSweepIntent(original)).requestSha256;
 for(const change of [r=>r.source.faceId='other',r=>r.path.source.sourceSha256='c'.repeat(64),r=>r.path.frame.origin[0]=1,r=>r.path.curves[0].reversed=true,r=>r.path.curves[0].b[1]=11]){
  const r=fixture();change(r);assert.notEqual((await bindOwnedSweepIntent(r)).requestSha256,baseline);
 }
});
test('transient request detaches before asynchronous binding and refuses implicit directions',async()=>{
 const r=fixture(),promise=prepareOwnedSweep(r);r.path.curves[0].b[1]=100;r.source.faceId='changed';const p=await promise;
 assert.equal(p.request.path.curves[0].b[1],10);assert.equal(p.binding.source.faceId,'section');
 const a=fixture();delete a.path.curves[0].reversed;assert.throws(()=>captureOwnedSweepIntent(a),{code:'INVALID_REQUEST'});
 const b=fixture();b.path.curves.push({...b.path.curves[0]});assert.throws(()=>captureOwnedSweepIntent(b),{code:'INVALID_REQUEST'});
});
test('malformed or full-circle path inputs refuse without claiming native geometry validity',async()=>{
 const a=fixture();a.path.frame.z=[0,1,0];await assert.rejects(prepareOwnedSweep(a),{code:'INVALID_FRAME'});
 const b=fixture();b.path.curves=[{kind:'arc',id:'a',a:[1,0],b:[1,0],c:[0,0],reversed:false}];await assert.rejects(prepareOwnedSweep(b),{code:'SWEEP_UNSUPPORTED_PATH'});
 const c=fixture();c.transport='automatic';assert.throws(()=>captureOwnedSweepIntent(c),{code:'INVALID_REQUEST'});
 const d=fixture();let reads=0;Object.defineProperty(d.path.curves[0],'kind',{enumerable:true,get(){reads++;return'segment';}});assert.throws(()=>captureOwnedSweepIntent(d),{code:'INVALID_REQUEST'});assert.equal(reads,0);
});
