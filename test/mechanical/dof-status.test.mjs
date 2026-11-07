import {test} from 'node:test';import assert from 'node:assert/strict';
import {AlgNumConstraint,ConstraintDefinitions as d} from '../../web/app/sketcher/constr/ANConstraints.ts';
import {AlgNumSubSystem} from '../../web/app/sketcher/constr/AlgNumSystem.ts';import {Param} from '../../web/app/sketcher/shapes/param.ts';
test('subsystem reports unknown DOF, while a directly eliminated locked point remains fixed',()=>{
 const stage={objects:[]},p={stage,id:'p',constraints:new Set(),x:new Param(1),y:new Param(2),fullyConstrained:false,visitParams(cb){cb(this.x);cb(this.y)}};
 const sys=new AlgNumSubSystem(()=>100,v=>v,stage);assert.equal(sys.dof,null);assert.equal(sys.fullyConstrained,null);
 const lock=new AlgNumConstraint(d.LockPoint,[p],{x:'1',y:'2'});sys.addConstraint(lock);assert.equal(p.fullyConstrained,true);assert.equal(sys.dof,null);assert.equal(sys.fullyConstrained,null);
});
