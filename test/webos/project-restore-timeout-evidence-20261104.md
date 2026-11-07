# Project restore timeout ownership control

On source base `3fb7d3777bf868e103b54ba17ce6aae4530cda28` plus this change,
real Chromium ran the full app with its actual sketch, semantic and OCC workers.
A test-only Worker interceptor held an actual completed `profile-extrude`
response during restore. At the unchanged 30-second replay deadline the manager
reported the original timeout, recorded bounded internal counters, rolled back
already-staged sketch bytes while their generation was current, disposed the
temporary project, aborted its document signal and terminated the exact held
Worker. A deliberately delivered late response did not alter history or model.
The final run recorded elapsed 30019 ms, expected history 2, actual 0, pointer
-1, processing true, one candidate owner, one termination, and zero remaining
staged sketch keys. The test verifies staging existed before timeout.

The control holds a response after the Worker has produced it; it does not
simulate an OS crash, power failure or interrupt native execution mid-call.
Seven initial helper controls plus a cleanup-failure control exercise newer
service/generation protection, reentrant rollback, late continuation and
explicit cleanup errors with small doubles. The full TypeScript no-emit check
also passed. The deadline itself is unchanged; composing stage budgets remains
a separate design question. A synchronous event-loop stall cannot be preempted
by a JavaScript timer.

The isolated webpack build used private dependencies and a copied `.build` from
the integration workspace, `CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1`, and
`webpack --config webpack.config.js --output-path OUTPUT/static`. Public test
assets came from the existing isolated history fixture, overlaid with that
build. SHA-256: `index.bundle.js`
`a937fec196aaf416adc6322ab591aecebcf2ea51b4f70d2f4229d78e6103d648`, embedded
OCC Worker `a06bcc6cb9ac87e335d4ff59d6d570c6dd7a8acf7adf90e903339b9a13832f04`,
WASM `c39793b8aff34dc548b57fee1d901219e372702a5005ef92dfdf94994c012897`;
test `5ac60aed6831c3a94c60c9f58e94d577fb6676e0336b971f44f8c25df08b4abb`.
One pre-existing duplicate-export webpack warning was emitted. Run under the
loopback fixture with `JSKETCHER_TEST_URL`, `CODI_TEST_CDP` and
`PUPPETEER_CORE_PATH` set, then
`node test/webos/project-restore-timeout-browser.test.cjs`.
