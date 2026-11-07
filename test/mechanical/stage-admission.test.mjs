import assert from 'node:assert/strict';
import {test} from 'node:test';
import {ParametricManager} from '../../web/app/sketcher/parametric.ts';
import {AlgNumConstraint, ConstraintDefinitions} from '../../web/app/sketcher/constr/ANConstraints.ts';
import {Param} from '../../web/app/sketcher/shapes/param.ts';
import {IO} from '../../web/app/sketcher/io.ts';
import {Layer} from '../../web/app/sketcher/viewer2d.ts';

test('solver exception does not attach a failed constraint annotation or stage',()=>{
 const annotations=[];
 const viewer={refresh(){}, screenToModel2(x,y,p){p.x=x;p.y=y}, annotationLayer:{add(a){annotations.push(a)}}};
 const manager=new ParametricManager(viewer), stage=manager.stage;
 const point={stage,id:'p',constraints:new Set(),x:new Param(0),visitParams(cb){cb(this.x)}};
 const constraint=new AlgNumConstraint({id:'bad',name:'bad',defineParamsScope:([p],cb)=>cb(p.x),collectPolynomials:()=>{point.x.set(9);throw Error('failure')}},[point]);
 const prior=constraint.stage, annotation={}; constraint.annotations=[annotation];
 assert.throws(()=>stage.addConstraint(constraint),/failure/);
 assert.equal(point.x.get(),0);assert.equal(point.constraints.has(constraint),false);
 assert.equal(stage.algNumSystem.allConstraints.includes(constraint),false);
 assert.equal(constraint.stage,prior);assert.deepEqual(annotations,[]);
});

test('admitted and retained conflicting constraints keep their annotations',()=>{
 const annotations=[];
 const viewer={refresh(){},screenToModel2(x,y,p){p.x=x;p.y=y},annotationLayer:{add(a){annotations.push(a)}}};
 const manager=new ParametricManager(viewer),stage=manager.stage;
 const point={stage,id:'p',constraints:new Set(),x:new Param(0),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}};
 const first=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[point],{x:'1',y:'0'});
 const conflicting=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[point],{x:'2',y:'0'});
 first.annotations=[{name:'first'}];conflicting.annotations=[{name:'conflict'}];
 stage.addConstraint(first);stage.addConstraint(conflicting);
 assert.equal(stage.algNumSystem.isConflicting(conflicting),true);
 assert.equal(point.x.get(),1);assert.equal(point.constraints.has(conflicting),true);
 assert.deepEqual(annotations,[first.annotations[0],conflicting.annotations[0]]);
});

test('stages created during restore defer admission and preserve saved conflict priority',()=>{
 const annotations=[];
 const viewer={refresh(){},screenToModel2(x,y,p){p.x=x;p.y=y},annotationLayer:{add(a){annotations.push(a)}}};
 const manager=new ParametricManager(viewer);manager.startTransaction();manager.accommodateStages(1);
 const stage=manager.getStage(1),point={stage,id:'p',constraints:new Set(),x:new Param(0),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}};
 const rejected=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[point],{x:'3',y:'0'}),accepted=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[point],{x:'0',y:'1'});
 rejected.admissionHint={version:1,state:'rejected'};accepted.admissionHint={version:1,state:'accepted'};
 stage.addConstraint(rejected);stage.addConstraint(accepted);manager.finishTransaction();
 assert.equal(stage.algNumSystem.isConflicting(rejected),true);assert.equal(stage.algNumSystem.isConflicting(accepted),false);
 assert.ok(Math.abs(point.x.get())<1e-10);assert.equal(point.y.get(),1);
 assert.ok(point.constraints.has(rejected)&&point.constraints.has(accepted));
});

test('real sketch IO preserves later-stage admission priority on reload',()=>{
 let point,manager;
 const viewer={layers:[],dimLayers:[],dimLayer:{objects:[]},labelLayer:{objects:[]},annotationLayer:{add(){}},refresh(){},screenToModel2(x,y,p){p.x=x;p.y=y},createGroundObjects(){},findLayerByName(){return {add(){}}},createIndex(){manager.accommodateStages(1);point.stage=manager.getStage(1);return {p:point}}};
 manager=viewer.parametricManager=new ParametricManager(viewer);
 const io=new IO(viewer);io.cleanUpData=()=>{manager.reset();point={id:'p',constraints:new Set(),x:new Param(0),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}}};
 const row=(x,y,state)=>({typeId:'LockPoint',objects:['p'],constants:{x:String(x),y:String(y)},stage:1,annotations:[],admission:{version:1,state}});
 const source=JSON.stringify({version:3,objects:[],dimensions:[],labels:[],stages:[{constraints:[],generators:[]},{constraints:[row(3,0,'rejected'),row(0,1,'accepted')],generators:[]}],constants:''});
 let text=source;
 for(let i=0;i<2;i++){
  io.loadSketch(text,{strict:true});const sys=manager.getStage(1).algNumSystem;
  assert.equal(sys.isConflicting(sys.allConstraints[0]),true);assert.equal(sys.isConflicting(sys.allConstraints[1]),false);
  assert.ok(Math.abs(point.x.get())<1e-10);assert.equal(point.y.get(),1);
  const saved=JSON.parse(io.serializeSketch(undefined,{strict:true}));
  assert.deepEqual(saved.stages[1].constraints.map(c=>c.admission.state),['rejected','accepted']);
  text=JSON.stringify(saved);
 }
});

test('restored cross-stage conflict reactivates when an earlier-stage point is dragged back',()=>{
 let point,external,manager;
 const viewer={layers:[],dimLayers:[],dimLayer:{objects:[]},labelLayer:{objects:[]},annotationLayer:{add(){}},refresh(){},screenToModel2(x,y,p){p.x=x;p.y=y},createGroundObjects(){},findLayerByName(){return {add(){}}},createIndex(){manager.accommodateStages(1);external.stage=manager.getStage(0);point.stage=manager.getStage(1);return {p:point,e:external}}};
 manager=viewer.parametricManager=new ParametricManager(viewer);
 const io=new IO(viewer);io.cleanUpData=()=>{manager.reset();const p=id=>({id,constraints:new Set(),x:new Param(0),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}});point=p('p');external=p('e');external.x.set(1)};
 const row=(typeId,objects,constants,state)=>({typeId,objects,constants,stage:1,annotations:[],admission:{version:1,state}});
 const source=JSON.stringify({version:3,objects:[],dimensions:[],labels:[],stages:[{constraints:[],generators:[]},{constraints:[row('LockPoint',['p'],{x:'0',y:'0'},'accepted'),row('PCoincident',['p','e'],{},'rejected')],generators:[]}],constants:''});
 io.loadSketch(source,{strict:true});const saved=io.serializeSketch(undefined,{strict:true});io.loadSketch(saved,{strict:true});
 const sys=manager.getStage(1).algNumSystem,pair=sys.allConstraints[1];assert.equal(sys.isConflicting(pair),true);
 manager.prepare([external]);external.x.set(0);manager.solve(true);manager.solve(false);
 assert.equal(sys.redundant.has(pair),true);assert.ok(Math.abs(point.x.get())<1e-10);assert.ok(Math.abs(external.x.get())<1e-10);
 assert.ok(point.constraints.has(pair)&&external.constraints.has(pair));
});
test('failure in later stage rolls back the entire manager transaction',()=>{
 const annotations=[];
 const viewer={refresh(){},screenToModel2(x,y,p){p.x=x;p.y=y},annotationLayer:{add(a){annotations.push(a)},remove(a){const i=annotations.indexOf(a);if(i>=0)annotations.splice(i,1)}}};
 const manager=new ParametricManager(viewer);manager.accommodateStages(1);
 const a=manager.getStage(0), b=manager.getStage(1);
 const mk=(stage,id)=>({stage,id,constraints:new Set(),x:new Param(0),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}});
 const p=mk(a,'a'),q=mk(b,'b');
 const base=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[p],{x:'2',y:'0'});base.annotations=[{id:'base'}];a.addConstraint(base);
 const priorHint=base.admissionHint;
 manager.startTransaction();
 const extra=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[p],{x:'0',y:'0'});extra.annotations=[{id:'extra'}];a.addConstraint(extra);
 const fail=new AlgNumConstraint({id:'fail',name:'fail',defineParamsScope:([v],cb)=>cb(v.x),collectPolynomials:()=>{throw Error('later stage failed')}},[q]);b.addConstraint(fail);
 assert.throws(()=>manager.finishTransaction(),/later stage failed/);
 assert.equal(a.algNumSystem.allConstraints.length,1,'earlier stage was not rolled back');
 assert.equal(a.algNumSystem.allConstraints[0],base);
 assert.equal(p.constraints.has(extra),false);
 assert.equal(b.algNumSystem.allConstraints.includes(fail),false);
 assert.equal(extra.stage,null);assert.equal(base.admissionHint,priorHint);assert.equal(p.x.get(),2);
 assert.deepEqual(annotations,[base.annotations[0]]);a.algNumSystem.solveFine();assert.equal(p.x.get(),2);
});

test('later stage does not remain stuck in transaction after earlier stage failure',()=>{
 const viewer={refresh(){},screenToModel2(x,y,p){p.x=x;p.y=y},annotationLayer:{add(){}}};
 const manager=new ParametricManager(viewer);manager.accommodateStages(2);
 const failed=manager.getStage(1),later=manager.getStage(2);
 const p={stage:failed,id:'p',constraints:new Set(),x:new Param(0),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}};
 manager.startTransaction();
 failed.addConstraint(new AlgNumConstraint({id:'failure',name:'failure',defineParamsScope:([o],cb)=>cb(o.x),collectPolynomials:()=>{throw Error('stage 1 failed')}},[p]));
 assert.throws(()=>manager.finishTransaction(),/stage 1 failed/);
 assert.equal(later.algNumSystem.inTransaction,false,'later stage was left in a transaction');
});

test('annotation attachment failure rolls back constraint state and attached annotations',()=>{
 const annotations=[];let fail=false;
 const layer={add(a){annotations.push(a);if(fail)throw Error('annotation failed')},remove(a){const i=annotations.indexOf(a);if(i>=0)annotations.splice(i,1)}};
 const viewer={refresh(){},screenToModel2(x,y,p){p.x=x;p.y=y},annotationLayer:layer};
 const manager=new ParametricManager(viewer),stage=manager.stage,p={stage,id:'p',constraints:new Set(),x:new Param(0),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}};
 const first=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[p],{x:'2',y:'0'});first.annotations=[{id:'first'}];stage.addConstraint(first);
 const next=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[p],{x:'2',y:'0'});next.annotations=[{id:'next'}];manager.startTransaction();stage.addConstraint(next);
 assert.deepEqual(annotations,[first.annotations[0]]);fail=true;assert.throws(()=>manager.finishTransaction(),/annotation failed/);
 assert.deepEqual(annotations,[first.annotations[0]]);assert.equal(stage.algNumSystem.allConstraints.includes(next),false);assert.equal(next.stage,null);assert.equal(p.constraints.has(next),false);assert.equal(p.x.get(),2);
});

test('failed transaction retains an existing removed constraint annotation',()=>{
 const annotations=[];
 const layer={add(a){annotations.push(a);a.layer=this},remove(a){const i=annotations.indexOf(a);if(i>=0)annotations.splice(i,1)}};
 const viewer={refresh(){},screenToModel2(x,y,p){p.x=x;p.y=y},annotationLayer:layer};
 const manager=new ParametricManager(viewer);manager.accommodateStages(1);const a=manager.getStage(0),b=manager.getStage(1);
 const mk=(stage,id)=>({stage,id,constraints:new Set(),x:new Param(0),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}}),p=mk(a,'p'),q=mk(b,'q');
 const base=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[p],{x:'2',y:'0'});base.annotations=[{id:'base'}];a.addConstraint(base);
 manager.startTransaction();manager._removeConstraint(base);
 const fail=new AlgNumConstraint({id:'fail',name:'fail',defineParamsScope:([o],cb)=>cb(o.x),collectPolynomials:()=>{throw Error('later failed')}},[q]);b.addConstraint(fail);
 assert.throws(()=>manager.finishTransaction(),/later failed/);
 assert.ok(a.algNumSystem.allConstraints.includes(base));assert.ok(p.constraints.has(base));assert.equal(p.x.get(),2);
 assert.deepEqual(annotations,[base.annotations[0]]);
});

test('committed transactional removal removes its annotation',()=>{
 const layer={objects:[],add(a){this.objects.push(a);a.layer=this},remove(a){const i=this.objects.indexOf(a);if(i>=0)this.objects.splice(i,1)}};
 const viewer={refresh(){},screenToModel2(x,y,p){p.x=x;p.y=y},annotationLayer:layer};
 const manager=new ParametricManager(viewer),stage=manager.stage,p={stage,id:'p',constraints:new Set(),x:new Param(0),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}};
 const c=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[p],{x:'2',y:'0'});c.annotations=[{id:'a'}];stage.addConstraint(c);
 manager.startTransaction();manager._removeConstraint(c);assert.equal(layer.objects.length,1);manager.finishTransaction();
 assert.equal(layer.objects.length,0);assert.equal(stage.algNumSystem.allConstraints.includes(c),false);assert.equal(p.constraints.has(c),false);
});

test('annotation removal failure restores previously removed annotations and solver state',()=>{
 let fail=false;const layer={objects:[],add(a){this.objects.push(a);a.layer=this},remove(a){const i=this.objects.indexOf(a);if(i>=0)this.objects.splice(i,1);if(fail)throw Error('removal failed')}};
 const viewer={refresh(){},screenToModel2(x,y,p){p.x=x;p.y=y},annotationLayer:layer};
 const manager=new ParametricManager(viewer),stage=manager.stage,p={stage,id:'p',constraints:new Set(),x:new Param(0),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}};
 const c=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[p],{x:'2',y:'0'});c.annotations=[{id:'a'}];stage.addConstraint(c);
 manager.startTransaction();manager._removeConstraint(c);fail=true;assert.throws(()=>manager.finishTransaction(),/removal failed/);
 assert.deepEqual(layer.objects,[c.annotations[0]]);assert.ok(stage.algNumSystem.allConstraints.includes(c));assert.ok(p.constraints.has(c));assert.equal(p.x.get(),2);
});

test('real annotation layer restores its stage when removal fails after mutation',()=>{
 const viewer={refresh(){},objectsUpdate(){},screenToModel2(x,y,p){p.x=x;p.y=y}};
 const manager=viewer.parametricManager=new ParametricManager(viewer);const layer=viewer.annotationLayer=new Layer('annotations',{},viewer);
 const stage=manager.stage,p={stage,id:'p',constraints:new Set(),x:new Param(0),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}};
 const c=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[p],{x:'2',y:'0'});const annotation={layer:null,stage:null};c.annotations=[annotation];stage.addConstraint(c);
 assert.ok(stage.objects.has(annotation));manager.startTransaction();manager._removeConstraint(c);
 const remove=layer.remove;layer.remove=function(a){remove.call(this,a);throw Error('after removal')};
 assert.throws(()=>manager.finishTransaction(),/after removal/);
 assert.deepEqual(layer.objects,[annotation]);assert.equal(annotation.layer,layer);assert.equal(annotation.stage,stage);assert.ok(stage.objects.has(annotation));assert.ok(p.constraints.has(c));
});

test('constraint added and removed in one transaction leaves no stage or annotation',()=>{
 const annotations=[];const layer={add(a){annotations.push(a);a.layer=this},remove(a){const i=annotations.indexOf(a);if(i>=0)annotations.splice(i,1)}};
 const viewer={refresh(){},screenToModel2(x,y,p){p.x=x;p.y=y},annotationLayer:layer};
 const manager=new ParametricManager(viewer),stage=manager.stage,p={stage,id:'p',constraints:new Set(),x:new Param(0),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}};
 const c=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[p],{x:'2',y:'0'});c.annotations=[{id:'a',layer:null}];
 manager.startTransaction();stage.addConstraint(c);manager._removeConstraint(c);manager.finishTransaction();
 assert.equal(c.stage,null);assert.equal(p.constraints.has(c),false);assert.equal(stage.algNumSystem.allConstraints.includes(c),false);assert.deepEqual(annotations,[]);
});

test('rollback restores a shared earlier-stage parameter to its transaction-start value',()=>{
 const viewer={refresh(){},screenToModel2(x,y,p){p.x=x;p.y=y},annotationLayer:{add(){},remove(){}}};
 const manager=new ParametricManager(viewer);manager.accommodateStages(2);const a=manager.getStage(0),b=manager.getStage(1),last=manager.getStage(2);
 const mk=(stage,id)=>({stage,id,constraints:new Set(),x:new Param(0),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}}),p=mk(a,'p'),q=mk(b,'q'),r=mk(last,'r');
 const lock=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[p],{x:'0',y:'0'});a.addConstraint(lock);manager.startTransaction();
 p.x.set(5);b.addConstraint(new AlgNumConstraint(ConstraintDefinitions.PCoincident,[q,p]));
 last.addConstraint(new AlgNumConstraint({id:'fail',name:'fail',defineParamsScope:([o],cb)=>cb(o.x),collectPolynomials:()=>{throw Error('later failed')}},[r]));
 assert.throws(()=>manager.finishTransaction(),/later failed/);assert.ok(Math.abs(p.x.get())<1e-10);
});

test('rollback restores an unconstrained earlier-stage object referenced later',()=>{
 const viewer={refresh(){},screenToModel2(x,y,p){p.x=x;p.y=y},annotationLayer:{add(){},remove(){}}};
 const manager=new ParametricManager(viewer);manager.accommodateStages(2);const a=manager.getStage(0),b=manager.getStage(1),last=manager.getStage(2);
 const mk=(stage,id)=>({stage,id,constraints:new Set(),x:new Param(0),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}}),p=mk(a,'p'),q=mk(b,'q'),r=mk(last,'r');
 a.assignObject(p);manager.startTransaction();p.x.set(5);b.addConstraint(new AlgNumConstraint(ConstraintDefinitions.PCoincident,[q,p]));
 last.addConstraint(new AlgNumConstraint({id:'fail',name:'fail',defineParamsScope:([o],cb)=>cb(o.x),collectPolynomials:()=>{throw Error('later failed')}},[r]));
 assert.throws(()=>manager.finishTransaction(),/later failed/);assert.ok(Math.abs(p.x.get())<1e-10);
});
