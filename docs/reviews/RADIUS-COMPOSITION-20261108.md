# Radius integration onto qualified Mirror source

Source-only composition. No build, type/syntax check, test, probe or browser run.
No runtime/native hashes or formal qualification status change.

Core base is2796879 (qualified Mirror plus tool notes). The original frozen
radius packet27b0d58/ce95968/b32b124/1891c96 is retained on its own branch.
This integration combines its additive dispatcher/client/coordinator routes with
Mirror's existing routes, rather than replacing either set. In
`drivingDimensionTransition.ts`, the existing
`finishGeneratedDimensionStages` implementation and its conditional transaction
finish callback are unchanged: the source delta is only the Radius import and
RadiusLength-specific dispatch before the existing non-radius flow. In
particular qualified DiameterLength/SegmentLength Mirror regeneration is kept.

The closed-source coordinator returns `applyClosedSketchRadius`. Its existing
`Object.assign(ctx.craftService, closedSketchCommands)` installs the REAL method;
there is no separate implementation or second registration table. The Craft
service interface now exposes that exact returned method type. The method keeps
captured source/frame/document/lifetime/revision/J ownership, two original-request
Worker reconstructions, full suffix preparation and one sketch-bytes event.

Desktop base is694668fa2, preserving its installed-app1GiB policy/docs. Adapter
013b29d99 is composed without altering its command schema or settlement. Normal
`index.mjs` imports `registerRadiusCommands` and registers it through
`host.onDispose(registerRadiusCommands(host,()=>rectangle.target()))`, the actual
current lazy-target pattern. No source/format/native or installed-app policy
changes are introduced by this registration.

The original whole workflow, source recipe, independent .cad/analytic oracle,
budgets and expectations under`test/radius-length-public-workflow/` are unchanged.
They still require actual Circle and quarter-Arc authoring, genuine RadiusLength
removal and redundant Diameter reactivation, rejection preservation, mixed
travel, three .cad/save/sync/freshOpen cycles and Circle Native queries. Arc BRep
extrusion is not claimed. Root must run this complete workflow after coherent
build and exact staged pins, only after the currently active C02 qualification.

Remaining source boundaries: numeric radius creation only; an imported named
radius binding is not erased by numeric edit/remove. Ordinary generator-free
Circle/Arc sources are the prepared acceptance domain. Generator-bearing Radius
transitions are not qualified by the inherited Mirror/Diameter proof, and no
claim is made that the new private radius producer performs Mirror regeneration.
Its original-coordinate/cold-source validation remains mandatory; no stale
output bypass or raw generator permission is added. Typed Circle feature binding,
Arc profile consumption, general tangency and full C03/C04 closure remain separate
explicit requirements, not hidden runtime successes.
