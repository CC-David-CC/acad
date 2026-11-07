# Selected-profile after-commit lifetime proof

This independent follow-up leaves the accepted 270-Worker adversarial corpus unchanged. It uses real public authored sketches, selected-region extrusion, native OCC evaluation and the public model publication observer. Each of three isolated contexts creates a radius-2 mm disk extruded 3 mm.

The observer queues a microtask after genuine geometry publication, before the asynchronous public command resumes. The normal control leaves the caller alive; the other controls invalidate the caller callback or abort the bound host. Once publication has committed, cancellation must reject with `AbortError` and `committed: true`; it must retain the accepted feature and geometry. Cancellation does not imply rollback.

The test independently checks one added history entry, unchanged source sketch bytes/versions, the published body and native volume 12 pi. Closing each host must release all engine owners/mounts and terminate every observed Worker. This is bounded component/public API evidence, not a complete gate, deep-history, signed desktop, Files or UI qualification. It neither forges Workers nor changes product code.

## Run

Use a source-matched strict loopback fixture and existing Chromium CDP endpoint. Set `JSKETCHER_TEST_URL`, `CODI_SOURCE`, `CODI_EXPECT_APP_SHA256`, `CODI_TEST_CDP`, `PUPPETEER_CORE_PATH`, and `CODI_RECEIPT`; run this directory's `browser.cjs` with Node. `CODI_FAILURE_RECEIPT` retains failure details. Set `CODI_EXPECT_BASELINE_POSTCOMMIT=1` only to assert the older success-after-invalidation defect; its receipt is labeled BASELINE, never PASS. The driver hashes the actual served app and Worker assets, closes only its own contexts, and disconnects from the shared browser.

## Observed comparison

- Baseline a0b363bce15e8533be17c9332b46a7e51ddeea5d / app 8ae3ddc83e706829761c66ddc573fae42f9d746171ee09c1ee3b0f0744d98965: normal succeeds, both invalidated calls incorrectly return success after committing.
- Fixed 0634a3c7cc077f7802649c9a78c37098ccb4e275 / app b239a615160b6aaa219f3649e6ea47e36759aaa8e560a4573bbba043d57f0848: normal succeeds, both invalidated calls reject AbortError with committed:true; accepted geometry/history remain intact.
- Each artifact executes 3 cases and 42 real command Workers. All terminate; every closed host reports zero engine owners and mounts. Exact receipts and asset hashes are in evidence/ and SHA256SUMS.

The fixed artifact also contains the parent's separately tested Boolean runtime change. This follow-up does not claim to qualify that change or the analogous box/Boolean final-return lifetime contract.
