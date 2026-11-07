# Document display-unit checkpoint

Product source: `4ceb313f275ba43f54a8075a91666ed0b36c30bb` (parent integration `f7cd97430`). This slice adds document-owned millimeter/inch presentation. Canonical lengths stay millimeters and angles stay radians. Source expressions, authored history, feature IDs, counters, journal and material/geometry revision domains are unchanged.

`inspectDisplayUnits()` returns immutable `{revision,canonicalLengthUnit:'millimeter',canonicalAngleUnit:'radian',lengthUnit,angleUnit:'degree'}`. `setDisplayUnits({revision,lengthUnit},options)` uses the normal document lifetime/currentness guards and requires an idle closed sketch. Its receipt adds `changed` and `authoredUndo:false`; a no-op retains the revision. Loss of lifetime after a committed change carries `committed:true`. `getPresentationMetadata()` returns immutable `{version:1,lengthUnit:'inch'}` or `null` for default millimeters.

Native envelope metadata is optional and outside the manufacturing/material digest. Default millimeter saves omit it; explicit persisted millimeter metadata is rejected as noncanonical. New resets presentation. Open validates the full envelope in the actual production validation Worker, retains its presentation, and installs it only after successful replay and final restore guards. Manufacturing preparation explicitly preserves the captured presentation rather than dropping it when replacing the envelope. A display change invalidates a captured asynchronous Save without changing material fingerprints.

## Verification

Qualified Node 24 and TypeScript 4.7.4 were used. Full application TypeScript checking passed. The recorded TAP run contains **33 passing controls**: seven formatter/metadata/envelope controls, fourteen actual-manager controls, four actual dimension/measurement-method controls, and eight retained physical-quantity controls. No controls were skipped.

Build the private test artifacts, then run:

```sh
/tmp/codi-files-move-node/bin/node test/display-units/build-validation.cjs
/tmp/codi-files-move-node/bin/node test/display-units/build-formatting.cjs
/tmp/codi-files-move-node/bin/node --test --test-reporter=tap test/display-units/*.test.mjs test/physical-parameters/quantities.test.mjs
/tmp/codi-files-move-node/bin/node /tmp/codi-typed-common-transaction-20261105/node_modules/typescript/bin/tsc --noEmit --project tsconfig.json
```

Independent values include 25.4 mm = 1 in, 645.16 mm² = 1 in², 16387.064 mm³ = 1 in³, and π/2 radians = 90 degrees. Length, area and volume conversion use distinct powers of 25.4. Malformed fields/getters, stale revisions, lost lifetime, busy state, failed/cancelled restore, no-op, New and save-currentness are covered. The actual manager snapshot/Blob/validation-Worker/reopen path retains inch metadata; the native fixture is an empty project with explicit storage/pipeline/UI protocol doubles. The manufacturing hashing path uses the real incremental hash Worker. Geometry Worker creation is rejected by the fixture, and display setters create none.

`manager-fixture.mjs` transpiles the actual manager and preserves real codecs, lifetime helpers, preparation and hashing. It does not synthesize or qualify geometry. `formatting-entry.ts` imports actual workspace initialization before actual dimension classes. An earlier standalone entry exposed the existing cyclic-import initialization dependency; its failed receipt is retained in `formatting-entry-before.json`. The corrected entry matches normal application initialization and requires no product workaround.

## Scope and remaining qualification

Actual linear/radial/diameter/angle and signed projected-dimension methods, plus the real edge endpoint measurement/string formatter, are exercised without a canvas or DOM. Authored annotation serialization remains unchanged. Canonical-input forms and raw expressions retain their canonical semantics. Machine measurements and exports remain millimeters. Area/volume conversion is qualified as a formatter; no area/volume UI is claimed.

Actual painted annotations, genuine edge measurement controls, nonempty signed app Save/server synchronization/fresh Open, two-window isolation, human menu rendering, and end-to-end geometry/mesh invariance require the next combined signed-app run. An already-open measurement dialog contains its explicitly labeled measurement snapshot; reopen it to obtain the new presentation. Alternate legacy raw-project persistence remains unqualified. These tests do not establish full Gate 1 acceptance.

Subsequent signed-app result: sourcef770a52a5/desktopf4c4d63e5 now passes15
rows for real unit menus/public commands, exact canonical/native/mesh invariance,
zero new Worker dispatch, ordinary authored Undo, two windows/New and normal
Save/server sync/fresh Open. Six native snapshots and presentation-only saved
differences pass independent root checks. Evidence is in the desktop repository
at `test/agent-cad-corpus/display-units/RESULT.md`. Annotation paint, Worker-solid
MEdge measurement UI and broader unit-system coverage remain unqualified.
Fixture20922 was stopped and private test state/processes/targets cleaned.

`receipt.json` pins source and private test-runtime bytes. Generated bundles and large raw initialization context remain outside Git under `.build/display-units/`.
