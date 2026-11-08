# C01 cubic spline / Bezier: shared source-and-math proposal

Source-only contract, 2026-11-08. Baseline ACAD
`23164c2f1ed05904de67648e77263f96f3ad672b`, considered together with frozen
Ellipse product8d8ac4f/workflow6c1300e/Desktop76ecebfd8. Ellipse branches and
all evidence are unchanged. No product changes, execution, tests, probes, TSC,
build, browser, native success or accepted spline workflow in this packet.
Root approval is required before the implementation seams below are edited.

## Actual source inventory

| Actual file and function | Native meaning / current limitation |
| --- | --- |
| `web/app/sketcher/shapes/bezier-curve.js`, constructor/write/read/visitParams | A cubic with ordered P0,P1,P2,P3. Writer fields are cp1=P0, cp2=P1, cp3=P2, cp4=P3, despite native object properties a=P0, cp1=P1, cp2=P2, b=P3. Root owns two construction Segments; first has a=P0,b=P1 and second a=P3,b=P2. Total root graph is7 objects, not5. Each child Segment owns intrinsic angle/length Params in addition to its two EndPoints. Public callers must not reconstruct this ID grammar or confuse the second child direction with parameter direction. |
| `web/app/sketcher/tools/bezier-curve.js` | Human tool directly constructs BezierCurve, stabilizes both children, can add Parallel for its old smoothing gesture, then checkpoints the old viewer history. This is not a registered shared author/edit operation or proof of shared tangency. |
| `web/app/sketcher/shapes/b-spline.ts`, IBSplineOpts/constructor/write/read | Nonrational planar BSpline record: degree,cPoints,fPoints,kValues,interpolation,CVModel,type,method, optional closedBasePoints. c/f/base rows have actual IDs and x/y. Type is Clamped/Open/Closed, methods -1(default legacy),0(quasi-uniform),1(centripetal),2(chord length). Weights/rational NURBS are not in this ordinary shape model. |
| Same file, visitParams/setChildPoint/cvUpdate/update | Root visitParams enumerates cPoints. Actual descendants have their own EndPoint Params. Open CV mode's authored cPoints differ from its derived fPoints; cvUpdate recomputes knots/fPoints and makes children the control points. Interpolation fits authored fPoints and derives cPoints; closed CV retains authored closedBasePoints and derives clamped cPoints. These modes cannot share one indiscriminate editable-point list. |
| Same file, BSpline.read | With interpolation or CVModel, aliases are resolved by saved IDs within each array. With both flags false, read groups by coordinate strings and generates child IDs. Existing bounded policy corroborates that native mapping internally. Coordinate-deduplication in this import representation is not permission for a public caller to infer identity or for edits to change a saved ID unnoticed. |
| Same file, closed CV read/cvUpdateClosed | Current source contains old missing-base fallback and explicit adoption of derived data when original base records are present. No nearest-coordinate or guessed base reconstruction can become a new shared author/edit contract. Existing closed/interpolated/imported modes remain explicit separate domains. |
| Same file, BSplineControlVertices.solve/GeneralKnotsCalculator.calculate | Open cubic Clamped CV uses actual controls with the first/last one omitted from the knot-calculator input (degree3 start=end1). Quasi-uniform4 controls yield knots[0,0,0,0,1,1,1,1];5 controls yield[0,0,0,0,0.5,1,1,1,1]. This is a real available native construction, not a synthetic serialized spline seed. |
| Same file, getPoint | Half-open basis evaluation has a separate actual right-endpoint de Boor branch; tests/oracle must include final parameter1 rather than silently treating the endpoint as the origin. `getDiscretePoints`/constructor also do derived sampling, so pre-construction work limits matter. |
| `web/app/sketcher/headless/splinePolicy.mjs` | Existing headless support caps degree1..5, each points group<=64, existing shape-domain/ID/alias/knot checks, aggregate work8192. It distinguishes derived points from editable Point rows. It allows repeated same-ID same-coordinate entries within a group, rejects different coordinates for one ID and cross-group ownership collisions. Resource/unsupported/domain currently share a generic error message: a new shared route must classify truthfully rather than claim mathematical invalidity. |
| `web/app/sketcher/headless/splineDerivedValidation.ts` | Worker recreates actual BSpline and recomputes native interpolation/CV data. It compares native write against the captured record, keeping authored IDs/coordinates and current coordinate-vs-other numeric budgets. This existing genuine rebuild is essential, not replaceable by source flags. |
| `web/app/sketcher/headless/carriedCurvePolicy.mjs` | Current Bezier root policy accepts finite canonical4 points unless all remain within1e-9mm of P0. Child refs are internal constructor conventions. This is the current supported numerical envelope, not a general criterion for a valid polynomial curve. |
| `web/app/sketcher/io.ts`, strictObject/validateProjectSketch | Native IO reads both real classes. Native BSpline structural checks and constructor are broader than the headless bounded/derived policy, and root Bezier is outside the ordinary explicit entity-domain branch. The existing source mismatch is not an observed browser corruption result; it is an admission seam requiring an explicit decision before new supported authoring/Open claims. |
| `web/app/sketcher/headless/renderSketchProjection.mjs` | Bezier projects exact canonical cubic geometry plus native child-handle conventions; bounds use the control hull (conservative). BSpline projects an adaptively flattened polyline, no editable handles, declared0.01mm chord approximation,64 converted spans,4096 per-curve/8192 total points,250000 work/depth24, knot-gap refusal and conversion checks. This display approximation must never replace authoritative controls or serve as50pm analytic truth. |
| `web/app/sketcher/headless/closedSketchInspection.ts` | Object metadata can list both carried classes, but the generic point list filters them out. No shared curve control/discriminated source-mode editing discovery exists. Ellipse's new separate discovery pattern is the suitable precedent. |
| `web/app/sketcher/headless/coordinateTransition.ts` | Existing generic point source lookup has no Bezier/BSpline branch. Do not widen it to every descendant just because a native EndPoint exists. |
| `web/app/sketcher/headless/capturedParameterOwnership.ts`, capturedSketchEvaluation | Real root/descendant/Param/SolverParam identity is available. PointOnBezier and TangentLineBezier have existing privately issued auxiliary roles. This supports truthful original-equation validation but does not prove a new public constraint/tangency creation workflow. |
| `web/app/sketcher/headless/verifiedReplayGeometry.ts` | Carried Bezier/BSpline fields presently have no newly qualified relaxed equivalence policy; preserve this limitation, original equations and classification. No tolerance broadening is part of the proposal. |
| Native tools, primitiveTransition/transitionClient, Desktop primitive-commands | Current shared append exposes Point/Segment/Circle/Arc and approved Ellipse; neither spline class has a registered shared author/edit path. Human action names and raw native records are not substitutes. |

## Mathematical domains: do not conflate special curves with invalidity

Cubic Bezier means `B(t)=(1-t)^3 P0+3(1-t)^2 t P1+3(1-t)t² P2+t³P3`,
0<=t<=1, in the actual local source frame. Ordered control roles are retained.
Reversing creation order changes traversal, B_rev(t)=B(1-t), not identity.

Collinear controls can represent a valid line locus. A zero endpoint handle
(P0=P1 or P2=P3) is a valid cubic with zero endpoint derivative; it is not an
invalid standalone Segment merely because the native storage has construction
Segments. Registered Polar has original coordinate equations and no positive
length domain of its own. A cusp or a self-intersection can be a valid
parametric sketch curve. None implies simple-wire/region/tangency eligibility.
Only all-equal controls make an exactly constant polynomial; the existing
1e-9 control-spread envelope additionally excludes some mathematically nonzero
small curves. Preserve that distinction in reasons. Nonfinite input and
nonfinite actual constructed Params are invalid data/numeric outcomes.

BSpline first shared domain is explicitly **nonrational cubic Clamped control
vertices with quasi-uniform parameterization**. This is actual CVModel=true,
interpolation=false,type=Clamped,degree3,method0. Direction follows ordered
native controls over the knot domain[0,1]. Four controls make a one-span cubic;
5 controls add a genuine interior knot0.5. First edit keeps count/order/degree/
method/type fixed; it changes actual control point coordinates, not knots,
fit points, generated endpoints or degree by stealth. The existing64-point/
work envelope remains a resource bound, not mathematical geometry invalidity.
Distinct IDs at coincident coordinates remain distinct actual native Points;
no coordinate welding. Existing source aliases are real possible representations,
but initially editable only when this operation can prove exact ownership and
one unambiguous coordinate intent for each real Point; otherwise inspectable
read-only with an explicit alias/mode reason, not invalid source.

General degrees, custom/repeated interior knot editing, fitting/interpolation,
closed periodic CV/base editing, imported both-false coordinate-derived IDs,
rational weights/NURBS and elliptical arcs are **not added** by this slice.
Keep their actual existing read/carry/projection capabilities and refusals;
do not silently convert them into this new CV domain or claim whole C01 closure.
Source-mode limits must be discoverable, not guessed from a screenshot.

## Proposed shared operations and exact identity custody

Extend existing `appendClosedSketchPrimitive` / `append-sketch-primitive`:

* kind BezierCurve, exact data `{cp1:{x,y},cp2:{x,y},cp3:{x,y},cp4:{x,y}}`.
  Reuse the actual BezierCurve constructor; caller never supplies root/child IDs.
* kind BSpline, exact data
  `{degree:3,type:'Clamped',method:0,controlPoints:[{x,y},...4..64]}`.
  These are existing native degree/type/method meanings, not an arbitrary
  source-schema execution API. CVMode is fixed by this declared operation.
  No public flags claim validation or allow callers to write derived data.

Existing coordinator allocates private root identity. For BSpline only, bounded
private child identities also need capture **before yielding** and before
construction; caller does not supply them. Suggested private captured primitive
payload adds discriminated identity arrays only for this new kind: actual
control IDs and derived-fit IDs, with exact lengths tied to the chosen count/
knots. Preserve all old kinds' request/reply fields unchanged. Avoid fresh
random allocation during independent verification. Native factory creates real
EndPoints with those IDs, then real BSpline and native cvUpdate. Derived fit
points are adopted through the native resetFPoints seam from the actual native
basis result with the captured identities; they are not editable authority.
Do not rely on Generator's ambient counter or coordinate strings to discover
new persistent IDs after source publication. Existing numeric-ID reservation
protects temporary native allocations; full source/ref inventory rejects all
private identity collisions. No change to the public ID grammar is required.

Native append custody must check the actual graphs, not invent a fixed one-
member primitive success: Bezier's7 members and TWO child-owned Polar rows,
plus each child's real owned angle/length Params; CV spline's native control/
source-derived point memberships according to the actual read/write stage.
A new private policy may extend capturedSketchEvaluation only for these two
constructors. Do not drop intrinsic constraints or use serialized counts as
ownership proof. Genuine isolated/whole-candidate solve, captured original
polynomials/domains/aux witnesses and independent original-request reconstruction
remain required. Optimizer coordinates are proof observations, not copyback.

Discovery extends the existing closed sketch result with bounded `curves`
discriminated rows, separate from generic points. Proposed common fields:
`{id,type,stage,role,representation,controls,canEdit,reason}`. Controls are
ordered `{pointId,x,y}` rows obtained from actual native object properties/
control arrays, matching the canonical saved slots. Type-specific observations:
Bezier actual four control roles; BSpline degree/type/method/interpolation/
CVModel/knot-domain/kValues plus separately labeled source-only derived points.
Derived fit/base rows cannot impersonate control Point mutation authority.
Unsupported valid modes have explicit reasons. No field implies Native region,
simple curve, tangent derivative or BRep qualification. Inspection is verified
cold replay, distinct from exact retained bytes as documented for Ellipse.

One new dedicated service/command:
`editClosedSketchControlPoints({revision,faceId,id,points:[{pointId,x,y},...]},options)` /
`edit-closed-sketch-control-points`. The entire ordered control list is required
(four for Bezier, exact existing count for eligible CV spline), using actual
inspected IDs. Worker independently binds root/class/mode/descendants/Params,
not caller type/ordinal parsing. Duplicate coordinate values are legitimate;
ambiguous alias intents refuse explicitly. Numeric capture uses existing
public coordinate bounds; no new positivity or distance cap.

Producer uses original captured source, changes only authorized controls,
rebuilds only genuine derived B-spline data via native methods while preserving
its actual source IDs, and proves the edited original equations, no unrelated
source/constraint/generator/frame/formula changes, cold replay/classification
and independent original-request reconstruction. New source strings are held
privately until the existing full candidate overlay/publication and one atomic
sketch-byte journal entry. No-op preserves raw bytes/journal after currentness
checks. Existing typed-mutation gate stays; no formula erasure. A failed
constraint proof is a refusal, not removal/readdition or permission to move
unrelated geometry. Shared travel restores exact historical source bytes with
real replay proof. No new model/history framework or generic point authority.

## Native source/Open admission proposal requiring explicit approval

Introduce a pure canonical Bezier record/domain policy matching its real writer;
share its current finite/nonconstant-enough envelope between carried source and
ordinary native project admission. Include finite actual native descendant
Params before adoption, without imposing a positive-length rule on both
construction handles. Unknown fields/nonfinite source refuse, not strip.

For BSpline, factor existing bounded structural/work/alias checks into reusable
pre-constructor policy with truthful resource vs unsupported encoding vs invalid
record/domain reasons; keep the same finite limits rather than adding a secret
new spline cap. Native strict Open must preflight before constructor sampling
and must independently verify actual derived CV/interpolation data in its Worker
phase where that mode is admitted. This is a real compatibility decision:
current native structural reader is broader than headless degree5/64/work8192.
Recommend explicit resource refusal for source beyond the existing qualified
bounded evaluator envelope and explicit unsupported-provenance for unreconstructible
legacy modes; do not call them geometrically invalid, silently truncate, infer
new control ownership or rewrite old native bytes. Root must approve this shared
IO admission boundary before code because it affects existing saved files.
No legacy migration, decoder feature flags or blanket source-preserved bypass.

## Exact proposed implementation ownership (not yet granted)

New source helpers: pure Bezier record policy; private native cubic-CV creation/
identity+derived rebuild helper; dedicated control-point transition/verification
module and bounded inspection capture. Reuse splinePolicy/splineDerivedValidation
rather than duplicating a permissive spline decoder.

Narrow existing Core seams: ordinaryEntityDomain.mjs, io.ts, carriedCurvePolicy,
splinePolicy/splineDerivedValidation (only mode-aware domain/ownership and bounded
failure taxonomy), primitiveTransition/independentPrimitiveAppend,
capturedSketchEvaluation (new actual constructor graphs), closedSketchInspection/
inspectionClient, transitionClient/generic client/solveWorker, shared
closedSketchTransitions and Craft method type. The native class reset/rebuild
methods are reused; any required change to b-spline.ts or Param ownership must
be reported separately before editing. No solver math/domain/tolerance changes
are authorized by this plan. Do not relax verifiedReplayGeometry for carried
curves just to make an edit pass. Existing render projection may be reused;
new control discovery must come from actual native ownership. If a distinct
bounded analytic source-evaluation observation is added for the oracle, its
request/reply/ownership must be frozen first; no fabricated measured points.

Desktop later: primitive-commands append schema, closed-sketch-commands dedicated
edit, one public example and one complete whole-flow driver/oracle. No toolbar,
new dialog, canvas injection, global import/export or Native BRep kernel changes.
Root coordinates any dispatcher/Craft/IO owner before implementation.

## Finite whole application acceptance, source first / execution later

One new registered-command workflow on a frozen composed app, actual account
and ordinary source plane with anchored datum/unrelated Point. No raw positive
source seed or private model writes. It authors real Bezier and real cubic CV
BSpline using P0(0,0),P1(0,10),P2(10,10),P3(10,0), translated as necessary to
keep distinct fixtures visible. Each is a real distinct native type, not one
engine compared against another. Actual inspection supplies all control IDs.

Independent analytic truth for unshifted four-control fixture:
`B(t)=(30t²-20t³,30t-30t²)`, B(1/2)=(5,7.5), true bounds[0,0]..[10,7.5],
B'(0)=(0,30), B'(1)=(0,-30). Mid-control height edit10->12 gives midpoint(5,9)
and maxY9. Derive from actual saved controls/knots and actual public receipts,
not literal expected metadata alone. Use exact Fraction Bernstein/Cox-de Boor
basis for actual dyadic knots/parameters; verify endpoints including t=1 and
piecewise extrema independently. Control hull/display polyline is not exact
curve bounds or50pm truth. A bounded read-only actual source-evaluation API is
needed before claiming measured curve samples; without it, oracle reports
source-defined polynomial expectations and exact observed controls, not invented
native measurements. Independent source intent is still useful complete evidence.

Also author a genuine5-control CV example P=(20,0),(20,10),(25,10),(30,10),(30,0),
knots0000,0.5,1111. Exact midpoint=(25,10); edit middle controlY10->12 gives
midpointY11. Source/order/degree/method/fit IDs remain stable; native rebuild
must retain unrelated Bezier source exactly. This establishes actual internal-
knot source behavior beyond one-span Bezier equivalence.

Whole chain: ordinary/control edits and translations, reversed creation order
and its traversal relationship, collinear controls, one zero endpoint handle,
distinct coincident-position IDs, all-collapsed envelope refusal, nonfinite/
stale/wrong-root/derived-control/unowned-control refusals, mixed UndoRedo/no-op
and exact unrelated source/history/journal/counters/resource retention. Source
construction/verification may expose a real intrinsic defect: preserve actual
failure, never relabel a valid cubic as invalid merely to close this slice.

Normal native `.cad` Save/My files/server byte equality, fresh login Open,
reedit/resave/second Open. Source authority/native identity/order/constraints
and exact raw sketch entry bytes must survive. Malformed own-file Open cases
come ONLY from actual healthy public saved artifacts: constant Bezier, invalid
knot order/count, conflicting alias coordinates, stale derived CV data and a
bounded resource-exceeding descriptor/source. They must refuse before adoption
and preserve the accepted model. These files are negative tests within the
whole workflow, never successful authoring seeds. Read-only valid other modes
are not transformed or falsely counted as newly qualified edits.

Freeze actual runtime/driver/source custody and per-observation meaning before
execution. Physical coordinate target remains50pm=5e-8mm where applicable;
source/control IDs, literal axes/order/degree/knots/modes and tiny values are
exact identity checks, not tolerance opportunities. Existing0.01mm derived
render approximation is labeled separately and never fed into source/solver
truth. No nanoscale BRep/material/atomistic claim, region/tangency closure,
interpolation/closed/rational support or general C01 signoff follows.
