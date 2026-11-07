import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {AlgNumConstraint, ConstraintDefinitions as d} from '../../web/app/sketcher/constr/ANConstraints.ts';
import {AlgNumSubSystem} from '../../web/app/sketcher/constr/AlgNumSystem.ts';
import {Param} from '../../web/app/sketcher/shapes/param.ts';
// Interconnected graph with cycles and a conflicting endpoint: not a claim of
// representative performance for arbitrary nonlinear or real-world sketches.
for (const count of [30,100,250]) {
const stage={objects:[]},sys=new AlgNumSubSystem(()=>100,v=>v,stage);
const p=Array.from({length:count},(_,i)=>({stage,id:'p'+i,x:new Param(i),y:new Param(-i),constraints:new Set(),visitParams(cb){cb(this.x);cb(this.y)}}));
const lock=new AlgNumConstraint(d.LockPoint,[p[0]],{x:'0',y:'0'});
const links=[];for(let i=1;i<p.length;i++){links.push(new AlgNumConstraint(d.PCoincident,[p[i-1],p[i]]));if(i>1)links.push(new AlgNumConstraint(d.PCoincident,[p[0],p[i]]))}
const bad=new AlgNumConstraint(d.LockPoint,[p.at(-1)],{x:'2',y:'0'});
let t=performance.now();sys.startTransaction();for(const c of [lock,...links,bad])sys.addConstraint(c);sys.finishTransaction();const load=performance.now()-t;
assert.equal(sys.isConflicting(bad),true);assert.ok(p.every(q=>Math.abs(q.x.get())<1e-7&&Math.abs(q.y.get())<1e-7));
t=performance.now();sys.removeConstraint(bad);const remove=performance.now()-t;sys.solveFine();
assert.ok(p.every(q=>Math.abs(q.x.get())<1e-7&&Math.abs(q.y.get())<1e-7));
console.log(JSON.stringify({points:p.length,links:links.length,loadMs:Math.round(load),removeMs:Math.round(remove),case:'connected cycles, redundant links and a conflicting endpoint'}));
}
