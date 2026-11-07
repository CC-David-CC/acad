# AxisSymmetry core qualification — scoped pass

This lane extends the existing shared UI admission and actual Worker command
`craft.applySketchLineRelation` to `kind: 'axis-symmetry'`, with ordered IDs
`[pointP, pointQ, liveAxisSegment]`. The points are an unordered duplicate pair;
the axis must be the same live nonzero segment. Distinct points with coincident
positions on the axis are valid. Reflection is about its infinite supporting
line. No new authored equation, constant axis length, or prescribed axis pose
is introduced. `inspectClosedSketch().lineRelations` describes the contract.

The overall CAD1 gate is **not closed**. Source commits `5c1092092` (API), `5d4f0e177`
(separate generic fine precision), `cb4cd78f5` (strict planner), and `e361f9524`
(separate Arc fixture precondition repair) precede `7757cf749` (separate
domain-certified normalization). The final R4 core passes the bounded corpus
below. No public deployment or signed host AxisSymmetry qualification is claimed.

## Final R4 results

| Scope | Result | Evidence |
|---|---|---|
| Actual public AxisSymmetry commands, unconsumed and consumed OCC plate | PASS150/150 positive-page Workers terminated;17 fault/lifetime controls | `evidence/domain-normalization/public-axis.json` |
| Actual retained public Collinear commands | PASS92/92 Workers;15 fault/lifetime controls | `evidence/domain-normalization/collinear.json` |
| Actual retained public signed-distance commands | PASS74/74 Workers;14 fault/lifetime controls | `evidence/domain-normalization/signed-distance.json` |
| Exact-domain/provenance and actual captured-source regression | PASS9/9 | `evidence/domain-normalization/focused.log` |
| Broad41-file PM/geometry corpus |225/228; same3 preexisting failures remain OPEN | `evidence/domain-normalization/broad.log` |
| Descriptor envelopes and strict rectangle planner | PASS17/17 | `evidence/domain-normalization/envelope-planner.log` |
| TypeScript no emit | PASS | R730 `codi-axis-tsc-r4-20261106.log` |

The genuine public workflow uses no native/formula authoring seed. It covers
horizontal, oblique, reversed and live axes; circle centers; distinct points
coincident on the axis; XZ sketch-local coordinates; duplicate exact no-op;
invalid/contradictory/stale edits; consumed construction geometry; X0 thenY10
live-axis edits; exact undo/redo; and normal native save/fresh reopen. Transport
controls hold genuine successful Worker output, mutate finite candidates or
metadata in explicit negative controls, and test cancellation/close/late replies.
The existing two-Worker provenance verification remains mandatory.

The corrected consumed counterexample ends with nonzero t10.151840455657837,
angle pi/2, residual infinity norm1.4210854715202004e-14 and15 evaluations.
Its invalid predecessor stopped after5 evaluations at the collapsed root.
The independent native equations and reflection oracle still determine
acceptance. Different valid free-point positions are not an identity guarantee.

`pins.json` binds the exact app, both production Workers, planner and semantic
Worker at runtime source7757cf749. `observed.json` summarizes scope and hashes.
The separate final test/evidence commit does not change runtime product source.

## Preserved evidence

`evidence/unconsumed-fine.json` is the actual full-application/Worker pass for
the earlier unconsumed workflow: horizontal/oblique/reversed/live axes,
coincident points, circle center, refusal/no-op/lifetime controls, native
save/reopen; 107/107 positive-page Workers terminated. It predates the added
XZ and consumed-plate tests and cannot qualify them.

`evidence/consumed-fine-failure.json` preserves the later failing actual app
run: XZ reflection and construction AxisSymmetry on a real consumed OCC plate
pass, then its live-axis X-distance0 edit fails before publication.
`fixtures/consumed-axis-zero-x-before.json` is the exact source captured before
that refused public command. `fixtures/live-axis-zero-x-before.json` preserves
the earlier, reduced unconsumed counterexample. These are diagnostic native
fixtures, never advertised as public authoring acceptance.

`evidence/consumed-stopping.json` and `evidence/same-start-lm.json` show that the
consumed failure reaches an inadmissible zero-length root. Dogleg: residual
infinity norm4.277038055147746e-11, gradient infinity norm6.76270715501259e-11,
5 evaluations, t1.3504334917023922e-10. Existing LM from exactly the same
pre-solve vector also reaches t0 in3 evaluations. LM remains diagnostic only;
there is no automatic retry, random jitter, feature-specific pose seed, domain
relaxation, or geometry-kernel fallback in the product.

`evidence/collinear-regression.json` retains the actual Collinear92/92 Worker
and15 fault-control pass; `evidence/signed-regression.json` retains the actual
signed-distance74/74 Worker and14 fault-control pass on the same R3 candidate.
Neither proves the unfinished AxisSymmetry consumed edit.

## Generic precision and broad corpus

Fine dogleg residual/gradient targets changed from1e-6 to1e-8 in a separate
commit; rough1e-3 targets and iteration limits remain. This resolves the first
noncollapsed residual counterexample and is not the claimed solution to the
second zero-length root. `precision.test.mjs` independently tests fine/rough
behavior. Existing domain guards and geometric oracles were not loosened.

The41-file broad PM corpus was224/227 before precision,223/227 immediately
after, then225/228 after the separate Arc fixture repair/new repair-acceptance
control. The extra post-precision failure was a bad test precondition: actual
ArcConsistency had repaired the supposed-invalid Arc to radius error
4.973799150320701e-14. The revised rejection control makes it demonstrably
invalid immediately before FixArc; a separate control accepts genuine repair.
The same three original broad failures remain unqualified and are being
independently triaged; they are not waived as gate acceptance:

- `actual legacy reevaluate writer skips only clock-only storage without skipping refresh/reset` — `test/mechanical/noop-sketch-save.test.mjs:36`
- `legacy reevaluate persists real geometry/metadata changes and retains boundary provenance` — `test/mechanical/noop-sketch-save.test.mjs:40`
- `explicit group and real segment endpoints follow a single transform with polar equations` — `test/mechanical/rigid-group-solver-probe.test.mjs:53`

The first two catch raw-eval `_objectSpread is not defined`, then fail their
effect-count assertions0!==1. The third's refusal probe was already admitting
the transform before this lane (true!==false). Full original stacks, caught
errors and test names are preserved in `evidence/broad-before-precision.log`,
`evidence/broad-after-precision-fixture.log` and the final R4 broad log. The
generated stack paths bind their exact original build; the source paths above
locate their authored tests. They remain explicit follow-up work, not waivers.

## Current bounded mathematical candidate

An active live-direction requirement supplies a nonzero-domain certificate.
If exact reduction leaves `t*cos(a)=0`, this domain permits cancelling the
common POW1 factor t; negative t is equally valid. The candidate obtains
certificates only from the same retained/trial subsystem's active directional
relations and existing nonzero guard. It never infers a certificate from a
parameter name or arbitrary nonzero current value.

The candidate tracks approximate reduction transitively through dependent
rows, substituted parameters, and eliminated parameters. Any dropped nonzero
epsilon coefficient or offset taints its descendants; an unrelated approximate
row does not taint an independently exact equation. Cancellation runs only
after **all** substitutions finish and no algebraic reduction follows it.
Missing proof skips cancellation.
Only exact common identity POW1 factors with exact zero constant are eligible.
Authored equations, origin objects, native bytes, admission order, original
residual validation, and final geometry-domain validation remain authoritative.
`domain-normalization.test.mjs` and actual app reruns must qualify this candidate
before any promotion. Nine focused tests pass, including two-step tiny-offset
and affine tiny-coefficient ancestry, certificate removal/rejection/stage
changes and actual captured native replay. The independent actual application
regressions above also pass; neither substitutes for the pending signed host
integration or the unfinished overall CAD gate.

## Required failure taxonomy follow-up

`AlgNumSubSystem.rebuildAdmission` currently loses candidate solve/domain cause
when it records conflict. `prepareSignedDistance.validate` maps `isConflicting`
to `DISTANCE_CONFLICT`, propagated by the transition/coordinator. A numerical
or domain failure is not proof of mathematical infeasibility. A separate bounded
change must preserve machine-readable cause and distinguish algebraically
proven contradictions, invalid domain, nonconvergence, and resource/iteration
limits while retaining the previous authored state. This candidate does not
silently change that public API.

## Reproduction and custody

Heavy builds/tests run on R730. Use its retained Node
`/mnt/data10tb/codi-3mf-qualification-SrUmue/node/bin/node` and reviewed dependencies
`/mnt/data10tb/codi-signed-distance-20261105-r2/node_modules`.
Local worktree `/tmp/codi-headless-axis-symmetry-20261105`; actual private R3
runtime `/mnt/data10tb/codi-headless-axis-symmetry-20261105-r3`, direct20634,
appSHA829991294f8cf5816ff81e2be021313820c6120d30e5d702b3c3ec3d2299f456.
Final R4 is `/mnt/data10tb/codi-headless-axis-symmetry-20261106-r4`, direct20635,
appSHA0964d5254a1bc34abad66db9ba142b45f759f23ea4b84c7c62e57689a3ab7d53.
Logs use `/mnt/data10tb/codi-axis-*-20261105.log` and `*-r4-20261106.log`; portable receipts are copied
under `evidence/`. Earlier fixtures are retained. No account/key state,
dependencies, binaries, WASM, or build output belongs in this source checkpoint.

Build focused Node suites using their `webpack.*.cjs`, then run the emitted
`.build/axis-*/test.cjs` with `node --test`. The normalization suite requires
`CODI_AXIS_FIXTURE=test/headless-axis-symmetry/fixtures/consumed-axis-zero-x-before.json`.
`browser.cjs` uses the genuine browser service and actual Worker outputs;
`diagnostic.mjs` is explicitly a real-solver diagnostic, not public proof.
