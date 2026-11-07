# Selected rectangle extrusion profile preparation

`prepareRectangleExtrusion` is a data-only **computational** boundary. It does
not modify a project, run a kernel, create a model or enable a command. Input:

```
{version:1|2, unit:'millimeter', engine:'occ', revision, sketchDigest, faceId, regionId,
 frame:{origin,x,y,z}, depth, sketchJSON}
```

`sketchDigest` is lowercase SHA-256 of the UTF-8 bytes of the exact sketch JSON;
`regionId` is the existing canonical `sketch-region:` ID containing the face
and authored global edge IDs, not an index. The output is a versioned
`sketch.region.extrude.prepare` request with that identity, the copied frame,
normalized direction and positive depth, a CCW edge walk preserving global edge
IDs and original-direction flags, and world-space corners. The actual frame is
used to project coordinates. Bounds are one Mi UTF-16 code units of input,
256-character face ID, 8192-character region ID, local/frame coordinates within
10,000,000 mm and depth in (0, 1,000,000] mm. These are admission limits for
this research operation, not native-project limits.

This slice accepts one stage, four non-construction straight segments, one
selected current region without holes, and the orthonormal principal XY
basis. Version 1 retains the original exact bounding-box corner policy.
Version 2 follows exactly shared authored endpoints, preserving their original
coordinates and edge directions, and classifies each edge using the existing
rectangle classifier's 1e-7 mm axis tolerance. It does not snap, join a gap,
or expand that tolerance. Reordered/reversed segments work; disconnection,
ambiguous/duplicate edges, excess slant, unsupported constraints and frames
fail closed. The existing 0.0001 mm minimum remains in force. The profile
version is distinct from the outer OCC mount operation's version 1.

The caller must validate strict native sketch shape and solver admission,
obtain the actual face frame and engine from the current accepted document,
calculate the trusted source digest, and bind the revision to project, storage,
model and account/window lifetimes before and after the asynchronous call. A
matching caller-supplied hash or accepted label alone proves none of those
conditions. No claim is made that the returned geometry is a valid OCC solid or
that worker results or live engine handles can yet be published into CAD.

`rectangle-profile-request.test.mjs` checks bounds, stale/malformed/unsupported
inputs, nonzero frame and dimensions, stable IDs, width change, reversed
winding, accessors and input preservation. `rectangle-profile-browser.test.cjs`
consumes a real sketch produced by the existing production sketch Worker under
strict CSP and independently checks its selected profile. In this run the
Worker was copied from the root `9bde6b29` build and had SHA-256
`552766a0931c21409d26a3edc771262f924fc611d4c8d9376ef26c72ed3c35a0`.
The original agent test called preparation in the test page. The lead then
qualified the same module in a **second real module Worker**, checking that
`window` and `document` are absent, source IDs/world coordinates survive, and a
mismatched source digest is refused. The fixture serves a fixed allowlist and
pins its bytes in memory; the test verifies every served digest and CSP header.
Both worker calls have deadlines and terminate afterward. This is a test
transport, not an installed production mount. No kernel or document publisher
is involved, and the accepted-label/digest checks do not replace the caller's
solver, revision, frame or account validation.

Reproduce with Node 24, Python 3, Chromium and `puppeteer-core`. From the CAD
checkout, use a built directory whose revision and worker digest are known:

```sh
node --test test/extrude/rectangle-profile-request.test.mjs
python3 -B test/extrude/profile-fixture.py \
  --dist /path/to/verified/dist --port 19982 \
  --expected-revision 9bde6b291f859660db3fe14613ceff9851148391 \
  --expected-worker-sha256 552766a0931c21409d26a3edc771262f924fc611d4c8d9376ef26c72ed3c35a0
```

Start an owned Chromium profile with loopback CDP on an unused port, then run:

```sh
JSKETCHER_TEST_URL=http://127.0.0.1:19982/ \
CODI_TEST_CDP=http://127.0.0.1:19983/ \
node test/extrude/rectangle-profile-browser.test.cjs
```

Set `PUPPETEER_CORE_PATH` to its installed absolute package path if it is not
resolvable from this checkout. Explicit URLs prevent old fixtures from being
tested accidentally. Close the owned browser and fixture after the run. The
lead reused the previously qualified `9bde6b29` sketch worker because this
slice changes neither that worker nor its dependencies; it did not rebuild or
repin the desktop runtime. See `profile-evidence-20261104.json` for this run.
