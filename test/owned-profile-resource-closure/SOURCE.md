# Owned-profile verbatim resource closure repair

Source-only checkpoint; no tests, builds, type checks or browser runs executed. Parent's actual14ee build found only the legacy flat exactExternalVertexContact resource in dist, while a retained shell resource imported the missing namespaced module. Preserve that original package/evidence separately. This note does not claim a repaired runtime until the complete parent build/workflow runs.

The common stageOwnedProfileComponent already traversed static imports and copied both new modules to the component source tree, recording their exact source and file hashes in component.json. The omission occurred one stage later: ten *-assets-entry.cjs scripts emitted webpack imports from manually declared module arrays. Factory catalogMount.ts required those same incomplete arrays exactly. Thus a module could be present in the staged source snapshot but absent from the distributed verbatim resource graph. Bundled Worker inclusion or the unrelated legacy flat copy did not close this namespaced graph.

This repair updates every retained polygon-plan resource cohort together:

| Cohort | New emitted/factory source paths |
|---|---|
| polygon, mechanical, Boolean history, revolve, sweep, loft, adaptive metrology, STEP export | modules/engine/extrusion/exactExternalVertexContact.mjs |
| manufacturing mesh and shell | same exact contact module, plus modules/engine/extrusion/articulatedRegionSegments.mjs (static dependency of isolatedOpenProfileComponents.mjs) |

All ten entry scripts now invoke the same narrow build-only assertOwnedProfileResourceClosure before writing their generated webpack entry. For every listed emitted .mjs it checks the actual bytes against BOTH staged sources and files hashes/length, scans the same static import/export grammar used by the stager, and requires every resolved relative import in the emitted canonical modules/ namespace. Missing imports or duplicate/path-invalid modules stop packaging with the importer and missing specifier. It does not infer new dynamic Worker roots, accept external imports, evaluate a source module or alter source geometry. Existing declared roots/factory colocation and Native-file hash checks remain.

The common profile stager itself needs no source change: it already stages these transitive modules and generates exact snapshots. prepare-*-profile-assets roots continue to define the same Native/controller/operation sources; no Native or bootstrap identity, default, capability, runtime API or source format changes. The legacy flat prepare-prism-assets graph was already repaired in14ee and remains unchanged here. V2 selected-profile and non-polygon default Native resources have no new import and remain unchanged.

Separate source-only corner-driver correction94f17bd reads the actual append receipt primitive.id and records the raw wrapper before assertion. It does not change geometry, policy, oracles, expected refusals or the parent's active midpoint driver/evidence. No browser rerun is authorized by this source checkpoint alone.
