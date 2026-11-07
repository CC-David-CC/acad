# Source-bound through holes — next shared feature

Fixed-tool signed17 proof is retained. This step must make centered and four
corner holes follow the current source rectangle and actual target extent.
No new native binary is needed: reuse qualified selected-profile V3 construction
and the owned Boolean Cut export, in the same Worker/candidate ownership.

Authored intent is captureOwnedHoleIntent: source extrusion feature/face/region,
current target/producer, centered-through or four-corner-through, diameter and
corner offsets. Save no tool coordinates, tool depth or duplicate source geometry.
The host ledger binds the actual source face/region to the originating selected
extrusion. The Worker binds actual sourceHandle/feature/region and keeps that
constructor's detached source request. A later replay uses the new request.

New component operation:
`{op:'solid.holes.through', ...capturedOwnedHoleIntent, handle, sourceHandle}`.
Handles remain private. Exact new typed reply binds the intent and resource work.
The existing explicit Boolean-history mount advertises this new optional v1
capability; native JS/WASM stay dd666/8d5, package Worker provenance changes.

Pure layout API: `planOwnedThroughHoles({request,sourceProfile,targetMetrics})`.
request is the full authored capture, sourceProfile the genuine captured V3
constructor request, targetMetrics actual InspectOwnedSolidV2. Initial scope:
one axis-aligned rectangle in its own orthonormal sketch frame, no source holes,
one current valid solid. World frame rotation/translation is supported. Derive
center or boundary offsets from current local rectangle coordinates, then derive
a conservative full target axial span from all8 actual native AABB corners.
Extend both ends by1mm; explicitly refuse an unrepresentable/out-of-domain tool.
Use internal derived Circle profile requests, never fake authored sketches.
Expected removed volume is count*pi*r^2*current source extrusion depth; runtime
checks that current material matches this supported prismatic/non-overlap case.
Invalid placement/overlap or unsupported target is a typed refusal preserving
accepted state, not a fabricated valid hole or false invalid-geometry report.

Planner returns frozen `{version:1,sourceRegionId,centersLocal,radius,
 toolProfiles,expectedRemovedVolume,axialSpan:{min,max},scope}`; toolProfiles are
ordinary ephemeral V3 requests with derived feature/anchor labels. These labels
are NOT published as authored source contexts/IDs. Use prepared current source
geometry and actual native memberships, not encoded-ID parsing or display bounds.

Lineage: new `deriveInheritedSelectionIndexV2({sourceIndex,ancestry,topology,
featureId})` uses exactly one genuine named source and the real source-A Cut
history through the existing common core. Actual source-B geometry/history/copy
is still validated by ownedBooleanContract. Preserve known target identities;
generated hole walls/rims remain explicitly unclaimed until separately qualified.
sourceContexts enumerate origins of advertised/inherited identities, not all
causal operations. The hole feature itself remains authored in the one history.
No dummy second index, fake region or matching by coordinates is introduced.

Budget: native result costs are2(center) and8(four corners): one Circletool plus Cut for center; four Circletools, three owned Unions
into a valid four-solid tool and ONE final Cut for the corners. Reserve/charge those costs honestly in Worker/controller/
history budget; count actual native work even when intermediates are released.
Internal tools/intermediates are private and released on success/refusal. Keep
original source/target exact, publish only the complete final valid result, and
terminate/clean the candidate on cancellation/integrity failure as before.

Qualify real Chromium source100x50x20 and150x30x25, both hole kinds, retained outer
edge fillets/chamfers, independent volumes/cylinder centers/point checks, rotated
frames, wrong/stale bindings, overlap/outside refusals and clean release. Then
real public agent creation/edit/source+depth replay, rejection/travel, native
Save/server sync/fresh Open/reedit. Full Gate1/all22 remains the stopping scope.

## Qualified checkpoint — 2026-11-06

This shared feature is now implemented and qualified for the bounded preferred
OCC numeric agent path. Actual component Chromium proof covers both sizes and
a rotated/translated plate (`test/through-hole-browser/`). Shared source binding,
costs, operation, journal, facade and host authorization tests retain separate
protocol/pure claims. The operation source-plane currentness defect was
reproduced and fixed at7edaa9e11, with before/after and independent root evidence
in `test/through-hole-operation/`.

Fresh full app source84406dea42e4c96613cf0bee54e96e8fc0380831 builds successfully;
`through-hole-app-build.json` records full build, package and unchanged native
runtime pins. Actual private signed19-row qualification now passes source
100x50→150x30, depth20→25, both hole kinds, inherited fillet/chamfer, hole numeric
edits, refusal preservation, edit travel and two native Save/server-sync/fresh
Open cycles. Desktop branch9655720f5 retains complete portable observations,
two6176B files, exact one-field reedit comparison, independent analytic volumes
and fixture cleanup in `test/agent-cad-corpus/source-bound-holes/`.

This does not qualify generic creation undo/redo, feature-pattern intent,
display-unit changes, broader profiles/targets, human UI or other kernels.
Those and all22 required exercises remain open. Beta/main/prototype unchanged;
visitor relay remains off; Files accepted and filesystem-race testing cancelled.
