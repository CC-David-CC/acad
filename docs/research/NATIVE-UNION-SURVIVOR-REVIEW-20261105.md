# Independent review: ordinary union region survivor

Reviewed native kernel patch `6c99bfcfe6c7b9735a8c617b4207921c64b0555e` and test checkpoint `8db6c88a9e5a7fe561f77b8a6d6e9fa822dda52e` on `research/union-region-survivor-20261105`. Review was read-only; no native source, application provider, catalog, default engine or production guard was changed.

**Finding:** no concrete new product ownership, stale-pointer or Boolean-truth defect was identified in this bounded change. The material-survivor rule is a plausible fix for the traced ordinary-union case. This is a review of that candidate, not general Boolean qualification or approval to remove the application guard. Known partial-fill and island observations remain open.

## Source reasoning and boundaries

- `source/SMLib/src/SmMerge.cpp:4724` enables the new policy only for union with the manifold algorithm flag, postprocessing enabled, and cookie-cutter, imprint, classify-only and keep-other modes disabled. Nonmanifold dispatch temporarily clears the flag at `SmMerge.cpp:2416`; ordinary `SM_API` dispatch checks both operands at `source/SM_API/src/SmApiBrep.cpp:231`. The flag selects a code path, not a fresh mathematical validity certificate. Specialized behavior is excluded by source inspection, not independently exercised by these tests.
- `source/SMLib/src/SmTopologyIntersector.cpp:457` retains the two-argument entry point and delegates with policy false. Its five-argument `SmBrep::DeleteFace` call spells out the same defaults as before (`FALSE, TRUE, NULL, NULL` when disabled); see `source/SMLib/inc/SmBrep.h:589`. No object layout or virtual dispatch change is introduced by the overload. Existing callers preserve their default survivor semantics.
- `SmTopologyIntersector.cpp:530` obtains the two current adjacent regions from the current face's faceuses, requires distinct finite regions, opposite void bits and no `SM_AI_OTHER_REGION_ID` on either, then passes the existing material-region pointer immediately to `DeleteFace`. No new pointer is retained after deletion. `source/SMLib/src/SmBrep.cpp:7145` keeps that selected region, moves shells, emits the existing merge notification and deletes the other region. No concrete new use-after-delete was found in this path. Failure-path, callback-reentrancy and allocator/sanitizer lifetime coverage were not run.
- Infinite-region safety depends on the **new precondition excluding either infinite region**. `DeleteFace` itself gives a nonnull preferred survivor priority over its generic infinite/void preference; it must not be relied on to rescue a bad preferred pointer. The current candidate supplies null for either-infinite cases, preserving the original preference there.
- `SmMerge.cpp:4797` documents unattributed regions as inherited from A; STEP7 skips them at `SmMerge.cpp:4846`. Under that existing premise, preserving an A-material region is consistent with material in A remaining material in A union B. It still relies on correct prior face deletion and region partitioning: a material point in a region does not independently prove every point in a wrongly merged region belongs to the union. The candidate adds no global classifier or ancestry repair.
- Both attributed inputs bypass the policy, as does an attributed/unattributed pair. Existing `SmMergeRegionAttribute::Merge` (`source/SMLib/src/SmAttribute.cpp:816`) still combines/copies ancestry through the normal merge notification. The patch neither dereferences remembered stale A-source pointers nor fabricates B ancestry. Custom region-attribute value propagation, changed survivor identity, mixed attributed/unattributed sequences and callback lifetimes remain untested. “Unattributed” here means absent Boolean ancestry attribute, not absence of all user attributes.
- The raw test's copy-then-Boolean success ownership matches `source/SM_API/inc/SmApiBrep.h:50`: result aliases the first copied operand, and the second is consumed. The candidate does not change that API ownership. Source-preservation receipts compare exposed evidence/flags/tessellation metrics; they do not establish byte-identical native BReps or every borrowed-view lifetime.

## Evidence independently checked

Re-ran the native owner's `union-compare.py`: exactly three corrected output records, all other recorded output/source reports unchanged. `contact-baseline.json` and `contact-candidate.json` are byte-equal. This comparison inspects existing receipts; it does not independently rerun the eight contact fixtures.

Also independently ran [the bounded replay](../../test/native-union-review/browser.cjs) in actual Chrome `155.0.8059.79`, own context, using the existing pinned native diagnostic artifacts without rebuilding. Separate ephemeral same-origin servers used strict script/Worker CSP and closed afterward. The baseline and candidate actual outputs deep-equal the native owner's full extended receipts. See [independent receipt](../../test/native-union-review/independent-replay.json).

| Case | Baseline material/void/volume | Candidate material/void/volume | Native validity and direct triangle sum |
| --- | --- | --- | --- |
| D union inner | 1 / 1 / 1000 | 2 / 0 / 2000 | Levels 0/2 true; sum 2000 |
| Hollow union exact inner | 0 / 1 / 0 | 1 / 0 / 1000 | Levels 0/2 true; sum 1000 |
| Hollow union enclosing inner box | 0 / 1 / 0 | 1 / 0 / 1000 | Levels 0/2 true; sum 1000 |

Opposite orders and all other exposed fields remain unchanged. The test-only nested-flag normalization runs on separate copies under separately named diagnostic records; it is not applied to the corrected original outputs or application runtime.

Preexisting partial-fill forward still has level-2 validity false and native volume 892 versus triangle-order sum 772. The island still reports native volume 792 versus sum 776. The replay does not treat those records as correctness passes. Those sums alone do not establish physical volume for arbitrary mesh orientation/topology. The independent earlier planar counterexample had closed-edge/orientation checks; this native diagnostic harness records a direct triangle-order sum without equivalent per-edge closure proof. No synthetic/native validity claim is substituted for those missing checks.

Pinned extended baseline WASM: `542c13cabd28ff0a3287c42476e84092f2817e1054430bb4431995ac62ab1803`; candidate: `c23fce99b25edd65a145e5ae8f2a69da9a737d64660f1a43c116ee5451a62f4f`. Exact glue/Worker pins and native source commit are in the independent receipt. These are direct diagnostic-entry artifacts, **not application provider/runtime pins**.

## Next bounded acceptance work

Add native negative controls for either-infinite adjacency, both/one Boolean ancestry attributes and each excluded specialized flag, checking unchanged behavior against the baseline. Include a region carrying custom propagated attributes so survivor identity/value propagation is observed rather than inferred. Exercise a non-box cavity fill in both orders with native validity/census, analytic bounds/volume where independently known, and an orientation-aware mesh check. Existing `prog_test` Boolean/topology suites are the native repository's recommended broader validation; they were not run in this read-only review and require their native build/test closure.

After source review, a new application-provider artifact must still be built and pinned before replaying common-model/history/native persistence controls. The direct diagnostic test cannot qualify the installed provider or justify treating all native outputs as correct. No permanent wrapper limitation, healing/extraction policy, new editable model, kernel-default decision or broad manufacturing-export claim is proposed.
