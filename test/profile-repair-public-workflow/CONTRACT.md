# Public profile refusal and explicit repair

Source preparation only. This commit does not claim a browser, solver, Native, persistence or full Gate 1 PASS. Parent runs the complete workflow after integration; no incremental checks, probes, builds or browser work were run for this source checkpoint. Product files remain unchanged.

The single driver runs four complete cases through the existing registered commands. Every primitive ID comes from `append-sketch-primitive(...).primitive.id`; endpoint IDs come from current `inspect-closed-sketch` rows. Region IDs come from supported descriptor-backed discovery and are passed unchanged. Nothing constructs or parses opaque IDs, rewrites source JSON, seeds model history, substitutes a Native primitive, or creates a second model.

Each case has an unrelated 10×5 mm rectangle at source coordinates x100..110/y0..5 on an independent XY plane at z50. Its actual native source string is recorded immediately and must remain byte-identical through repair, mixed travel, Save, fresh Open and reedit. Its genuine descriptor-backed region is discovered before and after the case. It is a source control, not an additional printable body.

| Case | Authored defective source | Required planar refusal | Explicit public repair |
| --- | --- | --- | --- |
| missing-side | Three sides of x0..20/y0..10 rectangle | `OPEN_OR_AMBIGUOUS_PROFILE` | Append missing left Segment |
| gap-1e-3 | Four sides; left bottom endpoint is (0,0.001), bottom starts (0,0) | `OPEN_OR_AMBIGUOUS_PROFILE` | Edit the actual inspected left endpoint to (0,0) |
| gap-1e-8 | Same source with actual positive gap0.00000001 mm | `OPEN_OR_AMBIGUOUS_PROFILE` | Same explicit endpoint edit |
| bow-tie | (0,0)→(20,10)→(0,10)→(20,0)→(0,0) | `SELF_INTERSECTION` | Remove the two returned diagonal Segment IDs; append exact left/right sides, retaining both horizontal Segment IDs |

The topology oracle uses exact source numbers, endpoint degree and a strict diagonal crossing at (10,5). It does not reinterpret a small gap as zero or use a visual comparison. After explicit repair there are exactly four original/appended Segment IDs bounding one 20×10 mm rectangle. Public selected-region discovery must return exactly one matching supported cell with no holes. The 20 mm separate extrusion has analytic volume4,000 mm³ and bounds[0,0,0]..[20,10,20], six Native faces/twelve edges/eight vertices, valid and one solid. Native volume tolerance is absolute1e-6 mm³; each bound tolerance absolute1e-6 mm. Source coordinates and retained IDs use exact equality.

## Actual domain boundaries inspected before expectations

- `web/app/sketcher/headless/primitiveTransition.ts`: ordinary Segment length must exceed1e-9 mm; coordinates are finite within±1e8 mm. This is a **segment length** admission threshold, not a joining tolerance between two separate endpoints. A long left side ending1e-8 mm above another Segment is representable under this contract. Appending must preserve requested geometry and all old source through a genuine solve and independent transition verification.
- `web/app/sketcher/headless/coordinateTransition.ts`: actual saved endpoint IDs are resolved; requested coordinates must remain numerically exact, temporary coordinate drivers are removed, authored constraints are preserved, and the ordinary source transaction replays dependents. No persistent auto-coincidence or proximity repair is introduced by this command.
- `web/app/sketcher/headless/primitiveRemovalTransition.ts`: removal admits only actual unreferenced, ungenerated independent Segments; it preserves all other object IDs/data and scans retained references. This fixture has zero authored constraints/generators, so bow-tie diagonals are supported removal targets. No cascade or repair-by-filtering is requested.
- `modules/engine/extrusion/selectedSketchProfile.mjs`: endpoint keys/equality use actual numeric coordinates. V3 ordinary closed boundary blocks are separated using `articulatedRegionSegments.mjs`; bridging chains are processed by `isolatedOpenProfileComponents.mjs`. No closed loop plus a real open chain produces `OPEN_OR_AMBIGUOUS_PROFILE`. All closed loops are validated; malformed loops are not silently discarded.
- `modules/engine/extrusion/isolatedOpenProfileComponents.mjs`: V3 explicitly supports isolated open chains alongside separately closed components under an outward AABB-clearance proof, with observable `sourceAnalysis.policy='v3-extrusion-isolated-open-chains'` and `OPEN_NON_BOUNDARY` rows. Consequently this driver does **not** claim every open curve anywhere on a source globally invalidates an unrelated bounded cell. The unrelated valid control is placed on a separate plane so the defective source itself contains no qualified cell. This keeps expected rejection precise.
- `modules/engine/mount/polygonProfilePlan.mjs`: exact ordered endpoint closure precedes polygon qualification. Its1e-4 mm clearance/edge-resolution bound does not license snapping the1e-8 gap. `modules/engine/extrusion/simplePolygon.mjs` classifies strict nonadjacent crossings as `SELF_INTERSECTION` before Native construction; binary64 orientation uses an exact fallback. The positive repaired20×10 rectangle is comfortably inside the declared domain.
- `web/app/cad/craft/selectedProfileCommands.ts`: normal discovery performs two genuine source reconstructions and two semantic preparations under source/frame/document guards. Invalid source preparation is the expected refusal layer. An invalid source has no discovered region ID, so the test will not invent an ID merely to call extrusion.

If actual source inspection shows the tiny endpoints already changed, or discovery admits the broken profile, the complete run must fail with its original raw receipt and source pins. There is no documented below-tolerance weld in these inspected paths. Do not amend the oracle to normalize it away. A future explicit repair policy would need observable behavior and a separately reviewed contract.

## Complete sequence and invariants

For each case, publicly append the defective sketch; read actual local solver diagnostics and accepted source; require the specific planar refusal with exact before/after state/tokens and zero Native candidates/owners/mounts. An accepted unconstrained sketch is not a qualified bounded region; neither planar refusal is a mathematical constraint contradiction or a Native failure. Diagnostics make no global DOF/solvability claim.

Repair using only the public methods above. Discover the actual matching region, create the real extrusion, and batch-edit the four discovered right-boundary endpoint objects from x20 to22. Verify the same feature/output IDs,4,400 mm³ and bounds[0,0,0]..[22,10,20]. Undo that source edit, Undo extrusion creation, then Undo every explicit repair operation back to the original exact malformed source. Require its original refusal again. Redo every repair, original extrusion ID and source edit in the same journal order. Primitive identity/source history are preserved; feature allocation high-water is recorded at creation and retained during Undo. Revisions legitimately change during authored travel; exact token comparison applies to read-only/refusal observations in the same window.

Normal native Save must commit in the browser, synchronize the owned My Files/server bytes and match their SHA. Fresh normal Open retains both exact source records, all actual authored IDs/params/counters and the measured Native body; the session Undo journal resets. Reedit width22→24 using current inspected endpoint IDs, verify4,800 mm³/bounds[0,0,0]..[24,10,20], Undo/Redo, then resave the same association and fresh Open again. The eight saved files are independently checked from raw bytes by `oracle.mjs`; all point/curve/source and history evidence remains in the receipt. Per-manager material inspection revisions may rebind across Open, while persisted authored material/presentation/source state remains unchanged. No manufacturing/export/drawing/typed-unit claim is added.

## Parent execution

Run only after the parent freezes the current coherent runtime and explicitly qualifies the whole workflow. Use an owned fresh evidence directory and browser contexts. The shared browser/service is retained; durable Save/sync operations are awaited to settlement, with no forced-close race. No additional dependencies are installed.

```sh
CODI_DESKTOP_SOURCE_ROOT=/absolute/frozen/desktop-source \
CODI_SIGNED_PINS=/absolute/frozen/runtime-pins.json \
CODI_EXPECT_SOURCE=EXACT_ACAD_COMMIT \
CODI_EXPECT_DESKTOP=EXACT_DESKTOP_COMMIT \
CODI_PROFILE_REPAIR_ENGINE_REVISION=sha256:EXACT_JS:EXACT_WASM \
CODI_TEST_URL=http://127.0.0.1:PORT/ \
CODI_TEST_CDP=http://127.0.0.1:19329 \
PUPPETEER_CORE_PATH=/absolute/qualified/puppeteer-core \
CODI_EVIDENCE=/fresh/owned/profile-repair-proof-r1 \
/absolute/qualified/node test/profile-repair-public-workflow/driver.mjs
```

Then run the independent saved-source/Native observation arithmetic checker using the same frozen oracle:

```sh
/absolute/qualified/node test/profile-repair-public-workflow/oracle.mjs /absolute/profile-repair-proof-r1
```

The Driver and checker preserve failures. A FAIL stays a FAIL until a separately versioned, justified correction or coherent product repair is reviewed. Geometry, exact-gap expectations and failure-layer assertions cannot be weakened to fit results.
