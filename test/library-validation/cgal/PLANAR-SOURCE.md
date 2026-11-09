# CGAL planar coverage source handoff

SOURCE ONLY / UNRUN / NOT QUALIFIED, 2026-11-09.
Protocol BEFOREff35835 is PLANAR-PROTOCOL.md; Root approved its indexed PRIMARY
and explicit source-rectangle OUTER-only mode before this source was written.
Baseb3b5381222f4978c919a245faa1446f1095bf85d. No compile, import, parser, test,
probe, Native/browser execution or frozen checker/evidence modification.

New planar_coverage.cpp plus an additive CMake target
codi-cgal-planar-coverage. Existing mesh_readonly.cpp is untouched. CMake retains
the original target/version guard/flags and adds the second C++17/CGAL::CGAL
target with identical no-fast-math/rounding/contraction restrictions. No package
acquisition, executable or runtime registration is supplied.

## Actual source/API used

Read the existing isolated CGAL5.6 package headers under
/mnt/data10tb/codi-acad-library-validation-native-20261109-r1/prefix/usr/include:

- CGAL/Polygon_2.h: vertices()/edge iteration, exact area, is_simple,
  bounded_side and reverse_orientation.
- CGAL/Polygon_set_2.h and General_polygon_set_2.h: range join,
  difference/symmetric_difference, arrangement, polygons_with_holes.
- CGAL/Boolean_set_operations_2/Gps_on_surface_base_2.h: do_intersect overlays
  the two sets and returns found_reg_intersection, i.e. positive-area regular
  intersection; boundary contact alone is not a false overlap witness.
- EPECK finite-double exact-number construction follows the already reviewed
  original3D adapter's integer-bit/memcpy/FT/exact materialization path.

The pinned5.6 API was read, not imported/executed. Root must still normally
compile against the exact acquired package/toolchain and retain build custody.
SPDX remains GPL-3.0-or-later for this offline source; distribution is separate.

## Implementation invariants

Input grammar/EOF/count/row/token/range guards precede dependent allocations.
All original triangle rows are retained unchanged, all selected IDs are unique,
and all indexed expected loops resolve original vertex IDs. Exact local
projection subtracts the original F64 source origin and applies its validated
right-handed signed permutation inside EPECK. No rounded local coordinate input,
Float32, decimal coordinate conversion or tolerance is used.

Every original selected triangle is scanned for exact zero area/wrong original
orientation before ANY temporary reversal. Degenerate/reversed counts complete
the whole selected census with bounded first128 original IDs. Only eligible
temporary triangles become CCW polygons; the source triangle list is immutable.

Expected loops reject zero edges/self-crossings/zero area/wrong ORIGINAL winding.
Cross-loop segment contacts are checked with exact CGAL do_intersect under a
bounded charged pair scan, then CGAL bounded_side proves strict outer containment
and mutual hole noncontainment. No invalid hole is silently clipped/subtracted
into a different expected domain. Only private set polygons are normalized
afterward to CGAL CCW outer/CW holes.

ALL selected triangles enter range union. Exact positive area sum must equal
exact complete union area. Exact symmetric difference with the explicit finite
polygon-with-holes must be empty; missing/outside components are separately
computed. Sum less than union or contradictory set-difference results are
internal ERROR, not failed CAD geometry.

Known negative results have optional bounded actual ORIGINAL triangle
diagnostics: later triangles meeting previous prefix union in positive area,
and triangles with nonempty outside-domain difference. The first128 IDs and
countAtLeast/scanComplete/idsComplete remain distinct. Diagnostic early stop
cannot erase the primary complete exact result or create a PASS. Missing-region
counts do not invent an ID for a triangle absent from the input.

The union construction and area/output enumeration have separate completion
state. If enumeration fails after union construction, component/boundary counts
stay null rather than reporting default0 as a complete census. Interrupted
diagnostic scans say INCOMPLETE; list-cap stops say TRUNCATED. Source/global
mesh/plane-incidence/analytic displacement are ALWAYS NOT_RUN here.

## Report v1

Closed top-level keys:

version,adapter,scope,cgalVersion,status,reason,input,limits,projection,domain,
projectedTriangles,union,overlapLaterTriangles,outsideTriangles,sourceBinding,
planeIncidence,globalMeshValidity,analyticCircleDisplacement.

Adapter/scope:
codi-cgal-planar-coverage-v1 / exact-projected-set-coverage-only.

- input: declared vertices/triangles/selectedTriangles/loops, parsed loopVertices,
  complete,errorLine,errorOriginalTriangleId,errorLoopId. These IDs are original
  input ordinals only; no Native descriptors or source text are echoed.
- projection: exactSignedPermutationChecked,localAxes,expectedOriginalSign.
  Axes/sign are null until validated, never guessed from default fields.
- domain: status NOT_RUN/INCOMPLETE/COMPLETE,complete,indexedLoops,
  sourceRectangleOuters,workUnits.
- projectedTriangles: scanComplete,degenerate,wrongOriginalOrientation.
- union: complete,components,enumeratedBoundaryVertices,
  exactTriangleAreaEqualsUnion,exactSymmetricDifferenceEmpty,
  missingComponents,outsideComponents. Unknown numeric/decision values are null.
- each diagnostic: status NOT_RUN/INCOMPLETE/TRUNCATED/COMPLETE,scanComplete,
  countAtLeast,idsComplete,originalTriangleIds. Complete scan can have a
  truncated ID list; inspect BOTH fields. NOT_RUN count is null.

Top-level PASS occurs only after complete input/domain/selected scan/union/
exact area/equality proofs. Exit0 PASS,1 FAIL/RESOURCE_LIMIT/ERROR,2 INPUT_INVALID,
3 uncertain output. Exceptions/raw coordinates/source/path/token payloads are
not logged. bad_alloc and explicit work/representation exhaustion are resource
outcomes. Unknown CGAL/adapter exceptions are ERROR, never geometric success.

CGAL operations can allocate/work before returning to an arrangement guard.
Input/output/representation caps do NOT establish a CPU/RSS SLA. Root must keep
external owned time/RSS bounds and require a complete settled report/exit/input/
executable/source/dependency binding. Process kill or partial stdout is not PASS.

## Mandatory outer caller obligations

This is NOT integrated into mesh_oracle.py/check.py and does not run/modify them.
Root still owns complete all-triangle/source/patch/material assignment; actual
indexed cap/wall/rim pairing; complete original mesh library validity; unchanged
planarity/source-error/analytic-circle approximation; source/STEP/archive/SVG and
all old mesh budgets. Equality of regularized2D sets does not prove indexed3D
connectivity, lower-dimensional seams, Native provenance or manufactured truth.

Indexed outer mode is primary. Optional ideal authored rectangle equality can
legitimately fail while source/Native drift is within the existing incidence/
displacement budgets. DOMAIN_SET_MISMATCH reports THAT exact reference-set
comparison, not invalid CAD geometry. Root may preselect genuine actual indexed
boundary + independent source-distance proof; there is NO automatic fallback or
coordinate/source snap in this executable.

Root's next action is source review and one coherent normal build plus the
complete actual six-file artifact batch/independent analytic wall+planar proofs,
retaining its first result and all original exports. No microtest loop or
reference success artifact was created here.
