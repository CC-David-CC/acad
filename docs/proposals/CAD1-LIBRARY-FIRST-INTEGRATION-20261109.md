# CAD 1 library integration plan

Status: accepted direction; native library assessment PARTIAL. Browser library
integrations remain unqualified; no runtime adoption is claimed.
Owner: Root integrator. Updated 2026-11-09. This changes the implementation
strategy, not Gate 1's acceptance requirements or the authoritative document.

## Purpose and current evidence

Reuse established algorithms for general geometric operations and validation.
Keep our parameters, identities, feature graph, transactions, history, material
assignments, persistence and shared human/agent commands. Avoid algorithms that
work only because they recognize a demonstration's dimensions or feature order.

- Ordinary exercises: 21/21 qualified within their recorded contracts. Full
  Gate 1 remains OPEN; E17 assembly belongs to Gate 2.
- Extent R4 whole26910 PASS on Core `0afb07fe8e216ba9a03cf21923e0ab70aed72546`,
  Host `be24fbc232c967912f529053d34a9d407b369a39`, 285 pins, acceptance
  `7e1e2b6d8eafac4411f1cc63d5b5dc67c5de994a`.
- Six actual STEP reads PASS after the separately recorded Node24 child-loader
  correction `f3da26bbe150524e99d3173bc2ac6458b47dd8cd`. The reader is another
  OCCT consumer, not an independent geometry kernel.
- FIRST artifact oracle FAIL: its blind cylindrical-wall proof requires exactly
  two identical XY pairs per triangle. Actual coordinates differ by nine binary64
  ULP. This diagnoses an assumption; complete mesh correctness is still unproved.
  Do not weld vertices, loosen tolerance or substitute a volume-only PASS.
- Evidence: `test/selected-profile-extents-workflow/evidence-r4/ARTIFACT-STATUS.json`;
  exact input manifest and diagnostics in sibling `diagnostics-r4/INPUTS.json`.
  [Detailed proposed validation](../reviews/EXTENT-MESH-ACTUAL-R4-LIBRARY-VALIDATION-PROPOSAL-20261109.md).

## Boundaries

```text
native .cad: intent / parameters / history / identity / materials
                    |
          shared model commands and transactions
                    |
          existing Worker solid-kernel interface
                    |
           kernel-owned geometric results
                    |
           STEP / core 3MF / drawing SVG
                    |
     read-only, version-bound validation adapters
                    |
     separate evidence reports; no authored-model mutation
```

The selected kernel evaluates a part's history. No per-feature automatic fallback,
continuous STEP conversions, duplicate editable models or new plugin framework.
OCCT stays preferred; SMLib and mesh backends keep explicit capability contracts.
Native .cad is the editable import. Exports are handoffs and cross-check inputs.
Neither a validator nor a drawing renderer becomes a second feature-history owner.

## Candidate map

| Candidate | Role and first boundary | What it must not silently replace | Initial decision |
|---|---|---|---|
| Existing OCCT WASM | General B-rep operations, curve intersections, offsets, sweeps and supported feature variants behind current Worker interface | Sketch constraints, authored identity, history or reference repair policy | Inventory existing API/binding gaps before implementing more geometry math |
| CadQuery/OCP | Optional native Python STEP inspection and operation reference on R730 | Independent-kernel evidence: OCP also uses OCCT | Add only if it reduces adapter work beyond our existing STEP reader |
| lib3mf | Package structure, units, components/build items and material/property associations | Full-precision coordinate authority or native project persistence | Assess native first; official WASM binding evaluated separately |
| Trimesh/NumPy | Read-only general mesh incidence, winding, components and numerical measurements | Self-intersection or complete design/deviation certification from a watertight/volume flag | Native isolated adapter; raw arrays with processing and validation repairs disabled |
| CGAL Polygon Mesh Processing | General intersection, degeneracy, volume-boundary and bounded-distance checks | Source intent, unproved reference-surface accuracy or automatic mesh repair | Small native adapter first; WASM only for a demonstrated browser need |
| FreeCAD TechDraw source/API | Reference for section/detail projection, annotation, dimension and tolerance semantics | Our document, browser UI or shared commands | Reuse algorithms or small compatible components; no whole Qt/FreeCAD application port |

lib3mf's reviewed v2.5.0 API represents Position and Transform with `single`.
Retain original decimal tokens, Float64 coordinates and indices for geometry;
never route them through that API as a lossless conversion. Recheck exact types
for any adopted version. The official WASM wrapper currently identifies a
prerelease; native and WASM versions need separate qualification.

## Native assessment checkpoint

Pinned isolated dependencies1f1090f and adapter829962e built on R730. First
configure failed on Root's singular GMP/MPFR CMake variables; unchanged source
built successfully with the documented plural variables. First batches9340 and
97661 are retained, terminal, not running.

The coherent R3 observer32700df completed all six original files under55504,
terminal0. Scoped package units/material/scene/metadata-content comparisons,
raw indexed topology/vertex links, Trimesh and CGAL graph/degeneracy/complete
self-intersection/volume-boundary checks PASS all six. Original files and arrays
are unchanged. Actual evidence: test/library-validation/evidence-r3/0523b3f.
The prior material and metadata mismatches were observer namespace errors,
explained in3665ff8/782164d; no exporter or geometry change was needed.

Known library limits remain explicit: Float32 geometry is nonauthoritative, and
API preserve=true differs from the raw Core1.3 false default on these records.
No roundtrip/preservation or arbitrary type-validation claim is made. This is
scoped six-file native evidence, not browser adoption, full intended finite-
surface/accuracy proof, broad scene coverage or full Gate1 qualification.

See [operation inventory](../reviews/CAD1-OCCT-LIBRARY-FIT-INVENTORY-20261109.md),
[reader identity review](../reviews/LIB3MF-RESOURCE-PROPERTY-NAMESPACE-REVIEW-20261109.md)
and [QName review](../reviews/LIB3MF-METADATA-QNAME-REVIEW-20261109.md).
L3 remains OPEN: a general analytic-surface/coverage certificate must replace the
invalid exact-strip assumption without welding, skipped triangles or new budgets.
Existing production runtime is unchanged. In parallel Root approved the small
finite-curve binding source packet8f1a17a. Native header eea7128b and Core
protocol56eeb1c are frozen on both LANs, not mounted, executed, actionable or
qualified. Exact cylinder proof/source reviews are complete. Planar adapter
420ea4e built under90308; actual build custody2e95108 and bounded invoker
fe502d8 are retained. Indexed patch-role composition and complete corrected
artifact execution still block L3; no tolerance or geometry changes were made.

## Work queue and dependencies

| ID | Work package | Depends on | Completion evidence | State |
|---|---|---|---|---|
| L0 | Freeze actual inputs, failures and candidate roles | Existing whole output | Immutable original manifests/reports; this plan | DONE for current extent corpus |
| L1 | Inventory OCCT binding gaps and drawing algorithms | L0 | Capability-to-API/source matrix; reuse/adapter/custom decision for each missing competency | SOURCE INVENTORY DONE41f7189; header/protocol frozen, protected mounting pending |
| L2 | Pin and assess native validators on R730 | L0 | One complete six-mesh comparison report, raw-data custody and measured costs | FIRST CORPUS PASS0523b3f; broader scene/material coverage and browser fit pending |
| L3 | Close general finite-surface accuracy proof | L2 plus source-intent contract | Full-surface/coverage proof with explicit error terms; original failure retained | SOURCE PROOF/BUILD READY; complete composed artifact execution pending, blocking extent qualification |
| L4 | Integrate selected general operations and drawing pieces | L1, existing source packets | Small Worker adapters and shared commands with precise ownership/failures | QUEUED; existing C11 work continues |
| L5 | Qualify browser cost/lifecycle for selected shipped pieces | L2/L4 | Initialization, peak memory, responsiveness, cancellation, retirement and isolation evidence | QUEUED |
| L6 | Composed functional qualification and final beta | L3/L4/L5 and remaining Gate 1 competencies | Whole workflows, independent artifacts, actual SVG reviews, handoff and both LAN copies | OPEN |

L1, L2 and ongoing C11 source work can overlap. L3 needs actual library findings.
Root serializes common registry/closure edits, coherent builds and browser whole
runs. A complete passing whole precedes its independent exported-artifact batch.
Existing qualified families are rerun only when changed dependencies justify it.

### L1: operation and drawing inventory

1. Map each remaining Gate 1 competency to the current implementation and exact
   native API: supported, binding missing, adapter incomplete, unsupported, or
   not yet qualified. Include trim/extend, intersections/projection, offsets,
   repetition, selected solid variants and reference changes.
2. Identify what mature algorithms already provide. Prefer exposing those
   algorithms through the existing interface over reimplementing their math.
3. For drawing sections/details, distinguish kernel geometry/projection from
   paper layout and semantic annotations. Use TechDraw as a reference where
   useful; retain the actual finite-reference and declared-requirement contracts.
4. Record API types, units, analytic-curve preservation, ownership, prerequisites,
   failure classes, license/dependencies and operation-history provenance.
5. Do not delegate sketch satisfiability or dependency meaning to solid validity.
   Geometry representability, constraints, regions, kernel results and persistent
   references remain five separate questions.

### L2: first bounded native library evaluation

1. Use isolated pinned environments/build directories on R730. Record source or
   archive hash, compiler, dependencies, adapter commit, numeric types and license.
   No system Python replacement, runtime service changes or working WASM commits.
2. Start with the actual six 3MFs, six STEP files and two SVGs from extent R4.
   Existing STEP/SVG checks remain; mesh libraries do not validate drawing meaning.
   Include existing material-region/two-print-object examples in the next batch
   if that structure is absent from the initial corpus.
3. Stream-check original hashes once per immutable input and retain a single raw
   inventory: XML tokens, Float64 bits, indices, object/instance transforms,
   units and material assignments. Bound archive expansion and array sizes.
4. Run lib3mf semantics separately from raw-array geometry. Construct Trimesh
   with `process=False, validate=False`; prohibit automatic normal fixes, merging,
   hole filling, rescaling, simplification and serialization over original files.
5. Feed raw arrays to a small CGAL adapter retaining original face/vertex IDs.
   Check graph prerequisites before volume predicates. Preserve exact represented
   input coordinates where exact predicates/constructions are required. A mesh
   insertion failure is a reportable failure, not permission to repair it.
6. Check before/after data identity and report disagreements. Keep several print
   objects and material-region interfaces distinct; concatenated touching region
   meshes must not be mistaken for a requested single homogeneous manifold.
7. Emit separate format, indexed-topology, self-intersection, orientation,
   source-intent, deviation and resource results. No majority vote between tools.
8. Assess actual coverage, precision loss, runtime, peak resident memory and
   installation complexity. Retain only the smallest useful toolset.

### L3: accuracy and intent proof

A valid closed mesh may still be the wrong part. Source-bound dimensions,
finite trims, placements, void/material sides, hole count, through/blind meaning,
material allocation and full surface coverage remain explicit obligations.

Generic validity and numerical volume alone cannot close the failing oracle.
Use either a general library-supported finite analytic-surface proof, or a
validated reference surface/mesh with an established error to the intended solid.
Bounded mesh-to-mesh distance is useful only with that reference error known.
Comparing against an unqualified tessellation of the same STEP is a cross-check,
not independent proof. A requested tessellation deflection alone is not a proved
reference error. Preserve both directed bounds and every numerical allowance.

Keep authored 50pm, native incidence, mesh deflection and paper-display budgets
separate. Preserve the existing budgets; no silent global epsilon, early rounding
or welding. Unknown reference/algorithm error means NOT CERTIFIED. If no suitable
library closes a requirement, record the gap and implement the smallest general
mathematical adapter, never an example-name/dimension special case.

### L4/L5: production fit and resource ownership

- Keep Python/native tools as offline qualification tooling unless browser use
  is demonstrated. Reuse existing OCCT Worker loading before adding another WASM.
- Any shipped library is locally served and version pinned through existing
  signed assets/CSP. No CDN, account service, telemetry or network relay dependency.
- Heavy geometry, decompression, validation and hashing run in Workers. Consume
  versioned My files snapshot leases. Avoid main-thread Base64, Array.from,
  redundant whole-file copies and repeated hashing. Charge unavoidable contiguous
  Worker buffers to the measured working-plus-buffer budget and release them.
- Cache immutable module initialization separately from document-owned native
  objects. Account/window/document/revision/file-generation ownership remains
  explicit. Retire exact handles; do not add a mutable global model cache.
- Return bounded metadata and original diagnostic IDs. A metadata query must not
  send geometry or HLR buffers to the UI. Stale/cancelled reads cannot publish as
  current; rejected edits preserve the last accepted authored state.
- Measure startup, wall time, main-thread long tasks, actual peak memory, cleanup
  and repeated open/edit/export/close behavior. Separate WASM reserved address
  space from committed/resident memory; do not raise limits merely to fit a tool.
- The Node24 fetch preload is only for the old offline reader child. It is not
  a browser-wide networking change or a production runtime requirement.

## Report and state contract

Every result identifies input hash, authored revision, geometry revision,
library/build/adapter version, units, limits and exact tested capability.
Per-check outcomes are PASS, FAIL, UNSUPPORTED, UNCERTAIN, RESOURCE_LIMIT or
NOT_RUN. Overall qualification is derived from required outcomes and currentness;
do not synchronize a second mutable `qualified` flag. Edits make old evidence
historical without deleting it. Library exceptions and numerical nonconvergence
are not proof of an impossible design. No checks repair authored data implicitly.

## Integration lanes and next actions

Existing three source lanes remain isolated; no additional agents are required.

| Lane | Bounded ownership | Integration boundary |
|---|---|---|
| Geometry/validation | Extent actual-artifact diagnostic, generic adapter proposal and L2/L3 sources | No edits to frozen receipts, runtime or Root-owned registries |
| Worker facts | Native operation/binding inventory and current C11 finite-reference reads | Kernel facts, typed failure/currentness; no duplicate authored model |
| Host/acceptance | Current thin C11 Host and full public acceptance packet; later library report consumption | Shared commands/real file snapshots; no geometry proof in Host |
| Root | Selection, common closures/registries, review, coherent composition and sole runtime execution | One integrated packet; both LAN Git copies and current status docs |

Next serial actions: finish the native-validator acquisition/precision contract;
run the bounded actual six-mesh comparison; resolve the full-surface proof;
complete the extent artifact checks and review both actual SVGs. In parallel,
finish C11 source packets and the operation inventory. Then integrate source in
one coherent build and qualify affected complete workflows. No per-edit test loop.

## Estimates and decision points

Planning ranges, not measured completion promises; reassess after L1/L2.

| Package after extrusion qualification | Estimated focused work | Main uncertainty |
|---|---|---|
| Initial library fit assessment | 0.5–2 days; can overlap other source work | Build/dependencies, precision and useful coverage |
| Remaining drawing integration/qualification | 1–3 days | General reference/annotation/layout behavior |
| Remaining sketch/solid/reference cases | 3–7 days | Binding gaps and kernel/reference failure modes |
| Large-project resources/lifecycle | 1–3 days | Actual peak memory and cleanup |
| Final composed beta and handoff | 1–2 days after prerequisites | Combined regressions and actual artifacts |

Keep the provisional overall 1–2 week range after extrusion qualification, with
a third-week contingency. These streams overlap; do not add their durations.
The current extrusion proof is still open, so this is not a countdown from today.
Library reuse adds integration work and should reduce custom algorithms and
example-specific repairs; do not shorten the estimate until evidence shows that.

## Qualification exit and preserved scope

- [x] Preserve original R4 failures/outputs and record the general integration plan.
- [ ] Compare actual files with pinned libraries without changing their data.
- [ ] Close full surface/intent proof and remaining affected actual drawing review.
- [ ] Integrate only useful, precise adapters with shared operations and ownership.
- [ ] Complete remaining Gate 1 competency, resource and backend/export matrix.
- [ ] Run composed beta acceptance, publish agent examples/handoff, verify LAN copies.

No public deployment, new ports, router/Caddy/firewall change or GitHub push is
part of this plan. All server external relay, including ping, remains OFF.
Cancelled filesystem-race/foreign-account tests stay cancelled. No requirement
for a printer, Bambu project settings, foreign editable imports or all-engine
feature parity is added. Keep the existing saved-data/recovery contract; unsaved
RAM can be lost on forced close. Preserve unknown-write ownership and settlement.

## Primary references

- [OCCT modeling algorithms](https://github.com/Open-Cascade-SAS/OCCT/blob/master/dox/user_guides/modeling_algos/modeling_algos.md)
- [CadQuery shape API](https://cadquery.readthedocs.io/en/latest/classreference.html)
- [lib3mf repository](https://github.com/3MFConsortium/lib3mf), [v2.5.0 interface/types](https://raw.githubusercontent.com/3MFConsortium/lib3mf/v2.5.0/AutomaticComponentToolkit/lib3mf.xml), [official WASM wrapper](https://github.com/3MFConsortium/lib3mf_wasm)
- [Trimesh implementation](https://github.com/mikedh/trimesh/blob/main/trimesh/base.py)
- [CGAL intersections](https://doc.cgal.org/latest/Polygon_mesh_processing/group__PMP__intersection__grp.html), [bounded distance](https://doc.cgal.org/latest/Polygon_mesh_processing/group__PMP__distance__grp.html), [exact kernel](https://doc.cgal.org/latest/Kernel_23/classCGAL_1_1Exact__predicates__exact__constructions__kernel.html)
- [FreeCAD TechDraw reference](https://github.com/FreeCAD/FreeCAD-documentation-docusaurus/blob/Stable/docs/workbenches/techdraw.md)
