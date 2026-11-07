# WR03 / W03 project-validation and hashing follow-up

This continues the same cleanup-order defect family as the controller and three
disposable clients. It is not another unrelated issue count. No project schema,
hash domain, geometry algorithm, native build, GUI, default, or deployment change.
Root maintains the canonical docs/STATE-MACHINES.md.

## Exact callers and ownership

`projectManagerBundle.ts` owns two kinds of dedicated CPU Workers. Validation is
used by typed JSON restore and normal Blob/native restore, before any staging.
It owns its deadline, progress polling, caller/document/pagehide listeners, and
one Worker; restorePending prevents a simultaneous restore in that manager.

`withManufacturingHashWorker` owns one hash Worker across a whole task, including
both sequential hashes in manufacturing Save preparation. It serves prepareHostSave
and manufacturing-rebind proposal; material-role assignment previously had a
duplicate inline owner. Document/caller abort and a30s timer feed a local abort
signal. `hashCanonicalInWorker` borrows that Worker and exchanges start/chunk/finish
messages, one bounded transferable batch at a time. It previously terminated on
abort while the caller also terminated in finally.

There is no WebLock queue in these project/hash owner functions. Their fences
are checked before allocation, including at the immediate constructor boundary.
This differs from the queued sketch/semantic/parameter clients already qualified.

## Frozen failure evidence

Baseline cf134dad9 preserves actual whole-manager execution, real validation and
incremental-hash Node Workers, plus the existing display-units fixture's explicit
UI/storage/pipeline/document doubles. No closures are extracted. No model geometry
or successful native kernel output is fabricated. Empty native project envelopes
are component protocol fixtures, not public Files/Open qualification.

Injection occurs AFTER the real Node Worker terminate call; the real termination
promise is retained and awaited during fixture cleanup. Normal validation and
hashing controls pass. Three normative controls fail:

- Validation cleanup throw leaves restore unresolved and emits an uncaught error.
- Hash completion rejects the raw termination error but skips both owner abort
  listener removals. This case settles, but its cleanup attribution/bookkeeping
  is wrong.
- Hash abort during a genuine held ready reply leaves the awaited hash unresolved,
  emits an uncaught error, and retains its owner listener.

before.json pins actual manager/helper/fixture/compiled-validation bytes. Original
stdout (including the real verb.js version line) is preserved in *.raw.log;
individual JSON files remove that console prefix only. before-tests.log retains
2pass/3fail, without skipped assertions or altered expected outcomes.

## Repair

Only `projectManagerBundle.ts` and `incrementalCanonical.mjs` change.

The canonical helper now has weak close-once records shared by immediate abort
and owner finally. `closeCanonicalHashWorker` attempts termination once, retains
the exact first cleanup cause and prior operation error, and repeats the same
failure on a later close without retrying termination. `assertCanonicalHashWorkerAvailable`
must run before allocation and rejects a closed borrowed Worker or module cleanup
failure. Records are WeakMap entries, not a strong retained Worker inventory.

Each hash exchange settles once and attempts all listener removals even when
cleanup fails. The manager validation finisher likewise clears timers/listeners,
detaches handlers, attempts termination once, and always settles. Cleanup faults
reject with WORKER_CLEANUP_FAILED, exact cause, and original operationError when
one exists. No successful result is reported without required cleanup.

Manager hash-owner finally always removes document/caller listeners, preserves
any earlier task error, and uses the same close record as cancellation. The
manager and canonical module instances fence future allocations after failed
cleanup. Tests show later requests create zero new Workers. Validation failure
normally revokes its disposable document; a separately labeled replacement of
the fixture's document-lifetime double demonstrates the SAME manager module fence
independently of that revocation. It is not a real ProjectService/new-window proof.

Material-role assignment now uses the existing hash owner, then rechecks exact
currentness before preparing and publishing metadata. Previously its metadata
assignment preceded termination in finally. That ordering is a static source
finding, not an observed native material-assignment incident. An AST regression
pins the await-owner boundary and both subsequent currentness checks; retained
real assignment/Save helper tests remain unchanged.

The fence lasts for an imported module instance, not simply a document or window.
Reopening may reuse that module and is NOT promised to reset it. A fresh independent
module can own a separate fence. Failed termination cannot prove physical release;
settling promises/removing handlers does not establish Worker/native/OS memory
reclamation. No termination retries or cross-module global resource authority are
introduced. External borrowers must use the close helper and availability check;
arbitrary external direct calls to Worker.terminate cannot be intercepted here.

## Final qualification

The final focused run has33passing controls:5original observations,20extended
genuine-Worker controls plus material-publication AST guard, and7close-once unit
controls. Falsey cleanup causes are exercised through real validation/hash Workers.
Cancellation holds genuine replies; captured late delivery cannot change settled
outcomes. Hash presentation-currentness and replaced-document validation controls
reject without changing retained material data. There are no uncaught errors and
no retained owner abort listeners. Synthetic close-once unit Workers are explicitly
labeled and are not native/math outputs.

Retained actual-manager/currentness/hash tests27/27pass; retained role-assignment
and manufacturing-save helpers9/9pass; TypeScript passes. The actual manager uses
real codecs and hashing, while UI/storage/pipeline ownership remains protocol
doubles. This is not a composed browser build, signed Save/reopen, full Files
requalification, or full CAD Gate1 acceptance.

The first extended attempt mistakenly held validation's progress:'started'
message, allowing its actual successful final reply to settle before abort or
replacement. Three expected-refusal assertions correctly failed. Source and
23pass/3fail receipt remain at probe-before-final-reply-hold.mjs,
extended-before-final-reply-hold.json and final-before-final-reply-hold.log. The
corrected fixture holds the genuine FINAL reply. Product and expected refusal
assertions were unchanged by that fixture correction.

Some fixture Worker counters increment only after terminate returns. A deliberate
post-real-terminate throw therefore undercounts that fixture's `terminated` field;
the independent real termination calls/promises are retained and awaited. Do not
interpret that counter as native names, JS heap usage, or a surviving Worker.

## Canonical mapping

| Family | States/transitions | Invariant / coverage |
|---|---|---|
| W03 validation | admission→running/progress→settled, restore then stages | One terminal finisher; timers/listeners cleared; failed release cannot announce validated success |
| W03 hash exchange | idle→one pending start/chunk/finish→settled | One bounded batch, exact digest domains unchanged; late/abort replies cannot resettle |
| W03 hash owner | allocated→task→cleanup→return | Cleanup precedes caller result/assignment publication; abort and finally share one close record |
| W03 cleanup fence | healthy→cleanup-failed, terminal for module instance | Exact first cause; future allocation refused; no blind retries |

No new independent busy flag is needed. Exchange done/validation settled govern
one request; the weak close record governs physical cleanup attempts and is a
different responsibility. A cleanup-failed fence cannot be derived merely from
whether a promise settled, because settlement now occurs even on cleanup failure.

## Reproduction

Use reviewed Node24 and node_modules, no accounts or public services:

```
node test/display-units/build-validation.cjs
node test/state-machine-audit-project-workers/run.cjs /tmp/project-worker-observations.json
CODI_PROJECT_WORKER_OBSERVATION=/tmp/project-worker-observations.json node --test test/state-machine-audit-project-workers/observations.test.mjs test/state-machine-audit-project-workers/extended.test.mjs test/state-machine-audit-project-workers/close-once.test.mjs
node --test test/display-units/manager.test.mjs test/state-machine-audit-cad/display-reentrancy.test.mjs test/manufacturing/incremental-hash.test.mjs test/manufacturing/incremental-revision.test.mjs
node --test test/enclosure-material/assignment.test.mjs test/manufacturing/worker-save.test.mjs
```

The fixture transpiles the actual entire manager using the existing reviewed
TypeScript dependency, preserving production imports through explicitly listed
real helpers/protocol doubles. No Canvas or fake browser is introduced. All real
threads are terminated and awaited; no shared browser or live service is touched.
