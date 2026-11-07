# Bounded numeric selected-profile depth editing

This lane adds one scalar edit to the existing owned full-history transaction.
It is not a second model/history or a new solver. The selected source plane,
region, feature identity, engine, exact runtime revision, units, body policy and
version remain fixed. The operation reruns genuine solve, semantic preparation
and native Workers through the existing registered operation. No derived profile,
mesh or native handle is added to the nine-field authored request.

The public methods are `inspectSelectedProfileHistory()` and
`editSelectedProfileDepth({revision,index,featureId,depth}, {signal,valid})`.
Inspection returns readiness, an opaque authored revision, history availability
and exact selected-profile feature parameters with their history indices.
Typed/project-bound parameters are explicitly unsupported; native local constants
remain supported. Depth must be a finite positive millimeter number ≤1,000,000.
Unsupported kernel-scale depths can still fail during actual replay.

Successful edits add a distinct `selected-profile-depth` entry to the existing
bounded in-memory journal. `authoredEditTravel({revision,direction})` dispatches
this entry separately from `extrusion-depth`, `solid-box`, sketch and parameter
entries. Its identity binds every immutable selected parameter, including exact
engine revision and source/region IDs. Old journal shapes remain unchanged.
The retained identity counts both UTF-8 and browser string memory against the
existing budget. A same-depth command returns `changed:false` without replay,
source writes, journal changes, history/model publication or Worker creation.

## Matched normal application

Final product source: `8a59ae6d12f5bbc7e1788329ee459c55dc14dd85`.
Base: `c9f3684da`; implementation commits `d0a519fc1`, `e51c7e102`, `8a59ae6d1`.
R730 retained stage: `/mnt/data10tb/codi-cad-selected-profile-depth-20261106-r2`.
Owned direct fixture: `http://127.0.0.1:20703/index-webos.html?DEFAULT&webos=1`.
The normal public app entries are compiled by `webpack.app.cjs`; no helper entry
or fake browser UI is included. The fixture enforces same-origin scripts/Workers
and `wasm-unsafe-eval`, without general `unsafe-eval` or blob Workers.

| Asset | SHA-256 |
|---|---|
| Normal app | `712f9a1dfeadbdb78b320eaa8035098acc30deb591dcbbb5c15e28876f837d03` |
| Sketch Worker | `241267a8f24892743ec82beaf5bda00da962538b8bb445c3d02b6559d4583da9` |
| Semantic Worker | `b2978247c61a269ff5e8e2143dfdaca04221c3ee6e950e1336099f1bb440d2a3` |
| Project Worker | `7236c461672b662cf9d860439c99a3962784012f88245c248a771158f7287286` |
| Selected native Worker | `0f3240cdde9b5faced831ace71ee5ffcfb6fe159dacba5b7265e5a09b0ca9853` |
| Selected native JS | `cbd49d63d0900f50dda7fc53518d5f06183e85b1dea720522cc2994b0876adc9` |
| Selected native WASM | `a81af0b78dd585124f3f2d05d09b4a387b276bd1f655f0234002a6ab4646a637` |

Only the normal app changed in this lane. Workers/native assets retain the
previous qualified pins. Runtime native evidence is checked independently
against analytical annulus volumes; mesh-derived values are not relabeled native.

## Results

| Control | Result and independent oracle |
|---|---|
| Public source creation/discovery | PASS: ordinary Circle APIs author r20/r10; discover actual annulus, no source seeds. |
| Numeric depth 5 →7.5 | PASS: native volume 1500π →2250π; same body ID and source bytes. Only authored `depth` changes among the exact nine parameters. |
| Authored undo/redo | PASS: volumes return to 1500π then2250π, with the distinct selected journal kind. |
| Exact no-op | PASS: no model/history revision, epoch, journal, source or observed Worker churn. |
| Refusal admission | PASS: zero/negative/nonfinite/over-limit/string depth, stale revision, wrong feature, extra field and accessor refuse; getter is never read. Pre-aborted signal and false lifetime also refuse. |
| Native failure | PASS: depth1e-12 reaches genuine native construction, returns `ENGINE_FAILURE`, committed:false; accepted source/history/models and journal entries remain intact. This is not a claim that tiny depth is geometrically impossible. |
| Pending cancellation / Close | PASS: genuine positive native result2250π is held; signal cancellation or host Close refuses uncommitted, preserves accepted1500π geometry, and late delivery cannot publish. |
| Concurrent source request | PASS: public Point append refuses while depth owns the pipeline; explicitly cancelled depth retains accepted state. This is **not** a successful concurrent source-mutation/currentness proof. |
| Benign metadata save | PASS: real project save during held native depth delivery does not cancel the depth operation or rewrite source. |
| Post-commit caller loss | PASS after fix: real models$ observer queues caller-valid=false or separately host Close after commit, before async edit resolves. Each returns committed:true refusal and retains accepted2250π geometry/history. |
| Native save/reopen | PASS: normal prepareHostSave/native loader in a fresh browser context retains exact sources, history, selected parameters, region and runtime,2250π. Reopened model edits to depth8/2400π and authored undo returns7.5/2250π. |
| Existing rectangle transaction | PASS: old public rectangle depth5→7.5→undo5→redo7.5, independently measured published bounds; journal remains `extrusion-depth`. |
| Existing OCC/Manifold boxes | PASS: separate default-engine owners; public width2→3→undo2→redo3 gives measured24→36→24→36. Journal remains `solid-box`; absent native volume stays null. |
| Cleanup | PASS: each observed corpus/disposal context has zero owners/mounts, cleanupFailed:false and all instrumented Workers terminated. Fresh restore disposal separately reports zero resources. |
| Pure journal regression | PASS18/18 including selected identity/runtime mutation, old-kind rejection, redo truncation, bounded history, accessor refusal and retained byte accounting. |
| TypeScript/normal app build | PASS, exit0. First two type-only errors retained in `tsc-before.log`. |

Opaque document/capability tokens can refresh after a refused replay because
its evaluation epoch changed. That does not advance the authored journal
counter or mutate source/history/models. Exact no-op is stricter and verifies
no capability/stream/epoch churn. After host Close, journal inspection correctly
becomes unavailable; the Close proof compares accepted source/history/models
and asserts the unavailable journal rather than bypassing its lifetime guard.

## Concrete defect and retained before evidence

Baseline product `e51c7e10271556274800f643e072adb7b9da3d77`, normal app
`fc29ea1b458aa9d5de8a5c273fb7be2451089a838c6e4e2597d44aa048720069`,
fixture20702, passed the ordinary depth/reopen/cancellation controls. However,
the real models$ publication observer exposed the shared transaction's final
return gap:

- Queued `valid=false` returned normal success despite caller loss.
- Queued host Close kept the accepted edit but the receipt escaped through a
  later generic document-inspection AbortError without committed:true.

Both original receipts/logs are retained. The shared transaction now repeats its
committed lifetime guard immediately after awaited publication, before building
the return receipt. Caller callback exceptions and closed/replaced ownership
become committed refusals. This path does not roll back accepted geometry or
newer ownership. Ordinary rectangle and box transaction regressions pass.

Test-only mistakes are also retained and labeled: initial annulus run used a
mistyped source-label environment value (app SHA matched, but its declared source
label was invalid; do not use as source proof); cancellation initially asserted
opaque capability token equality; Close initially tried to inspect a closed
journal. Final receipts correct those oracles without weakening authored-state,
geometry, source, lifecycle or no-op assertions.

## Reproduction

Run from this checkout with available reviewed dependencies and current Node:

```sh
node --test test/selected-profile-depth/journal.test.mjs \
  test/mechanical/authored-edit-journal.test.mjs \
  test/smlib-integration/solid-journal.test.mjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/webpack/bin/webpack.js --config test/selected-profile-depth/webpack.app.cjs
```

The normal build requires the source-matched existing Worker and catalog assets
prepared by the main build. It does not generate missing native providers.
Point `JSKETCHER_TEST_URL` and `CODI_TEST_CDP` at owned loopback fixtures. Set
`CODI_SOURCE_PIN`, `CODI_EXPECT_APP_SHA`, `CODI_EXPECT_SKETCH_SHA`,
`CODI_EXPECT_SEMANTIC_SHA` to the table above, `PUPPETEER_CORE_PATH` to the
installed Puppeteer module and `CODI_RECEIPT` to a new output path, then run
`node test/selected-profile-depth/browser.cjs`.
`CODI_DEPTH_CASES` optionally restricts the explicitly named cases.
`retained-transactions.cjs` uses the same app/source/CDP settings.

This lane does not qualify the signed desktop adapter/My files/account boundary,
human depth-edit UI, typed bindings, generated-face operations, generalized
profile types, STEP/3MF exports, physics, or all CAD2. Native saves preserve the
editable authored history; current-window undo journal persistence across reopen
is not claimed. No performance, forced-GC or hardware-memory conclusion is made.
