# Signed distance candidate: bounded evidence and open gates

This candidate is not release qualified. Signed X and Y mean second point minus
first point. The projected dimension uses the actual directed first-to-second
endpoint vector of the selected segment, including negative internal polar
length. A zero-length or inconsistent direction is rejected. The projected
interactive guard keeps last-valid stage parameters; it deliberately refuses
stages exceeding 6,000 objects, 6,000 constraints, 32,768 distinct parameters
or 65,536 parameter visits. Those are bounds on this new projected-distance
operation, not a global document or Files limit.
While such a relation is active, edits that would exceed its stage budget are
also refused; existing sketches without it do not acquire this restriction.

The focused Node suite exercises the real solver and its rejection paths. A
separate real Chromium worker test checks signed coordinates and a projected
dot product through the production headless sketch client and worker. These
do not establish desktop host command-bridge coverage.

The built full app at CAD source `0009f5f3e7afd3eae580b52753e845eeee1eda10`
also passed selected global actions, real dimension editor input, undo/redo,
and fresh native workspace snapshot restoration for all three dimensions. A
contradictory X edit left exact sketch and history intact. The in-app ID path
accepted a current revision and refused a changed point. Selection/setup used
the test helper and the editor used Chromium input; this is not a physical
phone, signed-account save, or desktop command-bridge test. The index, sketcher
and test-helper bundles had SHA-256 `a8e375e4d7d7f328391b9a6298d90943bbb43355f422ccd057f9aaac76c4c51e`,
`50bf091ebddb36dbf350dc354fc15ee4847cbc687dd8464c8acde738ef8d4ffe`, and
`4576d7c9f0e38ed093a7d43a8ef557cb901e37a6b34c33dce0b7ef77b1102035`.
The R730 build used a test-only webpack wrapper with `resolve.symlinks=false`
and public runtime inputs from its existing spline fixture. The browser used a
separate loopback server with the documented no-`unsafe-eval` policy.

The ID operation currently keeps a bounded (1 MiB) detached strict sketch
serialization for exact stale detection. It no longer hashes or serializes
twice per check, but strict serialization still runs on the UI thread. An
authoritative inexpensive sketch mutation revision, including non-parameter
shape data, constants, layer membership, stages and generators, or a safe
worker-based alternative, is still needed before claiming worker-first
handling. History position alone is insufficient.

On the local workstation Chromium, 15 synthetic serialization samples for
100/1,000/5,000 unconstrained segments (10,386/105,787/541,787 bytes) had
median 0.3/1.2/6.9 ms and max 1.5/3.6/9.8 ms. One projected rollback snapshot
over those stage sizes had medians 0.1/0.3/2.1 ms and maxima 0.2/1.4/7 ms;
interactive solving can take multiple snapshots. This is a synthetic test on
one workstation, not a phone result, whole-operation latency or a guarantee.

For an isolated loopback run, build `build/webpack.headless-sketch-worker.cjs`,
`test/webos/headless-sketch-client.config.cjs`, and
`test/webos/signed-distance-cost.config.cjs` with the precompiled numeric
module; put the resulting worker/client under the test root's `static/`, and
`web/lib/verb.js` under `lib/`. Serve that root with
`test/webos/rectangle-worker-fixture.py` and use an owned Chromium CDP port.
Run `test/webos/signed-distance-worker-browser.test.cjs` and
`test/webos/signed-distance-cost-browser.test.cjs` with the loopback URLs and
`PUPPETEER_CORE_PATH`. The worker fixture preserves a strict CSP. No account
or production service is needed.
