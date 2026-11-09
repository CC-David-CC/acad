# CAD-BUILD-BLIND-CLOSURE-01

Confirmed before the first blind browser workflow. Component preparation stages
five new primary-manufacturing .mjs roots, and catalogMount requires those same
five resources. However manufacturing-mesh-assets-entry.cjs still emits only
its old module list. Its static-import closure check succeeds for that old
subset and does not compare it to catalogMount's enlarged required inventory.
Consequently a successful normal build is insufficient: primary MFG availability
fails its exact resource-graph admission and the new dynamic imports are not
installed at their canonical URLs. This is a source-confirmed wiring defect,
not an observed geometry failure or alleged successful runtime run.

Repair emits the five actual staged modules in that cohort's webpack resource
entry: nativePlanarAttachmentFacts, ownedPlanarAttachmentProtocol,
ownedBlindHolePlan, blindHoleFacts and ownedBlindHoleIntent. Their actual static
relative imports were read; dependencies are already in the retained MFG entry
list. The existing source/byte/hash/relative-import closure guard remains and
validates the enlarged emitted graph during the normal build. Catalog/prepare
inventories and other cohorts are not widened or bypassed. Native pair, common
OCI source hash, geometry and work limits are unchanged by this resource edit.

Normal full regeneration/build and fresh immutable staging must follow. The
entire public blind workflow requires the actual exact primary MFG build,
real profile and blind evaluation, every runtime asset pin, server-synced native
Saves and fresh Opens, then its FIRST independent artifact oracle. Those are
the integration regression for availability and dynamic resource loading; no
standalone loader probe is run. Preserve preceding build logs as build-only
evidence and never call successful compilation functional qualification.
