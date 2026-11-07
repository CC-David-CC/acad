# Selected-region descriptors — component qualification

Region discovery now returns each existing row with `descriptor: {outerCurveIds, holeCurveIds}`. IDs are local authored curve IDs scoped by the response `faceId`, matching sketch creation/inspection. Callers select a row by explicit boundary membership and pass its opaque `regionId` back unchanged. They never parse the region-ID grammar. Boundary lists represent canonical membership, not curve traversal or winding.

The Worker derives these lists from its existing normalized region records and a source-capture identity map. Geometry preparation and supported/unsupported decisions are unchanged. Unsupported rows retain their reasons and complete membership; nested boundaries may appear in different rows. The shared result validator requires dense, unique members within each row, correct outer/hole roles, ordinary current-stage Segment/Circle source IDs, and exact internal binding to the provider's canonical region identity. Returned metadata is detached and frozen. No centroid, area estimate, kernel index or new topology algorithm is involved.

Product ownership is exactly `selectedSketchProfile.mjs`, new `selectedRegionDescriptor.mjs`, and `selectedProfileCommands.ts`. The facade retains its two genuine source solves, two independent semantic inspections and existing source/revision/frame/currentness guards. Source-ID capture is bounded metadata work; geometric discovery stays in the Worker. The existing generic semantic-value envelope remains 65,536 encoded bytes. Added descriptors can exhaust it: the actual Worker returns `RESOURCE_LIMIT`, never a truncated/empty success. This limit applies to the semantic value; the public facade adds its existing fixed response fields.

Recorded results:

- 44 pure groups: 9 new descriptors, 11 retained discovery, 17 independent source preparation and 7 unchanged source controls. Includes disjoint intended-region selection, nested outer-plus-disk subset, reversed creation order, unsupported nine-hole outer with supported children, opaque Unicode IDs, regeneration and malformed/source-binding controls.
- Actual newly compiled production semantic Worker: nine requests, nine terminated Workers. Six positive cases include all 128 rows at exactly 65,536 bytes; 65,537 bytes refuses with `RESOURCE_LIMIT`. Wrong digest/frame refuse independently.
- Actual compiled client/capture modules in Chrome: detached frozen capture; malformed/source-binding refusal; a held genuine positive reply followed by currentness loss rejects with `AbortError`, terminates its Worker and leaves the late reply inert. A fresh genuine request then succeeds.
- Full TypeScript check and both actual builds exited zero. No native rebuild.

`evidence/browser.json` is the unchanged actual browser receipt. Build manifests record base HEAD `9efcd45a1` because these three source changes were uncommitted at build time. Their complete tracked source cohort and individual source hashes match this checkpoint; `source-coherence.json` additionally binds the R730 build checkout to local source. This is not a claim that the base commit alone produced the changed binaries. `check-results.mjs` independently verifies these source/receipt bindings offline.

The older discovery test requires exactly three row keys. Its retained copy changes only the fixture import location and adds the now-required `descriptor` key. The independent 17-case copy adds the complete current V3/descriptor import closure to its isolated source wrapper. Geometry/refusal assertions remain unchanged, and original files are untouched. Exact hashes/adaptations are recorded in `evidence/retained-adaptations.json`; initial incomplete-closure attempts are harness limitations, not geometry failures.

These are geometry-preparation fixtures, not public source admission or native solids. Actual client currentness is covered; app source-storage ABA, public lifetime, native geometry, Save/Open and public E04/E05 integration still require the source-matched combined app. Existing-feature region replacement and circle winding reversal remain unavailable; creation-order reversal does not establish winding support.

Run pure controls from the repository root:

```sh
CODI_SELECTED_PROFILE_CANDIDATE="$PWD/modules/engine/extrusion/selectedSketchProfile.mjs" node --test test/selected-profile-kernel/source-region.test.mjs test/selected-region-descriptors/descriptor.test.mjs test/selected-region-descriptors/retained-discovery.test.mjs test/selected-region-descriptors/retained-source-review.test.mjs
node test/selected-region-descriptors/check-results.mjs
```

Builds use `build.cjs` with an owned `CODI_DESCRIPTOR_BUILD` output and `CODI_DESCRIPTOR_KIND=worker` or `client`. Retained R730 output is `/mnt/data10tb/codi-selected-region-descriptors-20261106-r1/.build/{descriptors,descriptors-client}`. Browser runner requires `CODI_DESCRIPTOR_ASSETS` containing `worker.js` and `client.js`, a new `CODI_DESCRIPTOR_OUTPUT`, `CODI_TEST_CDP`, and `PUPPETEER_CORE_PATH`. It creates and closes only its own loopback server/context and disconnects from the shared browser. No public deployment or account state is involved.
