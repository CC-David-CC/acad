# Shared authored feature cancellation: native operations

Source-only repair of the inherited cancellation seam documented in `C06-COUNTERSINK-AUTHORED-INDEPENDENT-REVIEW-20261109.md`. No tests, parser, build, callback mutation probe, Native invocation or browser execution was performed. No public runtime incident is claimed.

## Exact basis and ownership

This isolated branch starts at reviewed authored packet `95fff9d4b8425669ffd848fb9ca76731e3a6d4f1`, with only the BEFORE review note `3da3a6d3cc75f8b0836c742ef43040bcfddeb1ee` cherry-picked as `385cb6e8`. The finding also exists in baseline `8082b77a481faa30c864aa6fe9141a4a97d61cc2`; it was not introduced by countersink authoring. Root/current/frozen qualification source and evidence were not edited.

Only `web/app/cad/craft/craftBundle.ts::authoredFeatureOperation` changes. Its existing captured `HISTORY_SIGNAL_ABORTED`, `HISTORY_LISTEN` and `HISTORY_UNLISTEN` operations were already defined at module scope for other shared history operations. No new callback, authority, flag, dependency, operation kind or framework is added.

## Actual correction

The native getter is now used for brand admission, the initial/currentness check, the post-acceptance lifetime check and the cancellation poll. Listener registration/removal call captured EventTarget intrinsics with the captured genuine native signal as receiver. Optional signal absence remains `undefined`; invalid null/foreign lookalike signals retain the same admission refusal. The exact own-data options capture is unchanged.

An own `aborted` property or own add/remove method on a genuine signal consequently does not define cancellation or listener behavior, before or after publication. A native pre-aborted signal reaches the same existing superseded refusal. A later native abort still reaches the same candidate epoch cancellation path; post-publication native cancellation still yields the existing committed outcome rather than an attempted rollback. No signal instance method is invoked by this function after the repair.

This is the common implementation already used by countersink and profile-extent edit/travel, and by the other existing authored feature edit/travel branches. Those branches retain their exact original geometry, intent, source/material/J/currentness checks and Native ownership. Creation facades and unrelated physical/legacy command functions are untouched.

## Settlement preservation

The real onAccepted callback remains the sole `accepted=true` assignment. Existing `wasCommitted`, family-specific `receiptFailure` codes/shapes, publication receipt, original operation failure, committed metadata and optional known receipt are unchanged. Timer cleanup and every listener cleanup still run through the existing collected-error path. An actual intrinsic cleanup failure continues to carry its exact primary cleanup cause, all collected cleanup errors and any original operation error/publication/receipt; the repair does not swallow it or certify release.

The change removes caller-owned shadow-property/method effects; it does not reinterpret ordinary failure, make precommit receipt success, or widen the request/feature/cohort domain. Actual function execution, native cancellation/settlement and complete affected public edit/travel qualification remain Root's composed whole-workflow obligations. Existing frozen receipts and acceptance criteria remain unchanged.
