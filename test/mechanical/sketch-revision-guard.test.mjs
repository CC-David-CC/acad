import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createSketchRevisionGuard} from '../../web/app/sketcher/actions/sketchRevisionGuard.js';
import {Param} from '../../web/app/sketcher/shapes/param.ts';
import {Segment} from '../../web/app/sketcher/shapes/segment.ts';
import {EndPoint} from '../../web/app/sketcher/shapes/point.ts';
import {BSpline,BSplineType,ParameterMethod} from '../../web/app/sketcher/shapes/b-spline.ts';
import {ParametricManager} from '../../web/app/sketcher/parametric.ts';
import {AlgNumConstraint,ConstraintDefinitions} from '../../web/app/sketcher/constr/ANConstraints.ts';
import {Layer} from '../../web/app/sketcher/viewer2d.ts';
import {IO} from '../../web/app/sketcher/io.ts';

function fixture(){let source='{"constants":{"a":"1"}}';return {
 viewer:{io:{serializeSketch:()=>source},parametricManager:{inTransaction:false}},
 set(value){source=value;},
};}
test('shared exact revision detects in-place authored changes and enforces ownership',()=>{
 const f=fixture(),guard=createSketchRevisionGuard(),other=createSketchRevisionGuard();
 const first=guard.capture(f.viewer);assert.doesNotThrow(()=>guard.verify(f.viewer,first));
 assert.throws(()=>other.verify(f.viewer,first),/Inspect/);
 f.set('{"constants":{"a":"2"}}');assert.throws(()=>guard.verify(f.viewer,first),/changed/);
 const next=guard.capture(f.viewer);guard.release(f.viewer,first);assert.doesNotThrow(()=>guard.verify(f.viewer,next));
 guard.release(f.viewer,next);assert.throws(()=>guard.verify(f.viewer,next),/Inspect/);
});
test('shared exact revision refuses busy and over-budget sketches',()=>{
 const f=fixture(),guard=createSketchRevisionGuard();f.viewer.parametricManager.inTransaction=true;
 assert.throws(()=>guard.capture(f.viewer),/not ready/);f.viewer.parametricManager.inTransaction=false;
 f.set('é'.repeat(524289));assert.throws(()=>guard.capture(f.viewer),/exceeds/);
});
test('a reentrant serialization cannot replace the entry being verified',()=>{
 const f=fixture(),guard=createSketchRevisionGuard(),revision=guard.capture(f.viewer);let reentered=false;
 f.viewer.io.serializeSketch=()=>{if(!reentered){reentered=true;guard.capture(f.viewer);}return '{"constants":{"a":"1"}}';};
 assert.throws(()=>guard.verify(f.viewer,revision),/changed/);
});
test('parameter ABA is stale even when serialized coordinates are restored',()=>{
 const f=fixture(),guard=createSketchRevisionGuard(),point=new Param(3);
 const revision=guard.capture(f.viewer);point.set(4);point.set(3);
 assert.throws(()=>guard.verify(f.viewer,revision),/changed/);
});
test('derived segment polar mutation invalidates even if authored bytes do not change',()=>{
 const f=fixture(),guard=createSketchRevisionGuard(),segment=new Segment(0,0,10,0,'s');
 const revision=guard.capture(f.viewer);segment.params.t.set(-10);
 assert.throws(()=>guard.verify(f.viewer,revision),/changed/);
});
test('setting a parameter to its existing value preserves the capture',()=>{
 const f=fixture(),guard=createSketchRevisionGuard(),point=new Param(3);
 const revision=guard.capture(f.viewer);point.set(3);
 assert.doesNotThrow(()=>guard.verify(f.viewer,revision));
});
test('role ABA invalidates the capture even if authored bytes are restored',()=>{
 const f=fixture(),guard=createSketchRevisionGuard(),segment=new Segment(0,0,1,0,'s');
 const revision=guard.capture(f.viewer);segment.role='construction';segment.role=null;
 assert.throws(()=>guard.verify(f.viewer,revision),/changed/);
});
test('constraint constant ABA invalidates the capture',()=>{
 const f=fixture(),guard=createSketchRevisionGuard(),segment=new Segment(0,0,1,0,'s');
 const c=new AlgNumConstraint(ConstraintDefinitions.SegmentLength,[segment],{length:'1'});
 const revision=guard.capture(f.viewer);c.updateConstant('length','2');c.updateConstant('length','1');
 assert.throws(()=>guard.verify(f.viewer,revision),/changed/);
});
test('sketch constant definition ABA invalidates the capture',()=>{
 const f=fixture(),guard=createSketchRevisionGuard(),viewer={refresh(){},screenToModel2(x,y,p){p.x=x;p.y=y;},historyManager:{_checkpoint(){}},annotationLayer:{add(){},remove(){}}};
 const pm=new ParametricManager(viewer);viewer.parametricManager=pm;
 const revision=guard.capture(f.viewer);pm.applyConstantDefinition('width = 2');pm.applyConstantDefinition('');
 assert.throws(()=>guard.verify(f.viewer,revision),/changed/);
});
test('stage membership ABA and reset invalidate the capture',()=>{
 const f=fixture(),guard=createSketchRevisionGuard(),viewer={refresh(){}},pm=new ParametricManager(viewer);
 const segment=new Segment(0,0,1,0,'s'),stage=pm.stage;let revision=guard.capture(f.viewer);
 stage.assignObject(segment);stage.unassignObject(segment);assert.throws(()=>guard.verify(f.viewer,revision),/changed/);
 revision=guard.capture(f.viewer);pm.reset();assert.throws(()=>guard.verify(f.viewer,revision),/changed/);
});
test('constraint membership ABA invalidates the capture',()=>{
 const f=fixture(),guard=createSketchRevisionGuard(),viewer={refresh(){},screenToModel2(x,y,p){p.x=x;p.y=y;},annotationLayer:{add(){},remove(){}}};
 const pm=new ParametricManager(viewer),segment=new Segment(0,0,1,0,'s');pm.stage.assignObject(segment);
 const relation=new AlgNumConstraint(ConstraintDefinitions.SegmentLength,[segment],{length:'1'});
 const revision=guard.capture(f.viewer);pm.stage.addConstraint(relation);pm.stage.algNumSystem.removeConstraint(relation);
 assert.throws(()=>guard.verify(f.viewer,revision),/changed/);
});
test('tracking a transaction is inert but rollback invalidates stale captures',()=>{
 const f=fixture(),guard=createSketchRevisionGuard(),viewer={refresh(){},screenToModel2(x,y,p){p.x=x;p.y=y;},annotationLayer:{add(){},remove(){}}};
 const pm=new ParametricManager(viewer),segment=new Segment(0,0,1,0,'s');pm.stage.assignObject(segment);
 pm.stage.addConstraint(new AlgNumConstraint(ConstraintDefinitions.SegmentLength,[segment],{length:'1'}));
 const revision=guard.capture(f.viewer),system=pm.stage.algNumSystem;system.startTransaction();
 assert.doesNotThrow(()=>guard.verify(f.viewer,revision));system.rollbackTransaction();assert.throws(()=>guard.verify(f.viewer,revision),/changed/);
});
test('layer membership ABA and IO cleanup invalidate the capture',()=>{
 const f=fixture(),guard=createSketchRevisionGuard(),viewer={refresh(){},objectsUpdate(){},deselectAll(){},parametricManager:{stage:{assignObject(o){o.stage=this;},unassignObject(o){o.stage=null;}},reset(){},notify(){}}};
 const layer=new Layer('test',null,viewer),segment=new Segment(0,0,1,0,'s');viewer.layers=[layer];viewer.dimLayer={objects:[]};viewer.labelLayer={objects:[]};viewer.annotationLayer={objects:[]};
 let revision=guard.capture(f.viewer);layer.add(segment);layer.remove(segment);assert.throws(()=>guard.verify(f.viewer,revision),/changed/);
 revision=guard.capture(f.viewer);new IO(viewer).cleanUpData();assert.throws(()=>guard.verify(f.viewer,revision),/changed/);
});
test('spline knot ABA invalidates while setting identical knots does not',()=>{
 const f=fixture(),guard=createSketchRevisionGuard();
 const points=[new EndPoint(0,0),new EndPoint(1,1),new EndPoint(2,1),new EndPoint(3,0)];
 const knots=[0,0,0,0,1,1,1,1];
 const curve=new BSpline({degree:3,cPoints:points,fPoints:[],kValues:knots,interpolation:false,CVModel:false,type:BSplineType.Clamped,method:ParameterMethod.QuasiUniform});
 let revision=guard.capture(f.viewer);curve.setKValues([...knots]);assert.doesNotThrow(()=>guard.verify(f.viewer,revision));
 revision=guard.capture(f.viewer);curve.setKValues([0,0,0,0,2,2,2,2]);curve.setKValues([...knots]);
 assert.throws(()=>guard.verify(f.viewer,revision),/changed/);
});
test('closed spline regeneration retains derived identities until geometry changes',()=>{
 const f=fixture(),guard=createSketchRevisionGuard();
 const points=[new EndPoint(0,0),new EndPoint(10,0),new EndPoint(10,10),new EndPoint(0,10)];
 const authoredConstraint=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[points[1]],{x:'10',y:'0'});
 const curve=new BSpline({degree:3,cPoints:points,fPoints:[],kValues:[0,0,0,0,1,1,1,1],interpolation:false,CVModel:true,type:BSplineType.Closed,method:ParameterMethod.QuasiUniform});
 curve.closedBasePoints=[...points];curve.cvUpdateClosed(ParameterMethod.QuasiUniform);
 const exposed=[];curve.traverse(object=>exposed.push(object.id));
 assert.ok(points.every(point=>exposed.includes(point.id)),'authored base points must remain addressable');
 assert.ok(curve.cPoints.every(point=>!exposed.includes(point.id)),'derived points are not public constraint targets');
 const before=JSON.stringify(curve.write()),revision=guard.capture(f.viewer);
 curve.cvUpdateClosed(ParameterMethod.QuasiUniform);
 assert.equal(JSON.stringify(curve.write()),before);
 assert.doesNotThrow(()=>guard.verify(f.viewer,revision));
 const reopened=BSpline.read('closed',JSON.parse(before));reopened.cvUpdateClosed(ParameterMethod.QuasiUniform);
 assert.equal(JSON.stringify(reopened.write()),before,'reopening and regenerating must preserve the saved derived points');
 const tampered=JSON.parse(before);tampered.cPoints[0].x+=1;
 const untrusted=BSpline.read('tampered',tampered);untrusted.cvUpdateClosed(ParameterMethod.QuasiUniform);
 assert.notDeepEqual(untrusted.cPoints.map(point=>point.id),tampered.cPoints.map(point=>point.id),'mismatching saved output must not be adopted');
 const ids=curve.cPoints.map(point=>point.id);points[1].x+=1;curve.cvUpdateClosed(ParameterMethod.QuasiUniform);
 assert.deepEqual(curve.cPoints.map(point=>point.id),ids);
 assert.throws(()=>guard.verify(f.viewer,revision),/changed/);
 const baseIds=points.map(point=>point.id);
 curve.closedBasePoints=[...points].reverse();curve.cvUpdateClosed(ParameterMethod.QuasiUniform);
 assert.notDeepEqual(curve.cPoints.map(point=>point.id),ids,'base reorder must not reuse output roles');
 assert.deepEqual(curve.closedBasePoints.map(point=>point.id),[...baseIds].reverse());
 assert.equal(authoredConstraint.objects[0],points[1],'authored base constraint retains its point identity');
 const reorderedIds=curve.cPoints.map(point=>point.id);
 const replacement=curve.closedBasePoints[0];curve.closedBasePoints[0]=new EndPoint(replacement.x,replacement.y,replacement.id);
 curve.cvUpdateClosed(ParameterMethod.QuasiUniform);
 assert.notDeepEqual(curve.cPoints.map(point=>point.id),reorderedIds,'base replacement must not reuse output roles');
 const replacedIds=curve.cPoints.map(point=>point.id);
 curve.closedBasePoints=[...curve.closedBasePoints,new EndPoint(3,4)];curve.cvUpdateClosed(ParameterMethod.QuasiUniform);
 assert.notDeepEqual(curve.cPoints.map(point=>point.id),replacedIds,'base count changes must not reuse output roles');
 const collisionIds=curve.cPoints.map(point=>point.id);curve.cPoints[1].id=curve.cPoints[0].id;
 curve.cvUpdateClosed(ParameterMethod.QuasiUniform);
 assert.notDeepEqual(curve.cPoints.map(point=>point.id),collisionIds,'duplicate derived IDs must not be rebound');
 assert.equal(new Set(curve.cPoints.map(point=>point.id)).size,curve.cPoints.length);
});
