# L3 finite-cylinder draft — independent invariant and integration review

READ-ONLY SOURCE REVIEW / UNRUN / NOT QUALIFICATION, 2026-11-09.
Reviewed Root8943dc4d27725b8f86e0b9debd53f067d52f1a4f:

- test/library-validation/cylindrical_surface_certificate.py
  blob107c881fcd4a62c57f46892bde859cd7edc87778.
- docs/proposals/CAD1-CYLINDRICAL-SURFACE-CERTIFICATE-20261109.md
  blob6f5d666fc2be3a0812e7b8de08b0d8d666a7f5e6.
- Unchanged test/selected-profile-extents-workflow/mesh_oracle.py
  bloba3bef6dfd185e1fb1b487aa4b4bb07a61353bafc, plus its actual check.py caller.

No helper import, parser, test, probe, TSC, build, Native or browser operation was
executed. Only source/Git objects were read. No reviewed source/evidence was
modified. Timeline owns the separate mathematical coverage review; this note
does not substitute for it.

## Conclusion

The draft actually implements the advertised per-selected-triangle extrema,
strict radial Jacobian, indexed incidence, connected-annulus, complete vertex
link and two-rim conditions. I found no concrete omitted local topology check or
source-derived false geometric success from those conditions in this review.
This is neither a theorem signoff nor a reproduced result. The proposal rightly
makes the one-sheeted-cover implication an independent mathematical obligation.

One concrete boundedness gap needs an explicit remedy/precondition before
adoption: declared count caps do not bound input materialization or exact
arithmetic. Complete-wall/source assignment, original-frame conversion, global
CGAL and planar cap proofs remain mandatory caller obligations; none is supplied
by invoking this helper. There is currently NO integration call.

## Confirmed boundedness/input-contract gap

certify_full_cylinder lines79–91 performs:

1. Q conversion of support/budget and tuple(map(Q,center)) before checking
   center length or a numeric/arithmetic input envelope.
2. ids=list(triangle_ids) before testing the100000 cap. An arbitrary oversized
   or nonterminating iterable is consumed before the supposed resource guard.
3. All referenced coordinate Q conversions before checking150000 unique points
   or three coordinates per vertex. No type/length preflight excludes oversized
   coordinate iterables before consumption.
4. No numerator/denominator bit bound or derived exact-operation budget. The
   documented Fraction input route accepts arbitrary-width rationals; face and
   vertex counts alone do not bound the cost of cross products, divisions,
   winding or squared-distance comparisons. A single arbitrarily large rational
   can exceed the intended finite resource envelope before a geometric refusal.

Q also accepts booleans, decimal/rational strings and other convertible objects.
The draft does not establish that they are original finite binary64 coordinates
or authenticated exact frame arithmetic. The existing artifact parser produces
owned float lists, so this is NOT evidence of a reachable malformed-app or
accepted-artifact incident. It is a source-level precondition gap in the proposed
general helper. A strict, proven, bounded caller could discharge it instead of
duplicating every guard in the helper; that contract must be explicit and
reviewed, not inferred from eventual success.

Required remedy: check own finite bounded sequences/record shapes before
materialization, exact numeric provenance/types before conversion, and derive
and enforce rational width/work bounds from the actual finite binary64/source/
frame operation path. Preserve exact values; do not truncate, coerce, overflow,
snap or replace a difficult row. Exhaustion means resource/unsupported
certification, not invalid CAD geometry. Do not guess a small bit cap that
silently excludes otherwise supported finite inputs; derive the admitted bound.
No guard change or execution was made here.

## What the code does implement

| Obligation | Actual source | Review finding |
| --- | --- | --- |
| Selected triangle IDs and actual vertex indices |84–91 | Unique selected IDs; strict int indices in range; exactly3 distinct indices per selected triangle; actual indexed coordinates retained, no welding/reindexing. |
| Complete triangle radial extrema |30–44,97–100 | Origin-in-projected-triangle case or exact clamped edge minima, and vertex maxima. These cover the entire convex projected triangle, not a sample grid. |
| Nondegenerate consistently oriented radial map |96,103–104 | Strict sign of affine Jacobian numerator at ALL3 vertices. A zero normal or axis-reaching triangle fails. |
| Indexed edge incidence/orientation |105–122 | Every selected directed edge charged;1/2 uses only; paired uses opposite; directed boundary cannot branch. |
| Connected wall/Euler |123–131 | All selected faces reached; V−E+F=0; directed boundary vertices have a permutation census. |
| Exactly two finite boundary cycles |132–158 | Every boundary vertex visited once, cycles close and have≥3 vertices; exactly2; constant distinct axial levels within existing incidence; all selected vertices in interval; exact required lower/upper winding. |
| Full vertex links |108–110,160–177 | Successor/predecessor uniqueness, one interval or cycle by boundary membership, and traversal covers ALL link nodes. A detached link cycle cannot hide behind correct degrees. |
| Interior local degree |178–193 | Actual tangent-link image, winding exactly orientation. Strict triangle Jacobian supplies adjacent-sector orientation; this is not omitted in favor of rim winding alone. |
| Boundary local chart |183–190 | Link endpoints exactly tangential to rim, all vectors in correct axial half-plane, correctly signed opposite angular endpoints. Together with actual full link and strict face Jacobians, this implements the proposed half-neighborhood test. |
| Whole-triangle distance |62–67,194–197 | Checks BOTH radial extrema; remaining squared allowance deducts maximum axial-remap drift squared from ORIGINAL deflection squared. No extra tolerance is simply added. |

Subsetting the triangle list is not automatically authenticated as the complete
wall. Removal of an ordinary interior face creates extra boundary/link/Euler
failures, and a multiwinding annulus is checked by rim and local degrees; that
does not let the helper certify the intended assignment of every mesh triangle.
For example, the function has no access to the expected external wall-ID census
to distinguish an omitted input record from a different caller-selected patch.
That is explicitly a separate integration obligation, not a confirmed false
success of the stated annulus predicates.

Geometric crossings/contacts between the selected wall and another patch, whole
mesh self-intersection, actual material/void side, orphan triangles outside ids,
and planar cap coverage are also not tested here. The proposal explicitly keeps
them separate. A successful return cannot replace those checks.

## Exact unchanged-caller integration obligations

At8943dc4 the only certify_full_cylinder occurrence is its definition. The
selected-profile mesh_oracle.py remains unchanged:

- lines42–51 retain count/finite coordinate/frame/source support setup.
- line47 computes local coordinates with ordinary floating subtraction/sums.
- lines63–69 still REQUIRE each curved triangle to have exactly TWO distinct XY
  locations and group them into straight-generator rectangles.
- lines97–115 prove actual indexed rim joins, planar area/no-overlap and those
  old generator rectangles.
- lines79–96/116 retain full indexed manifold, genus and volume checks.

Therefore adding the new file does not change the currently failing generator
predicate and proves no new artifact. Integration must be a coherent replacement
of that particular wall-evidence method, not a catch that bypasses it or a
post-hoc successful flag. Preserve ALL actual original indices/triangles and
existing100000T/150000V,8MiB controlled-mesh and other current resource caps.

Specific required seams:

1. Bind original exported vertex bits, ordered triangle indices and artifact SHA
   to actual complete CGAL outcomes/executable/source custody. The proposal
   cites0523b3f; this source review did not execute or independently reclassify
   that evidence. A boolean named valid, a rewritten/welded mesh, or an outcome
   for another file is not the prerequisite.
2. Derive source support/center/radius/finite interval/orientation from actual
   original authored source + frame + patch ownership, with no AABB/nearest
   surface inference. Assign EVERY original triangle exactly once. Refuse
   ambiguous/missing assignments; never select only a convenient annular subset.
3. Convert original world coordinates into the authenticated local frame exactly
   before this certificate. Rationalizing the already-rounded line47 local
   values would certify a different mesh. Current frozen signed-permutation
   frame qualification is explicit; do not silently broaden to arbitrary frames.
4. Keep all current planar cap/floor/rectangle support, overlap and finite-hole
   domain proofs. Actual wall boundary edges must be the SAME indexed edges
   paired to the appropriate actual cap/floor patches in the global census.
   The return's two rim-edge COUNTS alone do not authenticate those associations.
5. Retain full global manifold/link/orphan/genus/positive-volume checks and the
   independent source/material/region/3MF resource associations. The existing
   check.py mesh reader parses v1/v2/v3 indices; a new general consumer must also
   preserve the exact input grammar/material semantics rather than permit
   unexamined per-triangle overrides or silently omit extra records.
6. Keep DEFL=.01 and INC=1e-6 as their distinct current mesh roles. The draft
   subtracts axial drift from the total radial allowance; do not reintroduce
   DEFL+INC as an additional wall-distance budget. Preserve the original cap
   proofs and source/STEP/archive/SVG checks rather than relabel this a global
   CGAL/analytic certificate.

## Required complete acceptance coverage (future Root execution only)

No isolated helper loop or synthetic positive surface is requested. Review the
coherent integration first, then run the complete existing six-file actual
artifact batch once, preserving its first outcome and every original export.
Positive evidence must include the actual non-generator triangulation that
motivated this proposal, outer orientation+1/inward cavity−1 where present,
both complete rims, relevant interior stars, original placed/source frames,
planar cap/floor joins and current original mesh budgets. Retain exact source,
Native/STEP, archive and actual SVG obligations; review both actual SVGs only
after full artifact proof passes.

A complete reviewed acceptance design also needs explicit refusal coverage
derived from genuine owned artifact inputs for malformed/out-of-range/non-int
indices, duplicate selected IDs, missing assigned faces, duplicate/extra
coverage, reversed/folded triangles, disconnected/pinched links, multiple rim
degree, wrong finite interval/source/patch bindings and exact-work resource
exhaustion. These must be negative-only copies with original files unchanged,
not seeded positive geometry or source flags. No such control was executed or
implemented in this task; Root must approve and freeze the complete finite
consumer/acceptance before execution.

Current disposition: SOURCE DRAFT UNRUN, not accepted/qualified. The resource
contract, complete integration, independent mathematical review and complete
actual-artifact evidence remain open.
