# Worker-owned prism to editable model: smallest bridge

Research proposal against JSketcher `00e82cd7ee0b7b52bb27817e8c0c4e629668ce2c`. No implementation, production engine pin, file-format migration or runtime qualification is implied. First slice: one existing, explicitly selected, closed principal-XY rectangle sketch region; positive finite depth; one separate OCC BREP prism; no Boolean, fillet, pattern, arbitrary curve, implicit region choice, or engine conversion. The input remains the authored sketch and EXTRUDE history, not a BOX substituted for that sketch. A display mesh alone is not an editable BREP.

Progress after this proposal: `228cde72` corrects the concrete MVertex ID-type
defect described below, with independent fresh-build/registry/replay tests;
ordinal IDs remain unstable and durable vertex references remain unqualified.
`34b81acf` qualifies a bounded actual sketch-profile-to-OCC-worker prism with
source-edge ancestry, mesh checks and versioned unsnapped input. See
`test/engine-extrude/lead-evidence-20261104.json`. The model/ownership/history
bridge in this document remains unfinished; do not treat these component
checks as completed editable-solid publication.

`25050c16` adds the independently reviewed, worker-local portable topology
prototype, including dense input validation, 16 KiB serialized descriptor cap
and explicit research opt-in. Ordinary controller calls neither build nor
transfer it. Lead combined tests and exact hashes are in
`test/engine-topology/lead-evidence-20261104.json`. These local IDs and measured
planes/loops are inputs to the separately qualified strict model reader, not
durable topology naming or evidence that legacy pointer consumers can use it.

At integrated `ae27a6ba`, the bounded reader constructs real JS topology in a
headless worker from fresh normal/reversed OCC output. Independent review found
and corrected wrong base-versus-swept-face ancestry and an axial-length check
that admitted excessive lateral displacement. The regression now measures the
transverse displacement directly. Eager Verb dependency is removed for analytic
reading; actual NURBS loading still uses the existing global library/cache.
Lead component evidence is in `test/portable-prism-reader/lead-evidence-20261104.json`.
Mount ownership, document freshness, durable references and atomic model/history
publication remain required; this reader alone establishes none of those.

At `f3d1f0f8`, the optional topology response is bound to a live OCC mount and
exact copied sketch revision/digest/face/region. The caller can check that
binding before and after asynchronous reader work; disposal, close, wrong
mount, altered descriptor and delayed cancelled replies are refused. Lead
combined actual-worker tests also pass the existing OCC and Manifold paths
through the changed shared controller; see
`test/portable-mount-bridge/lead-evidence-20261104.json`. This proves live mount
association, not document/account freshness, durable naming or atomic history
publication. Those remain the next boundary.

## What the current path actually does

- `modules/workbenches/modeler/features/extrude/rectangleProfileRequest.mjs` already prepares a bounded, versioned OCC request from exact serialized sketch bytes/digest, face/region IDs, frame and depth. It captures input before digest, checks the four authored straight edges, canonical selected region, frame, finite coordinates and supported constraints. Its accepted input is a *preparation contract*, not evidence that a prism has been made or that the returned topology has stable references.
- `modules/workbenches/modeler/features/extrude/extrude.operation.ts` still calls `OCCUtils.sketchToFaces`, `oci.prism`, optional region Booleans and `occ.io.getShell` on the UI thread. `web/app/cad/craft/e0/occSketchLoader.ts` maps each contour's authored segment to named OCC curves/edges/wires. `web/app/cad/craft/e0/OCCUtils.ts` makes faces and uses `getLightShell` to build source topology. The worker prism currently under development is research-only; its face ordinals and geometric edge/face matches are not persistent references.
- `web/app/cad/craft/e0/occIO.ts#getShell` calls `Interrogate` through `interact.js`, then `web/app/cad/scene/wrappers/entityIO.js` calls `modules/brep/io/brepIO.ts#readBrep`, optionally runs the production analyzer, and constructs `MBrepShell`. That payload contains face surfaces, oriented loops/coedges, edge endpoints/curves and tessellation as well as native `ptr`, `ref` and `edgeRef` values. The pointers/ref values belong to the legacy in-page WASM instance; they must never be sent to or dereferenced by another worker. `readBrep` currently uses `edgeRef` as an edge-index tag, infers/deduplicates vertices with `VertexFactory`, synthesizes missing twins and can substitute `NullSurface` on a surface read error. Those behaviors are not sufficient validation of an untrusted or incomplete worker result.
- `web/app/cad/craft/production/productionAnalyzer.ts#FromSketchProductionAnalyzer` uses an `OCCClassifier` to compare original source topology with generated topology and assigns `F:BASE[wireId]`, `F:LID[wireId]`, `F:SWEEP[segmentId]`, and `E:BASE`, `E:LID`, `E:SWEEP` roles/IDs. `Contour.id` in `web/app/cad/sketch/sketchModel.ts` is the lexicographically least segment ID, not a kernel face ordinal. The analyzer also uses half-edge orientation/adjacency for endpoint provenance; objects without identification become `unstable`. `classifier.ts` currently calls pointer-based native face/edge classifiers and `UpdateTessellation` in the UI. Blindly running that analyzer against worker-local handles would call the wrong instance.
- `web/app/cad/model/mshell.ts` wraps a `Shell` as `MBrepShell`, with `MFace`/`MEdge`/`MVertex` objects and a topology registry. `web/app/cad/craft/cadRegistryBundle.ts` indexes model IDs, and `schema/types/entityType.ts` resolves saved entity references by those IDs. The corrected `MBrepShell` creates string vertex IDs; ordinal fallbacks remain explicitly unstable and are not qualified as durable references. Existing `OCI` proxy, `occIO.pushModel`, `OCCUtils`, `craftEngine.ts`, fillet and checked-cut/pattern paths all use in-page OCC names and/or raw pointer `externals`. They cannot consume a worker handle by accident or by relabeling its representation.
- `web/app/cad/craft/craftBundle.ts` evaluates the proposed history from the beginning in a private evaluation registry, checks document generation/evaluation epoch, then prepares and commits model/history/registry publication with no asynchronous gap; the last accepted state remains the fallback on rejection. Project manager snapshots in `web/app/cad/projectManager/projectManagerBundle.ts` store a version-2 millimeter envelope, authored model/history and sketches; restore regenerates geometry. They do not make a worker handle durable. Undo/redo and reopening therefore require deterministic replay and reference resolution, not serialization of a process-local kernel address.

## Smallest correct boundary

1. Keep the existing `EXTRUDE` operation and explicitly captured selected face/region and normalized history parameters. At candidate replay, resolve the source face and sketch in the *candidate* registry and submit the prepared rectangle request to an OCC mount. Include bounded request version, engine/mount identity, revision/evaluation epoch, document generation, source face ID, region descriptor, exact sketch digest, finite XY frame/depth, millimeter unit, and explicit tolerance/mesh quality. Recheck all these against the current candidate immediately before publication. Frame, source sketch, constraints, region and captured arguments must be immutable snapshots; reject stale, ambiguous, invalid and unsupported input before publishing. Run profile construction, OCC prism, validation, interrogation, provenance/classification and tessellation inside the worker. A successful low-level command or a nonempty mesh alone is not sufficient.
2. The worker response must be an explicitly versioned, bounded **data-only BREP descriptor**, plus opaque mount-scoped owned handles. For this restricted prism, require exactly one valid closed oriented solid, six planar faces, twelve unique straight edges and eight vertices, with finite coordinates, surfaces, per-face loops/coedge orientation, explicit vertex and edge identity/adjacency, finite bounded face triangulations, and volume/bounds/manifold evidence. A local edge ID is a response-local typed token, not the legacy pointer-derived `edgeRef`; two coedge occurrences may refer to the same underlying edge. Supply opaque `{mountId, generation, kind, id}` body/face/edge handles tied to this candidate's live worker, with strict kind and ownership checks. These tokens are process-local capabilities, never persistent model IDs or raw addresses. The current research response of triangles/bounds and geometric matches is insufficient until it supplies and validates this data.
3. In a bounded adapter, verify schema, count/byte limits, finite numbers, frame, topology incidence, loops, connectedness, orientation and independent prism bounds/volume. Do not silently convert a bad plane to `NullSurface`, synthesize missing faces/twins, trust a raw `ref`, or accept missing mapping. UI may construct the existing JS `Shell`/`MBrepShell` projections, registry entries, small plane/line value objects, and views from already validated data, provided it performs no OCC calls or heavyweight kernel computation. For this small fixed rectangle, that bounded reconstruction is plausible; benchmark it, and move larger topology decoding/projection work off the UI when it is not bounded. Mark `externals` with a distinct typed worker-owned representation and a handle table, never store a worker ID in a numeric legacy `ptr` slot. Alternatively use a dedicated strict reader beside `readBrep`; do not weaken the legacy reader to accept ambiguous payloads. Confirm the existing face sketch/frame, selection and 3MF render/export consumers have the necessary data before exposing them.
4. Compute/verify semantic source-to-result provenance in the worker. Prefer actual prism operation history (`Generated`/source edge and face relation) tied to the validated source contour; if unavailable, a geometric mapping is acceptable for this restricted rectangle only after a unique, bijective and independently checked correspondence, including direction reversal, base/lid and endpoint association. Supply typed provenance keyed by full authored segment IDs and contour ID. Recreate the existing role/ID scheme only where equivalence to the existing `FromSketchProductionAnalyzer` is demonstrated; validate uniqueness, namespace and registry collisions before committing. There is no permission to select the first matching face, to use traversal ordinal as a persistent ID, or to infer identity from a tessellation match. Any zero/multiple match, changed/split/merged entity, vertex-ID ambiguity or collision must be an explicit unresolved reference/repairable failure, not a guessed rebind. Preserve the old accepted model on failed replay. Fix or explicitly reject the current MVertex-ID issue before offering durable vertex references.
5. Tie every candidate to a private worker/mount and its own temporary topology handles. Do not mutate the accepted mount while evaluating candidate history: replay can call earlier operations, fail later or be cancelled. A conservative first implementation may allocate one bounded worker for the *entire candidate evaluation* and publish its resulting mount ownership together with model/history/registry and any prepared workspace writes; keep the prior accepted mount alive until the atomic commit and any necessary reader handoff completes. Release the rejected/cancelled/stale candidate and unpublished references on every failure, timeout, reset, account/window invalidation and worker death. The existing research OCI runtime only proves whole-worker termination as native cleanup; logical handle disposal is not evidence that all native allocations were freed. Enforce one admission budget and bounded concurrent retained/candidate workers; no UI-thread worker fallback. If the engine or context dies, mark all handles stale and rebuild from authored history or expose a repairable failure; never reuse a handle in another mount/generation.
6. Route later consumers through the **owning** engine and same candidate evaluation: a worker-owned face/edge/body handle must be resolved by that worker, with all operands from the same live mount and generation. Until an operation has a qualified worker implementation, fail explicitly as unsupported *before* mutating the model: this includes current OCC Boolean/cut/fillet, pattern, push/pull, legacy classifier and pointer-based 3MF paths where they would touch these handles. Never silently fall back to UI-thread OCC, implicitly copy a pointer, reinterpret mesh as BREP, or convert between OCC and Manifold/Native Mesh. Preserve both engines as independently identified capabilities. Future worker Boolean/fillet support needs kernel provenance and explicit topology-change reference handling; it is not delivered by the prism.
7. Save only normalized authored history, sketch/region references, units and meaningful revision/provenance according to the native envelope; never serialize handles, face ordinals or a derived mesh as the editable source. Reopen, parameter edits and undo/redo replay the worker operation from those inputs, validate engine/runtime compatibility and regenerate semantic IDs. Existing project paths resolve references through the candidate registry; an absent, ambiguous or changed generated reference must stop dependent replay with an explicit unresolved reference while preserving the previous accepted state. Handle-native 3MF export, if later qualified, should request a quality-controlled worker tessellation from the correct live body and associate it with the same revision/material regions; it is not required to claim this first bridge works.

## Bounded acceptance and outstanding evidence

- A real Worker runs the actual rectangle-to-prism command on an authored sketch, not a BOX shortcut. Assert independent analytic dimensions, volume, closedness, face/edge incidence, orientation and bounded response; actual `MBrepShell`-level selection, a sketch on a generated planar face, view update and the authored `EXTRUDE` history must work. Verify no kernel execution or `Interrogate`/native pointer crossing on the UI thread.
- Compare source-derived base/lid/sweep/edge IDs against the current legacy path for normal, translated, reordered/reversed edges and two distinct rectangles; verify uniqueness and stable save/reopen, parameter change and undo/redo. Explicitly exercise duplicate/ambiguous matches, missing generated topology and changed type: unresolved/failure, no wrong face accepted. Add the vertex-ID negative control before claiming vertex identity. This naming requirement is not proven by worker face ordinal or by a single successful shape.
- Force cancellation/timeout, worker error, malformed response/oversized topology, document reset, window/account change, stale sketch/frame/revision, and downstream replay failure before and after publication notifications. Assert last accepted history, registry, sketch bytes, geometry and prior mount remain intact, rejected worker is terminated, no stale callbacks publish, and a committed-then-superseded result is labeled truthfully. Exercise multiple consumers/undo and mount exhaustion to show no premature termination or unbounded retained native memory. Fine-grained native allocator reclamation is still unproven.
- Test unsupported cut/fillet/Boolean, same- and cross-mount operands, cross-engine use, worker restart/stale handle and manufacturing export. They must fail explicitly without conversion or silent UI fallback until separately implemented. Native Mesh remains available for its own supported operations.
- Integrate the bridge only after actual tests against the selected pinned runtime, a bounded topology/provenance payload and strict reader, and qualified CSP/bootstrap custody. The proposed replacement runtime's clean versus incremental `ShapeFix_Wire_1` codegen differences remain a separate promotion gate; this bridge does not require promoting that replacement. Session-wrapper counters, four synthetic geometry cases, and a hash-pinned artifact do not by themselves prove general OCC allocator safety, semantic equivalence or production readiness. Whole-worker termination remains the bounded native cleanup boundary until finer ownership is qualified.


## Integration audit at `f3d1f0f8`

`f3d1f0f8` contains the strict reader and deferred-Verb change through
cherry-picked commits `ef4fcea7`, `a010de6b`, `a1f0a30a`, and `ae27a6ba`,
plus the optional mount association. Author commit hashes are not ancestry
proof for cherry-picks. The separate semantic-role candidate `2e8ee9fd` is not
integrated. It produces feature-scoped structured BASE/LID/SWEEP face and
BASE/LID perimeter-edge keys, preserves the entire authored region identity,
and leaves connector edges and all vertices unsupported. It requires the
caller to assert the live mount binding before and after the job. Its role
comparison with an actual retained legacy OCC example is limited as documented
in `test/prism-semantic/README.md` on that branch.

Follow-up: `2e8ee9fd` is now integrated as `be70f127`. Independent review and
lead fresh-build/typecheck/actual-worker tests pass; exact evidence is in
`test/prism-semantic/lead-evidence-20261104.json`. The remaining integration
boundaries below are unchanged: model projection, candidate/accepted resource
ownership, current-document publication, and edit/undo/native reopen.

Existing `rectangleCreation.ts` shows the current concrete guard shape: an
opaque revision tracks service identity, document generation/signal, storage
revision, craft evaluation epoch and relevant stream revisions. Its host-facing
`signal` and `valid` guard are passed through the same core operation by the
visible action and agent command; the returned receipt says volatile workspace.
The regular EXTRUDE operation has not acquired those host-job guards, and the
rectangle command makes an authored sketch rather than an extrusion.

The strict reader currently returns an actual `Shell` *inside* a Worker. A
structured clone cannot preserve its class prototypes. The smallest remaining
model adapter needs a reviewed separation of strict Worker validation from a
bounded, synchronous assembly of only eight JS vertices, twelve edges and six
faces, with no native calls. It must bind the assembled objects to the exact
validated response, and project structured semantic keys into collision-checked
registry strings without treating local ordinals as durable names. The current
`MBrepShell` vertex ordinal fallback is unstable; neither vertex nor connector
references should become selectable durable references by implication. Merely
passing a cloned Worker `Shell` to `MBrepShell` is not a working bridge.

`evaluatePipeline` currently returns only `MObject[]`; its `finally` drops the
candidate registry but does not own or close a mount. Its existing state-batch
commit is the correct publication boundary, yet it needs a private candidate
resource owner and an explicit ownership transfer in the *same* no-await commit.
Rejected, aborted, superseded and reset candidates must terminate their own
Workers. The last accepted owner must survive a failing replacement and be
retired only after the successful replacement is committed and consumers are
finished. A bounded per-evaluation Worker is the current native-cleanup
boundary; `dispose` is logical only. The owner also has to cover history
navigation, multiple intermediate bodies and eight-name exhaustion. No shared
resource-owner contract is implemented by this note.

A minimal next internal slice should extend the existing EXTRUDE history/schema
with an explicit versioned worker-execution selection. An absent selection must
retain the current legacy behavior; unsupported selections/engines fail closed.
Persist only authored feature/face/region, expression/direction/depth and
execution choice in the existing project, never the mount handle or derived
result. Resolve sketch bytes/frame and region from the private replay registry,
run the actual solve/profile, OCC mount, reader and semantic jobs, and recheck
service/generation/epoch, storage and expression revisions and live mount binding
after every await and immediately before commit. Window/account/host validity
must be wired to that operation's cancellation and precommit guard; regular
background replay also requires a document-lifetime owner independent of UI.
Existing `snapshotCurrentProject` blocks save when replay fails or is in
progress, and normal native-project reopen replays history. A new path must not
bypass these guards. The current `ctx.occService` path, legacy `.externals.ptr`
consumers and pointer-based classifier cannot consume the opaque worker handle;
this includes unqualified Boolean, fillet, 3MF and dependent-sketch paths. No
automatic kernel or representation fallback is justified.

Before publication, independently exercise: (1) actual authored 100×50→150×30
rectangle, region, 20 mm depth, measured bounds/volume and semantic IDs through
edit/undo/redo; (2) held real solver/OCC/reader callbacks while editing sketch,
storage, expressions, history, document (including identical reopen/ABA),
account or window, with no stale publication; (3) cancellation, disposal, wrong
mount, late result and committed-then-superseded notification with exact status;
(4) failed/unsupported operation retaining the last valid model *and its live
owner*, followed by successful repair; and (5) actual signed My files CAS
save/reopen, no serialized handles/ordinals, stable supported references and
independent second-account isolation. Observe model/history/registry/workspace
coherence synchronously. These tests are future work, not a claim that the
current reader or mount alone provides edit, undo or reopen readiness.
