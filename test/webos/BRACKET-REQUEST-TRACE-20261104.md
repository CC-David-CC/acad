# Bracket request trace

This is a diagnostic fixture, not a release qualification. The local test model was extracted read-only from a disposable signed-test account's preserved failure. It contains only that synthetic rectangle/sketch/history; the test never copies account credentials. The browser context and files belonging to the original test were left unchanged.

The retained original reported `TIMEOUT: Worker prism timed out`, without a phase. Post-failure Web Locks query showed no held/pending locks; it cannot establish whether a lock was held during the original failure.

On the same supplied d871 app assets at loopback 19708 and Chromium CDP 19329, a new isolated context restored the captured 150×50 mm pre-edit model, used the existing sketch test helper to edit it to 170×60 mm, and replayed the four authored operations. The trace records worker creation, posts, replies and selected network requests/responses; it uses the existing 30-second limits. Exact edited input restored in one separate control in 2.70 seconds with 11 faces. Two independent pre-edit restorations timed out after the four-corner worker dispatch; later identical restores completed. More detailed controls found stalled requests for `fourCornerHolePlan.mjs` and/or `fourCornerHoleTopology.mjs` preceding that worker result. In one, Puppeteer's `continue()` resolved for both modules; topology and its provenance module returned 200 while the plan had no response before timeout. In another trace OCC initialization had no observed WASM response; the same URL returned 200 from a concurrent curl. Another trace got WASM 200 and OCC ready but saw no response following the prism dispatch. The worker code imports helper modules during these calls, so the missing response is a concrete request-path symptom, not proof of a native Boolean hang. The 19708 endpoint is SSH-forwarded; Chromium, Puppeteer interception, fixture server and transport have not been individually isolated.

`CODI_TRACE_INTERCEPTION=scoped` enables a pure CDP Fetch session matching only the synthetic `test-only-helper.js` URL. Five consecutive independent restore + visible-edit/replay runs passed; `blanket` reproduces the signed test's page-wide Puppeteer interception, under which several runs succeeded and several timed out. This small nonrandom sample does not establish that blanket interception caused the original timeout or that scoped interception guarantees reliability. It justifies an identical full signed test with exact-URL-only interception and no changed application bytes or timeouts. The signed test owner runs that separately.

Example using the same disposable loopback fixture and an exact helper bundle:

```sh
CODI_TRACE_INTERCEPTION=scoped \
CODI_TEST_CDP=http://127.0.0.1:19329 \
CODI_TEST_APP_URL='http://127.0.0.1:19708/path/to/jsketcher-build/index-webos.html?DEFAULT&webos=1' \
JSKETCHER_HELPER_PATH=/path/to/webosTest.bundle.js \
PUPPETEER_CORE_PATH=/path/to/puppeteer-core \
node test/webos/bracket-request-trace.cjs
```

The helper bundle used in this trace SHA-256 was `51fa83afe22515e26669428497699319e2a650519429fac5a997d20513cdfce4`. No native application or production configuration was changed.
