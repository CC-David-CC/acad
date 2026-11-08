# Passive history preview admission

2026-11-08. Source-only repair based on ACAD `1ecf683`. No tests, probes,
typechecks, builds, driver/assertion changes or browser execution were performed.
The existing complete history workflow remains the next runtime qualification.

The retained R2 whole-workflow trace records an accepted history-prefix change
followed by an `UNAVAILABLE` inspection. The source has a blocking contract:
`wizardBundle` derives the next history entry into `workingRequest$` for any
prefix, whereas history controls rejected every non-null working request.
This does not establish the other readiness flags' values in that failed run;
those values were not recorded.

## Authority and currentness

`WizardService.hasActiveOperation()` is a new derived admission method. The
existing `isInProgress()`, request/state/materialization streams, rendered form,
insert-ID ownership and human apply/cancel paths retain their roles. Other
facades' existing wizard guards are unchanged.

Only the wizard's own history-derived branch can issue a private WeakMap
witness. It requires the existing canonical `noWizardFocus:true` hint, but that
hint alone grants no admission. The witness binds the exact request, Craft
modifications stream and revision, history-state/array/next-entry identity,
pointer, entry type/suppression/params, project service, document generation and
native AbortSignal. The method checks those bindings and actual pristine
parameter values on every call. A copied, replaced, changed, stale or unprovable
request is active. Null means no active request.

The existing detached parameter clone is reused. Only its proved bounded data,
the newly copied single-field hints and the detached request are frozen. No
CraftHistory object, entry, authored params or source hints are frozen. Additional
proof work is limited to 1,024 objects, 4,096 fields and a 262,144-byte retained
UTF-16/scalar charge; arrays and ordinary enumerable-object inventories refuse
before constructing an oversized key list. There is no new JSON serialization,
second parameter clone, hash, geometry work or Worker/native request. Data that
cannot be proved keeps its ordinary editable wizard behavior and is refused by
history admission. This bounded finite-C07 proof is not universal draft admission.

Explicit `updateParams`/`updateParam`, `updateState` and `applyWorkingRequest`
revoke the current witness before doing their existing work. This includes
explicit no-op edits and field activation. Immer still produces editable drafts
from frozen passive input. The wizard's internal request-reset state installation
does not pretend to be a user edit. Cancellation or a later history navigation
can derive a fresh preview normally; no synchronized active/passive state flag
or public provenance field is added.

History controls call the captured actual service method instead of rejecting
every non-null request. They retain the original guard codes and all processing,
failure, cleanup, restore, unit, sketch-editor, history, expression, source,
resource, model, journal and material checks. The service/method and stream
identities remain bound, and every existing currentness check also repeats
admission, catching a revoked witness even if a no-op user action did not change
the request stream. The readiness `UNAVAILABLE` messages now identify each
failing condition rather than conflating them with an operation draft.

## Remaining qualification

Root must rebuild the coherent composition and run the unchanged complete C07
workflow, including immediate inspection and navigation after prefix acceptance,
branch/travel/save/reopen behavior and genuine human-draft refusal. This source
checkpoint is not a runtime pass or a full C07/C08 completion claim. Frozen C08
source, native ABI, archive ownership, Desktop adapters and all driver oracles
were left untouched.
