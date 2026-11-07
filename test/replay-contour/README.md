# Replay, contour and failed-import checkpoint — 2026-11-05

Qualified private runtime source427a5cda2, R730 `/mnt/data10tb/codi-replay-contour-20261105-r5`, direct20491/signed20383. No public deployment, packaging or kernel-default change.

| Asset | SHA256 |
| --- | --- |
| index.bundle.js | a86b12ab91382d461a3ec26f04c9e56085543c317fe781c78e87ce905d9a7077 |
| webosTest.bundle.js (private helper) | 6705b2006d28b5f2665bded35b2b0833bc8efe38fac4ae515d2bf6811d5c07af |
| sketch-solver.d9991d9167715129b639.js | 3211e4c5f5b51dc6b19dbce0e29c4cd1dbdb15ce7bbc89c075d5973b3bf7bc87 |
| project-validator.3ae7f2bbbaedf25e54c3.js | 424c892e73e8427a84b9f2c974b756ed26a59296b8c5c0fa85bf2475c040f806 |

## Computation and projection

Actual dense closed-sketch input contains514 segments/512 locks in139,517 native bytes. It passes public inspection, LengthRelation, host capture and exact authored undo/redo, releasing9/9 Workers. Baseline997 relation/undo/redo sibling gaps were237/222/217ms with long tasks124/105/99ms. Candidate991 retained the workflow with gaps166/162/147ms and no reported long tasks in that run. These are single shared-process observations, not hard limits or a completed responsiveness gate. CPU samples identified contour pair scans/class getters and coordinate hash collisions alongside display/viewport work.

The reader caches curve predicates, skips paired-curve scans for all-line input and indexes exact graph endpoints/edges with numeric Maps. It retains Graph's loop algorithm, insertion order, last directed-edge replacement and finite-coordinate equality including signed zero. Fourteen actual installed-reader cases preserve exact objects, contours/orientation, region IDs and error facts before/after: disjoint/nested/touching/duplicate profiles, paired arcs/chord, reference geometry, signed zero, fractional coordinates and a dense open sketch. Dense contour preparation was75.9ms on997,2.6ms on991 and4.6ms on427; geometry reading stayed about14ms. This unsaved component fixture is not solver admission or native Save proof. Actual five-hole edit/refusal/cancel/undo/redo/Save/native reopen separately passes427.

Contiguous independent standard PLANE replay uses one staged registry flush instead of rebuilding the growing index after every feature. Eligibility binds the actual standard implementation and absence of custom admission; descriptor/run/admission are rechecked after parameter materialization. Every registry read and final evaluation uses unchanged strict identity/sketch preflight; nonstandard operations flush first. Legacy parameter checks remain; shell inventory is fetched only when the existing implicit Boolean-target rule needs it. A2,000-plane991 restore used one flush but still had roughly2s sibling stalls during scene/viewport work. This does not solve overall large-model viewing. Real task yields let timers/cancellation run between candidate slices without lowering10,000-history support. Failed reads no longer mark a sketch initialized prematurely; same-face retry is reproduced on991 and passes92/final427.

## Failed temporary imports

A stronger991 control returned AbortError and later published10,000 models/history. Source rollback and snapshot quarantine alone were insufficient. Final427 binds caller cancellation to the temporary restore, rolls back while receipts can still be current, then passively checks exact service/generation/signal and closes only that lifetime in the same synchronous turn. Its craft/engine replay cannot publish later. Validation-stage failure and reentrant caller-signal checks are covered. Frozen signal/valid capture prevents caller option mutation from switching the installed signal; enclosing APIs still carry independently checked revision metadata.

The API requires a new hidden EMPTY workspace, discarded by the host on failure. It does not close an existing user's open design. Newer services/generations are preserved. Host-invalid receipts can return false: staged RAM bytes may remain in the disposed private workspace until its iframe is discarded. Do not call that verified per-key rollback or external persistence. Caller-signal cancellation while host-current separately verifies baseline bytes restored.

Actual42710,000-plane cancellation returns AbortError after5.014s, retains baseline source/expression and zero models/history immediately and12s later, closes the document and releases all tracked Workers/engine owners/mounts/candidates. A sibling CAD stays live. This proves cancellation, not successful10,000-feature publication. Actual options controls prove swapping the caller's signal cannot erase captured cancellation; aborting only the replacement signal does not cancel the captured job; option getters refuse without invocation. Real storage/helper and exact API observations retain separate scopes.

Signed primitive, bracket-family and material/core3MF workflows pass, including My files Save/sync/fresh-login reopen and separate-account file denial. Both accounts log in normally. Independent3MF checks retain2 objects/3 regions/84 triangles and expected bounds/volume/interface. Desktop `test/agent-cad-corpus/primitive/SIGNED-427-20261105.md` records exact bundles/server/export hashes.

## Reproduction and remaining work

Build pinned dependencies/native prerequisites and normal Workers as in the preceding public-primitive receipt, then `node node_modules/webpack/bin/webpack.js --config test/closed-sketch/webpack.app.cjs`. Use Node24/Puppeteer Core/CDP19329 and loopback fixture URLs. Root scripts are under `test/contour-index/`, `test/dense-closed-sketch/`, `test/rectangle-edit/`; cancellation receipts are under `test/arc24-history-admission/` and `test/arc24-registry-review/`. The helper never becomes a public asset. No account/key/fixture state is source.

Open: active2D hydration/cache consumers, shared Worker operation coverage, large-model scene preparation/render budgets/cancellation, general raw-input ownership and large-container admission, full CAD1/CAD2 acceptance, combined release and managed beta. Files stays accepted within its recorded scope. Separately backed component candidates are Concentric70038daed and projection3deae76c7 with hook fixd75f16676/evidencef726498a0; none is production-dispatched in427. Installed Worker3211 has no optional evidence hook. The independent review corrected an aliasing defect in that future hook; do not infer it existed in427.
