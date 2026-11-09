# Extent R4 actual mesh diagnostic and library-first validation proposal

Status: BEFORE implementation. This records authorized offline inspection of already-produced own artifacts and primary-source library research. No existing checker, production module, mesh, source, receipt, failed report or acceptance criterion is changed. No third-party library was installed, compiled or executed. Library adoption/execution and any replacement acceptance proof require Root review.

## Exact inputs and first failure

Source base: `f3da26bbe150524e99d3173bc2ac6458b47dd8cd`. Evidence custody: `1991418d35b0a156fb906d6b81f57e3d5ce25457`. Producing Core `0afb07fe8e216ba9a03cf21923e0ab70aed72546`, Host `be24fbc232c967912f529053d34a9d407b369a39`, acceptance `7e1e2b6d8eafac4411f1cc63d5b5dc67c5de994a`; primary JS `32eec74e3019d9e2d767c9016f05aa3daa49441c6102423a269d67b9c7f02a08`, WASM `abbf2aa02a6f2101c600aa1eedd20fa80ab2db206e677ca860d9c5103cdfbfcc`.

Canonical evidence is `test/selected-profile-extents-workflow/evidence-r4/`: the completed whole receipt, original `first-oracle.json`, first reader failure, corrected reader report and logs remain immutable. The whole passed; all six actual STEP reads passed after the separately recorded Node24 launcher correction. The first Python oracle failed with `one actual complete straight cylindrical generator strip`. There is no successful after-whole geometry oracle for this receipt.

The exact failing predicate is `mesh_oracle.py:65–69`: it requires every cylindrical wall triangle to have exactly two distinct binary64 XY pairs. The first mismatch is **blind-interval.3mf**, artifact ordinal 13, triangle ordinal 141, vertex indices `[135,132,131]`. Actual XML world coordinates are:

| Index | x | y | z |
|---|---|---|---|
| 135 | 51.99751384243785 | 25.099691771321396 | 10 |
| 132 | 51.99751384243785 | 25.099691771321364 | 16 |
| 131 | 51.99006155073081 | 25.199135693191604 | 16 |

The first two y values differ by `3.197442310920451e-14 mm`, nine binary64 ULP, with hex values `0x1.9198566618176p+4` and `0x1.919856661816dp+4`. Thus this triangle has three exact XY pairs. No rounding/welding was applied. Its unique candidate is the actual source blind wall: center `(50,25)`, radius 2, local axial interval `[0,6]`, inward orientation. The source frame is identity with origin `(0,0,10)`. The observed triangle's full radial minimum is approximately `1.9993783640016338`, giving approximately `0.0006216359983661768 mm` deflection, and its inward orientation dot product is positive. These observations identify the checker assumption; they do not certify the complete exported design.

All six actual inputs, unchanged:

| File | Bytes | Vertices / triangles | SHA256 |
|---|---:|---:|---|
| two-sided-initial.3mf | 3251 | 8 / 12 | b8884a177d371e20217a2396dbd8deda480dcb495eab4348c8314d148dcf8698 |
| two-sided-reedited.3mf | 3251 | 8 / 12 | c8a67130081002ae34aa70005c6f9e8c115e5690682837e8bd8f7c73f9b18456 |
| circle-XZ.3mf | 36559 | 252 / 500 | 27c077d654dd5437719fca9d27c47121e290dde44c06ce9a397e3710289adb83 |
| annulus-ZY.3mf | 71481 | 504 / 1008 | d9a7172d2388a6f0fe890390a7decde6d24a3c6cb2bc8d75ac5fd8dbc39ad4e6 |
| through-pattern.3mf | 105167 | 764 / 1536 | ad33255b7072cb6ee62eb87f4803523384f2e5c67f4233024cd1ded5d53c5e65 |
| blind-interval.3mf | 36853 | 260 / 516 | 2828be13b5920edc89152c86d3a9845c2a0d79ce135014f112a77276dbd5cdda |

The first five have no failing two-XY wall triangles. Blind has 252 candidate wall triangles: 250 fail that predicate, two satisfy it. Every raw indexed edge of every file has exactly two opposite uses in the diagnostic. Additional exact-dyadic blind observations find one wall component, Euler characteristic zero, two actual 126-edge boundary cycles with ray winding one, positive radial Jacobian at all wall triangle vertices, and one cycle in every global vertex link. No complete planar overlap/full-surface certificate follows from that list. Classification uses the old finite supports only to attribute the failure; it is not a new acceptance result.

Retained diagnostic sources/results are `test/selected-profile-extents-workflow/diagnostics-r4/{diagnose_mesh.py,actual-report.json,summarize_wall.py,wall-statistics.json}`. `INPUTS.json`, made by `freeze_inputs.py`, binds the receipt, all six archives, source Git blobs, reader/failure reports and diagnostic sources/results. It avoids duplicating the 40MB receipt. The receipt hash is `8e9013107d62d0f3797b465ba0c39ed9c283cd7e59e3e74c62f0078475b36bcd`.

## General validation roles and coordinate authority

Use established libraries for general mesh validity. Do not implement a tolerance-weld or new fixture-specific straight-strip checker. Do not repair/reindex/rescale the exported mesh or generate a success artifact. Expected source intent remains necessary: a valid closed rectangular pocket can still be the wrong design for a circular blind hole.

**lib3mf:** read the original ZIP/package and report reader warnings, build items, components, units, resources, metadata and material/property associations. Compare them to the actual raw records and accepted source-bound manufacturing assignment. The official interface declares mesh `Position.Coordinates` and `Transform.Fields` as `single`; coordinates returned through these APIs cannot replace the original Float64 geometry. Use the library geometry only as a clearly identified secondary view. Do not serialize its model back over an input. [Official interface](https://raw.githubusercontent.com/3MFConsortium/lib3mf/v2.5.0/AutomaticComponentToolkit/lib3mf.xml)

For native evaluation, pin a reviewed stable release (the official release page currently marks v2.5.0) and its exact source/binary/dependencies before acquisition. WASM is a later option: the official JS wrapper currently identifies itself as core v2.6.0 prerelease / package 2.6.0-alpha.2, so it must be treated as an independently pinned prerelease, not assumed byte/API-equivalent to the native stable release. Exact pinned binding types must be rechecked. [Native releases](https://github.com/3MFConsortium/lib3mf/releases), [official WASM wrapper](https://github.com/3MFConsortium/lib3mf_wasm)

**Trimesh:** construct directly from raw binary64 vertices and original integer faces with `process=False, validate=False`; supply no computed normals. The current source stores vertices as float64. Its default processing can merge vertices, and validation can remove faces. Record watertightness, winding, connected components, Euler characteristic, bounds and numerical signed volume, with input-bit/index equality checked after every group of calls. `is_volume` is not a self-intersection certificate. No repair, merge, normal fix, hole fill, duplicate removal, splitting that discards data, or implicit file loader preprocessing is allowed. [Official implementation](https://raw.githubusercontent.com/mikedh/trimesh/main/trimesh/base.py)

**CGAL:** use a small native read-only adapter over the same raw arrays, with original vertex/triangle IDs retained as properties. Construct exact dyadic rationals from the Float64 sign/exponent/significand; use the exact-predicates/exact-constructions kernel for geometric predicates. Reject failed graph insertion instead of repairing it. Check raw indexed incidence/vertex links before graph-only algorithms, then closedness, degeneracy, connected components, all self-intersections and bounded-volume/orientation. Report actual intersecting original face pairs. The kernel supports exact predicates and constructions; that does not make every higher-level numerical estimate exact. [Kernel contract](https://doc.cgal.org/latest/Kernel_23/classCGAL_1_1Exact__predicates__exact__constructions__kernel.html)

CGAL exposes general mesh and triangle-soup intersection APIs. Use the mesh version only after its graph prerequisites hold; a soup path can diagnose a rejected mesh without constructing a repaired alternative. Its generic mesh reader can repair inputs, so it is excluded from this adapter. [Intersection APIs](https://doc.cgal.org/latest/Polygon_mesh_processing/group__PMP__intersection__grp.html), [mesh input contracts](https://doc.cgal.org/latest/Polygon_mesh_processing/index.html)

Call read-only volume/orientation predicates only after closure and self-intersection checks. `does_bound_a_volume` explicitly has undefined behavior on a self-intersecting input. Do not call orientation-changing APIs. Apply point classification only to a proven valid closed boundary; boundary/uncertain results stay explicit. [Orientation prerequisites](https://doc.cgal.org/latest/PMP_Mesh_repair/group__PMP__orientation__grp.html)

## Full-surface correctness and accuracy boundary

Keep three distinct questions in every report: 3MF semantic validity; actual indexed/geometric solid validity; agreement with the authored finite solid and its existing deviation budget. The proposed first library run answers the first two and cross-checks measurements. It must not silently replace the failing full geometry oracle with a volume-only or generic-validity PASS.

The raw authority is the original XML decimal token, its correctly rounded binary64 value, original index, and component/build placement. Retain both token and little-endian binary64 hashes. Preserve signed zero in custody even where geometric predicates treat it as zero. A Float32 conversion at coordinates around 25mm has spacing approximately `1.9073486328125e-6 mm`, vastly larger than the observed nine-ULP difference; JavaScript `Number` cannot restore bits already lost inside a Float32 API. Do not take an STL round trip or use lib3mf vertex buffers as the CGAL/Trimesh input.

For the six current signed-permutation frames, world-to-local conversion can be reconciled directly with captured frame/source intent. For later general transforms, record the exact input transform and the floating/exact evaluation path; do not claim world-space conversion is exact merely because its operands are Float64.

For complete deviation, prefer a general **symmetric full-surface distance bound**. CGAL offers a bounded-error mesh-to-mesh Hausdorff algorithm; its sampling-based approximation is a different API and does not certify the unsampled maximum. Preserve the explicit returned error bound and both directed results. Never accept the library default error as a new policy. [Distance contracts](https://doc.cgal.org/latest/Polygon_mesh_processing/group__PMP__distance__grp.html)

A valid reference is still required. Comparing an export to itself proves nothing. Comparing it to an unqualified triangulation of the same STEP is a useful cross-format cross-check, but not an independent analytic design certificate. A requested mesher deflection is not automatically a proved reference error. The complete proof needs either (a) a library-supported finite analytic surface distance/coverage certificate, retaining the source-specific intent/trim checks, or (b) an independently validated reference mesh with an established error to the exact expected finite surface. No hand-built replacement primitive/FreeCAD stack is proposed here.

For option (b), let `d_hat` be the bounded symmetric mesh distance, `e_alg` its documented error, `e_ref` a proved reference-to-design error and `e_num` a justified conversion/numerical allowance. Require `d_hat + e_alg + e_ref + e_num <= 0.01mm`. Every term must be explicit; an unknown term means NOT CERTIFIED. This is the triangle inequality, not permission to spend new tolerance. Keep existing plane-incidence `1e-6mm`, mesh deflection `0.01mm`, and authored/geometry 50pm policies separate. No 50pm surface claim is obtained from a 0.01mm mesh certificate.

Indexed rim correspondence, finite floor/top/bottom domains, intended material/void side, hole count/through-vs-blind topology, original signed interval, source bindings/units/frame/identity and material allocation remain explicit source-intent obligations. CGAL validity and distance strengthen those checks; they do not derive design intent from the exported labels. Numerical volume is supplementary. The exact two-XY assumption is not retained as a geometry requirement, and no nearby vertices are declared identical to remove it.

## Smallest proposed R730 run, after approval

1. Acquire/pin only native lib3mf, Trimesh/NumPy and CGAL plus exact dependencies in an isolated validator environment. Record release/commit/archive hashes, compiler/options/versions, adapter Git blobs and licenses. Do not modify CAD/Native runtime or the frozen fixture. The reviewed CGAL self-intersection header is GPL-3.0-or-later or commercial; package licensing must be resolved for intended distribution before any later shipped WASM. An offline validator is a separate integration decision. [Exact source license](https://raw.githubusercontent.com/CGAL/cgal/main/Polygon_mesh_processing/include/CGAL/Polygon_mesh_processing/self_intersections.h)
2. Stream-check `INPUTS.json` and actual receipt hashes, the exact six-file roster, ZIP CRC, bounded XML and all component/build/material/source associations. Produce a new report directory exclusively; never overwrite R4 reports. Preserve the existing 128MiB artifact/data bounds and current per-file 150000-vertex/100000-triangle and controlled 8MiB binary budgets. Resource exhaustion is inconclusive/resource refusal, not invalid geometry or success.
3. Extract one raw immutable F64/index inventory per actual printed object, with exact file/object/instance/transform mapping. Perform lib3mf semantics independently; reconcile IDs/counts/associations. If its reader changes/rejects structure, record that exact result and warnings; do not conceal it by export/import conversion.
4. Run Trimesh and CGAL read-only over all six inventories, one artifact at a time. Preserve before/after hashes/counts/order and all diagnostic original IDs. Record disagreements between libraries, exact-degenerate/intersection/manifold/orientation findings, components, bounds, numerical volume and source intent observations. Do not choose a convenient library result when they disagree.
5. Emit `format`, `indexedTopology`, `geometricValidity`, `sourceIntent`, `deviationCertificate`, `resourceOutcome` separately per artifact. The source/finite-surface proof stays pending unless its complete criteria are met; partial generic results cannot rewrite the original failed oracle as PASS. Root reviews the whole new report before any acceptance-reader change.

No timing/lifetime/performance qualification is inferred from that finite corpus. It uses the actual six files and performs no new CAD/browser/Native call. Source-specific expected dimensions and bindings are preserved, while general validity machinery applies to future meshes without cylindrical-strip assumptions. Later WASM adoption should first reuse the pinned lib3mf format role, then assess a separately reviewed CGAL build/size/license/precision contract if needed; no immediate browser package, default switch or new production capability is authorized by this proposal.
