# Worker prism: minimum consumer gates before craft publication

Audit of integrated CAD `efb96770` (projection included as `d6f7dfb0`). This is
a source inspection and integration proposal, not evidence that the worker
prism is in history or that a gate exists. One bounded target is an authored
XY rectangle, selected region, positive one-sided OCC extrusion, and editing
that *original* rectangle followed by regeneration, undo and native save/reopen.
Keep the legacy in-page OCC and Native Mesh paths available for their own
qualified capabilities. Never infer compatibility from the fact that all three
can produce an `MBrepShell`.

## Existing dispatch and ownership

`modules/workbenches/modeler/features/extrude/extrude.operation.ts` currently
uses `ctx.occService`, `sketchToFaces`, the in-page `oci.prism`, and
`FromSketchProductionAnalyzer`. It resolves the face, selected regions,
`bodyPolicy`, direction, and optional Boolean via its ordinary schema; nothing
currently invokes the worker mount/projector. Native Mesh source faces are
explicitly refused. The worker path must be an explicit supported option in
this same authored EXTRUDE operation, with absent option retaining the old
interpretation. For the first slice require exactly one qualified rectangle,
`bodyPolicy:'separate'`, supported XY frame/positive direction, one-sided finite
length, and Boolean `NONE`; refuse other combinations before any OCC work.
No BOX substitution, implicit engine conversion or guessed region.

`craftBundle.ts` now creates private `engineEvaluation` resources for each
candidate and replays through an evaluation-only registry. Its owner has
`signal`, `requireCurrent()` and lazy `getOrCreateMount(key, synchronousFactory)`;
`seal`/`accept` accompany the existing atomic publication, and the pool retains
accepted/last-complete/candidate owners within its per-document limits. Use that
owner for the worker mount; check candidate state, document/service generation,
storage/expression/history and host lifetime plus `mount.assertPortableBinding`
after every await and before publication. After commit, the owner is accepted,
so `requireCurrent()` is no longer a candidate guard; future consumers need an
explicit accepted-owner/live-binding check. Do not attach raw handles to legacy
`data.externals`; close candidate workers on rejection/cancellation and retain
the last-complete owner on replay failure. Whole-worker close is the qualified
native resource boundary. The new projector's model tag is only metadata; no
existing consumer currently enforces it.

## Required representation gates

1. **Central legacy OCC entry.** `craft/e0/occIO.ts#pushModel` currently returns
   `false` for a model with no `.topology.data.externals.ptr`. Worse,
   `occCommandInterface.ts`'s `OCI` proxy ignores that result, marks the ID as
   pushed, and calls the legacy interpreter by name. A stale or unrelated name
   can therefore be used. Preflight every MObject argument and fail explicitly
   on `root.ext.workerGeometry` before the first legacy command; have the proxy
   honor push failure and mark names pushed only after successful push. Preserve
   normal qualified in-page OCC behavior and Native Mesh's existing explicit
   rejection. Do not treat a worker handle as a pointer or shape name.
2. **Default/all-target Booleans.** `craft/e0/OCCUtils.ts#applyBooleanModifier`
   maps targets through `pushModel` and filters out false returns, but later
   marks all original targets consumed. If an explicit or implicit all-shell
   target is worker-owned, reject the whole request *before* `bclear*`, tool
   creation, analyzer construction or state mutation. Do not omit that body and
   continue against remaining targets. `patternCutLinear/checkedCut.ts` and
   pattern capture must likewise reject unsupported worker target/seed before
   their copy/Boolean commands. Check `production/classifier.ts` and
   `FromMObjectProductionAnalyzer`: they dereference native pointers directly,
   outside the OCI proxy, and must not be entered with worker objects.
3. **Fillet/chamfer and other OCC features.** `features/fillet/fillet.operation.ts`
   presently rejects Native Mesh only, expands face selections to edges, creates
   a pointer-based analyzer and calls `oci.blend`/`oci.chamf`. Reject a worker
   face/edge at entry, before analyzer/command. Audit operations that invoke
   `occ.io.pushModel`, `OCI`, classifier, `readBrep` or `.externals.ptr`
   (including whole-body transforms/patterns, push/pull, defeature and sketch
   Boolean targets). A shared capability predicate can provide defense in depth,
   but a central command guard alone is insufficient for pointer consumers.
4. **Native mesh operations.** `nativeMesh.ts#requireNativeMesh` requires
   `__meshWithOrigins` for the explicit native Boolean and correctly does not
   identify the worker shell as Native Mesh. The broader
   `nativeOperationService.ts#applyBooleanModifier` filters by `MBrepShell`
   before attempting mesh extraction. Preflight all explicit/default operands
   by their actual representation, rejecting mixed worker/OCC/native operands
   before any Manifold work or partial consumption. Do not reinterpret the
   worker's display tessellation as authoritative manifold input.
5. **Transient selection and history references.** The projector tags four
   connector edges and eight vertices transient, but `cadRegistryBundle.ts`
   indexes *every* traversed MObject and `EntityType.resolve` resolves IDs by
   `cadRegistry.find` without checking durability or capture predicates.
   `initializeBySchema.ts` also copies preselected entity IDs into parameters.
   Keep transient entities inspectable if wanted, but reject them at both
   preselection/command submission and schema-aware resolution/replay before
   a durable operation request can be accepted. The same check must run for
   imported native history; do not trust a UI-only selector. Faces and eight
   supported perimeter edges use feature/region/segment semantic IDs; collision
   checks remain required against the full candidate registry. `EntityList.jsx`
   currently lists any non-native `brepShell` as an OCC body: distinguish the
   worker representation and do not offer it to a legacy-only chooser.
6. **Sketching on generated faces.** `sketcherBundle.ts#sketchFace` enters the
   editor for any face. `sketchBoundaries.js#getSketchBoundaries` iterates all
   BREP edges and can include the worker's transient connector IDs in a side
   sketch. For the first edit/undo slice allow editing the original authored
   plane/sketch, but reject generated-face sketch entry, reassign, and boundary
   persistence for worker faces until face basis, side boundary and connector
   identities are qualified. Avoid unsupported analytic transform/split paths.
   The original sketch's supported Worker solve/replay remains independent.
7. **Save/reopen and size.** `projectBundle.ts#save` writes authored history,
   expressions and counters; `projectManagerBundle.ts#snapshotCurrentProject`
   blocks save while processing, editing or pipeline failure. Restore validates
   known operation types then replays; its sketch ID bound is 1024 characters.
   It does not itself validate every operation parameter against its schema
   before staging. Ensure the new versioned execution parameter and authored
   IDs are strictly validated on restore and replay; reject unsupported values
   and transient references without partial publication. Never persist mount
   IDs, worker handles, local topology IDs, pointers or descriptors. Projected
   durable face IDs encode a full region that currently can be up to 8192 chars;
   reject IDs exceeding native sketch/reference bounds before publication, or
   separately qualify an injective compact encoding/format change. Do not
   truncate. `sketchFace2D` embeds face IDs in a URL fragment; generated-face
   entry requires independent escaping/roundtrip tests.
8. **Export paths.** `exportBundle.js#stlAscii` exports view geometry; it is not
   an authoritative quality-controlled worker mesh. Refuse STL for a selection
   containing worker geometry until a revision-bound export is qualified; image
   screenshots are a separate visual action. `projectManagerBundle.ts#exportCore3mfResearch`
   and `manufacturingTo3mf.mjs` currently support specific Native Mesh boxes and
   enclosures (`nativeBoxFor3mf`, `nativeEnclosureFor3mf`), not this worker
   prism. Fail explicitly before dispatching those adapters; never emit a
   partial multi-body file. Source search found STEP import
   (`importModel.operation.ts`/`interact.js#importStepFile`) and a BREP export
   action that currently throws unimplemented; it did not find a functioning
   STEP export route. Keep BREP/STEP unsupported rather than claiming an export
   implementation or blocking unrelated STEP import.

## Integration sequence and independent rejection tests

* First land capability and transient-reference gates independently of the
  worker EXTRUDE. In an isolated real browser, place a tagged worker model next
  to legitimate legacy OCC and Native Mesh models. Exercise explicit and
  default/all-target Boolean, fillet/chamfer, pattern, classifier, direct OCI
  MObject argument, native Boolean, generated-face sketch/reassign, STL and
  3MF. Assert a typed useful failure **before any kernel call**, identical
  accepted models/history/registry and no dropped targets; run matching legacy
  OCC and native operations as positive controls. Verify screenshots and
  non-mutating inspection still work where intended. For the proxy, explicitly
  inject `pushModel === false` and ensure no name is cached or `CallCommand`
  invoked. Check all methods, not only the normal wizard.
* Try connector/vertex IDs via actual selection, preselection, host command,
  direct schema request and malicious/reopened native history; none may become
  a durable reference. Authored face/perimeter IDs must remain resolvable in the
  supported path. Test duplicate/colliding registry IDs and long/escaped source
  IDs; rejected commands do not change history or accepted geometry.
* Then implement the explicit worker EXTRUDE branch using the existing owner,
  source sketch bytes/digest/region and semantic Worker. Verify real
  100×50→150×30 edits, independent geometry and 6+8 supported role IDs,
  undo/redo, retained accepted/last-complete owner after an impossible edit,
  valid repair and origin-account/window abort. Hold actual solver, mount and
  semantic replies during edit, reset, identical-reopen ABA and stale host
  state; ensure no stale publication and no premature accepted-worker close.
* Native save/reopen must restore the same execution selection and rebuild from
  authored sketch/history, with semantic IDs stable after regeneration and no
  runtime IDs in the document. Exercise actual signed My files CAS, dirty-state,
  failed-save reconciliation and a second account. No claim about BRepCheck,
  3MF, full CAD feature coverage or generalized kernel interoperability follows
  from this bounded first prism.
