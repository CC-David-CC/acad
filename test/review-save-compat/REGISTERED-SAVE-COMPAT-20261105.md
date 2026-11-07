# Registered sketch Save compatibility — 2026-11-05

Isolated source base `ae579c93a` after async Save/readiness integration. This
checkpoint extends the existing headless backend for registered schemas and
Ellipse/EllipticalArc/Bezier geometry; no production core Save/action, BSpline,
curved-boundary, frame/craft preflight, hosting or application build changes.
Root serializes the overlapping solve.ts typeIndex hunk with the server lane.

## Concrete compatibility finding

At CAD `226104e38`, universal changed Save dispatches the sketch through
solveSketch. Its signature admits20 of37 registered ConstraintDefinitions
(including dynamic RigidGroup). The17 missing identifiers are below. TypeIndex
also rejects Ellipse, EllipticalArc, BezierCurve and BSpline, and narrows
RadiusLength to Circle while the existing UI also offers Arc. Thus a valid
accepted UI sketch can stay editable but be refused at production Save.

| Missing schema family | Actual entity tuple | Domain/residual in this checkpoint |
|---|---|---|
| Concentric, EqualRadius | Circle/Arc × Circle/Arc | distinct circular entities, positive radii; center/radius errors in mm |
| Angle | Segment | finite nondegenerate directed segment; radians |
| AngleBetween, Parallel, Perpendicular | Segment × Segment | distinct nondegenerate directions, authored branch retained; radians |
| DistancePP | Point × Point | finite point-distance equation; squared residual divided by distance+absolute target, in mm |
| PointInMiddle, Symmetry | Point × Segment | existing midpoint semantics; equation divided by2, in mm |
| TangentLC | Segment × Circle/Arc | nondegenerate direction, positive radius, literal inversion; signed distance in mm |
| PointOnCircle | Point × Circle/Arc | positive radius; squared residual converted to radial mm error |
| PointOnBezier | Point × BezierCurve | finite curve, bounded contact parameter; coordinate errors in mm |
| TangentLineBezier | Segment × BezierCurve | nondegenerate direction/contact derivative, bounded contact parameter; coordinate/derivative errors in mm and normalized tangency in radians |
| PointOnEllipse | Point × Ellipse/EllipticalArc | finite positive radii/rotation; coordinate equations in mm |
| Fillet | Segment × Segment × Arc | two distinct nondegenerate lines, positive arc radius, literal inversion flags; two tangent distances in mm |
| Polar, ArcConsistency | Segment+two Points; Arc | registered internal coordinate equations, in mm |

Polar and ArcConsistency are normally internal and omitted by IO; elliptical
arcs also create internal PointOnEllipse relations. Their absence from the
serialized whitelist alone is not proof of an authored Save regression. Their
actual internal equations still run in the real backend tests.

The whitelist remains explicit. Unknown schemas, wrong reference types/arity,
unknown geometric fields, rejected admission, degenerate domains and unsupported
stages/generators continue to refuse. No arbitrary schema invocation is added.

## Curve and typed-flag boundaries

The new data-only curve preflight accepts exactly IO's current ellipse fields
`c,rx,ry,rot`, its legacy `ep1,ep2,r` form, elliptical-arc `a,b` endpoints, and
Bezier `cp1..cp4`. It validates finite data, positive ellipse radii, elliptical
endpoint incidence and nonconstant Bezier geometry. Zero endpoint handles remain
valid when the curve is nonconstant. Derived center/endpoint and Bezier handle
Segment/Point IDs are indexed exactly as the real constructors create them.

Legacy ellipse IO already reads ep1/ep2/r and writes c/rx/ry/rot. The tests
explicitly exercise this existing canonical-native conversion; there is no
arbitrary normalization of authored input. Production Save captures the actual
editor's already canonical draft. The real worker-side before/after diagnostic
geometry comparison is retained and tested; stored canonical source and a fresh
real IO read/write agree exactly.

`booleanSketchFields.mjs` shares the explicit DistancePL.inverted,
TangentLC.inverted and Fillet.inverted1/inverted2 field list between typed sketch
preparation and consumer discovery. Only actual booleans and exact true/false
strings are accepted. Numeric flags, names, expressions, whitespace variants and
unregistered boolean fields refuse. Named dimensions remain limited to the
existing SegmentLength.length and DiameterLength.diameter consumers.

## Focused evidence and its limits

```sh
node --test test/review-save-compat/policies.test.mjs test/physical-parameters/typed-dependent-sketch.test.mjs test/physical-parameters/discover-typed-sketch-consumers.test.mjs
node test/review-save-compat/run-registered-save.cjs
```

Eight plain controls pass. The focused Node bundle executes the actual extracted
async InPlace.save, actual save-and-exit/receipt/capture helpers, real headless
workspace/IO and real solveSketch/diagnostic geometry backend. Each dispatch runs
in an isolated **Node Worker thread**, preserving the production separation from
the UI mutation epoch. The store, face/boundary/project lifetime and dispatch
bridge are controlled. This is actual Save-method + real solver evidence, not
browser Worker/client, actual UI clicks, signed host Save, native kernel or
worker-first performance acceptance. No GUI was used.

36 real-backend Save successes cover all Circle/Arc pairs, different concentric
radii, both parallel/perpendicular direction branches, absolute/relative angles,
midpoint/distance/incidence/tangency/fillet, current/legacy curve forms, zero
Bezier handle and derived point references. Two typed Save successes cover
tangent and fillet flags. Seven refusal controls preserve stored bytes and keep
the editor open for unknown schema, missing reference, unknown intent,
degenerate/nonfinite geometry and solver-changed geometry. Each successful Save
writes once, exits after the result and retains exact canonical sketch source
through fresh real IO reopen. These controls do not exercise authored-journal
adoption or a consuming feature history.

Retained first harness failure `before-worker-realm-control.log` ran solveSketch
in the same Node realm as the editor: backend construction advanced the shared
UI mutation epoch and Save correctly aborted. Moving the backend into a thread
fixes that test-realm mismatch. The final retained pass log states exact scope.

The historical headless worker test previously used registered PointInMiddle
as its unknown-schema negative. It now explicitly uses FutureUnsupportedSchema;
new positive midpoint Save coverage replaces that obsolete expectation. That
browser test itself was not run here.

## Carried workflow map and required combined browser subset

| Carried source/test | Why rerun or extend |
|---|---|
| webos/basic-sketch-shapes-browser + coreTests/craftExtrudeBasicShapes | existing ellipse, elliptic-arc and Bezier production commits/native workflows |
| webos/concentric-browser | current test ends at sketch IO; add actual Save/Exit + native/host boundary |
| webos/grouped-constraint-browser | EqualRadius current test ends at sketch history/IO; add actual Save/Exit |
| webos/basic-orientation-browser, basic-branches-browser | accepted parallel/perpendicular branches currently stop at sketch IO; add actual Save/Exit |
| constraint-edit/editor-browser | direct async Save → exit → fresh native restore; rejection propagation |
| webos/rigid-group-ui-browser | a carried registered schema and native reopen across the new universal Save gate |
| webos/sketch-history-large-browser | nearly1MiB authored label + changed Save/disposal/native; root owns string/preview fix |
| webos/spline-history-browser, sketch-epoch-spline-browser | server owns bounded BSpline source preflight; actual Save/native must qualify after merge |
| physical-parameters/typed-angle-browser | a rejected named angle must preserve and save the previously accepted literal Angle |
| physical-parameters/sketch-save-client-browser | actual browser Worker task validation and cancellation; server-owned focused control |

For the built exact combined app/helper, set JSKETCHER_TEST_URL and CODI_TEST_CDP
to its owned loopback fixtures and run the listed browser files with Node and
PUPPETEER_CORE_PATH. Start with basic-sketch-shapes, constraint-edit/editor,
rigid-group-ui and sketch-epoch-spline, then the extended relation Save tests,
large-history and signed/native host controls. No command should reuse an older
Worker or helper bundle; source/syntax passes do not qualify served artifacts.

## Still-open carried boundaries — not future-feature deferral

- [ ] Curved face boundaries: solve.ts lineTypes rejects arcs/circles/NURBS.
  `cad/sketch/sketchBoundaries.js` creates these from existing B-rep faces;
  coreTests/craftExtrudeBasicShapes and webos/basic-washer expose curved faces.
  Those tests do not currently prove a subsequent editor Save on that face.
  Server owns fixed circle/arc boundary domains. NURBS remains explicitly open.
- [ ] Multiple stages: StageControl's + button calls parametric.newStage;
  mechanical/stage-admission.test.mjs has actual IO later-stage and cross-stage
  conflict restoration. Universal changed Save still refuses stage count≠1.
  Add a real multistage Save acceptance/refusal control before qualifying it.
- [ ] Authored Mirror generators: current MirrorStart/operationActions invokes
  SketchGenerator/Mirror; IO persists generated objects and references.
  solve.ts still refuses nonempty generators. Historical solveSystems mirror
  tests use an older API and are not fresh current Save evidence. Add a bounded
  current generator domain/Save control; do not call this a future catalogue item.
- [ ] Existing named parameter consistency investigation belongs to root.
- [ ] Matching browser, signed account/file, real native model reopen, lifetime,
  refusal toast and consuming-feature/journal tests remain required after merge.

Full128MiB/worker-first performance, broad future CAD goals and packaging remain
open. This checkpoint makes no release-acceptance or complete-catalogue claim.
