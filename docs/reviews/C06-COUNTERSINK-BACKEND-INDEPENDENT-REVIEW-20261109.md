# C06 countersink backend independent source review

Review only, 2026-11-09. No product changes, parser, tests, probes, build,
Native calls, browser execution or callback-fault experiments were performed.
No additional blocking source defect was established in the bounded backend
review below. This is not a runtime or countersink qualification.

## Exact inputs

- Backend: `b7786eaa19998cca7c9f846b9a8a0f16654f82a0`, parent
  `2825cfaf047ccab989c343c05793418e4c4fa911`, base
  `4bfef32a269cb3eb3c1ed7968e8737b8689f9853`; contract `bfe27212`.
- Authored comparison: `95fff9d4b8425669ffd848fb9ca76731e3a6d4f1`
  (including `e9d6fdfa001e366c8bdbb89447813d189ec62e0f`) and Host
  `9be437fff351fbe71e7ee6f56cfef31c862fde71`.
- Pure numeric intent at `7b4187cf1f9408a6551655e9e32c04c21be75d46`, backend
  `2825cfaf047ccab989c343c05793418e4c4fa911`, and authored tip has the same
  Git blob `de308748a77df96d3abb8b3ac81603f7909df3a5`. Compose that slice once.
- Backend OCI bytes SHA256:
  `8a150c70c5efa6461916c50310bd0d9cb0d34356a5d05087cb231cb703c2645a`.
  Exact input blobs: OCI `9abab71cda571bb88d039c73b0d9c01359622693`,
  controller `88c6c7f499b469c2d5fae36a15d5e6387eb206f2`, ledger
  `30b1f7d7e0ad6a75c3287d82a143a54af916daf7`, protocol
  `ade1a8ea8b8adfbd81c71a7ab906ed19c0d96b79`, resource roster
  `d9b708e7a9f55b15a1290d17f235920c9804212f`.
- Only admitted new pair: portable JS
  `04fc776837d6e87e7ddf9c31b66428ec191f3120600fd0794c86a5fd533c0a7b`,
  WASM `688c9d11ececf67d5187445491b4269647d810528e37161bcd7e676bc8d9125c`.

## Traced contracts

| Boundary | Actual source and conclusion |
| --- | --- |
| Authored versus numeric | `ownedCountersinkIntent.mjs` exact 15 numeric fields and the authored materializer agree on two LENGTH values and a full radian ANGLE. Kernel request is those fields plus only `op:'solid.holes.countersink'`, `handle`, `sourceHandle`; Worker transport uses private `token,parentToken,sourceToken`. No source frame, Native ordinal, submitted constructor hash or proof is accepted as countersink intent. `SolidKernel.ts` includes the operation in both request and result-op unions. |
| Main source and entry | `solidLedger.mjs:132` requires the actual current original profile model, identical parent/source handle, the actual source face/region/build, frozen constructor creation binding and its source digest. Current v2 prism selections must contain the requested last-cap with the actual original feature and one exact sketch-profile context. Its membership check captures metrics, placement, frame identity, selection snapshot and source object; it runs before/after Native dispatch and during publication. |
| Constructor authority | OCI `selected-profile-bound` branch (`oci-verified-worker.js:942`) independently verifies the captured source and V3/Float64 request before construction, then retains the issued binding against the genuine result token. The countersink issuer (`:597`) retrieves `selectedSourceCreationBindings`, `selectedSourceProfiles`, `selectedPrismProvenance` and `selectedSelectionIndices` from that token. It requires original parent/source equality and binds all four map identities, actual Module/runtime, busy owner and absent output token through `requireCurrent`. The context is lexical and never decoded from the request. |
| Actual entry and cone proof | The coordinator rechecks the original prism receipt against the actual topology and source profile; `caps.firstFace,lastFace` are adapted to `sourceCaps.first,last`. It resolves the real current last-cap using the planar reader. The four results are a real circular tool, first subtraction, real owned frustum and final subtraction. `countersinkFacts.mjs` couples actual cone support/catalog, builder roles and both Boolean ancestries. Generated cone/shank surfaces do not receive an invented full-height THRU witness. |
| Attempted allocations and work | `ownedCountersinkWorker.mjs:64` registers each fresh monotone name before dispatch and distinguishes attempting/owned/absent/releasing/released/unknown. Charge adapts the actual existing release-on-quota callback, authenticates an acknowledged retirement rather than releasing twice, and checks work/census deltas. Success retains exactly the final name and four charged triangle counts; failure releases only positively owned results, reconciles the name baseline, and makes uncertainty terminal. The new issuer does not substitute the extent non-retiring charge callback. |
| Native exchange and terminal precedence | `countersinkNativeCalls.mjs:41` uses a synchronous store-only bounded collector, fences/restores that receiver before yielding, checks input scratch and frees it once. A throwing invocation revokes every collected payload. Original strict-decoder errors retain private terminal classification; `runOwnedCountersinkWorker` propagates that classification through outer preflight as well as the operation body. OCI `:1297` tests `terminateWorker`/the actual adapter WeakMap before its finite ordinary-code set; unknown or terminal failures close the Worker. An ordinary geometry code cannot downgrade cleanup uncertainty. |
| Controller receipt | `worker-controller.mjs:660` captures exact request fields and real bound handles/creator record, reserves cost four and checks exact response/binding/work keys, dense four-count receipt, cumulative triangle limit, final Native single-solid evidence and final-count agreement. It charges the three private intermediate entries before the common final-result charge and rechecks source record/binding custody. It does not accept a transported Native catalog as constructor authority. |
| Selection/publication | Ledger retains existing real selection-context and Native metric/display admission after the returned handle. The result is a new selection index derived through the two actual subtraction histories. Original constructor records stay available for source-bound read operations; the result is not falsely registered as a fresh constructor or through-hole source. |

## Pair, optional graph and old paths

`engineCatalog.mjs` admits `countersinkVersion:1` only on the exact mechanical
singleton with V3, selection-plan v2 and source-binding v1. Mount validation
requires its precise eight-field operation descriptor, cost four, finite kind,
last-cap entry and through-shank/interior-cone termination. Other cohorts must
not advertise that operation. The private factory supplies the real capture and
finite codes; controller and OCI independently require the exact bound pair and
source-binding mode. Both new conical ports are checked before Worker readiness.

`ownedMechanicalNativeResources.mjs` is shared by preparation, emitted entry and
catalog colocated-graph checks. Its new coordinator/adapter/facts/plan/protocol,
pure intent, conical contract and planar-reader imports are represented by the
finite roster. Existing `assertOwnedProfileResourceClosure` checks each staged
static dependency and hashes; no generalized path allowance was added. The ten
common OCI guard sites carry the exact input SHA above. These are source
observations, not a claim that any particular final emitted graph was built.
Old cohort pairs/defaults retain their mode gates. Compiled Shell, circular,
extent, blind/counterbore, attachment and section/detail capabilities remain
explicitly unadmitted on this new pair; their port presence is not availability.

## Scope and next evidence

No backend repair is proposed from this review. Gate's separate authored review
`3da3a6d3cc75f8b0836c742ef43040bcfddeb1ee` records an inherited common Craft
signal read/listener seam; this review neither repairs nor dismisses it and
does not relabel it as a new backend defect.

The lexical exclusivity contract is essential: count/name/catalog/metric checks
are not an adversarial same-name BRep identity certificate. Actual per-call C++
Boolean input snapshots supply their own BRep/catalog/tolerance guarantees;
JavaScript checks add source/currentness/catalog/metric custody. No callback
mutation experiment was conducted and no caller mutation rollback is claimed.

Before a usable/qualified countersink claim, compose authored/Host/backend once,
regenerate the exact closed component and all common bootstrap consumers in a
normal build, then execute the frozen complete numeric/named ANGLE/public
travel/refusal/.cad lifecycle and independent actual STEP/3MF/SVG/source/cone
oracle. Full final-part proof, quota/cleanup observations and current emitted
resource availability remain runtime obligations, not deductions from this note.
