import assert from 'node:assert/strict';
import {test} from 'node:test';
import {ConstraintDefinitions, AlgNumConstraint} from '../../web/app/sketcher/constr/ANConstraints.ts';
import {AlgNumSubSystem} from '../../web/app/sketcher/constr/AlgNumSystem.ts';
import {Param} from '../../web/app/sketcher/shapes/param.ts';
import {Polynomial,POW_1_FN} from '../../web/app/sketcher/constr/polynomial.ts';
function setup(){const stage={objects:[]};const p={stage,id:'p',constraints:new Set(),x:new Param(0),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}};const sys=new AlgNumSubSystem(()=>100,x=>x,stage);const fixed=(id,axis,v)=>new AlgNumConstraint({id,name:id,defineParamsScope:([o],cb)=>cb(o[axis]),collectPolynomials:(a,[x])=>a.push(new Polynomial(-v).monomial(1).term(x,POW_1_FN))},[p]);return {stage,p,sys,fixed};}
test('inconsistent candidate cannot replace an existing accepted relation',()=>{const {sys,p,fixed}=setup();const one=fixed('one','x',1),two=fixed('two','x',2);sys.addConstraint(one);sys.addConstraint(two);assert.equal(sys.isConflicting(one),false);assert.equal(sys.isConflicting(two),true);assert.equal(p.x.get(),1);sys.solveFine();assert.equal(p.x.get(),1)});
test('fully redundant relation is retained, and becomes active after removing original',()=>{const {sys,p,fixed}=setup();const a=fixed('a','x',1),b=fixed('b','x',1);sys.addConstraint(a);sys.addConstraint(b);assert.equal(sys.redundant.has(b),true);assert.equal(p.constraints.has(b),true);sys.removeConstraint(a);assert.equal(sys.isConflicting(b),false);assert.equal(p.x.get(),1)});
test('exception in a new constraint leaves old geometry, backlinks and solver usable',()=>{const {sys,p,fixed}=setup();const one=fixed('one','x',1);sys.addConstraint(one);const broken=new AlgNumConstraint({id:'broken',name:'broken',defineParamsScope:([o],cb)=>cb(o.y),collectPolynomials:()=>{p.y.set(77);throw Error('broken') }},[p]);assert.throws(()=>sys.addConstraint(broken),/broken/);assert.ok(Math.abs(p.y.get())<1e-10);assert.equal(p.constraints.has(broken),false);assert.equal(sys.allConstraints.includes(broken),false);sys.solveFine();assert.equal(p.x.get(),1);assert.ok(Math.abs(p.y.get())<1e-10)});

test('failed removal restores constraint membership and geometry',()=>{const {sys,p,fixed}=setup();const a=fixed('a','x',1);let fail=false;const b=new AlgNumConstraint({id:'b',name:'b',defineParamsScope:([o],cb)=>cb(o.y),collectPolynomials:(out,[y])=>{if(fail){p.y.set(77);throw Error('injected')}out.push(new Polynomial().monomial(1).term(y,POW_1_FN))}},[p]);sys.addConstraint(a);sys.addConstraint(b);fail=true;assert.throws(()=>sys.removeConstraint(a),/injected/);assert.ok(sys.allConstraints.includes(a)&&p.constraints.has(a));assert.equal(p.x.get(),1);assert.ok(Math.abs(p.y.get())<1e-10);fail=false;sys.solveFine();assert.equal(p.x.get(),1);assert.ok(Math.abs(p.y.get())<1e-10)});
test('failed bulk admission drops staged links and restores original solver',()=>{const {sys,p,fixed}=setup();const a=fixed('a','x',1);sys.addConstraint(a);const broken=new AlgNumConstraint({id:'broken',name:'broken',defineParamsScope:([o],cb)=>cb(o.y),collectPolynomials:()=>{p.y.set(77);throw Error('bulk failure')}},[p]);sys.startTransaction();sys.addConstraint(broken);assert.throws(()=>sys.finishTransaction(),/bulk failure/);assert.deepEqual(sys.allConstraints,[a]);assert.ok(p.constraints.has(a)&&!p.constraints.has(broken));assert.equal(p.x.get(),1);assert.ok(Math.abs(p.y.get())<1e-10);sys.solveFine();assert.ok(Math.abs(p.y.get())<1e-10)});
test('serialized native constraints restore deterministic accepted priority',()=>{const {stage,p,sys}=setup();const a=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[p],{x:'1',y:'1'}),b=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[p],{x:'2',y:'2'});a.stage=b.stage={index:0};const saved=[a.write(),b.write()];sys.startTransaction();for(const row of saved)sys.addConstraint(AlgNumConstraint.read(row,{p}));sys.finishTransaction();assert.equal(sys.isConflicting(sys.allConstraints[0]),false);assert.equal(sys.isConflicting(sys.allConstraints[1]),true);assert.equal(p.x.get(),1);assert.equal(p.y.get(),1);assert.ok(sys.allConstraints.every(c=>p.constraints.has(c)))});

test('failed bulk mutation restores links for removed relations',()=>{const {sys,p,fixed}=setup();const a=fixed('a','x',1);sys.addConstraint(a);const broken=new AlgNumConstraint({id:'broken',name:'broken',defineParamsScope:([o],cb)=>cb(o.y),collectPolynomials:()=>{throw Error('bulk failure')}},[p]);sys.startTransaction();sys._removeConstraint(a);sys.addConstraint(broken);assert.throws(()=>sys.finishTransaction(),/bulk failure/);assert.deepEqual(sys.allConstraints,[a]);assert.ok(p.constraints.has(a)&&!p.constraints.has(broken));assert.equal(p.x.get(),1);sys.solveFine();assert.equal(p.x.get(),1)});
test('solve-time reclassification cannot displace accepted constraints with an external-stage reference',()=>{
 const {stage,p,sys,fixed}=setup();const existing=fixed('old','x',0);sys.addConstraint(existing);
 const external={stage:{},id:'external',constraints:new Set(),value:new Param(0),visitParams(cb){cb(this.value)}};
 let calls=0;
 const candidate=new AlgNumConstraint({id:'reclassify',name:'reclassify',defineParamsScope:([o,e],cb)=>{cb(o.x);cb(o.y);cb(e.value)},collectPolynomials:(out,[x,y])=>{calls++;out.push(calls===1?new Polynomial().monomial(1).term(y,POW_1_FN):new Polynomial(-1).monomial(1).term(x,POW_1_FN));}},[p,external]);
 sys.addConstraint(candidate);
 assert.ok(calls>=2,'external dependency must trigger a second build during solve');
 assert.equal(sys.isConflicting(existing),false);assert.equal(sys.isConflicting(candidate),true);
 assert.ok(Math.abs(p.x.get())<1e-10&&Math.abs(p.y.get())<1e-10);
});
test('accepted conflict priority survives native constraint serialization without reordering authored entries',()=>{
 const {stage,p,sys}=setup(), anchor=new AlgNumConstraint({id:'anchor',name:'anchor',defineParamsScope:([o],cb)=>cb(o.x),collectPolynomials:(out,[x])=>out.push(new Polynomial().monomial(1).term(x,POW_1_FN))},[p]);
 const early=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[p],{x:'3',y:'0'}),late=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[p],{x:'0',y:'1'});
 sys.addConstraint(anchor);sys.addConstraint(early);sys.addConstraint(late);sys.removeConstraint(anchor);
 assert.equal(sys.isConflicting(early),true);assert.equal(sys.isConflicting(late),false);assert.equal(p.x.get(),0);assert.equal(p.y.get(),1);
 const entries=[early.write(),late.write()];assert.equal(entries[0].constants.x,'3');assert.equal(entries[1].constants.x,'0');
 const fresh={stage,id:'p',constraints:new Set(),x:new Param(p.x.get()),y:new Param(p.y.get()),visitParams(cb){cb(this.x);cb(this.y)}};
 const loaded=new AlgNumSubSystem(()=>100,v=>v,stage);loaded.startTransaction();for(const entry of entries)loaded.addConstraint(AlgNumConstraint.read(entry,{p:fresh}));loaded.finishTransaction();
 assert.equal(loaded.isConflicting(loaded.allConstraints[0]),true);assert.equal(loaded.isConflicting(loaded.allConstraints[1]),false);
 assert.equal(fresh.x.get(),0);assert.equal(fresh.y.get(),1);
});
test('real point-on-line and locks preserve accepted branch after removal and reload',()=>{
 const {stage,p,sys}=setup();const external={},a={x:new Param(-1),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}},b={x:new Param(1),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}};
 const segment={stage:external,id:'s',constraints:new Set(),a,b,params:{ang:new Param(0)},visitParams(cb){a.visitParams(cb);b.visitParams(cb);cb(this.params.ang)}};
 const anchor=new AlgNumConstraint(ConstraintDefinitions.PointOnLine,[p,segment]),early=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[p],{x:'0',y:'3'}),late=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[p],{x:'1',y:'0'});
 sys.addConstraint(anchor);sys.addConstraint(early);sys.addConstraint(late);sys.removeConstraint(anchor);
 assert.equal(sys.isConflicting(early),true);assert.equal(sys.isConflicting(late),false);assert.equal(p.x.get(),1);assert.ok(Math.abs(p.y.get())<1e-10);
 const entries=[early.write(),late.write()],next=new AlgNumSubSystem(()=>100,v=>v,stage),restored=entries.map(c=>AlgNumConstraint.read(c,{p}));
 next.startTransaction();for(const c of restored)next.addConstraint(c);next.finishTransaction();next.solveFine();
 assert.equal(next.isConflicting(restored[0]),true);assert.equal(next.isConflicting(restored[1]),false);assert.equal(p.x.get(),1);assert.ok(Math.abs(p.y.get())<1e-10);
});

test('independent accepted point locks are retried together without changing conflict priority',()=>{
 const {stage,sys}=setup(), points=Array.from({length:12},(_,i)=>({stage,id:'q'+i,constraints:new Set(),x:new Param(i),y:new Param(i),visitParams(cb){cb(this.x);cb(this.y)}}));
 const accepted=points.map((p,i)=>new AlgNumConstraint(ConstraintDefinitions.LockPoint,[p],{x:String(i),y:String(i)}));
 const bad=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[points[0]],{x:'99',y:'99'});
 sys.startTransaction();for(const c of [...accepted,bad])sys.addConstraint(c);sys.finishTransaction();assert.equal(sys.isConflicting(bad),true);
 let builds=0;const originalPrepare=sys.prepare;sys.prepare=function(...args){builds++;return originalPrepare.apply(this,args)};
 sys.removeConstraint(accepted.at(-1));assert.ok(builds<8,`expected bounded retries, got ${builds}`);
 assert.equal(sys.isConflicting(bad),true);assert.equal(points[0].x.get(),0);assert.equal(points[0].y.get(),0);
 assert.ok(points[0].constraints.has(bad));
});

test('bulk load batches only isolated locks and retains authored priority for overlapping locks',()=>{
 const {stage,sys}=setup(),points=Array.from({length:12},(_,i)=>({stage,id:'bulk'+i,constraints:new Set(),x:new Param(i),y:new Param(i),visitParams(cb){cb(this.x);cb(this.y)}}));
 const locks=points.map((p,i)=>new AlgNumConstraint(ConstraintDefinitions.LockPoint,[p],{x:String(i),y:String(i)}));
 const bad=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[points[0]],{x:'99',y:'99'});
 let builds=0;const originalPrepare=sys.prepare;sys.prepare=function(...args){builds++;return originalPrepare.apply(this,args)};
 sys.startTransaction();for(const c of [locks[0],bad,...locks.slice(1)])sys.addConstraint(c);sys.finishTransaction();
 assert.ok(builds<10,`expected bounded retries, got ${builds}`);assert.equal(sys.isConflicting(locks[0]),false);assert.equal(sys.isConflicting(bad),true);
 assert.equal(points[0].x.get(),0);assert.equal(points[0].y.get(),0);assert.ok(points[0].constraints.has(bad));
 sys.removeConstraint(locks[0]);assert.equal(sys.isConflicting(bad),false);assert.equal(points[0].x.get(),99);assert.equal(points[0].y.get(),99);
});
