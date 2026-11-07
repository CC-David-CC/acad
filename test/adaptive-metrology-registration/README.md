# Explicit adaptive native metrology build

Product `e8432ec3c` registers `OCC_ADAPTIVE_METROLOGY_BUILD` as an experimental, separately selected OCC revision. It retains the old loft build and all existing saved pins. Default engine and preferred new-part build are unchanged; histories must still use one exact registered revision, including consumed/empty outputs. No feature silently substitutes this build.

The new cohort is qualified native branch `feature/owned-adaptive-metrology-v1-20261107`, tip `39d4790797ce241f8d18730142735eac075d36ca` (native product `4d086f46`). Normal raw JS `2bd938544cb4721998d897be923282996b69bb8101a30ac59ba54461dea0ce39` is adapted only by the reviewed exact single exchange-callback replacement, yielding `ed06b634a3e81f9a51c89f75b3d65e03b8ace1fc483900ea2858eae8eff970a4`. WASM stays exactly `bc8895ceb123e33aad68c8a1cf6322b5c0ccef9bfb129207defe1b8a5a7c893a`. The adapter verifies both original hashes, exactly one replacement and the resulting hash before exclusive output creation. No Native C++/STEP/HLR/default is changed here.

`createAdaptiveMetrologyOccMount` uses the existing common OCI Worker/controller, planner and binding paths. Its descriptor explicitly declares checked adaptive volume properties, Eps `1e-10`, `OnlyClosed=false`, `SkipShared=false`. This is reporting policy, not an ideal-geometry error bound. The catalog requires that exact descriptor plus all inherited V3 prism/edge/Boolean/through-hole/pattern/revolve/sweep/loft bindings. Old constructors retain their original native digests and descriptor fields.

`CODI_ADAPTIVE_METROLOGY_NATIVE_DIR` explicitly selects normal asset staging. It must contain reviewed `occ-portable.js` and `main.wasm`. Missing configuration emits a null optional entry; missing/unreviewed configured inputs refuse. Cache reuse compares a freshly reproduced complete source/byte manifest, not an editable cache assertion. `build:adaptive-metrology` is appended to `build:prism-workers`. Normal webpack aliases/resources/declarations keep the package graph closed and colocated. Old and new loft builds are discoverable only when their respective assets are staged; inherited revolve/sweep/point availability checks enforce the same new optional package. No unavailable old part is converted to the new revision.

The common bootstrap changes from `1b21ec8ce4892ee2093d698dd5662cfc5cc540d9871bbeff3fdc9d1463833ff5` to `43d6df94938ede990cb39f22aeaf73e6e3988cab6c993ce581c994699447dd4e`. Existing hardcoded pins in `embedded-oci-worker.cjs`, `prepare-selected-profile-assets.cjs` and `prepare-loft-profile-assets.cjs` are updated together. Other component stagers derive the current source hash in their manifests; their native byte pairs do not change. Historical generated cohorts/receipts are retained, not relabeled as the new source.

The Worker recognizes only exact data `{version:1|2|3,error:'MEASUREMENT_PRECISION_UNRESOLVED'}` from the native reporting seam. It posts structured terminal error and closes; the controller preserves this code and shuts down the candidate. Extra fields, accessors, wrong versions and free-form text do not become a typed precision diagnosis. No zero/null/native substitute or coarse fallback is introduced. The new naturally unresolved native case is not observed in this corpus: terminal-code negatives are explicitly protocol/VM-helper injections, not claimed native incidents.

## Proof

- 39 new/retained protocol, catalog, own-data and sequential stage controls pass, plus six retained selected/default staging controls, seven retained loft/history-policy controls, four retained point-admission controls and one real-build-object point-policy admission control. These admission/transport doubles never supply successful geometry.
- Fresh normal adaptive staging repeats byte-exactly; malformed input preserves the existing generated tree and entry. Actual retained selected native bytes and default embedded helper remain pinned. Regenerated prism assets retain legacy native JS a84/07d and Manifold digests.
- TypeScript noEmit and ordinary webpack factory/resource build pass. The actual factory emits 144 files / 328,173,383 bytes, of which adaptive metrology is 36,069,441 bytes and old loft is 36,065,129 bytes. This is an asset-only factory, not the full app. Only 7,370,937 bytes remain below a 320MiB ceiling before other normal app resources; root must measure/refuse any oversized combined app, not relax the ceiling from this proof.
- Actual compiled factory/Chromium/Worker proof is in `../adaptive-metrology-worker/evidence-r1/`. It covers 14 genuine loft cases, six refusals, held cancellation/late replies, 32-name capacity, genuine retained sweep/revolve/point operations, malformed progress/final controls, all Worker termination and strict CSP. Component IDs/digests are fixture labels, not proof of authored sketch membership.
- Separate actual old/new factory comparison preserves the old known failing report `785.3981615793532`, while the new report is `785.3981630662182`, passing unchanged absolute `1e-6 mm³` against independent `250π`. Complete response-local topology, Float64 preview mesh and three native classifications are exactly equal across cohorts. Native BRep/tolerance preservation is established separately in the pinned native proof, not inferred from preview equality.
- Real wrong-WASM-byte/pair failures never reach ready and terminate. Missing/wrong module-table paths refuse before allocation; a subsequent healthy native box succeeds. A separately compiled production factory with both optional selectors absent exposes neither loft cohort and refuses all ten create/inherited availability calls with zero Worker allocations.
- Actual regenerated default a84/07d component with current common source preserves eight-name behavior (eight boxes, ninth `RESOURCE_LIMIT`), correct mesh signed volume and termination. This is not a repeat of every old native/legacy profile operation.

No Craft/journal/ledger/plane/Desktop/shared app operation or public deployment is changed. The source-bound app replay/Undo/Save/Open qualifier and final package ceiling belong to root's later combined build. The native result residual remains; this is not all-shape metrology qualification.

## Reproduction

Use Node24 and existing reviewed dependencies; no downloads. Run only in a fresh task-owned stage. The native wrapper's input is explicit and fixed hashes fail closed.

```sh
python3 build/adapt-adaptive-metrology-portable.py /reviewed/native/main.js /new/owned/native/occ-portable.js
# Copy exact reviewed main.wasm alongside that new portable JS.
CODI_ADAPTIVE_METROLOGY_NATIVE_DIR=/new/owned/native npm run build:adaptive-metrology
CODI_LOFT_NATIVE_DIR=/retained/old-loft npm run build:loft-profile
CODI_ADAPTIVE_TEST_NATIVE=/new/owned/native node --test test/adaptive-metrology-registration/catalog.test.mjs test/adaptive-metrology-registration/native-error.test.mjs test/adaptive-metrology-registration/prepare.test.cjs test/owned-loft-worker/protocol.test.mjs
node node_modules/typescript/bin/tsc --noEmit
CODI_ADAPTIVE_METROLOGY_NATIVE_DIR=/new/owned/native CODI_LOFT_NATIVE_DIR=/retained/old-loft node node_modules/webpack/bin/webpack.js --config test/adaptive-metrology-registration/webpack.factory.cjs
```

R730 stage is `/mnt/data10tb/codi-adaptive-metrology-registration-20261107`; generated native input `.build/adaptive-native`, own current components `.build/{adaptive-metrology-assets,loft-profile-assets,adaptive-legacy-smoke}`, factory `.build/adaptive-catalog-factory`. Dependencies/cache copies came from qualified retained inputs; input native/cache files are unchanged. Existing other prerequisite factory assets were copied from frozen loft R8 and are explicitly not retagged as new common Worker tests. All ordinary new/old loft tests use the freshly staged current source.

Failures retained: the prior exact-one-entry loft catalog assertion became obsolete when adding a second registered build; only that exact list/import is updated to two, with old identity/capability oracles intact. The point-policy test's first loader stub incorrectly rejected an existing model import; correcting the negative-only loader retains its original `NATIVE_NOT_RUN` boundary and assertions. An initial legacy stager invocation supplied `occ.wasm` under a `main.wasm` contract and refused before creating output; `stage-legacy.cjs` makes a verified own copy with correct names. These are test/build invocation issues, not hidden native successes. Historical failed app loft metric evidence remains separate.
