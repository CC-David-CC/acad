# C11 cap embedding and conservative detail events

This source-only follow-up starts at `efd39afedbc20899728a383c914b3fb2b77d35f5` and addresses the three product findings in `C11-SECTION-DETAIL-INDEPENDENT-REVIEW-20261109.md`. No tests, builds, probes, or runtime calls were run for this packet. The complete application workflow and independent artifact checks remain required after composition. Timeline owns the separate acceptance corrections.

## Complete cap embedding before cancellation

`ownedDrawingSectionWorker.mjs::packCaps` retains its existing actual Native builder ancestry, complete coplanar face census, parameter-to-vertex incidence checks, original wire order, and response-local vertex/edge identity. It calls the new private `proveCapEmbedding` before any shared edge is canceled. No coordinate creates or merges a Native identity.

The proof operates on the represented projected packet coordinates. It does not claim exact unrounded 3D coordinates or strengthen the existing `1e-7 mm` Native incidence checks. It:

1. Requires one consistent represented coordinate for each actual Native vertex ID, within the existing packet `abs(coordinate) <= 4e6 mm` domain. It decodes binary64 values into a common dyadic integer grid without rounding or welding.
2. Establishes nonzero exact signed patch area and no projected zero edge. The existing one-wire/unique-vertex/connected-loop checks remain in force.
3. Examines every self/interpatch edge pair, including edges later removed from the outline. It rejects proper crossings, positive-length overlaps between different Native edges, unshared coincident endpoints, and endpoint-on-interior contacts. Same-patch adjacency is not skipped wholesale. Contact is permitted only at an actual shared Native endpoint. A shared whole Native edge must have exactly opposite endpoint uses in different patches and equal signed winding, which puts the local patch interiors on opposite sides.
4. After that complete boundary-event census, checks every open edge against every other patch in both directions. An open edge cannot cross the other boundary or meet it at a new interior event, so its inside/outside membership is constant. Exact homogeneous midpoint winding is then a membership certificate, not a floating sample heuristic. It rejects strict containment and contained patches whose vertices happen to lie on the outer boundary. Shared whole edges lie on the boundary and are permitted only by step 3.
5. Performs the existing actual edge-ID cancellation and boundary-loop reconciliation only after these checks. Generated outline tags, buffer layout, area arithmetic budget, and all Native cleanup/preservation checks are unchanged.

At the existing maximum of 512 edge uses / 16 patches, at most 512 distinct Native vertices are present. The `4e6` coordinate bound and binary64 subnormal exponent imply at most 1097 coordinate bits on the common grid; the implementation guards 1100 bits. Difference, doubled-midpoint, determinant, and 512-term area intermediates stay below 2304 bits. There is no rational division or recursive expression growth. The charged pair/orientation/containment census is below 1.2 million steps at those limits; the explicit guard is 2 million. Each contact check has constant additional work. The guard does not silently lower the declared face, patch, use, or output-byte limits. Budget exhaustion is `RESOURCE_LIMIT`, not invalid geometry. Maps, exact arithmetic, and traversal remain inside the Worker.

This deliberately retains unsupported results when distinct Native vertices/edges occupy the same represented location without shared membership, or when the represented patches overlap. It does not invent a stitching or approximate union algorithm. Existing Native identity cancellation remains the authority for what is an internal shared edge.

## Actual Native resource results and cleanup

`readOwnedDrawingSection` recognizes only the own-data literal `BOX_CONSTRUCTION_RESOURCE_LIMIT` from the box port and `BOOLEAN_RESOURCE_LIMIT` from the Boolean port as derived `RESOURCE_LIMIT`. These are actual existing Native result codes, not inferred from text or a failed census. The message retains that literal Native cause. Other port errors continue as `ENGINE_FAILURE`; input-preservation and cleanup failures continue as `ENGINE_CLEANUP_FAILED` and override an ordinary operation failure while retaining it as `operationError`.

The allocation attempts, scratch name release checks, pointer cleanup, original target topology/metrics checks, and falsey-safe failure record are unchanged. There is no new Native API, success field, or accepted-model authority.

## Detail event occurrences before filtering

`drawingDetailClip.mjs::clipCurve` no longer treats equal computed parameters from separately generated conic boundary roots as an exact shared event. It keeps each occurrence and its numerical resolution through sorting. Equal or unresolved neighboring occurrences refuse `DRAWING_DETAIL_UNQUALIFIED` instead of being deduplicated.

The existing coordinate-resolution envelope is propagated through `acos` sensitivity before a root is used; a final-parameter ulp check alone is insufficient near a tangent. A ratio envelope reaching `-1` or `1`, or nonfinite/unresolved arithmetic, refuses. This remains a finite floating analytic sufficient domain, not a universal exact-transcendental error certificate.

For each root, the periodic lift census includes one lift on either side of the original trim before filtering. The original one-turn and bounded parameter domain keep this census bounded (at most four lifts per root). A root whose resolution reaches either original trim endpoint refuses, including a computed root equal to or just outside the endpoint. Only a clearly interior event enters the interval list. No root is snapped, clamped, or silently dropped onto a trim endpoint; no new exact-root success flag exists. Clear ordinary root intervals retain the original clipping/membership code. Line clipping is unchanged.

The original `0.02 mm` paper approximation, parent source binding, interval/byte caps, Native cohort, and all drawing source/history semantics are unchanged. Consumer recomputation uses the same helper. Near-boundary/tangent/uncertain events remain unqualified; a refusal is not a theorem that the mathematical detail is invalid.

## Composition and qualification obligations

Production changes are confined to the existing `ownedDrawingSectionWorker.mjs` and `drawingDetailClip.mjs`. The exact cap proof is inline, so it adds no module-graph dependency or Native pair. Normal composition must still regenerate the changed existing-module hashes and all associated retained bootstrap pins through the established process.

Current root `072805f` uses one closed `ownedKinds` Map for both admission and freshness. C11 composition must add its derived read as `[kind, false]` in that Map, retaining the root table; it must not restore the older parallel arrays from the frozen C11 base. This packet does not edit that root-owned seam.

Timeline's independent acceptance packet must remain separate. The next complete workflow must retain original producing pins and all prior criteria, check real cap material coverage/contact and actual detail SVGs, and preserve any first failure. Its public geometric edge reconciliation must not be relabeled an independent proof of private Native edge IDs. No runtime qualification follows merely from this source repair.
