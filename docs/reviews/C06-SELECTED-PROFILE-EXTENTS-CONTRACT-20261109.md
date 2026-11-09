# C06 selected-profile signed, symmetric and two-sided extents: design

DESIGN ONLY against Core `8771a5699c3a0e6d89fa6e840000803b921b175e`. No product/schema changes, tests, probes, TSC, builds, Native or browser execution. This remains a Gate1 obligation; the proposal does not close or waive it. Blind and section packets remain separately owned.

## Actual source contract

`WORKER_SELECTED_PROFILE_EXTRUDE_V2` saves exactly version/unit/engine/engineRevision/featureId/faceId/regionId/depth/bodyPolicy. `workerSelectedProfile.operation.ts`, `authoredEditJournal.mjs::captureSelectedProfileDepthParameters`, public depth commands and `authoredLengthBinding.mjs` require positive depth or a positive named length. `selectedProfilePlan.mjs` V2/V3 and `polygonProfilePlan.mjs::preparePolygonProfileExtrusion` require `0 < depth <= 1e6`; volume is area×depth and endpoints are original frame O and O+Z×depth. Legacy gestures do not establish a different shared semantic contract.

Keep genuine original-source/frame/opaque-region/definition capture, independent sketch reconstruction and semantic preparation, private candidate-owner ledger binding, full suffix publication and retained source planes. Identical optimizer results alone are not an original-intent or achieved-accuracy certificate. Source and replay inspection remain separate observations.

`prismSelectionIndex.mjs` binds actual Native FirstShape/LastShape/Generated membership to source curve/corner identities. Existing readers assume the source lies on the first cap: `nativePlanarAttachmentFacts.mjs` accepts last-cap aligned with source Z; `prismaticBoreFacts.mjs` uses [0,depth]; `drawingReferenceFacts.mjs` passes original source frame plus depth to bore readers. A shifted working frame must not masquerade as original source authority.

## Proposed exact authored intent

Register a distinct `WORKER_SELECTED_PROFILE_EXTENT_EXTRUDE_V1`. Preserve the old operation/fields/pins/defaults unchanged. Common own-data fields:

```text
version:1, unit:'millimeter', engine:'occ', engineRevision,
featureId, faceId, regionId, bodyPolicy:'separate', extent
```

| Literal extent | Only additional fields | Actual original-frame-Z meaning |
|---|---|---|
| `one-sided` | `distance` | Signed nonzero d; endpoints0 and d. |
| `symmetric` | `length` | Positive TOTAL L; interval [-L/2,+L/2]. |
| `two-sided` | `positive`, `negative` | Independent nonnegative p,n; interval [-n,+p]; at least one positive. |

Flat discriminated variants reuse existing physical field registries and optional numeric descriptor fields, as through-hole offsets already do. Inactive fields must be absent. `extent` is a literal enum, never name/expression evaluation. Active dimensions are finite Numbers or existing typed length names. Save no derived endpoints/span/sign/frame/coordinates/handles/ordinals or duplicate model. Symmetric10 and two-sided5/5 remain distinct authored intent despite equal geometry.

New extent-specific capture/resolution policies distinguish signed nonzero, positive and nonnegative lengths; do not widen the existing positive `isAuthoredLength` used by holes/depths. Reject ±0 one-sided, nonpositive symmetric, both-zero two-sided, negative side magnitudes, nonfinite/wrong-dimension/unresolved values. A zero side with the other positive is valid. Bounds: |d|<=1e6; L<=1e6; p,n<=1e6 AND p+n<=1e6, matching the existing Native positive height cap. Resolve names before checking total span. No additional arbitrary positive-thickness floor is proposed; retain actual profile-resolution/kernel refusals.

An explicit extent edit replaces only the captured variant, preserving feature/source/region/build identity. Literal mode changes are real journaled changes, not inferred from geometry. Raw bound names cannot be silently replaced numerically or erased by changing mode; existing physical transactions update named fields and the entire part. Refuse any unsupported bound-mode replacement precisely until its explicit physical transaction exists. Historical travel preserves exact active keys, strings and source bytes.

## Actual Native construction and missing-binding assessment

Native source `c15e49dfbb5bb5fcf7b5c81e7c63724c81807ae0` is tied by `test/owned-manufacturing-mesh-worker/IMPLEMENTATION.md` to actual primary pair JS `32eec74e3019d9e2d767c9016f05aa3daa49441c6102423a269d67b9c7f02a08` / WASM `abbf2aa02a6f2101c600aa1eedd20fa80ab2db206e677ca860d9c5103cdfbfcc`.

Actual `shape-io/selectedProfileV2.hpp::buildPlanarFace` reads bounded right-handed orthonormal O/X/Y/Z, builds genuine polygon/Circle wires and face, retaining source edges/vertices. `build` calls `BRepPrimAPI_MakePrism(profile.face, profile.normal*positiveDepth, true, true)`, checks one valid solid/volume and captures builder history. `CreateSelectedProfileV3` publishes one owned result after evidence. `profilePrismProvenanceV1.hpp` captures actual first/last caps, source edge/vertex descendants and coverage. It accepts no negative height.

For the chosen intent derive ordered lo<hi and h=hi−lo. In the SAME captured Worker plan, solve/qualify actual original source/frame/loops, then build a real face with:

```text
workingOrigin = originalOrigin + originalZ*lo
workingX/Y/Z = originalX/Y/Z
nativeHeight = hi-lo > 0
```

Invoke ONE existing V3 Native prism on that payload. This constructs region×[lo,hi] directly; it does not require two authored prisms/union, accepted-handle translation, reflected source, winding changes or replacement planes. Negative one-sided still builds along original +Z from lower to upper; its source is on the upper cap. A symmetric source plane is interior, not a BRep face.

No missing Native geometry binding is established for this finite ordinary V3 construction: the actual existing port accepts the derived placed face and positive span and returns real cap ancestry. This is source-grounded constructive feasibility, NOT execution/qualification of the new mapping. If actual provenance/preservation cannot satisfy the new binding, report that specific failure rather than inventing cap indices or claiming an unexercised transform API. Native binaries need not change merely to obtain signed extents.

Use a NEW exact ephemeral operation, proposed `solid.profile.extrude.extents` version1. It captures original source profile/frame and resolved variant; a Worker-only planner derives the working payload. Bind full request digest, actual face/region/feature, raw/resolved extents and original/derived construction association. Native invocation uses those SAME captured arrays. Never alter the old prepared-response frame equality or feed working coordinates back as original source. Repeat original-request semantic proof independently; caller-returned frame/cap data is not authority.

Original JS frame-coordinate bounds are1e6; Native `number` bounds are4e6. A legitimate derived origin can exceed1e6. Preserve original source limits, prepare its face at the original frame, then check PRIVATE derived payload and both world ends against actual Native4e6 bounds. Avoid an accidental old-authored-frame recapture of working data or a global bound increase. Keep curve/hole/resource limits. This Native provenance helper separately caps512 source edges/nine loops; unqualified ancestry remains unavailable/refused, never fabricated. Existing broader positive construction domains remain unchanged.

Retain available binary64 precision: no toFixed, snapping, epsilon-zeroing or early cuts. Guard finite sums, endpoint/span representability and conditioning; explain an unmet Native/geometric budget rather than claiming exact real arithmetic. Identical planners prove binding/repeatability, not accuracy. Source50pm, Native metrology/incidence and tessellation budgets stay distinct; no global threshold or blanket50pm BRep claim.

## Cap/source identities and dependent readers

Give this family a new strict construction source tag/selection namespace. Bind stable `lower-cap`/`upper-cap` roles to actual Native first/last along original +Z, corresponding boundary edges and actual swept faces/connectors to source curve/corner slots. Indices remain private/response-local. Extend strict selection snapshots/lineage explicitly. Old first-cap/source-plane and last-cap/depth semantics stay unchanged.

Derive source-plane relation as lower-boundary when lo=0, upper-boundary when hi=0, otherwise interior. No synthetic interior face or duplicate aliases to satisfy unique-index contracts. Source-point drawing references mean actual authored datum points, not invented boundary vertices. Sign/mode edits retain semantic lower/upper identity while placement changes; collapsed intent refuses atomically, not by silently swapping roles.

| Consumer | Required explicit integration |
|---|---|
| Source/dimension/frame edits | Exact new family capture and source binding; full actual replay on changed source/frame/plane placement; original source equations and candidate frame/currentness guards retained. |
| Edge/cap selection/treatment | New known roles/source tag and actual private Native index; ambiguous/generated descendants unavailable. Do not relabel old roles. |
| Point/STEP/HLR/mesh/3MF | New authored-kind admission in existing protected observation replay/build/budget; actual current body and discard-only owner; material-review behavior on geometry changes. No display-mesh/depth approximation. |
| Planar attachment | Existing helper is last-cap/+sourceZ-specific. A reviewed lower/upper policy must resolve current actual plane/orientation/incidence and original datum; an interior source section is not a boundary face. |
| Through/blind/pattern/bore dimensions | Current source map assumes [0,depth]. Derive real private constructor-extent facts and consume lo/hi explicitly when advertised. Do not smuggle a fake shifted old profile into source/centering proofs. Unintegrated dependents must be discovered/refused truthfully and remain listed obligations, not silently supported or waived. Coordinate blind/section owners separately. |
| Drawing/source references | Keep original datum O/X/Y/Z; actual cap-distance uses lower/upper planes. Bore/THRU uses real interval. Interior sections require actual section/datum semantics, not fake cap ancestry. |

## Exact future source seams and isolation

New authored extent capture/materializer, Worker plan/binding and operation descriptor alongside workerSelectedProfile. Additive `SolidKernel.ts`, ledger, controller/OCI dispatch and construction-index bindings reuse actual face preparation, original/cold/captured verification, owned allocation/publication/release, measurements and resource accounting. One direct prism costs one native result. Cancellation/integrity failure follows existing realm/owner rules; terminating an accepted owning realm does not prove accepted-model preservation.

New shared discovery/create/history/extent-edit methods preserve existing selectedProfile/depth APIs. Reuse genuine face-region extraction and actual span for expected volume; no fake arbitrary depth to obtain IDs. Keep captured source/frame/definitions and independent original-request Worker verification. A new narrow J kind records exact before/after variants and immutable identity; creation uses existing append chronology,64-entry/8MiB policy and atomic full suffix. No new model/history or generic framework.

Add new authored kind to source capture/build/budget/protected readers, PM pre-adoption, unconsumed-source and applicable history-control rules. Physical registries expose only active dimension fields and literal extent/identity fields; modern typed selected-profile checks retain exact source/build. Do not widen old positive resolvers or unsupported suppression/branch policy. Principal-plane/frame/source-region transactions must recognize this consumer without overwriting extents. Desktop remains a thin shared-method/lifetime/settlement adapter with existing disposal and no automatic Save or new UI model.

Proposed first backend: explicitly selected/staged primary MFG V3 pair above, which already has actual topology, source provenance, point, STEP and controlled mesh reads. Require a registered `profileExtentsVersion:1` AND installed exact descriptor/closed graph. Root decides final catalog policy. No default/saved-part migration, inferred capability solely from a Native symbol, or support on other OCC/Manifold/SMLib pairs. Document honestly a new JS wrapper capability on unchanged Native bytes; do not fabricate a new Native revision/hash. Refresh changed bootstrap/closure pins together only at actual implementation freeze.

## Complete public acceptance to freeze before execution

Root runs ONE eventual full public workflow after coherent source/build/pins, then FIRST independent oracle only after terminal whole PASS. Preserve every first failure and durable-settlement custody; no isolated probes or fake authoring.

1. Genuine10×6 rectangle at actual principal source depth10: one-sided+8 gives local[0,8], V480; one-sided−8 gives[-8,0], V480; symmetric TOTAL10 gives[-5,5], V600; two-sided p7/n3 gives[-3,7], V600. At actual XY+Z these world ranges are10..18,2..10,5..15,7..17. For other orientations use independently evaluated actual frame, not assumed textbook XZ axes. Native material/void/boundary probes cover both caps, source plane, sides and exterior; validate actual cap planes/orientation, volume/bounds and source-owned selections.
2. Explicit +8→−8, symmetric10→12, two-sided7/3→6/4 (same volume, shifted placement) then8/4 (changed span). Volume alone cannot prove placement. Two-sided0/4 and4/0 valid; both0 refuses. Creation/mixed extent/source width10→12/plane-depth10→20 UndoRedo preserves source IDs/raw intent, with actual suffix/cap regeneration. Stale observations invalidate; failed dependents preserve accepted state.
3. Public Circle r2, distance−6: V24π. Actual annulus r3/r1, two-sided4/2: V48π. Discover real opaque regions/IDs, check original loops/area/frame independently and actual Native classifications/caps. Exercise XY/XZ/ZY and one existing supported moved/placed source path, documenting actual observed frame domain. Existing malformed/profile-resolution/self-intersection/nonplanar refusals stay truthful; no implied ellipse/Arc/spline-region claim.
4. Named signed8→−8, named symmetric total and independent named side lengths use the existing physical source/evaluator. Enforce variant zero/negative/nonfinite/wrong-dimension/unresolved policy and retained raw names. Numeric erasure/bound-mode replacement refuses; inches/mm only changes presentation. Healthy actual edit follows refusal groups.
5. Stale/wrong source/region/build, unsupported backend/history state, zero volume, span>1e6, derived world bound and actual dependent failures retain source/model/J/counters/material/drawing/resources, with only documented candidate-token invalidation. No numerical refusal is labeled a global infeasibility theorem; retain actual precision/resource reasons.
6. At least three native `.cad` Save/server-equality/fresh-login-Open cycles cover negative, symmetric and unequal two-sided, followed by reedit/travel/resave. Independent archives check exact discriminant/active fields/raw names/IDs/source/frame/history/high-water. Own malformed copies derive ONLY from genuine saved models and refuse before adoption; unknown write settlement retains owned context.
7. Real material assignment and protected point/STEP/mesh/3MF/source-cap drawing reads where integrated; geometry edit requires material review, then reexport after Open. Independent artifact checks prove finite interval placement, caps/walls/coverage/material and declared approximation, not labels/volume alone. Label same-kernel readers accurately. Do not claim unimplemented hole/attachment/bore consumers until their actual interval binding/full workflow passes.

Independent truth is `O + X*u + Y*v + Z*t`, with (u,v) in actual selected source region and lo<=t<=hi; V=area×(hi−lo). Polygon/Circle support extrema give world bounds without sampling. Verify original source/equations/raw intent separately from Native observations and exported approximation. This is a concrete design/implementation packet, not present C06 qualification from inherited ports alone.
