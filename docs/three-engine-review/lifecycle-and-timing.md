# SMLib lifecycle and exploratory timing — 2026-11-05

This followup reviews candidate `a548e2da0` and cancellation fix `047e41961`. It changes only independent tests/docs. The existing parametric model, sketch solver and canonical history remain the design; a selected experimental kernel evaluates that sequence. There is no second authored copy, continuous conversion pipeline or imported application framework.

## Concrete failure and verified fix

Original a548 actual browser counterexample at 20551: await a real mount's readiness; call `execute(unitBox,{signal})`; queue a microtask that aborts the signal; await the operation. It returned a real volume-1 owned solid despite `signal.aborted===true`. `awaitReady()` removed its temporary listener and checked the signal before returning; the queued abort ran before the outer method resumed, while `send()` registered a new listener without checking the already-aborted signal. The same gap affected mesh and disposal. Abort after native delivery but before the async method's continuation could also return success.

The checked-in lifecycle harness preserves a stronger negative control: exact historical a548 mount source (SHA `385eeb8accf7e84bf090bc5cc1b14fc6bff992776cdafb74b6c4c649e8d05fb9`) is supplied at its original same-origin entry URL through test-only CDP Fetch, while the genuine unchanged Worker `078dc881c488e82fff16cfdcdaef077c107a61e8b7ab45e522f32f7509f403ed` and actual WASM execute normally. Six cancellation rows fail, and five other rows pass. This baseline has no fake successful kernel responses. The historical mount substitution is labeled in its receipt and must not be described as a fresh current-app run.

Fix047 mount SHA `9530d3c2c55348841266a0a973b3c9b2300c6796f6d3f774cc530e09bfcb57d6` rechecks cancellation/state at dispatch, listener registration, response receipt and outer-method completion. Its actual lifecycle run passes all 11 controls:

| Control | Evidence scope |
| --- | --- |
| Ordinary queued microtask abort before dispatch: box, mesh, disposal | Actual public mount API and real Worker; no delivery timing injection |
| Abort after native response: box, mesh, disposal | Injected callback immediately after delivery of a genuine unchanged response; guards the Promise-continuation boundary |
| Initialization and operation deadlines before delayed timers | Genuine ready/result held; main-thread busy wait advances the real clock before delivery while timer dispatch is blocked. Not synthetic clock or successful-response fabrication |
| Concurrent operation and binding check refuse BUSY; held cancellation; late reply ignored; separate accepted owner survives | Genuine Worker result delivery held/released, payload unchanged; actual surviving mesh read |
| Private handle identity and frozen public evidence | A structural handle clone refuses; real owned handle remains valid; proof and nested bounds are frozen |
| Mesh proof mismatch closes candidate, accepted owner survives | Deliberately altered volume field in an otherwise genuine mesh response; a response-protocol fault injection, not an ordinary native result |

Mount-driven cleanup terminated every owned Worker before the harness safety cleanup; no forced cleanup was required, and no page Workers remained after context close. The fresh a548 numeric matrix and later047 numeric matrix each pass 15 rows with two explicit unsupported authored-box empty results. a5 and prototype failures remain in earlier receipts. These controls do not qualify exact-deadline equality, arbitrary crash/native free failure, large history, manufacturing accuracy or integrated app transactions. Root's actual-app descriptor seam finding (`validateMount` missing from the descriptor adapter) is a separate gate that direct mount helpers bypassed.

## Actual Chrome observations, not a selection benchmark

Timings use `performance.now()` around factory→ready and client calls→Worker reply. They include scheduling, message transport and wrapper validation; they are not pure native-kernel CPU time. Initialization excludes entry-module import and includes Worker startup and WASM load. Mesh timing also includes independent signed-volume/bounds checks and a second first-box read. All measurements use Chrome `155.0.8059.79`, fresh owned contexts in the already running shared browser process. Assets were prefetched with `cache:no-store` for SHA checks; caches were not globally cleared, WASM compilation cache state is unknown, and other host activity was uncontrolled. First-within-run is not true cold-process compilation. Later mounts reuse the same browser process. No lifecycle busy-wait overlaps the included timing runs.

| Engine | First mount init ms | Later 8 mounts init median ms (range) | 16 box calls median ms | 5 nonempty Boolean calls median ms |
| --- | ---: | ---: | ---: | ---: |
| OCC | 236.9 | 245.2 (232.7–251.7) | 55.15 | 155.8 |
| Native Mesh / Manifold | 27.9 | 23.75 (21.2–26.5) | 2.8 | 3.3 |
| SMLib047 | 61.3 | 54.8 (50.1–58.4) | 21.5 | 27.9 |

The samples are ordinary boxes and their Booleans only. The roundtrips come from different wrapper/runtime implementations and two local fixtures, without representative model histories or controlled repeated cold/warm trials. They demonstrate observable costs and a reproducible measurement path, not a robust ranking, regression threshold or engine-default recommendation. One earlier SMLib timing attempt overlapped the deliberate lifecycle busy wait and was excluded from this table; the included sequential rerun is explicitly named `smlib-047-timing-r2.json`.

The current API exposes no measured Worker/WASM memory, so these timing receipts report memory unavailable. Separate lane checkpoint `fc91034e2` reports sampled actual exported WASM linear capacity: OCC16MiB, Manifold16MiB, SMLib32MiB for a tiny two-box/subtract/mesh/dispose workload. Its method prepends labeled test instrumentation to exact Worker bootstraps, intercepts real WebAssembly instantiation and samples the exported Memory buffer; WASM inputs remain unchanged. The note/receipt were inspected, not independently rerun in this lane. This is capacity at sampled boundaries, not live allocations, peaks, total process memory, post-termination reclamation or leak proof. See that checkpoint's `docs/research/THREE-ENGINE-RESOURCES-20261105.md` and `test/three-engine-resources` for its own pins/scope. Host JS heap is not used as kernel memory.

Common correctness, real model replay/save/undo, failure modes, representative Chrome timing, measured kernel memory and manufacturing exports must drive the later OCC-primary/SMLib-primary/both decision. Current solid mesh reads are explicitly display-only; no new STEP/export/manufacturing qualification follows. OpenUSD remains optional exchange, not the native model format. Source4a3's `solidLedger.mjs` retains one engine per candidate-owner model sequence and rejects a mismatching engine explicitly; the operation requests stay in the common canonical history. The new mount helper evidence does not by itself qualify that app wiring.
