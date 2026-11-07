# Next E11 code contract (read-only plan, not feature qualification)

This supplements the existing comprehensive
`research/gate1-edge-features-plan-20261106/README.md`; it does not replace that
plan or introduce another editable model. Reviewed CAD base186972b7d and the
owner's frozen R2/R3 component graphs. Native branch3a75 plus its explicitly
uncommitted R2 integration was inspected; a bare branch checkout alone did not
yet contain that integration at inspection time. No Chrome, Files, human UI,
filesystem-race/security tests or product edits belong to this planning note.

## Agreed immediate boundaries

1. Root owns Worker `solid.prism.selections.read {version:1,handle,featureId}`.
   Result is `{contractVersion:1,op,unit:'millimeter',selection}`; selection is
   `{status:'available',plan}` or `{status:'unavailable',reason}`. The application
   ledger supplies/cross-checks its own producerFeatureId; public callers select
   an outputID, never a native handle or an arbitrary producer namespace.
2. Current index key grammar is the exact opaque canonical string
   `worker-prism-selection:1:` + JSON `[featureId,regionId,kind,role,source]`.
   Roles: face first-cap/last-cap (source null), face swept-boundary (curve ID),
   edge first-boundary/last-boundary (curve ID), edge connector (sorted incident
   authored-curve pair). Normalized slots/reversed traversal map back through
   captured sourceBinding. Native circle seams are unresolved, not corners.
3. Native lane owns NEW `ownedEdgeTreatmentV1.hpp`, with agreed interface:

   ```cpp
   enum class Kind { Fillet, EqualDistanceChamfer };
   struct Result { TopoDS_Shape shape; std::string ancestry; };
   Result apply(const TopoDS_Shape& input,
                const std::vector<int>& edgeIndices, Kind kind, double size);
   ```

   Indices are unique1-based EDGE indices in the exact
   `owned_topology_v1::Maps(input)`, resolved only inside the current Worker.
   Initial selection bound1–16. No DBRep publication in this helper, no native
   pointer/ordinal in authored history. Root owns eventual main/export wiring.
4. TKFillet is already linked. Upstream provides
   BRepFilletAPI_MakeFillet(input)/Add(radius,edge)/Build and
   BRepFilletAPI_MakeChamfer(input)/Add(distance,edge)/Build. Both Add calls may
   propagate tangent contours. First helper must require the actual contour
   edge set to equal the requested set, or explicitly refuse unsupported
   propagation. Never silently enlarge the selection.
5. Capture same/modified/generated/reportedDeleted with that exact local
   builder before destruction. Its list storage is reused, so copy each
   relation immediately. Same membership/unique supported descendants can
   retain a key; zero/multiple descendants remain unresolved. reportedDeleted
   is raw builder evidence and does not override an actual same descendant.
6. Native input preservation must cover serialized BRep, catalog and
   vertex/edge/face tolerances before/after success and failure. Const shape
   alone does not freeze shared TShape state. The native owner's first direct
   probe reportedly observes exact preservation; that lane owns its receipt.
   A copied working shape is required only if actual mutation is found, with
   original→copy→result ancestry composed explicitly rather than lost.

Native helper failure names agreed with its owner:
EDGE_TREATMENT_INVALID_REQUEST, EDGE_TREATMENT_INVALID_INPUT,
EDGE_TREATMENT_UNSUPPORTED, EDGE_TREATMENT_FAILED,
EDGE_TREATMENT_INVALID_RESULT, EDGE_TREATMENT_RESOURCE_LIMIT and
EDGE_TREATMENT_INPUT_CHANGED. Preserve these classifications through FFI;
do not flatten ordinary unsupported selection or failed construction into an
unexplained generic error. Helper availability is not a new native export.
Root can add one exact owned-name export that calls apply, validates metrics,
and inserts only the successful fresh result name; it must not call legacy
blend/chamf or global mutable DRAW history. Native failure leaves no new name.

## Small application extension after native proof

Proposed new registered type WORKER_SOLID_EDGE_TREATMENT_V1 stores only
`{version:1,unit:'millimeter',engine:'occ',engineRevision,featureId,target,
kind:'fillet'|'chamfer-equal',edges:string[],size:number,
propagation:'selected-only'}`. Target is a current logical outputID; edges are
discovered semantic keys, size is canonical numeric mm, bounds/duplicates are
checked before native work. Initial public admission should qualify straight
convex extrusion connectors, not every discoverable boundary/circular edge.
No face-wide expansion, variable radius, distance-angle chamfer or mesh fallback.

Private SolidKernel request can use an owned handle + semantic edge strings;
Worker resolves them against this exact target's map immediately before the
native job. Model code never resolves raw indices. Add one result/name/triangle
charge through existing selected budgets, one consumed target and one new
MWorkerSolid through existing owner/currentness/publication. Keep its topology
arrays empty; do not create legacy MEdge pointers to call FILLET_TOOL.

Exact existing integration points: solidIntent capture, SolidKernel union,
solidLedger kind/operand/output record, Worker/controller dispatch, dedicated
operation descriptor, Craft command/registry, selectedProfileBudget whitelist,
unconsumedSketchSave ancestry, existing journal/replay and native validator.
At the reviewed base186972b7d the ledger discarded constructionProvenance.
Owner checkpoint1ee76d350 now reads the plan during candidate evaluation using
its own intent.featureId and retains immutable weak-map metadata for existing
inspect-worker-solids. That application hook has separate qualification; the
R4 component read proof does not establish public ledger/currentness behavior.
Size edits must bind target/build/kind/exact edge-key list through owned full
history replay and existing authored undo/redo. A same-size edit is a no-op;
stale/cancel/failure cannot alter accepted source/history/journal. Post-commit
caller loss must preserve committed:true semantics. Typed sizes remain
explicitly unsupported until the existing physical binding path is qualified.

## Serial dependency that must not be hidden

Initial prism selections do not automatically name a Boolean result. Generic
box creation currently has no prism provenance; cuts/unions need genuine
per-input native builder ancestry before those keys can pass through them.
Until then box/Boolean selection reads are NOT_A_PRISM_RESULT. Do not attach
the original prism's local map to a modified shape. For the integrated drilled
plate, complete this descendant propagation before filleting its outer edges.
Legacy WORKER_RECTANGLE/HOLE mounts and generic V3 mounts are distinct builds;
do not cast handles or silently move a history between them.
Adding the future native export also changes the JS/WASM build identity.
Create the first E11 fixture on that explicit registered build from the start.
An older saved prefix pinned to R2 cannot silently switch its engineRevision
when a fillet is appended. Either refuse the missing capability or perform a
separate deliberate whole-part re-evaluation transaction. No general migration
framework is required to prove the new fixture.

## Minimal acceptance order

- Native/component first:100×50×20 prism, one convex connector filletR3 gives
  V=100000−20·9·(1−π/4); equal chamfer1 givesV=100000−20/2. Native validity,
  unchanged bounds, removed/retained corner section points, complete actual
  ancestry and original-input preservation; then excessive size, wrong edge,
  duplicate key and unsupported tangent-contour refusal.
- Shared public E11: discover actual key; create each treatment through the
  same public operation; change radius3→2, stale/zero/negative/oversize controls,
  native-held cancel/Close, full authored undo/redo, ordinary native reopen.
  Reversed source traversal/width edit retains the intended junction keys or
  explicitly becomes unresolved; never nearest-edge substitution.
- Integrated plate only after cut ancestry: centeredØ10 and fourØ4 corner
  holes; two disjoint outer connectors filletR3 and two others chamfer1.
  Expected V=D·(W·H−41π−18·(1−π/4)−1), all five voids/placements preserved.
  Resize100×50→150×30 with feasible hole/pattern offsets, display inches,
  undo/redo and fresh reopen. Pattern-after-treatment remains its own authored
  seed/replay requirement, not body duplication or implicit E11 completion.

No feature or whole Gate1 completion follows from this contract alone.
