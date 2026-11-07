# Independent cancellable Canvas scheduling control

Source: `1c3f5dc3f7b73cd991439e403e7b4981adc8c06e`.
Canvas module SHA256: `1169b4f632c510a121610799791b54a1eb9a46f2dfd68e3facd9831dc229ee7c`.
Baseline: retained point-picking-fixed, pre-cancellable scheduling module
`test/sketch-cache-readiness/workerSketchCanvas-after.ts`, SHA256
`0d7bd5959df5498d689ae9a8846e2837c6ebe1dd943187747dec4f65569482a4`.

Eight actual Chromium module controls pass: baseline/fixed × close before native
RAF delivery, close after native delivery while renderer callback is withheld,
clear, and replacement installation. Canvas/Path2D/requestAnimationFrame and
cancelAnimationFrame are real browser APIs. The test wraps native RAF to retain
the renderer callback rather than forwarding it. Canvas allocation/draw wrappers
record and forward genuine browser calls. A 10,000-point batch reaches a real
4ms drawing pause; no synthetic performance clock or solver is used.

For the queued cases, cancellation happens in the same browser task that starts
the drawing, before native RAF can run. The first harness used separate protocol
roundtrips and allowed a genuine frame to arrive between them; its assertion was
corrected by controlling scheduling in one browser task, not by changing product
code. The delivered case deliberately waits until the native callback has fired.

The fixed module cancels its queued frame, rejects install with AbortError within
microtasks **without releasing the withheld callback**, and shrinks all staging
canvases to 1×1 immediately. Close also shrinks the target and selection canvases.
Clear/replacement retain the expected target dimensions; a replacement point
remains selectable by a trusted mouse click. Repeated close is harmless. Calling
all saved old callbacks afterward adds zero drawImage publications and cannot
replace the newer pixels. The already-delivered callback case also settles on
close without waiting for callback release.

The baseline installs remain pending at the same immediate checkpoint and retain
the staging buffer until the withheld callback is delivered. They subsequently
reject on epoch/lifetime checking; the receipt does not claim a baseline stale
publication that did not occur.

Source review confirms cancelWork increments epoch, cancels/rejects every queued
pause and releases tracked buffers; the post-pause/currentness checks and private
buffer swap remain. No concrete scheduling defect found in this bounded review.
This is module ownership/scheduling evidence, **not actual app, Worker, CSP,
authored-model publication or complete legacy-editor migration qualification**.
Parent owns matched full-app r2 qualification. No product files were changed.

Run with Node24 and repository TypeScript dependencies:

```
node test/worker-canvas-scheduling/browser.cjs
```

The runner uses its own context on shared CDP19329, closes that context and all
pages, and leaves fixture servers untouched. Exact source/compiled hashes,
per-case allocation sizes, cancellation IDs, settlement and late-publication
counts are in `receipt.json`. Browser: Chrome155.0.8059.79.
