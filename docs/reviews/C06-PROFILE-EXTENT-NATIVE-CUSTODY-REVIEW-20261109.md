# Profile extent Native custody — BEFORE source review

Reviewed frozen origin/feature/selected-profile-extents-20261109 at9f9bac8:
ownedProfileExtentWorker.mjs and its ACTUAL OCI dispatch/charge/refusal path.
No tests/probes/parser, build, Native or browser execution. No product/fixture/
root/active whole changes. Dxf owns extent source and any grouped repair; this
lane only freezes the independent finding. No public runtime incident claimed.

## Confirmed ordinary quota path calls retirement twice

Source addresses at9f9bac8:

- modules/engine/mount/ownedProfileExtentWorker.mjs:34 calls chargeResult.
- modules/engine/mount/oci-verified-worker.js:814 passes the ACTUAL
  chargeSelectedResult; this is not a hypothetical injected callback.
- OCI51 releaseSelectedName requires release acknowledgment1 and census−1.
- OCI56 calls it BEFORE throwing RESOURCE_LIMIT when cumulative triangles exceed
  the remaining budget; the charge map/triangle total remain unchanged.
- Helper36 captures that failure. Helper43 tests ONLY failure+attempted, so
  helper45 calls _ReleaseOwnedShapeV2 on the same name AGAIN and accepts0.

The source-derived count sequence is N → N+1 after genuine construction → N
when the charge callback retires its own result. The helper then performs a
second release, normally receiving0, and throws the original RESOURCE_LIMIT.
This is a repeated name-retirement attempt with an accepted absent result; it
is NOT demonstrated C++ heap double-free, foreign-name deletion, geometry
corruption or leaked positive output under the stated private exclusive owner.

The second call is still a real defect in the service lifecycle. It allocates
and frees another rollback-name pointer after a known settled retirement. An
allocation/release-pointer free failure at this redundant step changes an
otherwise settled quota refusal into ENGINE_CLEANUP_FAILED and terminal realm
retirement. It also conflates an acknowledged charge-owned retirement with
absence after other construction failures; accepting0 does not identify which
lifecycle path actually settled the name. No execution establishes frequency
or any current workflow impact.

## Actual terminal/refusal behavior (do not overclaim another gap)

OCI810–818 captures/prepares exact extent binding, reserves its monotone name,
invokes this helper and installs token/provenance/selection maps ONLY after a
normal helper return. No failed helper publishes a result token at that site.

Unlike the earlier unregistered countersink preflight finding, the extent helper
is called INSIDE the actual OCI outer try. Extent-specific catch1113–1115:

| Actual outcome | Existing disposition |
|---|---|
| PROFILE_EXTENT_REFUSALS from ownedProfileExtentPlan.mjs:7, including RESOURCE_LIMIT and acknowledged PROFILE_EXTENT_CONSTRUCTION_FAILED | refused; returns without close; normal finally restores busy→ready |
| PROFILE_EXTENT_INPUT_CHANGED | error with that code; closeWorker |
| ENGINE_CLEANUP_FAILED | error with that code; closeWorker |
| MEASUREMENT_PRECISION_UNRESOLVED | error with that code; closeWorker |
| Unknown dispatch/schema/runtime exception | error ENGINE_FAILURE; closeWorker |

closeWorker sets the phase closed, so the shared busy→ready finally does not
reopen that terminal realm. Helper cleanupFailure at10 retains the cleanup cause
and prior operationError; a falsey original cause is held in the explicit
failure object, not mistaken for successful completion. Scratch free failures,
rollback failure and rollback-pointer free failure therefore remain terminal.
The actual outer dispatch does NOT silently turn those unknown failures into
a healthy refusal just because the helper itself has no terminateWorker flag.
Do not add such a flag as a substitute for reviewing this real caller.

## Grouped custody remedy for the source owner

Use bounded explicit local obligation phases for this ONE result. The actual
charge callback's already-retired RESOURCE_LIMIT path must settle that same
obligation once, under its real source policy/count/work acknowledgment, and
skip any further name rollback. Preserve its original ordinary exception.
Do not fix this by accepting arbitrary code-only errors from an unknown hook,
refunding lifetime highwater/triangle work or relaxing quota/pair admission.

Separate normal Native refusal/confirmed absence, positively constructed owned
result, charge-owned retirement, release pending/confirmed and unknown outcome.
A later failure of a positively owned result may make one exact acknowledged
release; an unknown dispatch or failed scratch/release outcome must preserve
terminal classification. Avoid a generic retry/0-is-success cleanup for every
attempt. Existing private single-writer/fresh allocator authority is sufficient
for this lane; no adversarial IsEqual/name identity certificate or new Native
port is asserted or needed by this review.

The existing scratch frees already attempt both allocations; retain once-only
cleanup and the real top-level terminal codes. Preserve expected source/binding/
geometry/Native validity/provenance/selection checks and ordinary domain codes.
No broadened refusal list or fake successful allocation is authorized here.
If the owner's fix changes OCI bytes, update all actual shared source guards
and closure inventories coherently before root's normal batch qualification.

This review does not qualify extent geometry, typed/history/consumer closure or
any public workflow. The new lane remains capability-OFF/source-only; root's
frozen ad5 C11/counter regressions do not execute this pending source.
