# Read-only CGAL5.6 exact planar coverage — protocol BEFORE

SOURCE ONLY / UNRUN / NOT QUALIFICATION. Root approved indexed-loop PRIMARY
plus explicitly selected source-rectangle OUTER-only expected boundary mode.
This frozen contract precedes implementation of planar_coverage.cpp. Existing
mesh_readonly.cpp, executable, frozen caller/checker/evidence remain unchanged.

## Scope and authority

The adapter proves equality of the exact regularized projected triangle union
and ONE explicit finite polygon-with-holes domain, with no positive-area
multiple coverage. It uses CGAL5.6 EPECK/Polygon_2/Polygon_set_2, not custom
triangulation, CAD generation, welding, rounding or mesh repair.

Original triangle and vertex IDs are zero-based input ordinals and never
renumbered. All selected original triangle IDs participate. Projection comes
from original finite binary64 XYZ bits, exact subtraction of actual source-frame
origin and exact signed-permutation axes BEFORE choosing two local axes.
No already-rounded local mesh coordinate may be submitted in place of world
bits. The selected projected orientation is checked on original triangle order
before normalizing ONLY a temporary CGAL polygon to its CCW convention.

Root's caller retains actual source/plane incidence, global complete original
mesh CGAL validity, material/region, wall/cap/rim ownership and analytic
circle/displacement proof. Indexed domain loops must come from the actual
original indexed boundary with genuine source/cap/side pairing. This executable
cannot authenticate that provenance from its text alone. No submitted success/
valid/source-binding flag is accepted.

The explicit source-rectangle mode means four independent authenticated original
authored LOCAL projected corner quantities, never AABB, fitted/rounded mesh or
Native authority. Exact ideal-rectangle mismatch is a failed set equality for
THAT selected expected domain, NOT proof of invalid CAD geometry. Valid
source/Native drift within existing budgets may instead be analyzed using
indexed outer mode plus separate source-distance proof. There is NO automatic
fallback, snap, changed source or larger tolerance.

## Deterministic stdin v1

No arguments/files. ASCII rows, exactly one space between tokens, no blank/
comment/CR/tab/leading/trailing data. Final LF optional. Bit tokens exactly16hex
digits, numeric IEEE754 binary64 pattern MS digit first, no0x. All finite bits
including subnormals/signed zero accepted; exponent2047 rejected. Canonical
unsigned decimals for counts/IDs (no leading zeros). Signed axis/sign tokens
are exactly -1,0,1 where their role permits them.

Rows, in order:

    1 vertexCount triangleCount selectedCount loopCount
    originXBits originYBits originZBits
    xAxisWorld0 xAxisWorld1 xAxisWorld2
    yAxisWorld0 yAxisWorld1 yAxisWorld2
    zAxisWorld0 zAxisWorld1 zAxisWorld2
    projectedLocalAxisU projectedLocalAxisV expectedProjectedSign
    xBits yBits zBits
    ... exactly vertexCount original world vertex rows ...
    vertexIndex0 vertexIndex1 vertexIndex2
    ... exactly triangleCount original triangle rows ...
    originalTriangleId
    ... exactly selectedCount UNIQUE original triangle rows ...
    role mode count
    ... count loop rows, repeated for exactly loopCount loops ...

Frame axes are exact orthonormal right-handed signed permutations: each axis
has one±1, distinct world coordinate positions and x cross y=z. Projection
axes are distinct0,1,2. Expected sign is±1.

Exactly one OUTER loop is FIRST (role0); all remaining loops are holes (role1).
Mode0 PRIMARY: count≥3, each following row has one original vertex ID. Those
points are projected by the SAME exact original-world/frame path as triangles.
No repeated loop vertex ID; simple exact geometry is independently required.

Mode1 optional: OUTER ONLY, count4, each following row contains
sourceLocalUBits sourceLocalVBits. All four ordered corners must form an exact
axis-aligned rectangle in the chosen actual source-local projection: four
distinct min/max combinations and nonzero alternating axis edges. The original
outer orientation must match expected sign; hole orientation is its opposite.
No other source-defined arbitrary polygon mode exists in this packet.

All other loops use mode0. IDs/reference ownership remain caller proof.
Loop0 outer/holes original ordering is checked before TEMPORARY orientation
normalization to CCW outer/CW holes for CGAL. Source records/indices stay intact.

## Bounds and complete failure behavior

Preserve actual mesh bounds150000V/100000T and
32+24*V+12*T≤8388608 bytes. Selected count1..T. Domain loop count is at most
(V+4)/3 and aggregate loop vertices≤V+4: each indexed loop consumes original
boundary vertices; the optional source outer contributes only4 additional
coordinates. Rows≤80bytes, total text≤16MiB, stdout≤64KiB, diagnostic lists≤128.

Loop validation charges a bounded2000000 work units for pair visits and
precharged bounded-side edge scans. Exact polygon simplicity uses CGAL's
algorithm. Loop-pair exact bounding boxes can reject disjoint pairs; every
visited pair/edge pair is charged before any skip. When boxes overlap, exact
CGAL segment intersection refuses ALL cross-loop boundary contact; a hole's
representative must be strictly inside outer and outside every other hole.
Thus self-crossing, degenerate, touching, outside or nested holes cannot be
silently regularized into a different expected domain.

CGAL arrangements are additionally limited after completed operations to
2000000vertices/4000000edges/2000000faces; enumerated polygon boundary vertices
are capped at8000000. These are derived-tool resource bounds, not changes to
source, geometric tolerances or old mesh budgets. Complex operations can
allocate/work inside CGAL before returning; Root MUST retain external owned
time/RSS limits and actual process/report settlement. No complete report on
kill/timeout/output failure is a PASS. No CPU/memory SLA is claimed.

All numeric inputs are reconstructed directly into exact EPECK FT. No decimal
parsing, Float32, scaled-local conversion, epsilon, approximate area equality
or coordinate cut. All counts/arity/ranges checked before dependent allocation.
Arbitrary rational inputs are not part of this stdin protocol.

## Exact set evidence

1. Validate entire input grammar/EOF, finite raw bits, frame and original index
   rows. Validate all selected IDs uniquely and keep exact original tuples.
2. Validate every expected loop: simple/nonzero edges/nonzero exact area,
   original required winding and strict outer/hole membership/disjointness.
   Mode1 additionally proves its source-rectangle structural contract.
3. Scan EVERY selected original triangle. Exact projected area must be nonzero
   and have expected sign. Report actual original offending IDs/counts; no
   reversal is used to excuse a failed original orientation.
4. Copy only eligible triangles into temporary CCW Polygon_2 values. Sum exact
   unsigned projected triangle areas. Union ALL via Polygon_set_2.
5. Compute exact union area over its complete finite polygon-with-holes output.
   Sum equality proves absence of positive-area duplicate/overlap coverage;
   sum<union is an internal invariant ERROR, never geometry PASS.
6. Build the explicit finite expected polygon-with-holes. Exact symmetric
   difference must be empty. Domain-minus-union and union-minus-domain remain
   separately observable. No amount of equal TOTAL area can excuse different
   sets or offset missing/extra regions.
7. On a known negative result, bounded original-ID diagnostics may identify
   later triangles intersecting earlier prefix union in positive area and
   triangles with nonempty outside-domain difference. These are actual
   ORIGINAL triangle IDs, not a guessed pair, Native ID or nonexistent missing
   triangle. Truncation has explicit countAtLeast/scanComplete/idsComplete.
   Primary complete union/equality outcomes remain separate from diagnostic
   completeness. No truncated diagnostic can manufacture a PASS.

Regularized2D set equality intentionally ignores lower-dimensional seams.
Global indexed graph/vertex links/wall-cap matching remain mandatory caller
proof; source domain/circle approximation is separate. Do not call this full3D
validation, manufactured conformance or an analytic-circle cap certificate.

## Report and integration

One closed-schema JSON report identifies adapter codi-cgal-planar-coverage-v1,
scope exact-projected-set-coverage-only, CGAL version, parsed input/limits,
frame/projection contract, domain/triangle scan status, complete union/exact
area/set-difference decisions and bounded original diagnostics. Unknown/not-run
values are null/NOT_RUN, never successful false/zero substitutes. No raw
coordinate/source/path/exception payload is echoed.

Exit0 only complete PASS;1 FAIL/RESOURCE_LIMIT/ERROR;2 INPUT_INVALID;3 output
failure. Report/custody must bind actual executable/build/dependency/input bits/
original IDs/source/frame/artifact SHA externally. A report itself has no
authoritative source/Native flags; those roles remain NOT_RUN.

CMake adds ONLY codi-cgal-planar-coverage with the same C++17/CGAL5.6.x/no-fast-
math/rounding flags as the old target. No acquisition, compiler execution,
runtime registration or old adapter source edit. Root owns normal build,
complete six-file actual-artifact oracle composition and FIRST execution.
