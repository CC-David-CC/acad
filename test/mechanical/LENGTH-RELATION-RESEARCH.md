# Length measurement relations — research

This branch implements one simultaneous relation, `length(A) = factor *
length(B) + offset`, with a dimensionless nonnegative factor and a signed
millimeter offset. Equality is factor 1 / offset 0; proportionality has offset
0; difference uses factor 1. The variables remain in the simultaneous solve:
this does not read B once and replace A with a numeric assignment.

The existing EqualLength schema uses the same physical-magnitude equation.
Segment's internal polar length can be negative without changing its geometric
length. Comparing signed polar values can unnecessarily change orientation;
these equations use magnitudes and preserve the accepted sign branch where
the solver can do so. No equation is squared, so a signed offset cannot acquire
an additional solution through squaring. At zero magnitude the absolute value
is nondifferentiable; failed convergence is a failure to establish a solution,
not a general proof of inconsistency. Geometry representability remains a
separate domain check.

Nine Node/bundled real-solver controls pass: equality/ratio/difference, negative
polar gauges, existing EqualLength, downstream numeric propagation, rejected
contradiction, strict finite constants, serialized relation recovery, native
headless regeneration and refusal of an impossible negative resulting length
without mutating input. Native fixtures include required SegmentLength
annotation records; an initial malformed fixture omitted one and failed during
load, before solving. That failure was not evidence of a relation defect.

Commands (Node 24, installed repository dependencies):

```sh
node node_modules/webpack/bin/webpack.js --config test/mechanical/webpack.length-relation.config.cjs
node /tmp/codi-length-relation-tests/length.cjs
node node_modules/typescript/bin/tsc --noEmit
```

The Node headless fixture supplies import-time environment shims for inherited
modules. It draws no canvas and performs no UI interaction. It is not an actual
browser Worker, signed desktop, GUI, phone or broad solver qualification. Those
and EqualLength interaction/history regressions remain required before lead
integration. The schema is registered for native/headless solving only; shared
selection/ID operations and an interface are still missing. General angle and
other typed-measurement relations and driving/reference role conversion remain
open. This is one component of M03, not completion of that gate.

## Integrated length slice, 2026-11-05

The selected-segment action and revision-bound ID command now use the same transactional `addLengthRelation` operation. The first selected segment is A and the second is B; factor is dimensionless and offset is millimeters. Inspection describes existing relations as driving and observed segment lengths as reference measurements. The existing Measure Distance tool is labeled reference-only. In Chromium, an actual pointer-created reference measurement had the expected length and left the solver constraint count and segment coordinates unchanged. This does not claim a rank-aware DOF measurement or reference/driving promotion or demotion.

The actual browser test selects segments, types a 2:1 plus 5 mm relation through the contextual UI, verifies the changed physical equation, strict sketch serialization, undo/redo, rejection and history preservation for a contradictory relation, and invokes the same operation by inspected IDs. It checks single-use, an in-place change, change-and-restore ABA, hidden segment-parameter ABA, a reentrant lifetime callback and ordinary redraw. It sends the UI-authored sketch to the actual rebuilt Worker; a test-only empty boundary is supplied for the blank plane. A separate actual Worker test solves an existing EqualLength action, now explicitly included in the worker's supported signature. Existing grouped EqualLength/EqualRadius/Coincident action/history tests pass. Independent real-solver controls include different initial signed gauges, duplicate redundancy versus contradiction and scales 1e-6 through 1e6; the zero case proves only finite internal values, not valid degenerate geometry. Duplicate equations in an underconstrained system can be admitted as accepted where redundancy is not proven; this is not a rank classification.

The shared revision guard carries the peer's 28e25392/447b60d2/6530b8c7 epoch follow-ups alongside bounded exact serialization. It is conservative across sketch instances and retains the exact snapshot: it is not a complete mutation epoch for every possible sketch object. Capture/verify and history checkpoint still perform bounded serialization on the UI thread. Large-sketch responsiveness and the complete M02/M03 solver/measurement scope remain open.

Private R730 build `/mnt/data10tb/codi-length-relation-20261105` used Node 24, private dependencies, `CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1`, `npm run build:sketch-worker`, `npm run build:project-worker`, webpack, and `tsc --noEmit`. App SHA-256 `f14cecb03b9ca82db35e48c02c6a1c4df2d2e4ada7f7efe078019b9993bc2660`; sketch Worker `1b356d2623a338072f504169fd7c00e0f9e67fb24efdf0fc4e35bd29f670a20f`; project Worker `0133ef03aa716083a83c9dfe28934d03f50841624116f220b778189c4defbf51`. The browser controls used loopback plain HTTP; see the separate desktop signed receipt for the strict-CSP account test. Neither is a production deployment.
