# Combined cbb148326 carried browser controls

Root reran the affected carried controls against exact app runtime
`cbb148326187afa356e5a2e71b855b4cee8dd395`, private direct fixture20465 and
owned Chromium CDP19329 contexts. Eleven carried runs pass: spline desktop and
390px emulated phone, spline epoch interpolate/CV/closed, DXF import, sketch
history, multiple face selection, marquee desktop/390px, and window isolation.
Their separate logs are `/tmp/codi-cbb1-carried-logs/`.

The initial marquee test attempted Save with an active selection gesture. The
new Save contract correctly refuses active tools; it is not a disposal failure.
The corrected test asserts refusal with unchanged stored source and an open
editor, then explicitly exits/discards through the actual registered action.
Overlay/listener cleanup passes on desktop and emulated phone. The original
failure log remains `marquee-desktop.log`; positives are `*-r2.log`. No product
guard was weakened to make this test pass.

Window-isolation counters balance15/15,10/10,5/5,5/5,5/5 Worker construction/
termination. Remaining instances keep their model and continue a hole operation
after another closes. This is a bounded lifecycle control, not general leak
proof. Phone is simulation; marquee covers2D pan, not3D orbit/pinch.

Two additional engine controls also pass: six bounded OCC/Native Mesh Boolean
comparisons and rectangular extrusion/surfacing native round-trip. Both engines
produce10×20×30 bounds and6000 volume in the planar-box case. Thin intersection
still differs: OCC empty versus Native Mesh volume0.00057220458984375. No engine
equivalence is claimed. Source/helper context is unchanged per test; the helper
adds no production entry point.

Test-only surfacing helper was freshly built from cbb148326 on R730 using
`test/webos/surfacing-webpack.config.cjs --no-cache --output-path
/mnt/data10tb/codi-cbb1-engine-helper-20261105`, with the same embedded numeric/
Manifold prerequisites as the app. Its SHA is
`1232a881ea307589541d7a39df2c5c961968bc1f9a1d55045fb4e5ca030ca390`.
Helper and app Manifold WASM both hash
`7bb5f8ee10fcafdab78799b1e5dd2cdc7c282ea0bf8e7939c43f3ad34b823e3d`.
Only that helper and its two test chunks were added to this private dist; app
bundle and production Workers retain the full build's recorded hashes.

The same runtime separately passes root's installed async Save/no-op/held-close
test and actual Point/Segment/Circle/Arc/Ellipse/Bezier tools → awaited Save →
fresh native restore (`basic-sketch-shapes-browser.test.cjs`). Registered
constraint/client/Worker cases have their own scope in
`test/review-save-compat/BROWSER-WORKER-CBB1-20261105.md`.

Seven affected mechanical browser controls also exited zero on this runtime:
signed X/Y/projected distances, diameter, line relations, whole-entity fixing,
rigid-group UI, driving/reference length roles, and rigid-group bracket
extrusion (`test/webos/*-browser.test.cjs`). Their individual logs are
`/tmp/codi-cbb1-mechanical-logs/`, backed up to R730. These retain each original
test's helper-seeded versus actual UI/API scope; this is not complete public
primitive-authoring commands or every feature in those families.

Use Node24, `PUPPETEER_CORE_PATH=/tmp/codi-occt-release-control/node_modules/puppeteer-core`,
`NODE_PATH=/tmp/codi-occt-release-control/node_modules`,
`JSKETCHER_TEST_URL=http://127.0.0.1:20465/`, `CODI_TEST_CDP=http://127.0.0.1:19329/`
and the strict fixture's exact `CODI_EXPECT_CSP` for carried scripts. Receipt
scope remains separate from signed Files, physical touch, full CAD1, staged/
Mirror compatibility and the final public release.
