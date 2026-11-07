import assert from 'node:assert/strict';
import {test} from 'node:test';
import {AlgNumConstraint,ConstraintDefinitions} from '../../web/app/sketcher/constr/ANConstraints.ts';
import {EndPoint} from '../../web/app/sketcher/shapes/point.ts';
import {Segment} from '../../web/app/sketcher/shapes/segment.ts';
import {ParametricManager} from '../../web/app/sketcher/parametric.ts';
import {addLineRelation,inspectLineRelationTargets,addLineRelationByIdsAtRevision} from '../../web/app/sketcher/actions/lineRelationOperation.js';

test('collinear and independent-axis symmetry are separate registered relations',()=>{
 assert.ok(ConstraintDefinitions.Collinear);assert.ok(ConstraintDefinitions.AxisSymmetry);
 assert.notEqual(ConstraintDefinitions.AxisSymmetry,ConstraintDefinitions.Symmetry);
});
test('axis symmetry uses a live infinite axis, not the midpoint relation',()=>{
 const a=new EndPoint(4,6,'a'),b=new EndPoint(4,-2,'b'),axis=new Segment(-5,2,7,2,'axis');
 const c=new AlgNumConstraint(ConstraintDefinitions.AxisSymmetry,[a,b,axis]);
 const equations=[];c.collectPolynomials(equations);
 assert.equal(equations.length,2);assert.ok(equations.every(e=>Math.abs(e.value())<1e-9));
});
test('collinearity is about infinite supporting lines, not segment overlap',()=>{
 const first=new Segment(0,0,2,0,'first'),second=new Segment(10,0,20,0,'second');
 const relation=new AlgNumConstraint(ConstraintDefinitions.Collinear,[first,second]),equations=[];relation.collectPolynomials(equations);
 assert.equal(equations.length,2);assert.ok(equations.every(eq=>Math.abs(eq.value())<1e-9));
});
function fixture(){
 const viewer={refresh(){},screenToModel2(x,y,p){p.x=x;p.y=y},annotationLayer:{add(){},remove(){}},historyManager:{diffs:[],historyPointer:-1,lastCheckpoint:'{"stable":true}',_counter:0,_checkpoint(){this.lastCheckpoint='{"stable":true}';}},io:{serializeSketch:()=>'{"stable":true}'}};
 const pm=viewer.parametricManager=new ParametricManager(viewer),stage=pm.stage;
 const line=new Segment(0,0,10,0,'line'),other=new Segment(2,3,8,5,'other'),p=new EndPoint(4,6,'p'),q=new EndPoint(6,-2,'q');
 for(const o of [line,other,p,q])stage.assignObject(o);
 for(const s of [line,other])stage.addConstraint(new AlgNumConstraint(ConstraintDefinitions.Polar,[s,s.a,s.b],undefined,true));
 viewer.traverse=fn=>[line,other,p,q].forEach(fn);return {viewer,stage,line,other,p,q};
}
function lock(stage,point){stage.addConstraint(new AlgNumConstraint(ConstraintDefinitions.LockPoint,[point],{x:String(point.x),y:String(point.y)}));}
test('collinear drives both endpoints onto the same infinite supporting line',()=>{
 const {viewer,stage,line,other}=fixture();lock(stage,line.a);lock(stage,line.b);
 const result=addLineRelation(viewer,'collinear',[line,other]);assert.equal(result.status,'accepted');
 assert.ok(Math.abs(other.a.y)<1e-6&&Math.abs(other.b.y)<1e-6);assert.ok(Math.hypot(other.b.x-other.a.x,other.b.y-other.a.y)>1e-9);
 const count=stage.algNumSystem.allConstraints.length;
 const duplicate=addLineRelation(viewer,'collinear',[other,line]);assert.equal(duplicate.status,'redundant');assert.equal(stage.algNumSystem.allConstraints.length,count);
});
test('axis symmetry drives the reflected point about an independent line',()=>{
 const {viewer,stage,line,p,q}=fixture();lock(stage,line.a);lock(stage,line.b);lock(stage,p);
 addLineRelation(viewer,'axis-symmetry',[p,q,line]);assert.ok(Math.abs(q.x-p.x)<1e-6);assert.ok(Math.abs(q.y+p.y)<1e-6);
});
test('axis reversal and negative internal polar length leave the unoriented symmetry line unchanged',()=>{
 const {viewer,stage,line,p,q}=fixture();line.b.x=-10;line.params.ang.set(0);line.params.t.set(-10);
 lock(stage,line.a);lock(stage,line.b);lock(stage,p);
 addLineRelation(viewer,'axis-symmetry',[p,q,line]);assert.ok(Math.abs(q.x-p.x)<1e-6);assert.ok(Math.abs(q.y+p.y)<1e-6);
});
test('tilted independent axis enforces both midpoint incidence and normal separation',()=>{
 const {viewer,stage,line,p,q}=fixture();line.b.x=10;line.b.y=10;line.params.ang.set(Math.PI/4);line.params.t.set(Math.sqrt(200));
 lock(stage,line.a);lock(stage,line.b);lock(stage,p);addLineRelation(viewer,'axis-symmetry',[p,q,line]);
 assert.ok(Math.abs(q.x-p.y)<1e-6&&Math.abs(q.y-p.x)<1e-6);
});
test('coincident points on the symmetry axis are valid',()=>{
 const {viewer,line,p,q}=fixture();p.x=3;p.y=0;q.x=3;q.y=0;
 const result=addLineRelation(viewer,'axis-symmetry',[p,q,line]);assert.ok(['accepted','redundant'].includes(result.status));
});
test('incompatible fixed geometry refuses the whole relation and preserves prior state',()=>{
 const {viewer,stage,line,other}=fixture();for(const p of [line.a,line.b,other.a,other.b])lock(stage,p);
 const before=stage.algNumSystem.allConstraints.slice(),coords=[line.a.x,line.a.y,line.b.x,line.b.y,other.a.x,other.a.y,other.b.x,other.b.y];
 assert.throws(()=>addLineRelation(viewer,'collinear',[line,other]),/conflict|invalidat/);
 assert.deepEqual(stage.algNumSystem.allConstraints,before);assert.deepEqual([line.a.x,line.a.y,line.b.x,line.b.y,other.a.x,other.a.y,other.b.x,other.b.y],coords);
});
test('contradictory fixed symmetry leaves the prior sketch and history intact',()=>{
 const {viewer,stage,line,p,q}=fixture();for(const point of [line.a,line.b,p,q])lock(stage,point);
 const before=stage.algNumSystem.allConstraints.slice(),coords=[p.x,p.y,q.x,q.y];
 assert.throws(()=>addLineRelation(viewer,'axis-symmetry',[p,q,line]),/conflict|invalidat/);
 assert.deepEqual(stage.algNumSystem.allConstraints,before);assert.deepEqual([p.x,p.y,q.x,q.y],coords);
});
test('a failed rollback records a recovery checkpoint instead of claiming success',()=>{
 const {viewer,stage,line,other}=fixture();for(const p of [line.a,line.b,other.a,other.b])lock(stage,p);
 const history=viewer.historyManager;Object.assign(history,{diffs:[],historyPointer:-1,lastCheckpoint:'',_counter:0,recoverySnapshot:null});
 history._checkpoint=()=>{history.lastCheckpoint=viewer.io.serializeSketch();};
 const system=stage.algNumSystem,rollback=system.rollbackTransaction;system.rollbackTransaction=()=>{throw Error('injected rollback failure');};
 try{assert.throws(()=>addLineRelation(viewer,'collinear',[line,other]),/held for recovery/);assert.equal(history.recoverySnapshot,'{"stable":true}');assert.throws(()=>addLineRelation(viewer,'collinear',[line,other]),/ready sketch/);}
 finally{system.rollbackTransaction=rollback;if(system.transactionBefore)system.rollbackTransaction();}
});
test('satisfied fixed symmetry does not move locked geometry',()=>{
 const {viewer,stage,line,p,q}=fixture();q.x=p.x;q.y=-p.y;for(const point of [line.a,line.b,p,q])lock(stage,point);
 const before=[line.a.x,line.a.y,line.b.x,line.b.y,p.x,p.y,q.x,q.y];
 const result=addLineRelation(viewer,'axis-symmetry',[p,q,line]);
 // The current admission solver does not rank-classify every two-equation
 // relation as redundant when all inputs are fixed; acceptance is not a DOF claim.
 assert.ok(['accepted','redundant'].includes(result.status));
 assert.deepEqual([line.a.x,line.a.y,line.b.x,line.b.y,p.x,p.y,q.x,q.y],before);
});
test('degenerate input and subsequent axis collapse refuse without changing the accepted relation',()=>{
 const {viewer,stage,line,p,q}=fixture();const old=line.params.t.get();line.params.t.set(0);
 assert.throws(()=>addLineRelation(viewer,'axis-symmetry',[p,q,line]),/degenerate/);line.params.t.set(old);
 addLineRelation(viewer,'axis-symmetry',[p,q,line]);stage.algNumSystem.solveFine();
 const before=[line.a.x,line.a.y,line.b.x,line.b.y,line.params.t.get(),p.x,p.y,q.x,q.y];
 line.b.x=line.a.x;line.b.y=line.a.y;line.params.t.set(0);stage.algNumSystem.solveFine();
 assert.equal(stage.algNumSystem.solveStatus.domainError,'DIRECTION_DOMAIN');
 assert.deepEqual([line.a.x,line.a.y,line.b.x,line.b.y,line.params.t.get(),p.x,p.y,q.x,q.y],before);
});
test('collapsing either admitted collinear segment restores last-valid state',()=>{
 for(const index of [0,1]){
  const {viewer,stage,line,other}=fixture();addLineRelation(viewer,'collinear',[line,other]);stage.algNumSystem.solveFine();
  const target=[line,other][index],before=[line.a.x,line.a.y,line.b.x,line.b.y,other.a.x,other.a.y,other.b.x,other.b.y];
  target.b.x=target.a.x;target.b.y=target.a.y;target.params.t.set(0);stage.algNumSystem.solveFine();
  assert.equal(stage.algNumSystem.solveStatus.domainError,'DIRECTION_DOMAIN');
  assert.deepEqual([line.a.x,line.a.y,line.b.x,line.b.y,other.a.x,other.a.y,other.b.x,other.b.y],before);
 }
});
test('ordinary rough drag of a direction endpoint remains usable',()=>{
 const {viewer,stage,line,p,q}=fixture();addLineRelation(viewer,'axis-symmetry',[p,q,line]);
 const before=line.b.x;stage.algNumSystem.prepare([line.b]);line.b.x-=1;stage.algNumSystem.solveRough();
 assert.equal(stage.algNumSystem.solveStatus.success,true);assert.notEqual(line.b.x,before);
});
test('ID path rejects stale and hidden-parameter ABA revisions',async()=>{
 const {viewer,line,other}=fixture(),before=await inspectLineRelationTargets(viewer);
 line.params.t.set(line.params.t.get()+1);line.params.t.set(line.params.t.get()-1);
 await assert.rejects(addLineRelationByIdsAtRevision(viewer,'collinear',[line.id,other.id],before.revision),/changed/);
});
