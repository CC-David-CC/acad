# Gate1 physical-coordinate reconstruction policy —50pm

Source-only checkpoint from main `e28cf77d6815d85eb917ce2041e78fc72262b7c9`. The user's FINAL explicit confirmation is50pm (`0.05nm`, `5e-8mm`). The chronology is historical runtime1pm →unqualified source plan10pm →superseded user choice100pm →final50pm. Neither intermediate choice is claimed built or qualified in this lane. No tests, probes, TSC, app build or Chrome ran here. No historical passing/failed result is retagged; qualification still requires root's composed whole workflows.

## Exact meaning

`headless/physicalCoordinateReconstruction.mjs` declares the single shared `PHYSICAL_COORDINATE_RECONSTRUCTION_BUDGET_MM=5e-8`. This is an **absolute per-x/y-coordinate-component** displacement limit between captured canonical-mm geometry and its independently reconstructed observation. It keeps the previous component-comparison convention; it is not a Euclidean point-distance norm. It is not analytic design accuracy, equation residual tolerance, permission to move unrelated geometry, a solver convergence epsilon, a minimum entity size, topology equality or a frame/source-identity allowance. No available numeric precision is discarded.

Actual real-variable ownership, original registered equations/domain checks, fresh accepted/redundant evidence, exact authored intent, authenticated affected-component scope and directed branch guards remain required. Fields outside a proven movable scope remain bit-exact even when they are coordinates. Source identity/currentness, exact source/ruler/feature IDs, frame and document guards do not change. The policy never rounds/snaps a source or copies over a failed solve.

The old `CURRENT_DIAGNOSTIC_POSITION_TOLERANCE_MM` export remains an alias to this explicit policy; there is no second value under that name.

## Typed coordinate selection

Only existing serialized physical position fields receive the new budget:

| Object type | `data` paths receiving50pm |
| --- | --- |
| Point | x,y |
| Segment | a.x/y,b.x/y |
| Circle | c.x/y |
| Arc | a.x/y,b.x/y,c.x/y |
| BezierCurve | cp1.x/y through cp4.x/y |
| Ellipse | c.x/y; existing ep1/ep2 representation's x/y |
| EllipticalArc | the ellipse position paths plus a.x/y,b.x/y |
| BSpline | cPoints/fPoints/closedBasePoints dense numeric index x/y |
| RigidGroup | transform.x/y |

This is numeric field classification, not a new qualified mutation/replay schema. `verifiedReplayGeometry` still permits only its previously authenticated supported fields; carried Bezier/Ellipse/spline/group geometry does not become movable merely because diagnostics can identify coordinates. Unknown fields retain their old numeric comparison, with no guessed units.

Stored Circle.r, ellipse r/rx/ry/rot, RigidGroup.transform.angle, rigid local reference points, spline knots/degree/method/count/weights/flags and other numeric leaves keep their previous1e-9 comparator in the mixed diagnostic/derived loops. Exact string/ID/structure matching is unchanged. Existing radius/domain/branch checks, including radii derived from points, keep their own rules. No universal radius or angular tolerance follows from the coordinate policy.

## Changed production callers

1. `headless/diagnosticGeometry.mjs::assertCurrentDiagnosticGeometry`: previously every numeric object-data leaf used1e-9, including angles/radii/knots. It now tracks object type and exact data path and uses50pm only for listed physical coordinates. `cad/sketch/sketchDiagnosticService.ts` calls it before returning actual active/saved sketch local diagnostics. Diagnostic equations, rank thresholds and physicalDof semantics are unchanged.
2. `headless/verifiedReplayGeometry.ts::compareData`: actual allowed physical coordinate fields use the shared budget. An allowed stored radius stays on its old1e-9 numeric comparison. Failure text derives the actual budget from the shared value and prints field/before/after/displacement. Its `ANGLE=1e-8rad`, `MIN=1e-9mm`, support graph, exact unrelated fields, intent, membership, evidence and branch logic remain unchanged.
3. `headless/splineDerivedValidation.ts::validateSplineDerivedGeometry`: actual BSpline source/derived x/y coordinates use the shared budget; knots/degree/other numeric metadata retain1e-9. Independent real spline reconstruction, original private point IDs, structural limits and source ownership remain. A stricter ID/shape/intent invariant may still refuse a coordinate within50pm.

Direct production `assertVerifiedReplayGeometry` callers at this checkpoint (under `web/app/sketcher/headless/`) are `acceptedSketchProjectionWorker.ts`, `constraintGroupTransition.ts`, `coordinateTransition.ts`, `drivingDimensionTransition.ts`, `independentPrimitiveAppend.ts`, `lengthMeasurementTransition.ts`, `lengthRelationTransition.ts`, `pointDistanceTransition.ts`, `signedDistanceTransition.ts`, `sketchTransition.ts`, `solveWorker.ts`, and `typedRectangleReconstruction.ts`. Old source notes referring to1pm describe their historical policy; the shared imported value governs the composed runtime. No caller gains new scope or weaker original-equation/currentness requirements.

`validateSplineDerivedGeometry` is called by `solve.ts` before/after genuine solve and by `capturedSketchEvaluation.ts` on original captured data. Full admission remains. Imports are ordinary bundled sketch/application dependencies, not Native static module/ABI assets; root's normal Worker/app pins must record the actual build, without a fabricated unchanged hash.

## Audited values intentionally unchanged

* `sameSketchSaveFrame`, diagnostic `sameFrame`, source-plane frame checks, typed Worker frame checks, frame orthonormality and boundary identity: own1e-9 direction/identity semantics.
* `emptySketch`, `dxfExport`, rectangle-draft principal-axis checks: frame/basis contract.
* Rectangle-draft representability: existing absolute/relative constructor policy, not replay comparison.
* Segment/Circle/Arc/spline/ellipse minimum lengths/radii/diagonals; Mirror axis nondegeneracy; Arc full-circle/tangent/radius consistency: entity/domain policy.
* `curvedBoundaryPolicy` fixed boundary coordinates/radii and angles: source-boundary authority.
* Registered residual tolerances, numerical solver epsilons/rank thresholds, Native metrology/export tolerances and all source/material/document signatures.
* Captured original geometry/independent exact request matching and exact coordinate targets: no tolerance is added where equality is required.

No broad1e-9 replacement was performed.

## Whole-workflow qualification and history

`test/line-orientation-public-workflow/PHYSICAL-RECONSTRUCTION-POLICY-20261108.md` records the next full workflow contract. Existing orientation driver/oracle remains unchanged (analytic endpoint1e-6mm and normalized dot/cross1e-8). Those criteria differ from this50pm internal guard and cannot alone establish50pm design accuracy.

Historical `small-polynomial-terms-workflow` driver/checker/README/evidence-r1 and all achieved1pm claims remain byte-unchanged. Historical orientation receipts/logs retain their actual producing1pm policy and failures. No evidence is relabeled as produced under50pm. A future stricter-oracle run may fail its frozen analytic thresholds while this new internal guard passes; report that rather than altering an old checker.

Remaining: source review/serial integration, normal complete app/Worker build with exact pins, unchanged complete orientation/source edit/refusal/travel/native Save-sync-freshOpen workflow, relevant whole typed/measurement workflow when composed, and final Gate1 decision from actual evidence. No completed Gate1 or future-version expansion follows from this source change. Finish Gate1 and freeze its qualified candidate first; future versions remain separate projects/branches.
