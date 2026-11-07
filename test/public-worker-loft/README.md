# Shared loft coordinator and optional catalog factory

Product checkpoint `4f0c9d145` is based on `45000c06d`, source-envelope/proof commits `4e65e7e20`/`92572be2c`, and the independently reviewed provider identity correction `25a17f00b` (parent `904a28409`). `baseline/copy.json` pins the root's original coordinator draft before the bounded integration changes. This directory owns component tests, not a signed desktop acceptance or completed E15 claim.

The four methods are `inspectWorkerLofts()`, `inspectWorkerLoftRegions({revision,faceIds:[A,B],engineRevision}, options)`, `createWorkerLoft({revision,version,unit,engine,engineRevision,sections,construction,bodyPolicy}, options)`, and `inspectWorkerLoftHistory()`. Creation allocates `featureId` through the existing shared operation. Saved intent is the existing eight-field `ownedLoftFeature` record; neither source frames/digests nor response-local corner ordinals are persisted. Both distinct source faces are captured before asynchronous work, then checked against revision, lifetime, source bytes/frame, services and streams. The existing shared solve, semantic preparation, operation, ledger, budget and candidate publication paths are retained.

`commandSections` captures own-data, dense host/iframe-realm records before the strict saved-feature helper; it does not parse opaque IDs. Discovery uses four genuine source solves and two genuine semantic inspections. Source membership/domain qualification remains distinct from native correspondence/placement/solid feasibility. Inspection remains permitted at capacity; creation checks the selected-owned lifetime budget first. There is no scalar loft-edit API or invented edge-selection naming.

The normal build includes loft assets only with explicit `CODI_LOFT_NATIVE_DIR`. Without it, webpack resolves a static null module even if an old generated entry exists; public readiness is false with an unavailable reason and an empty build list. The workbench/factory refuses a saved loft whose runtime is unavailable, rather than switching builds. The existing default and old build identities are unchanged. With it, `prepare-loft-assets.cjs` checks the reviewed native hashes, freshly reproduces any retained stage before reuse, validates every staged file, and emits the closed 25-resource graph. A stale/corrupt stage refuses without replacing it. This adds an optional wrapper; it does not repair or claim atomicity for the older full prism stager's documented B01 behavior.

Frozen evidence in `evidence-r1`:

- Coordinator: 11 Node test groups pass after the provider-identity fix. All 53 genuine production solver/semantic Workers terminate. Accepted native submission is intentionally **not** synthesized: the service boundary records exact submission then throws `NATIVE_NOT_RUN`. Creation/lifetime/source-ABA/malformed-reply tests therefore prove admission and currentness, not a native model or public history.
- Missing-runtime factory: 4 groups pass, including no Workers/empty discovery, stale-entry exclusion without the flag, no native input read in disabled preparation, and bad native input preserving the entry. Other engines' URL imports in this boundary fixture are inert stubs and are never constructed.
- Real optional staging: 4 groups pass on the own R730 tree: fresh/repeat reuse, disabled/enabled entry, wrong native bytes, stale manifest, changed staged payload, and exact approved input hashes. These are ordinary sequential build-input controls, not filesystem race/security probes.
- Actual Chromium catalog factory: the real `createCatalogMount` and `validateEngineMount` load the emitted graph, create a rectangular taper (3500 mm³) and circular frustum (280π mm³), read native topology/display mesh, preserve request bytes, release each owned shape, reject a disposed handle, and close the sole Worker. Native validity is true, solid count is one, CSP has no violations, and no owned Worker targets remain. This uses component geometry/source labels; no actual saved sketch membership, source-feature history, app UI, Save/Open, or complete Gate1 result is claimed.
- The 27 retained feature/catalog/journal/ledger admission groups pass. Full TypeScript check has an empty error log. Two actual normal-app compiles also pass with source hashes unchanged during each build: disabled loft emits no loft resources even while its stage exists, and enabled loft emits all 25 exact resources. Parent integration still owns signed app acceptance.

`factory-inventory.json` binds factory build inputs before/after and every served file. All 25 emitted resources are byte-identical to their reviewed staged inputs, including native glue `5ce2aa94…` and WASM `b18af437…`. `resource-size.json` records 36,063,282 added resource bytes, excluding the main JS delta. With the parent-provided existing package total 334,085,580, the minimum becomes 370,148,862 bytes, exceeding the 320 MiB cap by 34,604,542. No cap was raised, old runtime removed, or production artifact promoted. This measurement froze the original 320 MiB boundary. The parent subsequently explicitly approved a 512 MiB trusted app-inventory ceiling and owns the matching Desktop/backend change; user-file and native work budgets are unchanged. This branch does not change either admission ceiling.

The initial factory test used production minimization while the normal app uses development/no-minification mode. It passed native execution but altered emitted JS asset hashes. Its source/receipt remain under `before-normal-mode`; final pins, source-before/after checks, size and factory proof use normal mode. The embedded glue identity is checked at build time, and the exact WASM body is checked by the real Worker before execution.

Reproduce with existing code-only dependencies and an own cache (Node 24.22.1, webpack 5.74.0 in the recorded environment):

```sh
node test/public-worker-loft/build.cjs
node --test test/public-worker-loft/service.test.mjs
node test/public-worker-loft/build-factory.cjs
node --test test/public-worker-loft/availability.test.cjs
node node_modules/typescript/bin/tsc --noEmit
CODI_LOFT_NATIVE_DIR=/path/to/reviewed/native node build/prepare-loft-assets.cjs
CODI_LOFT_NATIVE_DIR=/path/to/reviewed/native node --test test/public-worker-loft/optional-stage-real.test.cjs
CODI_LOFT_NATIVE_DIR=/path/to/reviewed/native node test/public-worker-loft/build-factory-browser.cjs
python3 test/public-worker-loft/factory-server.py .build/public-worker-loft/factory-browser 32903
PUPPETEER_CORE_PATH=/path/to/puppeteer-core node test/public-worker-loft/factory-browser.cjs http://127.0.0.1:32903/ /tmp/loft-factory.json
node test/public-worker-loft/measure-assets.cjs .build/loft-profile-assets/component.json .build/public-worker-loft/factory-browser/inventory.json /tmp/loft-size.json
node test/public-worker-loft/check.cjs
```

The R730 binary provider is `/mnt/data10tb/codi-occ-owned-loft-main-20261107-r4`; no native rebuild was used. The own code/build tree is `/mnt/data10tb/codi-shared-loft-core-20261107`; its source commit is pinned in the evidence. Runtime binaries remain outside Git. The dedicated browser, own HTTP server and own SSH forward are closed in `cleanup.json`; shared browsers/services are untouched.

## Full normal compile follow-up

`normal-disabled.json` records both ordinary index/sketcher entries (117 emitted files, 319,427,848 bytes) with no loft resource. `normal-enabled.json` uses the release's ordinary single index entry (141 emitted files, 333,542,694 bytes), explicit native provider, and every added loft resource byte-identical to the staged manifest. The index SHA256 is `2b42a1d629a5c2ace74e0d763f4c2b08851d2e9a97114e5299869b32ce01a9f8` (34,038,891 bytes). These are webpack output totals, not a final Desktop package inventory, and entry differences mean their subtraction is not the package increment. The independent 25-resource accounting above remains the increment measurement.

Both builds use own copied code-only `.build` prerequisites from qualified R7 `594cc042b`, own copied numeric/Manifold cache, and freshly rebuilt current-source sketch, semantic and project Workers. No shared cache, root artifact or existing provider was overwritten. `compile-app.cjs` checks the tracked production source cohort before/after, records exact source and Worker hashes, and verifies every emitted loft resource (or its absence). Outputs remain R730-only at `.build/public-worker-loft/{normal-app,with-loft-app}`; no native/provider rebuild, account state, browser run, signed bundle or runtime promotion is part of this follow-up. The 512 MiB policy is the parent's separate explicit change.

```sh
node test/public-worker-loft/compile-app.cjs disabled /tmp/normal-disabled.json
CODI_LOFT_NATIVE_DIR=/path/to/reviewed/native node test/public-worker-loft/compile-app.cjs enabled /tmp/normal-enabled.json
```
