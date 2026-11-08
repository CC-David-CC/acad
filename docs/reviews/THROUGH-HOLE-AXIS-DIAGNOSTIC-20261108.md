# Passive through-hole exact-axis refusal evidence

Source-only change based on 0bfdf5f5187979e0a1da0f517a83887e59977d32.
No tests, builds, probes, solver execution or browser run accompanies it.

The frozen complete E22 R1 failed its first public SegmentLength width100→150
edit before publication with UNSUPPORTED_PROFILE from
modules/engine/mount/ownedThroughHolePlan.mjs. Its accepted source is the exact
four-Segment/eleven-row rectangle at[0,0]..[100,50], but the rejected candidate's
four prepared vertices were not captured. This evidence does not establish
numerical drift, a specific failed edge, or a mathematical repair.

The independently qualified E11 recipe also starts at[0,0]. It uses
edit-rectangle-dimensions and its authenticated declared-rectangle preparation;
E22 uses edit-closed-sketch-dimension and the generic SegmentLength transition.
That is a confirmed routing difference, not a demonstrated cause of the
rejected candidate's exact-axis mismatch.

The only production change adds passive data to the existing failing predicate
in ownedThroughHolePlan.mjs. The original predicate, UNSUPPORTED_PROFILE code
and original message prefix remain exact. The suffix contains the actual four
already-admitted prepared vertices, four edge rows, and unique vertex count.
Each edge row means[sameX,sameY,xIsMinMax,yIsMinMax], using the same exact
comparisons/minima/maxima as the original predicate. It contains no opaque IDs,
whole source, Native ordinals, parameter tables or additional solve result.

Only this existing refusal constructs the suffix. The final message is bounded
to512 characters; existing oci-verified-worker refusal transport and
worker-controller preserve that same512-character boundary. A formatting
failure leaves the original refusal intact. There is no general-purpose log,
new API/error DTO, snapping, rounding, epsilon, geometry/intent mutation,
additional optimizer invocation, relaxed admission or changed acceptance oracle.

Root will run the unchanged complete E22 workflow after normal composition,
then use the exact rejected vertex/edge evidence to decide any mathematical
remedy. R1 source, criteria, receipt and failure remain frozen under
test/drawing-reference-repair-public-workflow/evidence-r1. This diagnostic
source is not a successful runtime repair or qualification claim.
