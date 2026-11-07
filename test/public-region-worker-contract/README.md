# Public selected-region / Worker contract audit — 2026-11-06

This is a reproducible counterexample and a proposed implementation boundary,
not a product fix or qualification of general Worker extrusion. All authoring
and feature execution use actual public craft commands. Passive registry,
source, native snapshot and resource reads supply independent preservation and
geometry oracles; they never seed a document, publish models, or invoke private
operations. Each case owns a fresh Chromium browser context. No source build,
Files suite, native suite, public deployment or shared-browser restart is used.

## Actual result

| Publicly authored sketch | Bounded regions | Offered Worker extrusion candidates | Actual request / observation |
|---|---:|---:|---|
| One 10 × 10 mm rectangle | 1 | 1 | Public extrusion depth 5 succeeds; published bounds are `[0,10] × [0,10] × [0,5]` mm. |
| Two disjoint 10 × 10 mm rectangles | 2 | 2 | Selecting the first offered region reaches semantic Worker preflight and fails `UNSUPPORTED_PROFILE`: “Four ordinary rectangle edges and optional reference geometry are required.” |
| Circle, radius 10 mm | 1 | 0 | A persisted region descriptor exists; this Worker operation is not offered. No cylinder claim. |
| Concentric circles, radii 30/20/10 mm | 3 | 0 | Descriptors represent outer annulus, inner annulus and central disk. Neither circle nor annulus Worker extrusion is offered. |
| .0005 × 1 mm rectangle, old reader | 0 | 0 | Exact authored coordinates project incorrectly; the valid thin rectangle loses its region. |
| Same thin rectangle, fixed reader | 1 | 1 | Exact projected endpoints and one region are preserved. Projection/discovery only; no thin-solid claim. |

The disjoint failure is **not** a native OCC Boolean failure. Public discovery
admits a candidate that the rectangle-specific whole-sketch planner refuses.
The rectangle adapter performs semantic preflight before creating its native
OCC mount. Conversely, the circle/nested rows demonstrate region-model support,
not unimplemented backend capability.

The failed disjoint request preserves exact source text/version, all native
project fields except the explicitly documented feature-ID high-water mark,
history content and history object, model array and its member identities,
registry Map and every entry identity. `pipelineFailure` remains null. The
attempt consumes one never-reused feature ID (1 → 2); it does not add a feature
or body. This allocator policy is intentional, not document corruption.

Before and after either feature request the accepted document has one detached
owner, zero candidate owners and zero live mounts. A detached owner is the
accepted document's resource bookkeeping after native mount release; it is not
an in-flight candidate or a leak. Host-lifetime abort releases all owners and
mounts. The first harness incorrectly waited for detached owners to disappear
while the accepted document remained open; that diagnostic failure is retained
separately and was corrected to match the real ownership contract.

Full exact descriptor IDs, requests, source, analytic input coordinates, native
before/after envelopes, history, resource ledgers and checks are in
`receipt.json`. IDs contain ordinary generated authored UUIDs, not synthetic
source fixtures. No real account data is present.

## Source/runtime binding

Test-only worktree starts at `6170a501616ea711df242d7c86331cfe53ff864a`.
The actual fixed-reader app was built by the root agent from product
`5fb0f703201c3bff752e7bff217f46e14c3ed933` and qualified separately at
`a736c76c494a181664df5b03f36ab2c4d3efca7f`.

- Fixed direct20645 application SHA256:
  `655c7d15f09eb5a041911baeb6c079e2c52fd11a9e0fd242de81918171bf26dd`
  (32,786,060 bytes).
- Old direct20630 reference application SHA256:
  `91c921bb4b4747a0e04604e01314145d61325013b448bc9330d9d04fba63811e`
  (32,791,544 bytes).

The harness streams and verifies both served application hashes before and
after execution. Runtime pinning binds actual loaded code, rather than assuming
that a local Git checkout is what a running server serves. Browser version is
recorded in the receipt. This is actual Chromium execution, not a fake Viewer,
Canvas, kernel or transport double.

## Re-run

Start matching direct static fixtures and a separate existing Chromium CDP
endpoint, then set these paths for your machine (Puppeteer is an external test
dependency, never committed here):

```sh
JSKETCHER_TEST_URL=http://127.0.0.1:20645/ \
CODI_EXPECT_APP_SHA=655c7d15f09eb5a041911baeb6c079e2c52fd11a9e0fd242de81918171bf26dd \
CODI_REFERENCE_TEST_URL=http://127.0.0.1:20630/ \
CODI_REFERENCE_APP_SHA=91c921bb4b4747a0e04604e01314145d61325013b448bc9330d9d04fba63811e \
CODI_TEST_CDP=http://127.0.0.1:19329/ \
PUPPETEER_CORE_PATH=/path/to/node_modules/puppeteer-core \
CODI_RECEIPT=/tmp/public-region-worker-receipt.json \
node test/public-region-worker-contract/browser.cjs
```

Only loopback URLs are accepted. Omit both reference environment values to run
the four current-runtime rows only. Each owned context closes even on failure;
the harness disconnects without shutting down the shared browser. It does not
perform a file save, export, native import, public-site change or performance
measurement. `PASS` means the bounded observations and preservation assertions
match; the intentionally refused disjoint request remains unsupported.

## Existing code paths and actionable mismatch

- `web/app/cad/sketch/sketchRegions.ts::describeSketchRegions` validates closed
  ordinary profiles, recognizes Circle / axis-aligned four-segment Rectangle,
  and derives descriptors for every bounded region.
- `modules/workbenches/modeler/features/extrude/profilePlan.mjs::profileRegions`
  models conservative disjoint/strictly nested circles and rectangles. Three
  nested circles create three independently selectable regions, not a forced
  even/odd fill. Intersecting, touching, too-close or open profiles are explicit
  unsupported cases, not silently repaired geometry.
- `.../extrude/authoredRegions.mjs::deriveAuthoredRegions` and
  `resolveAuthoredRegions` preserve stable authored primitive IDs, outer/hole
  membership and explicit separate/union intent.
- `web/app/cad/model/msketchRegion.ts` encodes the full descriptor in its ID;
  changed child boundaries invalidate stale selection rather than silently
  selecting a different region.
- `web/app/cad/craft/workerFeatureCommands.ts::inspectWorkerFeatureCommands`
  advertises any region having four outer IDs and no holes, without checking
  that the **whole source sketch** is a supported single rectangle or checking
  the rectangle planner's XY-frame restriction.
- `.../workerRectangleExtrude/workerRectangleExtrude.operation.ts` re-solves the
  actual source in a Worker, binds source/frame/boundary/currentness, and invokes
  the rectangle adapter. It consumes the whole source-plane root on success.
- `modules/engine/extrusion/rectanglePrismAdapter.ts` runs semantic preflight
  before native allocation. `rectangleProfileRequest.mjs` requires exactly four
  ordinary Segment objects across the entire sketch and a principal XY frame.
  Selecting one region from an eight-edge disjoint sketch therefore cannot pass.
- `modules/engine/solid/SolidKernel.ts` exposes typed box/Boolean/read/dispose
  requests. The profile research mount operation is outside that common typed
  request union and retains rectangle-only proof/projection assumptions.
- Existing legacy `EXTRUDE` can consume broader selected descriptors, but calls
  in-page OCC. It is not a compliant Worker implementation or an agent shortcut.

The narrow next contract and acceptance queue are in `CONTRACT.md`. No current
capability was silently expanded in this audit.
