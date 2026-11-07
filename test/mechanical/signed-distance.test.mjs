import assert from 'node:assert/strict';
import {test} from 'node:test';
import {AlgNumConstraint,ConstraintDefinitions} from '../../web/app/sketcher/constr/ANConstraints.ts';
import {ParametricManager} from '../../web/app/sketcher/parametric.ts';
import {AlgNumSubSystem} from '../../web/app/sketcher/constr/AlgNumSystem.ts';
import {EndPoint} from '../../web/app/sketcher/shapes/point.ts';
import {Segment} from '../../web/app/sketcher/shapes/segment.ts';
import {addSignedDistance,inspectSignedDistanceTargets,addSignedDistanceByIdsAtRevision} from '../../web/app/sketcher/actions/signedDistanceOperation.js';
import {projectedDirectionValid} from '../../web/app/sketcher/constr/projectedDistanceDomain.mjs';

test('signed axis and projected driving constraints are registered',()=>{
 for(const id of ['SignedDistanceX','SignedDistanceY','ProjectedDistance'])assert.ok(ConstraintDefinitions[id],`missing ${id}`);
});
function fixture(){
 const viewer={refresh(){},screenToModel2(x,y,p){p.x=x;p.y=y},annotationLayer:{add(){},remove(){}},historyManager:{diffs:[],historyPointer:-1,lastCheckpoint:'',_counter:0,_checkpoint(){this.lastCheckpoint=viewer.io.serializeSketch(undefined,{strict:true})}},io:{serializeSketch:()=>'{"stable":true}'}};
 const pm=viewer.parametricManager=new ParametricManager(viewer),stage=pm.stage;
 const a=new EndPoint(0,0,'a'),b=new EndPoint(3,4,'b'),direction=new Segment(0,0,10,0,'dir');
 for(const object of [a,b,direction])stage.assignObject(object);
 viewer.traverse=fn=>[a,b,direction].forEach(fn);
 return {viewer,pm,stage,a,b,direction};
}
test('signed X/Y equations drive positive, negative and zero displacement',()=>{
 const {viewer,a,b,stage}=fixture();
 stage.addConstraint(new AlgNumConstraint(ConstraintDefinitions.LockPoint,[a],{x:'0',y:'0'}));
 addSignedDistance(viewer,'x',[a,b],-7);addSignedDistance(viewer,'y',[a,b],0);
 assert.ok(Math.abs(b.x+7)<1e-7);assert.ok(Math.abs(b.y)<1e-7);
 const constraints=stage.algNumSystem.allConstraints.filter(c=>c.schema.id.startsWith('SignedDistance'));
 assert.equal(constraints.length,2);assert.equal(constraints[0].annotations[0].dimensionText(),'ΔX -7.00');
 assert.equal(constraints[1].annotations[0].dimensionText(),'ΔY 0.00');
});
test('projected residual uses actual endpoint direction even with negative polar t',()=>{
 const {a,b,direction}=fixture();direction.b.x=-10;direction.params.ang.set(0);direction.params.t.set(-10);
 assert.equal(projectedDirectionValid(direction),true);
 const c=new AlgNumConstraint(ConstraintDefinitions.ProjectedDistance,[a,b,direction],{distance:'-3'});c.resolveConstants(x=>x);
 const equations=[];c.collectPolynomials(equations);assert.ok(Math.abs(equations[0].value())<1e-10);
 direction.params.t.set(0);assert.equal(projectedDirectionValid(direction),false);
});
test('projected constraint drives a point in the selected segment direction',()=>{
 const {viewer,a,b,direction,stage}=fixture();
 const polar=new AlgNumConstraint(ConstraintDefinitions.Polar,[direction,direction.a,direction.b],undefined,true);
 stage.addConstraint(polar);
 for(const [point,x,y] of [[a,0,0],[direction.a,0,0],[direction.b,10,0]])stage.addConstraint(new AlgNumConstraint(ConstraintDefinitions.LockPoint,[point],{x:String(x),y:String(y)}));
 addSignedDistance(viewer,'projected',[a,b,direction],-5);
 assert.ok(Math.abs(b.x+5)<1e-6);assert.ok(projectedDirectionValid(direction));
});
test('projected solver preserves A-to-B sign on reversed endpoints and negative t',()=>{
 const {viewer,a,b,direction,stage}=fixture();direction.b.x=-10;direction.params.ang.set(0);direction.params.t.set(-10);
 stage.addConstraint(new AlgNumConstraint(ConstraintDefinitions.Polar,[direction,direction.a,direction.b],undefined,true));
 for(const [point,x,y] of [[a,0,0],[direction.a,0,0],[direction.b,-10,0]])stage.addConstraint(new AlgNumConstraint(ConstraintDefinitions.LockPoint,[point],{x:String(x),y:String(y)}));
 addSignedDistance(viewer,'projected',[a,b,direction],-5);
 assert.ok(Math.abs(b.x-5)<1e-6);assert.ok(projectedDirectionValid(direction));
});
test('degenerate projected-direction drag restores the last valid sketch state',()=>{
 const {viewer,a,b,direction,stage}=fixture();
 stage.addConstraint(new AlgNumConstraint(ConstraintDefinitions.Polar,[direction,direction.a,direction.b],undefined,true));
 addSignedDistance(viewer,'projected',[a,b,direction],3);
 stage.algNumSystem.solveFine();
 const before=[direction.a.x,direction.a.y,direction.b.x,direction.b.y,direction.params.ang.get(),direction.params.t.get(),a.x,a.y,b.x,b.y];
 direction.b.x=direction.a.x;direction.b.y=direction.a.y;direction.params.t.set(0);
 stage.algNumSystem.solveFine();
 assert.deepEqual([direction.a.x,direction.a.y,direction.b.x,direction.b.y,direction.params.ang.get(),direction.params.t.get(),a.x,a.y,b.x,b.y],before);
 assert.equal(stage.algNumSystem.solveStatus.success,false);assert.equal(stage.algNumSystem.solveStatus.domainError,'PROJECTED_DIRECTION_DOMAIN');
});
test('projected snapshot cost diagnostic on a 1000-segment stage',()=>{
 const {viewer,a,b,direction,stage}=fixture();
 stage.addConstraint(new AlgNumConstraint(ConstraintDefinitions.Polar,[direction,direction.a,direction.b],undefined,true));
 addSignedDistance(viewer,'projected',[a,b,direction],3);
 for(let i=0;i<1000;i++)stage.assignObject(new Segment(i,10,i+1,10,`extra-${i}`));
 const samples=[];
 for(let i=0;i<25;i++){const start=performance.now();stage.algNumSystem.rememberProjectedState();samples.push(performance.now()-start);}
 samples.sort((x,y)=>x-y);
 console.log('projected snapshot diagnostic: 1000 extra segments, 25 runs, median ms',samples[12].toFixed(3),'max ms',samples[24].toFixed(3));
 assert.ok(stage.algNumSystem.projectedLastValid.size>=4000);
});
test('projected interactive limit rejects before solve and retains last valid parameters',()=>{
 const {viewer,a,b,direction,stage}=fixture();
 stage.addConstraint(new AlgNumConstraint(ConstraintDefinitions.Polar,[direction,direction.a,direction.b],undefined,true));
 addSignedDistance(viewer,'projected',[a,b,direction],3);
 stage.algNumSystem.solveFine();const before=[a.x,a.y,b.x,b.y,direction.b.x,direction.b.y];
 while(stage.objects.size<6000)stage.objects.add({visitParams(){}});
 assert.doesNotThrow(()=>stage.algNumSystem.rememberProjectedState());
 const extra={visitParams(){}};stage.objects.add(extra);
 b.x+=1;stage.algNumSystem.solveFine();
 assert.equal(stage.algNumSystem.solveStatus.domainError,'PROJECTED_RESOURCE_LIMIT');
 assert.deepEqual([a.x,a.y,b.x,b.y,direction.b.x,direction.b.y],before);
 stage.objects.delete(extra);stage.algNumSystem.solveFine();assert.equal(stage.algNumSystem.solveStatus.success,true);
});
test('projected relation tracking stays correct on transaction rollback and removal',()=>{
 const {viewer,a,b,direction,stage}=fixture(),system=stage.algNumSystem;
 stage.addConstraint(new AlgNumConstraint(ConstraintDefinitions.Polar,[direction,direction.a,direction.b],undefined,true));
 addSignedDistance(viewer,'projected',[a,b,direction],3);
 assert.equal(system.projectedConstraintCount,1);
 const existing=system.allConstraints.find(c=>c.schema.id==='ProjectedDistance');
 system.startTransaction();system._removeConstraint(existing);system.rollbackTransaction();
 assert.equal(system.projectedConstraintCount,1);
 system.removeConstraint(existing);assert.equal(system.projectedConstraintCount,0);assert.deepEqual(system.projectedRelations(),[]);
});
test('projected snapshot accepts each exact budget and refuses one beyond it',()=>{
 const stage={objects:new Set()},system=new AlgNumSubSystem(()=>100,x=>x,stage);
 const params=Array.from({length:32769},()=>({get:()=>0}));let visits=32768;
 const object={visitParams(cb){for(let i=0;i<visits;i++)cb(params[i]);}};stage.objects.add(object);
 assert.equal(system.captureProjectedState().size,32768);visits=32769;
 assert.throws(()=>system.captureProjectedState(),/rollback limit/);
 let repetitions=65536;object.visitParams=cb=>{for(let i=0;i<repetitions;i++)cb(params[0]);};
 assert.equal(system.captureProjectedState().size,1);repetitions++;
 assert.throws(()=>system.captureProjectedState(),/rollback limit/);
 object.visitParams=()=>{};system.allConstraints=Array.from({length:6000},()=>({objects:[]}));
 assert.doesNotThrow(()=>system.captureProjectedState());system.allConstraints.push({objects:[]});
 assert.throws(()=>system.captureProjectedState(),/rollback limit/);
});
test('contradictory signed distance preserves accepted geometry and relations',()=>{
 const {viewer,a,b,stage}=fixture();
 stage.addConstraint(new AlgNumConstraint(ConstraintDefinitions.LockPoint,[a],{x:'0',y:'0'}));
 stage.addConstraint(new AlgNumConstraint(ConstraintDefinitions.LockPoint,[b],{x:'3',y:'4'}));
 const before=stage.algNumSystem.allConstraints.slice();
 assert.throws(()=>addSignedDistance(viewer,'x',[a,b],-7),/conflict/);
 assert.deepEqual(stage.algNumSystem.allConstraints,before);assert.equal(b.x,3);assert.equal(b.y,4);
});
test('revision-bound ID path preserves order, validates inputs and rejects stale references',async()=>{
 const {viewer,a,b}=fixture(),view=await inspectSignedDistanceTargets(viewer);
 assert.equal((await addSignedDistanceByIdsAtRevision(viewer,'x',[b.id,a.id],5,view.revision)).status,'accepted');
 assert.ok(Math.abs(a.x-b.x-5)<1e-7);
 const stale=await inspectSignedDistanceTargets(viewer);viewer.io.serializeSketch=()=>'{"changed":true}';
 await assert.rejects(addSignedDistanceByIdsAtRevision(viewer,'y',[a.id,b.id],1,stale.revision),/changed/);
});
test('a lifetime callback that changes the sketch cannot submit an old revision',async()=>{
 const {viewer,a,b,stage}=fixture();
 let text='before';viewer.io.serializeSketch=()=>text;
 const inspected=await inspectSignedDistanceTargets(viewer);
 await assert.rejects(addSignedDistanceByIdsAtRevision(viewer,'x',[a.id,b.id],2,inspected.revision,{valid:()=>{text='after';return true;}}),/changed/);
 assert.equal(stage.algNumSystem.allConstraints.length,0);
});
test('a reentrant constant resolver cannot commit an older inspected revision',async()=>{
 const {viewer,a,b,stage,pm}=fixture();let text='before';viewer.io.serializeSketch=()=>text;
 const inspected=await inspectSignedDistanceTargets(viewer);
 pm.constantResolver=value=>{text='changed during validation';return value;};
 await assert.rejects(addSignedDistanceByIdsAtRevision(viewer,'x',[a.id,b.id],2,inspected.revision),/changed/);
 assert.equal(stage.algNumSystem.allConstraints.length,0);
});
