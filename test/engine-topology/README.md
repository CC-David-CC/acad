# Worker-local portable prism topology

The OCC research worker returns `portableTopology` only when the raw worker receives
`researchTopology: {version: 1}`. The current controller does not request it; it is not available
to CAD or the user interface. Its schema is version 1, in millimeters, with
`idScope: 'response-local'` and `toleranceMm: 1e-6`. It contains eight local
vertex tokens with measured points, twelve local edge tokens with endpoint
vertex tokens, checked straight-line tessellation and two oriented face uses,
and six local face tokens with actual plane origin/normal/directness, inversion,
a four-coedge oriented loop and bounded triangles. Four source records map
authored edge IDs to response-local base edges and generated swept faces. These
IDs are not persistent topology names, pointers, handles, or references for a
future document.

Extraction uses actual interrogation and prism-history data. It requires one
plane and one oriented closed four-edge loop per face, line-valued degree-one
curves, consistent exact shared-vertex coordinates, exactly two opposite uses
per edge, distinct unambiguous source/base-edge matches, finite geometry, and
bounded tessellation. Geometric line/plane/source comparisons use 1e-6 mm;
vertices are never snapped or averaged. Actual coordinates, directions and
triangle points are preserved. It fails explicitly on ambiguity, discrepancy,
degeneracy, missing history or unsupported topology. Bounds are six faces,
twelve edges, eight vertices, four coedges per face, up to 64 tessellation
points per edge, 32 triangles per face, 192 total triangles and 16384 serialized
UTF-8 bytes. This subset does not establish
OCC BRepCheck validity, one connected solid for arbitrary geometry, persistent
naming, editable MBrepShell construction, or manufacturing fitness.

`profile-topology.test.mjs` checks a sanitized actual-interrogation fixture
with numerical edge group labels and negative payload mutations; no native
pointers are retained. `actual-worker.test.cjs` checks three actual pinned
OCC prism workers under strict CSP (normal, translated, and reversed/reordered)
and uses a test-only Worker subclass to request and observe their research
messages; an ordinary controller request sends no descriptor, and the real
controller withholds the opt-in descriptor. `test/engine-extrude/prepare-fixture.py` builds the
isolated fixture; see that directory's README for the pinned source inputs and
execution parameters. Packaging must include and pin `profile-topology.mjs`
before this worker can run. No native handles are serialized in this descriptor.

Independent review of the first candidate found a sparse normal accepted by
an `Array.every` check and unnecessary descriptor transfer without an explicit
byte cap. The integrated follow-up requires dense arrays and a versioned opt-in,
with the limits above enforced inside the worker before `postMessage`.
The lead's combined source `25050c16` passes seventeen focused data/math tests,
the actual opted-in/ordinary worker test, authored profile regression and
lifecycle/refusal suite. Exact sources, fixture hashes and observed outputs are
in `lead-evidence-20261104.json`. The strict descriptor reader, worker ownership
and accepted model/history bridge are still required before exposing this in CAD.
