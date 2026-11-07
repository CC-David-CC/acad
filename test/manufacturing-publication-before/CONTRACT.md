# Manufacturing A/J/T publication — concrete next slice

CONTRACT/BEFORE CONTROLS ONLY at verified CAD `8b8adfc7b`. No existing production file changes in this branch. This refines `test/shared-document-metadata-journal/CONTRACT.md` / `e32efdcb9` against the integrated journal primitive and actual manager methods. It does not qualify native geometry, actual user-file persistence or shared publication.

Owners: A is ProjectManager's existing manufacturing payload/revision; J is Craft's one authoredJournal; T is Craft's accepted full-tip material/source/history binding. H/models/registry/native owners/counters/evaluation epoch are accepted geometry state and must remain exact during metadata-only commit/travel.

## Frozen source observations and failing requirements

The test runs the full actual `projectManagerBundle.ts` through its existing explicit dependency fixture, with real canonical-hash and project-validation Workers. Exact AST declarations `inspectAuthoredEdits` and `authoredEditTravel` execute unchanged with an accepted-tip/journal/model protocol fixture. Normal production `lstream` factories supply the state/notification streams. The prior geometry travel delegate is a trap, never a fake successful native replay.

At this source:

1. Actual enclosure assignment and role edit install A and advance manager's material token. They leave J and T unchanged; real Craft inspection disables Undo/Redo. The actual travel dispatcher then refuses before any geometry delegate. The required joint-install regression fails.
2. Identical roles produce equal manufacturing data but advance the material/full document token without a journal step. The canonical no-op regression fails.
3. Actual rebind prepares a changed canonical geometry hash and confirmation changes A.revision without recording J/adopting T. This row uses an explicit authored-history change fixture, not a native geometry edit. The shared rebind regression fails.
4. No metadata journal/update notification exists. The required notification regression fails; an after-notification fault test is currently unreachable. A real lifetime guard queuing an observer after hash-owner cleanup instead observes new A with old J/T, before the assignment Promise resolves.

These are manifestations of the same absent manufacturing transaction integration, not four invented native defects. Desired regression assertions remain red. Observational controls also show role-conflict/stale/preaborted refusals preserve A/J/T; hash-reply storage/caller/document reentrancy cannot install the old proposal; generic readonly preparation becomes stale; and the actual native envelope/validation/hash path retains manufacturing definitions through protocol replay. Save/Open of actual Native geometry, signed My files/server sync and fresh actual Craft journal initialization remain OPEN.

The legacy role writer calls snapshotCurrentProject, which writes volatile project storage even on some eventual rejections/no-ops. Receipt snapshots disclose storageRevision separately. A/J/T preservation here is not a claim of all-workspace purity. New publication preparation should reuse the approved pure captureModel/captureCurrentProject(false) path instead.

## Small internal interface

Proposed manager preparation result (private, not public JSON or a caller-supplied setter):

```ts
{ domain:'manufacturing'; key:'manufacturing';
  before:OwnedManufacturing|null; after:OwnedManufacturing|null;
  revision:string; geometryRevision:string; changed:boolean;
  isCurrent():boolean;
  // Private authenticated owner/job/captured-reference evidence, not forgeable
  // public metadata fields and not a permission to commit after replacement.
}
```

Root's current `prepareGenericManufacturingAssignment` already supplies much of this information. Enclosure role assignment and confirmed rebind must prepare through the same transaction boundary, using actual current history/roles/target validation and real canonical hashing. Rebind retains its explicit review token, consumed only by its owning current job; it does not bypass publication. Generic requests retain their own qualified bounds; journal capture must not lower established legacy metadata-v1 limits.

Craft's internal `commitAuthoredManufacturingMetadata(prepared,options)` joins the existing serialized publication ownership, uses the existing journal record/travel logic and returns a small truthful changed/revision result. Public callers cannot inject J, T, model/native handles, revision counters, setters or callbacks. The domain is initially manufacturing only. Drawing record capture remains a pure component capability; drawing publication MUST remain unavailable until the native envelope adapter persists definitions.

## Heavy validation/charging boundary — prerequisite, not an assumption

Do not call the current synchronous `recordDocumentMetadataEdit`/`captureDocumentMetadataRecord`/full travel recapture on the UI for large payloads. The previous real Node Worker8MiB proof establishes Worker capability, not acceptable main-thread latency. Preparation must either run strict metadata validation/equality/charging in a dedicated genuine Worker or reuse authenticated, logically immutable owner-prepared payloads plus a Worker-validated charge. No new full-payload main-thread serialization/hash/deep-freeze/equality loop is authorized.

A concrete minimal split is: keep exact private before/after payload references in the manager; send the bound request to a trusted Worker using the same journal/capture module; receive a small job-bound validation/equality/charge result; retain an operation-scoped private capability tying that result to the exact source references/document/revision. At commit, reuse those owned references and perform only bounded journal-header/≤64-entry bookkeeping. The existing journal module must remain the single source of branch/cursor/budget logic. A narrow authenticated-prepared-entry seam may be needed; approve it explicitly before implementation. Do not accept caller-supplied byteSize or a plain message claiming trusted:true.

Structured cloning does **not** preserve Object.freeze. Do not treat a Worker frozen:true marker as proof that its received tree is immutable. Authenticate reference ownership/alias exclusion and lifetime in the real preparation client; disclose/measure structured-clone/native serialization cost separately. If the owned-reference invariant or receiving boundary is not established, refuse before publication rather than silently moving large loops onto the UI or claiming a new hard memory guarantee. Do not introduce a second persisted metadata model/history owner.

## State table and linearization

| Phase | Allowed action | Required invariant |
|---|---|---|
| Current | Inspect full-tip/domain and capture request | A/J/T unchanged; genuine current complete part; no failed cleanup/restore/rewind/editor. |
| Preparing | Pure project capture, hash Worker, metadata/charge preparation | Exact generation/services/H/sources/models/placements/expressions/surface/domain/J/counters captured; no accepted writes. Hash owner cleanup established before participant ready. |
| Prepared stale/rejected | Discard operation-scoped participant | A/J/T/H/resources exact; no trim/redo-tail change. Intentional New resets only the new document's own state. |
| Prepared equal | Return changed:false | Full/document/material/journal revisions unchanged; no entry or redo loss. Recheck lifetime/revision even for no-op. |
| Joint installation | Install A +next J +next T synchronously | No await, external callback, random allocation, validation/encoding or notification after first write until all three installed. |
| Committed | Notify guarded journal/update and schedule normal save | Mark committed before any observer. Preserve native owner/model/history identity and epoch. |
| Metadata Undo/Redo | Same prepared domain installation plus planned cursor | No Native/solve/model publication. Exact current payload must match expected side. |
| Geometry Undo/Redo | Existing actual geometry transaction | Preserve current replay/admission/resource semantics and one chronology. |

Before installation, invoke any external valid callback, then compare exact captured state again without another external callback. Precompute next material/full-document tokens and their fingerprints, journal record/state, receipt, counter-exhaustion checks and all potentially failing allocations. Do not install A then call a fallible inspector/randomUUID to repair T.

Use the existing StateBatch/no-observer discipline. The manager participant's trusted install and journal batch commit must be jointly preflighted and guaranteed nonthrowing assignments once the first write occurs; otherwise refine that narrow seam first. T adopts the PREPARED next material token only while surface/source/history state is still exact. Do not bless an unrelated surface mutation by copying an arbitrary current token. journalHeadDefinition/signature, fullTipSignature/sketch baseline, accepted resources/models and counters remain exact. Final installation of all A/J/T is the linearization point; only then mark committed and deliver notifications.

## Reentrancy, faults and chronology

Reject before commit: preserve all A/J/T, including redo tail and previous supported geometry Undo. After commit: observer exceptions/lifetime loss/notification machinery errors cannot roll back A or erase J. Standard current emitter observer exceptions are caught/logged; an escaping machinery fault must be reported with original cause and committed:true. A Close/New/Open or second edit in an observer may supersede the receipt, but the old commit remains truthful and must not overwrite/undo newer state. Stop old revision notification delivery under the exact installed-state guard. Old inspected-revision retries cannot apply the entry twice.

The existing journal primitive's exact record is `{kind:'document-metadata',version:1,domain:'manufacturing',key:'manufacturing',before,after,byteSize}`. Charge/evict through the same64-entry/8MiB code; accepted edits truncate only redo tail. Actual travel uses `planDocumentMetadataTravel`, strict current expected payload and full-tip binding, then the same prepared A/J/T installation. Unknown domains/keys, stale hashes/current payloads and forged charge refuse. Metadata cursor travel does not replay Native or advance evaluationEpoch. The next preceding geometry edit remains available because T is adopted with each material travel.

## Save/Open and domain readiness

Manufacturing is the first enabled domain because native envelope v2 already persists it. Save reads one accepted A and the accepted model; it must not race with a half-installed journal. Native Open validates definitions and reconstructs the part, then establishes an empty SESSION journal and authenticated full-tip baseline. It does not restore a historical runtime Undo stack from the saved file. Reedit after Open creates a new material entry and is undoable. The manager envelope/Worker control here does not substitute for the later signed shared Native rebuild/Save/sync/fresh Open proof.

Enable publication/shared-session-Undo readiness only after this real path is wired and qualified. Keep generic manufacturing mesh/3MF unqualified until its own genuine export proof. Keep drawing publication explicitly unavailable until its persistence adapter exists; never store new drawing definitions only in RAM while Save silently omits them.

## Proposed next ownership, requires root approval

- `craftBundle.ts`: internal manufacturing metadata commit/travel, one shared dispatcher and T adoption before notifications; keep geometry paths unchanged.
- `projectManagerBundle.ts`: manager-owned prepared participant and enclosure/generic/rebind routing, preallocated tokens/currentness/save scheduling.
- `authoredEditJournal.mjs`: only the narrow authenticated-prepared-record/travel seam IF needed to avoid large UI recapture; retain one budget/branch implementation and current pure validation path.
- A NEW dedicated metadata preparation Worker/client/build entry if the approved immutable owner preparation cannot supply the necessary Worker-validated charge. Exact transport/source-pinning/receiving ownership proposal must precede these extra file edits.
- NEW integration tests: first-observer A/J/T inspection, actual Undo/Redo with zero metadata Native dispatch, committed observer throw/Close/reentrant second edit, stale/cleanup rejection, legacy enclosure+generic compatibility and signed normal Save/Open/reedit.

No existing production files are owned/edited by the current tests-only task. No deployment, actual account probe, filesystem race/security test, new kernel/default, hosting or networking change occurred.
