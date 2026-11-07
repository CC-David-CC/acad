# Gate1 E11 and integrated plate: source findings and bounded implementation plan

Reviewed CAD source: b076d5921aa9d88918f5edc48fb063b9384784df. This note is source inspection, not browser qualification. No product changes, seeded public/native model histories, Files re-audit, packaging or filesystem-race/security testing. Separate ordinary native C++→WASM helper probes are explicitly identified in the native repository.

## Current gap

The public five-hole plate cannot acquire a correct fillet/chamfer merely by exposing the legacy tool to agents. Worker-native ownership and persistent outer-edge identity are missing at that boundary. Preserve the existing authored graph, sketch solver, expressions, candidate owner, edit journal and native project. Extend their real feature pipeline; do not introduce a competing model or convert display meshes to native geometry.

| Existing surface | Actual behavior | Required next step |
|---|---|---|
| SolidKernel.ts | box/Boolean/selected profile/mesh/dispose | Add explicit bounded topology/edge-treatment capabilities. |
| solidLedger + workerSolidCommands | live operands, registered same-build check, private owned handles | Reuse ownership/publication semantics; do not accept native handle input from agents. |
| MWorkerSolid | whole native result, empty faces/edges/vertices, editableTopology:false | Generic selected solids have no persistent selectable edges today. |
| rectanglePrismAdapter + candidatePrismLedger | separate existing occ-prism-v1 mount with current plate/hole associations | Current plate is not a generic solidLedger operand. No ID cast or render-mesh conversion bridges this. |
| FILLET_TOOL | legacy OCI blend/chamf + requireLegacyPointer | Correctly refuses Worker bodies. Old legacy browser receipts are not modern public E11 proof. |
| PATTERN_LINEAR/RADIAL | copy entire legacy bodies | Retain body-pattern semantics; this is not a repeated hole feature. |
| PATTERN_CUT_LINEAR | legacy immediately preceding circular EXTRUDE/SUBTRACT, unrotated plate, world X/Y, count2–16 | Reuse the seed-tool concept, not its pointer path. Current Worker holes and non-immediate seeds after edge treatments are not supported. |

Sources: modules/engine/solid/{SolidKernel.ts,solidIntent.mjs,solidLedger.mjs,solidOperandRuntime.mjs}; web/app/cad/{model/mworkerSolid.ts,model/workerGeometry.ts,craft/workerFeatureCommands.ts,craft/workerSolidCommands.ts}; modules/engine/{extrusion,projection,mount}; modules/workbenches/modeler/features/{fillet,patternLinear,patternRadial,patternCutLinear}. Historical scopes: test/webos/{plate-fillet-pattern-README.md,feature-pattern-cut-README.md}. The latter explicitly retains old native-name/interrogation allocation limitations.

## Exact current target identities

IDs must remain opaque to public callers; discover actual returned values. These describe source encoding, not permission to manufacture selectors:

| Target | Existing encoding |
|---|---|
| generic output | worker-solid:1: + JSON [featureId,"body"] |
| plate body | worker-prism:1: + JSON [String(prismFeatureId),"body"], retained through holes |
| base/lid | same prefix + [prismFeatureId,"face","BASE" or "LID",{regionId}] |
| swept side | [prismFeatureId,"face","SWEEP",{segmentId}] |
| initial cap edge | [prismFeatureId,"edge","BASE" or "LID",{segmentId}] |
| center hole | [centerFeatureId,"face","HOLE_WALL",{parentFeatureId,regionId}], rim edge roles BASE_RIM/LID_RIM |
| corner hole | [cornerFeatureId,"face","CORNER_WALL",{parentFeatureId,centerFeatureId,regionId,corner}], same rim roles; corner is one of four source-local MIN/MAX combinations |

rectanglePrismProjection.ts explicitly leaves four vertical connector edges transient while qualifying eight cap edges. centeredHoleProjection.ts and fourCornerHoleProjection.ts reconstruct all edges and assign durable IDs to hole rims; parent face IDs survive, but outer edges remain transient. assertDurableReference correctly refuses saved selection of those edges. Current native cut responses report parent-face same/modified links and tool-generated edges, not complete parent-edge ancestry.

The minimal plate addition is a proven cap-edge descendant map plus vertical connector keys from the two incident authored source-segment IDs (canonical unordered pair scoped to the prism feature; proposed new CONNECTOR role). Resolve through the native cut's real same/modified/deleted history and actual incidence, never a nearest-coordinate heuristic or result ordinal. Intersections/splits/ambiguity must fail or require explicit repair.

## Catalog for all owned solids

Every bounded owned native result, including cuts, can expose response-local edges/faces/vertices/incidence and actual analytic types. Universal durable naming is not guaranteed: periodic seams, coincident symmetric edges and Boolean splits/merges can be ambiguous. Only unique authored-origin + native-ancestry relationships receive persistent keys. All other records remain explicitly unsaved/unresolved.

Catalog contract should bind the exact current native result/build and generation. Initial descriptors cover line/circle edges and plane/cylinder faces; report other actual types as unsupported rather than inventing lines or dumping unbounded NURBS arrays. Native indices only relate one catalog/history response. Keep key→native-edge maps private in the Worker/evaluation. Rebuild/reconcile on replay; zero/multiple descendants do not silently choose a replacement.

Generic box origins can seed semantic keys from authored local coordinate faces/edge intersections, validated against actual topology. Selected-profile keys derive from authored region/curve IDs and cap/sweep/hole roles. Boolean outputs propagate per-input source keys via actual builder history and explicitly retain ambiguity. Body/face/edge validity and dependency validity remain separate questions.

## Native helper ownership and APIs

Reviewed native repository: occt-interpreter-codi.git, source c10848b72b9bebf7c9fff334bdf83e5acf79bda5. Parent's shared branch/worktree: feature/cad-gate1-kernel-20261106 at /mnt/data10tb/codi-occ-gate1-source-20261106. Parent owns selectedProfileV2.hpp polygon support and main.cpp/export/build wiring. Assigned catalog ownership is NEW shape-io/ownedTopologyV1.hpp plus own probes/notes only.

Header namespace e0::owned_topology_v1:

- catalog(const TopoDS_Shape&) -> bounded JSON string with response-local metadata; no saved IDs/native pointers.
- ancestry(input,output,Algorithm& builder) -> bounded same/modified/generated/deleted edge/face links from that exact builder. Capture immediately, before unrelated native work; do not rely on later mutable DRAW global history.

A later implementer can own NEW ownedEdgeTreatmentV1.hpp after this interface is reviewed. Use local RAII builders and final owned result insertion only after completion, native validity/solid count/volume/bounds checks; preserve inputs. The checked source links TKFillet and exposes BRepFilletAPI_MakeFillet(shape)/Add(radius,edge)/Build/Generated/Modified/IsDeleted, BRepFilletAPI_MakeChamfer(shape)/Add(distance,edge)/Build, and BRepBuilderAPI_Transform with copied geometry/mapping. Availability is not qualification. Avoid legacy Interogate: source allocates new TopoDS_Shape pointers on each call. selectedProfileV2.hpp already demonstrates owned final-name insertion/release and direct mesh reading.

## Serial runtime decision

Current V1 plate requests do not persist an engine revision and statically use default a84/07d assets. Generic selected-owned requests persist cbd/a81. The selected-owned Worker explicitly refuses old research prism/cut messages. Do not swap assets silently, cast a plate handle to another mount, or switch kernel mid-history.

Persist/select one explicit part evaluation build, then regenerate its entire authored prefix on that build. Parent must choose a deliberate part-level binding or versioned plate schemas before integration. Retain old V1 semantics until explicit re-evaluation. Extending the current plate candidate ledger is smaller than replacing its already-proved sketch/face/physical-edit path while implementing E11; share catalog/operation contracts with generic solids so a later adapter can expose genuine support.

## Minimal common feature contract

Proposed discovery: inspectWorkerEdgeTreatments()->{revision,ready,reason,bodies,capabilities}, with current supported persistent edge keys and explicit reasons. Proposed execution: createWorkerEdgeTreatment({revision,version:1,unit:'millimeter',engine:'occ',engineRevision,bodyId,kind:'fillet'|'chamfer',edgeIds,size},{signal,valid}). Registered history stores source keys, size/binding, feature ID and backend/build, never handles/native indices/meshes.

First support constant radius/equal-distance operations on proven straight outer edges of one valid plate. Do not imply variable radii, face-wide expansion, tangent propagation, mixed bodies, distance-angle chamfers, or every kernel-valid edge case.

Feature patterns need a distinct Worker operation with target body, authored seed feature, count including instance zero, signed spacing and source-local X/Y direction. Replay derives the current seed tool/placement/through-all semantics; repeat its tool against the current target in the same Worker. Resolve a non-immediate seed through intervening fillet/chamfer features. Do not copy an already-cut body or substitute an anonymous cylinder at old measured coordinates. First scope: disjoint contained circular through-cuts, count2–16, stable instance keys from pattern feature/index.

## Companion gaps that geometry alone does not close

- Old prism association/default OCI lifetime-name cap8 differs from selected-owned names32/cumulative triangles100000. Preflight all retained results/tools. Disposal does not replenish a lifetime budget; caps are not heap/RSS guarantees. Keep heavy planning/native work/meshing in Workers.
- selectedProfileBudget.mjs knows BOX/BOOLEAN/SELECTED only; new operations need explicit budget semantics, not ignored counts.
- unconsumedSketchSave.mjs exact ancestry whitelist must inherit treatment target sources and pattern seed/target sources. Dependent fast-save still rejects, unrelated planes/source edits remain possible; full edits replay the whole suffix atomically.
- workerFeatureCommands.ts and web/app/cad/parameters/physicalBindingFields.mjs do not inspect/edit treatment size or pattern count/spacing. Use the existing journal; size/spacing are length, count dimensionless. Signed spacing cannot use positive-only guards.
- Candidate publication binds exact source/model/catalog/build and lifetime. Failure retains the last accepted model/source/history/references/journal. Distinguish input, constraints, region, kernel and dependency failures. Nonconvergence does not prove infeasibility.
- Fresh ordinary native save/reload must regenerate exact operation schemas/selected keys/seed/build/units/expressions. In-memory undo is insufficient. Native shape bytes or render meshes are not editable intent.
- Verified native mesh display can avoid a full arbitrary fillet-surface MBrep reader. It must honestly withhold unresolved topology. If downstream commands resolve semantic keys privately instead of MBrep children, agree that model/descriptor bridge explicitly; do not fabricate faces to satisfy existing selectors.

## Ownership queues after B0

| Lane | Exclusive files | Dependency/result |
|---|---|---|
| Native catalog | NEW ownedTopologyV1.hpp + own probes | Parent retains polygon/main/export edits; actual bounded catalog/history first. |
| Pure semantic contracts | NEW authored-edge/treatment/pattern intent modules/tests | Can parallel native helper after contract freeze; no shared ledger/dispatcher edits. |
| Native treatment | NEW ownedEdgeTreatmentV1.hpp + probes | After catalog API; actual fillet/chamfer/ownership/input preservation and new build pins. |
| Serial integration owner | Worker/controller/types, candidate ledger/projections, operations, runtime selection, craft edit journal, ancestry/budget | Genuine public plate chain; avoid overlapping these files across agents. |
| Independent acceptance | NEW tests; desktop/Agent tools later assigned separately | Exact matched source/assets; public authoring only, independent geometry, replay/native reopen. |

## Concrete acceptance

1. Public100×50 rectangle→20mm extrusion→centerØ10→four cornerØ4 at10mm offsets. Discover intended outer keys through cuts and dimension changes; explicit transient/deleted/ambiguous refusal.
2. Ordinary E11: fillet two vertical corners atR3 and chamfer the other two at1mm. For disjoint through-depth vertical treatments/holes expected volume is depth*(width*height−π*(5²+4*2²)−2*(1−π/4)*3²−2*(1²/2)). Check native validity/bounds plus independent sections/material points. Qualify a common horizontal edge separately before general edge claims.
3. Excessive size, meeting treatments, nearby hole, changed edge or unsupported backend: independently valid output or explicit last-valid refusal. Finite preview alone is insufficient.
4. After treatments, pattern authored center hole count3/source-local X spacing20. Instance zero is existing seed; verify openings, uncut intervals, volume of two additional disjoint current tools, seed/instance ancestry and signed spacing.
5. Resize100×50→150×30, change depth/seed diameter: center/corner/pattern relationships follow actual parameters. Check measurable results or explicit infeasibility preserving accepted intent.
6. Change display units to inches without physical change. Undo/redo edits through journal; save native, reopen fresh, rediscover meaningful keys and repeat metrics. Then qualify desktop/Agent tools/signed Save/Open separately.

This is bounded E11/integrated-plate work, not all22 Gate1 exercises, assemblies/drawings, general patterns, arbitrary fillets, STEP or engineering certification.

## Engine limits

OCC is preferred and has algorithms available, but no qualified modern Worker edge-treatment binding yet. Native Mesh/Manifold binds box/Boolean/enclosure, not this persistent analytic-edge fillet/chamfer or associative cut-feature contract. Broader library capability is not proof; explicit unsupported is honest until implemented/qualified. Mesh smoothing is not a CAD fillet, and display mesh→OCC conversion must not be silent. SMLib is a third experimental raw box/Boolean backend with no exposed/qualified treatment/pattern contract. Compare supported backends by independently measurable geometry/failures, not equal face counts or automatic fallback.
