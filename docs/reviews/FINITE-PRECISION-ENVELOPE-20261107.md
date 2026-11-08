# Finite precision inventory and proposed backend envelope — 2026-11-07

Source-only input to [the maintained precision contract](../CAD-PRECISION-CONTRACT.md), including its per-design and precision-preservation directives. **0.001 nm = 1 pm = 1e-9 mm = 1e-12 m** is the required fine-design/region geometric error target. It is not imposed uniformly on every large part or derived display. The desired mixed-scale example is **1 m overall with 0.007 nm detail**. Maximum extent/offset, feature/gap ranges, affected operation set and independently measurable error metric remain to be declared per design.

No threshold, product, runtime, driver or test changes; no tests/probes/build/browser/external research. Core files read at `fe43127c459df6f4a9cefc45d60edb1262858fc9`; subsequent root documentation directives reviewed at `f46c8fe46eefdb35fe9e4a1973b2152556cbb894` and `e93a9b4315db0af5a45389d05470827abf4fc5b6`. Native source inspected on R730 at `/mnt/data10tb/codi-occ-owned-shell-20261107`, HEAD `2f10f1e1ee04bd0a81ad828404511287f590fdec`. SDK forwarding header resolves to `/mnt/data10tb/codi-occ-four-corner-source-20261104/occt/src/Precision/Precision.hxx`. These source observations do not newly prove all historical registered builds share identical settings.

## Units and distinct claims

`1 mm = 1,000,000 nm = 1,000,000,000 pm`. Thus `1e-4 mm = 100 nm`; `1e-6 mm = 1 nm`; `1e-7 mm = 0.1 nm`; `1e-9 mm = 0.001 nm = 1 pm`. Angles retain radians/degrees; mm²/mm³ residuals cannot be relabeled as position error without a geometry-specific derivation.

| Contract | Establishes | Does not establish |
|---|---|---|
| Feature admission floor | Current implementation accepts/refuses this domain | Accuracy of every accepted result; inherent impossibility below the policy floor |
| Numerical stopping/residual | Particular scaled equations/optimizer meet their criterion | Coordinate/Hausdorff error, uniqueness, rank or correct topology |
| Construction/classification tolerance | A kernel algorithm's coincidence/approximation decision | Independent upper error bound on every result |
| Measurement/integration | A functional/classification estimate under its own policy | Ideal-source accuracy or a linear error derived from relative volume alone |
| Reconstruction stability | Actual returned source changes within a stated replay bound | Correctness of the repeated geometry |
| Representation/display | Values can be stored, projected or formatted | Accuracy of backend, exchange or manufacturing process |
| Independent error | Declared metric versus independent reference, including uncertainty | Untested operations/extents/offsets or physical manufacturing capability |

## Authored source and solver

Paths below are relative to ACAD; `sketcher/` abbreviates `web/app/sketcher/`.

| Source | Observed setting / meaning |
|---|---|
| `web/app/cad/parameters/physicalUnitConstants.mjs` | Canonical lengths mm; inch factor `25.4`; degree factor `Math.PI/180`, evaluated as binary64. Source expression spelling/IDs and the evaluated Number are separate contracts; decimal/irrational real exactness is not implied. |
| `sketcher/headless/solve.ts:17,42,163` | Recursive finite numeric bound `abs<=1e9`, including external parameters. This structural numeric cap also covers nondimensional fields; not an accuracy/physical extent certificate. |
| `headless/drivingDimensionTarget.mjs` | Signed X/Y allow zero/negative through ±`1e6 mm`; Euclidean distance allows zero; segment length/diameter strictly positive through `1e6 mm`. No universal tiny positive feature floor at this intent layer. |
| `web/app/cad/parameters/typedRectangleBindings.mjs` | Resolved named supported rectangle lengths `0.001..1e6 mm`: **1000 nm admission floor**, not 1000 nm measured error. Literal/other source routes differ. |
| `modules/engine/solid/authoredLengthBinding.mjs` | Positive finite resolved length through `1e6 mm`; named references preserved. Successful expression resolution does not prove geometry lies in a backend precision envelope. |
| `modules/geom/tolerance.ts` | `TOLERANCE=1e-3`, `EPSILON=1e-12`, `NUMERICAL_SOLVE_TOL=1e-8`, `TIGHT_TOLERANCE=1e-6`; normalized-parameter tolerance separate. Historical generic helpers require call-site dimensional analysis; not one global geometric epsilon. |
| `modules/math/equality.ts` | Default equality `1e-6`, squared variants separate. A declaration alone does not establish all consumer units. |
| `modules/math/optim/dogleg.js:49,122` | Fine raw residual OR gradient infinity threshold `1e-8`; 500-iteration cap. This can stop before a 1 pm coordinate stability target; stationarity alone is not satisfiability. |
| `sketcher/constr/solver.js:258,286` | Failed dogleg rolls back and invokes LM; fine LM `eps=1e-8`. No derived per-feature physical-error contract at this stopping boundary. |
| `headless/registeredConstraintPolicy.mjs` | Original actual length residuals `1e-6 mm` (**1 nm**), angle `1e-8 rad`; several circle/ellipse/domain lengths require `>1e-9 mm`. Original-equation checking is necessary, but these limits do not establish 1 pm coordinate accuracy. |
| `headless/solve.ts:65,128,141` | Boundary lines `>1e-9 mm`; separate dimensionless direction guard; restored line length check `1e-6 mm`. These are distinct domain/branch/consistency checks. |
| `headless/diagnosticGeometry.mjs`, `verifiedReplayGeometry.ts` | Actual candidate→independent fresh reconstruction displacement `<=1e-9 mm` (**1 pm**) with intent/branch/support checks. Repeatability, not accuracy. |
| `modules/engine/extrusion/simplePolygon.mjs` | Filtered binary64 orientations with exact dyadic fallback, no welding; area finally rounded to Number. Exact predicates concern captured binary64 inputs, not unrounded physical reals or later BRep accuracy. |

### Confirmed authoritative early-loss paths versus formatting

- **`sketcher/constr/ANConstraints.ts:1233–1242`, `AlgNumConstraint.initConstants()`:** numeric `schema.constants[name].initialValue(objects)` is converted by `toFixed(2)`, then written with `updateConstant(name,val+'')`. This is an authoritative default-constant write, not just label formatting. Shared initializers include signed X/Y, lengths, diameters and lock coordinates. Explicit caller-supplied constants can bypass it; do not falsely attribute this rounding to every current public command. Orientation's canonical 0/90/180/270 values happen to survive this decimal rounding. Whole affected human/agent workflows need coverage before repair.
- **`sketcher/constr/polynomial.ts:127–150`, `compact()`:** combines like monomials and removes coefficients satisfying fixed `eqEps(coefficient,0)`; nonzero removals set `usedApproximateReduction`. A small coefficient multiplied by a large/conditioned variable is not automatically a negligible output error. Recorded provenance is valuable but does not restore the discarded term.
- **`sketcher/constr/AlgNumSystem.ts:649,696`:** fixed `EPSILON=1e-12` can classify a nonzero constant as algebraically zero or replace a nonzero linear substitution offset with `b=0`; approximate provenance propagates. Underflow/nonfinite substitutions already have narrow guards. Globally lowering the epsilon is not a demonstrated complete fix; retain true nonzero terms or prove dimension-aware error bounds for any reduction.
- **Dogleg/LM stopping above:** coarse raw stopping can deliberately leave available accuracy unused. Conditioning, row dimensions, original equations and required output error must determine repair; not a blind retry/polish loop or global magic `1e-12`.
- **Not the same defect:** `polynomial.ts` `toString()`/trig render `toFixed(2)` is diagnostic text; no authoritative feedback was established in this finite review. `ANConstraints.ts` `Math.round((delta-angle)/(2*pi))` selects an integer periodic branch lift, not general coordinate quantization. Do not replace exact branch semantics while fixing rounding.
- No universal claim of absence: inspected modern planners retain Numbers and exact IDs and do not deliberately decimal-round their captured coordinates; other older geometry/import/UI paths were not exhaustively traced. Floating arithmetic itself rounds; retaining Float64 is not exact-real computation.

## Source profiles, frames and owned OCC

`mount/` abbreviates `modules/engine/mount/`; Native paths refer to the pinned source `shape-io/`.

| Path | Actual source contract and classification |
|---|---|
| `mount/selectedProfilePlan.mjs:12` | Local/frame coordinates `abs<=1e6 mm`, positive depth/radius `<=1e6 mm`; transformed world `abs<=4e6 mm`. Different admission envelopes, not guaranteed precision. |
| `mount/polygonProfilePlan.mjs:7`, `selectedProfilePlan.mjs:44` | Edge/radius/clearance `1e-4 mm` = **100 nm**; nonadjacent edges/hole gaps checked conservatively; area floor `1e-8 mm²`. Blocks current 0.x nm profile support. Exact endpoint closure/IDs remain independent; no welding. Area is not a uniform length error. |
| Same planners; `mount/ownedSweepPlan.mjs` | Frame squared-length/dot/cross checks `1e-12`, dimensionless. Physical frame error depends on extent and arithmetic. |
| `mount/ownedSweepPlan.mjs:12`; Native `ownedSweepV1.hpp` | Arc full-circle semantics use strict coordinate delta `<1e-6 mm` = **1 nm**. Uniformly shrinking an Arc can change this branch. This requires explicit source-policy treatment, not shortest-arc inference. |
| Native `selectedProfileV2.hpp:25,52–56` | Coordinates `abs<=4e6`; radius and polygon edges `>1e-4 mm`; area `>1e-8 mm²`. JS-only scaling cannot correctly bypass Native domain checks. |
| SDK `Precision.hxx:123,165,193,208` | `Angular=1e-12`; `Confusion=1e-7`, `Intersection=1e-9`, `Approximation=1e-6` **kernel length units**. In today's unscaled mm path: **0.1 nm / 1 pm / 1 nm**. Algorithm defaults, not universal geometric-error bounds; equal numeric value to the target is not qualification. |
| Native `ownedSweepV1.hpp`, `ownedRevolveV1.hpp` | Length/radius agreement/start attachment/axis coplanarity use `Confusion()`; parallel/normal frame comparisons separately `1e-12`. Operation-specific construction/domain decisions. |
| Native `ownedLoftV1.hpp:29` | Ruled capped `ThruSections(...,1e-6)` precision input = **1 nm** today; plane separation `>Confusion()`. Not measured error; authored seam/order/manifold semantics still separate. |
| Native `ownedShellV1.hpp:17,45`; `mount/ownedShellProtocol.mjs` | Inward thick-solid construction tolerance `1e-7 mm` = **0.1 nm**, explicitly not selection identity or volume waiver; thickness positive `<=1e6 mm`. |
| Native `ownedBooleanHistoryV1.hpp:113` | Detached operands, non-destructive/history enabled, parallel execution false; no wrapper `SetFuzzyValue` override. Uses actual kernel decisions; validity/complete ancestry alone is not metric accuracy. |
| Native `selectedProfileV2.hpp:98` | Point-classifier tolerance `1e-7 mm` = **0.1 nm**. Near-surface points cannot certify 1 pm boundary position; remote material/void probes have narrower scope. |
| Native `ownedMassPropertiesV1.hpp` | Adaptive volume relative epsilon `1e-10`; achieved integration estimate checked; closed/shared flags unchanged. Explicit **reporting**, not geometry tolerance or ideal-source error bound; no direct conversion to pm. |
| `mount/oci-verified-worker.js:258,442,484,682` | Volume consistency uses absolute mm³ floors (e.g. `1e-7`) plus relative/ULP terms; some bounds allow `1e-6 mm`; through-hole removal separately checks model measurement resolution | These mechanical consistency checks are not a 1 pm position certificate. Volume error needs a geometry-specific relation to positional error. |
| Native `ownedTopologyV1.hpp`, `selectedProfileV2.hpp` | 17-significant-digit JSON; Worker topology coordinates bound `4e6`. Decimal round-trip of binary64 is storage fidelity, not ideal-real or surface accuracy; local topology indices never saved IDs. |

## Other kernels, derived meshes and exchange

`export/` abbreviates `web/app/cad/export/`.

| Path | Evidence boundary and limit |
|---|---|
| `modules/engine/raw-smlib/rawWorker.js` | Native BRep/validity/material/void census; volume quality `native-relative-0.001`, undefined for nonmanifold; Float64 display triangles. Native construction/Boolean tolerances and 1 pm geometric error remain unestablished by this finite source audit. Predicate/validity is not metric accuracy. |
| `modules/engine/smlib/README.md`, `smlibWorker.js:160` | Older provider documents volume API tolerance `1e-3`; box guards use relative/absolute volume and `1e-6 mm` bounds. Do not merge different providers/pinned builds into one precision assertion. |
| `mount/manifold-verified-worker.js:70–82` | Current `getMesh()` requires Float32 properties, then expands them into Float64 transport. Native intermediate arithmetic/default tolerances not fully established here. Widening output cannot restore lost bits; NoError/components do not prove pm accuracy or strict geometric Join. This mesh-native model has no separate retained BRep to recover such precision from. |
| `mount/enclosurePlan.mjs:17` | Supported Manifold enclosure minimum feature derives from `8*max(1e-6 mm,scale*2^-21)`. Construction-domain restriction, not universal error for every Manifold operation. |
| Native `selectedProfileV2.hpp:102`; `mount/displayProjection.mjs` | Display tessellation linear `0.05 mm` = **50 µm = 50,000 nm**, angular `0.4 rad`; Float64 triangles converted to Float32 preview. Overflow/collapse refuses preview. Legitimate declared **display** approximation only if never fed back as authoritative BRep geometry; survival is not error qualification. |
| Native `ownedManufacturingMeshV1.hpp:27,68,79`; `mount/ownedManufacturingMeshProtocol.mjs` | Detached-copy mesh fixed `0.01 mm` = **10 µm = 10,000 nm**, angular `0.1 rad`; Float64/Uint32, actual topology parameters anchor shared boundaries; measured boundary discrepancy bounded by linear control. No proximity weld. This is not a 1 pm general surface approximation/certified Hausdorff bound. Caps 100k triangles/150k vertices/8 MiB remain. |
| `mount/enclosureManufacturingMesh.mjs:91` | Separate planar path deviation `1e-6 mm` or scale-aware Manifold floor through `0.01 mm`, constrained by feature size. Scoped planar coverage, not generic curved/nanoscale accuracy. |
| `export/exactDyadicMeshPredicates.mjs`, `embeddedShellValidator.mjs` | Exact captured-Float64 embedding/contact/containment, magnitude `<=1e9`, bounded bits/work/deadline. Does not prove approximation to Native/source membership. Budget exhaustion is not invalid geometry. |
| `export/core3mf.mjs` | mm vertices emitted as Number decimal strings; transform determinant cutoff `1e-12`; indexed topology/embedding and source mapping separate. Preserves captured mesh values, not BRep curvature. Determinant cutoff dimensionless; external consumer precision and process accuracy unqualified. |
| Native `ownedStepExportV1.hpp:65`; `mount/ownedStepExportProtocol.mjs` | AP214IS/MM/assembly Off; exact detached-input preservation, bounded 8 MiB; configure() sets no new writer precision budget. Analytic exchange avoids forced mesh approximation but writer tolerances/defaults, receiver healing and independent surface error still need qualification. |
| `sketcher/headless/dxfExport.ts`, `sketcher/dxf.ts` | Real solved source, explicit mm; `$DIMDEC=2` concerns displayed decimals. Library numeric emission/reader error not qualified at 1 pm by unit metadata. |
| `export/linkedPartDrawingSvg.mjs` | Analytic observations separate; paper paths chord-approximated, dimension text `toFixed(3)`. Legitimate presentation, not Native truth or fine dimensional evidence. |
| `web/app/cad/projectManager/displayUnits.mjs`, `sketcher/shapes/dim.js` | Canonical values unchanged; default 2 fractional places, permitted 0..12; inches/degrees presentation only. A subnm dimension can display `0.00 mm`. Formatting limits visibility, not geometric existence; more digits alone prove nothing about backend error. |

A derived approximation must be labeled and never feed back into source/authoritative algorithms without a distinct explicit approximation operation and budget. Mesh-native Manifold construction is itself authoritative for that backend, unlike OCC's discardable display mesh; it requires its own achievable precision contract, not an assumption that all previews are interchangeable Native solids.

## Representability and mixed-scale scope

Normal binary64 spacing is `2^(floor(log2(abs(x)))-52)`. These are mathematical grid-spacing examples, not measured operation errors:

| Coordinate mm | Binary64 spacing mm | Spacing pm |
|---|---|---|
| 1 | `2^-52` ≈ `2.220446049250313e-16` | `2.220446049250313e-7` |
| 1000 (1 m) | `2^-43` = `1.1368683772161603e-13` | `0.00011368683772161603` |
| 1e6 | `2^-33` = `1.1641532182693481e-10` | `0.11641532182693481` |
| 4e6 | `2^-31` = `4.656612873077393e-10` | `0.4656612873077393` |
| 1e8 | `2^-26` = `1.4901161193847656e-8` | `14.901161193847656` |
| 1e9 | `2^-23` = `1.1920928955078125e-7` | `119.20928955078125` |

At **1 m**, spacing is `1.1368683772161603e-7 nm`, much smaller than **0.007 nm**, about 61,573 grid steps. Representation alone does **not** preclude the user's example or the fine region's 1 pm target. Cancellation, conditioning, source initialization, term dropping, stopping and kernel policies still can lose available accuracy.

At huge offsets with spacing above 1 pm, arbitrary global Number coordinates separated by 1 pm cannot all be represented. That is a limit of this representation/envelope, not all exact/local/higher-precision approaches; special exact coordinates remain possible. Arithmetic may lose accuracy even where spacing is small. A global translation after input rounding cannot recover missing source information. Float32 at 100 mm has `2^-17 mm = 7.62939453125 nm` spacing; not every particular integer vertex incurs that error, and local rendering can improve detail visibility.

Higher precision is an engineering option only when used by relevant source evaluation, predicates/construction and exchange. Immediately rounding a high-precision result into a double-only operation without accounting for loss is not a high-precision backend. Inherent floating arithmetic rounding must be acknowledged; no promise of exact real arithmetic until the end.

## Smallest coherent normalized backend contract

Proposal only: first one explicit new OCC cohort and a declared interacting construction domain; retain old saved build/default semantics. No second design: authored physical mm quantities/formulas, IDs, source frames, seams, materials and ordered history remain authoritative. Fine budget is scoped per design/part/feature; coarse regions need not receive the same target, but their interfaces with fine regions require an explicit compatible error contract.

1. **Capture budget and envelope.** Require desired physical metrics/error, feature/gap range, extent/offset envelope and exact backend/build with the same revision. Missing envelope/reference means unqualified, not automatic success or geometry-invalid. Requested budget is not evidence achieved.
2. **Derived context.** Worker deterministically derives frame `o,R`, power-of-two scale `ell` physical mm per kernel unit, and scope from captured real source/operand identities: `q=Rᵀ(x-o)/ell`; inverse `x=o+R(ell*q)`. This is attributable evaluation data, not editable state/nearest-coordinate naming. Power-of-two scaling avoids one avoidable binary scale rounding; translation/rotation still require error accounting. One global scale cannot condition arbitrary mixed-scale geometry.
3. **Explicit new private wire.** Do not silently send scaled values under existing mm contracts. Context binds full request/source digests/build/current owner. Lengths/thickness/gaps/depth/path positions scale by `1/ell`, area/volume by `1/ell²` and `1/ell³`; directions/angles retain their dimensionless semantics. Transform tolerances and inverse results consistently. Preserve full available precision throughout; no convenience rounding/quantization or unbounded coefficient deletion.
4. **Solver adaptation.** Normalize each connected equation system with row dimensional semantics and consistent Jacobian/gradient/reduction math. Preserve generic equations, ordered targets, branch classes and named quantities. Original physical equations and output-error checks remain independent; rank stays unknown without proof. Do not solve precision by global epsilon lowering, raw residual equality to a distance, loops/polishing or restored old positions.
5. **Kernel feasibility.** Map physical budgets to kernel units and qualify actual algorithm minima/defaults, input representability and topology decisions. Scaling does not rewrite compiled confusion constants, improve an ill-conditioned intersection automatically or repair lost input. If no context meets feature and extent/interface requirements, report a supported-domain/refusal limit with reasons. Higher precision/exact predicates may be needed in specific computations rather than a token high-precision wrapper.
6. **Multiple contexts/interfaces.** Boolean/contact operands must use a shared qualified context or explicit exact-source reconstruction/remap with real ancestry and preserved inputs. A coarse parent/fine feature interface needs bidirectional placement/error bounds, not accidental AABB/proximity matches. Native owner/handle/provenance/observations bind context privately. Preserve candidate-only cancellation/lifetime and semantic IDs; no saved Native ordinals.
7. **Error accounting.** Attribute source evaluation, conversion, construction/intersection, inverse conversion, measurement and representation budgets relevant to the scoped result. Their justified composed error must fit the required budget; no arbitrary fixed split prescribed before conditioning/domain is known. A JSON claimed bound, repeated values, volume agreement or point probes alone is not a general surface certificate.
8. **Output and persistence.** Keep canonical authored source/quantities exact under schema; retain explicit policy/build on replay. Derived context can rebuild deterministically. Render locally without overwriting source. Manufacturing mesh/STEP/DXF/3MF require their own physical approximation/round-trip budgets and limits; never export normalized coordinates mislabeled mm, silently coarsen to today's 10 µm mesh, or use more label digits as accuracy proof. If Number source cannot preserve requested data, propose one explicit exact-decimal/rational/local-placement source evolution in the same model; no migration authorized here.

### Candidate files for a future serial implementation packet

- NEW `modules/engine/solid/precisionEnvelope.mjs` and Worker `mount/normalizedCoordinatePlan.mjs`: exact scoped metadata/context/error outcomes; heavy math only Worker-side.
- Actual semantic/source planners (`selectedSketchProfile`, polygon/sweep/loft), `SolidKernel.ts`, controller/OCI Worker, private ledger and build catalog: captured source/policy/context binding and explicit optional cohort; known build is not installed capability.
- `ANConstraints.ts` default initialization, `polynomial.ts` compact/reductions, `AlgNumSystem.ts`, solver/dogleg and original residual policy: coherent dimension/conditioning-aware preservation; no hidden widening or blind global thresholds.
- Native profile/Boolean/shell/sweep/loft/edge/point/metrology/mesh boundaries: new explicit context-aware cohort; retain existing runtimes and exact ancestry/copy preservation. Other kernels require separate actual contracts, not inherited claims.
- Display projection/formatters and STEP/manufacturing/3MF/DXF/drawing handoffs: separate bounded presentation/exchange contracts, independently measured. Existing exact dyadic embedding remains necessary but not sufficient for source approximation.

This is a candidate ownership map, not authorization to edit everything concurrently. A useful first coherent slice is source-bound normalized profile + interacting Boolean/read/exchange under one new explicit cohort, then shared application workflow. It must not substitute a tiny isolated sketch for the user's fine detail on larger geometry or claim all feature operations follow automatically.

## Complete-workflow qualification requirements

No per-step tests requested or run. Freeze independent truth, metrics and uncertainty before a full implementation's complete application qualification.

- Relevant 0.1/0.5/1 nm feature/gap/thickness fixtures and 1 pm perturbations; 1 m assembly extent with actual 0.007 nm local detail; local/translated/rotated/negative coordinates; adjacent coarse/fine regions and agreed maximum offsets. Preserve exact references; explicitly refuse unrepresentable inputs rather than fabricate distinct rounded numbers.
- Public constrained source/typed formulas and genuine profile/Boolean/holes/fillet/shell/loft/sweep where claimed. Independent exact or high-precision interval references for dimensions, entire curves/surfaces, topology/contact and material interfaces; not two matching kernels or sample points alone.
- Source and parameter edits, mixed Undo/Redo, normal native Save/fresh Open/reedit, exact IDs/build/context, refusal preserving last accepted source/resources. 1 pm repeatability of wrong geometry still fails accuracy.
- Separate measured display visibility/rounding, Native-to-manufacturing mesh approximation, independent STEP reader geometry, 3MF source/part/material identities and actual mesh error. Resource limits remain; no silent downgrade. Physical process/material uncertainty is separate.
- For each operation/build/representation record envelope, independent method/reference/uncertainty, maximum achieved error in correct units and outcome: **qualified within envelope / measured target failure / unsupported feature scale / unqualified due missing reference or coverage**. State why and whether a software change can address it; do not claim inherent impossibility from a policy or one failed algorithm.

## Current truthful outcome

Current profile floors establish **unsupported 0.x nm profile input**, not failure of 1 pm coordinate accuracy for all larger admitted geometry. The raw orientation R3 delta `2.3599383780492644e-8 mm = 0.023599383780492644 nm = 23.599383780492644 pm` is a **measured reconstruction target failure** versus 1 pm; phase repair needs whole workflow evidence. No wider inherent impossibility follows.

Existing mechanical BRep/solver/validity proofs do not establish fine-design 1 pm geometric accuracy; absent independent references/envelope coverage, that claim is **unqualified**, not proven impossible. Construction tolerances identify actual policy/algorithm boundaries, but they are not measured error floors for every accepted result. Mesh approximations are explicitly much coarser by current controls and cannot claim the same precision. Source-confirmed early rounding/term removal/stopping require coherent repairs with actual full workflows, not an automatic threshold sweep.

Still required per design/region: maximum physical extent and absolute placement; minimum feature/gap and scale ratio; required operations/backends; interface/contact discrimination; metric and independent uncertainty. The user's 1 m/0.007 nm example is a desired concrete corpus case, not current support evidence or a universal extent ceiling. Keep the fixed fine target while declaring coarser budgets where allowed, and explain each achieved/unachieved claim with evidence.
