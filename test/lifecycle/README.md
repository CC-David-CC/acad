# Startup readiness and failure reporting

The inherited e0 loader did not report script/HTTP failures, rejected WASM
instantiation or InitCommands exceptions to lifecycle state. The host could
see only an unready frame until its deadline. These failures now populate
`streams.lifecycle.initializationFailure`. Lifecycle retains the first error
and will not later publish ready. `pendingInitializingJobs()` exposes pending
job names. Reentrant completion cannot load the project twice.

Six controls using the actual lifecycle and StateStreams passed: pending-job
completion, terminal failure, reentrant completion, thrown project load,
failure during extension activation and an unreadable error message.

```sh
node node_modules/webpack/bin/webpack.js --config test/lifecycle/webpack.config.cjs
node /tmp/codi-cad-lifecycle-tests/startup.cjs
node node_modules/typescript/bin/tsc --noEmit
```

These are lifecycle tests, not actual WASM startup evidence. Matching browser
script/HTTP/invalid-WASM failures, normal boot, independent windows and host
failure handling remain required. This is not proof of the cause or repair of
the earlier intermittent second-window timeout. No deadline or CSP changed.

## Actual browser startup controls

The focused browser control `browser-startup.cjs` passed normal startup, an exact-URL 503 for `occt.js`, an exact-URL 503 for `occt.wasm`, and invalid WASM bytes. Each failure retained `e0:loader`, kept `projectLoaded` false and left that job pending; the test observed no page error or unhandled promise rejection. CDP Fetch interception was limited to the one named legacy asset in each negative control; the normal case used no interception. Each case used a separate browser context. This does not establish the cause of the intermittent startup timeout or validate host failure presentation.

The R730 app bundle was rebuilt from source `99a8ca9439666bfa044839552be498f530ae819f` with `CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1`, webpack 5.74.0, Node 24.19.0, a private output tree, the existing read-only dependencies/compiled worker inputs and `resolve.symlinks=false, devtool=false`; fixture static assets were copied from the prior rectangle fixture. App bundle SHA-256 `6b87340a00c0c52fe6e896119a5f113e632acf417cf413e7f120cd650da692cb`; legacy `occt.js` SHA-256 `3c56e74e6e08411436a68fb930bab38aedd3137e4369af2bc67fd382e568787e`; `occt.wasm` SHA-256 `a2b2f7daf6a4eb98b975f8aec136f6cbaf2720295ea32e71edb13ff4c5ceaecb`. Source hashes: `occtBundle.ts` `b7d6a9ff111a57634c5db5a4eeed3cf477c9dcefdb12dafe33a0da40ea71d4da`, `lifecycleBundle.js` `bc3416758a64e3a970cc227b4ac110246019f3dc61941c813004b1f6d83f0394`. The unchanged fixture CSP allows `blob:` in script-src, as well as `self` and `wasm-unsafe-eval`; this is not a no-blob policy test. The fixture server and contexts are disposable.

```sh
JSKETCHER_TEST_URL=http://127.0.0.1:19717/ CODI_TEST_CDP=http://127.0.0.1:19329/ PUPPETEER_CORE_PATH=/path/to/puppeteer-core node test/lifecycle/browser-startup.cjs
```
