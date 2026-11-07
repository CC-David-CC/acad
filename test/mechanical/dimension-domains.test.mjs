import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AlgNumConstraint,ConstraintDefinitions as d} from '../../web/app/sketcher/constr/ANConstraints.ts';
import {AlgNumSubSystem} from '../../web/app/sketcher/constr/AlgNumSystem.ts';
import {Param} from '../../web/app/sketcher/shapes/param.ts';
for(const [name,schema] of [['radius',d.RadiusLength],['segment length',d.SegmentLength]])test(`${name} rejects nonpositive and malformed values without changing geometry`,()=>{
 const stage={objects:[]},p=new Param(20),obj={stage,id:'x',constraints:new Set(),r:p,params:{t:p},visitParams(cb){cb(p)}};
 const sys=new AlgNumSubSystem(()=>100,v=>v==='wall'?4:v,stage);
 for(const value of ['-5','0','','NaN','Infinity','5abc']){const c=new AlgNumConstraint(schema,[obj],{length:value},true);assert.throws(()=>sys.addConstraint(c),/positive/);assert.equal(p.get(),20);assert.equal(obj.constraints.has(c),false)}
 const c=new AlgNumConstraint(schema,[obj],{length:'wall'},true);sys.addConstraint(c);assert.equal(p.get(),4);assert.equal(sys.isConflicting(c),false);
});
