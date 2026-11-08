# E22 R4: candidate refusal and drawing inspection revisions

Source/evidence inspection only. Original receipt remains unchanged at
`/tmp/codi-acad-drawing-reference-repair-20261108-r4/receipt.json` pending root's
canonical evidence freeze. Producing Core
`baf95ccae09b915f1038286e01a674fb3a7fa6f2`, Desktop
`78cc1694eca1a88623f33e7ff748673c909a6017`. No test, build, browser, Native
execution, driver change, normalization change or product repair was performed.

The actual impossible centered-hole request refuses with
`EngineContractError/HOLE_OUTSIDE_PROFILE`, `committed:false`,
`possiblyCommitted:false`. Its captured before/after state has exactly SIX
scalar differences. A recursive comparison found no other value, type, key or
array-length difference:

| Path | Before | After |
| --- | --- | --- |
| lifecycle.epoch | 8 | 9 |
| capture.solids.revision | 5db10502-8c6b-4979-abff-7ce1db01eebf | a02b4b26-b0b8-419f-b196-4351b8d1dd8c |
| drawing.geometryRevision | same before solids token | same after solids token |
| host.revision | be4dd233-9eff-4f38-9a0b-41a43eb8d3fe | 4038c07f-2ded-4b23-aed8-5c2495f02b5b |
| drawing.revision | same before host token | same after host token |
| capture.journal.revision | 1:10:be4dd233-9eff-4f38-9a0b-41a43eb8d3fe | 1:10:4038c07f-2ded-4b23-aed8-5c2495f02b5b |

In particular, complete captured native history, raw source/sketch inventory,
expressions, counters, presentation and material revision are equal. The drawing
definition and all its fields, inspected Native body/output records and metrics,
host documentToken/path/dirty/history inventory, manufacturing value, source
versions, generation/namespace/pointer, journal targets/readiness and ownership
snapshot are equal. This describes captured serialized evidence, not an
unrecorded object-identity or memory claim.

Before AND after: feature counter5, processing false, candidates0, accepted0,
mounts0, owners1, detached1, cleanupFailed false. Pipeline/cleanup failure flags
remain false. Journal `canUndo:true`, `canRedo:false`, same sketch-bytes Undo
target, no Redo target. The journal's generation/revision prefix remains `1:10`.

## Source provenance

`rectangleCreation.ts:86–95` memoizes its opaque inspection token over exact
services, document generation/signal, sketch namespace revision, Craft's
`evaluationEpoch` and tracked stream identities/revisions. Therefore even a
failed candidate can invalidate this token while accepted source stays exact.

`workerSolidCommands.ts:33` returns that same base revision for solids discovery.
The modification pipeline increments `evaluationEpoch` at request intake
(`craftBundle.ts:1878`). A failed guarded command with its callbacks settles the
error and returns instead of publishing failed requested history
(`craftBundle.ts:2016–2044`); cleanup completes through the same finally path.

`projectManagerBundle.ts:184–192` memoizes `inspectDocumentRevision()` over the
rectangle inspection revision, material/surface revision, presentation counter
and PRIVATE drawing-definition counter. This is deliberately a document-wide
currentness token. `inspectLinkedPartDrawing()` returns that document token as
its public `revision` and the current solids token as `geometryRevision`
(`projectManagerBundle.ts:434–438`). The public drawing revision is NOT the
private `drawingRevision` counter. It cannot be used alone to infer definition
mutation. `inspectAuthoredEdits()` includes the document token in its composite
revision (`craftBundle.ts:857–860`), explaining the unchanged `1:10` prefix with
a changed document suffix. Desktop `inspect` returns the same manager token.

This makes the observed token changes legitimate currentness invalidation for
this failed candidate. No source-confirmed accepted-state or drawing-definition
mutation is indicated by R4. This is not a complete workflow qualification.

## Precise comparison contract proposed for root review

Keep the existing refusal code and uncommitted assertions. Do not remove every
revision indiscriminately. Classify the two types of refusal explicitly:

* A pre-candidate stale-definition or malformed-scale refusal must leave the
  complete state, epoch and ALL tokens exact. In this actual receipt both prior
  refusals have epoch8→8 and exact drawing tokens; no exception is needed.
* For this one actual single candidate failure, require epoch to advance by
  exactly one in the isolated serialized workflow. Validate the token relations
  BEFORE projecting away any field: host.revision equals drawing.revision in
  each state; solids.revision equals drawing.geometryRevision in each state;
  both currentness tokens differ from their respective before values. Require
  the journal composite to differ ONLY by replacing its exact old document-token
  suffix with the exact new document-token suffix, preserving the complete
  generation/journal-revision prefix. This is a source-bound assertion about the
  current test serialization, not permission for public callers to interpret an
  opaque journal token as authority.
* Require nonempty bounded tokens and the SAME host.documentToken (document
  identity/lifetime), generation, namespace, pointer, source-version inventory,
  source, full drawing definition, history, counters, metrics, material,
  presentation, file state, J travel targets/readiness and resource snapshot.
  After the six explicit relations, compare ALL remaining state exactly.
* Subsequent operations must use the newly inspected revisions; retaining the
  old token would contradict the existing stale/currentness contract. A fresh
  repeated passive inspection should retain the post-refusal token relationships
  once no intervening state/epoch changes. Do not silently recapture an old
  operation's request token or weaken its expected-document-token guard.

The raw R4 failure remains preserved. The existing driver currently removes
four other inspection revision paths before comparison but retains
`drawing.revision`; that remaining document-token alias is the only residual
normalized difference. The coherent correction is the explicit linked-token
and exact accepted-state contract above, not changing geometry, tolerances,
refusal codes or silently ignoring a real drawing edit.
