# Shared Worker-backed signed distances

Runtime source `e1e7839e7`, test source `ea392c110`, base `2c67f9bfe`.
Branch `research/headless-signed-distance-20261105`. Integrate runtime commits
`c2c5b925f`, `8d8c16d51`, `c25e66c8c`, `e1e7839e7` in order, then test/evidence
commits. This is a bounded shared-operation qualification, not a CAD gate pass.

## Contract

```js
craft.applySketchSignedDistance({
  revision, faceId,
  axis: 'x', // 'x' | 'y' | 'projected'
  ids: [pointA, pointB], // projected adds the live direction Segment ID
  distance: -7
}, {signal, valid})
```

Inspect candidates/revision with `inspectSketchTransitions`, then stable native
point/segment IDs with `inspectClosedSketch`. Values are literal finite signed
sketch-local millimetres in [-1,000,000, +1,000,000]. Typed request values and
string expressions are explicitly outside this slice; typed workspaces retain
the existing transition refusal. The document's native expressions and bindings
are preserved and used for reconstruction, not silently converted.

X means B.x-A.x; Y means B.y-A.y. Projection means
`dot(B-A, direction.B-direction.A) / length(direction.B-direction.A)`.
The authored direction segment remains a live reference, including its endpoint
order and negative polar-length branch. It is not replaced by a frozen direction
vector. A degenerate/inconsistent direction refuses. Zero is a valid distance
when the selected geometry remains valid; forcing both endpoint coordinates of
a Segment together refuses instead of publishing a collapsed entity.

The same axis/IDs/value deliberately adds an authored redundant constraint:
`changed:true`, `dimension.status:'redundant'`, `authoredUndo:true`. Geometry
being unchanged does not make a new authored relationship a no-op.

Success uses the existing shared receipt, including
`dimension:{axis,typeId,objects,distance,status}` where typeId is SignedDistanceX,
SignedDistanceY or ProjectedDistance, and status is accepted/redundant. It includes
faceId, new revision, persistence:'volatile-workspace', authoredUndo:true and
manufacturingAssignments:'review-if-present'. Save remains a separate operation.

`prepareSignedDistance` is shared with the existing UI entrypoint. The UI keeps
its existing viewer transaction/history boundary; the new command uses genuine
HeadlessSketchWorkspace/PM/IO inside disposable Workers. No hidden Canvas or fake
viewer solver is introduced. Existing stage, membership, generated-target,
prior-admission, rollback and projected-domain rules remain authoritative.

## Ownership and candidate provenance

The coordinator captures exact native bytes/version/frame, authored history,
expression streams/table, service identities, material revision and host/document
lifetime. A Worker computes one genuine constraint candidate and checks all prior
identity/metadata/annotations/constraints/generators/branches with the shared
allowed geometry policy. It solves again and checks the signed measurement
against actual final endpoints. The selected datum's native identity is retained.

Before scheduling full downstream replay, a second disposable Worker recomputes
that exact command from the exact captured old source/bindings and requires exact
candidate bytes and admission status. It returns only a strictly validated
nonce-bound `{revision,ok:true,verified:true}`. No tolerance weakening, main-thread
re-solve or fallback model is used. This binds even otherwise valid unsolicited
metadata, roles or free geometry to the operation that produced it. It costs one
additional bounded Worker; it does not author another transaction.

The existing full-tip replay, prepared storage write and sketch-byte journal then
publish together. Cancellation/currentness failure before publication writes
nothing; normal source travel replays the saved native bytes. This does not create
another history, document format or public native-source setter.

## Actual app qualification

`observed.json` records normal public empty-plane and primitive commands, then
public signed-distance commands through the actual production Worker dispatch.
There is no native/formula/constraint seeding in this workflow. A real host-save
envelope is reopened with the ordinary native loader in a fresh page.

| Control | Result |
| --- | --- |
| X=-7 and +4; Y=0 and -2 | PASS independent B-A measurement |
| Reversed direction projection=-5; oblique projection=+0.8 | PASS independent endpoint dot-product |
| Zero projection between distinct points | PASS |
| Zero-X Segment followed by zero-Y collapse | PASS valid first relation, second refused unchanged |
| Same relation twice | PASS one new redundant authored row |
| Conflicting/missing/wrong-type/same-ID/string/nonfinite/oversized request | PASS refusal, exact capture preserved |
| Accessor request | PASS zero getter calls |
| Old inspected revision | PASS AbortError, no authored write |
| Edit the live direction endpoint | PASS old projected relationship still satisfied after rotation |
| Undo/redo live edit | PASS exact prior/accepted native bytes |
| Native host-save and normal fresh reopen | PASS exact sketch source/intent |
| Cancel while ordinary solver lock is held | PASS AbortError, no authored write |
| Extra envelope/dimension, changed distance, accessor dimension | PASS before replay, zero getter calls |
| Malformed native JSON, valid unsolicited metadata/role | PASS before replay, exact capture preserved |
| Verifier extra/false/wrong nonce/accessor response | PASS before replay, zero getter calls |
| Genuine solved reply held, expression-stream ABA or lifetime invalidation | PASS AbortError, no commit |
| Genuine verifier reply held, lifetime invalidation | PASS AbortError, no commit |

Fault controls alter or hold a message only after a genuine successful Worker
computation. They do not fabricate successful solver results. The positive phase
started 74 Workers and observed all 74 terminate, including 13 signed-transition
and 9 verification Workers. Fault-phase held replies are separately labelled.
This is not signed-account/My files synchronization qualification; the desktop
integrator owns the public host registry, signed Save/sync/reopen and UI controls.

Pins of the actual retained private fixture (R730
`/mnt/data10tb/codi-signed-distance-20261105-r2`, loopback20613):

- app `d79b4af5ab22f5f201c5dcb0587af318c34e43d85570d271bac7d5d0e3e18f48`;
- sketch Worker `9fa5dd2fca0c36efd879496c67503719f3bb272dbed7552dff71a0f5138d8cd6`,
  served as `static/sketch-solver.239f5a78332cf15e50b5.js`;
- project Worker `134e945d13e0ae5416f00e6521af4be026e4133c545de961417b1add3ac94462`,
  served as `static/project-validator.4139afa9eed975359c26.js`.

Independent shared-UI regression bundle: 29 tests PASS after the helper extraction
(`test/mechanical/webpack.signed-distance.config.cjs`). These are real PM/action
controls with test fixtures, not a browser UI claim. Two descriptor/nonce envelope
unit controls and repository TypeScript noEmit pass.

## Cost and limits

In this small-case positive run, the additional verification Worker's native
constructor call was sub-millisecond. First-reply wall time was 241.8–276.5ms,
median258.6ms across9 Workers. The initial signed Worker was 239.3–272.8ms,
median261.6ms across13. These measurements include fetch, initialization and
computation together; they do not isolate pure solver or compilation time.
Cache/hardware conditions were not controlled as a benchmark. No large-drawing,
memory, hardware-GPU or whole-desktop responsiveness qualification is claimed.
Native-source 1MiB, authored-object1024 and existing shared request/history caps
remain unchanged. All heavy computation remains in Workers.

This slice exercises Point and Segment point IDs, supporting signed dimensions
and datum segments. It does not newly qualify every Arc/ellipse/spline/generated
or multistage interaction, typed driving lengths, finite-segment domain distances,
assembly dimensions, arbitrary third-party CAD import or other solid kernels.

## Retained negative evidence and follow-up

Initial source8d8 accepted a malformed native response far enough to start replay.
The observed delta was only an opaque inspect-authored-edits revision UUID refresh;
bytes/versions, history entries, journal targets and model IDs were unchanged.
The strict verifier now rejects that response before replay and preserves the
whole capture. Other existing transition families have not been broadened to
this verifier in this task; a shared general provenance check is follow-up work.

A test wait originally used default animation-frame polling after opening the
fresh-reopen tab. Diagnostics showed a genuine successful reply held=true while
that waiter timed out. Explicit50ms polling passes without a product change.
Earlier failure logs are retained with the final raw evidence, not relabelled as
solver contradictions. Raw logs are backed under
`/mnt/data10tb/codi-evidence/headless-signed-distance-20261105/`.

## Reproduce

Use the repository's locked dependencies and required runtime prerequisites.
Build the real sketch Worker, project Worker, then the private test app
sequentially with `CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1`:

```sh
node build/precompile-numeric.cjs
node node_modules/webpack/bin/webpack.js --config build/webpack.headless-sketch-worker.cjs
node node_modules/webpack/bin/webpack.js --config build/webpack.project-validation-worker.cjs
node node_modules/webpack/bin/webpack.js --config test/closed-sketch/webpack.app.cjs
python3 -B test/enclosure-history/serve-craft-detach-fixture.py --root dist --port 20613
```

Against an already running isolated Chromium CDP endpoint:

```sh
JSKETCHER_TEST_URL=http://127.0.0.1:20613/ CODI_TEST_CDP=http://127.0.0.1:19329 node test/headless-signed-distance/browser.cjs
node --test test/headless-signed-distance/envelope.test.mjs
node node_modules/typescript/bin/tsc --noEmit --pretty false
```

`PUPPETEER_CORE_PATH` selects an installed Puppeteer dependency. `CODI_RECEIPT`
writes a result; `CODI_POSITIVE_RECEIPT` optionally preserves the positive phase
before fault controls. The runner owns and closes its browser context. The helper
entry used by the private app build must never become a public deployment asset.
No service or public-site deployment was changed by this lane.
