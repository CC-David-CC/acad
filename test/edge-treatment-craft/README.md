# Edge-treatment Craft size-edit hookup

Qualified source: `04731a067`, based on journal-integrated `db51a42f9`. The only production file changed by this lane is `web/app/cad/craft/craftBundle.ts`. No public command factory, operation registration, Worker, native kernel, model, schema, desktop or UI changes are included.

The new optional typed Craft method `authoredSolidEdgeTreatmentOperation` delegates to the existing `authoredFeatureOperation` transaction with kind `solid-edge-treatment`. The target request must be `WORKER_SOLID_EDGE_TREATMENT_V1`. It captures the exact ten authored parameters with the existing journal capture, records numeric size only, and routes undo/redo by the exact new journal kind. Engine revision, target/producer/feature identity, treatment kind and ordered opaque edge IDs remain unchanged. No native indices are stored or remapped.

The original full captured history is replayed through the existing candidate resource owner, journal proposal and signature-bound publication. No extra solver path or main-thread geometry work is added. Existing cancellation/currentness and post-publication `committed:true` refusal behavior is reused. Edge edits additionally bind the expression table and explicitly refuse typed/project-bound expressions, matching the current selected-depth numeric-only scope. A no-op returns before journal proposal or replay. Successful scalar receipts include `size`.

## Evidence and limits

- 35 real pure capture/journal controls PASS: 3 new detached-history/currentness composition controls plus the previous 32 journal regression controls. These preserve descendants, ordered selections, engine/source identities, exact undo/redo and invalid/identity-change refusal.
- 4 TypeScript AST boundary checks PASS: actual source dispatch/type/exposure, size-only candidate mutation, existing replay/publication/committed-outcome flow and source/service/table currentness. These inspect source without executing extracted functions or simulating Craft, geometry, DOM or UI.
- Full repository `tsc --noEmit` PASS (exit 0; empty `tsc.log`) against a fresh archive of the exact qualified source on R730 using retained code-only dependencies.
- `git diff --check` PASS.

This is source/unit/type evidence only. Craft activation, real app replay/native geometry, host cancellation, signed Save/reopen and the upcoming public command are **not** qualified by this lane. The actual native/browser edge-treatment component and previous transaction proofs remain separately source-pinned; they are not relabeled as this app source.

## Reproduce

Run from the repository root with Node 24 and repository dependencies available:

```sh
node --test test/edge-treatment-craft/history.test.mjs test/edge-treatment-journal/journal.test.mjs test/mechanical/authored-edit-journal.test.mjs test/selected-profile-depth/journal.test.mjs test/selected-profile-depth-review/journal.test.mjs
node --test test/edge-treatment-craft/source.test.mjs
node node_modules/typescript/bin/tsc --noEmit
```

`CODI_TYPESCRIPT_PATH` may name the qualified TypeScript module for AST-only checks. It does not modify product resolution. Private type-check stage: `/mnt/data10tb/codi-edge-treatment-craft-20261106-r1`; dependencies are a symlink to the retained `/mnt/data10tb/codi-worker-sketch-view-20261105-r11/node_modules`, with no dependency installation or native rebuild. The stage contains source from the exact qualified Git archive and the unmodified production TypeScript config.
