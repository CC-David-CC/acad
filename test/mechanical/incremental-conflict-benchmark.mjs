import {performance} from 'node:perf_hooks';
import {AlgNumConstraint, ConstraintDefinitions as defs} from '../../web/app/sketcher/constr/ANConstraints.ts';
import {AlgNumSubSystem} from '../../web/app/sketcher/constr/AlgNumSystem.ts';
import {Param} from '../../web/app/sketcher/shapes/param.ts';
for(const n of [100,500]){
 const stage={objects:[]},s=new AlgNumSubSystem(()=>100,v=>v,stage),items=[];
 for(let i=0;i<n;i++){const o={stage,id:'p'+i,x:new Param(i),y:new Param(i),constraints:new Set(),visitParams(cb){cb(this.x);cb(this.y)}};const c=new AlgNumConstraint(defs.LockPoint,[o],{x:String(i),y:String(i)});c.stage={index:0};items.push(c)}
 const original=items[0].objects[0];items.push(new AlgNumConstraint(defs.LockPoint,[original],{x:'1000',y:'1000'}));let t=performance.now();s.startTransaction();for(const c of items)s.addConstraint(c);s.finishTransaction();const load=performance.now()-t;
 const newobj={stage,id:'added',x:new Param(5),y:new Param(5),constraints:new Set(),visitParams(cb){cb(this.x);cb(this.y)}};const added=new AlgNumConstraint(defs.LockPoint,[newobj],{x:'5',y:'5'});
 t=performance.now();s.addConstraint(added);const add=performance.now()-t;t=performance.now();s.removeConstraint(added);const remove=performance.now()-t;
 console.log(JSON.stringify({constraints:n,loadMs:Math.round(load),addMs:Math.round(add),removeMs:Math.round(remove),note:'one contradictory point lock'}));
}
