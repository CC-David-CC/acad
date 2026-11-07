# Typed closed-sketch inspection — bounded private PASS

This closes the E18 typed mounting-plate **read-only inspection** gap on a private candidate. It does not complete all typed sketches, typed sketch mutation, or Gate1. No public deployment, Files work/audit, race/security test, empty-sketch creation change, polygon/native change or physical-engine/capture source change was made.

Production ownership is exactly `web/app/cad/craft/closedSketchTransitions.ts` and new pure helper `typedClosedSketchInspection.mjs`, based on `f67ab45d31afa24c225a24d94158830da31ff5d8`. All other additions are under this test directory. [Summary](evidence/summary.json) records exact production-source and driver hashes. Root received and approved the source plan before edits.

## Contract and architecture

The typed expression service deliberately keeps length/angle quantities out of its scalar `table$`. Removing `isTyped` alone would therefore lose width/height names or expose dimensional quantities to unannotated numerical consumers. The new read path reuses the shared `prepareTypedRectangle` contract and `resolveQuantity(name,'length')` from the **current Worker-accepted** typed result. It resolves only registered rectangle SegmentLength bindings into canonical millimeter values; it leaves the native sketch, original W/H names, typed definitions and scalar-only table unchanged.

The unchanged actual inspection Worker reconstructs/solves the same source and verifies original accepted geometry before returning coordinates/IDs/constraints. There is no main-thread ParametricManager, additional solver, agent model or authored-source replacement. The pure helper only checks the bounded existing typed-consumer contract. Discovery returns explicit unsupported source reasons and `capabilities:{inspection:'supported-typed-rectangle-lengths',mutations:false}`. Numerical/frame/admission validity still belongs to Worker inspection, not discovery alone.

Capture/rechecks cover typed mode and current physical result, exact source/list/table identities and revisions, scalar table membership/values, every used typed length value, document unit, authored source/version/history, frame/registry/service ownership, material revision and caller lifetime across awaits. Legacy scalar inspection retains its old numerical table path. Typed closed-sketch mutations and generic sketch travel keep the default mutation guard; all seven public mutation entrypoints refuse with `TYPED_SKETCH_MUTATION_UNSUPPORTED` before Worker creation/publication. Existing specialized physical parameter operations/undo are separate, and remain usable.

Supported scope is the existing bounded four-Segment authored rectangle, one stage, its two registered driving lengths, numeric remaining constraint literals, no local constants, generators, labels or separate dimension records. Named lengths are positive0.001..1e6mm, source≤65,536 UTF-16 code units (the existing helper bound). Existing closed-command capacities remain (64 sketches,256 history entries, parameter table≤1024 finite entries with absolute values≤1e9). General typed circles/arcs/splines/other named constraint fields, active/Worker sketch view, typed mutations and wider capacities remain unsupported/unqualified here. This is not a blanket claim that all valid typed documents are inspectable.

## Actual evidence

- Four helper contract tests PASS: source-name retention, detached length-only snapshot, dimension/domain refusal, unsupported consumers/local shadow/generators/annotations and input bounds.
- Fifteen synthetic coordinator controls PASS: open/consumed provenance, stale physical result, explicit unsupported source/dimension, all seven typed mutation guards; scalar table mutation, used-length value, source/list/unit/revision/mode/document changes while pending. These are transport mocks, not app geometry qualification.
- Existing legacy coordinator suite PASS, TypeScript `--noEmit` PASS, candidate app compile PASS. Legacy test build retains its pre-existing two unused mock-export warnings; production app build has none.
- [Actual private signed browser R5](evidence/browser-r5.json) PASS9 rows, Chrome155.0.8059.79, public command authoring only. A real five-hole plate is driven by W/H/D with an extra unrelated circle source and unused angle/scalar definitions. Typed inspection returns exact120×60mm then140×70mm points, the original W/H names/11 constraints, and no native/history/geometry changes. The circle source is explicitly reported unsupported. Actual inspection requests contain only W/H canonical lengths, not untyped coercions of the angle/scalar table.
- All seven public typed mutation entrypoints refuse with zero additional Workers and unchanged accepted intent. Genuine Worker replies are held without changing their data. Keeping the normal New confirmation open until the read aborts, then Keep editing, preserves the source and leaves the late original reply inert. A later public typed edit and inspection succeed. Old revision refuses before Worker creation. Actual owned-window Close cancels another genuine pending read.
- Existing specialized typed parameter Undo/Redo still works and the new read follows120×60→140×70 states. `W=inch(5)` retains its typed source/name while inspection returns canonical127×63.5mm coordinates. This is quantity conversion, not qualification of document inch display.
- All84 Workers observed after instrumentation have corresponding terminations. This is observed ownership for the tested operations, not a general memory bound. All owned browser processes/contexts and private fixture20911 stopped. Root fixture20416 and shared Chrome were untouched. No account/key/session/profile state was copied or backed up.

Private app bundle `824938e3…`, app SHA `7f8db35eb25ca69bc4016277b57b3adf1dd5ef693d9fae72d4a3945255c46df9`; unchanged real inspection Worker SHA `241267a8f24892743ec82beaf5bda00da962538b8bb445c3d02b6559d4583da9`. [Served pins](evidence/served-pins.json) independently reread the actual private HTTP app, sketch/physical/project Workers. Code-only prerequisites came from root's immutable R4 package. [Runtime delta](evidence/runtime-delta.json) contains only the new app and a Manifold vendor chunk; the latter differs solely in two Node-only build-stage file URIs ([comparison](evidence/vendor-path-only.json)). No kernel/default promotion or Native Mesh feature parity is claimed.

## Retained failed harness assumptions

R1–R3 receipts remain intact. R1 incorrectly included earlier **untyped** authoring inspections (`externalParameters:{}`) in an assertion about typed read requests; the observation window now starts at the typed read. R2 artificially held the inspection's entire origin-wide solve lock while requesting a typed replay, so its expectation of immediate concurrent AbortError was invalid; its exact pending error was not captured before the assertion. R3 captured `Sketch solve timed out`: it opened and immediately cancelled New before the100ms validity poll observed the transient busy state. The corrected test waits for the actual AbortError while the real confirmation stays open, then clicks Keep editing. No arbitrary sleep, product workaround, modified Worker result or weaker cancellation assertion was substituted.

Physical table/source/value fault invalidation is coordinator-tested. The real browser proves normal host lifetime cancellation/stale revisions and subsequent typed publication; it does **not** prove concurrent accepted typed-table publication while an artificially held inspection owns the solve lock. No new native Save/reopen or Files audit is claimed in this slice.

## Reproduction

Use a fresh worktree and qualified Node24/Puppeteer24.35.0, pinned existing numeric/Manifold compile prerequisites, and R4 **code assets only**. `prepare-code.py` stages original Workers/native assets into private `.build` paths; the project Worker is private, not written into shared node_modules cache. Copy the R4 `node_modules/jsketcher-build` package into `.build/r4-code`, then:

```sh
python3 test/typed-closed-inspection/prepare-code.py
node --test test/typed-closed-inspection/helper.test.mjs
CODI_TYPED_INSPECTION_OUT=NEW_OUT node node_modules/webpack/bin/webpack.js --config test/typed-closed-inspection/webpack.cjs
node NEW_OUT/coordinator.cjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/webpack/bin/webpack.js --config test/typed-closed-inspection/webpack.app.cjs
```

Use `bundle-fixture.py` with the accepted desktop app source/builder and fresh stage/output directories; start the unchanged desktop `tests/files-desktop-signed-fixture.py` with that app bundle, **fresh temporary service state**, strict self-only CSP and an unused loopback port. Actual run used Node `/tmp/codi-files-move-node/bin/node`, Puppeteer `/tmp/codi-occt-release-control/node_modules/puppeteer-core`24.35.0, Python `/tmp/codi-audio-upload-19584-venv/bin/python` (aiohttp3.14.5) and port20911. System Python lacked aiohttp and stopped before starting a fixture. No previous service state is a prerequisite.

Run `browser.mjs` with `CODI_TYPED_TEST_URL`, new `CODI_TYPED_TEST_RECEIPT`, `CODI_TYPED_APP` and `CODI_TYPED_WORKER`. It launches a fresh owned Chromium/profile/account; it never connects to shared CDP. Preserve failed receipts and close only the owned fixture afterward. Source/notes are backed on both LAN Git repositories; private compiled-code backup details are recorded separately.
