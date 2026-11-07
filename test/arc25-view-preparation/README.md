# ARC25 history projection investigation (candidate)

Baseline actual app source `d177d06c8cae349f561ff19708ebd8dc08aedc3b`, direct20495,
app SHA256 `d7588344757f704ede436fcd32474fe5787b1525a9af78b8e1d7425bb4abc868`.
Two real same-origin CAD documents share one renderer/page; the second owns a10ms
heartbeat. The first restores the existing151959-byte native envelope method:
2000 genuine registered PLANE records with independent feature IDs. This is not
claimed to have been created through2000 UI clicks or to qualify10000 features.

Baseline r2 accepted in3893ms with1983ms maximum sibling gap; registry1.2ms,
model notification174ms, first actual WebGL render156ms and next48ms. All2000
models/root views/face views were present, registry identity and selection worked.
Scene children2001 includes one pre-existing helper, not an extra authored model.
A first harness incorrectly expected children===2000; that assertion was corrected
to distinguish scene helpers from authored models, with no product change.

The traced repeat accepted in4568ms with2628ms gap. One contiguous microtask task
was1382ms. Trace showed4000 ParseHTML calls(315ms inclusive), and later forced
style/layout through updateViewportSizeIfNeeded:22006 styled elements and24013
dirty layout objects,248ms combined. CPU sampling put React sync work around1.2s
inclusive. Event timings overlap and tracing affects measurements: they are not
additive or an exact attribution of the entire gap. Source HistoryTimeline mapped
all2000 icons/splitters and per-item subscriptions, creating off-screen DOM. Plane
view creation/render is a remaining measured cost, not the dominant proposed fix.

The candidate changes only HistoryTimeline.jsx/.less and its pure viewport helper.
It keeps the complete authored history/model graph, feature indices, pointer and
selection source, and projects the measured horizontal viewport plus overscan.
Logical spacers retain the complete scroll extent, including insertion marker and
existing10px/5px padding. Only visible HistoryItem subscriptions mount; ordinary
unmount disposes them through existing connect. Pointer changes focus the correct
logical slot. Scroll/resize frames are history-reference/epoch guarded, replaced
frames are cancelled, and unmount disconnects the observer and cancels work. A late
old frame cannot clear a newer frame handle. Row/pointer callbacks check their
captured history, preserving index meaning across source replacement.

Pure independent geometry tests scan logical slots and verify every actual
viewport intersection is rendered and spacer sums stay exact across start/middle/
end, resize widths, insertion positions and up to10000 logical records. They retain
failed/selected record identities and bound rendered rows by viewport width. Three
controls pass; Babel JSX compile and full TypeScript noEmit pass. The matched
actual-app qualification below supersedes the earlier pending-build status.
No 3D scene, craft, solver, model/history source or native persistence code changed.

Raw profiles/traces remain private under /tmp/codi-arc25-baseline-r*. The committed
compact receipts and trace summary record exact bounds and source. Reproducer
restore-browser.cjs instruments genuine methods, forwards their calls, closes its
context and leaves fixtures running. A tracer can optionally be enabled with
CODI_TRACE; it must not conflict with another shared-browser tracing session.


## Matched actual-app checkpoint — 2026-11-05

The tested r5 fixture is source `69298c8e123d72827630492987119032966ebf7e`
(the integration of candidate `78d86e0d9`), served directly from R730
`/mnt/data10tb/codi-worker-sketch-view-20261105-r5` on loopback20496. Exact app,
sketch-worker and project-worker SHA256/byte pins are in `fixed/pins.json`.
The PLANE fixture invokes the real project-validation Worker; these tests do not
claim to exercise the sketch-solving Worker.

`fixed/restore-and-controls.json` records the actual2000-record restore accepted
in3298ms, with1369ms maximum sibling10ms heartbeat gap. At acceptance all2000
models, history records, root views and face views exist and pointer1999 is the
full tip. Registry/marked selection of `S:0` succeeds immediately. The accepted
document owns one current resource owner; the test does not call that a leak or
claim all resources should be zero while the document remains open. Its one
project Worker closes and detached input cleanup completes. Source bytes remain
unchanged; native/storage equality to the empty pre-restore document is correctly
false after successful restore.

The real horizontal timeline mounts22 rows at the start,28 at the middle and21
at the end of2000 logical records. Full scroll extent remains68022px. Selecting
index1000 survives row unmount/remount. Travel to pointer999 evaluates1000 models
without truncating the2000-record history, and returning to1999 restores2000.
Resize from555px to255px reduces rows to12. Selection observers track mounted
rows plus one persistent owner. A guarded late-frame control injects delivery of
an already cancelled callback: it cannot clear the newer frame or change history
meaning. A separate control invokes the existing connected component error-boundary
callback to cause a real React unmount/remount; observers fall22→1, DOM is absent,
pending frame is cancelled, and all2000 authored models/history remain intact.
The error-boundary injection tests lifecycle cleanup, not a spontaneous user error.

The dual-timer traced repeat (`fixed/restore-dual-timers-traced.json`) has matching
1346ms gaps in main and sibling timers, so this gap is not explained solely by
iframe timer throttling. Against the recorded traced baseline, ParseHTML calls
fall4000→42 (315→3.7ms), the largest microtask1382→194ms, and the measured viewport
style/layout work248→3.1ms. These are instrumented diagnostic comparisons, not an
untraced throughput benchmark. They establish removal of the off-screen timeline
DOM cost while preserving complete authored data.

**ARC25 responsiveness remains open.** The remaining approximately1.3s sibling
stall is unacceptable evidence for declaring the entire gate passed. A separate
GPU/cc trace (`fixed/restore-gpu-traced.json`, `fixed/gpu-summary.json`) records
HeadlessChrome155 using ANGLE SwiftShader Vulkan software. The own renderer spends
966ms in `GLES2::ReadPixels`/command-buffer waiting with a matching approximately
965ms GPU flush. Nested spans overlap and shared GPU contention is not isolated.
This localizes a native readback wait in this run; it does not prove that hardware
GPUs have this latency, that the driver alone is defective, or that hiding models
is an acceptable fix. The actual2000 model/view corpus remains present throughout.
No scene/renderer/core source was changed by this timeline candidate.

Compact receipts and both diagnostic summarizers are versioned here. Private raw
compressed traces, profiles and logs are backed up on R730 under
`/mnt/data10tb/codi-evidence/arc25-view-preparation-20261105/`; source and these
compact receipts are mirrored to the same branch on example.invalid and R730 Git.

Reproduce the pure viewport controls with:

```sh
node --test test/arc25-view-preparation/window.test.mjs
```

For an actual-app run, use `restore-browser.cjs` with `CODI_TEST_CDP` pointing at
an existing Chrome CDP endpoint, `JSKETCHER_TEST_URL` at the exact loopback fixture,
`CODI_EXPECT_APP_SHA` set to the app pin, `CODI_COUNT=2000`, `CODI_TIMELINE=1`, and
explicit `CODI_RECEIPT`/`CODI_PROFILE` output paths. Check the script's environment
names before use. Tracing is optional and must be coordinated with other users
of the shared browser. Keep heavy raw traces out of Git.


## Bounded viewport diagnostic — 2026-11-05

One sequential non-traced comparison used fresh own browser contexts at800×600
and400×300, device scale1. Both restore the identical151959-byte2000-PLANE native
fixture against the same exact r5 app pin and retain2000 models/history/root views/
face views at pointer1999. No material, visibility, plane mode, source or model
was changed; closing each context releases its temporary viewport setting.

| Observation |800×600 viewport |400×300 viewport |
|---|---:|---:|
| Main canvas |754×560 |354×275 |
| Restore elapsed |3208ms |2509ms |
| Main and sibling maximum10ms timer gap |1328ms |609ms |
| Model notification |159ms |158ms |
| First2000-model JS render call |141ms |127ms |
| Draw calls |2964 |2920 |

Compact raw receipts are `viewport-800-diagnostic.json` and
`viewport-400-diagnostic.json`. Slight draw-call/triangle differences occur with
normal viewport/frustum behavior; both receipts explicitly preserve all authored
records and root/face view objects. Together with the prior native readback trace,
this is evidence of viewport-size sensitivity in this shared software-GPU test.
It does not isolate fill-rate, readback, compositor, or contention, and provides
neither a statistical benchmark nor a qualified product remedy. Smaller viewports
are a diagnostic, **not** an ARC25 acceptance workaround. No product changes were
made after this observation; renderer ownership and a causal fix remain with the
integration lead.

To reproduce only these diagnostic cases, set `CODI_DIAGNOSTIC_VIEWPORT=800x600`
or `400x300` on the above actual-app command. The script permits only these two
explicit diagnostic sizes. It creates and closes its own context and does not
resize user contexts. No browser-wide tracing was used for this comparison.

## Native readback ownership diagnosis — 2026-11-05

**The approximately 966 ms `GLES2::ReadPixels` wait is not an application
GPU-picking or restore snapshot call.** No product source changed in this lane.
All runs below use the unchanged r5 app/Worker pins above and the same real
151959-byte, 2000-PLANE restore. Every successful 2000 case retains 2000 models,
history records, root views and face views; selection remains registered.

`readback-probe.cjs` installs forwarding wrappers at document start in the main
document and its genuine sibling CAD iframe. It observes WebGL1/2 `readPixels`,
`finish`, `flush`, `getBufferSubData`, canvas snapshots and 2D canvas read/draw APIs.
It forwards calls directly to the original native methods. During real restore
all these JavaScript request counters are zero. An explicit real 1-by-1 WebGL
`readPixels` after observation is counted once, establishing that the wrapper is
active. The control does not create or replace CAD geometry, hide a model, change
a material, or replace a canvas/Viewer. Source search independently finds only an
explicit user PNG export calling `toDataURL`; picking uses CPU raycasters.

The installed browser reports Chromium revision
`a49e2e3d4addfd84e765b52afe230bedb81096db`. Its native path is:

1. The ordinary scene draws through `SceneSetUp.__render_NeverCallMeFromOutside`
   and `WebGLRenderer.render`.
2. Chromium's compositor updates a
   [`TextureLayer`](https://chromium.googlesource.com/chromium/src/+/a49e2e3d4addfd84e765b52afe230bedb81096db/cc/layers/texture_layer.cc#162),
   which asks its client to prepare a transferable resource. Blink's
   [`DrawingBuffer::CcLayer`](https://chromium.googlesource.com/chromium/src/+/a49e2e3d4addfd84e765b52afe230bedb81096db/third_party/blink/renderer/platform/graphics/gpu/drawing_buffer.cc#1367)
   installs the drawing buffer as that client.
3. With GPU compositing disabled,
   [`DrawingBuffer::PrepareTransferableResource`](https://chromium.googlesource.com/chromium/src/+/a49e2e3d4addfd84e765b52afe230bedb81096db/third_party/blink/renderer/platform/graphics/gpu/drawing_buffer.cc#482)
   maps a software resource and calls `ReadBackFramebuffer`, which calls native
   GL `ReadPixels` at line 2087. With GPU compositing enabled, it exports a shared
   image instead.

This exact-version source, the prior native `LayerTreeHost::DoUpdateLayers`
trace, and the zero application-call controls establish ownership of that
readback. Its duration includes waiting for queued rendering work; it is not a
measurement of copying pixel bytes alone.

The shared 19329 browser was not restarted or reconfigured. Two temporary owned
browser processes were compared sequentially. Removing `--disable-gpu` alone did
not enable compositing: ordinary headless injected
`--use-angle=swiftshader-webgl`, yielding `gpu_compositing=disabled_software`.
The second owned process explicitly used `--enable-gpu --use-angle=swiftshader`
and reported compositing/rasterization/WebGL enabled. **Both still use CPU
SwiftShader, not a physical GPU.** Chromium documents the distinction between
[full SwiftShader OpenGL ES and WebGL-only fallback](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/gpu/swiftshader.md)
and the [headless `--enable-gpu` driver-selection flag](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/gpu/using-gpu-hardware-in-headless-chrome.md).
Exact effective arguments and GPU feature states are committed in the two
`readback/*-environment.json` files. No browser flag recommendation here changes
the public site's visitors' settings.

| Instrumented observation | Restore time | Maximum sibling timer gap |
|---|---:|---:|
| Shared software-compositor probe, 2000 | 3341 ms | 1371 ms |
| Own default headless, software compositor, 2000 | 3299 ms | 1388 ms |
| Own full SwiftShader compositor plus lifecycle controls, 2000 | 2260 ms | 340 ms |
| Own full SwiftShader compositor, separately traced 2000 | 2256 ms | 356 ms |
| Own full SwiftShader compositor, separate 128-PLANE diagnostic | 557 ms | 87 ms |

These are bounded diagnostic observations, not a statistical benchmark. In the
own-compositor trace there are **zero renderer `ReadPixels` spans during restore
and the next 200 ms**. The longest remaining native/JS spans include a 195 ms
publication microtask and a 152 ms frame/scene draw; adjacent work still creates
the approximately 340–356 ms timer gap. Thus **ARC25 remains open**. There is no
application readback call to delete, and the environment comparison does not
qualify physical GPU behavior or solve all publication/view-preparation costs.

The 2000-model lifecycle controls pass: full scroll extent, logical selection
through unmount/remount, 1000-model rewind with complete 2000-record history,
return to all 2000 models, resize, stale RAF delivery and actual React
unmount/remount cleanup. The old harness used a fixed 80 ms sleep; the own
compositor exposed delayed frame/ResizeObserver delivery, making its immediate
scroll and row-count assertions premature. The harness now waits up to 10 s for
the actual visible logical range and row bound. This is an event-state test
correction, not a responsiveness claim; the measured timer gaps remain reported.

Cancellation at 700 ms also passes: restore rejects in 727 ms, source/storage
remain equal to their pre-restore state, models/history remain empty, all resource
categories become zero with no cleanup failure, and the real project Worker
terminates. A subsequent native snapshot correctly refuses the closed document.

The 128-PLANE observation is a smaller synthetic scale diagnostic. It does not
qualify a 128-feature mechanical part, a sketch solver, human CAD editing, solid
geometry complexity, or a supported release limit. The beginner plate/bracket
workflow remains the separate human/agent functional acceptance path. Improving
large-corpus publication and drawing while retaining all model/view identities
is further ARC25 work; hiding geometry is not an accepted remedy.

Reproduce this lane with `CODI_READBACK_PROBE=1` on `restore-browser.cjs`; use
`CODI_TIMELINE=1` only with the 2000-record corpus. Tracing was done only in the
owned compositor browser after coordination with the signed-Files lane.
`readback/` contains compact receipts and the native-event summary. Heavy raw
trace/profiles, exact-version browser-source observations and logs are retained
on R730 under `/mnt/data10tb/codi-evidence/arc25-readback-20261105/`.
