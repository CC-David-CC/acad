import assert from 'node:assert/strict';
import {ConstraintDefinitions as definitions, AlgNumConstraint} from '../../web/app/sketcher/constr/ANConstraints.ts';
import {AlgNumSubSystem} from '../../web/app/sketcher/constr/AlgNumSystem.ts';
import {Param} from '../../web/app/sketcher/shapes/param.ts';
import {prepare} from '../../web/app/sketcher/constr/solver.js';
import {Polynomial, POW_1_FN} from '../../web/app/sketcher/constr/polynomial.ts';

function equations(kind, values) {
  const params = values.map(v => new Param(v));
  const polys = [];
  definitions[kind].collectPolynomials(polys, params);
  return {params, polys};
}
function residuals(kind, values) {
  return equations(kind, values).polys.map(poly => poly.value());
}
for (const kind of ['PointInMiddle', 'Symmetry']) {
  assert.deepEqual(residuals(kind, [-1, 0, 0, 5, 1, 0]), [0, 10], `${kind} must reject a non-midpoint on the perpendicular bisector`);
  assert.deepEqual(residuals(kind, [-1, 0, 0, 0, 1, 0]), [0, 0]);
  assert.deepEqual(residuals(kind, [2, -3, 4, 1, 6, 5]), [0, 0]);
  assert.deepEqual(residuals(kind, [7, -4, 7, -4, 7, -4]), [0, 0]);
  const {params, polys} = equations(kind, [-1, 0, 0, 5, 1, 0]);
  for (const poly of polys) {
    const residual = poly.asResidual();
    const gradient = [];
    residual.gradient(gradient);
    for (const [i, solverParam] of residual.params.entries()) {
      const paramIndex = params.indexOf(solverParam.objectParam);
      assert.equal(gradient[i], paramIndex === 2 || paramIndex === 3 ? 2 : -1, 'exact linear derivative');
    }
  }
  for (const index of [0, 1, 4, 5]) params[index].solverParam.constant = true;
  const solver = prepare(polys.map(p => p.asResidual()), []);
  const result = solver.solveSystem(false);
  assert.ok(result.success, `${kind} solver must converge`);
  assert.ok(Math.abs(params[2].solverParam.get()) < 1e-7);
  assert.ok(Math.abs(params[3].solverParam.get()) < 1e-7);
}
// An older saved sketch may explicitly include PointOnLine in addition to
// PointInMiddle. Exercise the actual subsystem's conflict classification.
const stage = {objects: []};
const p = {stage, id: 'p', constraints: new Set(), x: new Param(0), y: new Param(5), visitParams(cb) {cb(this.x); cb(this.y);}};
const external = {};
const a = {x: new Param(-1), y: new Param(0), visitParams(cb) {cb(this.x); cb(this.y);}};
const b = {x: new Param(1), y: new Param(0), visitParams(cb) {cb(this.x); cb(this.y);}};
const segment = {stage: external, id: 's', constraints: new Set(), a, b, params: {ang: new Param(0)}, visitParams(cb) {a.visitParams(cb); b.visitParams(cb); cb(this.params.ang);}};
const midpoint = new AlgNumConstraint(definitions.PointInMiddle, [p, segment]);
const line = new AlgNumConstraint(definitions.PointOnLine, [p, segment]);
const restoredMidpoint = AlgNumConstraint.read(midpoint.write(), {p, s: segment});
assert.equal(restoredMidpoint.schema.id, 'PointInMiddle');
assert.deepEqual(restoredMidpoint.objects, [p, segment]);
const system = new AlgNumSubSystem(() => 100, value => value, stage);
system.startTransaction(); system.addConstraint(midpoint); system.addConstraint(line); system.finishTransaction(); system.solveFine();
assert.ok(system.solveStatus.success, 'existing point-on-line and midpoint sketch should remain solvable');
assert.ok(Math.abs(p.x.get()) < 1e-7 && Math.abs(p.y.get()) < 1e-7, 'combined constraints preserve midpoint');
assert.equal(system.redundant.has(line), true, 'the old extra line constraint is reported as redundant');
system.removeConstraint(midpoint);
assert.equal(system.isConflicting(line), false, 'removing midpoint reactivates the retained line constraint');
p.x.set(4); p.y.set(5); system.invalidate();
assert.ok(Math.abs(p.y.get()) < 1e-7, 'reactivated point-on-line still constrains y');
assert.ok(Math.abs(p.x.get() - 4) < 1e-7, 'point remains free along the supporting line');
// A single implied equation must not discard the independent equation from
// a multi-equation constraint, regardless of serialized constraint order.
for (const prerequisite of ['x-only', 'line-first']) {
  p.x.set(0); p.y.set(5);
  const partial = new AlgNumSubSystem(() => 100, value => value, stage);
  const first = prerequisite === 'line-first' ? new AlgNumConstraint(definitions.PointOnLine, [p, segment]) : new AlgNumConstraint({
    id: 'OnlyX', name: 'Only X',
    defineParamsScope: ([point], cb) => cb(point.x),
    collectPolynomials: (out, [x]) => out.push(new Polynomial().monomial(1).term(x, POW_1_FN)),
  }, [p]);
  const second = new AlgNumConstraint(definitions.PointInMiddle, [p, segment]);
  partial.startTransaction(); partial.addConstraint(first); partial.addConstraint(second); partial.finishTransaction(); partial.solveFine();
  assert.equal(partial.isConflicting(second), false, `${prerequisite}: midpoint must remain active`);
  assert.ok(Math.abs(p.x.get()) < 1e-7 && Math.abs(p.y.get()) < 1e-7);
  p.x.set(5); p.y.set(5); partial.invalidate();
  assert.ok(Math.abs(p.x.get()) < 1e-7 && Math.abs(p.y.get()) < 1e-7, `${prerequisite}: midpoint survives rebuild`);
}
// A genuinely inconsistent midpoint must be reconsidered once the
// contradictory point lock is removed, rather than remaining disabled.
p.x.set(0); p.y.set(2);
const conflictSystem = new AlgNumSubSystem(() => 100, value => value, stage);
const lock = new AlgNumConstraint(definitions.LockPoint, [p], {x: '0', y: '2'});
const conflictingMidpoint = new AlgNumConstraint(definitions.PointInMiddle, [p, segment]);
conflictSystem.startTransaction(); conflictSystem.addConstraint(lock); conflictSystem.addConstraint(conflictingMidpoint); conflictSystem.finishTransaction(); conflictSystem.solveFine();
assert.equal(conflictSystem.isConflicting(conflictingMidpoint), true, 'inconsistent midpoint is detected');
assert.equal(conflictSystem.redundant.has(conflictingMidpoint), false, 'inconsistency is not redundancy');
conflictSystem.removeConstraint(lock);
p.x.set(5); p.y.set(5); conflictSystem.invalidate();
assert.equal(conflictSystem.isConflicting(conflictingMidpoint), false, 'removing contradiction reactivates midpoint');
assert.ok(Math.abs(p.x.get()) < 1e-7 && Math.abs(p.y.get()) < 1e-7, 'reactivated midpoint is enforced');
console.log('PASS midpoint equations, conflict recovery, redundancy handling, saved order and repeated solve');
