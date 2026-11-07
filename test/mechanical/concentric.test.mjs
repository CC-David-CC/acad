import assert from 'node:assert/strict';
import {test} from 'node:test';
import {AlgNumConstraint, ConstraintDefinitions} from '../../web/app/sketcher/constr/ANConstraints.ts';
import {AlgNumSubSystem} from '../../web/app/sketcher/constr/AlgNumSystem.ts';
import {Circle} from '../../web/app/sketcher/shapes/circle.js';
import {Arc} from '../../web/app/sketcher/shapes/arc.ts';
import {Polynomial, POW_1_FN} from '../../web/app/sketcher/constr/polynomial.ts';
import {IO} from '../../web/app/sketcher/io.ts';
import {ParametricManager} from '../../web/app/sketcher/parametric.ts';
import {matchAvailableActions, getSketcherAction} from '../../web/app/sketcher/actions/index.js';
import {addConcentric} from '../../web/app/sketcher/actions/concentricOperation.js';

const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function fixture(){
 const stage={objects:[],index:0}, first=new Circle(3,4,5,'c1'),second=new Circle(10,20,9,'c2');
 first.stage=stage;second.stage=stage;stage.objects.push(first,second);
 return {stage,first,second,solver:new AlgNumSubSystem(()=>100,v=>v,stage)};
}
function actionFixture(items=[new Circle(3,4,5,'c1'),new Circle(10,20,9,'c2')]) {
 const viewer={items,refresh(){},screenToModel2(x,y,p){p.x=x;p.y=y},annotationLayer:{add(a){a.layer=this},remove(a){a.layer=null}},traverse(fn){this.items.forEach(fn)}};
 const manager=viewer.parametricManager=new ParametricManager(viewer),stage=manager.stage;
 for(const object of items){stage.assignObject(object);if(object.c)stage.assignObject(object.c);}
 viewer.io={serializeSketch(){return JSON.stringify({objects:viewer.items.map(o=>({id:o.id,x:o.c?.x,y:o.c?.y,r:o.r?.get()})),constraints:manager.stages.map(s=>s.algNumSystem.allConstraints.map(c=>c.write()))})}};
 viewer.historyManager={diffs:[{baseline:true}],historyPointer:0,lastCheckpoint:viewer.io.serializeSketch(),_counter:7,_checkpoint(){this.lastCheckpoint=viewer.io.serializeSketch();this._counter=0;}};
 return {viewer,manager,stage,solver:stage.algNumSystem,first:items[0],second:items[1]};
}
const retained=f=>JSON.stringify({source:f.viewer.io.serializeSketch(),history:f.viewer.historyManager,backlinks:f.viewer.items.map(o=>[...o.constraints].map(c=>c.id))});
test('concentric drives both center coordinates while preserving radii',()=>{
 const {first,second,solver}=fixture(),relation=new AlgNumConstraint(ConstraintDefinitions.Concentric,[first,second]);
 solver.addConstraint(relation);solver.solveFine();
 assert.equal(solver.isConflicting(relation),false);close(first.c.x,second.c.x);close(first.c.y,second.c.y);
 close(first.r.get(),5);close(second.r.get(),9);assert.ok(first.constraints.has(relation));assert.ok(second.constraints.has(relation));
});
test('circle and arc selection exposes exactly-two concentric command',()=>{
 const {first,second}=fixture(),arc=new Arc(1,0,0,1,0,0,'arc');
 const ids=s=>matchAvailableActions(s).map(action=>action.id);
 assert.ok(ids([first,second]).includes('Concentric'));assert.ok(ids([first,arc]).includes('Concentric'));
 assert.ok(!ids([first]).includes('Concentric'));assert.ok(!ids([first,second,arc]).includes('Concentric'));
});
test('action creates a real center relationship for circle and arc',async()=>{
 const arc=new Arc(21,8,20,9,20,8,'arc'),{first,solver,viewer}=actionFixture([new Circle(3,4,5,'c1'),arc]);
 const action=getSketcherAction('Concentric'), inspected=await action.inspect({viewer});assert.equal((await action.invokeByIds({viewer},[first.id,arc.id],inspected.revision)).status,'accepted');
 solver.solveFine();const relation=solver.allConstraints[0];assert.equal(relation.schema.id,'Concentric');
 close(first.c.x,arc.c.x);close(first.c.y,arc.c.y);close(first.r.get(),5);close(arc.r.get(),1);
});
test('dedicated relationship survives actual sketch IO save and restore',()=>{
 let manager,first,second;
 const viewer={layers:[],dimLayers:[],dimLayer:{objects:[]},labelLayer:{objects:[]},annotationLayer:{add(){}},refresh(){},screenToModel2(x,y,p){p.x=x;p.y=y},createGroundObjects(){},findLayerByName(){return {add(){}}},createIndex(){return {c1:first,c2:second}}};
 manager=viewer.parametricManager=new ParametricManager(viewer);
 const io=new IO(viewer);
 io.cleanUpData=()=>{manager.reset();first=new Circle(3,4,5,'c1');second=new Circle(10,20,9,'c2');first.stage=manager.stage;second.stage=manager.stage;manager.stage.objects.add(first);manager.stage.objects.add(second)};
 io.cleanUpData();manager.stage.addConstraint(new AlgNumConstraint(ConstraintDefinitions.Concentric,[first,second]));
 const saved=io.serializeSketch(undefined,{strict:true});assert.match(saved,/Concentric/);
 io.loadSketch(saved,{strict:true});const constraints=manager.stage.algNumSystem.allConstraints;
 assert.equal(constraints.length,1);assert.equal(constraints[0].schema.id,'Concentric');
 manager.stage.algNumSystem.solveFine();
 close(first.c.x,second.c.x);close(first.c.y,second.c.y);close(first.r.get(),5);close(second.r.get(),9);
});
test('contradictory fixed centers reject the whole concentric relation without moving geometry',()=>{
 const {stage,first,second,solver}=fixture();first.c.stage=stage;second.c.stage=stage;
 const lock1=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[first.c],{x:'3',y:'4'}),lock2=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[second.c],{x:'10',y:'20'});
 solver.addConstraint(lock1);solver.addConstraint(lock2);const relation=new AlgNumConstraint(ConstraintDefinitions.Concentric,[first,second]);solver.addConstraint(relation);solver.solveFine();
 assert.equal(solver.isConflicting(relation),true);close(first.c.x,3);close(first.c.y,4);close(second.c.x,10);close(second.c.y,20);
 assert.equal(solver.isConflicting(lock1),false);assert.equal(solver.isConflicting(lock2),false);
});

test('rejected concentric cannot partially move an unconstrained center coordinate',()=>{
 const {stage,first,second,solver}=fixture();first.c.stage=stage;second.c.stage=stage;
 const lock=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[first.c],{x:'3',y:'4'});
 const fixedY=new AlgNumConstraint({id:'testY',name:'testY',defineParamsScope:([circle],cb)=>cb(circle.c.params.y),collectPolynomials:(out,[y])=>out.push(new Polynomial(-20).monomial(1).term(y,POW_1_FN))},[second]);
 solver.addConstraint(lock);solver.addConstraint(fixedY);const relation=new AlgNumConstraint(ConstraintDefinitions.Concentric,[first,second]);solver.addConstraint(relation);solver.solveFine();
 assert.equal(solver.isConflicting(relation),true);close(first.c.x,3);close(first.c.y,4);close(second.c.x,10);close(second.c.y,20);
});

test('ID command rejects missing, duplicate, ambiguous, wrong-type, stale and foreign objects before mutation',async()=>{
 const {stage,first,second,solver,viewer}=actionFixture();let snapshot='initial';viewer.io.serializeSketch=()=>snapshot;
 const action=getSketcherAction('Concentric'),inspect=()=>action.inspect({viewer}),run=(ids,rev,options)=>action.invokeByIds({viewer},ids,rev,options);
 let view=await inspect();await assert.rejects(run([first.id,first.id],view.revision),/distinct/);
 view=await inspect();await assert.rejects(run([first.id,'missing'],view.revision),/missing or ambiguous/);
 viewer.traverse=fn=>[first,second,second].forEach(fn);await assert.rejects(inspect(),/ambiguous/);
 viewer.traverse=fn=>[first,second.c].forEach(fn);view=await inspect();await assert.rejects(run([first.id,second.c.id],view.revision),/circles or arcs|missing or ambiguous/);
 viewer.traverse=fn=>[first,second].forEach(fn);view=await inspect();snapshot='changed';await assert.rejects(run([first.id,second.id],view.revision),/changed/);
 snapshot='initial';view=await inspect();let valid=false;await assert.rejects(run([first.id,second.id],view.revision,{valid:()=>valid}),/no longer available/);
 view=await inspect();second.stage={index:1};await assert.rejects(run([first.id,second.id],view.revision),/this sketch/);
 assert.equal(solver.allConstraints.length,0);
});

test('command token rejects replacement objects and a lifetime invalidated before submission',async()=>{
 const {stage,first,second,solver,viewer}=actionFixture();let refs=[first,second],checks=0;viewer.io.serializeSketch=()=>"same";viewer.traverse=fn=>refs.forEach(fn);
 const action=getSketcherAction('Concentric');let view=await action.inspect({viewer});
 const replacement=new Circle(second.c.x,second.c.y,second.r.get(),second.id);replacement.stage=stage;refs=[first,replacement];
 await assert.rejects(action.invokeByIds({viewer},[first.id,second.id],view.revision),/changed/);
 refs=[first,second];view=await action.inspect({viewer});
 await assert.rejects(action.invokeByIds({viewer},[first.id,second.id],view.revision,{valid:()=>++checks===1}),/no longer available/);
 assert.equal(solver.allConstraints.length,0);
});
// At source699 this public action returned status:'conflicting' and retained
// the rejected row. The operation contract now rejects without an authored edit;
// the low-level subsystem conflict-retention controls above remain unchanged.
test('ID command atomically rejects conflict, retains prior intent/history and recovers',async()=>{
 const f=actionFixture(),{first,second,solver,viewer}=f;
 solver.addConstraint(new AlgNumConstraint(ConstraintDefinitions.LockPoint,[first.c],{x:'3',y:'4'}));
 const fixedY=new AlgNumConstraint({id:'testY',name:'testY',defineParamsScope:([circle],cb)=>cb(circle.c.params.y),collectPolynomials:(out,[y])=>out.push(new Polynomial(-20).monomial(1).term(y,POW_1_FN))},[second]);solver.addConstraint(fixedY);
 const action=getSketcherAction('Concentric'),view=await action.inspect({viewer}),before=retained(f);
 await assert.rejects(action.invokeByIds({viewer},[first.id,second.id],view.revision,{valid:()=>true}),/conflicts/);
 assert.equal(retained(f),before);assert.equal(solver.allConstraints.length,2);assert.equal(solver.allConstraints.some(c=>c.schema.id==='Concentric'),false);
 solver.prepare();solver.solveFine();close(first.c.x,3);close(first.c.y,4);close(second.c.x,10);close(second.c.y,20);
 solver.removeConstraint(fixedY);const retry=await action.inspect({viewer});assert.equal((await action.invokeByIds({viewer},[first.id,second.id],retry.revision)).status,'accepted');close(first.c.x,second.c.x);close(first.c.y,second.c.y);
});
test('selection UI shares atomic refusal and redundant success',()=>{
 const f=actionFixture(),{first,second,solver,viewer}=f;
 solver.addConstraint(new AlgNumConstraint(ConstraintDefinitions.LockPoint,[first.c],{x:'3',y:'4'}));
 const secondLock=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[second.c],{x:'10',y:'20'});solver.addConstraint(secondLock);const before=retained(f);
 assert.throws(()=>addConcentric(viewer,[first,second]),/conflicts/);assert.equal(retained(f),before);
 solver.removeConstraint(secondLock);assert.equal(addConcentric(viewer,[first,second]).status,'accepted');assert.equal(addConcentric(viewer,[first,second]).status,'redundant');
});
test('shared guard rejects same-byte parameter ABA and expired lifetime',async()=>{
 const f=actionFixture(),{first,second,viewer,solver}=f,action=getSketcherAction('Concentric');const view=await action.inspect({viewer});
 const before=viewer.io.serializeSketch(),x=second.c.x;second.c.x=x+1;second.c.x=x;assert.equal(viewer.io.serializeSketch(),before);
 await assert.rejects(action.invokeByIds({viewer},[first.id,second.id],view.revision),/changed/);assert.equal(solver.allConstraints.length,0);
 const current=await action.inspect({viewer}),controller=new AbortController();controller.abort();await assert.rejects(action.invokeByIds({viewer},[first.id,second.id],current.revision,{signal:controller.signal}),/no longer available/);
});
test('solver failure preserves state and history, then permits a valid edit',()=>{
 const f=actionFixture(),{first,second,solver,viewer}=f,lock=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[first.c],{x:'3',y:'4'});solver.addConstraint(lock);
 const collect=lock.collectPolynomials;lock.collectPolynomials=()=>{first.c.x=99;throw Error('injected solver failure')};const before=retained(f);
 assert.throws(()=>addConcentric(viewer,[first,second]),/injected/);assert.equal(retained(f),before);assert.equal(viewer.parametricManager.inTransaction,false);
 lock.collectPolynomials=collect;assert.equal(addConcentric(viewer,[first,second]).status,'accepted');
});
test('inspection refuses geometry changed by its final true lifetime callback',async()=>{
 const {viewer,second,solver}=actionFixture(),action=getSketcherAction('Concentric');let checks=0;
 await assert.rejects(action.inspect({viewer},{valid:()=>{if(++checks===2)second.c.x+=1;return true;}}),/changed/);
 assert.equal(checks,2);assert.equal(second.c.x,11);assert.equal(solver.allConstraints.length,0);
 const current=await action.inspect({viewer});assert.equal(current.objects.find(o=>o.id===second.id).center.x,11);
});
