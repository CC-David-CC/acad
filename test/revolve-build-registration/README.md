# Explicit experimental revolve build registration

Product a9ff4ba24 registers `OCC_REVOLVE_PROFILE_BUILD` without changing
DEFAULT_CAD_ENGINE or preferredCadEngineBuild. The engine remains OCC; the preferred
new-part revision stays Boolean-history dd6669/8d5e53. Existing revisions retain
their exact identity. Only an explicitly supplied new revision selects this mount.
There is no automatic fallback, conversion, per-feature engine switch or promotion.

The new spec uses mountEngine `occ-revolve-profile-v1-component`, exact native
JS567419c13c78fff46cbc9cd07e5a993106b652a13cb9f6944831f68ef48729cc and
WASMad9475c81ea2eecadd41c73f0b0860d7d06c53e4292b16047472f03995f3efdd.
Markers are selectedProfileVersion3,edgeTreatmentVersion1,booleanHistoryVersion1,
selectionPlanVersion2,throughHoleVersion1,linearHolePatternVersion1,revolveVersion1,
experimentaltrue. Mount validation requires all retained native operation bindings
and exact revolve v1 input/output/source qualification. No raw solved geometry or
native handles are added to document formats.

The existing constructor, common Worker, stager and resource-entry generator are
reused. Factory admission requires the exact17-module emitted closure in the same
package directory as native assets. The new wrapper only orchestrates those two
existing build steps. Webpack emits the new tree under `revolve-profile/`; old
asset paths and strict graphs remain unchanged. Native bytes are not rebuilt.

## Required build inputs

Supply the reviewed native pair as `occ-portable.js` and `main.wasm` inside
CODI_REVOLVE_NATIVE_DIR. Missing or mismatched inputs fail explicitly, never select
another build. No workstation path is embedded in product/build source.

```
CODI_REVOLVE_NATIVE_DIR=/path/to/reviewed/native-pair npm run build:revolve-profile
```

`build:prism-workers` invokes that named script after the retained builders and
also needs the existing CODI_POLYGON_NATIVE_DIR, CODI_MECHANICAL_NATIVE_DIR and
CODI_BOOLEAN_HISTORY_NATIVE_DIR plus reviewed native caches. The successful private
R730 stage is `/mnt/data10tb/codi-revolve-catalog-registration-20261106-r1`:
CODI_EMBED_NUMERIC=1,CODI_EMBED_MANIFOLD=1; qualified Node24 at
/mnt/data10tb/codi-3mf-qualification-SrUmue/node/bin. Exact native input paths:

- Revolve: /mnt/data10tb/codi-occ-owned-revolve-main-20261106-r2
- Polygon: /mnt/data10tb/codi-revolve-catalog-registration-20261106-r1/.build/native-inputs/polygon
- Mechanical: /mnt/data10tb/codi-revolve-catalog-registration-20261106-r1/.build/native-inputs/mechanical
- Boolean: /mnt/data10tb/codi-revolve-catalog-registration-20261106-r1/.build/native-inputs/boolean

Retained pairs were copied/hash-checked as inputs before regenerating outputs.
Native/source/dependency inputs contain code only. No accounts/keys were copied.
The first build failed on an old copied readonly raw-SMLib generated WASM. Removing
only that owned generated output allowed a fresh full build. A repeat invocation
then independently confirmed the existing raw builder's readonly-output copy bug;
its repair is a separate follow-up, not a native/geometry defect. Original logs are
retained and native caches remain untouched.

## Actual qualification and scope

Metadata admission, malformed descriptors/native input, unchanged default and old
catalog controls pass15/15; TypeScript passes. These metadata fixtures are explicit
doubles and do not synthesize geometry. The real normal `build:prism-workers` then
passes using all pinned inputs, followed by actual factory and ordinary app builds.

The frozen factory artifact contains72files/219826213B. All files are SHA/size
checked before real Chromium execution. Through the REAL compiled createCatalogMount
and validateEngineMount, tests execute:

-12 actual revolve cases and29 native classifications: stepped/concave profiles,
 full/partial/reverse angles, torus/annular torus, oblique frame, cone pole and
 source/axis/angle changes. Independent analytic volume/bounds and material/void
 oracles are unchanged from the qualified native component.
-6 domain/resource refusals, malformed request, immutable caller capture,
 preserved retained input, stale handle and honest unavailable revolve selections.
-32 lifetime results+33rd no-post refusal,100k aggregate triangle budget with
 healthy continuation, genuine successful native reply held through cancellation,
 disposal and zero surviving owned Workers.
- Retained centered/corner holes, outer treatments and linear pattern with21
 native point checks and8refusal controls; retained five-cut/edge Boolean chain
 with66native point checks, empty/multisolid continuation and input preservation.
- Six older-build factory box smokes (five OCC revisions and Manifold), exact
 bounds/volume24, disposal/stale handles; unknown revisions, wrong engine and
 five invalid asset graphs refuse before constructing any Worker.

The private recipe adapter only calls the actual catalog factory; it supplies no
geometry/Worker replacement. Request IDs are component labels, not public source
or saved authored-history proof. No public E13, history replay, Undo/Save/Open or
geometry UI qualification is claimed. Root's later ledger/core integration is a
different source and needs its own composed proof.

Native facts and display measurements remain separate. The old legacy build lacks
nativeVolume; this remains unknown. Manifold reports mesh-kernel volume, not OCC's
signedVolume. The first browser run correctly failed an incorrectly universal
signedVolume-field oracle after all six old box results were recorded. R1 is
retained; R2 uses each backend's documented measurement field plus identical
independent24volume/bounds/triangle oracles. No product change hid that failure.

Other setup failures remain: initial factory invocation used the wrong process cwd
for Babel config; initial ordinary build passed CLI `--devtool false` as an invalid
string. Correct cwd and a test-only config setting Boolean false fix those without
product changes. The ordinary entry has no helper/test exports.

Ordinary app dist output is94files/282318459B, including35985146B of new revolve
assets; it is53225861B below the existing320MiB outer app-package ceiling before
outer packaging. This is measured ordinary output, NOT acceptance of the eventual
desktop package. No ceiling is raised. All ordinary files are pinned separately.

## Reproduction/custody

Factory entry and real Worker recipes are private tests. Use reviewed Node24 and
puppeteer-core24.35.0, an owned Chromium, and the strict-CSP loopback server.

```
node --test test/revolve-build-registration/*.test.mjs test/boolean-history-catalog/catalog.test.mjs test/selected-profile-kernel/catalog-build.test.mjs
node node_modules/webpack/bin/webpack.js --config test/revolve-build-registration/webpack.factory.cjs
python3 test/revolve-build-registration/prepare-fixture.py /tmp/factory-runtime-pins.json
python3 test/revolve-build-registration/serve.py .build/revolve-catalog-factory 20943
PUPPETEER_CORE_PATH=/path/to/qualified/puppeteer-core node test/revolve-build-registration/browser.cjs /tmp/new-receipt.json http://127.0.0.1:20943/ /tmp/factory-runtime-pins.json
```

runtime-pins.json binds emitted modules, native bytes and source. browser-r2.json
is compacted only after full original-array assertions pass; native metrics/catalogs
and point observations remain. Full raw receipt is SHA-verified on R730 beside the
frozen factory assets. No browser restart, shared19329 use, private account state,
deployment, engine default or native binary change occurs in this lane.
