# Explicit V3 source → selected polygon regions

Product commits b4bd4ba7 + f4d427fa, from e9ec16d7d. Only the assigned selectedSketchProfile.mjs, authoredRegions.mjs, and polygonProfilePlan.mjs change. Existing numerical predicates and provider clearance policy remain unchanged; polygonProfilePlan only exports its existing relation and adds bounded immediate-child nesting for already prepared loops.

## Contract

The existing prepareSolvedSelectedRegion / inspectSolvedSelectedRegions inputs may additionally contain own enumerable data `profileVersion:3`. Capture copies this flag, source string, scalar parameters and frame before the digest await. Missing flag keeps V2 behavior. Explicit values other than3 refuse; native sketch JSON version3 and this geometry-preparation version are different fields.

V3 extracts exact nonbranching Segment loops of3–512 edges and full Circles. Each ordinary loop is checked by the same V3 polygon planner used for execution before deriving nesting. Unsupported ordinary curves are not discarded. Nested boundaries create distinct selectable cells with immediate children as holes; disjoint cells remain independent. Existing canonical authored-ID region descriptors are retained. No arrangement/intersection decomposition, snapping, proximity welding or source rewrite is added.

The existing binding fields remain unchanged; prepared request.version is3 when explicitly selected, otherwise2. Public callers still need a genuine current accepted sketch-Worker solve plus host/document/source binding through native publication. This helper neither solves nor admits constraints and does not itself establish public currentness.

Limits retained:1MiB UTF8/source-unit cap,4096 objects,512 source-wide ordinary segments,128 contours, existing source-stage/generator/frame/digest/coordinate/depth/qualified-ID/region-ID limits. V3 selected-request limits come from the existing polygon planner. The512 global segment bound applies across all loops; allowing a512-edge loop does not expand it to4096 source segments. Construction geometry/Points keep their existing interpretation. Ordinary unsupported geometry anywhere in the source is not hidden merely because another region was selected.

Current per-region/native transport/owned-catalog limits remain separate. Discovering a source region does not prove a native solid, persistent generated topology, manufacturing mesh or export support.

## Evidence

| Evidence | Result/scope |
|---|---|
| Current Node tests |31/31 entries PASS; new9 source groups, retained7+11 V2, existing authored-region3 and actual simple-polygon Node Worker11 groups represented by one test entry |
| Current Chromium module Workers |13/13 PASS on f4d427fa: triangle/rotated/L, mixed holes, nested/disjoint, XZ frame, V2 retention, gap/intersection/unsupported curve/aggregate cap and same-submitted-object asynchronous capture |
| Retained Chromium discovery Worker suite |9/9 PASS unchanged on f4d427fa |

These are explicit native-v3 source fixtures in real preparation Workers. They are NOT public authoring, accepted sketch solver, native kernel, signed persistence, whole application or full Gate1 qualification. Fixture creation, JSON encoding/hash and geometry work occur inside dedicated Workers; the page dispatches labels/receives bounded observations. No native WASM/canvas/AI provider is loaded. Results are frozen inside the Worker; structured clone alone does not retain freeze in a receiving realm, so public adapters still need their own capture/freeze validation. Own browser contexts close; the shared browser stays alive.

Independent positive oracles check triangle/rotated/L areas, mixed-hole subtraction, all nested cells, separate islands, exact XZ bounds, membership changes requiring reselection and preserved exact source bytes/coordinates. Invalid inputs, unsupported profile topology, provider resolution, stale digest/frame and stale region remain explicit separate errors. A 512-edge loop prepares;513 aggregate source segments refuse even when individually valid loops would fit the per-loop bound. The asynchronous capture control mutates the SAME submitted object's flag/frame after the genuine digest begins; the returned request retains original V3/frame.

Initial b4bd evidence (12 new Workers +9 retained) is preserved under b4bd filenames. That candidate unnecessarily allowed4096 source-wide segments. f4d restores512 before final qualification; its receipts are new, not relabeled. The earliest browser connection-refused log is retained: it ran before fixture readiness, before any preparation Worker. Reading the ready fixture then running the same ordinary harness succeeds; no product change hid that setup failure.

## Reproduce

Use the existing Node binary and run:

```
node --test test/selected-polygon-source-v3/source.test.mjs test/selected-profile-kernel/source-region.test.mjs test/selected-region-discovery/discovery.test.mjs test/simple-polygon/*.test.mjs test/learning/authored-regions.test.mjs
```

Start the exact-file private loopback server with `python3 -B test/selected-polygon-source-v3/serve.py --root . --port FREE_PORT`. It serves only this fixture, retained discovery fixtures and six actual source modules. Set JSKETCHER_TEST_URL, CODI_TEST_CDP, CODI_SOURCE, PUPPETEER_CORE_PATH and CODI_RECEIPT and run browser.cjs. The unchanged test/selected-region-discovery/browser.cjs runs against the same fixture for V2 retention. Check pins.json against served/local sources.

R730 source fixture:/mnt/data10tb/codi-selected-polygon-source-v3-20261106-r2; evidence/log area:/mnt/data10tb/codi-selected-polygon-source-v3-evidence-20261106. Earlier b4bd source remains separate. No account/key/private state, dependencies, binaries or public deployment is included. No Files or filesystem-race/security work was performed.

## Serial integration still owned by parent

Root wires actual semantic/public source solve, profileVersion3 transport, native V3 shared-vertex/provenance build, selected operation/history/build identity and application selection. The additional source-module dependency is polygonProfilePlan.mjs → simplePolygon.mjs, also imported by authoredRegions; direct-module fixtures must serve those modules even when testing V2. Application bundles must include the actual new source. A future public proof must author the shapes through shared commands, bind returned IDs/revisions, regenerate/save/reopen and check native measurable geometry; component fixture seeds are not a substitute.
