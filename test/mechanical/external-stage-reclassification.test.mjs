import assert from 'node:assert/strict';
import {test} from 'node:test';
import {AlgNumConstraint,ConstraintDefinitions} from '../../web/app/sketcher/constr/ANConstraints.ts';
import {AlgNumSubSystem} from '../../web/app/sketcher/constr/AlgNumSystem.ts';
import {Param} from '../../web/app/sketcher/shapes/param.ts';
import {Polynomial,POW_1_FN} from '../../web/app/sketcher/constr/polynomial.ts';
for (const mode of ['prepare','solveFine']) test(`external-stage ${mode} must not apply part of a rejected constraint`,()=>{
 const stage={objects:[]};
 const point={stage,id:'p',constraints:new Set(),x:new Param(0),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}};
 const external={stage:{},id:'external',constraints:new Set(),x:new Param(0),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}};
 const sys=new AlgNumSubSystem(()=>100,v=>v,stage);
 const anchor=new AlgNumConstraint({id:'anchor',name:'anchor',defineParamsScope:([p],cb)=>cb(p.y),collectPolynomials:(out,[y])=>out.push(new Polynomial().monomial(1).term(y,POW_1_FN))},[point]);
 const pair=new AlgNumConstraint({id:'pair',name:'pair',defineParamsScope:([p,e],cb)=>{cb(p.x);cb(p.y);cb(e.x);cb(e.y)},collectPolynomials:(out,[x,y,ex,ey])=>{out.push(new Polynomial().monomial(1).term(x,POW_1_FN).monomial(-1).term(ex,POW_1_FN));out.push(new Polynomial().monomial(1).term(y,POW_1_FN).monomial(-1).term(ey,POW_1_FN))}},[point,external]);
 sys.addConstraint(anchor);sys.addConstraint(pair);assert.equal(sys.isConflicting(pair),false);
 external.x.set(1);external.y.set(1);sys[mode]();
 assert.equal(sys.isConflicting(pair),true);assert.ok(Math.abs(point.x.get())<1e-10);assert.ok(Math.abs(point.y.get())<1e-10);
 assert.equal(external.x.get(),1);assert.equal(external.y.get(),1);
 let replays=0;const rebuild=sys.rebuildAdmission;sys.rebuildAdmission=function(...args){replays++;return rebuild.apply(this,args)};
 sys.solveFine();assert.equal(replays,0);assert.ok(Math.abs(point.x.get())<1e-10);assert.ok(Math.abs(point.y.get())<1e-10);
 assert.equal(point.constraints.has(pair),true);
 external.x.set(0);external.y.set(0);sys.solveFine();
 assert.equal(replays,1);
 assert.equal(sys.isConflicting(pair),false);assert.ok(Math.abs(point.x.get())<1e-10);assert.ok(Math.abs(point.y.get())<1e-10);
});

test('external rebuild exception restores geometry and the previous solver',()=>{
 const stage={objects:[]};
 const p={stage,id:'p',constraints:new Set(),x:new Param(0),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}};
 let fail=false;
 const constraint=new AlgNumConstraint({id:'single',name:'single',defineParamsScope:([o],cb)=>cb(o.x),collectPolynomials:(out,[x])=>{if(fail){p.y.set(42);throw Error('injected rebuild failure')}out.push(new Polynomial(-2).monomial(1).term(x,POW_1_FN))}},[p]);
 const sys=new AlgNumSubSystem(()=>100,v=>v,stage);sys.addConstraint(constraint);assert.equal(p.x.get(),2);
 const hint=constraint.admissionHint;fail=true;
 assert.throws(()=>sys.prepare(),/injected rebuild failure/);
 assert.equal(p.x.get(),2);assert.equal(p.y.get(),0);assert.equal(constraint.admissionHint,hint);assert.equal(sys.isConflicting(constraint),false);
 fail=false;sys.solveFine();assert.equal(p.x.get(),2);assert.equal(p.y.get(),0);
});

test('public preparation rejects non-finite output without losing the prior geometry',()=>{
 const stage={objects:[]};
 const p={stage,id:'p',constraints:new Set(),x:new Param(0),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}};
 let corrupt=false;
 const c=new AlgNumConstraint({id:'single',name:'single',defineParamsScope:([o],cb)=>cb(o.x),collectPolynomials:(out,[x])=>{if(corrupt)p.y.set(NaN);out.push(new Polynomial(-2).monomial(1).term(x,POW_1_FN))}},[p]);
 const sys=new AlgNumSubSystem(()=>100,v=>v,stage);sys.addConstraint(c);corrupt=true;
 assert.throws(()=>sys.prepare(),/non-finite/);assert.equal(p.x.get(),2);assert.equal(p.y.get(),0);assert.equal(sys.isConflicting(c),false);
 corrupt=false;sys.solveFine();assert.equal(p.x.get(),2);assert.equal(p.y.get(),0);
});


test('hard-solve reclassification retains dragged parameter preferences',()=>{
 const stage={objects:[]};
 const point={stage,id:'drag',constraints:new Set(),x:new Param(0),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}};
 const follower={stage,id:'follower',constraints:new Set(),x:new Param(0),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}};
 const ext={stage:{},id:'ext',constraints:new Set(),x:new Param(0),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}};
 const sys=new AlgNumSubSystem(()=>100,v=>v,stage);
 const anchor=new AlgNumConstraint({id:'anchor',name:'anchor',defineParamsScope:([p],cb)=>cb(p.y),collectPolynomials:(out,[y])=>out.push(new Polynomial().monomial(1).term(y,POW_1_FN))},[point]);
 const pair=new AlgNumConstraint({id:'pair',name:'pair',defineParamsScope:([p,e],cb)=>{cb(p.x);cb(p.y);cb(e.x);cb(e.y)},collectPolynomials:(out,[x,y,ex,ey])=>{out.push(new Polynomial().monomial(1).term(x,POW_1_FN).monomial(-1).term(ex,POW_1_FN));out.push(new Polynomial().monomial(1).term(y,POW_1_FN).monomial(-1).term(ey,POW_1_FN))}},[point,ext]);
 sys.addConstraint(anchor);sys.addConstraint(pair);
 sys.addConstraint(new AlgNumConstraint(ConstraintDefinitions.PCoincident,[point,follower]));sys.prepare([point]);
 assert.ok(sys.interactiveParams.has(point.x));assert.ok(sys.interactiveParams.has(point.y));
 ext.x.set(1);ext.y.set(1);sys.solveFine();
 assert.equal(sys.isConflicting(pair),true);assert.ok(sys.interactiveParams.has(point.x));assert.ok(sys.interactiveParams.has(point.y));
 assert.ok(Math.abs(point.x.get())<1e-10);assert.ok(Math.abs(point.y.get())<1e-10);
 point.x.set(7);sys.solveFine();assert.ok(Math.abs(point.x.get()-7)<1e-10);assert.ok(Math.abs(follower.x.get()-7)<1e-10);
});
test('reactivation failure restores active geometry and retries safely',()=>{
 const stage={objects:[]};
 const point={stage,id:'p',constraints:new Set(),x:new Param(0),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}};
 const external={stage:{},id:'e',constraints:new Set(),x:new Param(0),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}};
 let fail=false;
 const anchor=new AlgNumConstraint({id:'anchor',name:'anchor',defineParamsScope:([p],cb)=>cb(p.y),collectPolynomials:(out,[y])=>out.push(new Polynomial().monomial(1).term(y,POW_1_FN))},[point]);
 const pair=new AlgNumConstraint({id:'pair',name:'pair',defineParamsScope:([p,e],cb)=>{cb(p.x);cb(p.y);cb(e.x);cb(e.y)},collectPolynomials:(out,[x,y,ex,ey])=>{if(fail){point.x.set(42);throw Error('reactivation failure')}out.push(new Polynomial().monomial(1).term(x,POW_1_FN).monomial(-1).term(ex,POW_1_FN));out.push(new Polynomial().monomial(1).term(y,POW_1_FN).monomial(-1).term(ey,POW_1_FN))}},[point,external]);
 const sys=new AlgNumSubSystem(()=>100,v=>v,stage);sys.addConstraint(anchor);sys.addConstraint(pair);
 external.x.set(1);external.y.set(1);sys.solveFine();assert.equal(sys.isConflicting(pair),true);
 const hint=pair.admissionHint;external.x.set(0);external.y.set(0);fail=true;
 assert.throws(()=>sys.solveFine(),/reactivation failure/);assert.ok(Math.abs(point.x.get())<1e-10);assert.ok(Math.abs(point.y.get())<1e-10);assert.equal(sys.isConflicting(pair),true);assert.equal(pair.admissionHint,hint);assert.equal(external.x.get(),0);assert.equal(external.y.get(),0);
 fail=false;sys.solveFine();assert.equal(sys.isConflicting(pair),false);assert.ok(Math.abs(point.x.get())<1e-10);assert.ok(Math.abs(point.y.get())<1e-10);
});
