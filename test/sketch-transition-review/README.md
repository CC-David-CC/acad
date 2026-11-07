# Independent review of the data-only transition core

Reviewed CAD `10489c3d5ef3da13394f1e8d0e1f8098b64c9980`, shared helper `fea6589d5` / peer `8e672d4c9`. Tests/receipts only: no product edits, transport integration or app/history publication claim.

## Findings before transport wiring

1. **Whole-data masking exceeds the intent guarantee.** `web/app/sketcher/headless/sketchTransition.ts:46` replaces every candidate `object.data` with the prior data before comparison. `intent-verifier.test.mjs` executes the exact private verifier body: 12 controls pass, including six counterexamples where altered spline degree+knots, method, mode or child ID, and rigid local points or member ID evade this comparator. Changed root ID, metadata, generator or relation targets reject. This is a comparator guarantee gap, **not** a demonstrated real solver rewrite or unsafe accepted full transition. Other validation can reject some mutations, especially raw-spline child IDs. The final solve compares the candidate with its own replay, rather than recovering the missing comparison with original authored data.

   Use an explicit solver-coordinate projection per supported shape. RigidGroup has only three solver parameters in `transform`; `version`, `members` and local `points` are authored (`rigid/rigidGroup.ts:visitParams/write`). BSpline degree/modes/method and child identity must remain meaningful. Raw knots are authored, while interpolation/CV arrays can be derived: use mode-specific reasoning or truthful refusal, not a blanket numeric-data mask. The server lane owns this fix.
2. **Map/Date external parameters are accepted as empty dictionaries.** Actual pinned Worker inputs `new Map([['ignored',1]])` and `new Date(0)` return `ok:true`; an array rejects. Transition lines 23/66 delegate to `solve.ts:record/solveSketch`, which excludes arrays but accepts cloneable containers; `Object.keys` sees no entries. Require a plain dictionary at this boundary. These cases have no external consumers; no wrong geometry or named-parameter bypass was demonstrated. Server owns the correction.
3. **Some invalid inputs lose a valid correlation revision.** An extra request key or >1 MiB UTF-8 source with `revision:'review-current'` returns `revision:''`; malformed JSON and downstream refusals retain the revision. Lines 23–24/66–67 assign it after initial validation. Future transport should distinguish an uncorrelated malformed envelope from a correlated core refusal. This is diagnostic behavior, not an authored-state mutation.
4. **Legacy missing-hint wording overstates replay support.** Actual constrained source without admission hints returns `UNSUPPORTED: Rejected or missing admission intent cannot be regenerated.` `solve.ts:assertSemantics` / `io.ts:validateProjectSketch` refuse before the later comparison's narrow missing-hint rule. Document the explicit-hint capture requirement or define a justified separate legacy-import boundary. Do not loosen explicit-hint replay or silently migrate intent. This does not establish ordinary current-history failure; current serialized captures may already contain hints.

## Actual Worker evidence

`browser-receipt.json`: Chrome 155.0.8059.79, owned CDP target `AF38E22849D8FB4D4237D1B361747575`, fixture 20583/CDP 19329. Worker SHA256 `ba4f8a52062e0433d8e888281a505fb39bb72c3772811ee9cf0ecd7903073ae6`; actual verb dependency `55f13091a656c635d1ebe3931a9b52236c65023549b7b69bc8278362f87686f3`. Both were fetched and verified before cases. Strict same-origin script/Worker CSP permits wasm-unsafe-eval, without unsafe-eval or Blob workers. Fourteen Workers started/terminated, no CSP violations; owned context closed. No DOM/canvas/model publication participates.

Five positives pass: exact replay, LengthRelation, fixed boundary, two-stage relation retaining earlier-stage geometry, and unrelated raw BSpline retaining its complete data. Metadata/IDs remain; independent physical math checks `length(a)=2*length(b)` within 1e-6 mm. Seven refusals pass: missing hint, changed explicit hint, degenerate source, malformed JSON, extra request key, UTF-8 limit, external array. Map/Date acceptance is the domain finding above, not successful rejection. Input JSON stays unchanged. No entire-shape/generator/typed-consumer/admission-order catalogue claim.

The raw initial receipt `browser-before-source-field-fix.json` contains an object-spread naming collision: input sketch overwrote `source`. The corrected receipt moves it to `inputSketch` and records the tested source commit; no runtime assertion/outcome changed. The reproducer avoids that collision. Worker bytes were verified, not retained as a new artifact by this lane; source/build prerequisites remain in `test/sketch-transition/README.md`.

A later follow-up stopped before dispatch because fixture 20583 changed to Worker `b68386a4056fbcc56fc9aee31120d113a4452943a20cda223c0eef5e921e3124`; see `fixture-drift.json`. This is an environment pin mismatch, not a solver verdict or qualification of the replacement. The owner acknowledged the mutable rebuild and is preparing a distinct immutable fixture. No further fixture tests belong to this baseline checkpoint.

## Scope and reproduction

The core uses actual HeadlessSketchWorkspace, strict IO, shared admission and solver. Exact replay/admission, top-level metadata, constraints and generators have the checks described above. Both functions return data and publish nothing. Private result ownership, correlation, cancellation/deadlines, live currentness, hydration, history pointer changes and rollback remain transport/publication work.

Parent 512-lock replay 940 ms/add 2313 ms observations are local off-main measurements, not guarantees. Altered-hint ten-second termination is not a solver refusal. This lane did not repeat those benchmarks or qualify same-renderer responsiveness, Save/native replay, UI or signed Files.

From this branch at its 10489 parent, `node test/sketch-transition-review/intent-verifier.test.mjs` runs the synthetic exact-source-method controls. They intentionally assert the baseline negative behavior; they are not expected corrected-core behavior. The server owner has this path for corresponding positive refusal regressions.

Actual Worker reproducer (only original pinned bytes or an identical rebuild):

```sh
PUPPETEER_CORE_PATH=/path/to/puppeteer-core \
CODI_TEST_CDP=http://127.0.0.1:19329 \
JSKETCHER_TEST_URL=http://127.0.0.1:20583 \
node test/sketch-transition-review/browser.test.cjs
```

Current mutable 20583 is known to fail the byte pin. A replacement source/Worker needs separate qualification; do not silently update the expected pin or extend this receipt's scope.
