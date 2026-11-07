# Selected-region extrusion: common kernel component, version 2

Status: private **component candidate**. This branch does not register a new
public Craft feature, change the native project format, alter the desktop,
replace default engine assets, or qualify save/reopen/history/signed transport.
Root integration must still connect the component to current persisted region
descriptors and preserve unselected source-region references.

## Contract

```ts
{
  op: 'solid.profile.extrude', version: 2, unit: 'millimeter',
  frame: { origin: [x,y,z], x: [x,y,z], y: [x,y,z], z: [x,y,z] },
  depth: number,
  region: {
    id: string,
    outer: Curve[],
    holes: Curve[][]
  }
}
// Ordered authored curves:
// { kind:'segment', id:string, a:[x,y], b:[x,y] }
// { kind:'circle', id:string, center:[x,y], radius:number }
```

One selected bounded region produces **one mount-owned native shape handle**.
Several selected regions require several explicit requests/outputs. This
component does not infer a multi-selection body policy, merge separate parts,
or present one opaque compound as independently selectable bodies. The same
handles can be used by the existing common Boolean operations where qualified.

Version **2** deliberately avoids colliding with the old version-1 research
rectangle envelope `{op,version,profile}`. The old route remains separately
identified temporarily, with no schema alias or implicit dispatch by geometry.
It should be retired after its actual feature/history/signed workflows pass
through the general replacement. This is not a second editable design model.

The typed request/result interface is in `modules/engine/solid/SolidKernel.ts`.
The private factory is `modules/engine/mount/occ-selected-profile-mount.mjs`;
it pins its own new JS/WASM pair. Existing `createVerifiedOciMount`, catalog
selection and default packaged assets are unchanged. Unqualified legacy OCC,
Manifold and SMLib mounts neither advertise nor dispatch version 2.

Supported geometric subset:

- Full circles and four **ordered, exact axis-aligned local** rectangle edges.
  Global placement may use any finite right-handed orthonormal frame; an actual
  oblique-frame circle is included in the Worker corpus.
- Explicit outer boundary and strictly contained, mutually separate holes.
  Rectangular and circular hole boundaries can be mixed. Nested selected regions
  are separate requests with their immediate child boundaries as holes.
- Positive depth ≤1e6 mm; local/origin coordinates bounded by ±1e6 mm, world
  bounds ±4e6 mm. Minimum circle radius and rectangle side are strictly greater
  than .0001 mm. At most eight holes and 24 authored curves across the request.
  These are bounded component limits, not proof of every extreme value.
- Frame squared lengths/dot products/cross difference are checked at 1e-12.
  Geometric hole separation/containment uses the existing conservative .0001 mm
  domain boundary. No tolerance-based welding or coordinate snapping occurs.
- A clockwise rectangle can be traversed in reverse for face orientation, with
  exact coordinates retained. Native holes use opposite wire orientation.
  Authored IDs are identity, not geometric order or generated-face provenance.

Arcs, ellipses, splines, general polygons, crossing/touching/too-close loops,
open chains and nested hole lists are explicitly unsupported. Source topology,
constraint solving, region discovery and feature dependency validity remain
separate responsibilities. A region must already be resolved against the
current solved authored source before invoking this kernel operation.

## Worker/native ownership

`captureSelectedProfileRequest` synchronously captures bounded plain data
before asynchronous dispatch; getters, sparse arrays, duplicate primitive IDs
and extra fields are rejected. Geometric planning, native construction,
validity, analytic metrics, mesh extraction and display conversion happen in
Workers. Main-thread heavy tessellation or native work is not introduced.

The native helper constructs local OCCT edges, wires, face and prism using
existing OCCT builders. Those local objects have ordinary C++ RAII lifetimes.
Only the final validated shape enters the named-shape map. No temporary DRAW
point/curve/edge/wire/face names and no interrogation `ptr/ref/edgeRef` objects
are allocated by this path. The map owns its string key, so call buffers can be
freed immediately. Duplicate final names refuse without replacing an owner.

Native `BRepCheck_Analyzer`, solid census, `BRepGProp::VolumeProperties` and
`BRepBndLib::AddOptimal` provide validity, volume and analytic bounds. The Worker
compares native metrics against independently derived profile area/depth and
frame-aware bounds before publishing a handle. No constant six-face/four-edge
assumption applies. Results contain **no durable generated-face provenance**.

`evidence.nativeVolume` and `nativeBounds` are native observations. Existing
`evidence.signedVolume` and `bounds` remain display-tessellation observations;
`volumeQuality:'tessellation-signed-integral'` describes that mesh-derived value,
not the separate native volume. A finite display mesh is not a manufacturing
mesh, manifold proof, material model or STEP/3MF export qualification.

Generic native mesh reading emits bounded numeric triangle data directly; it
does not use the older pointer-producing interrogation service. Disposal checks
actual final-name erasure before acknowledging release. Worker close/abort
revokes handles and terminates the owning WASM realm, including pending native
work. Existing per-mount eight lifetime names and one pending request limits
remain. Native heap shrinkage/RSS behavior is not measured by these tests.

## Evidence

`browser-receipt.json` binds exact served Worker/controller/planner/factory and
native assets. The actual strict-CSP Chromium corpus checks:

| Case | Independent expected native result |
|---|---|
| 10×10 rectangle, depth 5 | Volume 500; bounds `[0,10]×[0,10]×[0,5]`. |
| Circle r10, depth 5 | Volume 500π; bounds `[-10,10]×[-10,10]×[0,5]`. |
| Nested r30/r20/r10 selections | Separate outer annulus 2500π, inner annulus 1500π, disk 500π. |
| Disjoint rectangles | Two independent handles, each volume 500, exact separated bounds. |
| Rectangle with circle + rectangle holes | Volume `(1600−4π−16)×5`; openings remain distinct. |
| Oblique-frame circle | Volume 500π and frame-aware analytic bounds checked in Worker. |
| Generic profile + box Booleans | Intersection 125π, union 375π+500, subtraction 375π; input preserved. |
| Disjoint common | Genuine empty result and zero-triangle mesh; input preserved. |

For the annulus an independent top-cap triangle test confirms the center is
not filled and a known annular interior point is covered. The separate native
probe checks actual native point classification of void/material/exterior.
No tessellation comparison replaces native validity or analytic geometry.

Lifecycle checks include mutation of caller data immediately after submission,
invalid-hole refusal preserving an existing result, invalid disposed handles,
ordinary abort and close, and **holding a genuine successful native reply**,
aborting before controller publication, then delivering the held reply. The
late reply cannot create a handle or reopen the cancelled mount. All owned
Worker targets disappear; the shared test browser is not restarted.

An additive ABI smoke test uses the new native runtime with the retained v1
rectangle route. The native export census confirms no previous export removed.
This is not the old full solved sketch / downstream holes / history acceptance
suite; root must requalify those before replacing its default runtime.

`planner.test.mjs` includes exact closure, thin .0005×1 source, orientation,
invalid frame, unsupported curve, malformed data and strict hole-domain cases.
`unsupported.test.mjs` uses an explicitly labelled protocol Worker stub only to
prove capability refusal in other mounts; it is not native math evidence.

`native/native-receipt.json` is actual C++ compiled to WASM execution in Node,
including valid geometry, opening point classification, duplicate/invalid native
requests preserving originals, and 32 native create/release cycles returning to
zero final names. This does not increase the mount's eight-name lifetime budget.
Native CPU execution and a fresh rebuild of all OCCT static libraries are not
claimed. Final source, archive/library inputs, toolchain and native asset hashes
are recorded in `native/build-receipt.json` and `native/PROVENANCE.md`.

## Integration queue

1. Register the new factory/assets in the reviewed build path; stage
   `selectedProfilePlan.mjs` beside the Worker. Do not overwrite current default
   assets merely because component tests pass.
2. Adapt persisted descriptors to ordered analytic boundaries from the **current
   real sketch Worker result**. Preserve source units/frame/digest, parameters,
   source label and host/document currentness checks.
3. Extend public discovery using the same geometric admission and backend
   capabilities as execution. Region existence alone is not executability.
4. Persist explicit region choice, whole-part kernel choice and body policy in
   one authored feature graph. Preserve access to unselected source regions.
5. Qualify public execution, undo/redo, dimension changes, stale region repair,
   native save/reopen, cancellation and signed My files transport before calling
   the component an integrated feature.
6. Re-run existing rectangle/hole/history acceptance on the combined source;
   retire the v1 rectangle experiment once the general replacement passes.

Re-run pure tests with `node --test test/selected-profile-kernel/*.test.mjs`.
Stage the exact pinned native artifacts and the mount modules behind the
existing `strict-csp-server.py`, then run `browser.cjs` with
`JSKETCHER_TEST_URL`, `CODI_TEST_CDP`, `PUPPETEER_CORE_PATH` and `CODI_RECEIPT`.
The browser test accepts loopback fixtures only, owns/closes its contexts and
disconnects without terminating the shared Chromium process.

## Root dispatch review

Root found that public execute dispatch read op/version getters before the
operation's data capture rejected them. A protocol-only negative control
reproduces6 op reads and1 version read with no native job dispatched. Dispatch
now inspects own enumerable data descriptors; both accessor counts stay0 and
inherited op refuses. Nine current planner/capability/dispatch source controls
pass. The explicitly labelled Worker stub proves admission only; earlier real
native/browser receipts retain their exact original source pins until combined
runtime qualification. Raw original failure and corrected output are retained
in dispatch-before.log and root-source-controls.log. No geometry tolerance,
request semantics or default native asset is changed by this correction.

Root subsequently reran the **actual** native Chromium component corpus using
the corrected controller from811616e0b. `root-browser-receipt.json` records the
served source/native hashes. All six case groups, analytic/native metrics,
openings, Boolean input preservation and genuine held-reply lifetime controls
pass. Each group additionally rejects op/version getters with zero reads and
an inherited op with zero native jobs, then successfully creates real geometry
on the same mount. Owned Worker targets return to zero. This fixture retains
the component's blob-bootstrap permission and has no unsafe-eval; it is not a
normal signed application build or public feature/history qualification.

## Source-region preparation candidate

`modules/engine/extrusion/selectedSketchProfile.mjs` adds a Worker-only adapter
from one exact native-v3 sketch source, digest/frame and canonical descriptor
to the v2 common kernel request. It reuses the current region hierarchy and
common geometry planner, walks segment endpoints exactly, and preserves all
ordinary loops when determining nesting. No coordinate welding, source rewrite,
or bounding-box reconstruction is permitted. It accepts bounded circle/exact
rectangle loops, including unselected disjoint loops, with explicit unsupported
topology/curve responses. The returned binding/request/measurements are detached
and frozen. Traversal is bounded to128 loops/512 segments and1MiB source.

This adapter is **not a constraint solver or an admission certificate**. The
public feature must first obtain a genuine current sketch-Worker solve and
retain source/parameter/lifetime binding through native evaluation/publication.
The adapter is not wired to public discovery, history, save or the default app.

Seven new source-preparation tests plus the earlier nine component/protocol tests
pass16/16. These are pure preparation controls, not actual source→native/public
workflow proof. They independently check disjoint/nested selection, holes,
dimensions/placement, exact gaps, duplicate/touching/unsupported geometry,
digest/frame/region failures and asynchronous capture. The first test run and
its two harness errors are retained in `source-region-before.log`: shared JS
point objects made the supposed gap a trapezoid, and a rotated-circle bounds
oracle demanded exact floating-point equality. The corrected gap detaches native
JSON endpoint records; its explicit gap still refuses. Rotated numeric bounds
use1e-12 roundoff tolerance. No product geometry guard was weakened.

Independent review found that a code-unit-only source limit could admit more
than1MiB of UTF-8. Correctione67f2ea2a encodes once, enforces the byte cap and
reuses that exact encoding for the digest. The units cap remains. Explicit
multibyte-overcap refusal and exact1048576-byte acceptance controls pass.

`source-browser-receipt.json` additionally records five **real preparation
Worker → native OCC** cases: either of two disjoint rectangles from one source,
and the three independently selected nested-circle regions. Native validity,
volume and bounds match independent analytic expectations; all preparation and
native Workers terminate. This uses explicit seeded native JSON fixtures and
the existing component runtime/bootstrap, so it does not qualify public source
authoring, constraint solving, source-to-history publication or signed Files.
`source-worker.mjs` is a private qualification entry, never a public app asset.

## Explicit runtime and static Worker candidate

`OCC_SELECTED_PROFILE_BUILD` and `requireCadEngineBuild` identify the exact
experimental revision without changing `CAD_ENGINES.occ`, default selection,
or existing saved engine bindings. `validateEngineMount` checks both the pinned
runtime and its v2 capability; unknown revisions and same-engine wrong builds
refuse. Two new catalog/protocol controls bring the local total to18/18. They
are not native geometry tests.

`build/prepare-selected-profile-assets.cjs` stages the final pinned JS/WASM
artifacts and statically embeds the reviewed glue into its own Worker. Run it
with the approved artifact directory (R730
`/mnt/data10tb/codi-occt-selected-profile-v2-20261106`); output stays in the
worktree-owned `.build/selected-profile-assets`. No default files are replaced.
The qualified static Worker SHA is
`0f3240cdde9b5faced831ace71ee5ffcfb6fe159dacba5b7265e5a09b0ca9853`.

`static-browser-receipt.json` and `static-source-receipt.json` repeat the real
six-group native corpus and five seeded source-preparation Worker cases under
`script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'` with **no blob permission
and no unsafe-eval**. Native geometry, held-success cancellation, getter refusal,
input preservation and zero remaining Worker controls pass. This is still
component composition, not full Craft/history/signed-app integration.

The initial static build failure is retained in `static-browser-before.*`:
the v2 binary input needs `HEAPF64`, which the old wrapper's exposed heap list
omitted. The corrected build exposes current `HEAP8`/`HEAPF64` through getters
that follow memory growth. This was our integration packaging defect, not a
new NVIDIA or OCCT kernel finding. The native artifacts themselves did not
change. The older default runtime staging recipe is separate; this candidate
does not claim a clean-machine rebuild of every legacy/default prerequisite.

Root also exercised the compiled **shared catalog factory**, rather than only
the private component constructor. `factory-receipt.json` passes an explicit
v2 circle (native volume500π), a retained default-runtime box (mesh volume500),
and unknown-revision refusal before creating any Worker. All owned Workers
terminate under the no-blob CSP. The private `factory-entry.ts` and
`webpack.factory.cjs` expose real factories only for this test and are absent
from ordinary application entries.

The production semantic Worker at sourcebd191e7b8 also passes the five seeded
source→native cases (`production-semantic-receipt.json`), SHA
`d0d5bfa23ee2ca5820770ea90b61ea58685387398dd5fec4b711de7037f9831c`.
The ordinary app build with the explicit factory/shared ledger compiles and
TypeScript exits0; its app SHA is
`26a617d430ddaf4962f1704037a27de60370559309ae0801abd79ae80463d7e3`.
No full application/public-history/signed workflow is inferred from that build.
Factory bundle SHA is
`df60b7a8f2597381151b7240ba691d7439c5107c673e5247e2c367d091ef8ba6`;
R730 staging is `/mnt/data10tb/codi-selected-profile-static-runtime-20261106`.
Exact build logs are in `build-evidence/`.
