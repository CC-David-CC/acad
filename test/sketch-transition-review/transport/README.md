# Independent transition transport review

Product paths reviewed: `web/app/sketcher/headless/{client,transitionClient,solveWorker}.ts`. Draft 5fbb, evidence validation 3b913, bounded validation 4d6 and final signal fix 4d3 were inspected. Tests/notes only; no shared product edits.

## Exact results

Thirty directed controls pass on final `4d3dbca4085563ae3e5f284a33d9e3fc0bb7e631` in actual Chrome 155/Web Locks, with **26 explicitly labeled Worker doubles**, all terminated exactly once. These are transport/event-loop controls, not actual solver Worker, native geometry or live publication qualification. The double intentionally returns controlled echoes and malformed replies.

| Receipt | Exact source / client SHA256 | Outcome |
| --- | --- | --- |
| baseline-4d-receipt.json | 4d6f7343c08bc7bfbace79adc139c174fc02ac30 / cba9eec2cdbe90c2a1b1461921f31f6f5ee93dabe66155176a71f64ba899b63d | Preserves final synchronous-abort defect; other controls pass. |
| fixed-4d3-receipt.json | 4d3dbca4085563ae3e5f284a33d9e3fc0bb7e631 / f95d8549ccc000389ae65bb00bc3c3000afcbe79ddd12305ff2c77e0713c0d22 | Final guard returns AbortError; all 30 expected outcomes pass. |

Root found the concrete before-counterexample: final valid callback synchronously aborts its signal and returns true. In 4d, requireCurrent reads signal before calling valid, so the public Promise fulfills ok:true while signal is already aborted. The independent baseline reproduces that exact scheduling. In 4d3, rereading signal after the callback returns refuses AbortError. This is injected callback timing, not a claim that ordinary currentness guards routinely cancel themselves.

The directed controls also establish:

- Caller mutations while queued cannot replace captured external values, IDs, factor or options; output relation, rows and residual arrays are copied/frozen.
- Third pending transition refuses; queued cancellation leaves the holder intact; active cancellation terminates its owned job; the slot is reusable. Response-time microtask abort and authored-state ABA plus a monotonic epoch both return AbortError.
- Wrong correlation revision, sparse evidence/residual/tolerance/unit/relation arrays, nonfinite/excessive residuals, invalid units, extra row fields, wrong relation targets and oversized errors reject. Typed refusal remains a fulfilled frozen ok:false/error result; timeout is Error and cancellation AbortError, not solver verdicts.
- Returned data exceeding 1 MiB UTF-8 rejects during cooperative validation. Input remains bounded at 1 MiB code units before dispatch. The 600,000-é input creates one double, proving no exact pre-dispatch UTF-8 source cap; its echo then fails the output byte check. Production core enforces exact input UTF-8 separately, outside this double test.
- Injected validation-yield holds prove both transition slots remain reserved after both underlying Workers end; third call refuses and releasing yields lets both finish. Held-phase cancellation rejects AbortError; expiry beyond 500 ms rejects Sketch transition timed out. Only zero-delay validation callbacks are held; Worker-double replies/Web Locks still run. This is explicit scheduling injection, not natural performance evidence.
- Input getter refuses without getter invocation or Worker creation.

## Contract assessment

transitionClient captures plain realm-local own-data requests/options before awaiting, detaches nested mutable values, and validates/copies/freezes reply metadata. A future cross-frame adapter must build local records. The input 1 MiB code-unit cap can represent up to about 3 MiB UTF-8 source; do not describe it as an exact 1 MiB transport byte cap. Core rejection and bounded output checks remain necessary.

client owns the cooperative origin-wide exclusive Web Lock for a dedicated Worker's lifetime, correlates revision on that Worker, and cleans worker/timers/listeners in finally. Its two-request bound is per module. The wrapper retains two transition slots through validation and repeats lifetime/deadline checks after yields and before return. Origin lock release at Worker completion permits another cooperative Worker during prior result validation; it is not a global main-thread or memory limit across windows/modules.

No automatic supersession exists: callers supply signal and captured revision/identity/monotonic-epoch guards. A plain boolean cannot prove an unobserved false→true ABA did not happen. Future microtasks after the last synchronous check still require **publication-side fencing of model/source/identity/epoch/storage/account/lifetime at commit**. Frozen data/ok:true are not one-use publication authority; a same-origin URL is not code-integrity proof.

solveWorker routes both task names into the pure core, one request per disposable realm. The peer's actual production-Worker test remains separate (`test/sketch-transition-transport/real-worker-browser.test.cjs`). This lane does not implement or qualify live hydration, undo pointer changes, rollback, Save/native persistence, Files or signed-account publication. No remaining concrete transport blocker was found after 4d3; those larger Worker-first gates remain open.

## Reproduction and custody

The old exact 4d tiny wrapper was rebuilt privately with existing webpack 5.74.0 config and reproduced cba9 exactly, at `/tmp/codi-transport-review-artifacts-4d/client.js`. Final owner wrapper: `/tmp/codi-transition-client-fixed-r13.js`, f95d. No app/kernel build occurred. The script reads once into a Node Buffer, hashes that Buffer and serves the same Buffer for every same-origin CDP Fetch override. Later artifact changes cannot drift an active run. Separate targets/contexts, fixture 20584/CDP 19329, strict same-origin CSP, no unsafe-eval/Blob Workers or CSP violations; contexts closed. Runtime handles are in receipts. Fixture solver Worker is unused by these doubles; no service/deployment changed.

Build the corresponding source using `test/sketch-transition-transport/webpack.config.cjs`, then:

```sh
PUPPETEER_CORE_PATH=/path/to/puppeteer-core \
CODI_TRANSITION_CLIENT=/absolute/private/client.js \
CODI_CLIENT_SHA256=<matching-sha> CODI_SOURCE_PIN=<full-commit> \
CODI_EXPECT_FINAL_ABORT_FIX=1 CODI_RECEIPT=/tmp/transport-fixed.json \
JSKETCHER_TEST_URL=http://127.0.0.1:20584 CODI_TEST_CDP=http://127.0.0.1:19329 \
node test/sketch-transition-review/transport/browser.test.cjs
```

Omit CODI_EXPECT_FINAL_ABORT_FIX for intentional 4d negative expectation; preserve separate receipts. Temporary artifact/fixture paths are observations, not deployment or source-delivery closure.
