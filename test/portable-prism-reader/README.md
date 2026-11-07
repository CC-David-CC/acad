# Research-only portable prism reader

`readPortablePrism` takes an untrusted bounded worker topology descriptor and
separate `{engine:'occ-brep-worker-owned',mountId,generation}` provenance.
The caller must authenticate those values and bind them to the exact live mount;
this function cannot establish ownership or freshness. It snapshots own data
properties, rejects sparse arrays/accessors/extra fields and enforces the 16 KiB
UTF-8 limit before checking IDs, finite coordinates, actual planar geometry,
edge/loop closure, oppositely oriented incidence, one unambiguous common source base, four distinct
other incident swept faces, a disjoint lid with consistent normal extrusion,
source mappings and bounded
tessellation. This first reader deliberately admits only the tested two-triangle
coverage per quadrilateral face and rejects other tessellations explicitly. Version 1 currently requires direct planes. Native `ptr`, `ref`
and `edgeRef` fields are rejected, and no native APIs are called.

It constructs existing JS Shell/Face/Edge/Vertex/Loop classes and small analytic
plane/line adapters. Explicit opposite coedges must already exist; no synthetic
faces or repairs are added. Response-local IDs live in `data.portableId` and
worker ownership in `shell.data.portableProvenance`; they are not durable CAD
IDs. This is not a published model, a full-featured curve/surface library,
BRepCheck validation, or a promise that operations such as transform/split work.
Unimplemented analytic operations throw. The Shell/Face import graph still
reaches NURBS helpers, but their eager global Verb reads have been deferred.
The existing reader fixture loads actual pinned Verb; the separate
`test/brep-verb-separation` fixture proves that analytic reading also works
before Verb is loaded, with no DOM, canvas or fake globals. Real NURBS use
still requires Verb and its existing mutable global cache. Fully explicit
runtime dependencies and a smaller topology-only import graph remain open.

`capture-worker.test.cjs` obtains a real descriptor from the pinned OCC worker
under strict CSP; `browser.test.cjs` sends that descriptor to a dedicated real
reader Worker and checks six faces, twelve edges, eight vertices, loop links,
provenance and malformed cases, including replacing all four swept faces
with the actual base face. The capture also supports
`CODI_TOPOLOGY_REVERSED_OUT` for a reversed/reordered source profile. `occ-worker-descriptor.json` is a retained
actual sanitized output, not a native handle. The isolated fixture and original
OCC inputs are described in `test/engine-extrude/README.md`; build the reader
fixture with `webpack --config test/portable-prism-reader/webpack.worker.config.cjs`,
copy its `reader-worker.js` into fixture `static`, and set `CODI_TOPOLOGY_OUT`
and `CODI_TOPOLOGY_IN` to the same temporary file for a fresh capture/read run.
The fixture imports `/lib/verb.js` from the pinned app build and uses the
CSP-safe precompiled numeric dependency. No packaging or deployment is done.

Normal-extrusion admission checks the magnitude of the actual transverse
component of each consistent prism translation against the unit base normal,
with the existing 1e-6 mm tolerance. A 10 mm tall consistently sheared real
descriptor with 0.004 mm lateral displacement is rejected: the prior length
deficit test admitted it because its deficit was only about 8e-7 mm. Controls
accept 5e-7 mm and reject 2e-6 mm transverse displacement; neither case
changes or snaps any vertices. Both fresh normal and reversed OCC inputs pass.

Lead combined qualification at `ae27a6ba` passes fresh OCC normal/reversed
capture, both reader/control runs, both no-Verb/late-load/legacy-order runs,
two focused worker builds and TypeScript checking. Exact outputs and hashes
are in `lead-evidence-20261104.json`. This is component integration, not editable
model/history publication or a deployment. Initial test startup hit Chromium
Snap profile-directory confinement; the harness correction is recorded in the
receipt and did not alter product code or acceptance tolerances.
