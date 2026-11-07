# Worker drawing and common Concentric integration candidate

This candidate adds an opt-in actual Canvas view to the craft service:
`openWorkerSketchView({revision,faceId},options)`, `inspectWorkerSketchView()`,
`selectWorkerSketchView({revision,ids})`, `closeWorkerSketchView()`.
Use `inspectSketchTransitions()` for the initial face/revision. Source is read
privately from the current workspace, reconstructed by the pinned disposable
Worker, and projected into detached analytic drawing records in that Worker.
The drawing surface owns no ParametricManager or numerical cache and cannot
report DOF. It never uses constructor-default solver success. Source changes,
expression/model changes, host cancellation and closing invalidate the view.
Canvas paths are derived caches, privately drawn in bounded slices and swapped
only after a final currentness check. Normal Files Save remains separate.

Concentric now uses the same headless admission helper, bounded pinned client,
full-history replay and atomic sketch/history publication as the existing public
closed-sketch edits. `applySketchConcentric({revision,faceId,ids},options)` takes
two discovered Circle/Arc IDs; callers cannot supply native source or write
callbacks. The desktop adapter registers `apply-closed-sketch-concentric`.

This is a first real drawing/selection surface and public command integration,
not replacement of the legacy active editor. Drawing constraints, annotations,
generators, labels and unprojected geometry remain explicitly unavailable in
this new view. Existing legacy tools still need migration to shared Worker
operations. No public deployment, CAD1/2 completion or source packaging claim.

Candidate TSC and focused Node transport/ownership tests precede the actual
combined-app browser test. Run `browser.test.cjs` with loopback
JSKETCHER_TEST_URL, CODI_TEST_CDP and PUPPETEER_CORE_PATH. It uses actual app,
Workers, native craft operations, Canvas pixels, source identity and exact
undo/redo; no canvas/solver stand-ins. Qualification receipts are recorded only
after this candidate is built and tested.

## Qualified runtime1c3 checkpoint

Exact source1c3f5dc3f built on R730 at
/mnt/data10tb/codi-worker-sketch-view-20261105-r2, private20493. App SHA
b55b1f47337d6cd23fe68c9cc91764b9727746f53e790687218e59b185c6c768;
sketch Worker26dbefbbc7a69128730385a81f822cfe07def2cf2b63a46a451551ba22f3d0d6
at static/sketch-solver.2248898c4f75fb46bd47.js. Actual served bytes rehashed.
Project Worker424c and test-only helper6705 remain unchanged. No deployment.

Root actual-app test passes view/drawing/object selection, invalid-ID atomic
refusal, public Concentric center equality, exact source undo/redo and host
cleanup with19/19 Workers terminated. Point-center picking passes trusted mouse
clicks after1280x900,390x844,3840x2160 viewport resizes; this is not physical
phone/touch proof. Observations/ records those bounded results. Independent
held genuine Worker reply tests also pass on1c3 (adjacent adversarial receipt).
Actual Canvas/RAF controls prove prompt staging release without callback delivery
(adjacent scheduling receipt); these module controls are separate from app proof.

Root dense native-fixture1c3 observation:2474ms Worker view open,31ms max sampled
sibling timer gap,16.8ms rAF gap, no observed long tasks;514 objects, real1069x647
Canvas and3/3 Workers terminated. This is one run under shared Chromium, not a
latency/heap guarantee. Source is admitted native fixture, not1,026 public calls.
The performance script accepts CODI_EXPECTED_APP_SHA for exact later builds.

Desktop1076ec10a signed20385 public authoring/view/Concentric/refusal/exact sketch
travel/Save/sync/account denial/fresh Files reopen passes. Its actual native
server hash is2a72555e8927e0322850af70407025f1553717f439b0e7c8a09b35c09f094e73;
desktop test/agent-cad-corpus/worker-view records bundle/catalog pins and script.
Earlier0ac five-hole and multi-plane regressions pass; those logs retain their
original source scope. Full legacy-editor migration, broader geometry/tools,
large3D display and final release/beta remain open. The original goal is intact.
