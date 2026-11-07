# Proposed minimal associative part drawing workflow — E22

Proposal only. Source inspection base: CAD `7b688c88d3608f177172ee551a391ca2ce566332`. No production implementation, browser execution, or new native success is claimed by this document. The qualified orthographic component supplies derived projection records; shared linked views, dimension witnesses, drawing history, persistence and the human surface remain OPEN.

This is Gate1 E22, within the current 21-exercise gate (E01–E16 and E18–E22). Assembly E17/C10 belongs to Gate2. Reuse one authoritative part model and the existing shared operation/transaction machinery. Do not create a second drawing CAD model, agent-only writer, renderer-authoritative geometry, or separate Undo stack.

## Smallest complete part workflow

Start with one real selected rectangle 100×50 mm, extrusion depth20, and a centered through-hole D10. Create one linked drawing with three source-relative views on a physical 297×210 mm sheet. Seven reference dimensions cover width, height, measured native cap separation, measured centered-hole diameter, and the hole-axis offsets in X/Y, with one repeated width in an aligned view to exercise cross-view association. Source width/height are explicitly source-datum measurements; the cap and hole measurements observe the actual current native result.

Resize the source to150×30, depth25 and hole D14. Valid unchanged references follow the actual edited source and native descendants. The drawing must show the new values and geometry without replacing references by equal-looking geometry. Later outer treatments exercise surviving cap references and a deliberately lost original edge. A dimensioned bracket is a second acceptance case; it does not require a new document system.

Agent and human use the same public services. A thin human Drawing pane invokes those services for create/select/edit/repair/refresh/export, renders actual Worker-derived vector data, and displays stale/broken status. Actual human and agent authoring must both be tested before E22 completion; a canvas mock or protocol double is insufficient.

## Persisted semantic definition

One versioned drawing stores only:

- bounded drawingId/title;
- target `{featureId,operationType,engine,engineRevision,output:'complete-native-result'}`;
- source datum `{featureId,faceId,regionId}` with the actual opaque discovered region ID;
- physical sheet width/height in millimeters and positive rational drawing scale;
- up to3 view definitions: viewId, named basis, paper placement, and explicit visibility policy;
- up to16 reference dimension definitions: dimensionId/viewId/type, discovered semantic references, and paper label placement.

The entire public definition, including opaque IDs, fits the existing 64KiB UTF-8 command metadata budget. Validators bound fields and counts before work. No solved curves, measured values, native handles, ordinals, HLR record indices, display mesh, cached frames, pixels, or derived buffers are persisted as authority. Typed project bindings may initially refuse explicitly; never substitute nominal parameters for measured facts.

The target is a fixed current producing feature. It follows replay/edits of that feature. If a later operation consumes its output, it becomes unavailable until an explicit undoable target replacement chooses an actually discovered complete current output. Do not silently select the latest body, replay a prefix as the current whole part, or migrate by geometric resemblance.

## Frozen view convention

Frames use an actual reconstructed source datum, not a duplicated saved solved frame. Camera is from +n toward the datum plane; each `(u,v,n)` basis is right-handed. Named third-angle views are:

| View | u | v | n |
|---|---|---|---|
| top | source X | source Y | source Z |
| front | source X | source Z | −source Y |
| right | source Y | source Z | source X |

Paper layout declares third-angle placement. View scale affects paper size only. Display units affect labels only. Canonical dimensions remain millimeters and angles radians. For example150mm displays as150/25.4in and appears75mm long at1:2 scale, while the part stays150mm.

## Dimension witnesses are separate from projection

The qualified `solid.drawing.orthographic.read` result is derived display geometry. It preserves actual native visible/hidden intervals, analytic line/conic coefficients, range/orientation and eight group ordering. Response-local records and mutable transferred buffers are not authored references or measurement witnesses. No proximity search, projection ordinal, tessellation, minor-arc selection or curve deduplication can supply missing reference identity.

Three reference families are sufficient for this stage:

1. **Solved source datum.** Bind actual constructor feature/face/region/curve IDs plus a declared native endpoint `a`/`b` or circle center. The real solve Worker corroborates source membership and constructor input. Label width/height as datum observations, so a later fillet shortening an edge does not silently redefine those dimensions. Do not parse opaque region/selection strings, construct endpoint IDs, or persist driving-dimension locators: those locators are revision-bound inspection addresses.
2. **Current native selected entity.** Persist an actually discovered authored edge/face key, origin and expected geometry type. Resolve through the current private selection index only. Unique same/modified descendants must have the expected actual analytic type. Cap separation observes actual first/last-cap planes; an original edge dimension observes an actual current line. Splits, merges and losses are explicit, never nearest-neighbor or ordinal repair.
3. **Semantic centered-hole cylinder.** Persist the real hole feature/source reference and centered slot. Add an authenticated construction witness linking the actual circle-tool swept face through verified source-B copy/Cut ancestry to a unique current cylindrical face. Measure its actual native radius/axis. Derive center offsets by intersecting that native axis with the actual source datum plane, not by returning the captured diameter or nominal center. Propagate only through genuine supported subsequent A-side ancestry. Unsupported corner/pattern slot naming remains separate until specified and qualified.

The third family is a confirmed missing shared capability. `cutOwnedBoreTools` already has actual tool construction, validated complete B ancestry and result topology before releasing tools; it currently advertises inherited A selections only. A bounded private witness can be captured at that seam and propagated using the common reconciliation rules. Retain causal membership, not duplicate native tool geometry. Existing private seed witnesses and sourceContexts alone do not establish current hole-wall membership. Check whether the existing native topology analytic plane/cylinder facts suffice before proposing any new native export.

Generated targets are new entities, not inherited replacements. Raw reportedDeleted never overrides real descendants. NO_DESCENDANT with reportedDeleted=false is unresolved, not a proven tombstone. Preserve first failed feature identity where genuinely available. Current unclaimed aggregates are recomputed, not accumulated across history.

## Shared public and internal operations

Proposed names, not advertised implemented commands:

- `inspectLinkedPartDrawings()` returns definitions and explicit current/stale/broken status.
- `inspectLinkedPartDrawingTargets({revision,geometryRevision,bodyId,featureId})` discovers admissible current target, datum and actual semantic reference choices.
- `createLinkedPartDrawing({...revision,target,datum,sheet,views,dimensions})` captures only the bounded definition through the shared transaction.
- `editLinkedPartDrawing({...revision,drawingId,patch})` admits an exact bounded patch; reference repair includes expected old and discovered replacement references.
- `removeLinkedPartDrawing({revision,drawingId})` uses the same journal.
- `refreshLinkedPartDrawing({revision,drawingId})` performs one complete replay and three projections/seven observations; cleanup must complete before installing the matching derived cache.
- `exportLinkedPartDrawing({revision,drawingId,format:'svg'})` returns a Worker-generated Blob with physical sheet dimensions and matching current complete binding. PDF, drawing DXF and GD&T are separate claims.

The existing host documentToken/session/account/window boundaries apply across asynchronous steps. Typed projection buffers never traverse the JSON command registry. Public export metadata remains small and intrinsically validated separately from Blob bytes. Initial SVG is an actual vector artifact with measured labels and declared units/scale, not a screenshot.

Extend `craftBundle.ts:evaluateWorkerSolidRead` with a typed drawing observer. Reuse `evaluatePipeline`, `pipelineTail`, frozen history/descriptors, captured source bytes/frames/expressions, complete current output/build admission, candidate ownership and exact MObjectIdGenerator context restoration. The existing point/STEP read patterns supply lifetime/currentness and accepted-versus-replayed measured fact checks. Do not duplicate the feature executor or borrow retired accepted native handles. Capture complete inputs with no live-source fallback.

Resolve semantic witnesses and perform native HLR/measurement in the owning Worker. Native/hash/JSON/UTF-8/packing/geometry validation stay in Workers. Main receives small metadata, performs O(1) intrinsic buffer checks and holds a disposable derived cache; a Worker consumer validates every record before rendering/export. Existing bounded metadata/model hydration on the main thread remains disclosed and must be measured; this proposal adds no main-thread heavy hashing or geometry loops.

One replay computes all views/dimensions. Queries allocate0 persistent result names but consume actual replay/copy/HLR work. Respect current32-name/100000-triangle/history/source caps and native job deadlines. A full32-name part must be observable if within existing resource limits. Do not raise deadlines/caps speculatively, borrow another build per feature, or call a work budget a WASM-used-memory guarantee.

The qualified native 4MiB JSON cap is INTERNAL only. Its production Worker reads chunks≤64KiB, parses/validates/packs there and transfers at most8192 fragments in786432 value bytes plus32768 tag bytes. It does not authorize a4MiB public JSON command or UI parse. Preserve existing typed projection refusals and terminal ownership/integrity failures.

## State, publication and failure

Drawing definition edits join the existing authored journal with a distinct entry kind and shared branch/redo-tail behavior. Model and drawing edits have one visible chronology; no fake native feature or independent hidden history. Extend full document revision coverage to drawing definitions while keeping the geometry digest's domain honest. Derive cache currentness from existing authoritative documentSignal plus geometry/source/build/definition/presentation bindings; do not add a redundant synchronized generation flag.

A rejected model edit preserves the accepted part and current drawing. A successful model publication immediately makes old drawing data stale. Refresh succeeds only after all owning resources close and final document/currentness checks pass. A valid changed part may have broken drawing references; retain definitions and explicit reasons, publish no invented current dimension value. Last-valid data can remain visibly stale. Complete manufacturing export refuses until broken dimensions are explicitly repaired/removed. Display projection can remain valid while dimension identity is unavailable.

Proposed failure categories retain existing transport/resource/lifetime/build errors and add drawing reference missing/ambiguous/type-changed/source-changed observations. Native projection curve-unsupported/numeric-range/failed remain distinct from part invalidity. Cleanup failure fences later allocation under the existing owner rules. Preserve exact underlying typed failures; never infer codes from freeform error text. Malformed native envelopes and input mutation are terminal integrity failures.

Cancellation before allocation, during actual native work, after native read lease, and before final derived publication need distinct controls. Worker termination revokes its ownership; do not claim native finally executed or immediate OS memory reclamation. Concurrent queries/edits share pipeline serialization. Late responses cannot install cache for replacement documents. A New/Open/account/window change must be guarded at actual dispatch and before publication, including reentrant observers.

## Native persistence

Current native envelope version2 admits project/manufacturing/presentation only; drawing data needs a deliberate compatible adapter/version extension. Continue reading existingv2 unchanged. Older readers must refuse an unsupported drawing-bearing version rather than silently discard definitions. Reuse the existing native Save/Open path and shared validation/hash Workers. Do not introduce another file authority or preempt the separately documented future native.CAD ZIP container decision.

Save definitions and semantic references only. Fresh signed Files Open reconstructs native part, resolves references and recomputes drawing status/values; no cached projection authorizes a measurement. Reopen must preserve a broken reference definition and expose its actual current failure. Existing runtime Undo history is not promised to persist as a stack; saved current definitions must persist correctly.

## Frozen independent acceptance matrix

These are future required controls, all OPEN for shared E22. Reuse exact existing native component receipts only for their qualified scope.

| Case | Independent requirement |
|---|---|
| Initial plate | Actual public primitives→selected region→extrude20→centerD10; three views and seven reference dimensions; top100×50/front100×20/right50×20, centeredcircleR5; hidden projected x45/55 and y20/30 where applicable. |
| Resize and hole edit | Source150×30/depth25/D14; views150×30,150×25,30×25; center75,15; hidden x68/82 and y8/22; volume `(4500−49π)25`; actual dimensions and references follow. |
| Units and scale | Inch labels150/25.4 and30/25.4 with exact canonical model preservation;1:2 paper extent75×15mm; SVG physical sheet mm and actual vector geometry. |
| Lost reference and repair | Discover an actual original connector, apply a valid fillet that loses it, explicitly retarget drawing to the discovered complete treated output, observe unresolved original edge without nearest replacement; undo/redo and explicit repair. Do not rewrite source privately to manufacture this test. |
| Model refusal | Contradictory/unsupported upstream edit retains exact accepted part and drawing binding; no stale-success relabeling. |
| One chronology | Interleave model edit, drawing label/scale/reference edit and creation/removal; normal shared Undo/Redo restores exact definitions, invalidation and valid refreshed facts, including redo-tail replacement. |
| Lifetime/resource | Genuine held solve/native projection plus cancel/New/Open/Close/account invalidation; no derived publication, accepted state exact, cleanup established; full32-name read if within caps. |
| Save/Open | Normal signed My files Save/server sync/fresh Files Open; recomputed views/dimensions and exact semantic definitions, reedit after reopen; broken-ref save/reopen remains explicit. |
| Human and agent | Same registered services exercised by actual human Drawing pane and agent, no private model writer or fake canvas; actual SVG Blob export independently checked. |
| Bracket | Second genuine source-bound bracket with known orthogonal extents/hole measurement; upstream edit, lost-reference, mixed-history and native persistence controls. |

If public source curve deletion/reordering or a needed reference-selection command is unavailable, report that exact dependency as OPEN. Do not convert a required positive case into an unsupported-case pass, or claim coordinate/source injection is public coverage.

## Minimal implementation split, pending root approval

1. Worker witness slice: bounded authenticated centered-hole cylinder/cap/source datum observations and genuine native ancestry tests; existing projection/analytic facts reused. No new geometry engine.
2. Shared read/model slice: new bounded definition validator, drawing command service and private ledger observer extending the existing read pipeline; one replay, small metadata and transferable derived cache. Root coordinates common ownership.
3. Persistence/history slice: deliberate native adapter/version support, validation/hash domain and existing authored journal integration. No separate CAD document or Undo model.
4. Desktop slice: transport bridge and thin human Drawing pane calling the same services, Worker SVG export, actual signed acceptance above.

This contract changes no production source, native cohort, default engine, service, hosting, Files implementation or networking. All shared E22 completion claims remain OPEN until the actual end-to-end acceptance passes.

## Inspected entrypoints

- `web/app/cad/craft/craftBundle.ts`: `evaluateWorkerSolidRead`, `evaluatePipeline`, serialized pipeline/currentness and ID context restoration.
- `web/app/cad/craft/workerStepExportCommands.ts`: complete-part captured-source read admission and Blob publication.
- `web/app/cad/projectManager/projectManagerBundle.ts`: `inspectDocumentRevision`; `projectEnvelope.mjs` in that directory: native envelope admission; `displayUnits.mjs`: canonical versus presentation units.
- `web/app/sketcher/headless/closedSketchInspection.ts`, `drivingDimensionTarget.mjs`, `modules/engine/extrusion/selectedRegionDescriptor.mjs`: actual solved identities versus ephemeral locators.
- `modules/engine/mount/prismSelectionIndex.mjs`, `selectionLineageIndex.mjs`, `booleanSelectionClaims.mjs`: authored keys, private resolver and real ancestry loss/merge semantics.
- `modules/engine/mount/oci-verified-worker.js`: `createOwnedProfileResult`, `cutOwnedBoreTools`, actual constructor/B-side history before transient tool release.
- `test/linked-part-drawing-plan/`, `test/owned-orthographic-worker/`, `docs/CAD1-ACTIVE-SCOPE.md`; Desktop `docs/CAD-ENGINE-GATE-1.md`.
