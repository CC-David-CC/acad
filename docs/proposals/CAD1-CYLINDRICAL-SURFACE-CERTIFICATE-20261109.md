# L3 finite-cylinder surface proof: proposed adapter

SOURCE ONLY / UNRUN / NOT ACCEPTANCE APPROVED. Existing failed oracle and actual
exports remain unchanged. Root implementation draft:
`test/library-validation/cylindrical_surface_certificate.py`.
Independent source/mathematical review is in progress before integration.

## Scope and library role

CGAL already supplies complete-mesh graph/degeneracy/self-intersection/volume-
boundary checks on the original binary64 coordinates. Those actual six-file
results are retained0523b3f. It does not infer intended finite analytic surfaces.

The small proposed adapter supplies that missing analytic-support connection
for a complete finite cylindrical wall, including inward-facing cavity walls.
Its inputs are original vertices/indices, the full selected wall-face census,
and explicit source center/radius/axial interval/orientation/budgets. It contains
no example names, fixed dimensions, hole count or coordinate-strip assumption.
No CAD geometry is generated, welded, repaired, reindexed or round-tripped.

Whole-mesh library validity, authoritative source assignment, all-triangle patch
classification, planar cap coverage and actual SVG/source/archive proof remain
separate. The function takes no caller-submitted `valid` or `qualified` flag.
Exact frame conversion may pass Fractions directly, avoiding new rounding.

## Proposed mathematical certificate

1. Every original assigned triangle participates. Actual incidence, consistent
   orientation, connectedness, wall Euler characteristic zero, one interval/cycle
   at every vertex and exactly two simple boundary cycles establish an annulus.
2. Actual boundary cycles lie at two distinct constant axial levels, each within
   the unchanged plane-incidence budget of its corresponding source endpoint.
   Every wall vertex lies between those actual levels.
3. Exact full-triangle radial minima stay positive. The radial projection's
   signed Jacobian numerator has the required strict sign at all three triangle
   vertices; it is affine, so this checks every point of each triangle.
4. Do not infer local injectivity from face signs alone. At each interior vertex,
   the oriented tangent-link image must wind exactly once. At boundary vertices
   it must form one interval covering the appropriate half-neighborhood. Edges
   share actual opposite uses and compatible orientation. Boundary cycles wind
   once with the proper lower/upper signs. No atan/root proximity merge is used.
5. Subject to independent review of those local-chart conditions, the resulting
   proper local homeomorphism to the finite target cylinder is a one-sheeted
   cover: boundary degree one and connectedness give global coverage/bijection.
   This implication is a review obligation, not a consequence of mesh volume or
   an assumed visual resemblance. Any gap blocks acceptance use of the draft.
6. Map radius to the source radius and map the two actual axial levels affinely
   onto the source interval. Exact convex-triangle radial extrema and maximum
   endpoint axial drift bound every mesh point's displacement. Require the total
   Euclidean bound within the ORIGINAL deflection, rather than adding another
   tolerance. Bijection gives the same bound in the reverse direction.

The radial bound avoids an approximate square root. For radius r>0, squared
radial extremum q and remaining squared allowance s, prove
`(sqrt(q)-r)^2 <= s` by `s>=0` and either `q+r*r-s<=0` or
`(q+r*r-s)^2 <= 4*r*r*q`. All operands are exact represented rationals.
Both minimum and maximum q are required. The allowance subtracts the square of
maximum axial remap drift from the square of the unchanged deflection.

## Explicit boundaries and next step

- Initial certificate admits constant-level rims; a more general boundary shape
  needs another qualified map, not rounding vertices onto a plane.
- It is an approximation/coverage proof for an exported wall, not a 50pm BRep
  claim, source-constraint solver or general NURBS certificate.
- Incomplete/degenerate/folded/multiple-degree surfaces fail certification;
  failure alone is not proof of invalid CAD geometry.
- Source/material ownership, void side, expected holes/regions, Native shape and
  persistence continue to come from the existing full actual artifact workflow.

After review, integrate a coherently versioned general mesh-evidence consumer
and this wall certificate into the full exported-artifact oracle. Bind library
results to exact original input bits/indices, executable/source custody and
complete scan outcomes. Preserve all old planar/source/STEP/archive/SVG checks.
Run the complete six-file artifact batch once the packet is ready; retain its
first outcome and review both actual SVGs only after full artifact proof passes.
