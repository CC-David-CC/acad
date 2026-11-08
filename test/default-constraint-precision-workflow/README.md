# Full-precision default constraint workflow — source preparation only

Product fix: `AlgNumConstraint.initConstants()` no longer calls `toFixed(2)` before authoring the constant. The same Number-to-string round-trip conversion and `updateConstant` path remain. No numerical solver, equation, reduction, domain, display, lifecycle or history policy change. This is not a general 1 pm accuracy qualification.

**NOT RUN.** No tests, native probes, compilation or browser execution in this lane. Use only a newly composed, source-pinned application after root integration. Retain the first actual failure; no runtime injection, default-field replacement or criterion relaxation.

## Why this exercises the real bug

`web/app/sketcher/actions/constraintActions.js` action `DiameterLength` (description `Driving diameter of one circle or arc`) constructs a genuine constraint and calls `initConstants()`, then opens the existing ConstraintEditor. The schema `DiameterLength.initialValue` returns `2*circle.r.get()`; APPLY passes that **untouched default** through the actual `addDiameter` transaction. `ConstraintEditor` retains validation/domain checks. This is also reachable through the registered human `DiameterGlobal` action or selected object's existing contextual Diameter button. `web/app/cad/dom/components/View3d.jsx` mounts the real in-place ContextualControls and ConstraintEditor.

`apply-closed-sketch-diameter` supplies an explicit caller value and **does not** establish this default-initialization regression. Integer Horizontal/Vertical/Parallel/Perpendicular default branches do not expose decimal loss. The public Worker sketch view is explicitly partial/read-only with no legacy drawing tools; it must not be relabeled as the human editor or used to invoke a hidden action.

The human editor enters through actual selected source face/plane -> `EditFace` (`open sketcher for a face/plane`) -> `services.sketcher.sketchFace` -> `InPlaceSketcher.enter`. Modern worker solids are blocked by `assertLegacyGeometry`; this fixture therefore uses an unconsumed principal source PLANE, never a generated Worker solid face. Existing guarded source save commits through genuine Worker save validation and the unconsumed source publication path.

No browser inspection has established a stable automated camera hit/selection route on the next package. This packet provides a **concrete manual/trusted-UI acceptance**, plus normal public authoring/edit helpers and an independent saved-artifact checker. Do not claim an automated human-action PASS from helper calls alone. If the composed runtime cannot actually enter this source editor or expose the contextual action, record the exact operation/error/visible state as an integration gap; do not call `action.invoke`, `viewer.select`, set streams, synthesize selection/events or seed a source file. No new public/test-only API is proposed.

## Frozen fixture and independent expectations

`example.mjs` only uses already registered window/document-bound public commands. `begin()` requires New/empty and authors an anchored 10×10 XY datum rectangle, Circle center **(40.125,20.375) mm**, radius **4.123456789 mm**, and unrelated Point **(7.25,9.625) mm**. It obtains the actual circle/center/datum IDs from append receipts and inspection, then applies actual signed X/Y center constraints. Circle radius is still free. No Native body is created.

Expected raw default is `String(2*4.123456789)` = **`8.246913578`**; old decimal rounding offers **`8.25`**, changing the radius if accepted. This distinction is the regression, not merely displayed digits. Independent center/radius and raw literal checks must remain separate.

Post-creation public edits use diameter **12.345678901**, then after fresh Open **9.876543219**. Radius is diameter/2; center, datum rectangle, unrelated Point, source/curve IDs, existing constraints and the sole PLANE history must remain unchanged. Stored diameter literal must equal `String(expectedNumber)`, not `toFixed(2)`. Saved radius consistency budget **1e-9 mm = 0.001 nm = 1 pm** is scoped to this analytic source relation; no BRep/nanoscale-solid claim follows.

## Complete real acceptance procedure

1. Root provides exact Core/Desktop/package/driver pins and a fresh signed fixture/account/context. Use normal New; run `createDefaultConstraintPrecisionExample(realCreateCadAgent).begin()` and retain public request/response/discovery receipts and binding. Read-only source/model/journal/resource snapshots are allowed; no private mutations. Save `before-default` normally to My files, await real server sync/readback and retain raw bytes/SHA.
2. In the actual 3D UI select this **real source plane**, then click its existing Sketch/EditFace control. Confirm that the in-place editor opens on the same source ID and includes the actual circle ID. Select the circle using trusted canvas click or existing visible object selection control; capture the actual selected-circle display. No direct action/selection invocation. Capture screenshots and document the trusted route actually used.
3. Click the existing contextual **Diameter** button. Before any editing, capture actual dialog title, input string, source/read-only draft and selected ID. Require the untouched initial input **`8.246913578`**. Do **not** type/replace it with the expected value: that would bypass the bug. Click actual APPLY. Require one genuine DiameterLength row for the actual circle, raw literal exact, and radius/center preserved. No synthetic positive reply or field injection.
4. Click actual **commit / save sketch changes and exit**. This is source commit, not native project file Save. Require genuine Worker validation/currentness/publication and settled resources. Public `inspect-closed-sketch` must now discover the actual editable DiameterLength row, same source/circle/point IDs and full raw literal. No hidden source/body/history is added. Save/sync/readback `default` normally.
5. Call `example.edit(binding,12.345678901)` through public `edit-closed-sketch-dimension`, discovering current constraint identity/revision. Require expected radius and unchanged unrelated intent. Inspect `inspect-authored-edits`; travel actual edit Undo, Redo using the current advertised target. Undo restores raw default and radius; Redo restores full edited value. Record source/history/journal/counters/owners before/after. This is **edit travel**, not an implied creation Undo claim.
6. Attempt diameter zero and negative through that same public edit route. Each must refuse by its actual schema/domain, preserve accepted source/history/journal/counters/resources, then permit a healthy valid continuation. Do not accept the invalid value, remove/readd the constraint or quietly change formula/branch semantics. Cancel a newly opened default dialog without APPLY as an additional real UI control if available; require no authored source/file change.
7. Save/sync/server-readback `edited`; fresh login/Open that exact native file through the normal public file route. Retain actual loaded source and raw bytes. Require exact saved intent/IDs/history/full literal, geometry relation, no hidden future rows and the declared reset of session-local journal. Save/readback the reopened state as `reopened`.
8. Publicly reedit to **9.876543219**, perform healthy inspection, Save/sync and fresh second Open. Retain `reedited-second-open` raw file and actual inspection, precise literal/radius and unchanged center/unrelated source/sole PLANE. Verify session cleanup; close only owned contexts; parent owns the fixture/shared browser.

Root should run this entire scenario on the repaired composed runtime; no isolated initializer test or synthetic geometry is substituted. If human editor state/public source inspection cannot bridge cleanly, preserve the actual failure and report that path missing rather than pretend private access qualifies it.

## Prepared source and artifact intake

- `example.mjs`: public authoring/current discovery and existing-dimension edits; deliberately **no method to create the default Diameter**. Only the trusted real human action does that.
- `check-saved.mjs`: independent actual JSON-file custody/identity/raw-constant/analytic source checker, not proof of UI gestures or BRep accuracy. Expected geometry derives from the frozen authored public fixture; body/curve IDs come from real receipts, never opaque-ID parsing.

After whole-flow outputs exist, create an intake manifest from the real receipt:

```json
{"version":1,"binding":{"faceId":"actual receipt","circleId":"actual receipt","centerId":"actual inspection","datumId":"actual inspection","unrelatedId":"actual receipt","rectangleIds":["actual","actual","actual","actual"]},"saved":[{"label":"before-default","file":"before-default.jsketcher.json","sha256":"actual SHA256"},{"label":"default","file":"default.jsketcher.json","sha256":"actual SHA256"},{"label":"edited","file":"edited.jsketcher.json","sha256":"actual SHA256"},{"label":"reopened","file":"reopened.jsketcher.json","sha256":"actual SHA256"},{"label":"reedited-second-open","file":"reedited-second-open.jsketcher.json","sha256":"actual SHA256"}]}
```

Then run once on those complete actual outputs: `node test/default-constraint-precision-workflow/check-saved.mjs /absolute/evidence/intake.json`. No checker execution occurred in this source-preparation lane. A checker PASS alone cannot supply missing trusted action screenshots, real readback, command/session provenance or resource proof; preserve those separately in the whole workflow receipt.
