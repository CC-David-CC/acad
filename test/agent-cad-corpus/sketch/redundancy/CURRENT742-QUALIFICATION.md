# Matched candidate qualification — 2026-11-05

Candidate `024477975` was cherry-picked onto root `7422cf9249133fad6ca24c94591f18306d2dde53` as `0447b2a8bd59ce567077b3ff15ff89e01e64f983`. The sole product change remains the generic polynomial priority restart in `AlgNumSystem.ts`. No schema, tolerance, intent guard, solver framework, OCC/default, census or raw-provider change belongs to this candidate.

Actual matched Chrome `155.0.8059.79` qualification passes:

- App `Horizontal.invoke` followed by the real inspected/revision-checked `SignedDistanceY.invokeByIds` naturally returns redundant and serializes accepted/redundant. Admission labels are never assigned by the browser test. The geometry object arrays remain JSON-equal across the implied relation, and undo/redo restores the exact authored sketch.
- Actual `actionService.run('sketchSaveAndExit')` validates through the installed sketch Worker, commits and exits. Two targeted Workers start and terminate; genuine validation replies are recorded.
- `snapshotForHostSave` followed by fresh-page empty-workspace native-project restore preserves sketch records and model history. Opening the restored editor retains SignedDistanceY's redundant admission. SaveAndExit with no authored edits preserves exact stored bytes and starts no sketch Worker.
- The separate production-client/installed-Worker test accepts the fresh naturally authored record, strict reload and Save validation. Its older accepted/accepted record intentionally refuses `INTENT_CHANGED`, with caller input unchanged. All four targeted Workers terminate. The production client source is unchanged since the retained wrapper was built; its exact wrapper SHA is in the receipt.

[Application receipt](receipts/current742/app-r2-pass.json), [installed Worker receipt](receipts/current742/installed-worker-pass.json), [current fragment](current-fragment.json). The app helper seeds a segment through existing tools and opens the real editor; these are model/action/API tests, not trusted human gesture, canvas appearance, signed agent transport or host Files persistence claims. The native project is serialized and restored through the actual project manager, not reconstructed by the test.

The initial app harness read `sketchStorageKey` after successful exit had cleared the editor's face. Its getter correctly threw for the null face. [That failed harness receipt](receipts/current742/app-r1-harness-error.json) is retained; the correction captures the key before exit. No product fix was made for it.

The current [frozen-input comparison](receipts/current742/comparison.json) repeats the existing 89 inputs, all 37 registered schemas and two multistage cases. All 89 geometry arrays stay JSON-equal, 88 admission/error outcomes stay unchanged, and the sole older accepted/accepted pair strict-refuses `INTENT_CHANGED`. Inputs remain unchanged. [Current source receipt](receipts/current742/source.json). No older admission metadata is silently migrated.

The classifier remains numerical-algebraic at inherited `eqEps=1e-12`; it is not an exact dependence proof, physical DOF report, global satisfiability certificate or a Jacobian-rank reclassification scheme. Prior custom polynomial, partial-relation/reactivation and 27 mechanical atomic controls remain archived at their original source scope.

Performance scope: the app's small Save action elapsed 315.8 ms in this one run, including validation/publication and exit. This is an observation without a baseline or latency acceptance threshold. Repeated Node source controls (three samples each) yielded medians 1.04/21.96/182.33 ms for 16/128/512 independent locks, versus the historical baseline's 0.86/17.61/166.21 ms. Shared host, different runs, source load/prepare/solve only; these are not paired Chrome measurements or worst-case bounds. Restart work can increase preparation cost. Large models, general nonlinear scaling and 128 MiB history performance remain unqualified.

Exact matched pins:

- App `57c15127fe0030043094216cef6c897126bfdf91290115c1c23b58be74d372f3`.
- Installed sketch Worker `04d8de669388705426129690e283f9290b809d3e98b09da843db246422070d19`, served `/static/sketch-solver.826cc2e4f1b86a8d5ebd.js`.
- Test-only helper `7e06ff8e9608d0bc55938b7209c5aa57e0e56d2d5d214d3a8dea8317c7c457a8`.

Built only on R730 in `/mnt/data10tb/codi-diag-final-redundancy-0447-20261105`, using an isolated copy of the private build recipe with exact existing census and raw-provider caches. [Build pin receipt](receipts/current742/r730-build-pins.log). Strict CSP allows same-origin scripts/Workers and WASM compilation, with no JavaScript eval, inline script or Blob Worker permission. All owned contexts and the isolated loopback fixture were closed after tests. No public deployment, source packaging or shared runtime change occurred.

Reproduce browser runs with `JSKETCHER_TEST_URL`, `CODI_TEST_CDP`, `CODI_SOURCE`, `CODI_APP_SHA256`, `CODI_HELPER_SHA256`, `CODI_SKETCH_WORKER_SHA256`, `CODI_SKETCH_WORKER_URL` and `CODI_BROWSER_RECEIPT` from [current pins](current742-pins.json), then run `node test/agent-cad-corpus/sketch/redundancy/app-save-browser.test.cjs`. For `fresh-worker-browser.test.cjs`, also set `CODI_EXPECT_PRIORITY_RESTART=1`, `CODI_REDUCTION_BEFORE=.../receipts/before.json` and `CODI_REDUCTION_AFTER=.../receipts/current742/source.json`. Restore an isolated matched fixture first; the original session ports are not a permanent service.
