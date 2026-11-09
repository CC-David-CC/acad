# Read-only CGAL raw-mesh adapter

Source-only initial packet, based on accepted plan
`09c7bc881ebc9cf2ef8f1daa0b111f654e113b79`. No dependency acquisition,
configuration, compilation or execution has been performed by this lane.
Root provisions, builds and runs the complete actual-artifact batch.

This offline executable checks general geometric validity of one raw indexed
triangle mesh. It does not read a CAD project, 3MF, STEP or SVG, derive intent,
generate a reference mesh, repair an input, or certify surface deviation. Keep
the original extent R4 failures and diagnostics unchanged. Full finite-surface
accuracy/coverage remains **OPEN** in the accepted plan; a generic PASS here
cannot qualify that design or rewrite its failed oracle.

## Pinned API/build assumptions

Target API: **CGAL 5.6.x**, C++17, IEEE754 binary64, GMP/MPFR exact-number
dependencies selected through the actual CGAL package. The Root provision plan
is Ubuntu `libcgal-dev 5.6-1build3` with isolated Boost1.83/GMP/MPFR development
packages. This source does not acquire packages, choose alternate versions or
change system installations. CMake rejects versions outside 5.6.x. The report
includes the actual `CGAL_VERSION_STR`; the outer custody report must also pin
the exact package/source/dependency/compiler/flags/executable hashes.

Source assumptions reviewed against official 5.6 documentation/headers:

- [EPECK](https://doc.cgal.org/5.6/Kernel_23/classCGAL_1_1Exact__predicates__exact__constructions__kernel.html)
  supports exact predicates/constructions and point construction from doubles.
  The adapter reconstructs the original double by integer-bit parsing and
  `memcpy`, passes it directly to `Kernel::FT`, and materializes its exact value.
  No decimal parsing, coordinate arithmetic, Float32 buffer or frame transform
  occurs. Signed zeros remain distinct in Root's raw input custody; geometric
  exact-number zero has no sign. Finite subnormals are admitted; all exponent
  2047 encodings (NaN/infinity) are refused.
- [Surface_mesh add_face](https://doc.cgal.org/5.6/Surface_mesh/classCGAL_1_1Surface__mesh.html)
  can reject a face. Each input vertex is inserted independently in original
  order; there is no coordinate deduplication. A face is passed in its original
  winding. Returned faces receive an explicit original-face property; CGAL
  handles/ordinals are never reported as original IDs. The actual inserted face
  is checked against its original vertex IDs up to cyclic rotation, preserving
  winding; any mismatch is terminal ERROR, with no repair.
- [self_intersections](https://doc.cgal.org/5.6/Polygon_mesh_processing/group__PMP__intersection__grp.html)
  is called sequentially on a complete valid triangular graph with no exact
  degenerate face. It reports intersections beyond an edge or vertex incident
  to both faces. The output iterator maps every pair to original IDs and has a
  shared bounded collector; its explicit overflow cannot become an empty PASS.
- [does_bound_a_volume](https://doc.cgal.org/5.6/Polygon_mesh_processing/group__PMP__orientation__grp.html)
  is called only after complete insertion, valid triangular graph, closure,
  zero exact degenerate faces and a completed empty self-intersection census.
  Its documented self-intersection precondition is not assumed from volume,
  winding or watertightness alone. No orientation-changing function is called.

Raw indexed edge/vertex-link/orphan audits remain the outer Python runner's
checks. They are not replaced by a CGAL success. Components here are **face
components through shared edges**, not material regions or print objects.
The outer runner keeps separate objects/instances/material interfaces separate.

For Root only, illustrative build/use (not executed):

```sh
cmake -S test/library-validation/cgal -B /absolute/owned-cgal-build \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_PREFIX_PATH=/absolute/isolated-dependencies/usr
cmake --build /absolute/owned-cgal-build --parallel 1
/absolute/owned-cgal-build/codi-cgal-readonly-mesh < immutable-raw-mesh.txt > new-report.json
```

Supply the actual extracted dependency paths/toolchain if the package needs
explicit GMP/MPFR locations. Do not acquire dependencies from CMake. No tests
or generated artifacts are registered. Fast-math is prohibited; GNU/Clang flags
retain rounding semantics and disable contraction. No source/math threshold is
introduced. External process time/RSS limits remain Root's responsibility:
input/output limits bound adapter storage but do not promise a CGAL CPU/peak
memory SLA. An OS-killed process/no complete report is not geometry PASS.

## Input v1: stdin, no arguments

ASCII deterministic text, one record per line, single spaces, no leading or
trailing spaces, tabs, CR, comments, blank rows or trailing data. A final LF is
optional. Every line is at most 80 bytes excluding LF. These are transport
constraints, not geometry tolerances.

```text
vertexCount triangleCount
xBits yBits zBits
... exactly vertexCount vertex rows ...
vertexIndex0 vertexIndex1 vertexIndex2
... exactly triangleCount triangle rows ...
```

Counts/indices are canonical unsigned decimal (zero is `0`, no leading zeros).
Counts must be `1..150000` and `1..100000`; each face index must be in
`0..vertexCount-1`. Bit tokens are exactly 16 hexadecimal digits, most-significant
digit first, with no `0x`; upper/lowercase accepted. They describe the numeric
IEEE754 64-bit pattern, independent of host byte order. Root's big-endian
`struct.pack('>d', value).hex()` spelling is directly compatible. Endianness is
handled by parsing the numeric bit pattern then `memcpy`, not byte reinterpretation
of the textual order.

All finite binary64 magnitudes are accepted: the adapter adds no new spatial
envelope. Count/index/token/line/total-byte checks enforce range and buffer bounds.
Text is capped at 16MiB; existing raw array charge
`32 + 24*vertexCount + 12*triangleCount` must be at most 8MiB. Out-of-range or
malformed input reports INPUT_INVALID without calling graph predicates.
Root binds input SHA256, original XML tokens/Float64 bits/indices, units,
object/instance placement and actual archive/source hashes outside this adapter.

## Report v1 and settlement

One JSON object on stdout, at most 65536 bytes including LF. No input text,
coordinate data, exception text or file paths are echoed. All original IDs are
zero-based input ordinals. The executable accepts no arguments, opens no files
and publishes no model. It returns:

- `0`: report `status=PASS`, meaning only the listed geometric checks completed.
- `1`: report FAIL, RESOURCE_LIMIT or ERROR. Preserve the JSON and exit status;
  do not classify it as dependency acquisition failure.
- `2`: report INPUT_INVALID (fixed `reason`, one-based `input.errorLine` where
  relevant; null for an argument-level failure).
- `3`: report construction/output failure; do not consume partial stdout as a
  complete valid record. Broken pipe/process termination can also prevent a
  settled record and must remain explicit in the outer report.

Top-level keys are `version`, `adapter`, `scope`, `cgalVersion`, `status`, `reason`,
`input`, `limits`, `degenerateFaces`, `insertionFailures`, `graph`,
`selfIntersections`, `volumeBoundary`, `sourceIntent`, `deviationCertificate`.
The last two are always NOT_RUN. There is no overall CAD-qualified flag.

- `input`: declared vertices/triangles, complete parse flag, errorLine.
- `degenerateFaces`: exact collinear/repeated/equal-coordinate face count and
  first original IDs; `scanComplete` says the full census completed. `complete`
  additionally says all IDs fit the diagnostic list. A partial count after a
  library/allocation error is a lower bound, never a completed zero census.
- `insertionFailures`: count plus `{faceId,reason}` rows, analogous completeness.
  Repeated vertex indices are refused before add_face; other null-face results
  are `FACE_INSERTION_REJECTED`, without guessing their cause. Later rejections
  may depend on earlier rejected faces. **Any** rejection prevents all graph
  predicates from running on the partial graph. No graph repair/retry occurs.
- `graph`: status, valid/triangular/closed, componentCount, components summarized
  by `{firstFaceId,faceCount}` in increasing original ID order. Unknown fields
  are null, not false; component summaries have their own completeness flag.
  All component counts are computed before bounded summary selection.
- `selfIntersections`: status, complete, countAtLeast, originalFacePairs.
  Each pair is ordered low/high, then rows are lexicographically sorted. On the
  129th observation the collector stops, reports at least129, and returns
  RESOURCE_LIMIT; its first128 actual pairs are not a complete census. Pair
  selection order is CGAL traversal-dependent when truncated. Volume stays NOT_RUN.
- `volumeBoundary`: status and boolean/null doesBoundAVolume. A closed surface
  with incompatible component orientation can return FAIL. It is never repaired.

Lists hold at most128 details each; exact complete counts can exceed that for
degeneracy/insertion/components. Truncated invalid-face diagnostics do not erase
their known failure; a component-summary limit does not change its exact count.
If no full intersection census can complete within the bound, no positive
validity result is returned. CGAL/allocation exceptions yield ERROR/RESOURCE_LIMIT
with existing partial observations explicit. No exception is reclassified as
an impossible design. Root must reject missing/truncated/malformed JSON and
check the adapter/library/input custody before using any fields.

## Source/license and remaining proof

This new offline adapter is offered under GPL-3.0-or-later (SPDX in source).
The actual CGAL 5.6 self-intersection header is GPL-3.0-or-later or commercial;
other dependency notices retain their respective licenses. Retain exact pinned
notices with any distributed tool, and review a separate license/build contract
before a future shipped WASM. [Reviewed CGAL header](https://raw.githubusercontent.com/CGAL/cgal/v5.6/Polygon_mesh_processing/include/CGAL/Polygon_mesh_processing/self_intersections.h),
[GPLv3 text](https://www.gnu.org/licenses/gpl-3.0.html).

This packet contains only source/CMake/usage. Root still needs to provision,
compile and run it against all six original extent meshes, compare independent
library/array audits, retain reports and examine any real findings. No volume
number, point result, successful build or generic validity PASS establishes
correct intended dimensions, finite coverage, material allocation or the existing
0.01mm deviation requirement. Full-surface proof and all source-intent checks
remain separately required; original failed evidence must remain visible.
