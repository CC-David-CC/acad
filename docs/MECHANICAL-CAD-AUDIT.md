# Mechanical CAD capability audit and roadmap

## Qualified combined slices — 2026-11-05

Runtime CAD `b2a66ca86` / desktop `82bef8323` passes scoped actual-editor atomic
rejection, stale-dialog refusal/retry, valid edits, undo/redo and native restore.
The earlier bfc existing-dimension counterexample is fixed within this path.
Actual close faults release history, editor/context streams, subscriptions and
picking; reentry during exit is refused and clean reopen/resize work. Signed
explicit centered-hole parent repair, configurations, material review,
Save/fresh Files reopen, account isolation, held-Worker close and independently
checked core3MF pass. Thirteen affected carried browser/engine controls pass;
thin-intersection results still differ between OCC and Native Mesh, so no
engine-equivalence claim is made.

Exact source/runtime pins, commands, failure controls and limits are in desktop
`tests/jsketcher-combined-core-b2a-20261105.md`,
`tests/jsketcher-parent-repair-signed-20261105.md` and
`tests/jsketcher-b2-carried-regressions-20261105.md`. Earlier b3/configuration
receipts retain their scope; no new deployment is claimed.

Near-1MiB history passes, with relation invocations 14.7–17.3ms, but undo still
produces a 403ms task/461ms heartbeat. Full worker-first capture and complete
mutation coverage remain open. Audit identifies Concentric retaining a rejected
row and Diameter's separate transaction/hash guard as the next bounded checks.
Truthful readonly local solver diagnostics remain research. General rejected-edit
preservation, arbitrary reference repair, complete CAD1, physics and final beta
are not established. Packaging stays deferred until functional gates qualify.

## Earlier operational notes (superseded by current checkpoint)

The bounded Files foundation is accepted; CAD is active. Use the desktop
repository's `docs/CAD-FUNCTIONAL-GATES.md` for the current ordered gates.
Sketch identity/replay, bracket replay/ordinary Save reliability, remaining
mechanical/parameter/shared-operation coverage and final app qualification
remain open. Fix `a22859f5` passes focused/strict-IO and owner rebuilt spline
browser tests; corrupted duplicate-ID samples remain rejected. Intermittent
bracket traces include browser request delivery stalls before native execution;
their cause is not yet established. Do not assume a native kernel hang.
Source packaging is deferred until functional gates qualify. Historical audit
findings below are starting points, not a new list of unimplemented features.

## Current regression checkpoint — 2026-11-04

The source audit below is historical, not current failure status.
A follow-up at `3022317d` rebuilt `test/mechanical/webpack.config.cjs`:
midpoint equations/order/removal assertions and all 27 registered tests passed.
Some external-stage controls repeat through the independent-recovery fixture;
27 is not a unique-capability count. The two parameter-formulas tests also pass
ordered/forward references, scale changes, missing names and dependency cycles.
They do not prove typed physical units or full feature propagation.
 At integrated
`c9e76b84`, root rebuilt `test/mechanical/webpack.atomic.config.cjs` and ran
`/tmp/codi-jsketcher-atomic-admission-tests/atomic.cjs`: all 16 tests passed,
including the four originally failing add regressions, exception/removal/bulk
rollback, real point-on-line/lock removal and reload, accepted-priority native
serialization and external-stage reclassification. Build took about 2 seconds;
reported test duration was 32 ms on this machine. This is actual solver-subsystem
evidence, not a full-app or broad performance benchmark. The historical claim
that these four tests remain failing is superseded. Remaining mechanical,
full-app and manufacturing gates are not closed by this result.


Latest user direction, 2026-11-04: every JSketcher feature is suspect and is
reference/inspiration. Reuse requires explicit mathematical semantics and
independent acceptance evidence; preserving inherited behavior or architecture
is not a requirement. Scoped tests below do not grant trust to adjacent domains.
Later physics/material/automation contracts inform current core boundaries, but
stubs and planned features remain unqualified. The desktop repository's Gate 1
and core-separation documents govern the current foundation.

Source audit of the integrated WebOS candidate at `518a4666`, 2026-11-02. These are source findings and scoped tests, not a claim that either geometry engine or every feature is qualified. The first acceptance targets are an editable mounting bracket and a fitted enclosure/lid; advanced curves, assemblies and specialty workflows follow. A candidate midpoint correction is being tested separately and is not deployable yet: the independent solver regression below remains unresolved.

## Contracts and existing capabilities

A constraint must state its selected entity types, geometric measurement, unit/dimension, sign and orientation, finite or supporting domain, branch/contact choice, and behavior for degenerate geometry. It must persist authored references and choices. An algebraic solution alone does not establish that the selected finite entities touch or that the intended branch survived an edit.

| Requirement | Current source evidence and boundary | Priority |
| --- | --- | --- |
| Point at midpoint | `web/app/sketcher/constr/ANConstraints.ts`, `PointInMiddle`, currently equates endpoint distances; it permits any point on the perpendicular bisector. `Symmetry` adds point-on-line and is midpoint symmetry, not reflection about a selected axis. Correct midpoint is `2P=A+B`, two coordinate equations. Existing sketches may contain both midpoint and point-on-line; changing the former makes the latter redundant, so deletion, save/reopen and revalidation matter. | Correct semantics first |
| Signed X/Y and projected distances | `actions/measureActions.js`, `tools/dim.js` and `shapes/dim.js` provide reference measurements; they are not driving signed-offset constraints. A projected distance needs a selected direction and a contract for a moving direction. | Mechanical foundation |
| Diameter and concentric | `RadiusLength` drives a radius. At the audited baseline, the circle measurement action said diameter but its renderer labels and displays radius. The research branch relabels that reference-only command as Measure Radius; it does not implement a driving diameter. Coinciding centers may be possible via point coincidence, but there is no dedicated circle/arc concentric command. Preserve diameter intent while using `D=2r`. | Mechanical foundation |
| Collinear, fix, rigid group | Existing `Parallel` and `PointOnLine` can express a supporting-line relationship through separate constraints; no dedicated collinear action was found. `LockPoint` fixes a point, not a whole entity. No rigid-block action/schema was found. A free rigid group must retain two translations and one rotation. | Mechanical foundation |
| Axis symmetry | Existing `Symmetry` uses a point and a segment as midpoint symmetry. Reflection across an independently selected axis is a distinct relationship; define axis, contact/domain and degeneracy behavior explicitly. | Mechanical foundation |
| Equal, ratio and difference | `EqualLength` and `EqualRadius` are solver constraints; `AngleBetween` drives a constant. General relationships among geometric measurements are not exposed. A typed measurement/relation model can support equality, ratios and offsets without reading a measured value and feeding it back in an order-dependent loop. Convenient commands can reuse the same model. | Mechanical foundation |
| Point on line/circle | `PointOnLine` uses an infinite supporting line. `PointOnCircle` uses center and radius even for an arc; it does not constrain the arc sweep. Both are useful but must not be labeled as finite contact. | Correct semantics first |
| Tangency and curves | Segment–circle/arc `TangentLC` uses the infinite line and full circle, with `inverted` recording line side; it does not prove contact within the visible segment or arc. Cubic Bézier contact uses a softly bounded internal parameter; persistence of the contact branch and behavior at a zero derivative are not established. `PointOnEllipse` is used internally for elliptical-arc endpoints, but is not a general public ellipse-contact action. No public B-spline tangent/normal action was found. See `ANConstraints.ts`, `barriers.js`, `shapes/elliptical-arc.js` and `actions/constraintActions.js`. | Curve phase after mechanics |
| Reference vs driving | Reference dimensions and solver constraints are different object types; there is no qualified promotion/demotion workflow. A reference dimension must not remove degrees of freedom. | Parameter phase |
| Parameters and units | WebOS uses the bounded parsed arithmetic evaluator in `modules/gems/safeExpression.mjs`; standalone feature expressions retain an `eval` path in `web/app/cad/expressions/expressionsBundle.ts`. Definitions are evaluated in order, without a qualified dependency graph, unit types or cycle/forward-reference handling. Sketch-local invalid definitions can be swallowed in `parametric.ts`. A possible WebOS boolean-constant incompatibility is source/parser evidence only and needs a complete tangent/distance UI regression. | Parameter phase |
| Solver status | `AlgNumSystem.ts` calculates isolation DOF as parameter count minus polynomial count; its subsystem `dof` is initialized to zero with no observed later assignment. `solver.js` contains QR-based diagnosis, but no sketcher call site was found. A count is not Jacobian rank, especially at singular configurations. Distinguish underconstrained, locally fully constrained, redundant, inconsistent, degenerate, failed to converge and ambiguous branch; do not describe failed convergence as proof of impossibility. | Correct semantics first |
| Branches and tolerance | `DistancePL` and `TangentLC` retain selected line-side information; angle relationships choose branches from geometry. These are not a complete contract for directed angles, arc sweep, internal/external tangency, or degenerate curves. Absolute thresholds vary across tolerance, QR and LM code; test model scale and near-degeneracy. Separate numerical tolerance, design bounds and manufacturing tolerances. | Correct semantics first |

## Blocking solver regression found during midpoint testing

With a valid `y=0` relationship, adding a two-equation constraint that requires both `x=1` and `y=1` correctly marks the new relationship conflicting, but its `x=1` equation can still move the point. A subsequent solve can reapply the rejected equation. A constraint that is later reactivated may also be absent from its objects' constraint backlinks. These failures were reproduced with the actual algebraic/numeric subsystem in `test/mechanical/failed-add-regression.test.mjs`, and an independent clean `518a4666` checkout reproduced all four; a separate test explicitly reset the point before the later solve and confirmed the rejected equation was reapplied; the test is deliberately excluded from the passing midpoint bundle until the behavior is fixed.

A corrected multi-equation midpoint makes the existing classifier issue visible: some of a constraint's equations may be implied while others remain essential. The research candidate counts redundancy per complete constraint and includes saved-order and removal tests, but this alone does not make rejected constraints atomic. A safe design must restore all affected parameters, discard every reduction/substitution from a rejected constraint, rebuild from the previous valid state, reconsider constraints in a deterministic order, retain object backlinks, and distinguish numerical failure from inconsistency. An initial whole-system trial rebuild passed eleven focused subsystem tests but took approximately nine seconds each to load, add or remove with 500 independent point locks on the test workstation; it also did not make cross-stage object/layer transactions atomic. It remains experimental, and a more targeted admission method needs measurement and review. A later incremental prototype passed small atomicity cases, but a reproduced save/reload sequence using PointOnLine and two LockPoint constraints changed the winner and moved the point from `(1,0)` to `(0,3)`. Preserve the chosen branch or report ambiguity explicitly; do not silently change the authored constraint order. A 500-lock test with a conflict still took about ten seconds. Do not merge or deploy the midpoint candidate until those paths and applicable engine-backed sketch workflows are tested.

## Modeling and persistence

Inspect actual features and qualify them rather than assuming a toolbar name proves correctness. Datums, extrusion/revolve/booleans, holes, fillets/chamfers, patterns, shell/draft, sweep/loft and multibody use need explicit capability and edit tests. Qualify the OCC bracket first; compare the Native Mesh engine only for features it implements. Native Mesh currently covers a box and mesh Boolean, rejects mixing OCC/native, and does not support arbitrary sketch extrusion, curved primitives or a model-wide engine switch. The following source findings require focused reproductions:

- `web/app/cad/craft/datum/create/createDatumOperation.js` contains a fallback to the global origin when a stored originating face cannot be found; whether that path is reachable through the current face materializer is unproven. Test the datum wizard and history, and report broken references explicitly instead of silently attaching elsewhere.
- `modules/workbenches/modeler/features/fillet/fillet.operation.ts` can clear the created-result list on an invalid result and then access its first face. Confirm failure behavior and preserve the authored operation and last-valid geometry with a clear stale/failed label.
- Sketch offset currently handles a restricted closed Segment/Arc loop, parses its distance as an integer and uses browser prompt/alert. Its `findLowestPoint` comparison merits a regression. Offset, pattern and fillet should persist the operation and its references, including failure, rather than only a static result.
- `Hole.operation.ts` constructs a cylinder/counterbore/countersink tool body; source inspection did not find it cutting the chosen workpiece automatically. Current linear and radial patterns copy bodies rather than arbitrary hole features. Verify the real interaction and make the workflow explicit.
- `SameTopologyProductionAnalyzer` uses corresponding face/edge iteration order for some copied IDs. Existing box/pattern/snapshot tests do not prove correspondence after topology changes or differing kernel ordering.
- STEP import exists, but STEP export was not found; IGES import and the BREP export operation have explicitly unimplemented paths. STL serializer and DXF code exist, but the WebOS file actions do not yet provide a complete My files export workflow.
- The assembly registry includes `FaceTouchAlign` and `EdgeAlign`, but the WebOS project snapshot refuses non-empty assembly constraints. This is not a durable joint or mechanism workflow. Joints, limits, loop solving and kinematics are a later domain; dynamics, collision and manufacturing clearances are separate capabilities.

Use stable authored entity/feature IDs, generated-topology provenance and meaningful selectors; a UUID on an unstable face alone does not resolve a split or merge. Preserve native history, parameters, constraints and references through save/reload and undo/redo. STEP/mesh and SVG/DXF are exchange outputs, not substitutes for editable native projects. Validate actual export coverage and both engines rather than assuming interoperability.

## Ordered work and evidence gates

The bracket and enclosure are vertical acceptance gates: deliver the minimum parameter, regeneration, reference and persistence work from stages 2–4 together as needed to complete each real design. The stage numbers describe priorities, not an assertion that the full benchmark can pass before those dependencies exist. Assembly-constraint saving is currently rejected, so last-valid recovery must not be presented as durable assembly persistence today.

1. **Sketch correctness:** fix midpoint and qualify compatibility; specify supporting versus finite domains, tangency/contact and angle branches. Test counterexamples, degeneracy, redundant/inconsistent relationships, the actual solver and saved sketches. Make failures explicit and keep the previous valid result.
2. **Ordinary mechanical sketches:** driving signed X/Y and projected dimensions, diameter, concentric, collinear, entity fix, rigid groups, independent-axis symmetry and typed geometric relations. Build a bracket and fitted enclosure/lid; change dimensions, hole spacing and pattern count, introduce contradictions, and verify undo/reopen.
3. **Parameters and configurations:** typed lengths, angles, area/volume, dimensionless values, integer counts and booleans; parsed formulas, dependency ordering/cycle errors, reference versus driving roles and reusable configurations. Formula dependencies are evaluated in order; relations between free geometry belong in the same simultaneous solve. Keep general area/perimeter as measurements first.
4. **Part regeneration:** qualify the real modeling operations, history/provenance, topology changes and explicit repair, failure recovery and editable native persistence. Delete or split a referenced face, suppress a feature and make substantial parameter changes. Keep tessellation derived.
5. **Curves and demanding profiles:** complete ellipse and general curve incidence, normals, path/arc length, endpoint tangent, arc-length versus parameter fractions and associative projection/intersection/pierce. Explicitly distinguish G0 position, G1 tangent direction and G2 curvature. A normal circular line fillet is not automatically G2. Test a curved handle or cover.
6. **Mechanisms and later specialties:** qualify component poses, fixed/revolute/prismatic/cylindrical/planar/spherical joints, limits and coupling with a linkage or slider; defer sheet metal, routing, drawings and optimization to demonstrated needs.

Tests must cover 1080p, 4K and a minimal phone experience where the operation is practical, undo/redo, persistence and account isolation. Use meaningful residual scales, rank-aware diagnostics at regular points, degenerate and ambiguous cases, warm-start behavior, cancellation and resource bounds. A numerical failure must leave authored inputs and a clearly labeled last-valid result available. Do not claim physical manufacturing or hardware accuracy from simulation alone.
