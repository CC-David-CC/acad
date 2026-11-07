# E22 authored metadata slice

Product `9766d5ad5`, based on CAD `7b688c88d3608f177172ee551a391ca2ce566332`. New modules only; `SCHEMA-PROPOSAL.md` records the reviewed exact fields and root's view/axis corrections. All fixtures are **synthetic metadata**, not geometry or actual native/public authored IDs.

Implemented:

- Detached recursively frozen exact own-data definition capture; one to three distinct top/front/right bases in canonical order, up to16 dimensions, canonical millimeters and rational physical paper scale.
- Explicit datum-X/Y absolute source distances and signed hole offsets, with named-view compatibility; datum-normal cap distance cannot be presented in top view. This only admits the metadata. Real plane alignment, edge visibility and actual hole/axis membership require the future native measurement service.
- Source datum, authored native plane/line keys and semantic centered-hole references remain distinct. Opaque IDs are preserved, not parsed or generated. Conflicting declared source/native kinds and origins refuse.
- Definition and total public request each have independent65536-byte UTF-8 caps. Wrapper overhead counts. Canonical encoding ignores inherited toJSON hooks; admission rejects accessor/sparse/custom prototype/extra data and a changing variant during capture. No saved measured values, projections, frames, source digests or handles.
- Pure create/replace/remove proposals bind full and geometry revisions and return exact before/after snapshots. No-op returns no journal record. No owner state/counters/revisions are mutated.
- A proposed `document-metadata`/`linked-part-drawing` entry with before/after and conservative serialized/string charge. It is not an Undo implementation or a new stack. Root must integrate exact domain dispatch, branch/cursor/budget/currentness and atomic publication into the existing shared journal.

Evidence: `evidence/metadata.log`16groups PASS; retained existing edge-treatment/selected-profile-depth/source-plane-depth journal tests24groups PASS; strict declaration-consumer TypeScript exit0 in `evidence/types.log`. These are metadata/unit compatibility checks, not actual shared publication, native measurement, human UI, Save/Open or E22 completion. No browser, native runtime, service, hosting or networking action was used in this slice.

The first boundary-fixture failure is retained in `evidence/before-boundary-fixture/`: the test padded the first selection ID to its16384-character maximum and then appended one byte, so the implementation correctly refused INVALID_REQUEST before the intended aggregate RESOURCE_LIMIT check. The corrected test appends to a remaining in-range ID. Both ASCII and multibyte exactly65536-byte definitions pass and65537-byte definitions refuse; the oracle was not weakened to accept an oversized field. No production change was needed for that fixture correction.

Reproduce from the repository root (Node24; substitute your installed paths):

```sh
node --test test/linked-part-drawing-definition/definition.test.mjs test/linked-part-drawing-definition/operation.test.mjs
node --test test/edge-treatment-journal/journal.test.mjs test/selected-profile-depth/journal.test.mjs test/source-plane-depth/journal.test.mjs
node node_modules/typescript/bin/tsc --strict --noEmit --module nodenext --moduleResolution nodenext --target es2022 test/linked-part-drawing-definition/types.mts
```

The `.mts` file is a compile-only declaration consumer, not a runnable authoring example. No full application TypeScript/build or signed workflow claim is made. Product/source/test/log SHA-256 pins are in `evidence/pins.json`.

Still OPEN: actual centered-hole cylinder/axis witness and semantic selection discovery, authoritative source/native resolution, current owner/build admission, derived projection/dimension cache, shared journal integration, native project adapter/version, actual agent/human surfaces, signed Save/sync/fresh Open and the full E22 acceptance. This slice deliberately changes none of Craft, projectManager, authoredEditJournal, common Worker, native code or Desktop.
