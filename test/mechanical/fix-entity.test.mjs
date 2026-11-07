import assert from 'node:assert/strict';
import {test} from 'node:test';
import {AlgNumConstraint,ConstraintDefinitions} from '../../web/app/sketcher/constr/ANConstraints.ts';
import {ParametricManager} from '../../web/app/sketcher/parametric.ts';
import {Segment} from '../../web/app/sketcher/shapes/segment.ts';
import {Circle} from '../../web/app/sketcher/shapes/circle.js';
import {Arc} from '../../web/app/sketcher/shapes/arc.ts';
import {EndPoint} from '../../web/app/sketcher/shapes/point.ts';
import {fixEntity,inspectFixEntityTargets,fixEntityByIdAtRevision,releaseFixEntityInspection} from '../../web/app/sketcher/actions/fixEntityOperation.js';
import {fixedGeometry,fixedEntityValid,fixedLiteralConstants} from '../../web/app/sketcher/constr/fixedEntityDomain.mjs';
import {validateProjectSketch} from '../../web/app/sketcher/io.ts';

test('whole segment, circle and arc have distinct authored fix schemas',()=>{
 for(const id of ['FixSegment','FixCircle','FixArc'])assert.ok(ConstraintDefinitions[id],`missing ${id}`);
 assert.notEqual(ConstraintDefinitions.FixSegment,ConstraintDefinitions.LockPoint);
});
function fixture(shape){
 const history={diffs:[],historyPointer:-1,lastCheckpoint:'{"stable":true}',_counter:0,_checkpoint(){this.lastCheckpoint='{"stable":true}';},checkpoint(){this._checkpoint();}};
 const viewer={refresh(){},screenToModel2(x,y,p){p.x=x;p.y=y},annotationLayer:{add(){},remove(){}},historyManager:history,io:{serializeSketch:()=>'{"stable":true}'}};
 const pm=viewer.parametricManager=new ParametricManager(viewer),stage=pm.stage;stage.assignObject(shape);
 if(shape.TYPE==='Segment')stage.addConstraint(new AlgNumConstraint(ConstraintDefinitions.Polar,[shape,shape.a,shape.b],undefined,true));
 if(shape.TYPE==='Arc')stage.addConstraint(new AlgNumConstraint(ConstraintDefinitions.ArcConsistency,[shape],undefined,true));
 viewer.traverse=fn=>shape.traverse(fn);return {viewer,stage,pm,history};
}
test('segment fixation retains both ordered endpoints and derived direction/length',()=>{
 const s=new Segment(1,2,11,7,'segment'),{viewer,stage}=fixture(s),before=JSON.stringify(s.write());
 const result=fixEntity(viewer,s);assert.equal(result.status,'accepted');
 const c=stage.algNumSystem.allConstraints.find(c=>c.schema.id==='FixSegment');assert.ok(fixedEntityValid(c));
 const count=stage.algNumSystem.allConstraints.length;assert.equal(fixEntity(viewer,s).status,'redundant');assert.equal(stage.algNumSystem.allConstraints.length,count);
 s.a.x+=3;s.b.y-=4;stage.algNumSystem.solveFine();assert.equal(JSON.stringify(s.write()),before);assert.equal(fixedEntityValid(c),true);
});
test('circle fixation retains center and radius',()=>{
 const s=new Circle(2,3,5,'circle'),{viewer,stage}=fixture(s),before=JSON.stringify(s.write());fixEntity(viewer,s);
 s.c.x+=2;s.r.set(8);stage.algNumSystem.solveFine();assert.equal(JSON.stringify(s.write()),before);
 assert.equal(fixedEntityValid(stage.algNumSystem.allConstraints.find(c=>c.schema.id==='FixCircle')),true);
});
test('removing a fix leaves the entity editable',()=>{
 const s=new Circle(2,3,5,'circle'),{viewer,stage,pm}=fixture(s);fixEntity(viewer,s);
 const c=stage.algNumSystem.allConstraints.find(c=>c.schema.id==='FixCircle');pm.remove(c);
 assert.equal(stage.algNumSystem.projectedLastValid,null,'removing the last guarded relation must release its snapshot');
 while(stage.objects.size<=6000)stage.objects.add({visitParams(){}});
 s.c.x=9;s.r.set(7);stage.algNumSystem.solveFine();assert.equal(s.c.x,9);assert.equal(s.r.get(),7);
 assert.equal(stage.algNumSystem.solveStatus.success,true,'the directional budget no longer applies after removal');
});
test('failed removal preserves the fix and its rollback snapshot',()=>{
 const s=new Circle(2,3,5,'circle'),{viewer,stage}=fixture(s);fixEntity(viewer,s);
 const system=stage.algNumSystem,c=system.allConstraints.find(c=>c.schema.id==='FixCircle'),snapshot=system.projectedLastValid,original=system.invalidate;
 system.invalidate=()=>{throw Error('injected rebuild failure');};
 try{assert.throws(()=>system.removeConstraint(c),/injected/);assert.ok(system.allConstraints.includes(c));assert.equal(system.projectedLastValid,snapshot);}
 finally{system.invalidate=original;}
});
test('arc fixation retains ordered endpoints, center, radius and sweep',()=>{
 const s=new Arc(5,0,0,5,0,0,'arc'),{viewer,stage}=fixture(s),before=JSON.stringify(s.write()),expected=fixedGeometry(s).values;
 fixEntity(viewer,s);s.a.x+=2;s.c.y+=1;stage.algNumSystem.solveFine();assert.equal(JSON.stringify(s.write()),before);
 const c=stage.algNumSystem.allConstraints.find(c=>c.schema.id==='FixArc');assert.equal(fixedEntityValid(c),true);assert.equal(Number(c.constants.radius),5);assert.ok(Math.abs(Number(c.constants.sweep)-Math.PI/2)<1e-10);assert.deepEqual(fixedGeometry(s).values,expected);
});
test('fixed intent rejects expressions, invalid radii and inconsistent arcs',()=>{
 assert.equal(fixedLiteralConstants('FixCircle',{cx:'width',cy:'0',radius:'5'}),false);
 assert.equal(fixedLiteralConstants('FixCircle',{cx:'0',cy:'0',radius:'0'}),false);
 // Fixture setup installs a real ArcConsistency constraint and can repair its
 // initial geometry. Establish the intended invalid-at-fix precondition after it.
 const bad=new Arc(5,0,0,5,0,0,'bad'),{viewer}=fixture(bad);bad.b.y=9;
 assert.throws(()=>fixedGeometry(bad),/inconsistent/);const before=JSON.stringify(bad.write());
 assert.throws(()=>fixEntity(viewer,bad),/inconsistent/);assert.equal(JSON.stringify(bad.write()),before);
});
test('a genuinely repaired ArcConsistency result is valid before fixation accepts it',()=>{
 const repaired=new Arc(5,0,0,9,0,0,'repaired');assert.throws(()=>fixedGeometry(repaired),/inconsistent/);
 const {viewer,stage}=fixture(repaired);assert.doesNotThrow(()=>fixedGeometry(repaired));const before=JSON.stringify(repaired.write());
 fixEntity(viewer,repaired);assert.equal(JSON.stringify(repaired.write()),before);
 assert.equal(fixedEntityValid(stage.algNumSystem.allConstraints.find(c=>c.schema.id==='FixArc')),true);
});
test('native project preflight rejects altered or expression-bound fixed intent',()=>{
 const sketch={version:3,objects:[{id:'circle',type:'Circle',role:null,stage:0,data:{c:{x:2,y:3},r:5}}],dimensions:[],labels:[],constants:'',stages:[{generators:[],constraints:[{typeId:'FixCircle',objects:['circle'],constants:{cx:'2',cy:'3',radius:'5'},stage:0,annotations:[],admission:{version:1,state:'accepted'}}]}]};
 assert.doesNotThrow(()=>validateProjectSketch(sketch));
 const expression=structuredClone(sketch);expression.stages[0].constraints[0].constants.radius='width';
 assert.throws(()=>validateProjectSketch(expression),/fixed entity/);
 const mismatch=structuredClone(sketch);mismatch.stages[0].constraints[0].constants.radius='6';
 assert.throws(()=>validateProjectSketch(mismatch),/fixed entity/);
 const wrong=structuredClone(sketch);wrong.stages[0].constraints[0].typeId='FixSegment';
 assert.throws(()=>validateProjectSketch(wrong));
});
test('coincident arc endpoints retain the authored full-circle sweep',()=>{
 const arc=new Arc(5,0,5,0,0,0,'full'),{viewer,stage}=fixture(arc);
 fixEntity(viewer,arc);const c=stage.algNumSystem.allConstraints.find(c=>c.schema.id==='FixArc');
 assert.equal(Number(c.constants.sweep),2*Math.PI);assert.equal(fixedEntityValid(c),true);
});
test('contradictory existing point lock rejects fixation atomically',()=>{
 const s=new Segment(0,0,10,0,'segment'),{viewer,stage}=fixture(s);
 stage.addConstraint(new AlgNumConstraint(ConstraintDefinitions.LockPoint,[s.a],{x:'0',y:'0'}));
 s.a.x=3;s.syncGeometry();const before=JSON.stringify(s.write()),old=stage.algNumSystem.allConstraints.slice();
 assert.throws(()=>fixEntity(viewer,s),/conflict|invalidat|inconsistent/);
 assert.equal(JSON.stringify(s.write()),before);assert.deepEqual(stage.algNumSystem.allConstraints,old);
});
test('fix ID path rejects hidden polar ABA',async()=>{
 const s=new Segment(0,0,10,0,'segment'),{viewer}=fixture(s),view=await inspectFixEntityTargets(viewer);
 s.params.t.set(s.params.t.get()+1);s.params.t.set(s.params.t.get()-1);
 await assert.rejects(fixEntityByIdAtRevision(viewer,s.id,view.revision),/changed/);
 await assert.rejects(fixEntityByIdAtRevision(viewer,s.id,view.revision),/Inspect/);
 const next=await inspectFixEntityTargets(viewer);releaseFixEntityInspection(viewer,next.revision);
 await assert.rejects(fixEntityByIdAtRevision(viewer,s.id,next.revision),/Inspect/);
});
test('unsupported point is reported and refused without creating a partial fix',async()=>{
 const point=new EndPoint(1,2,'point'),{viewer,stage}=fixture(point),view=await inspectFixEntityTargets(viewer);
 assert.deepEqual(view.objects.find(o=>o.id===point.id),{id:'point',type:'Point',supported:false});
 await assert.rejects(fixEntityByIdAtRevision(viewer,point.id,view.revision),/segment, circle or arc/);
 assert.equal(stage.algNumSystem.allConstraints.length,0);
});
