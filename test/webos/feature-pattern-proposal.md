# Bounded associative feature-pattern proposal

The current `PATTERN_LINEAR` copies whole bodies. It cannot express a repeated
cut in one body, so it must retain its existing semantics.

First supported pattern: a linear array of a single through-cut extrusion from
one closed circular sketch region, on one planar face of one OCC body. The
pattern operation must store the authored seed feature ID, its source sketch
and region identity, direction in a declared coordinate frame, count, and signed
spacing. The original seed is instance zero; `count` includes it. Instance IDs
must derive from the pattern feature ID and integer instance index, not output
array position. A later deleted, changed, ambiguous or unsupported seed or
reference must fail explicitly without binding to a different feature.

Replay must obtain the seed's *tool* geometry and operation semantics from a
supported feature-result interface, transform independent tool instances, and
apply them to the currently regenerated target body as one defined cut. It must
not copy the already-cut body or substitute anonymous cylinders at old world
coordinates. Define whether intersecting instances, boundaries and degenerate
spacing are rejected before publishing. Native Mesh must refuse this subset
until it has a verified equivalent. UI and agent commands should author the same
validated model operation.

This likely needs a shared craft result/provenance contract: current history
records authored requests but ordinary extrusion does not persist a stable,
reusable pre-Boolean tool result. Coordinate any craft/evaluation/registry
changes before editing those files. Stable topology for generated cut faces and
explicit failure/repair when topology changes need their own review.

Acceptance on the actual plate: create one dimensioned hole and pattern it;
check individual holes and uncut intervals by rays and analytic volume, change
the original rectangle and seed dimensions, verify intended moved results,
undo/redo and reopen. Exercise count and spacing edits, missing/ambiguous seed,
invalid or colliding instances, cancellation and a failed downstream operation;
confirm last-valid geometry and authored intent survive. Test through the real
wizard and the same model command, with explicit Native Mesh refusal.
