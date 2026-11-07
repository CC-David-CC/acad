# Browser XML timer resolution

`browser-xml2js` calls `require('timers').setImmediate` for asynchronous
chunk parsing. The installed npm `timers@0.1.1` is a different cron-like
package and does not provide that function. The exact webpack alias `timers$`
selects the small browser callback-task adapter; it does not add an npm
package or change the default synchronous parser. The adapter implements only
`setImmediate`/`clearImmediate`, not a general Node timers polyfill.

On `a96002ac` plus this change, the actual browser-xml2js bundle passed in
Chromium under `script-src 'self' 'wasm-unsafe-eval'` without `unsafe-eval` or
blob scripts. A 64-element document parsed asynchronously in 16-character
chunks, allowing 61 observed heartbeat ticks, with exactly one callback and
correct values. A malformed document returned one error; cancellation of a
scheduled callback worked; a non-function callback was rejected; terminating a
Worker running a longer XML parse produced no later completion. Worker
termination is the tested parser cancellation boundary—xml2js itself does not
expose an abortable parse. This is not a CAD file-import Worker integration or
physical-device performance proof.

The real application webpack config was built with private dependencies and
`CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1`; webpack returned no errors and
one existing duplicate-export warning. Its JSON module graph explicitly links
`browser-xml2js/lib/parser.js`'s `timers` import to
`modules/platform/browserTimers.js` and contains no `node_modules/timers`.
The resulting `index.bundle.js` SHA-256 was
`e65e0ba11b801d21ed18be1b6b819b7d9a790e1ecfc2023c36499cf0ca0844ab`.
Test entry SHA `73ff09ecfbaa6b226446130211c731ea8e4ad4286da290b7ba98b0ed817aec1e`,
test Worker `a8b9636856ad05013b7cb1f4daff2ea9affc8573dfdf8879989967025fd96794`.

To reproduce with the pinned dependencies/build prerequisites:

```
PATH=/tmp/codi-files-move-node/bin:$PATH node_modules/.bin/webpack \
  --config test/browser-xml-timers/webpack.config.cjs --output-path TEST_DIR
CODI_ENGINE_TEST_ROOT=TEST_DIR CODI_ENGINE_TEST_PORT=PORT \
  python3 modules/engine/mount/strict-csp-server.py
CODI_TEST_URL=http://127.0.0.1:PORT/ CODI_TEST_CDP=http://127.0.0.1:CDP/ \
  PUPPETEER_CORE_PATH=PATH_TO_PUPPETEER node test/browser-xml-timers/browser.test.cjs
PATH=/tmp/codi-files-move-node/bin:$PATH CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1 \
  node_modules/.bin/webpack --config webpack.config.js --output-path OUT --json > STATS.json
node test/browser-xml-timers/assert-production-graph.cjs STATS.json
```
