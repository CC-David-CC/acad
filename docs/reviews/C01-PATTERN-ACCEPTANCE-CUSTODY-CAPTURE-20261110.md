# Pattern acceptance custody and direct Core regression — BEFORE

Exact reviewed input: Core acceptance fd36c57659e3d018f31e9b305455dbe1fe55bfed. Review is source-only; no imported checker, parser, browser, build or test execution and no runtime incident claimed.

Confirmed gaps:
1. source-custody.mjs authenticates retained listed files against named Git commits, but neither initial nor final capture checks actual Core, Host or acceptance HEADs/cleanliness. The driver's final hashes cover only listed files. This fails the existing separate compiled-checkout and acceptance-checkout identity contract even when snapshots are valid.
2. Direct Core coverage accepts any pure refusal. Without the product capture fix, mutated foreign source can produce PATTERN_TARGET and that exact branch passes. Thus the case does not demonstrate repaired successful original-intent behavior. It also omits direct edit although create and edit share the repaired capture seam.
3. The direct observation is not installed in receipt until after assertions and removal. A failing actual direct outcome may be lost. Unlike logged JSON commands, its possibly committed error does not mark the driver's unknown-outcome custody.

Bounded repair: require clean actual named Core/Host/acceptance HEADs before and after with executing acceptance root/cwd binding, preserving all Git blob/served pin checks. Require genuine successful direct create AND edit from original detached own-data inputs, immediately mutate caller containers only, capture raw dispatch/outcome/after states before new assertions, preserve unknown direct-call custody, prove original source/IDs and actual shared journal transitions, then remove through the public shared operation. No allowed-error list or invalid-input success branch may substitute for valid positive cases. Retain all existing phases, refusals, three native cycles and REQUIRED OPEN dependent-shrink gap. No product changes or weakened criteria.
