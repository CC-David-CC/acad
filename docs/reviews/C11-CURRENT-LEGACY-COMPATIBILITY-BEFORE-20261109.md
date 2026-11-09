# C11 current legacy compatibility BEFORE — 2026-11-09

SOURCE ONLY, base82f9f01b7a6fbc5e2bfc25183a72da87a8e31e97. No tests,
parsers/imports, probes, TSC, builds, Native or browser executions. Root remains
sole runtime executor. Historical evidence/reports/frozen snapshots unchanged.

Confirmed current acceptance mismatch:
test/isometric-current-drawing-compatibility-workflow/desktop-driver.mjs:74
still requires manager definitionVersions[1,2,3] and manager limits.views4.
Current projectManagerBundle.inspectLinkedPartDrawing advertises[1,2,3,4] and
views6; linkedPartDrawingDefinition implements those capabilities. The old
isometric-drawing-public-workflow driver advertises the still older[1,2]/4
expectation and remains a historical source/evidence family.

## Approved correction

Only the current compatibility acceptance directory changes. Set the current
manager advertised-list expectation to EXACT[1,2,3,4] and advertised views6.
Independently require that same actual observed metadata in its checker.
Capture modules/drawing/linkedPartDrawingDefinition.mjs and
web/app/cad/projectManager/projectManagerBundle.ts in BOTH driver runtime
source list and independent expected source roster, with actual producer
Git commit:path/blob/SHA custody. Keep the existing requirement-forms leaf
and all earlier source entries.

The actual AUTHORING remains version1 three orthographic views -> version2
four views, exactly six physical references, no datums/requirements/derived
views. Its own legacy <=4-view and projection budgets do NOT become6; manager
capability6 describes later version3/4 domains. Do not add v4 flags/fields to
an old definition, change old .cad bytes, loosen geometry/tolerances, remove
source/Native/ellipse/refusal/travel/repair checks or shorten native cycles.
Update current README/source handoff and exact checker path accordingly;
old historical original/evidence documents remain untouched.

Separate ordered source handoff will map minimal complete affected whole
regressions and exact cohort/env/checker paths. It is a plan, not execution
or signoff; current primary v4 packet82f9 and Host33fc remain byte-frozen.
Filesystem-race/foreign-account/fault tests remain cancelled.
