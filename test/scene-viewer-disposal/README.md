# Owned scene/Viewer component teardown

Product a36a6b259 changes only SceneSetUp and Viewer delegation. Actual direct
Chromium appce8ce517 at private20646 passes nine teardown controls. Baseline
app655c7d15 continues evaluating controls and running animation callbacks after
Viewer.dispose, retains its controls/canvas, and renders again when late work
arrives. baseline.json records the original FAIL with source/test pins.

The fixed owner becomes terminal before cancellation or child callbacks. It
cancels only its stored RAF, disposes its own camera controls and renderer, and
removes only its renderer canvas from the original container. Repeated disposal
is inert. A delivered late native callback cannot schedule another frame, and
render/resize requests become inert. The final test keeps a newer real Viewer
in the SAME container: its canvas and animation survive old-owner teardown.
All counters forward the real Viewer, RAF, controls and renderer methods; no
fake Canvas/geometry/renderer or successful reply is supplied.

One injected fault throws AFTER genuine controls cleanup, reentering render and
animation requests. The owner still releases its renderer/canvas, preserves the
first error, and stays terminal. This is best-effort coordination, not a promise
that arbitrary exceptions inside a child resource release that child fully.
Cleanup is attempted once; later dispose does not blindly retry callbacks.
Views still own their geometries/materials. No authored model/history/source
mutation, forced GC, total RAM reclamation or browser-wide lifecycle guarantee
is claimed. Ordinary desktop iframe removal may release its whole realm: the
baseline test does not establish a leak in that separate host operation.

Independent read-only agent review found no concrete ownership/reentrancy/RAF
regression in this scope, including reentrant disposal during evaluation or a
resize emitter. The same app also passes13 actual plane/corner/model cases,
legacy override/subclass fallbacks and selection (corners.json). These tests
retain genuine model surfaces/native source, real view geometry and ownership.
This is not physical phone/GPU testing, a performance bound or all CAD1.

Run the matching loopback fixture with a separate test context in Chromium:

```sh
JSKETCHER_TEST_URL=http://127.0.0.1:20646/ \
CODI_TEST_CDP=http://127.0.0.1:19329/ \
PUPPETEER_CORE_PATH=/path/to/puppeteer-core \
CODI_EXPECT_APP_SHA=ce8ce5175d0636f7c1828a372b5f5c4dd273644130eb37ab5b23bdd1ab0b1057 \
CODI_RECEIPT=/tmp/scene-disposal.json node test/scene-viewer-disposal/browser.cjs
```

R730 runtime: /mnt/data10tb/codi-scene-disposal-20261106-r1. Build uses the
existing Collinear app config and pinned complete prerequisites from the
exact-reader runtime; no Worker/kernel asset is rebuilt or changed. Build and
TSC logs stay beside the runtime; the full TypeScript no-emit check passes. No public deployment, default kernel change,
signed Files repeat, dependencies or generated runtime output in Git.
