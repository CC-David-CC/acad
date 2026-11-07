# Closed saved-sketch publication: independent source audit

Source `49512bb81fa1de842a704678467fb4ed902cb357`. Read-only review, no product edits or runtime tests. Existing Files evidence remains accepted; no Files reaudit or UI/cache bypass.

## Concrete reuse limits

| Finding | Source | Required treatment |
| --- | --- | --- |
| Generic sketch travel is rectangle-only | rectangleEditing.ts:40–51,139–142; craftBundle.ts:524,551–557,812–817 | The sole private travel preparer permits only two driving lengths/coordinates. Adding LengthRelation changes constraints and refuses even for a small rectangle. General sketch-byte undo needs exact Worker replay; do not weaken the old rectangle invariant. |
| Journal is narrower than core | authoredEditJournal.mjs:3,83–93 | Each before/after caps at 64 KiB code units and UTF-8, versus 1 MiB core/override support and the known 139,364-byte constrained case. Make journal policy compatible or refuse before publication; retain conservative UTF-16/UTF-8 charging, 64 entries and 8 MiB aggregate. |
| Unconsumed Save is not general publication | unconsumedSketchSave.mjs:12–28,40–50; craftBundle.ts:780–804 | Explicit ancestry allowlist proves no target consumer; unknown schemas refuse. Success clears incompatible RAM journal without dependency replay. A null guard is not permission for direct general writes, consumed-sketch acceptance or authored Undo claims. |
| Saved boundary is not live parent authority | headless/sketchTransition.ts:replaySketchTransition; sketch/dependentSketchSolve.js:6–21,38–47 | Pure replay checks saved boundary against itself. Preserve current originating face/frame/reference provenance during model replay; refuse unavailable/ambiguous references. |

These are limits of reusing old paths, not evidence that an already-published new seam corrupts data. Root is addressing generic travel/journal capacity separately; changes need their own source/runtime qualification.

## Reviewed source follow-ups

`a42a81c8944309b41a8383f9802e2e7d0a47ba7a` raises the journal source cap to 1 MiB while retaining 64 entries/8 MiB aggregate. `467a145c1a620b36dcf8160287a9b449b5a3990d` adds source-frame coverage: unique descriptor IDs cover override IDs, finite frame triples are detached/frozen, every appearance must be the actual private-registry MOpenFaceShell/defaultSketchId at one originating PLANE index with matching frame/empty actual boundary, and all descriptors must be observed before sealing. The check runs after each registry update before the next operation. No blocker found in that frame hook itself. Its caller must still bind the descriptor to the same override metadata and prove saved boundary empty; actual-plane checks alone do not authenticate arbitrary supplied source bytes.

Coordinator `9267d94ed582bda5891ed12665542a47506f39be` and root wiring `9b88a776698c65d6a2a3a0abde405b94f4f0e37d` address the generic travel path. Public requests contain IDs/revisions/numeric relation intent; native bytes/preparation stay private. Source inspection verifies saved frame and empty boundary before LengthRelation; the pure transition preserves those metadata fields. The strict ancestry allowlist rejects unknown/implicit consumers, and consumed targets require a unique recorded Worker rectangle extrusion. Travel inspects both endpoint frames and exact-replays target bytes before the same model pipeline. These are source findings, not actual app/history/Save qualification.

**Retained source ownership finding at 9b88:** captureJob.start keeps captured.signature but discards captured.history; submitPreparedReplay still clones only the history array (`[...previous.history]`). Candidate operation records therefore alias accepted mutable records during asynchronous replay. `prepared-history-alias.cjs` executes the exact source method: a 20→30→20 depth mutation changes its prepared replay input to 30 transiently while final signature returns unchanged. Receipt/bodySHA in prepared-history-alias-before.json. This proves input aliasing, not an actual evaluated/published wrong model. A transient mutation between operation reads and final signature comparison could evade the present fence. Use a private detached history snapshot bound to the accepted signature for evaluation; do not rely only on later equality of mutable originals. Root was notified before qualification.

## Inspection transport evidence

The exact a42/467 client passes 29 directed controls in actual Chromium/Web Locks with 24 explicitly labeled Worker doubles, all terminated once. Tests cover queued immutable capture/options, source/epoch ABA, active/queued cancellation, sparse/malformed/bounded discovery data, frozen output, a valid callback synchronously aborting its signal, and slot reuse after refusal. Injected zero-delay validation holds prove the two-slot budget remains occupied after Workers finish, plus validation-phase cancellation/deadline refusal. Source/value ABA uses a controlled monotonic epoch, not an actual app/storage mutation. Getter refusal invokes no getter or Worker. Receipt inspection-receipt.json; no solver/model publication proof.

A separate bounded guard-cost control found timeout classification loss: the a42 guard includes current()'s deadline inside the shared client's boolean valid callback; a deadline can become false/currentness and then AbortError despite an un-aborted signal. Exact before receipt inspection-deadline-guard-before.json: 40 ms controlled second-guard cost against 20 ms timeout, AbortError, 0 Workers. Root `b6d1760308de9d409ff73384b50e972c721bc9cd` separates lifetime from deadline in that callback. Exact after receipt returns Error/Sketch inspection timed out, signal still live, 1 owned double terminated. The same 29 general controls pass again on b6. This is injected callback cost, not a portable latency bound; no actual solver response participates.

Private client-only webpack outputs: old c4497de7a8dda9078a718c52abcc1c9f88472d8a62704d42b37415fd8ec3f184; fixed 5a5ca79a8908ea38c76155cc4e9b33937b6f0ca298bf186c9f8e6c1d3d7b84a8. The harness hashes one Node Buffer and serves that same Buffer through same-origin CDP Fetch under unchanged strict CSP, independent of later file writes. Runtime handles/pins are in receipts; contexts close and fixtures remain running. Only tiny test wrappers were built; no app/kernel build or service change.

## Reusable invariants

- PreparedSketchCommand remains private (rectangleCreation.ts:11–20). Public commands take IDs/intent/revision, not preparations, raw successful Worker results or publication callbacks.
- rectangleEditing.ts:81–128 captures services/streams, document generation/namespace, key bytes and namespace version fingerprint, history/pointer, parameter table and values. Recheck after each await and callback, then before prepared writes. sketchRevision.mjs binds key membership/monotonic versions, catching same-byte storage ABA without hashing all source.
- craftBundle.ts:305–343 binds journal proposal to exact current key/version, namespace, journal, history signature and material/surface revision. It proposes the cursor; it does not advance it before successful replay.
- candidateSketchStorage.mjs is a read-only detached override. craftBundle.ts:858–900 rebuilds from feature 0 with a private registry/resource owner; accepted models are not mutable candidate inputs. Reuse this dependency pipeline.
- craftBundle.ts:1004–1036 preflights workspace and model/history/journal publication, installs both synchronously with no observer/await, accepts resources/updates baselines, then notifies. Precommit failures discard candidates/preparations; postcommit supersession is not rollback. Preserve committed:true and never undo an observer's later edit.
- projectManagerBundle.ts:277–292,316–363 already excludes active editors, pending/failed pipelines and stale native host snapshots. A model-command receipt is volatile-workspace, not a server Save. Keep normal host Save/sync as persistence; add no direct Files writes.

## Recommended bounded seam

Read-only inspect/replay captures exact saved source, versions, history, parameters, frame and lifetime; returns immutable currentness-bound evidence after Worker completion. It must not prepare writes, advance fullTip, clear journal, change models or mark Files saved. Label saved-native proof honestly rather than a physical DOF or whole-model certificate.

For LengthRelation, retain the pure Worker's exact intent/admission/geometry checks, then pass its source only as a private candidate override into full dependency replay and atomic publication. Require closed editor/operation, valid full tip, units/workbench and host binding at discovery and commit. Capture expression script/list/errors/table revisions plus detached numeric values; the transition API does not evaluate typed source, so reuse the typed-consumer contract or explicitly refuse that domain without erasing bindings.

Consumed source faces may be absent from accepted registry: use explicit originating history provenance, never nearest/ordinal guesses. Generic journal travel must start with current bytes/version equal to its expected side, exact-Worker-replay the target, then install target bytes/dependencies/cursor together. Do not normalize away authored changes or add live skip-solve IO. Cancellation closes only the owned Worker/matching candidate epoch; old cancellations cannot kill newer work.

First affected controls: accepted/redundant relation, contradiction preserving exact source/models/history, exact undo/redo, active-editor refusal, held Worker source/parameter/frame/material/history changes and storage ABA, close/account cancellation, downstream failure, notification reentry/committed markers and normal Save/fresh native reopen. Include 139 KB after journal compatibility; prove read-only paths cause zero writes/journal/pipeline changes. No blanket Files rerun.

Avoiding active editor hydration is not proof of zero main-thread work: native parsing, ReadSketch, registry/observer/render work still need measurement. The legacy expression-table listener in sketcherBundle.ts:202–214 can construct a Viewer; a pure closed-source operation must not trigger or rely on it.

## Actual application history-ABA comparison

`history-aba-browser.test.cjs` uses actual craft methods: rectangle 100×50, extrude 20, centered hole 10, then redundant LengthRelation 2:1. A Native Worker subclass forwards genuine messages/replies unchanged. At candidate rectangle-solve postMessage it changes accepted hole parameter 10→12; at research-centered-cut post, diameter is already materialized and accepted source is restored to 10. No Viewer, storage, model or solver response is fabricated. This is injected history/message timing, not ordinary agent raw-field editing.

| Receipt | Exact runtime | Actual result |
| --- | --- | --- |
| history-aba-baseline-9b88.json | Source 9b88a776698c65d6a2a3a0abde405b94f4f0e37d,20482, app 6e1aa6b9c1ae95451859523c2d6e8ab2f7d7e160550fc92a4cb661af7f319352 | Command accepts; native request 12; analytic circular diameters [12,12], feature history still 10. Fresh native restore [10,10]: accepted geometry/history and persistence inconsistency. |
| history-aba-fixed-cb4.json | Source cb4a0dce8e4ce5c6d70524eb3b38e354ec58ec31,20483, app 323878bd7c3ce662ae2ef57b9ece84fa4b7ebfb5c0fcd54fc20cd15a3cde1aac | Same injection; native request 10, accepted diameters [10,10], stable body ID, semantically identical history; fresh native restore [10,10]. |

Both verify sketch Worker d959fcb7282eaa3807d77d797c3ba80b708a7e95cd6efb8158a1f98ab8635c27 and record other targeted Worker pins/owned handles. Contexts close; fixtures remain. Initial fixed run's exact JSON history string check failed on canonical key sorting: history-aba-fixed-initial-key-order-oracle.json retains the harness error. Corrected parsed deep equality retains every type/value/ID and array order; geometry/source/error assertions remain. Initial baseline app-script lookup also failed before setup and was corrected to static/index.bundle.js; no product change.

Root cb4 fixes submitPreparedReplay itself: captureAuthoredHistory detaches records and binds them to accepted fullTipSignature, rechecks original state/epoch/readiness/preparation around capture, then evaluates only captured.history. Source review and actual comparison support this bounded fix. Only **private prepared replay** is detached: generic submitModification/new-feature prefixes and direct runPipeline may still alias records. Keep ARC23 partial/global ownership audit open. Native snapshot/empty-workspace restore here is not signed My files Save/sync, full UI performance, arbitrary topology or universal replay qualification.

Receipt metadata correction: the inspector harness spread its controlled source-state string over the source commit field. Corrected receipts rename that state to authoredSourceAfterABA and retain full tested source pins; both raw collision receipts are preserved. Client byte pins and runtime assertions/outcomes are unchanged.
