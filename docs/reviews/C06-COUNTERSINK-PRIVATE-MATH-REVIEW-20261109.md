# Private countersink math / wire review — source only

Reviewed frozen helpers `10b2f2b1207a7c2587df213926167a9a0fbbc55a`,
contract `384ec024ed57a04014722f6e786ee863d98893b8`, root compositions
b7cbd5f/c011ff2 and review82af6a9, against Native
`fc1654ee5d4471584073d4d8e3363d8c9b324566`. No confirmed mathematical or
wire-schema blocker found in this finite private foundation. This is NOT an
invocation/owner certificate or a qualified/runnable countersink. No product
changed; no parser, tests, probes, TSC, build, Native or browser execution.

## Exact reviewed source

All module addresses below are under `modules/engine/mount/` at10b2f2b.

| File | Git blob |
|---|---|
| ownedCountersinkPlan.mjs |0c2d1a075d5b8c314ee06c054d952875960503fe |
| ownedConicalContract.mjs |2f63de0da51046f644a5372e3d89a269e7c63fab |
| countersinkFacts.mjs |50d894e90817daaabf9714ba6d40526982e05a24 |

Native headers atfc1654e: ownedConeTopologyV1.hpp blob
6ae6816a995c9f0b23deadb1b9cdc8f00398a406; ownedConicalFrustumV1.hpp blob
31c6852c6e2771385c0db484582c1ada1f539a75. Existing OCCT source, not memory
of a cone convention, supplies the comparison: occt/src/gp/gp_Cone.cxx:35
(blob a213943b8c75b5232eec49f2a9417996c66b51b9) and
occt/src/ElSLib/ElSLib.cxx:54,520 (blob86d7f591f534468484024797dbe7e9eb1dab1feb).

## Concrete source conclusions

* Plan lines18–27 reconstruct the admitted actual four-Segment rectangle in its
  own right-handed frame and compare the actual last-cap observation; they do
  not infer an arbitrary body from a world AABB. The literal15-field input is
  numeric only. Identity/current producer/source/cap and complete source history
  still need actual coordinator custody; matching fields do not provide it.
* With r=d/2, R=D/2 and k=tan(alpha/2), h=(R-r)/k and s=T-h are correct for the
  FULL included angle alpha. The interior and representability refusals are
  explicit. Small tool spans −1..T+1. Frustum starts at s with radius r, extends
  h+1 with radius R+k; its intersection atT is R. Its1mm overrun is construction
  geometry, not an extra authored feature or a full-height conical wall.
* First removal is pi*r²*T. Extra removal after that cylinder is
  pi*h*(R²+R*r−2*r²)/3 = pi*h*(R-r)*(R+2*r)/3. The factored code avoids the
  squared-radius subtraction; neither expression is substituted for Native mass.
* OCCT parameter V is slant distance: axial displacement is V*cos(beta), radius
  is referenceRadius+V*sin(beta). Therefore Facts30–36 correctly use AXIAL
  displacement times tan(beta), including negative semiAngle and reversed axis.
  Positive source-axis slope is dot(axis,z)*tan(beta). It is not sin(beta), and
  the full included angle is2*atan(slope).
* For positive radius and abs(beta)<pi/2, the radial sign of dU cross dV is the
  support handedness. Facts48–49 correctly combine gp_Cone.Direct with actual
  FORWARD/REVERSED face orientation for tool-outside versus cut-inside material.
  Cap normals separately include actual face orientation. No extra sourceCopy
  transformation is applied to already-composed Native ancestry.
* Contract37–65 matches the actual Native joint V1-plus-cone schema, complete
  ascending cone membership, signed angle/direct basis and constructor version1
  metrics/provenance. The Native constructor explicitly calls metrics(shape,1).
  Exact builder frame/radii/height, role membership and counts are bound to the
  same captured catalog before tool finite qualification.
* Facts46–69 check two complete circular rims, one repeated opposite LINE seam,
  actual rim vertices, bounded LINE range, the three whole-interval quadratic
  coefficients, actual cap disks and two-face incidence. For exact real
  arithmetic, |rho²-R²|<=supportMm*minimumRadius implies radial error<=supportMm
  because rho+R>=minimumRadius. The implementation uses ordinary floating-point
  evaluation, not outward-rounded interval arithmetic; root's existing bounded
  numerical-predicate limitation remains honest. This is no global error proof
  or reason to widen its thresholds.
* Facts87–106 bind first cylinder B ancestry, actual inherited A caps/all faces,
  finalA EXACTLY to captured first topology, finalB EXACTLY to coupled frustum
  topology, and final coupled observation EXACTLY to final Boolean topology.
  Unique surviving wall/cap identities, finite0..s cylinder, finite s..T cone and
  the SAME transition/entry/bottom edges close the intended finite family. The
  constructor overrun rim atT+1 is never asserted to survive atT. Lost/split/
  generated/merged or extra-floor/shoulder/wall outcomes refuse.

## Precise integration boundaries (not new defects)

The planned coordinator must adapt actual parent prism provenance
`data.caps.{firstFace,lastFace}` to the private helper's
`sourceCaps.{first,last}` and pass the actual observation/created/evidence tuple;
these different field names are not interchangeable. There is no existing
coordinator here to review as implemented. Current validity is required by
actualBoolean, but actual invocation/owner/build and source-history authentication
must precede the helper; JSON capture cannot supply that missing authority.

Support position/radius1e-7mm, direction1e-8, angle1e-12rad, cap incidence1e-9mm
and cap/basis1e-12 remain their declared Native predicates, distinct from50pm
source and existing artifact budgets. Near-degenerate, large-origin and rotated
real geometry have not been exercised; conservative refusal is not a supported
success claim. The scope is legacy[0,T], not selected extents or arbitrary parent
history. Four charged actual new results, real cleanup/input preservation,
per-increment precision/mass/bounds/points/triangles, typedANGLE, J/PM/persistence,
new compiled cohort/closed graph and export/full public workflow remain deferred
exactly as PRIVATE-FOUNDATION lists. Nativefc1654e only repairs source publication
fences; it does not create an installed runtime pair or transfer old proof.
