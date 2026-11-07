# Public primitive and derived-region corpus

The baseline actual app91c921bb (CAD runtime724178adc, qualified Collinear coreaa68)
passes eleven of fourteen independent rows and fails three. Its native saved
coordinates are preserved, but the model reader welds segment endpoints or circle
centers to an earlier vertex within1e-3. A real1e-6 gap becomes one selected
rectangle region. A circle center offset0.0005 is moved to an earlier standalone
Point or construction endpoint. These are projection defects, not evidence of a
constraint contradiction or a failed geometry kernel. Native save/reopen preserves
the same baseline outcomes. baseline.json retains exact source/view data and test
hash. Existing compatibility-only contour tests did not establish this truth.

All geometry is authored through actual public craft operations and production
Workers. Passive model reads check authored coordinates, region descriptors,
explicit unsupported cases and native reopen; no private setters or native seeds
are used. Supported cases cover disjoint rectangles, three nested circles,
rectangle/circle regions and excluded construction geometry. Crossing/tangent/
point-touching/duplicate/self-intersecting profiles are explicitly unsupported;
this does not claim a general planar arrangement or any solid extrusion.

Run on a loopback app fixture and shared CDP using your own browser context:

```sh
JSKETCHER_TEST_URL=http://127.0.0.1:20630/ \
CODI_TEST_CDP=http://127.0.0.1:19329/ \
PUPPETEER_CORE_PATH=/path/to/puppeteer-core \
CODI_EXPECT_APP_SHA=91c921bb4b4747a0e04604e01314145d61325013b448bc9330d9d04fba63811e \
CODI_RECEIPT=/tmp/regions.json node test/public-region-corpus/browser.cjs
```

The baseline intentionally exits1 after writing its FAIL receipt. Candidate
5fb0f7032 replaces only the reader's fuzzy vertex factory with exact authored
Vectors, matching its existing Arc-coordinate policy. Global tolerances, solver
math and native coordinates are unchanged. Actual app655c7d15 at private20645
passes all15 rows in fixed.json, including an explicitly PCoincident-constrained
rectangle with fractional origin/dimensions and a substantial dimension edit.
All projected Segment/Circle coordinates exactly match their saved sources.
Native reopen preserves the same identities, coordinates and unsupported states.
The baseline14-row source is preserved at be174b44d; its exact hash is recorded.

The same actual app passes test/rectangle-edit/browser.test.cjs: real extrusion,
five holes, substantial dimension propagation, exact native undo/redo, Save,
no-op, rejected/cancelled/stale/source guards and native reopen. Its tracked
rectangle-regression.log records the result; build/pin details are adjacent in
runtime-pins.json. No new signed-host workflow is claimed for this exact reader
build. Existing signed Collinear/R11 proofs retain their original scopes.

Initial root app build omitted baseline native prerequisite files from the
sparse Collinear build tree and failed35 module resolutions. Adding only the
missing reviewed R11 prerequisites and using Collinear's project-worker build
config produced a successful build. No product source was changed to hide that
failure. Raw logs are retained on R730 beside the runtime and evidence archive.

This fixes inherited projection behavior, not general planar arrangement,
arbitrary region extrusion or all CAD1. Signed Files, human geometry UI and
complete solver-state qualification remain separate. Root is separately checking
Worker discovery against actual supported region inputs.

Independent captured-output hierarchy/dimension checks: `node test/public-region-corpus/verify-receipts.mjs` passes. Raw baseline/failure/final logs and receipts are backed under `/mnt/data10tb/codi-evidence/public-region-corpus-20261106`, with a verified SHA256 inventory.

## Dense follow-up observation

The existing dense514-segment/512-lock native fixture passes relation, exact
undo/redo and host capture on the earlier app91c921bb and exact-reader app655c7d15.
Both release9/9 Workers and retain their sibling CAD. This fixture seeds its
large native model deliberately; it is not514 public authoring steps or signed
Files proof. Captured JSON is in dense-observations/.

Baseline observed relation/undo/redo sibling gaps151/148/140ms. The candidate's
separately profiled run observes170/154/156ms, capture20ms and inspect10ms sibling
gap. Candidate CPU profiling was enabled; baseline profiling was not. These are
not a matched performance comparison, speedup or hard latency bound. Corrected
projection does not close ARC25. Samples still include native WebGL program
logs, viewport sizing and line-material/view construction. No application
readback call or precise single-cause diagnosis is inferred from those samples.
Raw profile/logs are backed on R730 with this lane.
