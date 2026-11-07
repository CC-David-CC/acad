# Atomic principal source-plane depth component

The implementation changes the saved `PLANE.params.depth` and its one derived sketch frame in the existing candidate replay transaction. It retains the source face, plane feature, local curve/point IDs, local geometry, constraints and all other source metadata. Independent principal XY/XZ/ZY planes with `datum:null`, saved sketches, canonical millimeters and finite signed depths within ±1e8 are the initial domain. Referenced boundaries, assembly placement and project parameter bindings remain unsupported. No source is created implicitly.

`CONTRACT.md` is the original approved proposal at066a38e5. The public service is:

- `inspectSourcePlanes()` → readiness, authored-edit revision and actual `{index,featureId,faceId,orientation,depth,canEdit,reason}` rows.
- `editSourcePlaneDepth({revision,index,featureId,faceId,depth},{signal?,valid?})` → a guarded no-op or the existing full candidate replay. Desktop registration and signed acceptance are separate work.

The private journal adds `source-plane-depth`, recording only plane identity, signed before/after depths and exact source bytes. It uses the existing64-entry/8MiB trim and document/revision/cursor semantics. Undo/Redo revalidates the original source through genuine Workers and retains historical whitespace/property ordering. Native handles, meshes and model snapshots are not journal entries.

Main-thread work captures bounded own-data identities, source strings and frames. A disposable production sketch Worker parses and validates the original source, derives the new principal frame and verifies a metadata-only local-intent change. A second disposable Worker independently recomputes it. Both passes share one30-second deadline and cancellation lifetime. The actual candidate evaluator reconstructs the changed PLANE; its existing `verifySketchFrames` must observe the matching frame before dependents. Prepared source writes, history/models and journal use the existing final publication batch. There is no live prestaging.

State progression is capture → preparation Worker → independent verifier → private history/journal proposal → dependent candidate replay → prepared workspace → existing atomic publication → notification. Failure or cancellation before publication discards the workspace/candidate. A genuine publication followed by lifetime loss retains `committed:true`. No-op rechecks currentness before and after caller callbacks, allocating no Worker, feature, candidate or write. This is scoped input for the maintained W02 inventory, not a second canonical state-machine document.

## Evidence and limits

`evidence/` contains source-bound component receipts and logs:

- 21 actual-production-Worker/service/coordinator groups pass: XY/XZ/ZY signed/zero placement, empty/Circle/Segment/constrained-rectangle sources, exact local preservation, exact historical byte travel, genuine held-positive cancellation/late reply, source ABA, reentrant no-op guards, stale identities, metadata/intent tampering, explicit64KiB encoded-response refusal and physical Worker release.
- 76 journal groups pass, comprising five new plane groups and71 retained scalar/source/region/depth/edge/hole/append/sweep/expression groups. No prior assertion was weakened.
- Strict-CSP Chromium passes24 source observations, with57 genuine production Workers created and57 destroyed; zero active Workers/page errors. Actual principal frames come from the standard plane operation. The owned browser/server/profile were closed/removed; shared browser/services were untouched.
- Full TypeScript checking passes with an empty error log.

The service fixture uses actual plane operation/classes, sketch reader, candidate overlay and the AST-extracted exact production frame gate. Its submit deliberately refuses `NATIVE_NOT_RUN` after preparation; it never acknowledges a native result or successful shared publication. The coordinator fixture executes the exact AST-extracted private coordinator with genuine Worker-prepared bytes, but its stream sink only records history/journal proposals. It does not run native geometry or accept publication. These are component/protocol controls, not a public app, Save/Open, dependent-body or full E15 acceptance claim.

Still required on a source-matched signed app: normal source-plane edit with a real dependent loft, native geometry/ID preservation, Undo/Redo, Save/sync/fresh Open and reedit; coplanar dependent-loft refusal; held genuine candidate disposal and resource preservation. Native metrology changes are independent of this source transaction.

## Retained failures

- `before-rectangle-fixture/`: the existing constrained rectangle draft is XY-only; the original broader fixture assumption failed. XZ/ZY coverage now uses four genuine primitive Segment additions, preserving the actual geometry assertions.
- `before-service-fixture/`: fixture omitted the production namespace-key storage method; an unsupported-history assertion also expected the wrong policy layer. Both fixture errors and their original logs remain.
- `before-noop-fixture/`: a hidden fixture flag was changed while the supplied callback still reported valid. It was replaced by an actual document AbortSignal transition; no production guard can observe an unrelated hidden variable.
- `before-private-travel/`: the new private wrapper spread journal `orientation` into the exact five-field public edit envelope, so genuine travel refused `INVALID_REQUEST`. The wrapper now explicitly selects index/featureId/faceId/depth. The unchanged exact-byte Undo/Redo test passes after that product correction.
- `before-browser-fixture/`: the first fixture served UTF8 JavaScript without a charset, corrupting a dependency's Unicode regular expression under the browser's inferred encoding. Original failures are retained; explicit UTF8 response headers fix the fixture. No production code or geometry assertion changed.

## Reproduction

Use an isolated checkout with the qualified dependency symlinks and its own `.cache/codi-numeric/precompiled.js`; do not write a shared build cache. Node24 was used. Build products remain under ignored `.build/source-plane-depth/` and are not in Git.

```sh
node test/source-plane-depth/build.cjs
node --test test/source-plane-depth/worker.test.mjs test/source-plane-depth/service.test.mjs test/source-plane-depth/coordinator.test.mjs
node --test test/source-plane-depth/journal.test.mjs test/mechanical/authored-edit-journal.test.mjs test/selected-profile-region-edit/journal.test.mjs test/selected-profile-depth-review/journal.test.mjs test/through-hole-journal/journal.test.mjs test/edge-treatment-journal/journal.test.mjs test/operation-append-journal/journal.test.mjs test/selected-profile-sweep/journal.test.mjs test/legacy-expression-refresh/journal.test.mjs
node test/source-plane-depth/browser.test.cjs
node node_modules/typescript/bin/tsc --noEmit --pretty false
node test/source-plane-depth/check-evidence.mjs
```

The browser runner accepts `PUPPETEER_CORE_PATH` and `CHROME_BIN` only for tool locations. It creates its own loopback port and profile; there is no service/account/native-state input, live deployment, filesystem race or security probe.
