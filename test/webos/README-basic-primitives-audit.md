# Basic geometry qualification — 2026-11-04

Baseline JSketcher source 2ec7bef2f12a1fcf464cfc8912552a187c6fb8d5.
Local source-built runtime used pinned OCC WASM a2b2f7da… and Manifold WASM
7bb5f8ee…, and a loopback server with WebAssembly permitted but JavaScript
unsafe-eval absent. These tests are controls deliberately failing on this
baseline; do not treat their current exit status as a passing release.

- BOX 10×20×30 and Native Mesh Box produced bounds [0,0,0]–[10,20,30]
  and oriented tessellation volume 6000.
- OCC Cylinder diameter 20/height 30 and Cone diameters 20/10/height 30
  produced height along X at the origin. On a datum whose origin is (3,4,5),
  x=(0,1,0), y=(-1,0,0), z=(0,0,1), box bounds are
  [-17,4,5]–[3,14,35] while cylinder/cone are approximately
  [-7,4,-4.927]–[13,34,14.927]. Thus their height follows datum x.
  These are display tessellation bounds, with circular bounds approximated.
- OCC Cylinder diameter 0 and Sphere radius 0 returned successful 0-face
  shells; a real Sphere wizard committed radius 0 to history and an empty
  shell. Zero/negative Box dimensions and zero/negative Cone height raised
  opaque numeric errors; Native Mesh Box rejected with a clear message.
- Strict-CSP existing six-box Boolean comparison passed; a 0.0006-volume
  overlap was erased by OCC and approximated as 0.0005722 by native
  Float32 mesh. No claim of general engine agreement.

Reproduce with the pinned runtime recipe in docs/WEBOS-REPRODUCIBLE-BUILD.md,
the standard helpers, a strict-CSP loopback server, real Chromium CDP and
Puppeteer. Set JSKETCHER_TEST_URL and CODI_TEST_CDP to the loopback endpoints;
run test/webos/basic-primitives-browser.test.cjs and
test/webos/primitive-zero-ui-browser.test.cjs. These will intentionally fail
until the observed defects are addressed. The mesh volume is an integration of
render triangles; curved solid values are approximations, not exact BREP
volume checks. Full units, curved primitives, Boolean, sketch entity and
save/reopen coverage remains open.

## Primitive-domain and datum fix candidate

Candidate changes only the four OCC primitive operation files. Box dimensions,
Cylinder diameter/height and Sphere radius must be finite and positive; Cone
diameters must be finite and nonnegative with at least one positive, and height
must be finite and positive. Both one-ended pointed cones remain accepted.
These solid guards do not change signed sketch extrusion. Invalid requests use
the existing CadError INVALID_PARAMS path, preserving prior history and showing
a useful wizard error. Cylinder, Cone and Sphere now pass datum z then x to
the OCI plane, consistent with Box; this changes the geometry of old saved
Cylinder/Cone records that previously followed datum x. The host must reject
or explicitly handle old/unversioned semantics rather than silently reopening
them as equivalent. This candidate does not implement that host gate.

Local strict-CSP Chromium passed direct domain controls (zero, negative,
Infinity, NaN), valid pointed cones, offset/rotated/tilted datum bounds,
wizard failure preserving an existing box and visible message, and four-shape
feature history snapshot and fresh-window reopen. Existing XYZ move, axis
rotation and pivot scale tests (including history and downstream references),
plus the six-case OCC/Native Mesh box Boolean comparison, passed. A TypeScript
project check reported three sketcher errors also present byte-for-byte on the
baseline. Mesh-derived curved volumes are approximations; no physical unit,
topology-changing edit, general Boolean, physical phone or full desktop
qualification is implied.
A separate real Chromium sketch smoke created Point, Segment, Circle, Arc,
Ellipse and cubic Bézier via the existing sketch tools, checked their stored
coordinates, saved the native project and reopened it in a fresh workspace.
The stored sketch records matched. This is one geometry per kind; it does not
qualify constraints, degeneracy, all curves, dimensional semantics or UI touch.
