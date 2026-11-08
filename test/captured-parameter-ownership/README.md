# Captured equation parameter ownership and private auxiliary observations

Source-only repair after read-only review of ACAD66295ca. No unit/probe/TSC/build/browser run was performed. The unchanged complete orientation and disconnected-append workflows remain the first real application checks after root composes the source packet. No original failure/source/oracle is overwritten.

## Confirmed predicate defect

`capturedSketchEvaluation.ts` previously collected Params only from layer/root `visitParams`, then rejected every constraint Param absent from that set. A retained Bezier root's visit exposes eight control coordinates, but its real child Segment stabilizers own additional `ang`/`t` Params for two internal Polar rows. Those real descendants were incorrectly classified as foreign. This is independent of numerical optimizer drift: both handle Segments may point exactly +X.

Registered PointOnBezier/TangentLineBezier additionally create genuine constraint-owned auxiliaries. PointOnEllipse creates a genuine angle auxiliary too, including the two intrinsic endpoint relations of an EllipticalArc. None are object/descendant geometry Params or persisted source fields. Their fresh factory defaults are not solved witnesses: e.g. PointOnBezier creates t=.5 even when the valid captured point is at another curve parameter. Merely allowing arbitrary entries from `c.params` or evaluating that default would not repair the contract.

## Exact source/API slice

- NEW `headless/capturedParameterOwnership.ts` inventories actual root/descendant objects through the same real model/index/stages and real Param/SolverParam back-pointers. It replays the genuine registered `defineParamsScope` on the same objects: every geometry slot must match its exact actual Param identity. Only named auxiliary slots in the three existing factories are qualified. An auxiliary must be a separate real Param with the registered factory policy, never a geometric Param or an alias of another constraint/role. Unknown future auxiliary factories refuse explicitly.
- `solveSketch(request,onAuthoredEvidence?,onAuxiliaryWitness?)` adds only an optional THIRD internal callback. It runs after the existing real full solve, output domains, original equations, generator/intent/source checks and diagnostic work. The helper also checks live successful stages and original auxiliary equations. The callback receives detached frozen bounded plain observations, privately branded within this Worker realm. No live model references escape.
- `evaluateCapturedSketch(sketch,external,coldEvidence,newPrimitiveId?,auxiliaryWitness?)` retains its first four arguments. The optional FIFTH argument must be the actual private batch. It installs only matching declared auxiliaries into its new one-use decoder. All geometry Params, including composite descendants and derived shape parameters, are snapshotted and must remain bit-exact. The existing original equations/domains/fixed boundaries, cold authored classifications, generator/source ownership and before/after serialization checks still run at the CAPTURED geometry.
- `independentPrimitiveAppend.ts` collects that private batch from its actual whole-candidate cold solve. Only AFTER unchanged full intent/replay/branch bounds does it pass the observations to captured-coordinate evaluation. Cold geometry is never copied over old source. The existing second genuine Worker recomputes the whole operation from the ORIGINAL request, including its own real private observations, before exact candidate-byte comparison and ordinary guarded shared replay/publication.

No IO/AlgNum/PM/.cad/Craft/journal, request/response, source schema, persistence, default engine or mathematical equation is changed in this slice. Existing source geometry bounds remain unchanged, including1e-9mm replay equivalence and registered residual/domain tolerances. A cold auxiliary observation that fails original equations at captured geometry REFUSES; no extra solve/retry, clamping, coordinate seeds, normalization or fake success is introduced.

## Private observations and bounds

Rows contain actual stage + **allConstraints index** (including intrinsic rows), exact registered type, ordered actual source object IDs and named auxiliary role/value pairs. These are response-local proof locators, never saved authored IDs or Native topology indices. Cold load and the fresh decoder both reconstruct the identical serialized object/stage order. Original cold evidence remains authored-only and unchanged.

Explicit roles:

| Existing factory | Slots | Values |
|---|---|---|
| PointOnBezier |8 | dimensionless Bezier parameter |
| TangentLineBezier |8..12 | Bezier parameter, point x/y, raw Bezier derivative x/y (not normalized direction) |
| PointOnEllipse (including EllipticalArc internals) |7 | actual ellipse parameter angle; no new wrapping/clamp |

All values are finite; original registered domains decide admissibility. No new arbitrary magnitude cap replaces those existing domains. Each ownership inventory has a1,000,000-work bound; batches have at most10000 rows and8MiB encoded bookkeeping. This8MiB is INTERNAL Worker proof data, not permission to post it through the64KiB public registry or parse/loop over it on the UI thread. The immutable batch may serve multiple fresh readers in the SAME request/Worker; cloning or serializing it loses its private brand. This permits a connectivity decoder and final evaluator to share one genuine observation without an extra cold solve. It is not a persistent cache or second geometry owner.

Every row and alias is checked before the first auxiliary write. Geometry snapshots are checked before/after installation and after original-equation evaluation. Witness data is not attached to solver replies, authored bytes, diagnostics, journal entries, Native files or public receipts. Normal solve callers that supply no callback retain their prior interface/path.

## Whole public/native workflow strategy and real coverage gap

First run, unchanged, the full `test/line-orientation-public-workflow/desktop-driver.mjs` and `test/disconnected-primitive-append/desktop-driver.mjs` on one composed source-pinned normal app. They genuinely author constrained Segments, unrelated Point and all four current append kinds through registered commands; preserve old source exactly, test real refusal/UndoRedo, and perform normal Native Save/server sync/fresh Open/reedit/resave. They must not be relabeled Bezier/ellipse auxiliary positive proof.

A complete auxiliary workflow needs these actual ordinary setups, all from genuine authoring operations:

1. Bezier with two valid nonzero handle Segments; add an unrelated Point/Segment and preserve every existing source/annotation/constraint byte, travel, Save/Open/reedit. This directly reaches the formerly omitted child Polar Params.
2. PointOnBezier at a parameter different from .5; append a disconnected primitive, preserve curve/point source, confirm original equations using the actual private cold observation, travel and native reopen/reedit. A fabricated .5 default must never stand in for the point's valid relation.
3. Genuine line/Bezier tangency with nonzero derivative; same unrelated append/travel/native persistence. Candidate movement only within existing replay bounds; the transferred observation must still satisfy the exact original registered equations at captured coordinates.
4. A noncircular rotated Ellipse/EllipticalArc, including real intrinsic endpoint relations and a valid ordinary point relation; repeat unrelated append and persistence with exact retained geometry/branch/source.
5. Ordinary invalid relation/domain or contradiction requests preserve the last valid document and shared chronology. Do not label numerical nonconvergence as proof of impossibility.

**Current public coverage gap:** the shared `append-sketch-primitive` adapter advertises only Point/Segment/Circle/Arc. It cannot author Bezier/Ellipse/EllipticalArc; shared relation commands do not expose PointOnBezier/TangentLineBezier/PointOnEllipse. Genuine human actions exist in `objectToolActions.js` (BezierTool/EllipseTool/EllipseArcTool) and `constraintActions.js` (PointOnCurve and Tangent); EllipticalArc's own real stabilizer creates PointOnEllipse internals. A full equivalent public-agent authoring slice needs separate approval. This packet adds no test-only command, direct source seed, fake canvas, successful seeded model or automated GUI authoring. Therefore those four positive auxiliary workflow rows remain OPEN, not passed by this source repair or by a transport fixture. Existing genuine Native fixtures, if later available with producing provenance, may be replay-only controls and must retain that scope.
