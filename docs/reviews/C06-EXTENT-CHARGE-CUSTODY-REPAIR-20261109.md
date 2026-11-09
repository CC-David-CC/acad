# C06 extent Native obligation and charge repair

SOURCE ONLY. BEFORE source9f9bac8 and independent review8f7b06e are retained. No tests, probes, TSC, build, Native or browser calls. This is a confirmed source-level second retirement attempt, not a reproduced C++ heap double-free, foreign deletion or runtime qualification.

Before: actual `chargeSelectedResult` retired a quota-refused name, then threw RESOURCE_LIMIT. `createOwnedProfileExtentResult` unconditionally allocated another name pointer, called `_ReleaseOwnedShapeV2` again and accepted0. The unnecessary second mutating attempt could mask a settled quota refusal with a scratch-allocation failure. The existing extent top-level catch already retired the realm on unknown/cleanup/precision/input-change failures; no broad reusable-unknown defect is asserted.

Now one private `recordSelectedResultCharge` performs the SAME triangle validation/accounting and returns false only when the unchanged100000 cumulative budget would be exceeded. Existing `chargeSelectedResult` callers retain their original release-on-quota wrapper and messages. The extent-only adapter never releases: sole fresh-name retirement belongs to its helper. No public flag, changed limit, budget credit/refund or Native API was added.

| Actual obligation | Sufficient observed transition | Action on failure |
| --- | --- | --- |
| unattempted | Successful existing name/data scratch allocations; no Native constructor called | Known allocation0 can refuse RESOURCE_LIMIT after acknowledged scratch frees. A thrown/unknown scratch outcome is terminal. |
| unknown | Immediately BEFORE actual Native construction; remains unknown until a real acknowledgement is established | Unknown dispatch/exchange/input mutation does not receive a mutating name query/release. Existing outer closeWorker retires the actual private realm. |
| absent | Only known actual PROFILE_CONSTRUCTION_FAILED / MEASUREMENT_PRECISION_UNRESOLVED acknowledgement, intact input and matching unchanged census | No release call. Census corroborates an explicit constructor contract; it never establishes absence alone. Precision remains terminal. |
| owned | Real version3 valid single-solid acknowledgement, intact same Native input, exact one-name delta, expected measurements AND successful real named interrogation/positive evidence | A declared safe ordinary refusal may retire this positively established fresh name ONCE, using its still-live original pointer. |
| retired | Actual `_ReleaseOwnedShapeV2` returns1 and census returns to captured before | No retry/allocation. Then acknowledge each scratch free once. Release0 is NOT success for a known owned result. |
| uncertain cleanup | Release/query/free/exchange throws, gives unexpected acknowledgement or census | Preserve exact cause/primary cause and emit terminal cleanup/engine failure; do not retry release or continue Native repair/free after uncertain custody. Outer realm retirement owns cleanup. |

The still-live original name pointer is checked against the exact captured UTF-8 name plus terminator before Native construction, after it, before charging and before any retirement. This bounded private byte-heap check prevents reuse of a silently changed input string as retirement authority; no replacement allocation or name guessing is used.

The helper uses tagged failure records, preserving undefined/null/false/0/empty-string causes. It does not turn an opaque ResourceLimit-looking exception into a reusable refusal: uncertainty is terminal. A successful helper returns its genuine owned result to the unchanged private token publication; unknown post-return dispatch/publication still hits the existing terminal outer catch. Accepted public model metadata is not a borrowed live Native owner; terminating this actual realm is NOT proof of preserving an accepted owning realm.

Only Native construction/measurement/resource/source semantics already required by the extent operation are involved. Ordinary caller math, schema, equations, Native inputs/pair, all result/work quotas and old charge paths are unchanged. Bootstrap source bytes changed once; all9 actual entry guards are updated together. Final root composition retains counter3 + blind5 + C11derived4 + extent6 resource roots and the canonical identity/length leaf additions.

Separate merge hygiene: modernPhysicalBindings now uses explicit actual type identities rather than MODERN_PHYSICAL_TYPES[3] to recognize extent parents. Root currently uses that slot for counterbore. Merge both literal allowlists/captures/consumer guards and retain physicalReadUnsupportedReason; do not concatenate positional assumptions or overwrite counter/typed role policy. No currently qualified root behavior is relabeled a regression from this older isolated base.

Complete application qualification is still pending. The complete extent workflow will retain all first failures and require ordinary refusals followed by healthy actual Native continuation; source reasoning is not a substitute for the grouped whole run.
