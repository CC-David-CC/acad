# Independent append coordinator and full-app qualification

Reviewed the append coordinator introduced by `048d4d35b` and its shared prepared replay/journal path. Public primitive kind, role, stage and nested numeric coordinates are copied/frozen before the first await. The coordinator mints IDs privately, captures source bytes/key version/namespace/history/frame/streams/lifetime, and revalidates them before private replay and atomic source/model publication. Inspection has no publication authority. Append and LengthRelation share the existing sketch-byte journal/travel seam. The review caught a source compatibility change from async rejection to synchronous argument throws; root restored the previous async method declarations before the qualified build. No remaining blocker was found in this bounded source review.

Runtime source is `997df3dbb97b83d79b65db62f191c45c2f23b4ea`, exact r2 app at loopback20488. Both scripts independently check app SHA256 `9993b01af9f49ca29aa2eceaa1701489aef01c992ee3a3b38a1a0799f87a9c28`; the actual sketch Worker `/static/sketch-solver.d9991d9167715129b639.js` is SHA256 `3211e4c5f5b51dc6b19dbce0e29c4cd1dbdb15ce7bbc89c075d5973b3bf7bc87`. Raw receipts include browser/target handles and actual Worker byte hashes. No test-only production-module wrapper is used. Calls enter the real full app's public craft API, use real installed Workers/native kernels and actual model views, and use native snapshot/restore for fresh persistence checks.

`full-app-997.json` passes:

- Public empty XY plane, then Point/Segment/Circle/Arc append, actual view objects and nonempty projections with stable global IDs. The actual scene renderer draws the Point. Read-only inspection retains the types and identities. Native fresh restore agrees.
- Public Point intent is queued behind the real common Web Lock. The caller changes its kind/role/stage and both coordinates before releasing the lock. Accepted intent remains the captured Point [7,8].
- A zero-length Segment returns machine-readable DOMAIN, committed=false. Source bytes, feature history, semantic journal and full native snapshot remain exact; accepted models retain identity.
- Authored undo/redo restores exact endpoint sketch bytes for both unconsumed primitive append and consumed source append. Journal target is the common sketch-bytes kind. Successful feature-history comparison is semantic because the existing edit capture canonicalizes object key order; refused history remains byte-exact.
- A consumed100×50×20 rectangle admits an authored Point and crossing construction Segment/Circle. The original selected region remains in feature history, feature IDs remain unchanged and actual native published geometry stays identical. Appending an ordinary inner Circle refuses with INVALID_PARAMS (the prior region is unavailable), committed=false. Exact source/native/history/journal and accepted model identity remain unchanged; no false pipeline failure is published. No automatic hole or arbitrary profile is claimed.
- Close control intercepts a **genuine successful primitive Worker reply before client delivery**, then aborts the real bound host lifetime. It receives AbortError/committed=false, preserves source/history/models and terminates both disposable Workers. The test manually forwards that same genuine late reply and verifies it remains inert. This is injected reply-delivery timing plus a real host-close signal, not a human window-close gesture or fabricated reply. Signed window/account behavior has separate parent-owned evidence.

`boundaries-997.json` independently passes the advertised planes:

| Plane at depth5 | Local Point | Actual world Point/GPU buffer |
| --- | --- | --- |
| XY | [2,3] | [2,3,5] |
| XZ | [2,3] | [-2,5,3] |
| ZY | [2,3] | [5,3,-2] |

For each, the actual MFace frame, Worker-inspected frame and saved native metadata frame match the current right-handed plane convention. The Point projection is one THREE.Points vertex and contributes zero regions. All three IDs/frames/world points survive fresh native restore.

The same control creates a real OCC box in a fresh workspace. `inspectPrimitiveCreation` correctly reports unsupported part ancestry, and `createEmptySketchPlane` refuses before any Worker dispatch. No sketch is added; native bytes and accepted model identity remain unchanged. This proves the current protective readiness gate, not a permanent architectural limitation.

Both owned browser contexts (eight pages) close after the two scripts; parent-owned fixtures remain up. No product source, shared runtime, desktop backend, account, deployment or packaging change is made by this checkpoint. This qualifies the bounded primitive seam, not CAD1–6, general planar arrangements, typed/nonempty referenced-boundary support, arbitrary history ancestry, STEP/manufacturing or whole-CAD performance. New full-app same-key ABA, concurrent-append and malformed-reply controls were not repeated here; carried transport/common-seam evidence retains its own scope.

The initial r1 run stopped at a successful-history key-order oracle; `initial-history-key-order-oracle.txt` retains it. Only successful history comparisons changed to parsed deep equality. Exact rejection and undo/redo assertions remain. Complete qualification is on r2, not that initial run.

Reproduce with Node24, Puppeteer Core and CDP19329: set PUPPETEER_CORE_PATH, JSKETCHER_TEST_URL=http://127.0.0.1:20488/ and a distinct CODI_RECEIPT, then run `browser.test.cjs` or `boundaries.test.cjs`. Both require loopback URLs and exact expected app pins. Syntax/diff checks pass; no duplicate app build was performed.
