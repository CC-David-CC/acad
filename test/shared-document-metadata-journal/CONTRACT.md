# Shared manufacturing and drawing journal integration — contract only

Inspection base CAD `3eecf395e`; additionally inspected exact generic manufacturing preparation commit `5a8ebfd5b` using `git show`. Drawing capture/preparation is the integrated `9766d5ad5` product. This document edits no production files and executes no geometry/browser tests. Root confirmed the existing actual material-assignment/Undo gap; source inspection below explains its mechanism. The proposed integration and regression cases remain OPEN.

## Actual seams and defect

- `projectManagerBundle.ts:assignEnclosureMaterialRoles` captures source/currentness, hashes canonical geometry in its owned hash Worker, establishes Worker cleanup, checks currentness, then assigns `manufacturingMetadata` and increments `manufacturingRevision`. It does not record an authored journal entry or adopt Craft's accepted full-tip material binding. `confirmHostManufacturingRebind` also writes manufacturing metadata directly.
- Craft `inspectAuthoredEdits` requires its `fullTipMaterialSurfaceRevision` to equal manager `inspectMaterialSurfaceRevision`. That manager token includes manufacturingRevision and the surface state revision. Thus the accepted material assignment changes the token while Craft retains the earlier one: prior Undo becomes unavailable. This is a confirmed integration defect, not a reason to discard the previous journal or replay an unchanged native model.
- `5a8ebfd5b:prepareGenericManufacturingAssignment` is deliberately read-only. It captures the canonical current model without `projectService.save`, exact current bodies/producers/placements, metadata, counters, source/history and lifetime; it hashes in a dedicated Worker, checks cleanup/currentness and returns `{revision,geometryRevision,metadata,summary,isCurrent}`. Its returned summary truthfully says publication unavailable and authoredUndo pending. It supplies no setter/commit and is not an implemented fix.
- Craft already owns one `authoredJournal$`, session document generation/revision/cursor, journal-head/full-tip identity and the shared travel dispatcher. `prepareStateBatch` installs state synchronously without observers, then notifies separately. Existing geometry publication commits its journal and adopts full-tip/resource state before notifications. Use this discipline rather than another history owner.
- Standard `Emitter.callObserver` catches/logs individual observer exceptions. Escaping notification machinery errors and observer-triggered lifetime/currentness changes still require explicit committed-outcome handling. Do not misdescribe every ordinary observer exception as an escaping throw.

## Minimal owner split

Manager remains the sole owner of persisted manufacturing metadata and the new authored drawing definitions. Craft remains the sole owner of the session authored journal and accepted full-tip binding. The metadata transaction uses an actual private manager-prepared participant and the existing Craft publication turn. No public caller supplies setters, callbacks, journal states, native outputs, replacement bodies or internal revision counters.

Manufacturing mutations covered by the same path: enclosure role assignment, generic part assignment, and explicit confirmed manufacturing rebind. Drawing mutations: create/replace/remove from the approved definition module. Reset and native restore are document lifecycle boundaries, not fabricated user edits. Existing display-unit operations remain explicitly non-journaled in this slice; they must not be mislabeled as newly undoable or cause metadata changes to disappear.

Do not add a second synchronized document generation, independent journal, feature-list entry for metadata, or metadata-driven native rebuild. Do not republish `modifications$` or `models$` to announce an unchanged model: that would trigger ordinary native evaluation. The existing `authoredJournal$` notification and guarded Craft `update$` can signal a metadata change after full installation; explicitly schedule the normal project save after commit because existing autosave subscribes primarily to modifications$.

## State and invariants

State tuple, using existing owners:

`D` authoritative project service/document generation/signal/host lifetime; `H` owned complete history reference/signature/pointer; `S` source namespace/version fingerprint; `M` accepted models/registry/placements; `R` accepted native resource owners/counters/epoch; `E` expressions/surface/workbench streams; `A` manager manufacturing metadata/revision plus drawing definition/revision; `J` authoredJournal(document,revision,entries,cursor); `T` Craft accepted full-tip source/material/history binding.

Invariants:

1. Every accepted metadata change has exactly one same-session J entry and the corresponding A/T values before any observer can inspect it. A rejection or no-op changes none of A/J/T/H/S/M/R/counters/epoch.
2. Metadata-only change/travel preserves actual owned H, history pointer, journalHeadDefinition/signature, fullTipSignature, fullTipSketchRevision, M and R by identity. It changes only the targeted metadata domain, J, appropriate manager revision/token and Craft's matching material baseline when manufacturing changed.
3. Manufacturing commit adopts the **prepared next** material/surface token only if the original surface service/state/revision and every independent captured input are still exact. It cannot bless an unrelated surface/source edit by simply copying whatever token is current after mutation. Drawing-only commit leaves the material/surface token exact and advances only drawing/full-document revision coverage.
4. Full document inspection covers both domains; geometry digest remains geometry-only. Metadata tokens/counters are monotonic while Undo restores payloads. Do not restore an old token value or confuse a runtime document token with the saved geometry SHA.
5. Budget eviction removes only oldest session entries according to the existing64-entry/8MiB policy. Branching truncates only the redo tail at successful publication. Unchanged/no-op/refused/aborted proposals never trim history.
6. Failed cleanup, failed model, partial restore, active sketch/wizard, rewound history, foreign document, unsupported target or unverified current accepted full tip refuse before metadata mutation. No implicit stale-tip adoption or fallback to a live mutable model.
7. A returned proposal has no authority to commit in another document or after any relevant revision change. Existing already-untracked material changes cannot be turned into invented journal history; require an explicit supported rebuild/reopen baseline if the old tip cannot be authenticated.

## Preparation and internal API proposal

Proposed internal names, subject to root implementation review:

- Manager `prepareDocumentMetadataPublication({domain,expectedBefore,after,expectedRevision,expectedGeometry,...privateCapturedBinding})` creates a private branded/owner-bound participant with prevalidated captured values, preallocated next revision tokens/fingerprints, `isCurrent()`, an installation function containing only trusted nonthrowing assignments, and a small prepared receipt. It is not a public arbitrary callback interface.
- Craft `commitAuthoredDocumentMetadata(preparation,options)` serializes/rechecks against the accepted tip and proposes one journal change. It is reached only from actual manager domain preparation and later shared public services. It does not call evaluatePipeline.
- Existing `authoredEditTravel` branches exact `kind==='document-metadata'` and supported domain **before** creating geometry index/feature arguments. Metadata targets expose `{kind,domain,key}`, not invented index/featureId fields.
- Manager strict domain capture is reused for both initial mutation and travel. Drawing uses `captureLinkedPartDrawingDefinition`/operation record. Manufacturing exposes/reuses the strict own-data metadata capture already in the generic preparation seam, retaining existing valid enclosure metadata rather than silently projecting it onto a narrower fake generic schema.

Manufacturing preparation must finish the actual canonical geometry hash and release its hash Worker before returning a committable participant. Capture the exact accepted H/S/M/E/A/J/T/services/counters and owner generation around asynchronous work. Validate expected full document revision, canonical hash, actual current target/producer membership, references, native currentness, own-data payload and budget. Recheck after every await. Caller `valid()` and cancellation callbacks may reenter; after the final external lifetime callback, perform pure exact state comparisons again. No external callback follows these final checks until commit is fully installed.

Drawing metadata admission alone cannot prove Native references. Definition-only authoring may retain explicitly unresolved references, but it must not advertise measured/current drawing success. The future witness/read service supplies that separate status. Do not execute HLR/native classification to perform a label-only or definition-only journal travel.

### Linearization turn

Allocate/capture/hash/validate/budget and prepare receipt/tokens before this turn. The final turn has no await, user callback, getters into caller data, serialization, hash, random-token allocation, schema validation or Native work:

1. Recheck caller/document lifetime, then compare exact captured service/history/source/model/metadata/journal/stream versions and all participant identities. Verify both journal StateBatch and manager participant are still prepared/current and revision counters can advance.
2. Install the prevalidated manager domain payload and its prepared tokens/counters via trusted closed-owner assignments; install the prepared J batch; adopt the exact new full-tip material binding for manufacturing (or preserve it for drawings). H/signatures/source baseline/resources remain unchanged. These installations must be guaranteed not to throw after joint preflight under the existing trusted StateStream contract; preflight every possible exhaustion/allocation before the first write. A generic callback-based multi-participant framework is not required.
3. Mark the operation committed only after **all** A/J/T installations. This completed synchronous installation is the linearization point, before any observer/public callback. No observer can see new metadata with the old journal or stale full-tip token.
4. Notify journal/update observers under an exact committed-document/installed-revision guard and schedule the normal save. Reentrant newer publication stops delivery of the superseded event; do not mutate a replacement document in cleanup. Final receipt/currentness check follows notification.

If implementation cannot guarantee step2's no-failure property with the existing batch/closure seam, stop and refine that narrow seam before coding a rollback that exposes intermediate state. Do not commit metadata first and then call a fallible public `inspect...`/randomUUID operation to discover the next token or repair Undo afterward.

### Notification outcomes

Precommit failure returns uncommitted refusal with exact original state. Standard observer exceptions that are swallowed/logged remain observations of an already committed undoable transaction; they do not trigger rollback. An escaping notification/save-scheduling failure returns a truthful committed failure with original cause, not committed:false; proposed diagnostic classification can be finalized with root. A synchronous observer Close/New/Open/account loss or superseding edit returns an appropriate refusal with `committed:true`, retaining the accepted entry in its owning document. Reopening a new document intentionally establishes a new journal, not a rollback of the old commit. Never undo or erase a newer reentrant edit while handling the old command's failure. Retrying the old inspected revision must not apply the entry again.

## One shared record, branch and travel

```ts
{kind:'document-metadata',version:1,domain:'manufacturing'|'linked-part-drawing',
 key:string,before:DomainPayload|null,after:DomainPayload|null,byteSize:number}
```

Manufacturing key is the exact fixed `'manufacturing'`, with complete accepted metadata snapshots, not a list of UI assignments inferred during Undo. Drawing key is its immutable drawingId. Exact domain admission selects the validator; unknown domains/kinds refuse. No optional hidden fields or successful no-op entries. Root's integrated drawing record helper already handles its own domain; do not weaken it to accept unrelated payloads.

For canonical admitted record JSON excluding byteSize, charge `max(UTF8.byteLength,2*text.length)`. Count this entry's actual charge in BOTH bounded() accumulation and eviction subtraction, replacing the old generic256-byte fallback for this new kind. Preserve all existing geometry-kind budgets. Drawing per-entry limit262144 remains; generic manufacturing retains its qualified262144-byte preparation cap. Existing supported enclosure snapshots use their established capture bounds and the shared8MiB journal ceiling; do not introduce a lower global metadata cap without a measured compatibility decision. Reject budget failure before changing metadata, rather than accepting a non-undoable assignment.

Record after successful preparation using existing document/revision checks and redo-tail truncation. For travel, verify expected entry/domain/key/document/current J revision and current domain payload equals exact expected after (Undo) or before (Redo), plus current full-tip/geometry binding. Strictly recapture the desired domain payload; use existing actual history/target metadata validation. If a runtime geometry hash must be recalculated for stale evidence, use the hash Worker; do not replay Native solely for metadata. Ideally reuse the authenticated accepted geometry hash/witness from preparation without a new synchronized hash cache.

Undo/Redo is the same prepared A/J/T commit with only cursor/revision change; no fresh entry, native allocation, model publication, source rewrite, feature counter allocation or evaluationEpoch advance. Rebind the material token to the newly installed manufacturing state so the next preceding geometry entry remains available. A previous geometry entry goes through the unchanged existing full candidate replay/publication path. Existing material stale/review and drawing broken-reference semantics remain explicit after genuine geometry edits; do not rewrite metadata revisions/references by assumption. LIFO ordering must be preserved across geometry→materials→drawing→geometry and its exact inverse.

## Transition table

| Event/state | Allowed next state | Required effect |
|---|---|---|
| Idle/current → preparation | Preparing | Capture exact inputs; no accepted mutation. Concurrent metadata jobs may prepare but only one matching revision commits. |
| Hash/capture/lifetime/owner cleanup fails | Rejected → Idle/fenced as existing policy | Old A/J/T/H/S/M/R exact; no notification or journal trim. |
| Prepared canonical equal payload | No-op → Idle | No revision advance, no record, no redo-tail loss; still recheck lifetime/revision. |
| Prepared/current validated change | Committed | Joint A/J/T installation before observer delivery; preserve current native owners. |
| Prepared job loses race to metadata/geometry/reset | Rejected | No install into newer generation; queue bookkeeping released. |
| Committed + ordinary observer exception | Committed/undoable | Existing exception logging; no rollback. |
| Committed + escaping notify/lifetime fault | Committed refusal | Entry/payload retained in owning document; exact cause and committed:true. |
| Undo/Redo metadata entry | Committed travel | Domain payload+cursor+tokens+tip adoption only; Native0 dispatch. |
| Undo/Redo geometry entry | Existing geometry transaction | Actual replay/evaluation/cleanup/publication unchanged. |
| New/Open/restore/reset | New session baseline | Saved definitions restored; old session entries not transplanted. Stale continuations cannot clear/adopt newer state. |

## Persistence and domain flags

Normal Save captures current manufacturing metadata and drawing definitions from their one owner. Existing manufacturing native envelope remains unchanged in meaning. Drawing-bearing envelope needs the separately approved compatible version/adapter and must refuse unsupported older readers; no parallel file truth. Save does not serialize the runtime authored journal/cursor. Fresh Open reconstructs the part, restores validated current definitions, authenticates the accepted full-tip baseline, then starts an empty supported session journal. Reedit creates a new entry and is undoable; pre-save historical Undo is not promised.

Do not expose `publication:'shared-metadata-transaction-v1'` or `authoredUndo:'shared-session-journal-v1'` until that domain is actually wired/tested. Generic preparation's current unavailable/pending flags remain truthful meanwhile. Material assignment success does not qualify generic manufacturing mesh/3MF; drawing metadata success does not qualify native measurement/projection UI/E22. Preserve domain-specific limits and actual completeness/refusal reasons. Existing legacy APIs returning Promise<void> can retain compatible return shape, but their mutation must still route the shared commit; new public receipts may add truthful changed/revision/committed information through coordinated adapters.

## Proposed production ownership, only after approval

Smallest integration set:

1. `web/app/cad/craft/authoredEditJournal.mjs`: exact domain record/travel, budget charge/eviction and target description helpers; no new stack.
2. `web/app/cad/craft/craftBundle.ts`: private metadata commit/travel, shared exact-kind dispatch and accepted-tip adoption/notification ordering; retain geometry replay.
3. `web/app/cad/projectManager/projectManagerBundle.ts`: owner-bound prepared install/tokens, enclosure/generic/rebind routing, drawing domain owner/reset/revision coverage and lifecycle methods; no unguarded setter.
4. `web/app/cad/projectManager/genericManufacturingAssignment.mjs` plus declaration: expose/reuse its strict detached metadata capture for the manufacturing journal domain, coordinate with Gate's5a8 work instead of duplicating or overwriting it.
5. NEW `test/shared-document-metadata-journal/`: synthetic journal/fault controls and later actual shared manager/Craft integration harness.

Native envelope/drawing persistence and public material/drawing facades/host human controls are separately coordinated followups, not silently added to this set. A narrow ProjectManager/CraftService interface extension belongs with its current defining file; any additional existing production file needs explicit ownership coordination. Do not change stateBatch/emitter/global framework unless a concrete regression proves the existing primitive insufficient.

## Required regression/integration plan

All rows OPEN; metadata doubles clearly labeled. Source-code assertions alone cannot close publication/Undo coverage.

1. Retain actual before case: genuine authored box/profile edits yield available Undo; actual existing material assignment makes prior Undo unavailable. After fix, same actual path creates a metadata undoTarget, Undo removes/restores exact material definitions, then prior geometry Undo works. Reapply/Redo both in order. No native replay for material steps; instrument actual Worker allocation/messages and accepted resource identities.
2. Both domains: synthetic exact capture/no-op/null/create/replace/remove, before/after conflict, unknown domain/key, forged charge,64-entry/8MiB trim at mixed domain boundaries, redo-tail branch and revision exhaustion. Exercise actual shared dispatcher, not a stand-in stack.
3. Actual manager/Craft publication observer inspects metadata, J cursor/target/full-tip flag and model/resource/counter identities in its FIRST callback: all installed consistently. Explicitly prove top-level prior canUndo remains true when the new entry is present.
4. Actual hash Worker failure, cleanup termination failure, abort, stale source/model/placement/expressions/surface/domain, reentrant final valid callback and queued successor: no commit, old state exact. Separate injected cleanup faults from genuine browser incidents.
5. Synchronous observer throw (normal emitter handling), separately injected escaping notify failure, queued caller-valid=false, Close/New/Open, and observer-triggered second metadata commit: committed outcome truthful, no rollback, latest state intact, no duplicate retry. Original journal entry remains undoable when the document remains current.
6. Interleave geometry append/depth edit, manufacturing assign/rebind, drawing create/replace/remove and unit presentation; Undo/Redo exact user chronology for supported journaled domains. Geometry steps use real replay; metadata steps must have0 Native/solve jobs and unchanged native owners/epoch/models.
7. Wrong-domain current payload, stale manufacturing geometry hash/targets and vanished drawing target: explicit refusal or broken-reference definition per domain, never current measured success. No implicit whole-part/backend conversion.
8. Actual signed normal Save/server sync/fresh Files Open/reedit with definitions restored and empty session journal, foreign/stale document fences, retained legacy enclosure assignments and existing supported geometry journal families. Drawings require the deliberate adapter before claiming this row complete.

No Native geometry algorithm, new kernel, default build, hosting, filesystem-race or relay change is part of this proposal.
