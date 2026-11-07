import assert from 'node:assert/strict';
import {ConstraintDefinitions as d,AlgNumConstraint} from '../../web/app/sketcher/constr/ANConstraints.ts';
import {AlgNumSubSystem} from '../../web/app/sketcher/constr/AlgNumSystem.ts';
import {Param} from '../../web/app/sketcher/shapes/param.ts';
function fixture(){
 const stage={objects:[]},fixed={},p={stage,id:'p',constraints:new Set(),x:new Param(0),y:new Param(2),visitParams(cb){cb(this.x);cb(this.y)}},q={stage,id:'q',constraints:new Set(),x:new Param(1),y:new Param(1),visitParams(cb){cb(this.x);cb(this.y)}};
 const a={x:new Param(-1),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}},b={x:new Param(1),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}};
 const seg={stage:fixed,id:'s',constraints:new Set(),a,b,params:{ang:new Param(0)},visitParams(cb){a.visitParams(cb);b.visitParams(cb);cb(this.params.ang)}};
 const lock=new AlgNumConstraint(d.LockPoint,[p],{x:'0',y:'2'}),mid=new AlgNumConstraint(d.PointInMiddle,[p,seg]);
 const system=new AlgNumSubSystem(()=>100,v=>v,stage);
 return {p,q,lock,mid,system};
}
{
 const {p,q,lock,mid,system}=fixture();const unrelated=new AlgNumConstraint(d.LockPoint,[q],{x:'1',y:'1'});
 system.startTransaction();for(const c of [lock,mid,unrelated])system.addConstraint(c);system.finishTransaction();system.solveFine();
 assert.equal(system.conflicting.has(mid),true,'inconsistent midpoint must be marked conflicting');assert.equal(system.redundant.has(mid),false,'one zero equation does not make a contradiction redundant');
 system.removeConstraint(unrelated);
 assert.equal(system.conflicting.has(mid),true,'removing an unrelated constraint must not hide the remaining real conflict');assert.equal(p.y.get(),2);
 system.removeConstraint(lock);p.x.set(5);p.y.set(5);system.invalidate();
 assert.equal(system.conflicting.has(mid),false,'removing conflicting lock must reactivate midpoint');assert.ok(Math.abs(p.x.get())<1e-7&&Math.abs(p.y.get())<1e-7);
}
{
 const {p,lock,mid,system}=fixture();const other=new AlgNumConstraint(d.LockPoint,[p],{x:'0',y:'3'});
 system.startTransaction();for(const c of [lock,mid,other])system.addConstraint(c);system.finishTransaction();system.solveFine();
 assert.equal(system.conflicting.has(mid),true);assert.equal(system.conflicting.has(other),true);
 system.removeConstraint(lock);p.x.set(5);p.y.set(5);system.invalidate();
 assert.equal(system.conflicting.has(mid),false,'first compatible relation reactivates');assert.equal(system.conflicting.has(other),true,'incompatible remaining lock must stay conflicting');assert.ok(Math.abs(p.x.get())<1e-7&&Math.abs(p.y.get())<1e-7);
}
console.log('PASS conflict removal revalidation and simultaneous-conflict handling');
