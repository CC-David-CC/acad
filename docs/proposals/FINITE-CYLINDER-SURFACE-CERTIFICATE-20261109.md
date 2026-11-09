# Finite cylindrical-annulus certificate: proposal and source review

Status: SOURCE ONLY; no implementation/execution/qualification by this lane.
Base `32700df4e38e34269a0a9892e00f0220f5daf0eb`. No checker, product, original
mesh, failure or evidence changes. The purpose is a general sufficient proof for
finite full-turn cylinders, replacing the two-identical-XY/strip assumption.

## Exact source/evidence boundary

Reviewed original `test/selected-profile-extents-workflow/mesh_oracle.py`, blob
`a3bef6dfd185e1fb1b487aa4b4bb07a61353bafc`; retained actual diagnostic blobs
`b6bca7dc9b76d712a585bf432671dd5610bda289` (actual-report.json) and
`b505281b33cdc35210e82e62e2091f9f5f9d2ffd` (wall-statistics.json).
They preserve the real nine-ULP difference; they do not evaluate the projected
vertex-star proof below. Earlier countersink comments are an analogy, not proof.

Also read Root's UNCOMMITTED/UNRUN draft at
`/tmp/codi-acad-foundation-next-20261109/test/library-validation/cylindrical_surface_certificate.py`,
SHA256 `07793d72be0ed8fca02a398dfd5358d85f21847b29774523bf6c31fdf57dafe8`.
No imports, calls, probes or edits of that file were made. Its source review is
below. Root reports R3 general-library checks passing all six unchanged meshes;
that does not by itself establish analytic coverage or source intent.

## Support and topology prerequisites

The caller independently derives source axis/frame, center c, radius r>0,
source axial endpoints a<b, material-normal sign s (+1 outer, -1 void), the
unique original wall-face set, and source-required neighboring patch boundaries.
No mesh fitting, labels, caller grouping flags, Native ordinal or opaque-ID
parsing establishes these facts. CGAL geometric validation, raw incidence/links,
original-array identity and source/patch census remain separate prerequisites.

This class allows arbitrary triangulation, interior vertices, unequal rim counts,
unrelated phases and genuinely different near-generator coordinates. It requires
two actual constant axial-level rims. Partial angular walls, cones, nonconstant
rims or ambiguous owners stay UNSUPPORTED/NOT_CERTIFIED, not invalid solids and
not flattened. The caller preserves exact local coordinates: convert original
binary64 values to rationals BEFORE subtracting source origin/center. Current
guarded signed-permutation frames permit that directly; general inexact rotations
need a separate transform-error contract. Preserve frame handedness/orientation.

For the selected patch require edge connectivity; opposite pairs of interior
edge uses; one use per boundary edge; a single cyclic interior vertex link or
single boundary link interval; exactly two disjoint simple indexed boundary
cycles; Euler V-E+F=0. These make a connected orientable compact annulus. Whole-
mesh manifoldness does not imply a selected subset is a manifold. Both rim
neighbors must share identical ORIGINAL edge/vertex IDs and the correct source
role. No welding, nearest match or synthesized seam.

Let exact actual rim levels be a*<b*. All patch points lie between them, and only
boundary points may have endpoint axial levels. Retain the existing incidence
checks |a*-a|<=tau, |b*-b|<=tau, tau=1e-6mm. Unsupported nonconstant levels are
not averaged. The local checks below can imply endpoint-interior exclusion, but
the proof must state it rather than assume it.

## Face and differential-star proof

Write p=(x,y,z), w=(x-cx,y-cy), and an oriented triangle normal
N=(p1-p0) cross (p2-p0). Compute exact ENTIRE-triangle radial extrema:

```text
m = min_triangle |w|^2
M = max_triangle |w|^2 = max_i |wi|^2
G(p) = Nx*(x-cx) + Ny*(y-cy)
```

For m, use convex projection: zero if the origin lies in the projected triangle;
otherwise the minimum of exact clamped edge projections, including a degenerate
XY projection. Require m>0. Vertex/centroid samples cannot prove this.
Require STRICT s*G(pi)>0 at every triangle vertex. G is affine, proving its sign
everywhere. Existing candidate radius/incidence bands remain separate.

Use the analytic proof map (never edited coordinates):

```text
t(z) = a + (b-a)*(z-a*)/(b*-a*)
F(p) = (c + r*w/|w|, t(z))
k = (b-a)/(b*-a*) > 0
```

Its face Jacobian in angular/axial coordinates is k*G(p)/|w|^2. Face signs alone
do not prove local injectivity at vertices, nor global coverage.

At each vertex v and actual neighbor displacement e=u-v form exact vectors
`Dv(e)=(cross2(wv,e.xy), |wv|^2*e.z)`. Reconstruct their DIRECTED link using
actual cyclic triangle orientation, not sorted neighbor IDs. The positive axial
scale k does not change winding. For consecutive neighbors in a face:

```text
det(Dv(e1),Dv(e2)) = |wv|^2 * G_face(v)
```

Thus face checks imply each consecutive determinant has strict sign s. Require
an interior link's exact ray-crossing winding to equal s, magnitude ONE. Strict
sector signs plus degree one tile one full turn; per-face signs without that
winding could permit repeated turns/branching.

A boundary link is one path. Its two endpoint vectors are the genuine rim
neighbors, nonzero/opposite on the horizontal axis. Other vectors must lie in
the upper half-plane for the lower rim, lower for the upper rim, with consistent
determinants and correct endpoint order. These conditions tile a half-plane once.
Strict internal half-plane membership follows even from a closed-half-plane
test: an extra internal axis contact cannot have the required strict consecutive
determinants before AND after it. That implication matters for Root's draft.

Along an interior edge, opposite original uses and the strict common face sign
put projected face interiors on opposite sides. Its differential is nonzero,
otherwise an incident face determinant vanishes. No edge fold is allowed.

## Local-to-global argument and its limits

Near a vertex choose a smooth angular chart, possible since |wv|>0. On finitely
many incident faces, F(v+e)-F(v)=DFv(e)+O(|e|^2). The certified differential fan
is nondegenerate and covers one turn. On a sufficiently small star boundary the
actual map is homotopic to that fan without meeting its origin, giving local
degree s. Common strict face signs prohibit cancellation, so regular nearby
values have exactly one preimage. The edge checks and single fan extend this
across the star. At a boundary vertex the half-star/doubled half-plane version
gives one sheet up to the boundary. No numerical neighborhood radius is guessed
or used to alter the mesh. This is the piecewise-smooth local lemma to review.

Every face also has no separate hidden radial preimage: at fixed angle and z
its supporting-plane equation is linear in radius, with nonzero radial
coefficient G/rho. The convex triangle's XY projection excludes the origin,
so it has a single angular chart. This is consistent with, not a substitute
for, the vertex/edge argument.

Traverse both rims in their INDUCED wall-boundary orientation. Require exact
integer winding s at the lower rim and -s at the upper. Each rim edge's angular
derivative has sign cross2(wu,wv) divided by positive squared radius. Correct
boundary-star endpoints imply that every induced rim edge has the same strict
angular direction. Together with degree one this makes each rim a circle
homeomorphism; no independent loop reversal or atan2 tolerance is permitted.

F now maps only boundary to boundary and is locally one-to-one, including its
boundary collar. Compactness makes its interior map proper. A proper local
homeomorphism has finitely many sheets with locally constant count. The target
cylinder interior is connected. A one-to-one boundary collar fixes the count
to ONE: extra sheets approaching a boundary value would have a compact limiting
preimage on the boundary, contradicting boundary bijection or its local chart.
Therefore every angle/axial height has exactly one preimage. This proves global
coverage/no radial overlap separately from accuracy and mesh embeddedness.

Endpoint-interior exclusion is essential. It follows in the reviewed draft:
an interior vertex at a* would have every differential neighbor vector in the
closed upper half-plane, inconsistent with winding +/-1 (similarly at b*).
An interior edge at an endpoint level would create an internal axis contact
in a boundary link, inconsistent with the strict determinant sequence. Face
interiors cannot have endpoint level because a horizontal face has G=0.

This argument is a proposed sufficient proof, not a theorem inferred from a
CGAL watertight flag. The established mesh-bijection literature distinguishes
orientation consistency from injectivity. Lipman's simplicial/polytope results
support that distinction, but are NOT cited as directly proving this nonlinear
cylindrical map. [Primary paper](https://arxiv.org/abs/1310.0955v2)

## Exact complete-triangle Euclidean accuracy

For a triangle, d(z)=t(z)-z is affine, so axial error squared is bounded by
`Ez2=max_i d(zi)^2`. Radial error squared is bounded by the larger of
`(sqrt(m)-r)^2` and `(sqrt(M)-r)^2`. Require BOTH plus Ez2 to be <=delta^2,
using the EXISTING delta=0.01mm. Root's draft uses the conservative global
`drift=max(|a*-a|,|b*-b|)`, which bounds |d(z)| over the entire wall. That is
valid, though less sharp than a per-triangle axial bound.

No rounded square root is necessary: for x=m or M and allowance=delta^2-Ez2,
let C=x+r^2-allowance. For r>0, x>=0 and allowance>=0, accept exactly when
`C<=0 OR C^2<=4*r^2*x`. This is equivalent to C<=2*r*sqrt(x). Preserve actual
authoritative policy values as rationals; decimal prints are diagnostic only.

Radial/axial errors are orthogonal, so every actual triangle point is within
delta of F(p). F being onto gives the reverse direction for every intended
finite-cylinder point. Hence symmetric wall Hausdorff distance <=delta, without
a sampled or unqualified reference mesh. The affine axial map is a proof map,
not snapping: actual/source endpoints and drift remain explicit, separately
bounded by the unchanged incidence budget.

The old candidate band r-delta-tau<=rho<=r+tau alone does NOT establish 0.01mm
Euclidean error after axial drift. Retain it for support classification, but
use actual extrema for the already-declared surface budget. Do not call
delta+tau 'delta', relax a tolerance, or infer 50pm BRep/arc-branch accuracy.

## Independent critique of Root draft 07793d72...

No blocking false-positive/source defect was identified in its stated finite-
cylinder class, conditional on the external source/whole-mesh prerequisites.
The following source relationships were checked without execution:

| Draft lines | Reviewed implication |
|---|---|
| 98-104 | Entire convex-triangle radial extrema and exact affine G sign; not centroid checks |
| 108-110,160-177 | Directed link arcs come from actual cyclic face order; uniqueness, predecessor census and traversal establish one path/cycle |
| 112-151 | Opposite edge uses, connectivity, Euler0, two simple constant-level rims and true interval ordering |
| 181-193 | Differential vectors are the correct common positive scaling; interior winding is explicit |
| 185-190 | Non-strict half-plane containment is sufficient WITH inherited strict determinant signs and opposite ordered endpoints; no extra axis contact can pass |
| 153-158,185-190 | Although rim cross signs are not separately asserted, each outgoing boundary edge is the first boundary-link vector, whose strict endpoint sign fixes its angular direction |
| 194-197 | Global endpoint drift bounds the affine axial remap; exact squared radial check is equivalent and conservative |

The lack of an explicit consecutive-determinant loop is not a missing predicate:
the identity above, strict face checks at every vertex and exact directed link
construction already impose it. Likewise endpoint-interior exclusion follows
from those star conditions. Explicit comments/assertions could aid future
maintenance, but this review does not invent a failing state or request a
mathematical threshold change.

Caller obligations remain real: this helper does not authenticate source support,
verify global CGAL custody, identify actual cap/floor neighbor roles, enforce
unique whole-mesh patch coverage, or reproduce old rim vertex-incidence tests.
Those checks must stay in the integration. A valid wall return cannot be passed
off as a whole-body/source certificate, nor may a caller supply successful flags
instead of actual validation. No current callsite was changed or executed.

## Full-surface assembly, library role and explicit limits

Apply the SAME wall certificate to every required outer/inner/blind/through
cylindrical patch. A wall theorem cannot qualify an arbitrary cap: retain/prove
finite planar domains, cap/floor/outer-side coverage, void/material orientation,
source interval/frame, archive/provenance and core material association. Every
actual face and every intended analytic patch must be accounted for before a
maximum per-patch distance bound can cover the full boundary-surface union.
Shared ORIGINAL rims and matching intended endpoints are the gluing authority.

If planar coverage still relies only on approximate summed area, a general
exact polygonal reconciliation is available: project original triangles and
actual boundary loops, prove the union equals that finite polygon-with-holes
domain, and retain separate no-overlap/ownership checks. CGAL5.6 Polygon_set_2
provides union, difference and symmetric difference. It does not itself prove
polygon-to-circle deviation or source identity; certified rims and finite source
domain checks remain necessary. This is an explicit assembly obligation, not a
claimed observed new cap defect or permission to waive existing criteria.
[CGAL polygon-set API](https://doc.cgal.org/5.6/Boolean_set_operations_2/classCGAL_1_1Polygon__set__2.html)

The reviewed CGAL5.6 bounded Hausdorff method compares TWO MESHES. Its sampled
method is weaker still. Neither supplies finite analytic-cylinder authority
without independently established reference error. No better directly applicable
finite-analytic distance certificate was established in this bounded API review.
The proposed small analytic-support certificate avoids an unqualified reference
tessellation while reusing CGAL for general validity; it does not rewrite a CAD
primitive or create a new editable model.
[CGAL distance contracts](https://doc.cgal.org/5.6/Polygon_mesh_processing/group__PMP__distance__grp.html)

| Insufficient evidence | Remaining obligation/counterexample |
|---|---|
| Vertices near circle | Chord/triangle interior can approach/contain axis; exact whole minimum required |
| Centroid normal correct | Affine radial Jacobian may vanish/change sign toward a vertex |
| Every face has same sign | Differential fan can wrap; local degree-one star test needed |
| Local regularity only | A multi-sheeted covering is possible without boundary/global conditions |
| Whole mesh watertight | A chosen subset may have extra boundaries/fans or wrong owners |
| Correct volume/area sum | Missing/overlapping/wrongly shaped regions can compensate |
| Near-equal coordinates | No indexed connectivity or source ownership follows |
| Source endpoints correct | Actual rims can be nonconstant/reversed; no flattening permitted |

A future report must bind raw arrays and source support, retain actual/source
endpoints, original face/edge/star/rim censuses and failing IDs, exact radial/G
extrema and squared accuracy comparisons. Bounded diagnostic overflow/resource
failure is not a successful truncated census. Incidence/link/rim work is linear
in the original wall graph; exact-arithmetic and general CGAL costs remain under
Root's unchanged input/array/process budgets. No new SLA or tolerance is proposed.

Next: independent review of this local lemma/global argument and complete cap
assembly; Root approval/freeze of the reusable helper and complete integration;
then one coherent independent after-whole six-artifact batch. No old result is
promoted, no code or execution is authorized by this document, and L3 stays OPEN.
