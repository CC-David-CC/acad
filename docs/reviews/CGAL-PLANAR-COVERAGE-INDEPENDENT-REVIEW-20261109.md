# Exact planar coverage: independent source review

SOURCE REVIEW ONLY / UNCOMPILED / UNRUN / NOT QUALIFICATION, 2026-11-09.

No confirmed blocking adapter defect was found in the reviewed source. The
projected-set result is conditional on the external obligations below; it is
not independently a certificate of indexed cap ownership, 3D planarity or
analytic-circle accuracy. No source repair or broader algorithm is proposed.

## Exact inputs

Reviewed Core `420ea4ef8a92ec1208aa2852e1e876ed29d760c1`, including implementation
checkpoint `ff045b45de3b6be8198d3c02096103ec9ce28f5d`. The implementation and
protocol have no differences between those two commits. Own review branch
contains only this added note beyond the reviewed input.

| Path under `test/library-validation/cgal/` | Git blob | SHA-256 |
| --- | --- | --- |
| `planar_coverage.cpp` | `4927f4952936df5b26f00396f48adea47d63c562` | `18688fe7569c3463baf8c2512704da8a9a920584ee20db5236f7d0a5132837b4` |
| `PLANAR-PROTOCOL.md` | `763bf263dff1f29a80afc0aa9d86e7898dfd3a28` | `2c0146015ab346cebd8c71984d3fef057996177b6d03d08de8f6abd48a6eb32f` |
| `PLANAR-SOURCE.md` | `2f79160b32225ee01c6a52597d54835241d3ea71` | `331ff1521dc0ab04417ddcd60b5c884ed55f23e1df1518574aec3818ab70f88e` |
| `CMakeLists.txt` | `80eae10588cfb094e9f7bc566c1e5bcfc2c8877a` | `486e10de0a47972e2ea166a7019f1eb287eed9eb454971afea132f5150ba6ea9` |

Read operations were source/Git/hash inspection and primary upstream CGAL5.6
source/documentation only. No imports, parsing of candidate artifacts, tests,
compilation, Native/browser execution or frozen input edits occurred. The
existing 3D adapter is unchanged.

## API and mathematical review

`bitsValue` reconstructs each finite binary64 using integer bit assembly and
`memcpy`, then materializes its EPECK exact value. `project` subtracts the exact
original world origin before the exact signed-permutation dot products. It
does not first round a local double. The frame gate proves distinct signed axes
and right-handedness. This is consistent with CGAL5.6's retained arithmetic
constant and exact materialization path; no Float32 or decimal coordinate
conversion was found. [CGAL5.6 Lazy_exact_nt source](https://raw.githubusercontent.com/CGAL/cgal/v5.6/Number_types/include/CGAL/Lazy_exact_nt.h)

The domain gate checks zero edges, simplicity, nonzero area and original
orientation before temporary normalization. Cross-loop boundaries cannot touch;
representative containment after that disjointness check establishes strict
hole-inside-outer and mutual hole noncontainment. Thus the temporary outer CCW /
holes CW polygon-with-holes satisfies the actual Boolean package admission
conditions. `bounded_side` is called only on already-simple rings.
[CGAL5.6 polygon validation](https://raw.githubusercontent.com/CGAL/cgal/v5.6/Boolean_set_operations_2/include/CGAL/Boolean_set_operations_2/Gps_polygon_validation.h),
[Polygon_2 source](https://raw.githubusercontent.com/CGAL/cgal/v5.6/Polygon/include/CGAL/Polygon_2.h)

All unique selected original IDs are scanned, with original tuple orientation
checked before temporary reversal. A projected three-point polygon with nonzero
signed area is simple; zero-area triangles are recorded before Boolean insertion.
`Polygon_2::area` itself uses the area algorithm without a simplicity
precondition, so this degeneracy test does not violate the simple-polygon
precondition of `orientation` or `bounded_side`.
[CGAL5.6 Polygon_2 source](https://raw.githubusercontent.com/CGAL/cgal/v5.6/Polygon/include/CGAL/Polygon_2.h)

The actual range operation is `join`, not disjoint-range `insert`: CGAL5.6
constructs separate arrangements for the input polygons and unions them.
Overlapping triangles are therefore legitimate diagnostic inputs. Exact
unsigned triangle-area sum equals exact union area iff positive-area multiple
coverage is absent. Exact symmetric difference independently establishes the
submitted finite domain; equal total areas alone cannot pass. The separate
missing/outside checks are consistent with that equality. Negative overlap
diagnostics use interior intersection, so a shared edge is not mislabeled a
positive-area overlap. [CGAL5.6 Boolean implementation](https://raw.githubusercontent.com/CGAL/cgal/v5.6/Boolean_set_operations_2/include/CGAL/Boolean_set_operations_2/Gps_on_surface_base_2.h),
[Polygon_set_2 reference](https://doc.cgal.org/5.6/Boolean_set_operations_2/classCGAL_1_1Polygon__set__2.html)

Count/range checks precede dependent allocations. Every selected triangle must
participate before PASS; a failed original orientation/degeneracy scan cannot
be repaired by normalization. Primary union, complete area enumeration and set
decisions have distinct completion fields. Bounded negative diagnostics retain
original IDs and distinguish complete census from complete ID storage. Resource
or unexpected failures cannot return exit0/PASS. A diagnostic failure may make
the overall status RESOURCE_LIMIT/ERROR after a known negative primary result;
that conservatively retains the separately reported primary decisions.

## Precise remaining assumptions at integration

1. **Indexed boundary and complete patch authority remain external.** Mode0
   checks submitted IDs, order and projected geometry; it does not prove that
   each loop edge is an actual boundary edge of the selected original triangle
   patch, nor that all semantic cap triangles were selected. Coincident points
   with different original IDs are geometrically indistinguishable to this
   regularized-set calculation. The caller must independently bind the full
   patch census, original indexed loops and actual neighboring wall/cap roles.
   Without that proof, a PASS is only equality to submitted projected loops.

2. **Projection loses one coordinate.** Exact 2D coverage does not prove the
   original world triangles lie on the required plane: a nonplanar patch could
   have the same projection. Retained original-world finite plane incidence,
   complete embedded/oriented mesh evidence and source/analytic displacement
   proofs must remain separately bound. The adapter honestly reports those
   roles NOT_RUN. Regularization also does not establish lower-dimensional
   indexed seams or vertex links.

3. **Source-rectangle mode selects a genuinely different exact proposition.**
   Its corners must be independently authenticated authored local quantities.
   Exact set mismatch against ideal corners can coexist with legitimate bounded
   source/Native drift. The caller must preselect its intended reference mode
   and preserve that result; automatically retrying with indexed mode to obtain
   PASS would not prove the original proposition.

4. **Arrangement limits are post-operation checks.** The stated input/output
   bounds do not preempt CGAL allocations or work during a range union or
   overlay. Actual process ownership, external time/RSS limits, bounded output
   settlement and executable/input/source custody are still required. A killed
   process or incomplete report supplies no planar certificate. These are
   explicit protocol dependencies, not new measured resource guarantees.

Subject to those existing boundaries, this source review found no missing
CGAL5.6 precondition or false-PASS path in the finite projected-set algorithm.
The first normal build and complete actual-artifact assessment remain pending.
