import {mapRigidPoints,readRigidGroupRecord} from './rigidGroupPlan.mjs';

// Independent post-solve geometric check. Numerical success/admission alone
// has accepted inconsistent geometry in a real solver feasibility probe.
export function rigidGroupValid(group, members, tolerance = 1e-6) {
  try {
    if (!group || !Array.isArray(members) || members.length !== group.members.length || !Number.isFinite(tolerance) || tolerance <= 0) return false;
    // Publication must satisfy the same detached record and transformed
    // world-coordinate limits as native strict serialization and reload.
    const record = readRigidGroupRecord(group.id, group.write());
    const expected = mapRigidPoints(record);
    return members.every((segment, i) => {
      const authored=group.members[i], a=expected[2*i], b=expected[2*i+1];
      return segment?.TYPE === 'Segment' && segment.id === authored.id && segment.a.id === authored.a && segment.b.id === authored.b &&
        [segment.a.x,segment.a.y,segment.b.x,segment.b.y].every(value=>Number.isFinite(value)&&Math.abs(value)<=1e6) &&
        Math.hypot(segment.a.x-a.x,segment.a.y-a.y) <= tolerance && Math.hypot(segment.b.x-b.x,segment.b.y-b.y) <= tolerance &&
        Number.isFinite(segment.params.ang.get()) && Number.isFinite(segment.params.t.get()) &&
        Math.hypot(segment.b.x-segment.a.x-segment.params.t.get()*Math.cos(segment.params.ang.get()),
          segment.b.y-segment.a.y-segment.params.t.get()*Math.sin(segment.params.ang.get())) <= tolerance;
    });
  } catch (_) { return false; }
}

// Same fresh-polynomial tolerances as headless solve; this is deliberately
// bounded to this operation and verifies all retained stage constraints.
export function assertRigidStageValid(stage, group, members) {
  const system=stage?.algNumSystem;
  if (!system || system.allConstraints.length > 6000 || !rigidGroupValid(group,members)) throw Error('Invalid rigid geometry');
  assertRetainedStageValid(stage);
}

export function assertRetainedStageValid(stage, {skipRejected=false} = {}) {
  const system=stage?.algNumSystem;
  if (!system || system.allConstraints.length > 6000) throw Error('Rigid constraint check exceeds its limit');
  let count=0;
  for (const constraint of system.allConstraints) {
    if (system.conflicting.has(constraint) && !system.redundant.has(constraint)) {
      if (skipRejected) continue;
      throw Error('A retained constraint is rejected');
    }
    const equations=[];
    constraint.collectPolynomials(equations);
    count += equations.length;
    if (count > 65536) throw Error('Rigid constraint check exceeds its limit');
    const tolerance=constraint.schema.id==='Horizontal'||constraint.schema.id==='Vertical' ? 1e-8 : 1e-6;
    if (equations.some(equation => !Number.isFinite(equation.value()) || Math.abs(equation.value()) > tolerance)) throw Error('A retained constraint residual is invalid');
  }
}
