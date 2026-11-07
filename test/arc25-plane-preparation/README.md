# ARC25 exact planar display preparation

This is one bounded scene preparation improvement. **ARC25 remains partial.**
The complete 2,000-record restore still blocks a 10 ms heartbeat for about
261–267 ms in the candidate measurements below. This does not qualify the whole
CAD responsiveness gate or a physical GPU, STEP, solids, solver mathematics,
or the separate desktop host `inspect()` path.

## Product contract and diagnosis

Baseline source is `2c67f9bfea671e0fb8a89d796fba3325721fc18e`.
The product candidate is `a616e6b9b7edc33ee633a65208fee23f1c2d0473`.
Only `openFaceView.js` and its new `openFaceDisplayBounds.js` helper change.

The current real model-notification path constructs `OpenFaceView`, whose
`updateBounds()` previously built a temporary display-only degree-one NURBS
surface through `PlaneSurfacePrototype.boundTo()` and then evaluated its four
corners. This happened in addition to constructing the authoritative model's
surface. The candidate directly constructs the same ordered world-space quad
for the exact built-in plane prototype with its original `boundTo` method.
The model surface remains untouched. A full 2,000-model rebuild consequently
creates 2,000 genuine model NURBS surfaces rather than 4,000 model-plus-display
surfaces. It still creates every model, view and display geometry.

The fast path preserves the existing sequential BBox minimum-size algorithm,
including the sometimes surprising zero-coordinate expansion when a point lies
far from the origin. It preserves 750 mm minimum width/height, 50 mm total
padding, the plane's existing transform, ordered corners, normals and winding.
No modeling tolerance changes. The current caller always supplies these values;
this is not a new general-purpose optional-argument API.

CSys/custom/derived prototypes and overridden `boundTo` methods use the existing
NURBS path. No view or source caches, asynchronous jobs, new cancellation owner,
shape hiding, record truncation, delayed authoritative commit, shared craft or
Worker changes are introduced. Existing source-currentness and lifetime rules
remain authoritative. This synchronous optimization reduces work; it does not
claim cooperative scene publication has been implemented.

## Genuine app qualification

All controls use actual compiled app code, genuine Viewer/WebGL/registered model
and view instances, the real project-validation Worker and real legacy NURBS math.
Forwarding counters call the original methods. They do not replace the math,
Canvas, Viewer, Worker, geometry, or public replies.

`corners-browser.cjs` checks 13 actual cases: empty, far point, far pair and long
segment on XY/XZ/ZY at several signed depths, plus a rotated datum plane. Direct
bounds match genuine legacy NURBS corners to 1e-10; Float32 vertex data matches
exactly after signed-zero normalization. Normal/winding comparison allows 1e-7
for Float32 representation only; the product tolerance is unchanged. Every
update disposes the previous geometry once and retains its material, genuine
model surface, source bytes, storage version and history object. Actual instance
method override and a derived plane prototype still construct the real NURBS
surface. Registry/marked/view selection survives.

The rotated test selects the actual originating feature, not the last item in
lexicographically ordered `models$`, and asserts a non-axis-aligned normal. An
early harness used `.at(-1)` and selected `S:9` instead of the rotated plane.
That diagnostic is retained in the evidence archive but is not a qualified case.

`allocation-browser.cjs` restores the complete 151,959-byte native envelope with
2,000 independent PLANE feature records, then genuinely travels to pointer 999
and back to 1999. It retains the full 2,000-record history in both states, all
corresponding registered root/face views and selection. It checks released old
owners and exactly one attribute observer per current root/face. One display
geometry is constructed per current model. These tests do not claim 2,000 UI
clicks or a 10,000-model acceptance standard.

The existing `../arc25-view-preparation/restore-browser.cjs` supplies full restore,
forwarding timing, readback controls and timeline lifecycle qualification. Every
accepted run has 2,000 models/root views/face views, 2,001 scene children including
one existing helper, 2,964 draw calls, 5,961 triangles and 1,481 renderer-owned
geometries at the observed camera. Those renderer counts can reflect normal
frustum culling; no source/model/view was hidden or removed by this patch.

Full controls cover genuine timeline start/middle/end scrolling, row selection
across unmount/remount, rewind/full-tip travel, resize, injected stale RAF
delivery, and the real component's unmount/remount. Injected lifecycle controls
are labeled as such; they are not claims of a spontaneously occurring fault.

The prior `sketch-child-disposal.cjs` controls also pass on this candidate:
actual saved rectangle objects/loop/region, retained source and colors, selection
precedence, newer owners protected, first failure retained, each owned cleanup
attempted, repeat disposal inert, and successful reevaluation. Injected wrappers
throw after real child disposal; this proves owner coordination, not arbitrary
exception safety inside every child resource implementation.

Actual cancellation after 700 ms rejects with AbortError, keeps the empty
workspace/source/storage unchanged, closes its actual project Worker and reaches
zero owner/mount/candidate/accepted/detached resources without cleanup failure.
Successful open documents correctly keep one current owner; their native/storage
state differs from the pre-restore empty document. That is not called a leak.

## Fixed comparator environment and measured scope

Both builds run sequentially in fresh contexts of the same isolated Chromium
155 browser, 800×600 viewport and CPU ANGLE SwiftShader with compositing enabled.
Exact browser version, full argument list and GPU feature state are retained in
`receipts/runtime-pins-r10.json` and each restore receipt. This is not physical
hardware acceleration. No flags differ between baseline and candidate; changing
the environment is not the product fix. Shared CDP 19329 was not changed.

Both final endpoints serve this identical strict CSP:

```text
default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'
```

The new corner/allocation tests assert that header. `serve.py` is a loopback-only
actual-build fixture that supplies the policy; it is not deployed product code.
Early candidate observations used vanilla HTTP without this header. They were
renamed `*-before-csp-parity.json`, archived and excluded from the table below.

| Instrumented actual observation | Baseline | Candidate |
|---|---:|---:|
| Full rebuild NURBS factories | 4,000 | 2,000 |
| Full rebuild display geometries | 2,000 | 2,000 |
| `updateBounds` aggregate, final allocation run | 96.1 ms | 48.8 ms |
| Full rebuild aggregate including wait, same run | 517.1 ms | 490.4 ms |
| Full restore acceptance, control run | 2,261.6 ms | 2,196.8 ms |
| Full restore sibling/main maximum gap, control run | 311.5 ms | 266.5 ms |
| Full restore model notification, control run | 124.7 ms | 92.3 ms |
| Full restore sibling/main maximum gap, repeat | 291.3 ms | 261.1 ms |
| Full restore model notification, repeat | 122.2 ms | 86.6 ms |

The control restore runs also perform timeline tests afterward; repeats omit
those controls. Neither loopback speed nor these small instrumented samples is a
throughput promise or a statistically established percentage improvement. Earlier
allocation observations varied, including a slower candidate end-to-end travel.
Method durations nest/overlap and are not additive. Reliable conclusions are
removal of 2,000 unnecessary surfaces, preserved actual geometry and ownership,
and a smaller but still substantial measured synchronous publication gap.

The first 2,000-model render remains approximately 140–152 ms. Registry/view
publication and rendering need further bounded work. Desktop host snapshot
inspection has separate observed copying/parsing cost and is outside this
standalone actual-app test; root owns that lane. No whole-site responsiveness
claim follows from these receipts.

## Source/runtime pins, reproduction and backup

| Runtime | App SHA-256 |
|---|---|
| Root R10 baseline, direct 20600 | `fa1ba70a9c6a38744706e7f5557d794b743ca8288b1ed034f9f34e40d679132e` |
| Isolated candidate, direct 20506 | `deb6bc2ea87a66a6e79d70542aec6b71d68c987d7c76fcf7ace48ec1b6a4c64e` |

Both use byte-identical `static/project-validator.4139afa9eed975359c26.js`,
1,838,471 bytes, SHA-256
`134e945d13e0ae5416f00e6521af4be026e4133c545de961417b1add3ac94462`.
This PLANE fixture exercises that Worker, not the sketch-solving Worker.

R730 retained build is `/mnt/data10tb/codi-arc25-plane-bounds-20261105`,
source candidate `a616e6b9b`. It borrows frozen R10 generated inputs/dependencies,
uses `resolve.symlinks=false` for those asset paths, and was rebuilt with
`CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1`. No generated runtime is committed
as new source. The test/receipt follow-up does not alter the tested product.

Use an isolated browser/loopback fixture, installed Puppeteer and Node. Set
`JSKETCHER_TEST_URL`, `CODI_TEST_CDP`, `CODI_EXPECT_APP_SHA`, and `CODI_RECEIPT`.
Set `CODI_EXPECT_FAST_BOUNDS=1` for candidate corner tests (0 for baseline), and
`CODI_EXPECT_NURBS_MULTIPLIER=1` for allocation tests (2 for baseline). The existing
restore harness takes `CODI_COUNT=2000 CODI_READBACK_PROBE=1 CODI_STABLE_MS=100`;
add `CODI_TIMELINE=1` for lifecycle controls or
`CODI_CANCEL_MS=700 CODI_ASSERT_ABORT=1` for cancellation.

The baseline/candidate own 20503 browser uses:

```sh
chromium --headless --no-sandbox --remote-debugging-port=20503 --enable-automation \
  --user-data-dir=/path/to/workspace/snap/chromium/common/codi-arc25-readback-compositor-20261105 \
  --no-first-run --noerrdialogs --enable-gpu --use-angle=swiftshader \
  --enable-unsafe-swiftshader about:blank
```

Profiles, raw logs and provisional diagnostics are backed up separately to
`r730:/mnt/data10tb/codi-evidence/arc25-plane-preparation-20261105/` with a
SHA-256 manifest. Compact qualified receipts and all reproducer source are Git
tracked here. LAN branch is `review/arc25-plane-preparation-20261105` on example.invalid
and R730. No public deployment or shared-browser/service mutation is included.
