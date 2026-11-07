# Agent CAD issues and fixes

Running qualification log. Observations are not automatically upstream bugs.
Retain the failing receipt, contract, smallest reproducer, fix/workaround and
verification. Agent qualification remains the priority; clean external PRs
come after stable isolated fixes. No issue/PR has been published by this work.

| ID | Finding / responsible layer | What we did | Current qualification / PR disposition |
| --- | --- | --- | --- |
| CAD-001 | SMLib edge union returns a generic error in the third-party/application wrapper. | Replaced the experimental provider with a direct whole-BRep NVIDIA binding; added real empty/compound results to OCC/Manifold. | Resolved in tested common graph/history/replay and signed Files workflows (0bd/1fddd). Original4a3 failure remains historical. No NVIDIA edge-union bug established. |
| CAD-002 | A manifold predicate was being interpreted as a connected-body count. | Separated native status, validity level, incidence, census and component interpretation. Point/disjoint results can pass the predicate while containing2 material regions. | Integration/API interpretation; no proven upstream defect. Coordinate-welded preview incidence is not native topology. |
| CAD-003 | Cavity extraction changes material/void classification and native volume in NVIDIA. | Preserved minimal source repro, native census/volume, oriented shell volumes and level-2 validity. A documented nested-solid classifier restores this particular case. | Possible upstream contract/documentation/implementation issue, still under investigation. Original cavity retained; unqualified void decomposition refused. No blanket kernel fix. |
| CAD-004 | JSketcher numerical-algebraic elimination credits a later row, missing implied redundancy. | Isolated generic restart preserving earlier-row priority; no schema-specific hack or rank/global-DOF inference. | Candidate source tests preserve89 geometry arrays and88 admission/error outcomes;1 intended label flip makes old metadata strict-refuse INTENT_CHANGED. Integrated5b7135e85/8984d8ff1; actual new authoring, Worker Save and fresh replay pass; combined2ad direct and signed regressions pass. Existing1e-12 numerical epsilon remains; no exact rank/DOF claim. |
| CAD-005 | Our SMLib mount could accept a microtask-aborted request between readiness and dispatch. | Fence state/signal before reservation/dispatch, after listener installation, on reply and before publication; capture inputs before awaits. | Fixed in047e41961;11 actual Worker lifecycle controls and historical failure receipts retained. Integration fix, not NVIDIA. |
| CAD-006 | Our measurement API labeled OCC tessellation-integrated volume as native BRep volume. | Separate signed reportedVolume/volumeMagnitude; label tessellation/mesh/kernel origins and runtime provenance. Do not save derived measurements as author intent. | Corrected28a5fc6c8, integrated807077186; matched three-engine browser edit500→700, undo/redo and fresh replay pass (`test/smlib-integration/METRICS-HISTORY-807.md`). SMLib computation tolerance is not an error guarantee. |
| CAD-007 | Agent material review/3MF export required UI prompts. | Public revision-bound proposal/confirmation and fresh-path export invoke existing core methods and authorized My files writes. | Signed bounded OCC enclosure workflow passes in desktop618/receipt315bbb9ab, including independent2-object/3-region3MF checks. Arbitrary/SMLib export and deployment remain open. Host integration, not a kernel PR. |
| CAD-008 | Float32 rendering can collapse valid native geometry; generic display validation was bounded by512-triangle main-thread conversion. | Workers validate/prepare Float32 buffers, statically embedded in production Worker assets; common models transfer private custody. Precision loss preserves native geometry. | Source14 controls and matched0bd/1fddd registered/signed workflows pass; distant thin-box counterexample passes. General large-mesh memory/performance remains unqualified. |
| CAD-009 | NVIDIA defines native volume as undefined for nonmanifold objects. | Skip the native volume call there and return null with explicit quality, while retaining the whole native result and region census. | Raw source e854d6c/providerab8f97135 tests pass; independent mesh integral is a bounded box-test oracle, not a fabricated native measurement or general manufacturing qualification. |

## Additional native and integration findings

- **CAD-010 — NVIDIA Boolean cavity-fill:** D=(outer−inner)∪far; D∪inner reports native volume1000 and one material/one void, while two closed mesh components enclose2000. Reversed operands report2000 correctly. H∪inner also misclassifies. Direct C++ fork `185ce1e1ab8bbf7b9f034939f4df268e9ef879ed` reproduces below our binding; copies preserve input state. Scoped native fix6c99 corrects the tested union-region survivor behavior; final app3bd and signed Save/fresh Files tests pass. The48-case exact-cell comparison has6 corrected,34 both-pass,2 retained validity failures and6 boundary-only unqualified cases. Guard remains in3bd; a separate whole-container/no-preview admission change is under implementation. No blanket nested-solid reclassification is accepted. See `docs/research/RAW-MULTIVOID-EXPERIMENT-20261105.md` and the NVIDIA fork's MULTIVOID.md/ISSUES.md. No external report.
- **CAD-011 — verifying OCC emptiness:** no-solids/no-faces alone cannot exclude edges or vertices. Separate bounded native topology census `42b626445` and app1fddd now require a non-null empty compound, zero children and zero lower-dimensional entities. Isolated native controls plus actual app/signed history pass. Tested contact intersections are true empty compounds; no false-empty was demonstrated in those cases.
- **CAD-012 — failed-operation IDs:** a native refusal consumes one feature ID under the existing never-reuse allocator contract. Strict serialized byte equality therefore fails; the policy-aware browser test proves every other native field/output unchanged, the document remains savable, the failed ID is skipped and a subsequent explicitly requested reverse operation succeeds. See `test/solid-output-history/NATIVE-FAILURE-1FDDD.md`. This does not qualify the failed forward geometry.

- **CAD-013 — separate native tessellation orientation:** a hollow box with an internal material island has independently verified native volume792, while raw triangle winding integrates to776. The bounded diagnostic identifies reversed island triangles; it is not a safe general orientation fix. Native region correctness, mesh winding and manufacturing validity are different gates. See `docs/research/NATIVE-PROVIDER-CURRENT-EVIDENCE-20261105.md`.
- **CAD-014 — wrapper admission limit removed experimentally:** sourcea9daf carries whole multi-material results containing voids with an explicit unavailable preview (`material-orientation-unqualified`). Actual app D1784, both fill orders2000, island792→992 edit, stable identity, undo/redo and native replay pass; signed host Files also passes. No decomposition/fake region identity or manufacturing claim; native-invalid partial fills still refuse. See `test/solid-output-history/RESULT-A9DAF.md`. A legacy known-census/missing-kind preview bypass found in independent review is fenced in both ledger/model.
- **CAD-015 — test transport dropped custom failure codes:** Puppeteer/CDP reconstructs a thrown Error and drops custom fields. The actual public in-browser command retains ENGINE_FAILURE (partial fill) and the historical MULTI_MATERIAL_VOID_UNSUPPORTED guard code. The corrected signed harness catches in-page and returns a data record; desktop99520894b qualifies this path. No product defect or error propagation patch was justified. A separate external agent transport would need its own safe serialization test.

## NVIDIA reproductions and scope

Full source mirrors: `example.invalid:/srv/data/git/usd-brep.git` and
`r730:/mnt/data10tb/git/usd-brep.git`. Official main remains
`3fd5b9548d19aa8c12c29bc9637a96d42a06f8a5`.

- `research/wasm-solid-contact-20261105`: independent direct C++/WASM probe, corrected commit7bf7e1aa4b44ef30f329c2c10a6f4fbe7467aa90; root independently repeats all8 cases with pinned WASMe4a3c4c6e6ff0b0cc6c6891fae54976bcab97ab7180884b3392d1ecda3ece394.
- `research/browser-smlib-binding-20261105`: general research binding0b7c8f65be9024d2ba3a50dea3363e26369a6edf; cavity reproeedb34613b47ddf13e8f543a79db1031a7b829fb; issue/classification loge6b2fb40a14d8428eb69623d1865f02eb432c1e4. Read `research/wasm-solid-contact-20261105/CAVITY.md`, `BINDING.md` and `ISSUES.md` there.
- CAD-003 example:10³ minus internal6³ correctly reports784mm³ and1 material/1 void. Extracted BRep reports1000mm³ and2 material/0 void while its oriented mesh remains784mm³. Native validity level2 passes both. `SetRegionIsVoidFlagsForNestedSolids()` restores784 and the census, with unchanged tessellation. NVIDIA restricts that operation to nested-solid interpretations, so it is not an unconditional fix for arbitrary regions.
- Current raw cases cover ordinary overlap, face/edge/point/disjoint contact, ordered difference750/250, empty BReps, through-cut and bounded operand comparisons. Measurement/signature preservation is not byte identity or proof of every geometric attribute. No STEP or general manufacturing qualification follows.

## CAD-016 — prepared replay shared mutable feature records

Our craft coordinator copied the history array but retained accepted operation records. In the actual9b88 Chromium app, temporarily changing a downstream hole from10 to12 during an earlier real Worker request, then restoring10 before final checks, accepted a12mm hole while the saved feature remained10. Native reopen regenerated10. This is an application history/input-ownership fault, not a demonstrated OCC, NVIDIA or Files defect.

Fix `cb4a0dce8` makes prepared replay capture detached, bounded native history, bind its canonical signature to the accepted full tip, and repeat source/state/epoch/pending guards before evaluation. The signed rectangle relation/120x60 resize/refusal/shared undo/redo/Save/fresh Files/account/held-close workflow passes again. Independent exact fault comparisons are recorded under `test/closed-sketch-publication-review`. The same issue was independently reproduced in generic new-feature prefixes (cb4) and timeline replay (053). Runtime5f8 now evaluates and publishes the same deeply frozen, privately branded history, captures the timeline position before awaits, uses wider native-compatible cooperative capture and explicitly releases failed snapshot bookkeeping. Actual prepared/new-feature/timeline strict-write controls plus empty/rewound/native-reopen carry pass. Registered signed bracket/enclosure/3MF workflows pass too. Input provenance for raw internal callers and cooperative comparison/large-container costs remain explicit limits; this is not a universal currentness or performance proof. Object-key canonical ordering is not a change in feature meaning; exact sketch snapshots and refusal-state controls remain strict.

## CAD-017 — inspection deadline mislabeled as cancellation

The first closed-inspection transport included its deadline inside the boolean lifetime guard passed to the shared Worker client. A slow guard could therefore report AbortError with no aborted signal. `b6d176030` keeps lifetime and deadline checks separate. Actual inspection plus separately labeled protocol controls cover this local transport fix. It is not an upstream solver defect.

## Evidence in our repositories

- Core corpus: `test/agent-cad-corpus/index.json` and `report.mjs`; historical4a3 pass/fail states remain pinned rather than being rewritten after newer experiments.
- Cancellation/timing: `docs/three-engine-review/lifecycle-and-timing.md` and `test/three-engine-acceptance/receipts`.
- Current metrics: `modules/engine/solid/solidMetrics.mjs` and `test/smlib-integration/metrics-history-browser.test.cjs`.
- Desktop repo: `test/agent-cad-corpus/manufacturing/README.md`, `test/agent-cad-corpus/parametric/README.md` and their signed command tests. These distinguish public command evidence from private-core/Worker tests.

For every next finding add owner, expected/observed behavior, exact source and
runtime pins, a minimal runnable reproduction, patch/workaround, before/after
results and unresolved limits. Keep kernel, adapter, solver, history, renderer
and file faults separate. An upstream PR must contain a suitable standalone
test and no WebOS-only coupling or unrelated changes.

## CAD-018 — empty creation advertised outside appendable ancestry

Actual integrated1b2 box→empty-plane creation succeeds, but the new source is absent from append discovery because the existing strict history classifier rejects WORKER_SOLID_BOX ancestry. This is an application readiness issue, not a kernel failure. Candidate997 reuses that classifier before creation/preparation and reserves history/sketch capacity; it does not widen unknown consumer support. See `test/public-primitive/README.md` for final-runtime qualification scope.

## CAD-019 — repeated contour and candidate-index work

Dense public closed-sketch profiling found repeated class-predicate scans and collision-heavy coordinate lookups on the main thread. Exact numeric indexing preserves14 tested reader/model facts and reduces the observed dense contour step76ms to3–5ms. Independent PLANE replay batches its private index, with strict flush on lookup/finalization and implementation binding. Actual2k planes use one flush; scene/viewport work still stalls, so this is not an overall responsiveness fix. See test/replay-contour/README.md.

## CAD-020 — cancelled temporary native import publishes later

Actual99110k restore returned AbortError then published10k models/history about9s later. Rollback/quarantine did not revoke the pipeline. Final427 synchronously rolls back eligible receipts then closes only the exact captured temporary owner, binds the caller signal, and snapshots control options. Actual final10k cancellation has0 models/history12s later and0 tracked Worker/engine resources. Host-invalid bytes are confined to a disposed private workspace which its host must discard; no per-key rollback claim for invalid receipts. This is our application lifetime bug, not OCC/NVIDIA/Files. See test/review-restore-cancellation and test/arc24-history-admission.

## CAD-021 — intrinsic evidence hook aliases validated constants (unwired prototype)

Independent review of projection3de found a trusted callback could mutate its borrowed constants row after residual checking, yielding geometry100/saved target200. Corrected candidate d75f16676 copies/freezes intrinsic rows before calling the hook; actual after-control keeps100/100/input unchanged, with benign compatibility/owner controls passing. This hook is not present in installed Worker3211/runtime427. Integrate the corrected component only; no upstream kernel issue or active runtime failure is claimed.


## NVIDIA union fix publication — 2026-11-05

User-authorized fork branch is now public:
https://github.com/CC-David-CC/usd-brep/tree/fix/union-material-survivor

- Kernel-only commit03b5adf9dca5041b14177bf802dde38e2968eca0 carries the scoped6c99 behavior plus restored API comments, rebased onto unchanged upstream3fd5b954.
- Regression/docs commit761974f979ff61d6df2492146967fd3bf3687edc adds a portable SM_API regression and its normal-suite registration. Both commits are verified on GitHub, example.invalid and R730; the fork main stays3fd5b954.
- The exact focused C++ test compiled to WASM passes fixed and fails the unmodified baseline at its first exact-fill material-census check. Later baseline cases are not claimed to have run. Native g++ syntax passes; native CPU execution/full upstream suite were not run. Earlier48-case source-equivalent kernel evidence keeps its recorded scope.
- NVIDIA currently restricts external PRs and welcomes bug reports. The user requested a bug report linked to this branch; the prepared title/body/prefilled issue URL are in NVIDIA-UNION-BUG-REPORT-20261105.txt under docs/research. No upstream issue or PR has been submitted by this session; record the eventual issue URL after the user submits it.
- The GitHub authentication key is held privately on example.invalid; no private key/account state belongs in the repositories.


## CAD-022 — NVIDIA transformed sparse-vertex BRep tolerances

Actual C++→WASM torus reproduction changes all vertex/edge/face tolerances1e-5→0 for4×4 translation, rotation and uniform scale2, returning success. Identity and tolerance-scaling-disabled/placement-overload controls preserve tolerances. The vertex-only bounding box is zero for the torus's single vertex. LAN-only issue branch `research/issue-transform-tolerances-20261105` carries de94404 +2eda4fa: scale existing local tolerances by the maximum absolute axis factor and keep model-size changes local. Independent review caught an indirect shared-context setter in the first candidate; the correction bypasses that propagating setter. Matching stronger context-size and local-tolerance controls are recorded in test/nvidia-transform-mirror. No production provider/default/GitHub update.

## CAD-023 — NVIDIA mirrored analytic curve types

Actual native box/cylinder mirror replaces12 lines, or1 line+2 circles, with plain B-splines. This is type loss, not a demonstrated wrong-shape claim by itself. Own LAN issue branch `research/issue-mirror-analytics-20261105` carries e72d56b +e1b5da6: virtual copies preserve Line/Ellipse/Circle types, reflecting both NURBS and analytic definitions while retaining parameter domains/inside-out semantics. Ordinary edit notifications follow final analytic placement. Independent review found no additional concrete ownership/type blocker; cache corruption was a concern, not an established baseline defect. Actual oblique translated/partial/inside-out/native validity-volume tests qualify only their stated cases. OCCT7.6.0 standalone WASM passes matching tolerance/type controls. Full native suite and all curve subclasses are not qualified.

## CAD-024 — NVIDIA sampled coincidence endpoint tuples

User-reported SmSurface::SimpleCoincidenceChecker can combine parameter, UV and distance from different samples. Isolated LAN branch `research/issue-surface-coincidence-20261105` at aaad6dd has an independently reproduced baseline4fail/6pass and corrected10/10 exact-flat-support controls, preserving sampled parameter ranges. It assigns each extrema tuple before the unchanged early break. Requested Unicode configuration remains unqualified due missing<tchar.h>; a non-Unicode changed-TU NL_DEBUG/callbacks variant is explicitly not a full debug-kernel build. Native classifier caller behavior and continuous coincidence are separate gates. Root has not integrated this native branch into an application kernel.

## CAD-025 — UV curvature metric and its prerequisite

Linked abastran/smlib b4f8c57 addresses physical surface-metric validation of a UV trim, not sphere seam meshing. Our base's radius test is inert because it compares a never-updated initial radius. The independent native lane reproduces that enabling the radius read alone falsely rejects an exact radius4 trim on a200×3 parameterized plane, while detecting genuine small-radius controls. Own LAN issue branch `research/issue-uv-curvature-metric-20261105` now has scoped evidence at2bf4660f2c1073d8ce627cf70549c8db6f95ef9f, verified on example.invalid and R730. Three logical commits separate radius-read9764dbe, UV-metric6c4e1e9 and parameter-span-invariant radius threshold8777614. The metric patch alone falsely rejects an unchanged4mm circle with tiny parameter span and misses a sharp cubic with large span; the third correction retains physical length units. Its36 actual C++→WASM matrix runs match explicit stage-specific expectations, retaining negative cusp/small-radius controls and ordinary/skew affine trim positives. Source/probe native syntax and the existing union regression pass. Root reviewed the product diff and documented scope; no combined application/provider rollout or full-native-suite qualification. Non-affine frozen-metric curvature and omitted solver dependencies remain partial. Do not deploy only an incomplete prerequisite or claim full fork equivalence. Portable corpus and upstream attribution are in that branch research/uv-curvature-metric/README.md.

## CAD-026 — reported sphere pole/seam tessellation window

Own branch `research/issue-sphere-tessellation-seam-20261105` at4d7843f94e11d40d9ad57bcc4a629a20a69cd176 is verified on both LAN repositories, with a portable native diagnostic and16 actual C++→WASM observations. The bad chord-height/radius band produces a real geometric approximation error despite valid/manifold/outward topology and accurate vertices: at R=1/chord=.0002 an actual triangle edge midpoint lies .015691258 inside the analytic sphere. Root independently recomputed this value from the recorded triangle coordinates. Ratio.00032 reaches .166742R. This is not merely a pole aspect-ratio/shading issue or b4f8c57's UV-metric fix. Own LAN branch2e8b2a3ab60be1aa6ca08d7da8489fba58d4aff3 now carries a scoped native boundary-partition mitigation before ear clipping. Eighteen sphere cases pass an explicit <=2x requested chord-ratio defect gate (baseline14 fail), with exact original triangle/vertex counts and no winding/degeneracy/incidence errors. Twelve bounded helper controls and five actual native primitive/trimmed controls also pass. Root reviewed bounded coordinate-sorted candidate search, existing-cache admission, strict smaller-child partition and conservative fallback. Neighboring preexisting1.3–1.5x chord excess remains; this is not a strict general chord guarantee. Failed late-refinement variants were reverted. No application/default/GitHub rollout; broader tessellation qualification stays open. See that native branch tests/sphere-seam/README.md for exact matrix/source/build scope; full suite/Chrome/other surfaces remain open.


## Native issue branch policy — 2026-11-05

The user requested each issue on its own branch and explicitly deferred new GitHub publication. Keep transform tolerances, mirror analytics, sampled coincidence, UV curvature validation and sphere seam tessellation separate under research/issue-* in usd-brep.git. Each branch retains its own reproducer, logical changes and qualification limits; related prerequisite commits may remain separate within a single issue lane. Back up to example.invalid and R730 only. Do not fold these native experiments into the WebOS default kernel or report them as CAD1 completion. The earlier public union fix is separately recorded above.


## CAD-027 — reader welds unrelated authored coordinates

A new public-command/production-Worker corpus independently finds three baseline projection failures in app91c921bb: a1e-6 open gap becomes a closed rectangle region; an ordinary nearby Point or construction endpoint moves a circle center by.0005. Native saved coordinates remain unchanged. ReadSketchPoint used the unrelated generic1e-3 fuzzy VectorFactory; its obsolete coincidence locals do not justify these joins. Fix5fb0f7032 preserves each authored Vector without changing global tolerances or solver math. App655c7d15 passes15 independent supported/unsupported profile rows, exact native-versus-derived Segment/Circle coordinates, a solved/edited PCoincident rectangle and native reopen. The same app passes the five-hole rectangle edit/refusal/cancellation/travel/native-save regression. See test/public-region-corpus for original FAIL and corrected PASS receipts. General profile arrangements, all curve families, signed-host qualification of this exact build and full CAD1 remain open.


## CAD-028 — selected-region discovery exceeds rectangle Worker support

Actual public counterexample at app655c7d15 advertises both disjoint rectangle regions, but selecting one refuses UNSUPPORTED_PROFILE in semantic preflight, before native OCC allocation. Circle/nested descriptors exist but are not advertised. Native source/history/model/registry contents and object identities remain preserved; only the intentional never-reused feature-ID allocator advances. See test/public-region-worker-contract (root02447b82f) for actual positive/negative controls, corrected resource-owner assumption and proposed common selected-profile kernel boundary. New component implementation is in progress; do not call this a kernel Boolean defect or an accepted general extrusion path.

## CAD-029 — Viewer component disposal retains its animation/input owner

Actual standalone Viewer instances in a retained app655c7d15 realm keep evaluating controls/scheduling frames after Viewer.dispose; a captured late animation callback can render again, controls are not disposed and the owned canvas stays attached. A sibling Viewer remains alive. This is scoped component teardown, not proof of a leak when the desktop destroys an entire iframe. Separate branch research/scene-viewer-disposal-20261106 carries candidatea36a6b259: terminal guard before cancellation/cleanup, owned RAF/control/renderer/canvas release, late-work guards and first-error preservation while attempting all owned cleanup. Actual appce8ce517 passes nine retained-realm lifecycle controls, including same-container sibling ownership, late callback inactivity, idempotence and first-error cleanup coordination. Thirteen plane/corner/fallback/selection controls and full TypeScript also pass; independent source review finds no concrete scoped regression. Integrated as2c618b431/affc4e64d with tests in test/scene-viewer-disposal. Views still own their geometry/materials; no authored model/document mutation or public deployment is claimed.


## CAD-030 — inherited polynomial substitution changes powers incorrectly

Independent review58004ce2637bd8e64903a9ec86af03bc5560acaf finds Monomial/Polynomial coefficient-only substitution turns x=2y applied to x² into2y² instead of4y². A direct actual-source reproduction has near-zero derived residual but original residual40. This predates domain normalization7757; its cancellation divides the already incorrect row correctly. Original-residual validation remains mandatory. Scoped source75a2b053c (integratedae86f80c3) now uses transactional function-aware powers/composition, conservative unsupported fallback and retained origins/approximation provenance. Evidenceee868c2c7 (integrated282c0f5ec) records algebra12/12, real PM/native replay2/2, normalization9/9, mechanical228/228, harness5/5, actual Axis150Workers+17controls, Collinear92+15 and signed distances74+14. The same midpoint/distance fixture fails the original production Worker residual check before the correction and passes/replays afterwards; contradictory input still returns RESIDUAL with unchanged input. See test/function-aware-substitution. Source-matched combined signed-host282c and later selected-profilea0 composition now pass within their recorded scopes; earlier signed36bf proof does not qualify later math changes. This is not general solver correctness or evidence of published cross-account file corruption.

## CAD-031 — solver status can describe a nonlinear compromise as success

The CAD-030 lane independently preserves two contradictory nonlinear DistancePP rows whose numerical run reports success at an original residual compromise of+5.5/−5.5. Successful numerical termination is not proof that authored requirements were satisfied. Existing original-residual validation refuses the production Worker input, and no accepted publication from this diagnostic is claimed. The separate follow-up must retain machine-readable residual/domain/convergence causes through admission and public Worker replies; do not label every failed numerical/domain attempt a proven algebraic contradiction. Keep last-valid state and original residuals authoritative. Raw diagnostic: test/function-aware-substitution/evidence/nonlinear-compromise.json. ARC28 diagnostic propagation is now integrated: actual sourceaca23b2b3 and later15ed both pass8 public workflows/12 malformed/lifetime controls with99 terminated Workers. See test/admission-causes/public and test/selected-profile-integration-review/evidence. The underlying nonlinear numerical-status diagnostic remains open; the added cause is not a new proof of infeasibility.


## CAD-032 — selected-profile Worker reply fields read before data admission

Independent actual public baselineD0/r1 tests reproduced ten accessor probes across sketch, semantic and native replies. Several accessors were read before later schema checks; a semantic value and native evidence accessor could still complete the operation. Correction61a5ecdbc captures bounded top-level own data records before reads, captures nested sketch failure data, and copies only small bounded native evidence/binding metadata before validation. Mesh buffers are not traversed or cloned by this change. Focused source tests pass27 including existing planner/ledger controls, R2/R4 getter probes report zero reads, and later signeda0 passes public authoring/persistence/lifetimes. Independent full adversarial evidence is being integrated. These controls do not authenticate semantically false but structurally valid data supplied by compromised in-page code.

## CAD-033 — new selected feature blocks unrelated sketch ancestry

BaselineD0/r1 public tests show that the old strict known-history allowlist treats WORKER_SELECTED_PROFILE_EXTRUDE_V2 as unknown: independent new-plane creation refuses, and source edits fail despite optimistic readiness. Correction15ed6c577 admits only the exact nine-field schema and records its explicit sourceFace dependency. Related fast-save still refuses; closed source edits use existing full atomic replay. Nineteen focused controls pass. Actual public annulus edits regenerate1500π→2625π, unrelated Point/new plane/Circle work, and invalid inner diameter60 refuses STALE_REGION with previous bytes/history/models intact; normal native fresh reopen preserves two sources. Independent reviewf984b63da is retained separately on review/selected-profile-source-dependencies-20261106. Generic boxes/Booleans were not blindly whitelisted. Public API descriptions conservatively understated this newly qualified bounded source-edit scope. Source-only5c6ac398f and matching desktop53481ad69 correct that text; the change belongs to the next built candidate and does not alter r4 evidence.

## CAD-034 — identical project snapshot write cancels read-only region inspection

Controlled actual61a/r2 reproduction held a genuine semantic success and invoked public projectService.save(). Identical project bytes were written; global storage revision4→5 and project-key version4→5 changed, while sketch namespace/source version stayed3 and source/history/models were unchanged. Inspection falsely aborted. A separate public Point append plus undo restored the bytes but changed source versions3→6 and correctly invalidated the old result. Correctiona0b363bce reuses sketchRevision(storage,namespace), capturing namespace identity/membership/version counters while retaining the existing object, source/frame, stream, epoch and host guards. Actual after-controls confirm save→success and source-ABA→AbortError. Build/TSC and signed selected-profile/composition pass; the complete adversarial receipt is still being collected. No autosave timer suppression or blind retry establishes these results.

## CAD-035 — public Boolean chooses the wrong registered build

Actual a0/r4 union of supported selected-profile disks refuses ENGINE_REVISION_MISMATCH because the command stamps the older default OCC revision. Accepted inputs/document are preserved. Correction32386643a resolves the current outputs' common registered build before submission, including native-empty outputs; default box selection stays unchanged. Actual union/subtraction/intersection and native fresh replay pass independent lens volumes/bounds/validity with served pins, including combined15b960. Independent default/empty/refusal review is integratedd43bd642f. This is our coordinator defect, not an OCC Boolean failure.

## CAD-036 — async success after committed caller loss

Genuine publication observers queue caller loss or host Close before command continuation. Old selected creation/default box return success; initial selected-depth code returns success or an unmarked closed-inspector error. Corrections0634a3c7c,827efcd87 and integrated27d6b7378 recheck the final lifetime and return AbortError with committed:true, retaining published geometry/history. Actual combined15b960 passes selected/default box six controls and independent depth/union checks; observed Workers terminate on disposal. Before/after postcommit receipts stay separate from pre-publication cancellation controls.

## CAD-037 — generic ancestry prevents source regeneration

After a valid selected Boolean, public diameter/new-plane operations refuse before Worker dispatch with accepted state intact. Integrated2e90f0d6a (product20ada8747) tracks exact registered BOX/SELECTED/BOOLEAN schemas, reserved historical IDs and live canonical output dependencies. Consumed IDs cannot be reused; empty outputs keep source dependencies. Related fast-save still refuses. Isolated25 metadata controls and three public/native-reopen cases pass, including empty common becoming a solid with the same output ID. Root corrects only an older positive fixture's fake runtime to the registered build, preserving assertions and the original failure. Fresh combined b322e02c2/app99d007ac passes all three source-regeneration/native-reopen cases; current signed composition remains pending.

## CAD-038 — eight cumulative shape names limit ordinary parts

Both unmodified selected controller and Worker stop at8 lifetime names, even after disposal. Native owned names erase8→0; lifetime counters stay8. A real public ninth circle feature refuses RESOURCE_LIMIT committed:false and preserves accepted state;212 Workers terminate. Baseline666d1232f and isolated32 experiment7240b0549 are backed on both LANs. The32 experiment passes mixed shapes, release cycles,33rd refusal and a plate+15tools+15subtractions+coupon chain with input preservation. Native WASM capacity stays16MiB in these cases, not used heap/RSS; retained selected arg pointers0. Selected-only production candidate5a0b1a0f6 now admits32 cumulative native results and100000 cumulative result triangles per evaluation; native JS/WASM and legacy8 policy stay unchanged. Public b322e02c2 discovery separates readonly readiness from canCreate, reports budget/cost, and refuses an exhausted or incompatible append before feature allocation/Workers. Normal build/TSC and51 metadata/ledger tests pass; actual32 public/signed combined gates remain in progress. Cumulative triangle limits constrain work/display/transfer, not OS memory. This is a prototype wrapper policy, not an intrinsic eight-shape kernel limit.

## CAD-039 — new box ignores the existing selected part build

Actual b322/app99d selected extrusion→box chose old default OCC and refused
ENGINE_REVISION_MISMATCH, preserving accepted state.6e9f8bafe uses current outputs'
exact registered build, including native-empty. Initial default stays unchanged;
wrong/mixed engines refuse without conversion. Discovery boxEngineBindings and
receipt engineRevision expose the choice.17 pure controls and actual6f01/app85d
box creation pass; independent composition/reopen/default proof80297e30d passes on exact6f01/app85d.
See test/selected-profile-box-continuation. This is our coordinator policy.

## CAD-040 — publication metadata still caps the application at eight

Real public32 onb322/app99d accepted8 outputs, then valid native9 (1584 triangles)
hit addPublicationCheck's cap8. Accepted state stayed intact. Counterexample
f2a4 integrates36eb46f56.6f01 changes the metadata registry cap256, preserving
native32/100000,legacy8 and owner/mount ceilings.33 owner/ledger controls pass;
actual public32 proof46805f9b8 now passes, including33rd zero-work refusal and native fresh depth/travel. Same-source signed composition is desktop054a6aae4.
