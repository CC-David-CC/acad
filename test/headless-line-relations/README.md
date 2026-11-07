# Shared Worker Collinear — bounded qualification

Runtime commits `01b7e3941` and `724178adc`, based on root `607b1ea42`.
The actual app passed at private loopback20630. This qualifies one public model
operation and downstream composition, not the whole CAD1/Gate1 matrix.
Exact pins and raw results: `pins.json`, `observed.json`, `signed-regression.json`.

## Public contract

```js
craft.applySketchLineRelation({
  revision, faceId, kind: 'collinear', ids: [segmentA, segmentB]
}, {signal, valid})
```

Discover revision and native IDs through `inspectSketchTransitions` and
`inspectClosedSketch`. This version admits only `kind:'collinear'`, two distinct
Segment IDs and the existing bounded legacy-numeric closed-sketch scope.
It relates their infinite supporting lines; disjoint intervals are valid.
Both directions must remain finite, nonzero and consistent with live polar
parameters before/after solving. Collapsed endpoints cannot provide an escape.

The common journal receipt adds:

```js
relation: {
  kind: 'collinear', typeId: 'Collinear', objects: [segmentA, segmentB],
  stage, index, status: 'accepted', existing: false
}
```

Status is accepted/redundant admission, not a general Jacobian-rank/DOF claim.
A new relation authors one native constraint even if its initial geometry
satisfies it: changed:true, authoredUndo:true. An existing same unordered pair
is an explicit no-op: existing:true, status:'redundant', changed:false,
authoredUndo:false. Exact native bytes/versions, expression/model/history streams,
history, journal and model identities remain unchanged. Objects echo the requested
pair; stage/index identify the existing row, whose stored order can be reversed.

## Implementation and provenance

`prepareLineRelation` extracts existing UI admission/transaction validation
without changing the Collinear/AxisSymmetry equations. UI membership/revision/
recovery guards and its history boundary remain. The public operation uses a
genuine HeadlessSketchWorkspace/PM/IO inside disposable Workers. No Canvas, fake
viewer solver, geometry seed, public source setter or AI provider is involved.

Candidate checks preserve old authored identity, metadata, generators,
annotations, bindings and native branches. Only solver-backed geometry and one
requested constraint may change. Independent normalized endpoint measurements
verify supporting-line incidence and both live directions. Duplicate handling
returns original source bytes, not reserialization.

A private explicit whitelist shares candidate verification with signed-distance.
A second real Worker recomputes the exact operation from captured old source and
bindings, then compares exact candidate bytes, status and full relation metadata
before replay. This binds even finite unsolicited free geometry: valid or
re-solvable JSON alone is insufficient. No caller chooses a module, callback,
dynamic import or evaluated source. Existing signed task names and strict nonce
envelopes remain. One additional bounded Worker is an acknowledged cost; a
cheaper trust scheme needs its own qualification.

Full-tip replay, prepared source write and sketch-byte journal publish together.
Precommit failure writes nothing; ordinary travel restores saved native bytes.
Save remains separate.

## Downstream planner gap

Actual consumed construction-line Collinear initially reached the prism planner
and refused UNSUPPORTED_CONSTRAINT because its whitelist ended at LengthRelation.
`724178adc` admits only the additionally qualified Collinear, SignedDistanceX/Y
and ProjectedDistance families. The actual four-edge rectangle classifier,
region, frame, digest, role, topology and no-snapping rules remain unchanged.
Unknown types, rejected admission and unsupported profiles still refuse.

Admission hints in a planner fixture are not solver proof. The public extrusion
operation first reconstructs/solves captured native source in the real sketch
Worker, binds the resulting digest/current document/frame, then dispatches
geometry planning. Candidate provenance checks precede that replay. Planner
unit tests establish classification only; actual constraints/native reopen are
qualified by the production app.

## Actual production app evidence

| Control | Result |
| --- | --- |
| Disjoint collinear intervals | PASS: independent supporting-line measurement, no forced overlap |
| Free non-collinear segments | PASS: driven onto a common non-collapsed support |
| Existing pair reversed | PASS: exact native/stream/history/journal/model no-op |
| Undo/redo relation | PASS: exact native bytes |
| Same/missing/wrong-type/stale/accessor targets | PASS: refusal, exact capture, zero getter calls |
| Constrained horizontal supports separated by5mm | PASS: contradiction refused without collapse or authored change |
| Consumed rectangle construction-line Collinear | PASS: full replay retains actual100×50×20 OCC plate |
| Consumed SignedDistanceX/Y/ProjectedDistance | PASS: independent final endpoint measurements, same plate |
| Host-native Save and normal fresh native loader | PASS: exact sketches and body geometry |
| Extra envelope, changed index/existing flag, accessor relation | PASS: reject before replay, zero getter calls |
| Malformed native, unsolicited metadata/admission, finite free-point change | PASS: reject before replay, exact capture |
| Verifier extra/false/foreign nonce/accessor | PASS: reject before replay, zero getter calls |
| Genuine candidate/verifier held, lifetime invalidated | PASS: AbortError, committed:false, late original event inert |
| Genuine candidate held, expression-table ABA | PASS: no authored change; only the intentionally changed table stream revision excluded |

The original positive page terminates92/92 real Workers. Fresh native reopen uses
a separate normal page. The retained actual signed-distance suite also passes its
public workflow and14 fault controls on this same app, terminating74/74 Workers
in its positive phase. Counts do not claim measured memory release or all Workers
on other pages. Runners close their own contexts and disconnect from Chromium.

Separate controls pass: existing line UI/PM16; signed UI/PM29; descriptor
envelopes4; rectangle planner13; TypeScript noEmit. UI/PM tests retain their
fixture viewers and are not browser UI evidence.

## Limits and retained failures

This core lane does not claim signed My files/account integration or human
geometry UI. The desktop integrator owns those. Existing UI AxisSymmetry remains
supported by the shared helper; the new Worker route rejects that kind until
separately qualified. General DOF/rank, arbitrary stages/generated references,
typed request values, all scales/profile classes/kernels and CAD1/Gate1 remain
open. Only the actual OCC rectangle downstream path is qualified here.

Raw earlier failures are retained, not relabelled passes: r1 used an obsolete test
discovery method; r2 privately inlined the project Worker after moving it outside
a shared cache; r3 used mismatched old local OCC prerequisites; r4 exposed the
genuine planner whitelist gap. Private asset rules and reviewed e1/r2 native
prerequisites fixed fixture errors without relaxing product identity checks.
The r4 run did not capture a complete postfailure preservation oracle. Final r6
strengthens the earlier full r5 pass with explicit no-op stream and consumed
signed-measurement checks.

Raw logs/runtime are backed on R730 under
`/mnt/data10tb/codi-evidence/headless-collinear-20261105/` and
`/mnt/data10tb/codi-headless-collinear-20261105-r1`. Source/tests/notes go to both
LAN Git repositories. No account/key data, dependencies, generated build output,
public deployment or source release package is included in Git.

## Reproduction

Use locked dependencies and reviewed native prerequisites from the prior
signed-distance runtime. Build sequentially; private wrappers keep dependency
cache writes out of other worktrees and emit the project Worker as an asset:

```sh
node build/precompile-numeric.cjs
node node_modules/webpack/bin/webpack.js --config build/webpack.headless-sketch-worker.cjs
node node_modules/webpack/bin/webpack.js --config test/headless-line-relations/webpack.project.cjs
node node_modules/webpack/bin/webpack.js --config build/webpack.prism-semantic-worker.cjs
cp modules/workbenches/modeler/features/extrude/rectangleProfileRequest.mjs .build/prism-assets/rectangleProfileRequest.mjs
CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1 node node_modules/webpack/bin/webpack.js --config test/headless-line-relations/webpack.app.cjs
python3 -B test/enclosure-history/serve-craft-detach-fixture.py --root dist --port 20630
```

Tracked HTML/libs and reviewed native assets must be present in dist. The private
app includes the test helper entry and must never become a public release asset.
With isolated Chromium CDP already running:

```sh
JSKETCHER_TEST_URL=http://127.0.0.1:20630/ CODI_TEST_CDP=http://127.0.0.1:19329/ node test/headless-line-relations/browser.cjs
JSKETCHER_TEST_URL=http://127.0.0.1:20630/ CODI_TEST_CDP=http://127.0.0.1:19329/ node test/headless-signed-distance/browser.cjs
node --test test/headless-line-relations/envelope.test.mjs test/headless-signed-distance/envelope.test.mjs test/extrude/rectangle-profile-request.test.mjs
node node_modules/typescript/bin/tsc --noEmit --pretty false
```

`PUPPETEER_CORE_PATH` selects an installed dependency; `CODI_RECEIPT` writes the
synthetic result. The desktop adapter must not expose native source or substitute
a private helper for the public command.
