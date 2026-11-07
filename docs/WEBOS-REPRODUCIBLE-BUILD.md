# WebOS source-built candidate

This is a research build recipe, not a release certification. Install the
locked dependencies with `CYPRESS_INSTALL_BINARY=0 npm ci --ignore-scripts`.
Node 24.22.1 was used for the recorded November 3 test. Do not commit
`node_modules`, generated `dist`, source archives, or compiled artifacts.

Obtain the source-built OCCT interpreter and CSP-compatible Manifold outputs
whose provenance and exact SHA-256 values are in
`occt-source-rebuild-20261102/RESULTS.md` and
`test/webos/README-surfacing-research.md`. The source archive is preserved on
R730 as documented in `third_party/occt-interpreter/README.md`; it is not yet a
recipient-accessible source distribution. Build the two engines from their
recorded sources and toolchains; neither the original npm Manifold artifact nor
the unproven npm OCCT WASM is substituted for these pinned outputs.

```
node build/prepare-webos-runtime.cjs /path/to/legacy-main.js /path/to/legacy-main.wasm /path/to/manifold.js /path/to/manifold.wasm /path/to/clean-worker-main.js /path/to/clean-worker-main.wasm
CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1 npm run build
CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1 ./node_modules/.bin/webpack --config test/webos/webpack.config.cjs
CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1 ./node_modules/.bin/webpack --config test/webos/surfacing-webpack.config.cjs
```

The preparation script checks all six artifact hashes before copying and
runs the pinned numeric-source precompiler. The last two inputs install the clean worker OCC separately in `node_modules/.cache/codi-oci-clean`; the legacy main-thread engine remains separately pinned. The source-built legacy OCCT outputs are
`main.js` SHA-256 `3c56e74e6e08411436a68fb930bab38aedd3137e4369af2bc67fd382e568787e`
and `main.wasm` SHA-256 `a2b2f7daf6a4eb98b975f8aec136f6cbaf2720295ea32e71edb13ff4c5ceaecb`.
A hash validates the selected artifact, not the completeness of its source or
license evidence. The pinned OCCT build has not been proven bit reproducible
across independent builds. See the source-build evidence and notice inventory.


The clean worker inputs are available from the LAN archive:

```
scp example.invalid:/srv/data/codi-occt-centered-clean-20261104/main.js /tmp/codi-clean-oci-main.js
scp example.invalid:/srv/data/codi-occt-centered-clean-20261104/main.wasm /tmp/codi-clean-oci-main.wasm
```

Use these as the final two preparation arguments. Their SHA-256 values are
`89b3b85fb8afcfbdf343ec3f7f2ecf222067012d994cf9af6eb649ef30d9257b`
and `c39793b8aff34dc548b57fee1d901219e372702a5005ef92dfdf94994c012897`.
The source archive, root and OCCT notices, binary SDK, clean build receipt,
and limitations are in [the clean runtime receipt](research/CENTERED-HOLE-CLEAN-RUNTIME-20261104.md).
Both legacy and clean engine sources/notices must accompany a distributed build;
a LAN backup by itself is not a recipient-accessible source offer.
The two worker runtime assets are emitted as part of the default build.

The combined candidate was served on loopback with a CSP permitting WebAssembly
but not JavaScript `unsafe-eval`. Chromium exercised real plane/sketch/extrusion
snapshot and restore at desktop and phone-emulated sizes; a second test covered
OCC and Native Mesh rectangular extrusion, output bounds and volume, and
surfacing scene restore. A programmatic native-body 3MF fixture was inspected
with lib3mf 2.5.0. These are bounded smoke tests, not general geometry, physical
device, full host integration, source-notice closure, or manufacturing approval.
The 3MF writer remains research-only and has documented geometric limits.

Additional checks against the same source-built runtime used the upstream OCCT
`screw.step` fixture (10 faces, 22 edges, 14 vertices and expected bounds and
validity/volume checks), DXF sketch import and history, spline creation/history,
box/pattern topology identity, and an independently read lib3mf enclosure plus
lid with grouped inset before and after a dimension edit. The enclosure test
uses a test-only rectangular-pocket verifier; it does not qualify arbitrary
interference or a desktop export workflow. The old browser File-action test was
updated to verify the research `export-3mf` host request as well as open/save.
