# Atomic closed-sketch point batch — Worker component qualification

Candidate adds `editClosedSketchPoints` / public `edit-closed-sketch-points` with exact `{revision,faceId,points:[{id,x,y},...]}`.1–32 unique inspected IDs, finite canonical mm±1e8, initially one authored stage. Point/Segment endpoint/Circle center, generated/rigid refusal and existing typed restrictions match the original single-point domain. No driving dimension/lock/formula constant is rewritten. This is not a replacement for a dimension editor or region-selection editor.

Product files: shared `coordinateTransition.ts`, new fixed `verifyCoordinateCandidate.ts`, typed `transitionClient.ts`, actual `solveWorker.ts` dispatcher/`client.ts`, existing `closedSketchTransitions.ts`; Craft change is exactly one optional method type. Existing single-point API/request/result remains unchanged. Desktop adapter registers in existing closed-sketch module; no index/menu/region metadata or native-kernel changes.

The shared implementation resolves every target before mutation, sets ALL requested positions first, syncs each affected parent ONCE, then admits all temporary LockPoint drivers in ONE PM transaction. Complete stage solve/generation runs with drivers present; all targets must remain numerically exact. Only temporary rows are removed; original authored intent/admissions are checked and ordinary solve verifies the final candidate. A whole-batch no-op returns exact original source bytes. A separate genuine production Worker recomputes the captured original source+intent and compares exact candidate/point metadata before existing atomic full replay/publication and one sketch-bytes journal entry. No sequential intermediate profile is published.

Actual evidence:13 new production-Worker cases +3 domain refusals, all16Workers terminated; the existing61-case single-point fixtures/assertions also pass on the rebuilt shared implementation (61Workers terminated). Full TSC passed. Host adapter has separate protocol-only evidence. **Public model replay/native body geometry/UndoRedo/Save/Open are not qualified by these component results**; parent will run the new signed app after integration.

`fixtures/disconnected.json` and `driven.json` are read-only extracted sketch data from previously genuinely public-authored native Saves (desktop proofc486). `fixtures/provenance.json` binds source native-file hashes and exact data hashes. No public app is loaded from an injected native source; these are explicitly component Worker inputs. The retained61 corpus uses its unchanged genuine HeadlessWorkspace/native-IO fixture construction, not a public authoring claim.

`browser.cjs` runs the ACTUAL rebuilt production `solveWorker.ts` entry under self-only Worker CSP. It changes four right-endpoint coordinates of the first20×10 loop to width25 simultaneously, asserting exact desired geometry and every other source field/second-loop geometry unchanged. It checks no-op/pretty source bytes, target-order reversal, empty/duplicate/oversized/nonfinite/foreign refusals, and a real width100 driven rectangle refusing target105. Real second-Worker verification accepts its genuine candidate and rejects an otherwise finite closed translation of the unrelated second loop or altered result metadata. No fake successful Worker response.

`retained-single.cjs` adapts ONLY the old component's loopback serving/output/source pins;61 original fixture jobs and assertions remain unchanged. Its asset intercept supplies actual compiled JavaScript, never a fabricated Worker reply. `domain-browser.cjs` independently verifies UNSUPPORTED_STAGE/GENERATED_TARGET/RIGID_TARGET on genuine retained native-IO fixtures. COORDINATE_CONFLICT remains an existing numerical admission refusal, not a general mathematical infeasibility claim; the tested fixed-width contradiction has a separate exact geometric oracle.

Build source: isolated R730 `/mnt/data10tb/codi-point-batch-20261106-r1`, based on69a. Own package symlinks/cache, copied qualified numeric precompile; shared caches/native providers untouched. Production Worker rebuilt with `test/solver-stage-diagnostics/build.cjs` to `.build/point-batch-worker-r2/static`, retained entry with `test/headless-coordinate-transition/webpack.cjs`. Initial TSC found a missing union-property guard in the new verifier; it was corrected before final TSC/Worker build/tests. Compilation alone is not qualification. No native binary rebuild or public release.

Raw build manifest truthfully says base HEAD69a because product edits were uncommitted during build. `source-coherence.json` and the full tracked-input before/after hash bind the ACTUAL modified source bytes to this candidate; the later frozen Git commit does not change those bytes. `check-results.cjs` independently recomputes that cohort, Worker hashes, exact local/R730 sources and counts. Runtime JavaScript/dependencies stay outside Git. Raw captured responses/fixture provenance are portable in `evidence/`.

Actual sessions: production rebuild91663, TSC60641exit0, new batch33971exit0, retained single55631exit0, domain test exited0. All owned contexts/loopback servers closed; shared19329 retained. No UI, Files, relay or filesystem-race tests.

Reproduce using the retained qualified Node/deps, OWN numeric cache and a rebuilt Worker from these exact sources:

```sh
CODI_POINT_BATCH_ASSETS=/absolute/component-assets \
CODI_POINT_BATCH_OUTPUT=/tmp/NEW-batch-output CODI_TEST_CDP=http://127.0.0.1:19329 \
PUPPETEER_CORE_PATH=/tmp/codi-occt-release-control/node_modules/puppeteer-core \
node test/headless-point-batch/browser.cjs
```

Assets are `point-batch-worker.js`, `retained-coordinate-worker.js`, `build-manifest.json`. Retained/domain runners document environment names in source and require new outputs. `node test/headless-point-batch/check-results.cjs` is an offline recorded-result check, not fresh native/public app execution.
