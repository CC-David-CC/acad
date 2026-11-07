# Bounded worker-prism model projection

`projectValidatedRectanglePrism({topology,roles}, occupiedIds)` is a private,
synchronous assembly step for the exact bounded rectangle-prism descriptor and
semantic manifest already validated in a separate Worker. The coordinator must
retain the exact validated response, bind it to the current document and call
`mount.assertPortableBinding` and `engineEvaluation.requireCurrent()` before
and after the Worker and immediately before publication. This function does
not authenticate a mount, own a handle, or establish a current revision. It
accepts at most 64 KiB total copied input and a 16 KiB topology descriptor,
rejects sparse/accessor/nonfinite or unsupported data, checks the expected
8/12/6 shape, authored region/source records, local incidence and all ID
collisions before model construction. Full plane/solid/ancestry geometry
validation remains in the strict Worker reader and semantic derivation; this
small assembly is not a general untrusted topology validator.

Body and supported entity IDs are opaque `worker-prism:1:` plus an injective
JSON tuple of authored feature, kind, role and full region or segment source.
Six faces and eight perimeter edges have authored semantic IDs. The four
connector edges and eight vertices get unique per-projection transient IDs and
explicit `stability:'transient'` metadata. They are not durable references.
The result is a real JS `MBrepShell` with planar faces, paired original
half-edges and analytic line/plane adapters. Its model metadata identifies
`worker-owned-occ-prism`, denies legacy-pointer compatibility and states that
vertex/connector durable references are unsupported. It contains no native
pointer or live handle; an independent coordinator owns the engine association.

The existing generic registry still indexes transient entities, and existing
legacy operations do not automatically honor the metadata. Therefore a caller
must explicitly gate durable selection, reference serialization and every
unsupported legacy/Boolean/fillet/export operation **before publication**.
The analytic adapters intentionally throw for unimplemented transform/split;
this is not an editable feature or general solid-kernel implementation.

The strict-CSP browser fixture runs actual authored rectangle sketch and OCC
Workers, mount checks and the separate semantic Worker, then constructs real
`MBrepShell` and actual evaluation-registry projections in a no-DOM/no-Verb
Worker. It checks normal, changed-width and reversed/reordered solver input,
relabels all response-local topology tokens to show durable IDs remain stable,
checks four transient edges/eight vertices are marked and different between
projections, and rejects malformed input, incorrect source incidence and an
occupied registry ID. It compares supported LID edge roles against an actual
retained legacy OCC receipt as documented by `test/prism-semantic/README.md`.
This test does not run the assembly on the UI thread or publish it into the
app's live history.

Use the isolated OCC fixture and pinned inputs from
`test/engine-extrude/README.md`; build with
`webpack --config test/prism-model-projection/webpack.config.cjs`, copy its
`worker.js` to fixture `static/prism-semantic-worker.js`, then run
`browser.test.cjs` with the usual loopback Chromium/Puppeteer settings. The
fixture loads the production sketch and OCC Workers, uses the CSP-safe numeric
module, and has no fake canvas/DOM/kernel. Source only; no deployment.
