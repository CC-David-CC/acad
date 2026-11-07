# Boolean-history Chromium component corpus

Status: **PASS**, actual Chromium component on frozen root source
`b3df63ad39f96e364a577f07eea7fd00d173bcaf` and 23 declared assets, manifest
`8271c25a93245326afb617725faa108477d9f21ef07e335492ac3d38b08e7118`.
Both plates, 10 cuts, four treatments, 132 native point classifications, 22 retained
ancestor observations, all refusal/continuation controls and four Worker lifetimes
passed on the first actual run. The native inputs
are fixed to portable JS `dd666902fe926d69cc3c8843f5568c2a3e569f38ff49291baa2f248165b5ea99`
and WASM `8d5e537e0d7f9e12b8ae0eaf239c0be1080934ed12a24bf6e7f849c9135ed5a2`.
This tests real solved-request component geometry, not public sketch authoring,
semantic through-all intent, feature history, native Save/Open, UI or Gate1.

`cases.mjs` defines independent 100×50×20 and 150×30×20 fixtures with stable
fixture source IDs. Each starts as an actual V3 rectangle extrusion. Five actual
circle extrusions extend from z=-1 to z=21; five real subtract operations make
one R5 central bore and four R2 bores at 8mm corner offsets. Actual discovered
outer connector keys pass through every cut, then select two opposite R3
fillets and the other two distance-1 chamfers. No ordinal or proximity matching
assigns the identities. Geometric positions are independent verification data.

The analytic final volume is
`width*height*20 - 41*pi*20 - 2*20*9*(1-pi/4) - 20`.
Checks cover the actual construction-source binding, exact native catalog and
transferred mesh snapshots of both inputs and retained ancestors, every stage's
volume/bounds/validity/solid count, native bore/corner classifications, five bore
and two blend cylinders, flat six-origin selection context, first-failure
unresolved identity preservation, and clean Worker/handle disposal.

Separate actual controls cover disjoint two-solid union and continuation,
empty common and union with an independent new profile, identical union,
missing/wrong producers, unknown/stale selected IDs and healthy continuation.
Naming is permitted to be explicitly unavailable on non-plate control outputs;
that never changes the expected successful native geometry. Empty mesh and
native topology observations are explicitly required, not synthesized.

Run only on a private loopback serving root and an owned Chrome process/context.
`pins.mjs` requires the independently supplied component manifest SHA and a small
paths JSON containing `constructorPath` and `mountOptions`. Every path must
already exist in the closed component inventory. `browser.cjs` independently
streams and verifies every served file before opening a context and binds its
own source hashes before/after execution. Example once frozen:

```sh
node test/boolean-history-browser/pins.mjs /path/component.json MANIFEST_SHA http://127.0.0.1:PORT/ /path/paths.json /path/pins.json
CODI_COMPONENT_PINS=/path/pins.json CODI_TEST_CDP=http://127.0.0.1:CDP/ PUPPETEER_CORE_PATH=/path/puppeteer-core CODI_RECEIPT=/path/receipt.json node test/boolean-history-browser/browser.cjs
```

No existing tests or product files are changed. No Files/network/deployment or
filesystem-race testing belongs to this lane. A failure remains in its original
receipt; any corrected test precondition or product runtime gets a new receipt.

Recorded proof: `evidence/observed.json` contains complete compacted actual
browser observations, including native catalogs, selection plans and every
transferred Float64 mesh coordinate. `evidence/receipt.json` binds the unchanged
original 17,943,188-byte raw receipt SHA and portable observation SHA. Run
`node test/boolean-history-browser/check-observed.mjs` to replay the same
independent assertions without a fresh browser/native run. All naming on empty,
multi-solid and identical controls was actually available; the harness also
permits explicit unavailable naming without misclassifying successful geometry.

The own Chrome19432/server46345 and temporary profile were removed; shared
Chrome19329 stayed alive and untouched. Frozen component and original raw
receipt remain outside Git for review. No runtime binaries are committed.

## R2 source-matched repeat

**PASS** on corrected source `614d0a93da107cf8aa36b8ca8ca29b757c8fd56f`,
frozen 23-asset manifest
`dc2b5ab2c64a1b1e604a95bf43f9e29a006e84716e8e8a11bcd8dc3949e7935d`.
The native JS/WASM remain exact dd666/8d5 above. Parent changed three refusal
allowlists; this repeat binds the changed Worker/controller bytes. Every test
source hash and assertion is identical to R1. Both plate volumes, 132 native
point checks, six origins, 22 retained ancestor observations, ordinary
empty/multi/identical geometry and producer/selection refusal controls passed
again. Four actual Workers terminated and no owned targets remained.

R1 evidence is unchanged. R2 complete compact observations and pinned original
raw-receipt hash are under `evidence-r2/`. Replay with
`node test/boolean-history-browser/evidence-r2/check-observed.mjs`.
Own Chrome19432/server37679 and profile were cleaned; shared19329 stayed alive.
The component scope still excludes public authoring, semantic hole intent,
feature graph persistence and full Gate1 completion.
