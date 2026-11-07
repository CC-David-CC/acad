# Headless DXF export prototype

The export request is a private, captured `{revision, unit:'millimeter', sketchJSON, frame, externalParameters, parameterSource}`. Successful response is `{revision,ok:true,blob,unit:'millimeter',coordinates:'sketch-local',frame}`; the Blob is produced in the Worker as `application/dxf`, capped at 8 MiB. The parent owns currentness and file publication. The native source, constraints, metadata and world-space frame are not encoded into the DXF; the captured frame accompanies the response, and typed expressions are evaluated in the Worker to verify the saved geometry.

The actual headless workspace is solved/replayed and serialized again before export; geometry or authored intent drift refuses. The writer receives the real sketch layer, including analytic face boundaries. The reserved generated ground origin is omitted. NURBS boundaries, annotations and unsupported sketch shapes refuse. Native full-sweep Arcs export as DXF CIRCLE using the exact model branch predicate (qualified below). This is not yet a complete replacement for legacy DXF export: annotations and some curves remain unimplemented. The ellipse writer path is present but has not been independently qualified here.

Private strict-CSP Chromium Worker run used webpack test-only `worker.ts`, worker SHA-256 `841835bd29ac48891b661e192f735c6f6e5f9561e7b54eca790c84bf912b161b`, and verb SHA-256 `55f13091a656c635d1ebe3931a9b52236c65023549b7b69bc8278362f87686f3`. `browser.test.cjs` independently reads DXF group codes to check millimeter `$INSUNITS=4`, exact primitive entity types and sample coordinates/radii, no injected ground POINT, and separate analytic line/circle/arc boundary counts and positions. A typed length expression matching saved geometry succeeds, while changed length and wrong dimension refuse. It checks frame mismatch, annotation and NURBS refusal. This test does not yet qualify the shared production transport, cancellation, or actual Files writes. Test fixture is loopback only; no Viewer or canvas is created. Existing application Worker dispatch and download wiring are outside this branch.

A later Worker build `ce5b14c51e04208cecdee2b0b087877c37f9426f083ec8835614050fb59671e1` adds an explicit guard against the existing writer's invalid major/minor ordering. Independent group-code inspection verifies an axis-aligned ellipse with radii 4 and 2, including center, major vector and ratio. An ellipse with radiusY greater than radiusX explicitly refuses pending major-axis conversion. Earlier receipt and pin are retained as earlier evidence.

Follow-up fixes the shared adapter for full ellipses with the longer radius on local Y: it rotates the major vector by π/2 and emits the shorter/longer ratio. An independent group-code check passes a 45° rotated swapped-axis ellipse, as well as the earlier standard ellipse. Test Worker SHA-256 `ad5e9b79099bf07b56eb18876b3c9424d137ef9f27ae31fb99e6ed06559f1788`. The previous refusal and receipt remain historical; EllipticalArc remains unsupported.


## Arc sweep semantics — 2026-11-05

The adapter previously emitted every native `Arc` as DXF `ARC(start,end)`, while
`Arc.drawImpl` displays a full circle when **both** endpoint coordinate differences
are strictly less than `TOLERANCE=1e-6`, via the shared `areEqual` function. The
export admission only refused chord lengths below1e-8. Thus an arc of radius10
with a5e-7 endpoint Y difference displayed as a full circle but exported an almost
zero sweep. A diagonal case can have both coordinate differences below1e-6 while
its chord exceeds1e-6; a Euclidean replacement predicate would also be wrong.

The adapter now uses the exact shared `areEqual`/`TOLERANCE` coordinate predicate
and writes DXF `CIRCLE` for that full-sweep branch. The guarded exporter admits
these supported native Arcs. The native project remains an `Arc` with its original
endpoints, IDs, constraints and metadata; only the manufacturing exchange entity
uses `CIRCLE`. This does not change primitive-creation admission, which still
rejects near-coincident new-Arc endpoints. Existing valid native-source and
analytic-boundary export are the tested paths.

`arc.browser.test.cjs` executes12 independent cases in actual Chromium disposable
Workers through the genuine headless workspace, solver, strict reconstruction and
DXF writer. An independent group-code oracle checks entity count/type, centers,
radii, reconstructed partial-arc endpoints and directed CCW sweep: quadrant90°,
major270°, wrap across0°, translated quadrant, identical endpoints, near-positive
and near-negative endpoints, strictly below/at/above1e-6, and inside/outside diagonal
coordinate thresholds. Full arcs emit exactly one CIRCLE with no start/end-angle
fields; exact-threshold endpoints remain partial ARC. Native replay objects and
stages deep-equal the supplied native source, and each Worker verifies its whole
request was unchanged by export. A full analytic boundary also emits CIRCLE.
All14 created Workers are terminated; the page has no Canvas or Viewer.

`arc-receipt.json` records these results and the exact test Worker SHA256.
`arc-regression-receipt.json` records the existing full DXF suite run against the
same Worker: basic primitives, millimeter units, ordinary analytic boundaries,
ellipses including swapped axes, typed parameter agreement/mismatch, frame and
boundary mismatch, annotation and NURBS refusal all pass. Full TypeScript
`--noEmit` and script syntax checks pass. This qualifies the actual export core,
not live desktop transport/currentness or My files publication.

An initial new oracle incorrectly required a trailing DXF newline. The writer
legitimately omits it; the oracle was corrected to check complete code/value pairs
with optional trailing whitespace. No product change addressed that test mistake.

Reproduce with installed locked dependencies and a Chromium CDP endpoint:

```sh
node build/precompile-numeric.cjs
CODI_PRIMITIVE_OUTPUT=/tmp/codi-dxf-arc-output/static node node_modules/webpack/bin/webpack.js --config test/headless-dxf-export/webpack.cjs
cp web/lib/verb.js /tmp/codi-dxf-arc-output/static/verb.js
CODI_DXF_TEST_ROOT=/tmp/codi-dxf-arc-output CODI_DXF_TEST_PORT=20590 python3 test/headless-dxf-export/server.py
# In another shell, set these to the existing local CDP and Puppeteer install:
export CODI_TEST_CDP=http://127.0.0.1:19329
export PUPPETEER_CORE_PATH=/path/to/node_modules/puppeteer-core
JSKETCHER_TEST_URL=http://127.0.0.1:20590 node test/headless-dxf-export/arc.browser.test.cjs
JSKETCHER_TEST_URL=http://127.0.0.1:20590 node test/headless-dxf-export/browser.test.cjs
```

The test server enforces `script-src 'self' 'wasm-unsafe-eval'` and
`worker-src 'self'` and binds loopback only. Worker output and installed dependencies
are disposable build inputs, not source artifacts to commit.


The regression was also reproduced against unchanged production source
`1d2b19d5d1f8f638c2331b3f3652b161086efcce`, with only the same test Worker audit
helper copied in to expose the real result. Baseline Worker
`f36350cb3ba5226a147a532cb524bb7395a6825721e27a255939e0839a90bf24` fails the
independent `full-near-positive` expectation with `ARC !== CIRCLE`.
`arc-before-receipt.json` records the expected failing probe. The fixed Worker
`ec4fad4d72dfb4556a7946fcb5a25ac081f7f0a3cf63544878984b13cb0bc9cc` passes the
full12-case corpus and existing regression suite. Verb prerequisite SHA256 is
`55f13091a656c635d1ebe3931a9b52236c65023549b7b69bc8278362f87686f3` for both.
