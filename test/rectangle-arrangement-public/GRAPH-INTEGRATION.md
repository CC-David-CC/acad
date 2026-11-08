# Arrangement source graph and capability wiring

Source-only supplement to productcc716fc / workflow953d76a. **No checks, tests,
TSC, build, staging, browser or Native compilation were run. No hardcoded digest,
Native JS/WASM pair, mount identity or default was changed.** Root must install
actual pins only after coherent main integration, then perform the normal build
and complete public workflow. The frozen driver/oracle/README remain unchanged.

## Closed modern emitted graphs

All10 existing `build/*-assets-entry.cjs` module arrays now explicitly emit:

- `modules/engine/extrusion/selectedArrangementDescriptor.mjs`
- `modules/engine/mount/arrangedPrismSelectionIndex.mjs`

The same two paths are in every corresponding strict factory required-module
array in `modules/engine/mount/catalogMount.ts`. The common
`stage-owned-profile-component.cjs` stages the actual arranged-index source root;
its normal static traversal captures the metadata helper and all its real
dependencies. Existing `assertOwnedProfileResourceClosure` and source/file byte
checks remain unchanged and apply to the complete enlarged arrays. No emitted
file is invented by a catalogue flag, and no source module is evaluated on the
UI thread to construct geometry.

The semantic Worker already bundles the product's
`extrusion/rectangularArrangement.mjs` import from `selectedSketchProfile.mjs`.
That geometry producer is not an unnecessary Native static resource. The common
Native Worker dynamically loads `mount/arrangedPrismSelectionIndex.mjs` and
`extrusion/selectedArrangementDescriptor.mjs`; their real relative imports stay
canonical in modern `modules/engine/{mount,extrusion}/...` paths.

## Explicit capability marker, not a Native ABI change

`selectedRegionArrangementVersion:1` is registered only for the existing eight
**V3+selection-plan-v2+Boolean-history** cohorts: Boolean-history, revolve, sweep,
loft, adaptive metrology, STEP, manufacturing mesh and shell. Their constructors
explicitly pass1, their stagers explicitly request1, component manifests record1,
and their asset entries require1 before exporting the actual assets. The two old
V3 polygon/mechanical entries require0; old V2/default constructors advertise no
arrangement capability. Inactive source-file presence is not supported geometry.

The shared stager accepts only0/1 and refuses1 without the real common lineage
source root. Existing optional-stage cache comparison includes the new manifest
field alongside Worker/native/source/file pins; an old stage is not silently
accepted merely because its Native binaries match. Factory availability checks
require marker1 and the actual colocated arranged-index, metadata, selected-plan,
topology-contract and lineage modules before offering a marker1 cohort.

The mount `solid.profile.extrude` operation advertises the strict bounded fields:

```text
selectedRegionArrangementVersion:1
arrangementScope:'axis-aligned-two-rectangle-cells-v1'
sourceBoundaryReferences:'source-span-v1'
maxSourceRectangles:2
maxCells:5
sourceMutation:'none'
```

`engineCatalog.validateEngineMount` requires that exact source-policy contract
for the registered marker1 build and rejects any marker on old cohorts. The
controller refuses arrangement requests unless its explicit source-policy marker
is1. Ordinary profile discovery reports the selected build's marker (null on old
cohorts); the established two-field availableBuilds rows and region response
schema remain unchanged. This marker declares shipped implementation, with the
existing component-research qualification label; it is **not a whole-flow PASS**.
No saved9-field feature or engineRevision grammar changed.

## Legacy flat graphs: exact generated forms

Canonical source files are never edited into flat paths. Build-time rewrites are:

| Canonical import/URL | Generated flat form | Owning stage |
| --- | --- | --- |
| `../extrusion/selectedArrangementDescriptor.mjs` in `selectedProfilePlan.mjs` | `./selectedArrangementDescriptor.mjs` | default prism and selected-V2 |
| Same import in `ownedTopologyContract.mjs` / `arrangedPrismSelectionIndex.mjs` | `./selectedArrangementDescriptor.mjs` | default prism |
| Native bootstrap `new URL('../extrusion/selectedArrangementDescriptor.mjs', self.location.href)` | same expression with `./selectedArrangementDescriptor.mjs` | default prism and selected-V2 generated bootstrap |

Default prism explicitly copies the helper and arranged index, traverses their
static closure, and emits them through its existing generated region entry.
`authoredRegions.mjs` is still visited first/exported as p0, preserving the actual
authored-regions URL/default guard. Existing flat path/name/64module/1MiB bounds
are unchanged.

Selected-V2 stages the rewritten plan and canonical metadata helper in its own
flat directory. A generated `.build/selected-profile-plan-entry.mjs` imports
both as real webpack resources, checks their URL directories match and exports
the original plan URL. `webpack.config.js` changes only the existing
`codi-selected-profile-plan$` alias to this shim. V2's plan URL/basename and
factory colocation contract stay intact; it does not advertise1. The raw
canonical bootstrap pin is checked **before** the V2 generated flat rewrite.
No cross-cohort resource dependency or hidden requirement on default prism is
introduced into the standalone V2 module graph.

## Exact remaining repin locations (root-owned values)

The following existing `bootstrapSha` literals still contain their previous
value, intentionally untouched. They must be set to the SHA256 of the **final
canonical** `modules/engine/mount/oci-verified-worker.js` after product/main
composition, not to a generated embedded/flat Worker hash:

1. `build/prepare-selected-profile-assets.cjs`
2. `build/prepare-loft-profile-assets.cjs`
3. `build/prepare-adaptive-metrology-profile-assets.cjs`
4. `build/prepare-step-export-profile-assets.cjs`
5. `build/prepare-manufacturing-mesh-profile-assets.cjs`
6. `build/prepare-shell-profile-assets.cjs`
7. `build/prepare-orthographic-profile-assets.cjs` (retained standalone cohort;
   this supplement does not register/promote its Native pair).

The common component stager records the actual canonical bootstrap SHA and
generated embedded Worker SHA separately. Rebuild or independently reproduce
every configured `.build/*-assets/component.json`; its `sources`, `files`,
`workerSha256`, `bootstrapSha256` and marker must match actual current inputs.
Native `jsSha256`/`wasmSha256` stay their existing reviewed values.

The generated default `.build/prism-assets/oci-verified-worker.js` and selected
`.build/selected-profile-assets/selected-profile-worker.js` include the flat URL
rewrite and real embedded glue; root records their actual new SHA values and
the webpack-emitted file bytes. They are **not** byte-identical to canonical
bootstrap source. Rewritten flat plan/topology/index bytes also differ from
canonical source: pin the actual staged/emitted resources, preserve source
revision, and do not substitute canonical hashes for those generated bytes.
The new V2 shim/changed entry module graphs change the app bundle as well.

Normal full build and parent whole-flow E2E are the next checks. There is no new
runtime receipt or qualification from this source commit alone. Original Native
pairs/defaults, old producing receipts, unrelated drivers and live services stay
unchanged.
