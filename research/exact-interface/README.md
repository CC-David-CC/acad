# Exact mesh interface classification: native feasibility only

This is not a browser package, application feature, release artifact, or proof about underlying curved B-reps. The source-only study uses CGAL EPECK and Nef polyhedra to classify **closed input triangle meshes**. Each must be valid, closed and pass CGAL's self-intersection check. Classification intersects the *closures* of both Nef sets: empty => disjoint; nonempty with empty interior => boundary contact; nonempty interior => overlap. Direct intersection of an unclosed `outer - cutter` Nef incorrectly reported the inset label as disjoint: applying closure is an essential set-semantics detail, not optional polish. Exceptions, invalid meshes and resource exhaustion must be reported as uncertain.

Fixture `native-enclosure.jsketcher.json` is a synthetic 7-feature research project, with no user data. `native-enclosure-meshes.json` contains the three meshes exported from the actual native CAD runtime after it restored the fixture: body 16 vertices/28 triangles, lid 16/28 and label 8/12. `write-off.py` creates OFF from those captured input numbers and creates shifted label variants. Decimal serialization and kernel input conversion must be investigated carefully before claiming exact equivalence to all in-browser IEEE-754 coordinates and transformations; these tested base coordinates are integers. No topology or geometry is reconstructed from display face views.

Native Ubuntu 24.04 study used distribution `libcgal-dev` 5.6-1build3, `libgmp-dev` 2:6.3.0+dfsg-2ubuntu6.1, `libmpfr-dev` 4.2.1-1build1.1 extracted into a private directory (not installed). Package SHA-256 respectively `4ad9d51506d42089b3cf14adfb8b9d9d79a9d32fc08f649feaf4b95f6e28cfb0`, `a9847b5ecfff791a46cb198f29a06d9d23a20afdfdd434812f2b44ccfb61d46a`, `362fcdeb7dff545af83e65a3a972519185efd4a231c23e13d519cf97a5c8e3e4`. Boost headers and runtime GMP/MPFR were already installed. CGAL `Nef_polyhedron_3.h` and `Polygon_mesh_processing/self_intersections.h` carry SPDX `GPL-3.0-or-later OR LicenseRef-Commercial`; `Exact_predicates_exact_constructions_kernel.h` carries `LGPL-3.0-or-later OR LicenseRef-Commercial`. This is not a complete dependency/license audit or legal clearance.

Example, from this directory, replace `PREFIX` with the private extracted root:

```sh
python3 write-off.py
ulimit -v 5242880
/usr/bin/time -f 'seconds=%e max_rss_kb=%M' timeout 180 g++ -std=c++17 -O0 -IPREFIX/usr/include -IPREFIX/usr/include/x86_64-linux-gnu actual-probe.cpp -o /tmp/cgal-interface-probe -l:libgmp.so.10 -l:libmpfr.so.6
(timeout 30 /tmp/cgal-interface-probe)
```

On the workstation this reported `actual_lid_label=contact shifted_1e-6=overlap separate=disjoint contained=overlap`, with ~0.11s / 7 MiB peak RSS for these tiny inputs; compile took ~19s / 1.56 GiB peak RSS. `analytic-probe.cpp` additionally checked face, edge and point contacts and an exact 1e-12 gap. Initial test mistakes—incorrect hexahedron vertex order and a zero-width gap fixture—triggered exceptions and were corrected. These numbers are not bounds for real models or untrusted inputs.

Remaining: input parsers and exact rational mapping, topological orientation and bounded-side semantics, cavity/nested-shell validation, transformed geometry, self-inclusion, degenerate/overlapping/copied faces, resource budgets and cancellation, large models, multiple components, independent differential tests, error tolerances relative to underlying CAD, browser/WASM build, thread isolation, packaging and licensing, and explicit UI/save lifecycle. Until qualified, the production-shaped adapter must fail closed on overlapping/ambiguous region bounds. The test-only rectangular-pocket verifier is not a general solution.
