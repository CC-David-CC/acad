# Current midpoint/symmetry audit and next C03 source repair

Base Core `5779b218f` (the November 7 registered-point-capability commit, not the
older similarly prefixed `5779adb4f`). This is source inspection and a bounded
source correction. No per-step solver test, syntax/type check, build, browser or
new Native result was executed. Earlier receipts remain pinned to their original
sources; they are not retagged as current qualification.

## Active midpoint is already the required two-coordinate relation

`web/app/sketcher/constr/ANConstraints.ts`, `PointInMiddle`:

```
defineParamsScope: segment.a, point, segment.b
parameters:        ax, ay, px, py, bx, by
polynomials:       2*px-ax-bx = 0
                   2*py-ay-by = 0
```

At fixed `A=(-1,0), B=(1,0), P=(0,5)`, these expressions are `(0,10)`, so this
point is not a midpoint. `registeredResidualProfile` divides both components by
two, producing positional errors `(0,5)` mm; it does not turn the relation into
equidistance. Its existing length tolerance is `1e-6` mm.

`Symmetry` has the same two-object signature `[point,segment]` and directly
delegates to those same two polynomials. It adds no duplicate supporting-line
equation. This is midpoint/central symmetry of the segment endpoints about the
selected point, not reflection about an independently selected axis. The source
label is now explicitly **Midpoint Symmetry** in the schema/local/global actions.
Saved schema IDs and mathematical equations remain unchanged.

The actual action implementations instantiate `AlgNumConstraint` with these
registered schemas. `io.ts` reconstructs strict native-v3 constraints with
`AlgNumConstraint.read`; the headless `solve.ts` signatures are
`PointInMiddle:['Point','Segment']` and `Symmetry:['Point','Segment']` and their
original registered polynomials are checked after solving. `AlgNumSystem`
collects each constraint's complete polynomial set and counts redundant rows
against that full set. This inspection found no new equidistance-only midpoint
reduction in that active path. Existing midpoint/order/conflict-removal sources
already contain the user's counterexample, but were not rerun here.

`constraints.js` still contains an older `Constraints.PointInMiddle.getSolveData`
distance-based constructor. Its presence is not evidence that the current
registered action or native-v3/headless path executes it: those paths use the
AlgNum schema above. This patch does not reinterpret that old legacy class or
claim universal historical-project compatibility.

## Supporting line and independent axis remain distinct

`PointOnLine` constrains signed supporting-line distance to zero. On the same
horizontal segment, `P=(100,0)` satisfies that relation but is not its midpoint.
No finite-segment/nearest-point semantics are implied.

`constr/lineRelationSchemas.ts`, `AxisSymmetrySchema`, takes `[P,Q,axis]` with
unit axis direction `u=(cos(theta),sin(theta))`, normal
`n=(-sin(theta),cos(theta))` and axis point `A`:

```
((P+Q)/2-A) dot n = 0
(Q-P) dot u = 0
```

The first equation places the pair midpoint on the independent infinite axis;
the second makes their connector normal to it. `lineRelationDomain.mjs` and the
shared real UI/headless admission require the actual axis to stay live and
nondegenerate. The headless transition independently computes the reflection
from actual endpoint coordinates before accepting a result.

Desktop's `sketch-line-relation` and `apply-closed-sketch-line-relation` advertise
`axis-symmetry` and map it to **AxisSymmetry**, not the midpoint alias. The real
global/local **Symmetry about Line** action likewise selects that separate
schema. Public mappings found in this audit therefore do not conflate the two.
There is no current closed-sketch public midpoint-creation command in those
adapters; that agent capability remains an explicit gap, not a wrong midpoint
equation or a fabricated successful public workflow.

## Next confirmed ordinary C03 defect: three-segment angle chain

The advertised `AngleBetween` action accepts two or more Segments. It created
the first pair with `ConstraintDefinitions.AngleBetween`, but then instantiated
`ConstraintDefinitions.Angle` for each subsequent pair. The absolute-angle
schema visits only its first Segment and ignores the second supplied object.

A concrete ordinary mechanical counterexample is three Segments with directions
`0°`, `30°`, `80°`, requesting the same `30°` separation along the selection:

- First pair correctly requires `angle(B)-angle(A)=30°`.
- Old follow-on schema only requires `angle(B)=30°`. It never references C.
- Correct follow-on relation requires `angle(C)-angle(B)=30°`.
  With A/B fixed and C's first endpoint anchored, C must rotate to `60°`.
  If C is instead independently fixed at `80°`, the whole batch must refuse.

The source fix uses **AngleBetween for every consecutive pair** and submits the
complete group through the existing `addConstraintGroup` transaction/history/
rollback helper in `constraintActions.js`. A conflicting later pair must not
leave an earlier accepted pair in the sketch. This adds no solver, relation
format, parameter convention, second journal or model writer. It changes only
the wrong action schema selection and atomicity of that same advertised batch.
It makes no new global angular-branch or solver-completeness claim.

## Whole-workflow acceptance still open

The next coherent application run should create actual ordinary Segments in one
source, fix A/B and anchor C's start through real existing authoring operations,
apply the real three-selection Angle Between action with `30°`, and independently
check endpoint-derived directions `0°/30°/60°` and exact fixed geometry. Travel,
normal native Save/sync/fresh Open/reedit must retain two **AngleBetween** rows,
their actual ordered source references and exact admitted values. A second
source with C fixed at `80°` must refuse with exact prior source/history and no
partial new relation. This is an acceptance specification, not an observed pass.

The existing public agent adapters expose no general AngleBetween batch creation
command. A fully public agent driver must not call `__CAD_APP` actions, inject
constraint JSON or seed a saved native sketch and label it public authoring.
Its required mapping is an explicit next integration dependency; it was not
silently invented in this bounded audit. No Root Craft, PM, Native/Worker-shell,
Desktop registry or common lifecycle file changes are part of this checkpoint.
