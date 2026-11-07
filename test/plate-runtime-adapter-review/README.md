# Plate runtime adapter review — UNIMPLEMENTED

Reviewed frozen CAD `14537a7ed8dae74291863d703f0b73d57ff1660f`, 2026-11-06. This directory contains readonly source/ABI observations and a proposal. No product/runtime/browser/native shape/authored feature was changed or created. The signed mechanical app remains frozen. Full Gate1 remains unfinished.

The smallest reusable native seam is an **owned Boolean-with-history helper over both actual owned inputs**, followed by shared Worker selection propagation and semantic hole intents. Dedicated holes should reuse that Cut helper rather than duplicate Cut code. Bridging the two current private ledgers cannot establish the required source/ownership/selection contract.

## Observed reusable APIs and gaps

Paths are relative to frozen CAD unless marked native. `source-review.json` hashes reviewed files. `native-abi.json` enumerates exports without instantiating WASM. Source assertions are review controls, not geometry tests.

| Layer | Actual reusable API/evidence | Current boundary |
| --- | --- | --- |
| Legacy candidate owner | `modules/engine/extrusion/candidatePrismLedger.mjs`: `registerCandidatePrism`, `resolveCandidatePrism`, `executeCenteredHole`, `executeFourCornerHoles` | Private `occ-prism-v1` mount, limit8, projected `MBrepShell`, `worker-prism:1:` IDs. Source authentication/current-owner/semantic-side checks are useful. Handles cannot be adopted into another ledger. |
| Legacy adapters | `rectanglePrismAdapter.ts`, `centeredHoleAdapter.ts`, `fourCornerHoleAdapter.ts` in that directory | Genuine native/Worker projection, but rectangle chooses old07d OCC; holes require portable parent records. Old intent schemas lack the mechanical whole-part revision. Keep old saved operations exact. |
| Pure hole planning | `modules/engine/mount/centeredHolePlan.mjs`: `planCenteredHole`; `fourCornerHolePlan.mjs`: `planFourCornerHoles` | Reuse clearance, center/side roles, overlap and analytic volume. Four-corner accepts prepared legacy profilev1/2 and `sketch-region:` IDs, not V3. New adapter must derive equivalent rectangle data from actual Worker-solved source, never manufacture a legacy region/registry object. Preserve exact XY/+Z domain initially. |
| Generic owner | `modules/engine/solid/solidLedger.mjs`: `evaluateWorkerSolid`, `inspectWorkerSolidSelections` | One private `worker-solid:occ` mount, exact whole-part build, consumed-parent custody, measured single-solid `MWorkerSolid`, immutable selections. Kinds only box/Boolean/profile/edge-treatment; no owned-hole evaluator/intent. |
| Source/replay | `web/app/cad/craft/selectedProfileCommands.ts`, `modules/workbenches/modeler/features/workerSelectedProfile/workerSelectedProfile.operation.ts`, `unconsumedSketchSave.mjs` | Retain original raw sketch, source face/region, recorded build/profileVersion, real Worker preparation, source/depth replay and Save. Reuse the original rectangle; a second legacy extrusion is not an adapter. |
| Mechanical mount | `occ-mechanical-profile-mount.mjs`, `worker-controller.mjs` | Profilev3, box/Boolean/mesh/dispose, topology/classification, prism selections, treatmentv1. Research hole flags false; controller permits only exact old runtimes/portable parents. Removing a guard is insufficient. |
| Safe Worker | `oci-verified-worker.js` | Private tokens, real construction provenance/indices, owned release,32-result/triangle budgets. Safe-owned whitelist excludes research holes. Legacy hole branches depend on `prismProfiles`/`centeredResults` and DRAW-built tools; do not expose a cylinder/oldhandle bridge. |
| Generic Boolean today | Worker `bop`/`bopfuse`/`bopcut`/`bopcommon` + generic ledger | Actual geometry, but no owned per-operation A/B history response or authored selection propagation. Snapshot is `NO_AUTHORED_PRISM_SELECTIONS`, so current Boolean cannot support authored outer fillets. |
| Real circle tools | `polygonProfilePlan.mjs` `prepareLoop`; `selectedProfilePlan.mjs`; native V3; `ownedTopologyContract.mjs` circle slots | **V3 supports full circles as well as straight polygons.** Mechanical receipt includes available `actual-circle` first/last edge and swept-cylinder face. No new circle constructor is needed. Circular rim fillets are unsupported; that does not prevent the circle profile cutting a plate. |
| Lineage | `prismSelectionIndex.mjs`, `selectionAncestryIndex.mjs` | Actual construction source slots, complete source-edge/face relation validation, unique survivors, explicit unresolved diagnostics. Treatment helper accepts only fillet/chamfer and their blend naming. Extract common validation/survivor logic; do not disguise Cut as treatment. Joint A/B source naming is missing. |
| Public treatment/history | `workerEdgeTreatmentCommands.ts`, shared operation/journal | Current `MWorkerSolid`, inferred producer, actual advertised IDs, exact build/quota, atomic prepared publication, numeric size edit/travel. Reuse after cut result obtains genuine current selection index. |
| Persistence/budget/bindings | `solidIntent.mjs`, `selectedProfileBudget.mjs`, `engineCatalog.mjs`; `physicalBindingFields.mjs`, `authoredPhysicalManifest.mjs` | New owned-hole kinds need exact intent/build, source retention/replay/journal/Save validation and budget costs. Legacy holes are counted as separate-mount features, not generic results. Typed diameter/offset consumers are legacy-only; generic depth/newhole typed consumers remain unfinished. No scalar coercion or second parameter model. |

## Native observations

Frozen JS `b3d91cbb02f90ba56732039283d787b92eda97c51091fafbd933ecf4db30dd97`, WASM `28e8e2c2752cef100a98e24ec487f7d90021edb98fb060fdd1160fe63501bbe2`; R730 `/mnt/data10tb/codi-polygon-combined-mechanical-app-20261106-r2/.build/mechanical-profile-assets/`.

Actual exports include `PerformDrilledCutV1`, `ResearchFourCornerCut`, `ApplyOwnedEdgeTreatmentV1`, selected-profile V2/V3, owned topology/mesh/classification/release. **Export presence is not combined authored-operation qualification.** Native source `/mnt/data10tb/codi-occ-gate1-source-20261106` is clean at `07098de9e70197cb6bcbc800f75dbeda2bbec2d4`; `native-source.json` pins tracked source/excerpts. Existing `test/mechanical-profile-browser/product-source-mapping.json` maps component copies to CAD `f5103e...` and explicitly does not replay the C++ build. This review makes no stronger build-provenance claim.

`existing-circle-selection-observation.json` extracts the actual component's source-circle plans (including its explicit unauthored seam edge). It is existing evidence read back, not a new circle construction or public app result.

* Native `shape-io/main.cpp:155`, `PerformDrilledCutV1`, runs one real non-destructive `BRepAlgoAPI_Cut`, fuzzy1e-7, own history; returns `drilledTopology`, then `DBRep::Set`. Requires existing solid parent/tool names.
* `main.cpp:133`, `ResearchFourCornerCut`, runs one four-tool Cut with own history and positive valid single-solid checks. Its parent must be a compound containing exactly one direct solid. Do not fake-wrap a generic handle to satisfy that precondition.
* `occt/src/CommandInterpreter/DBRep.hxx:40` owned helpers and `DBRep.cxx:784` `Set` share the **same shape map**. No separate native-map barrier exists. `Set` may overwrite; `InsertOwnedNameV2` refuses replacement. Common native storage does not authenticate JS owner/source/producer.
* `shape-io/ownedTopologyV1.hpp:97`, `ancestry(input,output,algorithm)`, serializes complete response-local source-edge/face relations. Reuse for **both** operands of the exact Boolean builder. `reportedDeleted` is raw evidence, not sole tombstone authority; actual result membership controls.
* `ownedEdgeTreatmentV1.hpp` supplies bounded BRep bytes/catalog/all-tolerance input snapshots, preservation after success/failure, actual builder ancestry and measured output checks. Apply that discipline to both Boolean inputs. Supported treatment selection is a line adjacent to two planar faces; outer plate corners fit this declared domain if actual cut lineage proves them. Circular rims do not.

Legacy 7/11-face hole envelopes prove face/wall projections, not a complete current edge resolver for later fillets. They cannot replace missing Cut lineage.

## Native seam comparison

| Option | Work required | Assessment |
| --- | --- | --- |
| Enable research flags/adopt legacy handles | Still mismatched owner/portable parent/source IDs and tool/projection assumptions | Reject. |
| Dedicated owned-hole exports with separate Cut implementation | New tool builder, Cut, both preservation checks, full lineage, intent/history | Valid if qualified, but needlessly duplicates generic Cut unless factored. |
| **Owned Boolean-with-history over actual A/B** | One bounded Fuse/Cut/Common helper; non-destructive/history builder; exact A/B snapshots; separate ancestry maps; owned output wrapper; joint-source Worker resolver | **Preferred minimum shared native seam.** Real authored circle profiles can supply tools in the same model; dedicated hole semantics reuse Cut. No anonymous cylinder/DRAW/oldhandle bridge. |

Native helper may support genuine empty compounds, single/multi-solid results. Actual lower-dimensional contact is explicitly non-solid unsupported, never silently empty. Semantic plate-hole acceptance still requires positive valid **single solid** and expected removal. Validate both snapshots and result before unused-name insertion; failures preserve both inputs and owned count.

Joint naming keeps A/B feature/source namespaces separate, resolves against one actual result catalog, and reconciles all cross-input claims. Unique surviving A outer-edge keys suffice for outer fillets. B's source cylinder may uniquely map to a bore wall; rim edges may require joint A-cap/B-wall evidence and must stay unresolved when ambiguous. Two source keys must not become competing selectable IDs for one merged entity. Never use proximity, ordinal, mesh or face-count guesses.

**Additional schema blocker reported by the independently assigned native helper lane:** an actual plate/cylinder Cut can report generated vertex targets from a cylinder seam edge. Current `ownedTopologyV1.hpp` edge/face-only ancestry target serializer rejects those targets. This is a history-schema limitation, not geometric failure. The Boolean seam therefore needs an additive, explicitly versioned lossless relation schema carrying result-vertex census/targets (and source-vertex rows if it claims all-topology coverage). Keep qualified treatment-v1 exact. Never filter native vertex targets to make a validator pass; the Worker may truthfully mark unsupported vertex-derived selectable identities unresolved. This lane did not run that probe; its final native receipt/source checkpoint must be reviewed separately before qualification.

Generic Boolean geometry/ancestry does **not** encode through-all depth, centered positioning or four-corner side offsets. Dedicated authored hole intents remain necessary above the shared Cut: derive real tools from current rectangle W/H/depth and preserve source-circle/tool-role identity in the same history; re-evaluate them after source/depth edits. Existing V3 circle construction is reusable; no second authored plate. Sequential pairwise cuts may be a minimal first implementation if intermediate/tool costs and canonical role lineage are specified and qualified. One four-tool Cut may later share that checked core; do not claim legacy four-tool topology equality for sequential results.

## Concrete next task and ownership — proposal only

1. Native owner: new owned Boolean-history helper on actual A/B (independently assigned now), direct geometry/preservation/complete-history/empty/contact evidence first. Root owns main export/FFI, exact new pins and catalog. No frozen-asset changes.
2. Root Worker/controller: explicit owned operation, verify both owned operands/current source census and result; consume ancestryA/B from the actual builder, no global Boolean session. Add bounded joint selection derivation/immutable observations with producer binding and unresolved diagnostics. Prove circle-tool cuts retain four unique outer connectors.
3. Root ledger/intent/history: route through existing solid ledger; explicit new capability/build with saved revisions exact. Add semantic owned-hole intents/source associations and physical consumers where required, source retention, budget including tools/intermediates, operation replay/journal/native Save validators together. No legacy handle import.
4. Bounded public lane: discover current eligible body/source, infer producer, accept authored dimensions/source choices only; reuse atomic prepared publication/service-stream-document guards/cancellation/outcome handling. Generic public Boolean can qualify the native seam first, but cannot claim semantic through-all hole replay. Desktop schema follows final core contract.
5. Qualify actual Worker then signed app after integration, freezing exact app/Worker/native/source/desktop pins and build provenance. Native evidence is not app/history evidence. Typed editing is separate from typed readonly inspection and stays unfinished until qualified in this same model.

Review ownership is this new directory only. Coordinate exact implementation files before edits. Native Mesh has no declared owned analytic-hole/treatment capability here; refuse explicitly rather than force parity.

## Future acceptance — all UNTESTED here

Author a genuine public rectangle `[0,W]×[0,H]`, +Z D with original constraints, selected-profile extrusion, semantic centerØ10 + fourØ4 offsets10/10, then existing edge command. Generic precursor may use real authored circle profiles/Boolean, clearly separate from semantic replay. One source/part/build, no native seed. Fillet/chamfer use separately authored parts because kind is not a size edit. `oracles.json` is independent math, not executed geometry.

| Row | Required independent result |
| --- | --- |
| A: 100×50×20 → center → four holes | Valid native one solid each step; volumes `WHD`, `(WH-25π)D`, `(WH-41π)D`. Two planar caps/four outer planes/five cavity cylinders. Native cavity-axis points outside, material points inside, radius±0.01mm samples check every bore. |
| B: four discovered outer vertical edges → R2 fillets / equal1 chamfers | Unique actual A-lineage IDs/current producer. Volume `(WH-16-37π)D` fillet, `(WH-2-41π)D` chamfer. Four R2 outer cylinders/bevel planes, unchanged bounds, corner point classifications. Circular rim treatment remains unsupported. |
| C: D20→12, treatment size2→3, Undo/Redo | Same raw source/region/curve IDs/build; source/tools/holes/treatment fully replay. Four fillets remove `4*r*r*(1-π/4)D`. Journal reconstructs same authored model, no preview-only result. |
| D: W/H100/50→150/30, D20 | Original rectangle constraints retained, residual≤1e-8mm; centers derive from new source, volumes match oracle. Current lineage retains unique source keys or explicitly refuses ambiguity. Preserve W/H names/typed units when typed support is claimed. |
| E: invalid/stale/contact | H12 at offset10/r2 touches side: clearance1e-5mm requires `HOLE_OUTSIDE_PROFILE`. H15 may fit and current planner has no offset<halfheight/ordered-row guard: do not require false rejection. New branch restriction must be explicit/versioned. Overlap/outside/nonpositive/stale source/foreign body/old producer/unknown edge/mixed build/quota refuse atomically. Excessive native fillet failure does not prove mathematical impossibility. |
| F: CAD Save/sync → fresh document/context Open | Retain raw source/constraints, exact feature/producer/source/region IDs/dimensions/build. Fresh Worker reconstructs expected native metrics/current selection keys; re-edit D/size, Undo/Redo, re-save. No handle/index/mesh saved as authored authority; no account/session copying. |
| G: lifecycle/old build | Exact A/B snapshots preserved on every outcome; owned counts balanced. Cancel/supersede candidate preserving accepted model/history; close owned fixture only. Old07d history retains old runtime/refuses mechanical treatments, no automatic fallback/upgrade. No filesystem-race tests. |

Units mm/mm²/mm³. Proposed tolerances: volume `max(1e-6mm³,1e-9*abs(expected))`; bounds1e-7mm; classification1e-7mm with samples≥0.01mm from boundary. Avoid unqualified traversal counts sensitive to seams: verify analytic surfaces/cavity connectivity/one solid/actual lineage. Display mesh is not geometry authority.

Full original-rectangle test still requires **three** centerØ10 holes at spacing20 plus fourØ4 and fourR2 outer fillets: volume `(WH-16-87π)D`. Pattern authoring/lineage, all22 exercises, assemblies/manufacturing drawings and remaining competencies remain unfinished. Preserve full stop condition: complete qualification, save handoff/backups, then pause.

## Reproduce readonly observations

Run Node24 `source-review.mjs` and `oracles.mjs` from this checkout; compare stdout with saved JSON. On R730 run `inspect-native-abi.cjs` with the frozen WASM/glue paths above; it compiles/enumerates exports only. `python3 capture-native-source.py /mnt/data10tb/codi-occ-gate1-source-20261106` reads tracked objects and requires clean source. No authoring/native construction tests ran here.
