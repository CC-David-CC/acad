# Owned loft Worker component

Final source is `c2cfde1d4` (exact source binding in `evidence-r2/source-binding.json`). The NEW final R2 output is `/mnt/data10tb/codi-loft-profile-component-assets-20261107-r2`: 37 files, bootstrap `1b21ec8ce4892ee2093d698dd5662cfc5cc540d9871bbeff3fdc9d1463833ff5`, embedded Worker `6080e859dbc19c8c9742f48db661d89b0a6b557ae30d125b5c2710678ce8429e`; native bytes remain 5ce2/b18. Fresh actual Chromium repeated the unchanged 13-positive/6-refusal/17-point corpus, six genuine-message fault controls, cancellation, 32-name and cumulative triangle limits, inherited sweep/revolve/query and both old-runtime loads on these exact bytes. `evidence-r2` and its offline checker pass; 68 Node groups plus six retained real-input staging controls pass, and full TSC has an empty log.

The only product change after the complete initial proof was aligning cache eligibility with the registered 32-character app-ID policy; a 32-character positive and 33-character no-store control pass. All three fixed bootstrap pin consumers moved together. Initial receipts and their source remain unchanged below and under `evidence-r1`; the earlier bootstrap snapshot is retained so the historical checker can verify its exact source after this narrow change. No geometry, tolerance, native, default or feature-history change was made.

Product checkpoint `c55eed3c3` adds an explicit `createLoftProfileOccMount(options)`; no catalog/default, ledger, Craft, desktop, or saved feature is changed. It uses native loft R4 JS `5ce2aa94ecdd48dc16f0b9c3ad2a065ea1416ddb7d123c3168661e31ade0a1b5` and WASM `b18af4376fb0fb8b4aaa7478ede6b47346c331ee45e1198347c0a70232fd4180`, already qualified separately on native branch `feature/owned-loft-v1-20261107` through `8be261af354758adb04b5b208eec3deedfbbe502`. No native rebuild occurred in this lane.

The initial 37-file component was staged on R730 at `/mnt/data10tb/codi-loft-profile-component-assets-20261107-r1`. Its manifest is `evidence-r1/component.json`: bootstrap `5842728f6a8ffab3682c19749e9cc42a7d099d9070cd8f94ea265c9439b81604`, embedded Worker `aecbe171a9800aaf4602749bf4036262e3843c94ee7296cf2ab3d1454ad498a3`. Every served file was independently fetched and checked for size and SHA before Chrome execution. Binaries remain on R730; no runtime binary is committed.

## Contract and placement

```js
{
  op: 'solid.profile.loft', version: 1, unit: 'millimeter',
  sections: [
    {source: {faceId, sourceSha256}, frame, region},
    {source: {faceId, sourceSha256}, frame, region}
  ],
  correspondence: {kind: 'polygon' /* or circle */,
    startA, reverseA, startB, reverseB},
  construction: 'ruled-solid'
}
```

Both sources must have distinct bounded face IDs. Each section uses the existing exact depth-free V3 face capture: a full circle or simple ordered Segment loop, no holes. Polygons require the same edge count; section planes must be parallel and separated. There is no automatic centering, source-plane relocation, seam selection, direction correction, or correspondence optimization. Polygon starts are transient zero-based vertices in the caller's captured ordered outer Segment list; the planner carries them through the existing clockwise normalization permutation, including traversal reversal. Circle starts are explicit radians within ±2π relative to each source frame's +X. These are component parameters, not durable authored IDs.

`captureOwnedLoftIntent` detaches/freezes exact own data before asynchronous work. `prepareOwnedLoft` runs inside the production Worker; both native section arrays and correspondence derive from that same snapshot before its canonical JSON is UTF-8 bounded to 1 MiB and SHA-256 hashed. The controller never hashes or serializes the full request. Binding metadata contains both declared source identities/digests, both opaque region IDs, exact correspondence, construction, and the canonical request hash, bounded to 64 KiB UTF-8.

The caller-supplied source hashes are declarations, **not** solved-source membership certificates. No source adapter, source feature identity, saved ordinal, topology naming, public app/history/Save/Open, or full E15 qualification is claimed. A later shared source adapter must corroborate actual authored IDs, both solved source captures, and the complete request independently. The current loft selection read truthfully returns `NO_AUTHORED_SOURCE_SELECTIONS`.

## W02 protocol states and invariants

One pending request owns one sequence, deadline, AbortSignal, candidate token and prepared binding. Its private substates are derived from whether that pending request has a prepared binding:

1. Preparation: no binding has been observed. Worker captures, validates, plans and hashes.
2. Native: exactly one `{kind:'loft-prepared',seq,binding}` has been emitted and admitted.
3. Completion: a genuine result must repeat exactly that binding; only then can evidence be validated and a handle published. There is no timer reset or separate preparation task/lifetime.

Only loft refusals add `phase:'preparation'|'native'`. The Worker derives phase from its successfully emitted binding; the controller requires phase to match its pending binding and applies the corresponding allowed-code list. Missing/unknown/mismatched phase and native-only failures before preparation close the mount. Overlapping resource codes are accepted only in the observed phase. Duplicate, unsolicited, wrong-sequence, wrong-operation, missing or altered progress/final binding closes the mount. `LOFT_INPUT_CHANGED` is fatal; ordinary supported refusal keeps the mount usable. Other operations keep their existing wire contracts.

This progress is trusted pinned Worker protocol metadata, not an independent adversarial certificate. Exact final/progress equality preserves signed zero and reads own data without invoking accessors. Cancellation after genuine progress/result closes the Worker and makes late replies inert; it does not prove interruption within a synchronous OCCT call. Input arrays are checked after the actual FFI; candidate names are released on failure/budget rejection. Existing native helper snapshots separately establish BRep/catalog/tolerance preservation.

## Results and limits

`evidence-r1/browser.json` is compacted from an unchanged raw receipt on R730; its raw SHA/path and all executed source hashes are retained. Actual dedicated Chromium with strict self/wasm CSP passed:

- 13 analytic native positives: rectangle taper, nonhomothetic rectangles, separation edit, clockwise source, reversed section order, translation, permuted frame, triangle, concave L, circular frustum, explicit equal seams, quarter-seam ruled circles, both circular traversal reversals. Independent volume/bounds assertions use absolute 1e-6 mm³/mm. Maximum errors were 2.9835053e-7 mm³ and 1.0000001e-7 mm. Seventeen genuine native point queries corroborate material/outside/boundary controls.
- Six genuine typed preparation/native refusals, with accepted input/source and unrelated retained native topology/display mesh unchanged. Twisted traversal returns actual `LOFT_SELF_INTERFERENCE`.
- Six controlled transformations of genuine Worker messages: duplicate/missing progress, changed source, changed final hash, missing native phase, wrong preparation phase. Every one refuses before publication and closes; no successful geometry reply was fabricated.
- Caller mutation after invocation preserves the initial request; disabling main-realm full-request serialization and digest still permits genuine loft success. Both cancellation points hold genuine messages only.
- Thirty-two successful lifetime results with normal disposal; creation 33 refuses before a new Worker post. Actual cumulative work accepts a 64,576-triangle candidate plus the initial 316-triangle body, refuses the next candidate at 100,000, preserves the retained native body and permits a small healthy continuation. The budget is cumulative result work, not peak memory, native allocation, or mesh manufacturing qualification.
- Inherited sweep, revolve and native point query execute on the new runtime. Separate actual old sweep `a9cf/e105` and selected V2 `cbd49/a81` runtimes load with the changed bootstrap/controller, execute a normal native extrusion and keep loft absent/unsupported. This is a focused retained-runtime smoke, not a repeated full old corpus.

All 11 Workers in the main run terminated, zero owned Worker targets remained, the dedicated browsers closed, and CSP violations were zero. Shared browsers 19329/19515 were never used or stopped. `resource.json`, `retained.json`, `retained-reproduction.json`, `staging-receipt.json` and logs retain the narrower controls independently. Full TSC completed with an empty log. Node tests: 40 new capture/protocol/loader groups plus 25 retained groups; 3 new fresh-output packaging controls; 6 retained real-native-input packaging controls. Packaging tests are ordinary sequential fixtures, not cancelled race/security probes.

The first browser harness requested an unsupported 60-second timeout; correction used the existing 30-second contract. Its original source/receipt remains under `before-r1`. The next checker expected `LOFT_INVALID_RESULT` for the twisted case, while actual native self-interference correctly returned `LOFT_SELF_INTERFERENCE` (also observed in the prior native probe). Its exact producing source/failed receipt remains under `before-r2`; only that expected typed reason changed. A packaging-test fixture initially omitted `displayProjection.mjs` and failed before its intended native checks; the fixture dependency was restored, with the failed source retained. No production code or geometry tolerance changed to obtain these passes.

## Verified runtime fetch cache boundary

The bootstrap now chooses `force-cache` only for exact canonical root URLs `/assets/desktop/apps/<lowercase-app-id>/<64-lowerhex>/<canonical-relative-file>`, with app IDs exactly `[a-z][a-z0-9-]{0,31}`. Canonical `+` filenames accepted by the backend remain conservatively `no-store` here; current native filenames do not contain `+`. `/hidden`, `/beta`, arbitrary prefixes, legacy/component URLs and noncanonical spellings remain `no-store`. Each body still has the same same-origin, credential-omission, redirect-error, size and cryptographic SHA checks. Only an eligible body integrity failure gets one `reload` retry; failed bytes are discarded, never executed, and a second failure closes. Network/status failures do not acquire retries. No CacheStorage, auth/private-file cache, MIME guarantee, or whole-buffer cache layer was added. Seven actual-loader VM tests establish this policy only. Actual backend immutable headers plus end-to-end replay caching remain a separate parent integration test.

Both retained fixed bootstrap-pin consumers (`prepare-selected-profile-assets.cjs`, `embedded-oci-worker.cjs`) changed together. The new loft stager independently checks the same pin and requires a fresh output. Prior B01 full `prepare-prism-assets.cjs` destructive staging remains explicitly unqualified/unmodified; the pure embedded helper's refusal does not prove full-script atomic preservation.

## Reproduction

Use local Node `/tmp/codi-files-move-node/bin/node` and the reviewed dependency symlinks for TSC. Run:

```sh
node --test test/owned-loft-worker/*.test.mjs test/owned-loft-worker/loft-staging.test.cjs
node test/owned-loft-worker/check.cjs test/owned-loft-worker/evidence-r2
node node_modules/typescript/bin/tsc --noEmit
```

On R730, stage without rebuilding native:

```sh
node build/prepare-loft-profile-assets.cjs \
  /mnt/data10tb/codi-occ-owned-loft-main-20261107-r4 NEW_OUTPUT
node test/owned-loft-worker/stage-retained.cjs \
  /mnt/data10tb/codi-occ-owned-sweep-main-20261107-r1 \
  /mnt/data10tb/codi-selected-profile-static-runtime-20261106/.build/selected-profile-assets \
  NEW_RETAINED_OUTPUT
```

Serve only the task-owned output on private loopback using retained `test/owned-sweep-worker/serve.py`, forward that loopback to local if needed, and run the separate `browser.cjs COMPONENT_JSON BASE_URL OUTPUT_JSON`, `resource.cjs BASE_URL OUTPUT_JSON`, and `retained.cjs RETAINED_BASE_URL OUTPUT_JSON` drivers with `PUPPETEER_CORE_PATH=/tmp/codi-occt-release-control/node_modules/puppeteer-core`. They launch and close their own Chromium, not shared CDP. `staging.test.cjs` requires `CODI_RETAINED_SELECTED_NATIVE` and `CODI_RETAINED_PRISM_ASSETS`; point them at retained code-only native inputs on R730. Never copy service/account state. Working runtime output, raw observations and source build inputs remain on R730, not Git.

The common TypeScript SolidKernel request/result vocabulary now includes the
qualified transient `LoftSelectedProfiles` request: exactly two ordered solved
sections, explicit correspondence and ruled-solid construction. `tsc --noEmit`
passes after this addition. This exposes the existing component protocol to
shared integration; it does not register a public command or save native vertex
ordinals in authored history. E15 shared authoring and persistence remain open.
