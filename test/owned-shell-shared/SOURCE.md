# Shared authored shell source handoff

Source-only implementation from Core `25f69abfc`. No per-step tests, TypeScript,
builds or browser runs were launched. Native source/runtime and Worker transport
belong to the separate shell lane; no geometry qualification is claimed here.

## Authored contract

`captureOwnedShellFeature` captures exactly ten own data fields:

```
{version:1,unit:'millimeter',engine:'occ',engineRevision,featureId,
 target,producerFeatureId,removedFaceIds,thickness,direction:'inward'}
```

The target must equal `solidBodyId(producerFeatureId)`; the new positive safe
feature ID differs from that producer. Select 1–16 unique opaque face IDs, each
at most 16384 characters, in preserved order. Thickness is finite `(0,1e6]` mm.
No native ordinal, handle, solved geometry, cavity recipe or copied native shape
is saved. The recorded backend is explicit; this slice never changes a default.

## Root registration and evaluation wiring

Register `createWorkerShellOperation({evaluate,buildPolicy})` from
`modules/workbenches/modeler/features/workerShell/workerShell.operation.ts`.
Use the same real evaluator injection as selected revolve:

```
evaluate: input => evaluateWorkerSolid({
  ...input, createMount:createCatalogMount, validateMount:validateEngineMount
})
buildPolicy: {requireBuild:requireAvailableShellBuild,historyBuild:genericHistoryBuild}
```

The operation ID is `WORKER_SOLID_SHELL_V1`. It calls the real candidate ledger
with `{owner,kind:'shell',request:<captured intent>,registry,valid,createModel}`.
The ledger must privately authenticate the current producer and selected face
IDs, execute `solid.shell`, capture the actual result's inherited selections,
and return its normal `{model,consumed,publicationCheck}`. Exactly the selected
source body is consumed. Only a measured valid positive single native solid in
the exact recorded runtime can be published. Native work stays in Workers.

Root owns this ledger kind, explicit shell build/capabilities, normal assets,
factory registration, core Craft dispatch and Desktop adapter. The native lane
owns box construction provenance, shell transport and native result ancestry.
On the shell cohort only, box construction must pass the real authored feature
ID internally so the actual MakeBox face roles are bound to that origin.

## Shared command methods

Instantiate `createWorkerShellCommands(ctx,submit,cancelEpoch)` with the existing
shared append/cancellation functions and register its four returned methods:

- `inspectWorkerShells()` returns the current geometry revision, direction and
  bounds, plus current eligible target rows. Each row exposes its genuine
  private-ledger `selections`, eligible `removedFaceIds`, build and whole-history
  native result budget. `unsupported` records explain unavailable targets.
- `createWorkerShell({revision,version:1,unit:'millimeter',engine:'occ',
  engineRevision,bodyId,removedFaceIds,thickness,direction:'inward'}, options)`
  infers the current producer. It admits/detaches input and checks eligibility,
  revision and complete native cost before allocating the new feature ID.
- `inspectWorkerShellHistory()` returns the shared journal revision and captured
  history entries `{index,...savedParameters,canEdit,reason}`.
- `editWorkerShell({revision,index,featureId,thickness},options)` delegates to
  root's `craft.authoredSolidShellOperation`; it has no separate history.

Options are own `{signal?,valid?}` data. Native signal getters/listeners preserve
cancellation even if a signal has own shadow properties. Existing service,
stream, storage, accepted model, runtime, selection and document identities are
captured before submission and checked until publication. A late lifetime loss
after accepted submission preserves committed/unknown semantics.

Discovery initially admits actual planar box-origin face descriptors from the
Worker's version-2 authored selection plan. Contexts are genuine
`{kind:'box',featureId:<origin>,regionId:null}`; no invented sketch region.
Initial `source:'box-construction-history'` and inherited
`source:'kernel-operation-history'` are accepted. Roles X_MIN/X_MAX/Y_MIN/Y_MAX/
Z_MIN/Z_MAX are preserved source-builder identities, not newly inferred current
extreme locations. A caller selects Z_MAX by reading the actual descriptor; it
must not construct the opaque ID. Generated inner walls/rims are not advertised
as named geometry. Unresolved removed/split/merged faces remain unresolved.

## Single journal integration

`AUTHORED_SOLID_KINDS` includes the new operation, charging one native result
through the existing whole-part build/budget policy.
`authoredEditJournal.mjs` exports:

```
captureSolidShellParameters(parameters)
recordSolidShellEdit(state,{document,revision,index,featureId,parameters,after})
planSolidShellTravel(state,{document,revision,direction,index,featureId,parameters})
```

The numeric entry kind is `solid-shell`. The plan returns
`{index,featureId,thickness,next}`. Only thickness changes; target, producer,
backend, direction and exact ordered removed IDs are immutable. Prior current
thickness must equal the relevant entry side. Shared branch truncation,
64-entry/8MiB budgets and eviction are reused. Same-value edits remain a Craft
no-op and must not call record. Creation append capture/travel includes the new
operation and compares/charges its face array exactly. Root's existing serial
Craft edit/travel switch must route this exact kind, replay the complete
candidate history, and install the journal only in normal atomic publication.
No native work occurs inside this metadata-only journal primitive.

## Complete workflow to run after coherent integration

Use the explicit new cohort to author a genuine `100×50×20` box. Inspect actual
face provenance, select its Z_MAX record, and create inward thickness 2. The
independent expected material volume is
`W*D*H-(W-2t)*(D-2t)*(H-t)=20512 mm³`; thickness 3 gives `29688 mm³`, with original
outer bounds. Include native void/material/exterior observations, thickness and
source-dimension edits, invalid/collapse rejection with exact input retention,
healthy continuation, creation and numeric Undo/Redo chronology, native
Save/server equality/fresh Open/reedit, and owner cleanup. Do not substitute a
box Boolean cavity or display-only ray result for the native shell operation.
Arbitrary curved/native shell domains and multiple-removal qualification remain
open beyond this initial complete box workflow.
