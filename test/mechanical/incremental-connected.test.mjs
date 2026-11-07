import assert from 'node:assert/strict';
import {ConstraintDefinitions as d,AlgNumConstraint} from '../../web/app/sketcher/constr/ANConstraints.ts';
import {AlgNumSubSystem} from '../../web/app/sketcher/constr/AlgNumSystem.ts';
import {Param} from '../../web/app/sketcher/shapes/param.ts';
const point=(stage,id,x,y)=>({stage,id,constraints:new Set(),x:new Param(x),y:new Param(y),visitParams(cb){cb(this.x);cb(this.y)}});
for(const count of [10,50,100]) {
 const start=performance.now(),stage={objects:[]},p=Array.from({length:count},(_,i)=>point(stage,'p'+i,i+1,-i-1)),sys=new AlgNumSubSystem(()=>100,v=>v,stage);
 const lock=new AlgNumConstraint(d.LockPoint,[p[0]],{x:'0',y:'0'}),links=p.slice(1).map((v,i)=>new AlgNumConstraint(d.PCoincident,[p[i],v]));
 sys.startTransaction();for(const c of [lock,...links])sys.addConstraint(c);sys.finishTransaction();sys.solveFine();
 assert.ok(p.every(v=>Math.abs(v.x.get())<1e-7&&Math.abs(v.y.get())<1e-7),'connected chain enforced after bulk admission');
 const bad=new AlgNumConstraint(d.LockPoint,[p.at(-1)],{x:'3',y:'0'}),next=new AlgNumConstraint(d.LockPoint,[p.at(-1)],{x:'4',y:'0'});
 sys.addConstraint(bad);sys.addConstraint(next);
 assert.ok(sys.isConflicting(bad)&&sys.isConflicting(next),'conflicting locks excluded');
 assert.ok(p.every(v=>Math.abs(v.x.get())<1e-7&&Math.abs(v.y.get())<1e-7),'rejected additions do not move the chain');
 assert.ok(p.at(-1).constraints.has(bad)&&p.at(-1).constraints.has(next),'retained conflicts remain linked for object deletion');
 // Simulate serialization/read before removing the original accepted lock.
 const index=Object.fromEntries(p.map(v=>[v.id,v]));const restored=[lock,...links,bad,next].map(c=>AlgNumConstraint.read(c.write(),index));
 const reload=new AlgNumSubSystem(()=>100,v=>v,stage);reload.startTransaction();for(const c of restored)reload.addConstraint(c);reload.finishTransaction();reload.solveFine();
 assert.equal(reload.isConflicting(restored.at(-2)),true);assert.equal(reload.isConflicting(restored.at(-1)),true);
 reload.removeConstraint(restored[0]);
 assert.equal(reload.isConflicting(restored.at(-2)),false,'earlier previously-conflicting lock wins after removal');assert.equal(reload.isConflicting(restored.at(-1)),true,'later contradictory lock stays conflicting');
 assert.ok(p.every(v=>Math.abs(v.x.get()-3)<1e-7&&Math.abs(v.y.get())<1e-7),'priority is reflected through entire connected chain');
 console.log(JSON.stringify({count,elapsedMs:Math.round(performance.now()-start),status:'pass'}));
}
