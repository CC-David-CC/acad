# Installed browser Worker/client qualification — 2026-11-05

PASS on exact CAD `cbb148326187afa356e5a2e71b855b4cee8dd395`, private direct
fixture20465 / Chromium CDP19329, own isolated context, now closed. No service,
route, application source or full app build change by this lane.

| Bound input/artifact | SHA256 |
|---|---|
| Served app index.bundle.js | c03443ac4f84fad78ec8239bc97c0adb98f1bd7695c084228c2e49746ad13286 |
| Installed sketch-solver.4d434de24cfc6d8b819d.js | 00285f5b6681ae1691a949a20c952ff2e321cd85deb4f0a81af6f6bae576ff0f |
| Unchanged production client.ts source | e6687c41dd063c9fa0c3eeae6e4974ea6701cb2d1baecc7485eb517a7f6ca977 |
| Test-only browser client wrapper | a675d09109595b16844c47c27a29088fd6b150f59ae32ed5224e704743629159 |
| Canonical request fixtures | d5ff3b5d57e5dede586c1ac339a45ef682ba1aeac2a4db669e8e832e4c0bbadb |

The script fetches and hashes actual served app/Worker bytes before tests.
The wrapper imports the real unmodified production runSketchSolve module;
client.ts has no source diff between349eb4d60 andcbb148326. Its own bundle is
SHA-pinned and fulfilled through CDP Fetch at a same-origin test-only script URL.
No Worker request or successful reply is intercepted or synthesized.

The actual document enforces `script-src 'self' 'wasm-unsafe-eval'` and
`worker-src 'self'`; ordinary script unsafe-eval/unsafe-inline are absent.
Style policy allows unsafe-inline, which is recorded and not confused with
script permissions. The loaded wrapper and all actual Workers obey this CSP.

## Exact evidence scope

50 canonical requests are captured from the earlier actual async Save / Node
real-backend controls, after shared sketch-model IO has serialized annotations and
native-format defaults. The emitter only adds a test trace; it does not change
production or fake synchronous Save. Canonical payloads are replayed through the
real browser client against the actual installed production Worker:

- 40 registered schema/geometry Save-validation successes, including all circular
entity pairs, different concentric radii, direction branches, curves, derived
references, zero point distance and negative signed distances.
- Two typed flag Save-validation successes (TangentLC and Fillet).
- Eight refusals: unknown schema, missing reference, unknown geometric intent,
degenerate circular geometry, nonnumeric Infinity geometry literal, negative
unsigned point distance, degenerate Bezier and solver-changed geometry.
- All request objects remain unchanged; successful responses are validated:true;
refusals carry structured errors from the installed Worker.
- 51 actual sketch Workers start and terminate. The final control injects a hold
on a real received Worker message, then aborts the real client; AbortError is
observed and that Worker terminates. No fabricated success replies are used.
- Zero CSP violations and zero unhandled rejections in the tested scope.

`browser-cbb1-result.json` records all50 named results, actual pins, CSP and
termination/cancellation counts. This qualifies the tested **production client
module + installed browser Worker** path. It does not prove actual UI/canvas
interaction, application Save action sequencing, full native model/kernel
rebuild, signed account/host Save, consuming-feature journal, broad catalogue or
worker-first performance. Those acceptance paths remain separate.

## Retained first oracle failure

`browser-cbb1-before-style-oracle.{json,log}` records the first attempt stopping
before asset/test dispatch: the assertion searched the entire CSP for
unsafe-inline and mistakenly rejected its permitted style directive. The script
was corrected to inspect script-src specifically. The same app, Worker, wrapper
and request bytes then passed. Both owned contexts closed. No product change
was made in response to this test-oracle error.

## Reproduce on the matching owned fixture

Generate canonical fixtures by running the actual source-method/real-backend
suite with its optional trace output, or use the retained JSON unchanged:

```sh
CODI_SAVE_FIXTURE_OUTPUT=/tmp/registered-save-fixtures.json node test/review-save-compat/run-registered-save.cjs
CODI_CLIENT_OUTPUT=/tmp/registered-save-client node node_modules/webpack/bin/webpack.js --config test/review-save-compat/webpack.browser-client.cjs
```

The first command runs the full40+typed/refusal source/backend suite before
emitting its requests. The second builds only the tiny test client wrapper;
no app/helper/production Worker is built. Set JSKETCHER_TEST_URL and CODI_TEST_CDP
to the owned matching fixture, then provide CODI_SOURCE, CODI_SKETCH_WORKER_URL,
CODI_SKETCH_WORKER_SHA256, CODI_APP_SHA256, CODI_CLIENT_WRAPPER,
CODI_CLIENT_WRAPPER_SHA256 and CODI_SAVE_FIXTURES. Optional CODI_BROWSER_RECEIPT
writes the full receipt:

```sh
node test/review-save-compat/registered-save-browser.test.cjs
```

Exact local wrapper used here is `/tmp/codi-registered-save-browser-client-cbb1/client.js`.
Fixture export is `/tmp/codi-registered-save-browser-fixtures-349.json`; it was
emitted from a production-clean349eb4d60 source tree with test trace changes.
Generated request revisions vary between exports; pin the actual retained file.
Newer app/Worker artifacts need new byte pins and their own runtime qualification.
This control does not change qualification recorded by the stage/generator or
curved-boundary owning lanes; it tests empty boundaries. Broader open gates stay
visible in the compatibility note/root handoff. No release or packaging
completion is claimed here.
