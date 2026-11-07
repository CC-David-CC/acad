import assert from 'node:assert/strict';
import {ConstraintDefinitions as definitions,AlgNumConstraint} from '../../web/app/sketcher/constr/ANConstraints.ts';
import {AlgNumSubSystem} from '../../web/app/sketcher/constr/AlgNumSystem.ts';
import {Param} from '../../web/app/sketcher/shapes/param.ts';

// A persisted older sketch may list the explicit point-on-line before midpoint.
// A constraint with one redundant equation must keep its independent equation.
const stage={objects:[]}, external={};
const point={stage,id:'p',constraints:new Set(),x:new Param(5),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}};
const a={x:new Param(-1),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}};
const b={x:new Param(1),y:new Param(0),visitParams(cb){cb(this.x);cb(this.y)}};
const segment={stage:external,id:'s',constraints:new Set(),a,b,params:{ang:new Param(0)},visitParams(cb){a.visitParams(cb);b.visitParams(cb);cb(this.params.ang)}};
const index={p:point,s:segment};
const line=AlgNumConstraint.read(new AlgNumConstraint(definitions.PointOnLine,[point,segment]).write(),index);
const midpoint=AlgNumConstraint.read(new AlgNumConstraint(definitions.PointInMiddle,[point,segment]).write(),index);
const system=new AlgNumSubSystem(()=>100,value=>value,stage);
system.startTransaction();system.addConstraint(line);system.addConstraint(midpoint);system.finishTransaction();system.solveFine();
assert.ok(Math.abs(point.x.get())<1e-7 && Math.abs(point.y.get())<1e-7,'initial solve must produce midpoint');
assert.equal(system.isConflicting(midpoint),false,'a partly redundant midpoint still constrains x');
point.x.set(5);system.invalidate();
assert.ok(Math.abs(point.x.get())<1e-7 && Math.abs(point.y.get())<1e-7,'midpoint survives a rebuild');
system.removeConstraint(line);point.x.set(5);point.y.set(5);system.invalidate();
assert.ok(Math.abs(point.x.get())<1e-7 && Math.abs(point.y.get())<1e-7,'both midpoint equations survive removal of old point-on-line');
console.log('PASS restored line-first midpoint remains enforced after rebuild and removal');
