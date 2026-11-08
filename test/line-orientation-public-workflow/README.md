# Four shared line-orientation groups

Source-only coherent implementation and complete public workflow preparation. No tests, builds, probes or browser runs were performed in this lane. Root must compose a normal source-pinned app before running `desktop-driver.mjs`. The earlier signed-dimension driver is unchanged.

The missing route is now one bounded `apply-closed-sketch-orientation({revision,faceId,kind,ids})` command and matching `applyClosedSketchOrientation(request,{signal,valid})`. Kinds are horizontal, vertical, parallel and perpendicular. H/V accept1..16 distinct actual inspected ordinary Segment IDs and apply to each. Parallel/perpendicular accept2..16 and apply to each consecutive **ordered** pair. Inspection adds an `orientationGroups` catalogue; availability is explicitly `requires-worker-validation`, not a geometry certificate. Each catalogue row also reports available versus unsupported-typed mutation scope; existing typed-document mutation restrictions remain explicit.

Human Horizontal/Vertical/Parallel/Perpendicular actions and the public path use the existing common `prepareConstraintGroup` admission and atomic transaction mechanism, with actual original schemas and initialized constants. The existing midpoint, directed-angle, collinear and symmetry wires are retained. No arbitrary schema/equation/angle/source input is exposed. Candidate reconstruction, affected-closure preservation, original residual checks, fresh independent Worker reconstruction, coordinator currentness/publication and the existing sketch-byte journal are shared. No Native, default/catalogue engine, project format, toolbar or second design document is added.

New orientation intents use exact `{kind,action:'create',ids}`. Their discriminated group reply is exact `{kind,action,ids,existing,rows}`; each ordered row has `{stage,index,typeId,objects,angleDegrees,status}`. H/V rows contain one actual Segment ID; pair rows contain two. Branch constants are original canonical0/180 or90/270. Old midpoint/angle-chain reply fields remain unchanged. Exact compatible ordered existing rows are reused; mixed groups add only missing members atomically; ambiguous or branch-conflicting rows refuse. A wholly existing group is a no-op. No unordered/reversed-pair no-op is implied.

Parallel concerns supporting directions, not collinearity, finite intersection, endpoint coincidence or equal lengths. Perpendicular does not add an intersection constraint. Distinct nonzero overlapping/coincident-coordinate Segments remain distinct objects; there is no welding. Endpoint reversal changes the directed branch and ordered-pair reversal changes cross sign. Actual nonzero endpoint directions and positive polar direction are checked before/after admission; independent endpoint dot/cross checks accompany original angular residual checks.

## Narrow original-equation branch repair

Source review established the mismatch without executing a probe: Segment angle parameters are normalized in `AlgNumSystem.evaluateAndBuildSolver`, but the old Parallel/Perpendicular delegation used raw `theta2-theta1-angle`. Already anti-parallel locked A180/B0 initializes canonical180 yet gives raw residual-360deg; A90/B0 perpendicular similarly initializes270 and gives-360deg.

For canonical Parallel/Perpendicular only, polynomial construction now derives

```
k = round((theta2 - theta1 - canonicalAngle) / (2*pi))
r = theta2 - theta1 - canonicalAngle - 2*pi*k
```

from the actual current parameters. This chooses an evaluation chart, not a new authored datum. The linear polynomial has unchanged derivatives[-1,+1] throughout its solve. Rebuild after normalization and independent residual/replay reconstruct the chart from their own actual current parameters. There is no callback secretly reading stale object angles while SolverParams iterate, no persisted lift/negative-angle alias and no sine-only residual that would lose the co-/opposed or clockwise/counterclockwise branch. The chart choice has the usual half-turn boundary away from a satisfied branch; the complete rotated/wrap workflow is required before claiming the repair qualified. A follow-up schema-domain repair rejects noncanonical classes at shared schema validation and strict native preflight. Exact safe-integer full-turn literal aliases are admitted like H/V; raw saved literals remain verbatim, while evaluation transforms them to the canonical class. Parallel45 and Perpendicular0 are invalid named relations, not legacy behavior to preserve. Generic AngleBetween and its existing positive-branch angle-chain semantics are unchanged. Construction/domain and numerical tolerances are unchanged; no solver replacement or broad angle policy migration.

## Complete public acceptance prepared

`example.mjs` takes the real `createCadAgent` for one current window. It authors a real anchored10x10 datum rectangle, unrelated Point(7,9), and Segments exclusively through public commands. Actual append IDs are corroborated by inspection. Initial endpoint identities are selected from that Segment's two inspected actual handles using the explicit authored endpoint coordinates; subsequent identity always uses those captured IDs, never a reconstructed grammar or nearest match. Public signed X/Y dimensions fix starts or both endpoints. A public LengthRelation with factor0 gives the free-angle Segment a genuine fixed physical length; no source/equation is injected.

The complete driver includes:

- Oblique/reversed H/V groups with independent expected0/180 and90/270 endpoint directions.
- Disjoint Parallel, ordinary anti-parallel, both perpendicular turns, locked A180/B0 and A90/B0, and the reverse ordered perpendicular pair as its own actual row.
- Distinct overlapping and coincident-coordinate geometry; a partially existing group and exact no-op with no source/journal/counter/resource churn.
- Real zero-length append refusal; duplicate target, Point-as-Segment and stale revision refusals.
- Fixed endpoint conflicts, a group whose last member contradicts its first pair, and a genuine length10/signed-dx6 conflict. Every rejection must preserve accepted source/history/journal/counters/resources.
- Rotatable anti-parallel source170/350 through190/10 and350/170→10/190; clockwise perpendicular90/0 through350/260→10/280. The actual canonical authored constants must remain180 and270 through source edits, mixed creation/edit Undo/Redo and replay.
- Normal native-project Save/browser+server byte readback/fresh login Open, source reedit/Undo/Redo, resave and second fresh Open. All four schemas persist with the same actual source IDs and canonical constants; the session-local journal resets on Open.

The independent oracle derives expected endpoints from fixed authored starts/physical lengths and analytic direction angles. It compares both actual public canonical point measurements and detached native-project source, checks dot/cross **signs**, original schema/ordered bindings/canonical constants, the datum rectangle and every unrelated Segment/Point. It does not infer correctness from the solver residual alone. Frozen absolute coordinate tolerance is1e-6mm and normalized dot/cross tolerance1e-8. This is sketch/source qualification, not a BRep or physical-device/UI claim.

No held-reply injection, synthetic successful reply, raw source/model authoring, filesystem/security/account-race probe, service/runtime start or per-step test is part of the driver. All mutations are actual registered commands. It owns only fresh private browser contexts/accounts and leaves the shared browser/root fixture alive. First failures remain in fresh evidence directories.

Run once root supplies the complete source-bound runtime and private fixture:

```sh
CODI_DESKTOP_SOURCE_ROOT=/path/to/producing/desktop \
CODI_SIGNED_PINS=/path/to/runtime-pins.json \
CODI_EXPECT_SOURCE=EXACT_CORE_COMMIT \
CODI_EXPECT_DESKTOP=EXACT_RUNTIME_DESKTOP_COMMIT \
CODI_TEST_URL=http://127.0.0.1:ROOT_ASSIGNED_PORT/ \
CODI_TEST_CDP=http://127.0.0.1:19329 \
CODI_EVIDENCE=/tmp/codi-orientation-signed-r1 \
PUPPETEER_CORE_PATH=/tmp/codi-occt-release-control/node_modules/puppeteer-core \
/tmp/codi-files-move-node/bin/node test/line-orientation-public-workflow/desktop-driver.mjs
```

The driver pins the real mounted inner assets/outer index and producing recipe/helper hashes separately. The producing Desktop checkout need not equal the served Desktop commit; keep both recorded. Existing source audits/old component receipts are historical evidence and are not relabeled as this complete workflow passing. No whole Gate1 signoff is implied.

## First whole-run failure and current repair

R1 on compiledb378bb7/Desktop67326a656 reached66rows before the partially
existing parallel group refused CURRENT_GEOMETRY_MISMATCH at exact candidate
versus independent-solve equality. `evidence-r1` retains that whole run.
The group route now uses the existing production verified-replay contract: exact
authored source intent and original solved evidence, bounded supported connected
geometry and preserved branches, with no global history-equality relaxation.
The reply derives row status from final independent reconstruction rather than
the incremental precursor. This is source repair only until the unchanged full
workflow passes. No claim that the failed diff was only roundoff is inferred.

R2 on35a3606/Desktopd49071638 is retained in evidence-r2. The same mixed
group reaches the existing verified replay guard, which identifies an already
horizontal peer endpoint as moving beyond1e-9mm. This is not a successful fix;
the bound and original tests remain unchanged. The guard now includes the two
actual coordinate values and their displacement in its bounded failure message
so the next complete run can distinguish actual numerical movement from a
metadata mismatch. No additional solve, polishing loop or tolerance change was
introduced by this diagnostic improvement.

R3 is retained in evidence-r3: same.b.y changes80.00000002516768→
80.0000000015683mm (2.3599383780492644e-8mm). Source review identifies
warm internal Polar admission hints absent from serialized/cold reconstruction;
this changes ordering of the coupled solve. Numerical stopping remains a
hypothesis, not an assumed machine-roundoff explanation.

The bounded phase repair now constructs the actual candidate through the normal
cold solve first. A separate independent fresh solve must preserve that returned
candidate within the unchanged1e-9mm bound and with identical authored admission
classification. Exact authored intent, unrelated geometry and original-request
reconstruction remain enforced. The returned source is the checked first cold
candidate, not an unchecked last iterate. No retry/polish loop, global hint-order
change, numerical tolerance change or unsupported success is introduced. The
unchanged full orientation workflow must qualify this repair before any PASS.

Read-only review also tightened the final receipt guard: the verification
workspace's group locators/types/ordered refs/statuses must match the actual
returned cold source. An unchecked third-workspace admission cannot become
a public receipt. This is a source-contract repair, not a reproduced incident.

R4 on578b865/Desktopfaac58663 reaches71rows. The original mixed group and
exact no-op pass; a later stale-source refusal exposes a harness expectation
mismatch. captureJob explicitly returns DOMException AbortError/code20 for
stale source revision, while the driver expected STALE_HISTORY. Independent
comparison confirms unchanged accepted source/history/lifetime/resources under
the original declared diagnostic-token policy. evidence-r4 remains whole FAIL.
The corrected case requires exact code20/name/message, not arbitrary cancellation.
Source review also aligns zero-length append with the exact DOMAIN response
already established by ordinary-entity-native-integrity/evidence-r1; no broad
error-code allowlist remains for that case. No product behavior changed.
