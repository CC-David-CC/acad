# Numerical-cache inventory and Worker-view ownership review

The legacy inventory is pinned to `22d8a04e34dd96e99df298dc7bde3d1e7dd6e5e8`.
`python3 test/sketch-cache-readiness/inventory.py` reproduces 34 source files,
41 selected derived-cache reads and 71 selected numeric/authored mutation sites.
These are source search categories, not an exhaustive dynamic call graph or
runtime qualification. File hashes and exact lines are in `consumer-inventory.json`.

A native Worker acceptance witness does not prepare a local numerical cache.
`AlgNumSystem` starts with success/error defaults before its polynomial isolation
cache exists; `fullyConstrained` starts false. Neither establishes validation or
DOF. ConstraintExplorer, length/concentric inspection and measurement roles consume
conflict/redundancy/implied-lock state. ToolManager dispatches callbacks directly;
DragTool and shape tools alter coordinates/control bounds before solve/prepare.
Delete/releaseControl and sketch transactions can checkpoint before the PM call.
PanTool can start shape editing or annotation editing. Stage/generator actions also
alter the graph. Therefore guarding only `prepare`/`solve`, or treating all
`allConstraints` reads as cache-dependent, would miss writes or overblock data reads.

A future projected-PM installer would need a private exact-PM/stage readiness
record, initially unprepared, promoted only by genuine current numerical cache
construction. No public `markPrepared` based on a success flag; close must leave a
refused tombstone instead of restoring legacy permission. Guards belong before
caller coordinate/history mutations. Existing untracked legacy PMs retain their
current behavior, which does not certify them. No PM/AlgNum/tool gate was added:
the current Worker view constructs no PM or editable shape graph and reports
`numericalCache:'absent', dof:null`. Legacy editor migration remains open.

## Bounded current-view findings and fix

Reviewed service baseline `0ac42887a23ef2546c872ae3ca8d9e85b57f7555`:
`workerSketchViewService.ts:11,31–40`. Its pending controller cancelled computation,
but close during a yielded first Canvas install retained the overlay until the
next animation frame. A throwing owner cleanup then skipped surface/DOM cleanup
and replaced the original opening error. The candidate gives pending and active
views the same idempotent resource owner; close removes DOM and closes canvases
synchronously, attempts every cleanup, and preserves the first close error.
Opening failure retains its original error after cleanup. It also exposes
`render.unrendered` and announces partial output for omitted annotations/geometry.

`view-lifecycle-browser.cjs` executes the actual before/after service and Canvas
code in Chrome, with real DOM/Canvas but **labeled inspection/projection/context
doubles**, a 10,000-point drawing and deliberately withheld animation-frame
callbacks. It is not real Worker or full-app acceptance. Baseline retains one root
on immediate close; with injected owner failure it still retains that root after
release. Fixed close removes the root immediately, makes the canvas 1×1, attempts
owner and surface cleanup once even when both throw, and late delivery settles
AbortError without restoring DOM. A successful small view exposes the omitted
annotation row and partial status. Exact source hashes/results are in
`view-lifecycle-receipt.json`.

The independent actual Canvas/Path2D/trusted mouse control found point-center
selection still failed after the 3px size fix. `canvas-browser.cjs` compares copied
baseline 0ac Canvas SHA `6d311860…` with root's separate point-path follow-up SHA
`0d7bd595…`: both draw an 8×8 antialiased marker, only the follow-up selects the
center. Both close repeatedly to 1×1 and remove the click listener. This is module
Canvas evidence, not full-app/Worker/CSP proof. The earlier world-radius issue was
identified from source; its pre-size-fix bytes were not preserved, so this receipt
claims only the retained point-center baseline. Root owns the Canvas fix.

The supplied `runReplay` and lifetime guard remain trusted private components;
Worker data is not authorization. Source/version, document/host lifetime, frame,
model/history streams, evaluation epoch and parameter values are checked by the
service. This review does not certify arbitrary future caller hooks, all DOM
replacement cases, or every legacy cache consumer.

## Reproduce

Use Node 24 and the installed repository dependencies; browser controls use an
owned context on shared CDP 19329, close all their pages/context, and leave
fixture servers untouched. Lifecycle uses the retained local 20488 origin solely
for browser secure-context crypto, replacing its document for the module control.

```
node --test test/sketch-projection-seam/owner.test.mjs test/render-sketch-projection/projection.test.mjs test/projection-independent-review/owner-and-hook.test.mjs
node test/sketch-cache-readiness/canvas-browser.cjs
node test/sketch-cache-readiness/view-lifecycle-browser.cjs
node node_modules/typescript/bin/tsc --noEmit --pretty false
```

20 combined owner/render/source controls pass after adding the newly required
valid minimal render fixture to the old owner tests. All original cancellation,
malformed evidence and explicit forged-transport trust-boundary assertions remain.
Full repository TSC passes. Browser receipts use Chrome 155.0.8059.79; no local
full build, publication, solver claim, or repeated Files tests.
