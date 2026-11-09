# Authored edit settlement: source repair

Issue: CAD-AUTHORED-EDIT-POSTCOMMIT-RECEIPT-01. BEFORE review is `adc6e9c31b54c56ddc6effd32d954bac9f76905c` against immutable merge `14b21b0340475a06f5b18c927b546ce5403f5466`. This repair starts from root `a8f3491264c436382cbc46e379b45db42f6416b4`, plus only the cherry-picked BEFORE note (`cc0b1f7`). Production scope is one function, `authoredFeatureOperation` in `web/app/cad/craft/craftBundle.ts`. No source/runtime/Native/default/geometry/J/Files/archive or acceptance criteria changed.

## Actual publication authority

`settleModification` resolves `onAccepted` only after the actual candidate owner is accepted, state/J/workspace publication is committed and notified, currentness is rechecked and `requireCommittedCurrent` succeeds. The local acceptance callback now records that exact success before resolving its Promise. It never sets the bit when submission begins, a candidate is prepared, or a Promise rejects. An existing pipeline error with its own `committed:true` is retained; a missing/unreadable marker is not treated as proof of publication.

The private prepared command's existing postcommit lifetime check also retains a bounded frozen publication address: captured document generation, proposed journal revision, feature ID and history index. That address is not a new current-revision query or resource handle. The journal supplement may replace an event to add genuine source deltas, but preserves the same document/revision. The address is exposed only with actual postcommit/accepted errors. It is not a claim that the document remains current after notification.

## Settlement outcomes

| Actual outcome | Result |
| --- | --- |
| Validation, submission or evaluation rejects before acceptance | Original thrown value retained, including falsey values. It is not relabeled committed. |
| Pipeline rejects with an existing committed error | Original error and its code/cause/commit information remain intact. |
| Real acceptance then receipt/revision read fails | Explicit committed receipt failure. Existing blind/counterbore codes and messages remain; other ordinary authored edits use AUTHORED_PUBLICATION_FAILED. Original error remains cause. |
| Real acceptance then caller loss | Existing committed cancellation identity is retained for the generic path, with the private bounded publication address. Blind/counterbore retain their existing family-specific receipt wrapper. |
| Receipt successfully constructed, later timer/listener cleanup fails | WORKER_CLEANUP_FAILED, actual committed flag, bounded publication address and the exact completed receipt are retained. No second read is attempted to reconstruct a lost revision. |
| Primary rejection and cleanup also fails | Cleanup cause and bounded cleanupErrors array are reported, with the original primary error retained as operationError. Committed is true only after actual acceptance or an existing own-data committed marker. |

Listener registration is inside the same try/finally so an unsuccessful registration does not abandon its timer. Cleanup records at most the two actual timer/listener failures and attempts each once. Cleanup does not cancel an accepted result, retry publication, invoke Undo, free Native names, or overwrite source/J state. The preexisting stop callback is inert after settled becomes true.

Successful receipt fields are unchanged for every supported kind, including blind/counterbore dimensions. The completed receipt is saved locally before cleanup and returned afterward. No-op early returns remain before the changed settlement block. No extent facade change is needed: edit and shared travel propagate the actual shared method result/error.

## Deliberate common scope

The approved common function covers existing extrusion, centered/corner hole, box, selected-profile depth/region, edge treatment, shell, revolve angle, blind/counterbore/through hole, linear pattern, append/remove/parent travel and new profile extents. This removes the two near-identical family receipt catches in favor of the same acceptance-aware path while keeping their public classifications. It does not rewrite other Craft transaction methods, the pipeline's publication machinery, callback ownership, cancellation policy, source capture or journal semantics.

No tests, parser, probes, build, TSC, Native operations, browser execution or callback-mutation experiments were run. The source-confirmed defect and repair are not a runtime qualification claim. Root retains serial normal build/full extent acceptance and complete applicable ordinary regressions, including edit/travel/refusal/Save/Open, on the final composed source.
