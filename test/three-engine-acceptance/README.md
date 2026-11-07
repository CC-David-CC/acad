# Independent engine numerical acceptance

This is a headless browser API/real Worker test. It does not open a Viewer or use canvas, fake storage, replacement Workers, generated success replies, or another kernel as fallback. `cases.mjs` supplies analytic millimeter/mm³ answers. `matrix.mjs` preserves engine IDs and representations and adapts only the evidence field `volume` versus `signedVolume` for comparison. Signed mesh volume and bounds are independently measured from the actual Worker triangle buffer. Mutating the first box's returned display buffer must not change a second read.

`browser.test.cjs` creates and closes its own CDP browser context. CDP Fetch supplies only the two test modules under `/static/__three_engine_tests__/`; engine modules, Workers and WASM remain the real fixture assets. Served entry/dependency/Worker/WASM hashes are checked before import. Fixture operators must pin the complete transitive module graph; the checked-in configurations include the served relative module dependencies. Native/SMLib glue is statically bundled in the pinned Worker; the descriptor also records its source hash. These checks are evidence for a controlled immutable fixture, not a general supply-chain attestation.

Run against an existing loopback fixture, using the owner's exact config and immutable assets:

```sh
THREE_ENGINE_CONFIG=test/three-engine-acceptance/receipts/occ-native-config.json \
THREE_ENGINE_SUBSET=occ,native \
THREE_ENGINE_RECEIPT=/tmp/three-engine-occ-native.json \
CODI_TEST_CDP=http://127.0.0.1:19329/ \
PUPPETEER_CORE_PATH=/tmp/codi-occt-release-control/node_modules/puppeteer-core \
node test/three-engine-acceptance/browser.test.cjs
```

The SMLib prototype uses `receipts/smlib-config.json` and `THREE_ENGINE_SUBSET=smlib`. Without `THREE_ENGINE_SUBSET`, the configuration must contain exactly the three slots `occ,native,smlib`. Config fields are `fixture`, `source`, `pinnedModules:[{url,sha256}]`, and `engines:[{slot,moduleUrl,exportName,options,expected}]`. `expected` fixes `engine`, `representation`, `jsSha256`, and `wasmSha256`; only an explicit typed empty-result capability refusal may use `emptyRefusal`. Generic `ENGINE_FAILURE` must remain a failure.

The driver exits successfully when the run completes and writes all results, including failures. Consumers must inspect `qualifiedAllNumericCases` and each row. A clean process exit is not acceptance. Unknown operations and after-close errors are compared against the existing common `UNSUPPORTED_OPERATION`/`MOUNT_CLOSED` codes. Each row records actual differences rather than adapting them away.

Actual 2026-11-05 receipts are checked in. OCC/native use root source `9e9dadf84` at port 20467. The original SMLib prototype uses 20547; candidate `a5ba34740` uses `receipts/smlib-a5-config.json` and port 20549. Fixtures enforced `script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'` without JavaScript `unsafe-eval`. Contexts closed, no surviving page Workers, no CSP violations. All three passed seven nonempty analytic cases and independent triangle measurements. Original r2: Native16 pass; OCC14 pass+2 explicit unsupported; SMLib12 pass+4 failures. Updated a5 r1: SMLib14 pass+2 explicit unsupported, including confirmed candidate closure on empty refusal. Later budget controls retain a genuine closed-after-exhaustion error-code failure on a5; inspect each receipt. No report upgrades explicit unsupported to full qualification.

`node --test test/three-engine-acceptance/assertions.test.mjs` passes five tests of the oracle itself. These source tests are not Worker/kernel proof. In-flight cancellation, held stale Worker results, crash/disposal fault paths, mixed-engine operands, document history, agent transactions, and native persistence are separate open matrix rows in the review note. Near-tolerance thin gaps are deliberately outside these ordinary analytic cases; no kernel tolerance was relaxed. `emptyRefusalClosesMount:true` requires a real subsequent create to refuse `MOUNT_CLOSED` before skipping per-handle disposal for that terminated candidate.

Followup047 uses `receipts/smlib-047-config.json` at 20551. Its fresh numeric run has 15 pass/two explicit unsupported. Numeric receipts now include actual `performance.now()` init/roundtrip observations, browser version and explicit shared-process/cache scope. First mount within a run is not claimed cold compilation. Worker memory remains unavailable through this mount API; the separate `test/three-engine-resources` lane measures actual WASM linear capacity with labeled derived test bootstraps.

`smlib-lifecycle-browser.test.cjs` uses the same config variable and receipt variable. It checks actual public mount calls and explicitly labeled delivery timing/proof-field injections over a genuine Worker. Current047 passes11. Originala548 negative control fails six cancellation rows and passes five others. To reproduce that historical control without changing the fixture, extract `git show a548e2da0:modules/engine/smlib/smlibMount.mjs` into a temporary file, set `THREE_ENGINE_BASELINE_MOUNT` to its path and use `receipts/smlib-a548-config.json`. Only the exact SHA-matching historical entry module is then supplied through CDP Fetch; Worker078dc/WASM bytes remain real and unchanged. This is a historical-source control, not an integrated current-app result. See [scope and timing interpretation](../../docs/three-engine-review/lifecycle-and-timing.md).
