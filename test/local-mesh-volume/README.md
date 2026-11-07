# Local signed-mesh volume investigation

Base CAD `14537a7ed8dae74291863d703f0b73d57ff1660f`. Only the new pure module `modules/engine/mount/localMeshVolume.mjs` and this new test directory change. No shared Worker/controller, frozen app, native/default build, authored coordinates, geometry, model, Files or public service is modified. This is a candidate measurement helper, not an integrated fix or Gate1 pass.

## Contract

`measureSignedMeshVolume(positions, {maxTriangles?})` accepts an already-oriented flat `Float64Array` or dense own-data number array, nine coordinates per triangle, at most100000 triangles. It returns frozen `{signedVolume, triangles, anchor, absoluteTetrahedronSum, cancellationSensitive}`. Empty input returns zero with null anchor. Malformed/nonfinite input, unsupported shared/detached buffers and invalid limits refuse with `INVALID_MESH`; excess work uses `RESOURCE_LIMIT`; detected overflow or hard underflow uses `MESH_VOLUME_NUMERIC_RANGE`. No partial measurement is returned on refusal. Native oriented mesh read already applies each face's `inverted` flag; do not invert those triangles a second time.

The helper chooses one bounding-box-center reference, then accumulates `(a-anchor) dot ((b-a) cross (c-a)) / 6`, using compensated dot and total sums. The mesh is read without modifying positions or snapping geometry. For an oriented **closed** boundary this signed integral is invariant under the reference change. Outward disconnected shells add; inward cavities subtract; reversing the whole mesh negates the result. It never takes an absolute value, classifies material, repairs winding, guesses closed-shell groups, or infers native validity. Open/nonmanifold/inconsistently oriented geometry has no solid-volume assurance from this helper.

`absoluteTetrahedronSum` is a conditioning indicator, not an error bound. `cancellationSensitive` is true when this sum is more than2^20 times the magnitude of the final estimate, including cancellation to zero. This heuristic is **not a complete accuracy test**; false does not certify accuracy. Products/subtractions and subnormal intermediates still round, compensated summation cannot recover those lost bits, and large separation/thin geometry/extreme exponent ranges remain limitations. No nativeVolume should be replaced with this estimate. A future per-closed-shell reference would require separately qualified real closure/orientation/component semantics.

## Actual native observations

`capture-native.cjs` verified all20 payload files against the immutable component manifest (21 files including the manifest) before starting its **own** Chromium process, using strict CSP and actual `solid.box.create` then `solid.mesh.read`. `actual-native-mesh.json` contains the actual returned oriented Float64 coordinates (not regenerated catalog triangles), original requests, native evidence and input/disposal records. Component manifest SHA `8d20bdc2381b8afbcde7ebcf4913cfbdce209ef21a99b21a4fd4bce000e2fff1`; native portable JS `b3d91cbb02f90ba56732039283d787b92eda97c51091fafbd933ecf4db30dd97`; WASM `28e8e2c2752cef100a98e24ec487f7d90021edb98fb060fdd1160fe63501bbe2`. These are retained component assets, not a new app build.

Three actual boxes were captured: tiny at origin, tiny at(1e6,1e6,1e6), and11×17×23 at(-13,7,2). The translated tiny box reproduces the old Worker evidence `signedVolume=-2.6667257770895962e-6` versus native `6.000137061924313e-18`. The new local integral agrees with the **represented mesh** and independent exact Fraction integral. Requested product6e-18 versus represented/native volume differs by about2.284e-5 relatively; this dimensional drift remains visible and is NOT fixed. See `measurement-receipt.json` for the separate values.

All three mounts were disposed/closed, zero owned Worker targets remained, CSP violations were empty, own Chromium process/profile were closed/removed, and the owned loopback server was stopped after exact PID/argv/cwd verification. SharedCDP19329 and root fixture20916 were not used. No accounts, native source seeds or fake outputs were involved.

## Remaining counterexample — NOT FIXED

Two analytic tiny boxes at opposite(±1e6,±1e6,±1e6) origins still suffer cancellation under the single common reference:

- Exact represented-boundary sum: `1.2000274123848626e-17` (independent Fraction oracle).
- Local compensated common-reference estimate: `1.2000551038462114e-17`, roughly2.30757e-5 relative error.
- `cancellationSensitive:true`.

The test intentionally asserts and preserves this unresolved mismatch. Measuring the two **known analytic closed box fixtures** separately confirms the oracle, but is not a production grouping repair. Thus single small translated-body improvement and unresolved widely separated multi-shell accuracy are separate findings. Opposite identical shells cancel arithmetically in the tests; zero does not independently prove empty valid geometry.

## Tests and reproduction

Seven groups PASS, no skips: actual Node Worker translation/scale/orientation controls; cavities/disconnected/opposite-shell cancellation; signed tetrahedron/degenerate/empty arithmetic; finite/dense/work/range admission; actual native mesh replay; retained separated-shell limitation; and the100000-triangle cap. `fraction-oracle.py` uses exact Python Fraction arithmetic only as a small independent test oracle, including the real mesh integral. It is not production arbitrary-precision code.

```sh
python3 test/local-mesh-volume/fraction-oracle.py
node --test test/local-mesh-volume/tests.mjs
```

The cap test's one Node Worker roundtrip was about80ms, including Worker initialization, cloning and measurement on this run; not a browser/native benchmark, used heap estimate, RSS or memory-reclamation claim. Coordinate payload at the cap is7,200,000 bytes for a Float64Array. Work is linear; temporary vectors/summation state are bounded per triangle. Dense JS-array admission may additionally allocate a bounded key list. No hard used-memory guarantee is made.

To recapture actual geometry, run the existing read-only strict-CSP fixture with the reviewed frozen component root, then supply its own loopback URL:

```sh
python3 -u test/polygon-profile-v3-browser/serve.py --root /path/to/frozen-component --port 0
CODI_COMPONENT_ROOT=/path/to/frozen-component CODI_COMPONENT_URL=http://127.0.0.1:OWNPORT/ CODI_RECEIPT=test/local-mesh-volume/actual-native-mesh.json node test/local-mesh-volume/capture-native.cjs
```

The driver uses qualified Puppeteer24.35.0 and its own temporary Chromium profile. It never connects to or closes the shared browser. Retain a fresh receipt rather than relabeling these source-pinned observations as another runtime.
