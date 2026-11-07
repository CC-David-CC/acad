// Original failed-add regressions; included in webpack.atomic.config.cjs.
// Passing proves these subsystem cases, not all UI/document transactions.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {AlgNumConstraint} from '../../web/app/sketcher/constr/ANConstraints.ts';
import {AlgNumSubSystem} from '../../web/app/sketcher/constr/AlgNumSystem.ts';
import {Param} from '../../web/app/sketcher/shapes/param.ts';
import {Polynomial, POW_1_FN} from '../../web/app/sketcher/constr/polynomial.ts';

function fixture(includeXInOldScope=false){
 const stage={objects:[]}, p={stage,id:'p',constraints:new Set(),x:new Param(0),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}};
 const old=new AlgNumConstraint({id:'OldY',name:'Old Y',defineParamsScope:([o],cb)=>{if(includeXInOldScope)cb(o.x);cb(o.y)},collectPolynomials:(out,params)=>out.push(new Polynomial().monomial(1).term(params.at(-1),POW_1_FN))},[p]);
 const bad=new AlgNumConstraint({id:'BadPair',name:'Inconsistent Pair',defineParamsScope:([o],cb)=>{cb(o.x);cb(o.y)},collectPolynomials:(out,[x,y])=>{out.push(new Polynomial(-1).monomial(1).term(x,POW_1_FN));out.push(new Polynomial(-1).monomial(1).term(y,POW_1_FN));}},[p]);
 const system=new AlgNumSubSystem(()=>100,v=>v,stage);system.addConstraint(old);
 return {p,system,old,bad};
}

test('a rejected multi-equation constraint preserves previously unconstrained coordinates',()=>{
 const {p,system,bad}=fixture();system.addConstraint(bad);
 assert.equal(system.isConflicting(bad),true);
 assert.ok(Math.abs(p.x.get())<1e-10 && Math.abs(p.y.get())<1e-10, `geometry changed: ${p.x.get()}, ${p.y.get()}`);
});

test('a later solve cannot apply a sibling equation from a rejected constraint',()=>{
 const {p,system,bad}=fixture(true);system.addConstraint(bad);
 assert.equal(system.isConflicting(bad),true);
 // Check the stale solver directly even if the initial state is already wrong.
 system.solveFine();
 assert.ok(Math.abs(p.x.get())<1e-10 && Math.abs(p.y.get())<1e-10, `geometry changed after solve: ${p.x.get()}, ${p.y.get()}`);
});

test('a formerly conflicting constraint that is reactivated links to its objects',()=>{
 const {p,system,old,bad}=fixture();system.addConstraint(bad);system.removeConstraint(old);
 assert.equal(system.isConflicting(bad),false);
 assert.deepEqual([p.x.get(),p.y.get()],[1,1]);
 assert.ok(p.constraints.has(bad),'reactivated constraint must be discoverable for object deletion');
});

test('rejected multi-equation effects cannot make an independent later constraint conflicting',()=>{
 for(const order of ['bad-first','good-first']){
  const stage={objects:[]},p={stage,id:'p',constraints:new Set(),x:new Param(0),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}};
  const fixed=(id,axis,value)=>new AlgNumConstraint({id,name:id,defineParamsScope:([point],cb)=>cb(point[axis]),collectPolynomials:(out,[v])=>out.push(new Polynomial(-value).monomial(1).term(v,POW_1_FN))},[p]);
  const existing=fixed('ExistingX','x',0),good=fixed('IndependentY','y',0);
  const bad=new AlgNumConstraint({id:'BadPair',name:'Bad Pair',defineParamsScope:([point],cb)=>{cb(point.x);cb(point.y)},collectPolynomials:(out,[x,y])=>{out.push(new Polynomial(-3).monomial(1).term(x,POW_1_FN));out.push(new Polynomial(-10).monomial(1).term(y,POW_1_FN));}},[p]);
  const system=new AlgNumSubSystem(()=>100,v=>v,stage);system.startTransaction();
  for(const constraint of order==='bad-first'?[existing,bad,good]:[existing,good,bad])system.addConstraint(constraint);
  system.finishTransaction();system.solveFine();
  assert.equal(system.isConflicting(bad),true,order+': incompatible constraint must be identified');
  assert.equal(system.isConflicting(good),false,order+': independent valid constraint must remain active');
  assert.ok(Math.abs(p.x.get())<1e-10 && Math.abs(p.y.get())<1e-10,order+': rejected sibling equation moved geometry');
 }
});
