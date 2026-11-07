# Independent selected-owned production budget review

Reviewed source `89bc477e57ae89cfb33dca23fecc888ad8356825` in a read-only source tree. Test-only branch starts at `4c859b106`; no production files are copied/cherry-picked/edited. `source.mjs` checks exact SHA256 pins before loading actual production modules through the explicit `CODI_REVIEW_SOURCE` path.

**No concrete product blocker found in this bounded review.** This is independent source/policy/protocol evidence, not a new native geometry, browser or production release proof.

## Findings

- Selected-owned mounts and native safeOwnedMode use32 monotonically reserved names; legacy mounts remain8. Disposal does not refund lifetime reservations. Failed requests can consume a reservation, so32 is an upper bound rather than a promise of32 successful results after arbitrary retries.
- Native `chargeSelectedResult` runs after actual summary and before exposing a result in `shapes`/posting it. It charges each native name once. At cumulative100000 accepted result triangles, a new positive result is released by `_ReleaseOwnedShapeV2` and the exact native-owned-name decrement is checked before RESOURCE_LIMIT. Existing input names and charge state remain intact. Release failure becomes an ordinary engine error, which the parent closes; it is not mislabeled as a safe budget refusal.
- Native map and parent mirror retain accepted cumulative charges after per-shape disposal, including zero-triangle results consuming name entries. Mesh reads must match the originally charged count and do not recharge. Parent quota/evidence disagreement shuts the mount down; a genuine Worker RESOURCE_LIMIT refusal leaves the mount open so existing inputs remain available. Shutdown terminates the Worker and clears parent handles/records/accounting. This source inspection does not measure browser heap reclamation.
- Parent captures the reply header and rejects any non-string error before message coercion. Independent nested-toString/header-error getter controls both record zero getter reads and an engine shutdown. Ordinary string RESOURCE_LIMIT details survive for selected box requests, are truncated to512 characters, and do not close the mount. Legacy refusal routing does not gain the selected capability.
- The pure history estimator counts only selected-runtime OCC generic operations with exact engineRevision; legacy rectangle/hole/enclosure operations are separate-mount costs. Unknown types and incompatible generic engines/builds are explicit. It is a cost estimate, not a history/geometry validator. At this reviewed source it is exported but has no production call site; do not describe it as user-visible discovery/admission yet.
- 100000 is cumulative **accepted unique-result triangle charge**, not a CPU-work/peak-heap/RSS ceiling. A rejected output has already been computed/tessellated before charge, and repeated mesh reads still perform work. Native allocation, interpreter caches, transient Boolean/tessellation memory and transfer buffers need their separate existing limits/qualification. No memory or whole-CAD scalability claim follows from the numeric quota.

## Asset/source boundary

The actual source bootstrap SHA `139ed494d36e25cfeaa1765bf8178a6725517d9bc311f53899a4a832560746fb` matches `build/prepare-selected-profile-assets.cjs`. Native glue remains `cbd49d63…`, WASM `a81af0b7…`; native geometry engine revision is unchanged by the wrapper policy. The owner production browser harness expects emitted selected Worker `dd60fbf4d31186ca8ac739d59af8be45355a7005d22575575cee9f9602d8da25`. This independent lane did not regenerate or serve that binary asset and makes no new generated-asset proof. Final app/distribution must pin the newly emitted Worker and all selected helpers; an older8-name Worker is not a substitute merely because its native glue/WASM revision matches.

The separately identified legacy preparer stale-bootstrap-pin repair belongs to the owner's build lane. This review does not fix it or promote any default/native asset.

## Tests

Five policy/actual-function tests pass: exact quota/duplicate-read accounting, zero outputs/lifetime entries, close/no reopen, engine-specific estimate/accessor refusal, actual Worker charge helper over-budget release and failed-release classification. Worker helper tests evaluate the unchanged source in Node VM with a synthetic native ownership ledger; **no actual geometry or native release proof** is claimed by those doubles.

Five transport controls load the actual production controller with synthetic Worker envelopes. They prove string refusal detail retention,512-character truncation, two accessor refusals and unchanged legacy8 descriptor/error behavior. All five constructed mounts close and their Workers are terminated. These controls do not forge a successful native shape.

Run with Node24, no npm dependencies:

```sh
CODI_REVIEW_SOURCE=/path/to/exact-reviewed-CAD node --test test/selected-profile-budget-independent-review/accounting.test.mjs
CODI_REVIEW_SOURCE=/path/to/exact-reviewed-CAD CODI_RECEIPT=/tmp/refusals.json node test/selected-profile-budget-independent-review/refusal-review.mjs
```

Exact file pins, scope and observations are retained in evidence/. No browser/CDP contexts, listeners, services or native engines were started in this lane. Production source and the source-only beta successor were not modified.
