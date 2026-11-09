# C11 R5 retained actor binding assessment

Independent read-only source/evidence assessment, 2026-11-09. No browser,
renderer, oracle, Native, test or product execution/edits. This does not change
qualification status or anticipate the remaining full artifact assertions.

Actual R730 evidence root:
`/mnt/data10tb/codi-acad-drawing-requirements-20261109-r5/`.
`whole/receipt.json` SHA256:
`7e063f524b934f245d90ab7c75e8f403e08fa94276612cfd190568cdf39787cb`.
Original `FIRST-ORACLE.json` SHA256:
`a743533920f6d7dddf49eaee76885d765c9c9fb155a3629a036421a9d8b44e6f`;
it remains FAIL with error `'windowId'`. Whole receipt records PASS with42
Native observation sets,3 fresh Opens,7 SVGs,15 write rows, pendingWrite:null,
ownedContextsRetired:true and unchanged before/after source pins.

Producing tuple is Core `82866bf0ee852f1d3b3892972f07d8af4cd8b9b0`,
Host/example `796c9051331054746d81ea4ea0bb8ec8e8cf2bbd`, acceptance
`615716f87f74efc34ed6cd41660db07aa377f4a1`. Actor-critical snapshots:

|Source|Git blob|SHA256|
|---|---|---|
|Core desktop-driver.mjs|6d68571cfff6743e9bb95d7ab15f4f9247a13451|1efd089441f9bf781681c1c6e66d198ccfbce25d2f8016cc285268118ce4bcdd|
|Host sweep/signed-harness.mjs|0ddb1781ed2ee57e91153e2f20fabb70183f2c9f|1ba491dc1d3ba32518a7476445aa8178bacac14af33cb0b4604969543d514d10|

Actual snapshot hashes and the two exact Git blob associations were independently
read. No executing import was used. Driver line99 reads `h.windowId` after
login but BEFORE line100 `h.launch()`. Harness line9 initializes that closure
as undefined; line89 exposes its getter. JSON therefore omits the top-level
field. This is an early capture defect, not evidence that the launched window
had no identity.

Contemporaneous evidence remains. `writes[0]` is the settled baseline SVG:
username `g1sweep1794264997517`, windowId string `11`, exact owned baseline path,
acknowledged receipt and artifact readback. All15 write rows independently copy
the current getter at submission (driver57,61,66) and record that same username
and nonempty windowId. Both crowding and blocked-anchor refusals retain before
AND after absence proofs: four total, all with windowId `11`, that username and
owner `user:6f24327c-3e6a-46a6-a230-f8f5a642060f`.

The pinned producer makes these stronger than a caller-supplied label.
Harness11/14 selects exactly one NEW actual registered CAD window from the
registry and its genuine iframe; command28/49 uses that captured window closure.
FreshOpen58 retires the old context, logs in again and launches/selects anew;
the value11 is a page-local ID, NOT a claim of one persistent browser window.
Driver60 checks a registered current session with matching displayName and
actual jsketcher registry membership for the recorded window. It obtains valid
browser/server Files contexts with equal owners, checks them before AND after
both complete root listings, and then records the proof. Driver61/70 also
checks full accepted state equality and explicit noncommitted RESOURCE_LIMIT.

Recommendation: no whole rerun is required SOLELY to recover this redundant
top-level actor anchor. A separate historical-reader branch may bind exactly
this immutable receipt SHA and complete producing tuple/source roster, require
the top field to be absent, derive a reader-local anchor from the actual unique
sequence0 settled baseline write, then require every actual write and all four
owned absence proofs to match it. Preserve the exact two refusal labels/paths,
proof methods/owners, complete listings and every original artifact, source,
geometry, J, repair/travel, format, readback and cleanup assertion. Missing,
inconsistent or incorrectly typed actual rows must refuse, never fall back.

Do not insert `receipt.windowId`, mutate the receipt, supply a constant11,
infer a window from filenames, or generalize an absent-field fallback to other
runs. Future producers should capture the top field AFTER successful launch.
Run any corrected AFTER reader into a NEW output and retain FIRST unchanged.
This assessment establishes only the sufficiency of existing actor-binding
evidence, not the unexecuted geometry/oracle result or a global identity claim.
