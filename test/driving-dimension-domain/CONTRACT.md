# Driving rectangle width domain — one shared public workflow

SOURCE ONLY, NOT EXECUTED. No probes, tests, syntax/type checks, builds or browser runs were launched in this lane. Parent owns actual qualification and any product repair justified by the first full-run finding. Source checkout is the existing R730 ACAD worktree on a fresh main-based branch; no extra clone/dependencies. Only new test/driving-dimension-domain/ files.

Required values remain100→120→1→0→−10→1e−6→1e6 millimeters, fixed height50. No value is dropped, rescaled, clamped, rounded to zero or changed to an easier surrogate. One actual factory rectangle and its real discovered width dimension/source/curve identities are used throughout. Every authoring action is a registered public command; __CAD_APP is only the retained harness's detached read oracle. No caller source/constraint seeding, provider/model doubles, guessed indices/opaque parsing or private mutation.

Source-backed domains inspected before expectations were frozen:

| Layer | Actual current contract | Source |
|---|---|---|
| Generic existing driving width | literal finite0<value≤1e6 or typed length identifier; this driver uses literal numbers | apps/system/jsketcher/closed-sketch-commands.mjs public schema/own-data guard; web/app/sketcher/headless/drivingDimensionTarget.mjs; drivingDimensionTransition.ts |
| Constraint schema | SegmentLength.length is positive length, no0.001 floor | web/app/sketcher/constr/ANConstraints.ts SegmentLength |
| Rectangle factory | creation dimensions0.001..1e6, explicitly advertised | web/app/cad/craft/rectangleCreation.ts |
| Specialized bulk rectangle editor | existing and proposed width/height0.001..1e6 | web/app/cad/craft/rectangleEditing.ts |
| V3 polygon region/native preparation | each edge length strictly above0.0001mm; additional nonadjacent clearance/area/world-coordinate checks | modules/engine/mount/polygonProfilePlan.mjs |
| Native geometry | real registered single whole-part backend; no implicit fallback, actual positive valid single prism required | selectedProfileCommands, workerSelectedProfile.operation and solidLedger |

A generic positive driving edit's mathematical/sketch domain is broader than rectangle creation and the finite Native planar adapter. The driver must genuinely accept a noncollapsed1e−6 sketch and report its original-equation residuals; an unexpected solver/generic-operation rejection is a full-run failure, not an accepted unsupported result. The planar resolution refusal is separately required and identified as PROFILE_BELOW_RESOLUTION. It is not evidence that no such ideal rectangle exists, that the sketch is inconsistent, or that the Native kernel attempted and rejected a BRep. Public discovery's ready/canCreate is not itself a certificate of every source region's geometric support. The existing generic command description does not enumerate downstream resolution; raw descriptors and outcomes are recorded so parent can assess any misleading contract claim from actual evidence.

The planned complete workflow:

1. Actual constrained100×50 creation; discover width SegmentLength by actual bottom Segment endpoints. Real original residual/local diagnostic report, exact independent source geometry, then actual20mm extrusion on explicit profile-v3 backend. Creation UndoRedo preserves its allocated ID; final Undo returns to the same accepted source.
2. Width120 and1 use the SAME original driving dimension through the generic edit command. Each gets real source/residual checks and20mm extrusion with creation UndoRedo. Width1 retains its extrusion for the invalid sign and full-history micro-boundary cases.
3. Width0 and−10 explicitly refuse at positive-input admission with exact same-window prior-state preservation. Current host guard throws ordinary Error without a code, and its positive-millimeter message is required; no solver inconsistency claim.
4. Width1e−6 while width1 Native extrusion exists must refuse full-history planar preparation atomically, preserving actual width1 source/Native model. Undo only that extrusion creation, then genuinely commit1e−6 on the same sketch. Independently require positive noncollapsed geometry, original dimension value, all eleven residuals and truthful local diagnostic status. Region discovery must explicitly refuse PROFILE_BELOW_RESOLUTION. Specialized rectangle-editor readiness is captured honestly; it is not used as a workaround for its0.001 floor.
5. Width1e6 must genuinely succeed as a sketch and as the ordinary20mm prism. No shrinking to a lower ceiling or accepting generic engine failure. Creation UndoRedo retains IDs.
6. Inch presentation plus mixed creation/source Undo back through1e−6 and1, then Redo to1e6 and its same Native feature. mm/inch roundtrip preserves canonical physics and journal content; the opaque authored inspection token may legitimately refresh with document presentation.
7. Normal My files native Save/browser+server equal SHA, fresh signed Open, same source/history/IDs/counters/presentation and reset session Undo. Reedit width120 through the SAME driving dimension with the maximum-width Native feature preserved, actual diagnostics/Native measurements, UndoRedo, resave and another fresh Open.

Accepted positive sketch oracles are independent of the provider: exactly four original Segments and eleven original constraints; height50 stays fixed; only the width driving constant and solver-supported endpoint positions change. Every corner must match exactly one of(0,0),(w,0),(w,50),(0,50), two endpoint occurrences each. Segment endpoints must remain distinct; measured maxX−minX is positive. Coordinate acceptance tolerance is `max(1e−12mm,128*Number.EPSILON*max(1,abs(expected-coordinate)))`, documented specifically for these bounded binary64 fixture coordinates. This prevents the solver's ordinary1e−6mm residual tolerance from accidentally qualifying a collapsed micro rectangle. It is not a universal solver epsilon.

Actual diagnostic evidence must retain each equation's own original residual, unit and tolerance. Finite residuals are checked against those reported per-equation tolerances; local Jacobian/rank/uncertainty is retained without using equation counts, numerical failure, redundant admission or nullity as a global solvability proof. No fixed local-rank expectation is invented for tiny/large source scales.

Native supported prisms must be actual valid single solids with6faces/12edges/8vertices, exact runtime/source/feature identity and measured bounds[0,0,0]..[w,50,20]. Exact analytic volume is w×50×20:100000,120000,1000 and1e9mm³ for100/120/1/1e6. Volume tolerance is `max(1e−6mm³,64*Number.EPSILON*abs(analyticVolume))`; bounds tolerance1e−6mm. Actual Native read-only interior/exterior/wall point observations supplement those finite fixture controls; no preview classification is used.

Normal accepted creation Undo/branch truncation preserves monotonic feature high-water. The driver records before/allocated counters and requires Undo/Redo to retain the original allocated value/ID. Source dimension edits and all refusals allocate no feature and preserve counters exactly. This is one authoritative document/history, not an alternate sketch or regenerated private model.

Raw failure and before/after accepted snapshots are frozen. Zero/negative and standalone discovery refusal compare every field/revision/token exactly. A full-history evaluated refusal may refresh only recorded opaque solids/journal/host inspection tokens; source/model/geometry/journal contents/material/counters/association remain exact. Fresh Open legitimately rebinds session/material tokens, with exact authored native contents. No arbitrary exception, AbortError, DIMENSION_REJECTED, nonfinite/malformed result or Native engine error counts as the expected planar refusal.

Run only after parent supplies exact composed pins/permission, using fresh evidence:

```sh
CODI_DESKTOP_SOURCE_ROOT=/absolute/current-desktop-source \
CODI_SIGNED_PINS=/absolute/runtime-pins.json \
CODI_EXPECT_SOURCE=exact-ACAD-source CODI_EXPECT_DESKTOP=exact-host-source \
CODI_DOMAIN_ENGINE_REVISION=sha256:exact-js:exact-wasm \
CODI_TEST_URL=http://127.0.0.1:PORT/ CODI_TEST_CDP=http://127.0.0.1:19329 \
PUPPETEER_CORE_PATH=/absolute/puppeteer-core CODI_EVIDENCE=/tmp/fresh-domain-proof \
node test/driving-dimension-domain/driver.mjs
node test/driving-dimension-domain/oracle.mjs /tmp/fresh-domain-proof
```

Driver PASS would mean this complete layer-specific workflow passed, NOT that every positive sketch length is Native-extrudable or that all Gate1 is complete. First failures must stay unchanged for grouped repair and a new whole-workflow run. Parent retains services/shared browser; driver closes only owned contexts after durable writes/readbacks settle. No account probes, private-state copies, cancelled filesystem-race work, deployments, E17 or geometry/render UI redesign.
