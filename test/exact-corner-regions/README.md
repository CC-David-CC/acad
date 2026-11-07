# Exact exterior corner regions with nested intent

SOURCE COMPLETE, UNTESTED. No per-step tests, syntax/type checks, build or browser execution were run. The parent must compose this source, build the complete application and run the full driver before claiming a newly qualified region domain. This closes one precise ordinary interpretation gap; it is not a general planar arrangement engine or full E04/E05 pass.

Confirmed source rejection before this change: two ordinary closed polygon rectangles [0,20]×[0,10] and [20,40]×[10,20] meet only at (20,10). Their interiors are disjoint and each is independently a valid simple native face. Yet partitionSelectedSegments rejects degree4 at their shared geometric endpoint before descriptor discovery, and polygonProfileRegions separately rejects all contact. No before test was executed under the user's workflow-first cadence; this is a direct source-contract counterexample, not a newly observed native/browser failure.

The new Worker-only interpretation has two independent sufficient conditions:

- separateArticulatedRegionBlocks computes exact undirected endpoint-graph biconnected edge blocks. A closed block must be one simple cycle with every block vertex degree2; individual geometric simplicity still goes through the existing polygon planner. Shared articulation vertices do not combine boundaries. The final census checks every original curve exactly once. Remaining bridges retain the existing open-chain classification and strict closed/open isolation policy. Chords, shared edges, duplicate edges, non-articulation branching, geometric crossing and incomplete/gapped boundaries remain refusals. There is no proximity welding, source rewrite, edge splitting, synthetic segment ID or turn-angle guess.
- hasExactExternalVertexContact requires complete pairwise boundary segment observations: every contact must be an exact shared endpoint, with no crossing or overlapping segment. An actual incident edge line must put every polygon vertex in one closed half-plane and every vertex of the other in the opposite half-plane, each with strict interior extent. Existing exact dyadic orientation predicates prove the sign. This certifies disjoint polygon interiors and isolated endpoint contact without rounded midpoint probes or numerical epsilon. Unproven contacts refuse. Circles, boundary-interior T contacts, shared edges, internal hole tangency and arbitrary arrangements are not newly admitted.

Only the GLOBAL polygon region hierarchy treats that proved exterior contact as separate. Actual native face/hole preparation and clearance checks are unchanged. Each explicit selected region produces its own independently measured native solid with bodyPolicy separate. Two solids touching along their extruded contact are not claimed to be a single manifold Join. Source/history intent, opaque region ID grammar and descriptor source IDs are unchanged; existing independent region edit, source edit, journal and native persistence paths are reused.

V2 requests keep the original path. V3 extrusion and depth-free source-face discovery use the same exact block interpretation. Unsupported unselected primitives are never filtered. The flat legacy region asset graph copies and rewrites the new relation dependency under its existing module/byte bounds; modern owned-profile stagers follow actual static imports. No native pair, bootstrap pin or default build changes.

The prepared driver uses ONLY registered public New/plane/primitive/region/extrusion/point/depth/Undo/Save/Open commands. Read-only __CAD_APP observations come from the retained signed harness. Every curve/point/feature/output ID is an actual returned or inspected ID, never parsed from an opaque region/native ordinal. It creates twelve Segments: A20×10, B20×10 at A's upper-right corner, and an actual nested5×6 rectangular hole in A. Discovery must expose exactly three supported bounded cells with all twelve source curves appearing once as outer contours. It explicitly selects A-with-hole and B as separate features.

Full workflow source covers both the ordinary coordinates and a translated negative-coordinate case (x−30/y−20) with reversed source authoring/feature creation order. For each it exercises inner-cell region reselection with same feature/output IDs, mixed shared UndoRedo, moving all eight actual B endpoints by+5mm into separation and back to exact contact, crossing/shared-edge/circle-tangency refusal preservation, normal native Save/server SHA agreement/fresh signed Open, depth7 reedit, UndoRedo/resave and fresh Open. No source seeds, geometry doubles, guessed endpoints, hidden repair or private mutation.

Frozen independent analytical oracles:

| Selected body | Native volume mm³ | Bounds relative to source (x,y), mm |
|---|---:|---|
| A minus nested5×6 hole, depth5 | (20×10−5×6)×5 = 850 | [x,y,0]..[x+20,y+10,5] |
| Explicit inner cell, depth5 | 5×6×5 = 150 | [x+5,y+2,0]..[x+10,y+8,5] |
| Separate corner-contact B, depth5 | 20×10×5 = 1000 | [x+20,y+10,0]..[x+40,y+20,5] |
| B translated+5X | 1000 | [x+25,y+10,0]..[x+45,y+20,5] |
| Reopened B depth7 | 1400 | [x+20,y+10,0]..[x+40,y+20,7] |

Absolute volume and bounds tolerances are1e-6 mm³/mm respectively. Require exact JS/WASM revision, valid native single-solid census for EACH separate output, actual feature/output/source IDs/counters, unrelated source records and complete stored nine-field selected-profile intent. Every candidate/native owner must retire after each invocation. Raw refusal snapshots are retained; only three opaque inspection revision fields may advance under an evaluated refusal, with all authored/native/baseline/journal/material/counter/document fields exact. Session journal resets only on fresh Open.

Run only on the parent's composed exact served runtime, with a fresh evidence directory and owned contexts:

```sh
CODI_DESKTOP_SOURCE_ROOT=/absolute/current-desktop-source \
CODI_SIGNED_PINS=/absolute/runtime-pins.json \
CODI_EXPECT_SOURCE=exact-ACAD-source CODI_EXPECT_DESKTOP=exact-host-source \
CODI_CORNER_REGION_ENGINE_REVISION=sha256:exact-js:exact-wasm \
CODI_TEST_URL=http://127.0.0.1:PORT/ CODI_TEST_CDP=http://127.0.0.1:19329 \
PUPPETEER_CORE_PATH=/absolute/puppeteer-core CODI_EVIDENCE=/tmp/fresh-corner-regions-proof \
/tmp/codi-files-move-node/bin/node test/exact-corner-regions/desktop-driver.mjs
```

The parent owns fixture lifetime and shared Chrome. The driver closes only owned contexts, after durable operations settle; no save-race/cancellation probes, account-state copies, deployment, imports/migration or provider fallback are included. Human legacy region rendering remains outside this shared Worker/public-command proof.
