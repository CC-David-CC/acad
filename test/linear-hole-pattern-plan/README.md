# Next bounded feature: source-local linear through-hole pattern

This is a **tests-only contract prototype**, based on CAD53c6203fb. `draft-plan.mjs` is under this test directory, is not production code and is not registered with Craft or a geometry mount. The tests execute it and the real shared through-hole/profile helpers in an actual Node Worker. Inputs are explicit analytic mathematical fixtures; their metric objects are not native-engine observations. This prepares one operation, not a general pattern framework.

## First acceptance and authored intent

Start with the genuine centered-through feature on a100×50×20 selected rectangular plate. Keep the current target after its outer edge treatments. A pattern with count3 **including the seed**, spacing20mm, and axis `source-local-x-positive` adds only two cuts: local centers[70,25] and[90,25], in addition to the existing seed[50,25]. Resize the original source to150×30 and depth25: centers become[75,15],[95,15],[115,15]. Editing the seed diameter changes both derived copy diameters through replay. World rotation/translation changes the world direction, not the source-local direction.

Proposed authored request (name/registration remains parent-owned):

```
{version:1, unit:'millimeter', engine:'occ', engineRevision,
 featureId, target, producerFeatureId, seedFeatureId,
 axis:'source-local-x-positive', count, spacing}
```

The only new pattern choices are seed ID, count, spacing and axis. Save no solved centers, radius/diameter, source profile, face/region duplicate, tool coordinates/depth, native handles/ordinals or copied bodies. Source/region/face and current diameter come from the current captured centered-through seed. New pattern ID differs from source, seed and current target producer. Request target is the current producer's body, not the seed's old consumed input body. The final feature consumes that current target and publishes one newly owned result.

Count is a safe integer1..17;17 is a mathematical per-feature ceiling only (16 additional holes would already cost32results). Real whole-part capacity includes source, seed, edge operations and all intermediates, so it normally admits fewer. Spacing is a positive finite numeric value≤1e6, even when count1 makes it unused. Count0, noninteger counts, zero/negative spacing, other axes and non-centered seeds refuse explicitly. No expressions/configurations in this first contract.

## Source, seed and target custody

The test input's `binding` is an **untrusted-to-production structural proposal**, not ownership evidence. It checks exact agreement of captured sourcefeature/face/region, seedfeature, currentproducer/target and engine revision. The Worker tests deliberately show that a positive target-volume scalar can coexist with an impossible material interpretation. Matching data cannot certify a seed exists in a target.

The real evaluator must supply and authenticate these relationships from its own current result/feature records:

1. The original selected-profile constructor request is current, genuine, and matches the seed's source feature/face/region and whole-part build. Preserve this record after the original source solid is consumed.
2. The seed is the **actual successful centered-through feature**, with its current captured request, diameter and source binding. A row that merely claims the same numeric ID is insufficient.
3. The current target is a genuine descendant of that successful seed through supported operations (initially outer edge treatments), in the same owned evaluation. Its measured native metrics come from the actual current target. Bind the complete dependency path and cancel/stale lifetime through final publication.
4. Use a causal feature/owned-result record for seed ancestry. `selection.sourceContexts` are origins of surviving advertised geometry, **not a list of all causal hole features**. Do not invent a seed context or infer ancestry from cylindrical coordinates, a nearby hole, parsed IDs, old result ordinals or positive volume.

Exactly how the new private seed record and supported target ancestry are captured must be frozen before implementation. This prototype does not introduce fake handles, fake source indices, an empty second source, or native aliasing to stand in for that proof.

## Derived layout and geometry boundary

The prototype reuses `planOwnedThroughHoles` for the centered seed, qualified rectangular source domain and all8-corner native-AABB axial projection/margins. It reuses the existing prepared polygon relationships for original-source containment and seed/copy separation, and the existing V3 profile preparation for each derived circle tool. Only the new `seedCenter.x + i*spacing` layout and copied-tool endpoint coverage checks are added here. The draft does not duplicate a rectangle extractor or planar topology implementation.

Both seed and all copies must remain strictly inside the source rectangle and strictly separate under the existing provider clearance rules. The actual world endpoints of each copied tool must still cross the complete projected target AABB, including rotated/oblique frames and a target axial span different from source extrusion depth. Native target validity/material, not mesh/display measurements, decides geometry success.

For k=count−1 additional holes, count≥2 uses k genuine Circletool extrusions, k−1 owned Unions into a valid k-solid tool, and **one final owned Cut**. Native result cost is2k, charged cumulatively including intermediates even after disposal. Reserve the full cost before native work/new authored ID; final publish is atomic. Original source, seed inputs and target are preserved on refusal; tools/unions/candidates release cleanly on refusal, cancellation and success. No kernel substitution or default promotion.

`expectedAdditionalPrismaticRemoval = k*pi*r²*currentSourceDepth` is a reference quantity for the scoped ordinary plate. It is not a measured volume and is not a universal target-volume prediction. Actual native output checks must establish the material/non-overlap assumptions; do not silently subtract that scalar from arbitrary target volume or label every mismatch invalid geometry.

## Count1 is OPEN, not zero work

Count1 has seed-only layout, no additional circles and no additional material removal. A newly authored feature still needs a genuinely owned identity output compatible with consumption, lineage and independent cleanup. The prototype therefore returns `nativeWork.status:'requires-owned-identity-result'` and `nativeResultCost:null`. It does **not** return a successful native result, alias the target handle, relabel the same token, declare cost0 or assume an identity-copy operation exists. A qualified native detached-copy/owned-identity path, honest cumulative cost, cancellation/input preservation and ancestry are required before exposing count1 as an executable feature. Refusing count1 until that prerequisite is implemented is preferable to a fabricated no-op.

## Explicit remaining acceptance items

- Native source/seed/current-target binding and actual target-descendant checks described above.
- Existing holes other than the recognized seed, pattern-on-pattern, overlap with unrelated cuts, or a through path partly removed by edge treatments require an explicit supported material/interaction policy and actual native corpus. The prototype cannot detect those from source+AABB alone. No broad support is claimed.
- Actual native Circle/Union/Cut run and full sourceCopy/history validation for both operands, including a valid multi-solid tool, exact original-input preservation, empty/refusal handling, native volume/bounds/material/cylinder checks, cleanup and full-cost budget refusal.
- Unary inherited selection mapping from the **current target** through final CutA, preserving genuine outer edge identities. Generated bores/rims remain unclaimed; no invented pattern-hole persistent names. Validate all native B-tool copy/ancestry data without advertising tool origins.
- Genuine count1 owned identity/cost/lineage path.
- Registered operation, public facade, numeric edit/journal/creation travel, source/depth/seed-diameter replay, stale/cancel/committed outcomes, normal native Save/sync/fresh Open/reedit and signed agent qualification. None is implemented or qualified by these tests.

## Evidence and reproduction

17 Worker groups cover the concrete initial/resized/seed-edit cases, +sourceX in translated/reversed/rotated/oblique frames, exact intent/binding admission, count1 semantics, count/cost ceilings, overlap/outside distinctions, immutability, getters/bounds and inherited shared-profile refusals. The first run's overlap fixture used diameter21 on the original100mm width; the third center90 then crossed the boundary first, correctly producing PATTERN_OUTSIDE_PROFILE. The corrected independent overlap case uses150mm width so the circles remain inside while diameter21 exceeds spacing20. Original first failure is retained; no guard or assertion was relaxed.

```
node test/linear-hole-pattern-plan/run.mjs test/linear-hole-pattern-plan/final-run.json
```

The receipt pins the shared source graph and test prototype before/after the actual Worker. It is pure math/data admission evidence, not native/browser/public qualification. No production, Craft, UI, native binary, default build, hosting, network or Files files are changed.

The committed source checkpoint3851d58d6 was archived to a fresh R730 directory and rerun with Node24.22.1:17/17 pattern groups and21/21 retained through-hole planner groups PASS. Retained receipts/logs are written here, leaving original through-hole evidence untouched. No TypeScript/product files changed; no public app build or browser/native execution was needed for this math-only prototype.
