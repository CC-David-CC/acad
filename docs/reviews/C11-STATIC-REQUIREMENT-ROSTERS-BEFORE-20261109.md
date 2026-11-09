# Drawing requirement static leaf roster BEFORE — 2026-11-09

Source-only acceptance inventory migration. No execution/import/parser, tests,
probes, TSC, build, Native or browser work. No production/common source,
Root files, evidence, historical snapshots or reports may change.

Base Core01d31d5409450e3d7a8d42264f43d3a7c442d4e3. The eight acceptance
directories below are byte-identical at Root's observed39f8548261aa1d768c6d0b20ecd508d8868a31fa;
that later commit is not needed as this source patch's ancestor.

The reviewed v4 renderer statically imports
web/app/cad/export/linkedPartDrawingRequirementForms.mjs. Older v1-v3 renders
return empty forms but still import and execute this leaf. Current acceptance
producer snapshots include the renderer, caption and warning leaves, but omit
this new static dependency. Add exactly that path to current producer and
independent expected source inventories; do not infer inclusion from a mode
flag, manufacture historical source or weaken geometry criteria.

## Authorized source sites

| Acceptance directory under test/ | Producer inventory | Independent expected inventory |
| --- | --- | --- |
| section-detail-drawing-public-workflow | desktop-driver.mjs coreNames | oracle_lifecycle.py CORE |
| four-bore-drawing-public-workflow | desktop-driver.mjs files | check.py WARNING_SOURCE_ROSTER |
| isometric-drawing-public-workflow | desktop-driver.mjs files | check.py WARNING_SOURCE_ROSTER |
| isometric-current-drawing-compatibility-workflow | desktop-driver.mjs files | check.py WARNING_SOURCE_ROSTER |
| drawing-reference-repair-public-workflow | desktop-driver.mjs files | check.py WARNING_SOURCE_ROSTER |
| centered-counterbore-workflow | producer-roster.json core | SAME JSON read by captureProducerRoster and acceptance_oracle.py |
| centered-blind-hole-workflow | desktop-driver.mjs origins | check.py roster |
| centered-countersink-workflow | desktop-driver.mjs origins | check.py roster |

The patch changes15 inventory files plus disposition notes only. For the shared
counterbore declaration, changing driver/checker code is unnecessary: both
already consume the same exact JSON manifest and its whole Git/path/blob
snapshot. Preserve its format version1 and all Native/source/proof fields.
Existing checks derive roster counts from the declared inventories; retain
exact equality, duplicate rejection, before/after bytes, SHA and commit:path
binding.

## Preservation and evidence boundary

Keep all old entries, ordering except insertion, physical/source/Native/SVG/
J/history/refusal/counter/custody assertions, budgets, source generation,
persistence cycles and artifact counts. No changed successful geometry or
capability. The new leaf uses the ACTUAL producing runtime source commit,
not an acceptance or invented historical commit.

Exclude selected-profile-extents (Root owns its historical R4 conditional),
new drawing-requirement (already complete), evidence directories and frozen
reports. No automatic compatibility fallback for historical evidence:
the original producing roster/version and checker source remain in their
frozen commits/snapshots. Rechecking old proof uses that exact historical
acceptance; this current new roster is for a future coherent producer that
actually contains the new leaf.

Root reviews/composes this source-only delta, then owns complete regression
execution and first independent artifact checks. This packet makes no new
runtime/geometry/qualification claim.
