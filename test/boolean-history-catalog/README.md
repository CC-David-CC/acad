# Explicit Boolean-history catalog and type contracts

Base CAD `7453702eaa62f76cb34e61d0743f97272dabb426`. Ownership is only `modules/engine/mount/engineCatalog.mjs`, `modules/engine/solid/SolidKernel.ts` and this new directory. No default/factory/ledger/Worker/UI changes.

Registers `OCC_BOOLEAN_HISTORY_BUILD` with exact dd6669/8d5e53 native hashes, mount `occ-boolean-history-v1-component`, selected profile v3, edge treatment v1, Boolean history v1 and selection plan v2. Explicit validation requires profile v3, edge v1, common selection read v1 advertising plan v2, and all three Boolean v1 operations advertising `oci-boolean-history-mm-v1`. Existing revisions, defaults and validation requirements remain unchanged; no build is silently substituted.

Kernel types add a complete `BooleanHistorySolid` producer binding beside legacy `BooleanSolid`. Optional-never fields on the legacy variant prevent incomplete modern bindings from slipping through the request union. New common-read/result types describe v2 source contexts, origins, detailed first-failure evidence and aggregates without a top-level regionId. Old prism-read contracts remain. Native bounds may be null for genuine empty output. These types declare wire shapes, not geometric/native/public authoring support.

Validation: 6 new metadata-only catalog groups plus 2 existing selected-profile catalog groups PASS on Node 24.22.1. Strict TypeScript 4.7.4 NodeNext with exact optional properties passes positive legacy/modern contracts and required compile failures for partial producers, legacy/new mixing, missing origins, invented evidence inputs and mutable/wrong-version metadata. Stub methods never execute and claim no geometry.

```sh
node --test test/boolean-history-catalog/catalog.test.mjs test/selected-profile-kernel/catalog-build.test.mjs
node /path/to/typescript/bin/tsc --noEmit --strict --exactOptionalPropertyTypes --skipLibCheck --target ES2022 --module NodeNext --moduleResolution NodeNext test/boolean-history-catalog/contracts.mts
```

Runtime/Worker/browser qualification remains the separate frozen R2 evidence. This checkpoint does not qualify new authored holes, shared history/Save integration or full Gate 1.
