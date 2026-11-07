// Offline source membership controls, not solved-sketch or solid evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {captureSolvedSweepPath} from '../../modules/engine/extrusion/selectedSketchSweepPath.mjs';
const frame=()=>({origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]}),p=(x,y)=>({x,y});
function fixture(){
 const input={unit:'millimeter',revision:'current',sketchDigest:'',faceId:'path',frame:frame(),sketchJSON:'',pathCurves:[{curveId:'line',reversed:false},{curveId:'arc',reversed:false}]};
 const sketch={version:3,objects:[{id:'line',type:'Segment',role:null,stage:0,data:{a:p(0,0),b:p(10,0)}},{id:'arc',type:'Arc',role:null,stage:0,data:{a:p(10,0),b:p(15,5),c:p(10,5)}}],stages:[{constraints:[],generators:[]}],metadata:{boundaryFrame:frame()}};
 return {input,sketch};
}
function seal({input,sketch}){input.sketchJSON=JSON.stringify(sketch);input.sketchDigest=createHash('sha256').update(input.sketchJSON).digest('hex');return input;}
test('actual arc source remains intact; reverse never selects its minor complement',async()=>{
 const f=fixture();f.input.pathCurves=[{curveId:'arc',reversed:true},{curveId:'line',reversed:true}];
 const result=await captureSolvedSweepPath(seal(f));assert.deepEqual(result.objects[0].data,f.sketch.objects[1].data);
 assert.equal(result.binding.pathCurves[0].reversed,true);assert(Object.isFrozen(result.objects[0].data.a));
 assert.equal(result.qualification,'source-membership-only; arc interpretation, transport and native result require separate evaluation');
});
test('frame and path references detach before digest suspension',async()=>{
 const f=fixture(),input=seal(f),pending=captureSolvedSweepPath(input);input.frame.origin[0]=100;input.pathCurves[0].reversed=true;input.pathCurves.reverse();
 const result=await pending;assert.equal(result.frame.origin[0],0);assert.equal(result.binding.pathCurves[0].curveId,'line');assert.equal(result.binding.pathCurves[0].reversed,false);
});
test('wrong digest, stale frame and absent selected identity refuse',async()=>{
 const a=seal(fixture());a.sketchDigest='0'.repeat(64);await assert.rejects(captureSolvedSweepPath(a),{code:'STALE_SKETCH'});
 const b=seal(fixture());b.frame.origin[0]=1;await assert.rejects(captureSolvedSweepPath(b),{code:'STALE_FRAME'});
 const c=seal(fixture());c.pathCurves[0].curveId='missing';await assert.rejects(captureSolvedSweepPath(c),{code:'STALE_PATH'});
});
test('disconnected and near-connected endpoints are never welded',async()=>{
 for(const delta of [1,1e-9]){const f=fixture();f.sketch.objects[1].data.a.x+=delta;await assert.rejects(captureSolvedSweepPath(seal(f)),{code:'SWEEP_DISCONNECTED_PATH'});}
});
test('zero Segment, collapsed Arc and full-circle Arc remain distinct refusals',async()=>{
 const a=fixture();a.sketch.objects[0].data.b=p(0,0);await assert.rejects(captureSolvedSweepPath(seal(a)),{code:'SWEEP_INVALID_PATH'});
 const b=fixture();b.sketch.objects[1].data.c=p(10,0);await assert.rejects(captureSolvedSweepPath(seal(b)),{code:'SWEEP_INVALID_PATH'});
 for(const delta of [0,0.5e-6]){const c=fixture();c.sketch.objects[1].data.b=p(10+delta,0);await assert.rejects(captureSolvedSweepPath(seal(c)),{code:'SWEEP_UNSUPPORTED_PATH'});}
});
test('duplicate identities, unsupported stages and generators refuse',async()=>{
 const a=fixture();a.sketch.objects.push({...a.sketch.objects[0]});await assert.rejects(captureSolvedSweepPath(seal(a)),{code:'INVALID_SKETCH'});
 const b=fixture();b.sketch.objects[0].stage=1;await assert.rejects(captureSolvedSweepPath(seal(b)),{code:'INVALID_SKETCH'});
 const c=fixture();c.sketch.stages[0].generators.push({typeId:'Mirror'});await assert.rejects(captureSolvedSweepPath(seal(c)),{code:'UNSUPPORTED_SKETCH'});
});
test('unselected geometry is not made part of the path',async()=>{
 const f=fixture();f.sketch.objects.push({id:'circle',type:'Circle',role:null,stage:0,data:{c:p(2,2),r:1}});assert.equal((await captureSolvedSweepPath(seal(f))).objects.length,2);
 f.input.pathCurves=[{curveId:'circle',reversed:false}];await assert.rejects(captureSolvedSweepPath(seal(f)),{code:'SWEEP_UNSUPPORTED_PATH'});
});
test('malformed frame and accessor input refuse without running getters',async()=>{
 let reads=0;const a=seal(fixture());Object.defineProperty(a,'sketchJSON',{enumerable:true,get(){reads++;return '{}';}});await assert.rejects(captureSolvedSweepPath(a),{code:'INVALID_REQUEST'});assert.equal(reads,0);
 const b=seal(fixture());b.frame.z=[0,0,-1];await assert.rejects(captureSolvedSweepPath(b),{code:'INVALID_FRAME'});
});
