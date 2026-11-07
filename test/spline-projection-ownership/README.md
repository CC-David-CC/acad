# Independent spline owner/Canvas review

Review base `a888f7bc5`; source includes Worker projector
`3196346f0c941001b22ec2489ab38fb17d1d8114`. The two snapshots are exact root WIP
bytes captured for this review; both were rehashed against root after testing:

- accepted-owner-snapshot.mjs: SHA256 `3d6fa96e24c94b5d92a7f01099e5ed9701efe75fc49b96c12a65e402a7c7d19d`;
- canvas-snapshot.ts: SHA256 `25fcb3af0a491d7b645b00eb549c24c450ffe344317db60aa28a7f7bb8cf5cc8`.

Only new test/docs files are committed. No root product files were changed.

## Receiver finding

`aggregate-before.json` and the last owner test preserve a real receiver-boundary
counterexample: three independently valid 4096-point spline rows are accepted and
frozen, publishing a ticket containing12288 points. Worker production is capped
at8192 total, but this WIP receiver enforces only the4096 per-row bound and outer
100000-node/1MiB character limits. This is a corrupted-output contract gap, not a
current trusted Worker producer/native geometry bug or an unbounded allocation.
Root fixed this in `d177d06c8cae349f561ff19708ebd8dc08aedc3b`.
The fixed owner snapshot SHA256 is
`889f92e0e62a0c92a4cb9c9dd1f1aac9b89bf3fb75cd1a744905fd1b211feb58`.
`aggregate-after.json` confirms exactly8192 accepted and12288 refused. The
retained baseline acceptance remains a deliberate counterexample, not
qualification of the missing old limit. Both snapshots pass19 directed controls
with the aggregate test explicitly selecting its before/after expectation.

The other owner controls qualify2/4096-point dense data copying, deep freezing,
raw-input alias separation, refusal of short/oversized/sparse/extra-key points
and arrays, nonfinite coordinates, wrong type/kind/approximation/tolerance,
malformed/nonfinite bounds, zero getter reads, explicit unsupported spline
reasons without partial geometry, cancellation and supersession during
cooperative copying. A final currentness callback that synchronously aborts the
signal or closes the owner cannot publish a ticket. They use **labeled trusted-transport doubles**, not real
Worker/native source acceptance. As with the prior private seam, shape checks
are not an independent proof that a polyline approximates a native spline or
that a forged numeric tolerance/bounds matches its source. The current pinned
Worker remains the producer authority; read-only view data is not authorization.

## Actual Canvas controls

`canvas-receipt.json` records four actual Chromium Canvas/Path2D controls:
close before native RAF delivery, close after native delivery with the renderer
callback withheld, clear, and replacement. A4096-point frozen polyline is used.
The test forwards genuine Path2D.lineTo calls and injects a single5ms latency at
call128 so the inner cooperative path loop deterministically yields; this is
explicit fault scheduling, not a rendering performance measurement or fake
Canvas. Native request/cancelAnimationFrame are used, with renderer callback
delivery deliberately withheld.

Every case rejects the old install with AbortError without releasing that
callback, cancels its frame and immediately shrinks staging buffers to1×1.
Close also releases target/selection canvases. Old callbacks subsequently add
zero lineTo and zero drawImage calls, so no remaining points or stale pixels are
published. A replacement Point remains selectable with a trusted mouse click.
Repeated close succeeds; all owned pages/context close, fixture servers stay up.
No scheduling defect was found in this bounded Canvas snapshot.

The test is module drawing/ownership proof: **no full-app, real Worker, CSP,
numerical-cache, solver, manufacturing-accuracy, signed-account or complete
editor-migration claim**. Parent/other lanes own full-app and signed tests.
Worker projection math/error sampling evidence remains separately described in
`test/spline-render-projection/README.md`; this review does not repeat or widen it.

## Reproduce

Use Node24, installed TypeScript dependencies and shared Chrome CDP19329:

```
node --test test/spline-projection-ownership/owner.test.mjs
CODI_OWNER_FIXED=1 node --test test/spline-projection-ownership/owner.test.mjs
node test/spline-projection-ownership/canvas-browser.cjs
```

The Canvas runner reads its source once and hashes exactly those bytes. Browser
version, compiled-source hash, native cancellation counts, staging sizes and
late callback observations are in the receipt. Node results are in
`owner-controls.log` and `owner-fixed-controls.log`. No Canvas rerun was needed
for the counter-only owner fix: the Canvas source did not change.
