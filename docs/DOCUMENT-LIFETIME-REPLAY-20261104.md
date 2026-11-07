# Integrated document lifetime and replay qualification

2026-11-04: application source `aff1befee5ede4119866ccabbf877f5ea8e1c557`,
test checkpoint `3bcafa6288685ec78cc8840935faeef7ac9e30d4`. The integration
lead rebuilt and tested the combined source in isolated Chromium with a strict
CSP, without bypassing script policy. This is local research, not deployment.
Exact assets, results and limits are in
`test/webos/document-replay-evidence-20261104.json`.

## What changed

- Reconciled the actual headless solver, axis-domain correction and cooperating
  worker admission with normalized requests, persistent feature-ID allocation,
  private full-history replay and explicit last-accepted geometry.
- Added a monotonic project generation and abort signal. Reset, replacement,
  restore staging, worker replies, manufacturing preparation and replay use
  the captured project identity/generation. Equal bytes are not a lifetime ID.
- Restore staging has version-owned rollback receipts. Later writes, including
  byte-identical writes and remove/recreate, cannot be undone by an old receipt.
  Old restore catch/finally handlers cannot poison a replacement document.
- An occupied-workspace open is rejected before beginning a replacement;
  validation is followed by another empty-workspace check. The earlier version
  incorrectly invalidated valid ongoing work even though open was rejected.
- Project replacement clears old surface geometry, transient surface tools and
  delayed saves. Explicit same-project `loadStrict()` preserves that saved
  workspace's surface sidecar; `loadData()` replaces it, and `empty()` removes
  it. Service replacement clears the view but leaves the destination's saved
  workspace available to explicit loading. Native envelopes carry their own
  surface field. Omitted assembly constraints no longer leave old constraints.

`craftService.reset()` replaces craft history and invalidates old evaluation;
it is not the full-document blanking API. Use `projectService.empty()` for that.
Noncooperative legacy kernel work is serialized and drained before replacement
work. These tests do not establish safe concurrent kernel cancellation.

## Independent combined-build evidence

All 11 browser scripts passed:

| Scripts | Established boundary |
|---|---|
| `plate-parametric-centered-browser.test.cjs` | Actual 100×50×20 plate to 150×30×20, centered Ø10 hole and four edge-relative holes; solid inspection, history controls and native-v2 reopen. |
| `plate-parametric-last-valid-browser.test.cjs` | Impossible 15×15 edit retains the previous complete solid with stale notice; save/3MF refusal; correction to 150×30 regenerates successfully. |
| `craft-private-replay-browser.test.cjs` | Held candidate does not replace accepted registry/stream/body tessellation; reset rejects stale completion. |
| `project-document-lifetime-browser.test.cjs` | Actual validator cancellation and late reply after empty/loadData/loadStrict; staged sketch cleanup; held legacy replay drains before a new restore. |
| `occupied-restore-preflight.test.cjs` | Rejected JSON/Blob open leaves generation, accepted model, real manufacturing metadata and valid pending replay unchanged. |
| `project-service-replacement-browser.test.cjs` | Actual initializer disposes old service, clears model/surface, permits fresh save/reopen and rejects held old validator reply. |
| `project-surfacing-reset-browser.test.cjs` | Old surface and delayed cache write disappear on replacement; nonempty native surface restore remains valid. |
| `project-surfacing-sidecar-browser.test.cjs` | Same-project sidecar reload, explicit empty and switch/load of a different preseeded project. |
| `axis-domain-project-restore.test.cjs` | Malformed horizontal-angle branch in an unopened sketch is refused in an empty target before staging. Occupied targets now fail earlier. |
| `craft-feature-id-history-browser.test.cjs`, `craft-feature-id-deletion-browser.test.cjs` | Existing feature identity/history/deletion/reopen controls remain valid. |

Nine unit checks also pass: three actual document-lifetime checks and six
actual volatile-storage receipt checks. The receipt tests use a bundled Node
harness with a minimal window stub; they do not constitute browser storage or
server durability evidence. TypeScript and the application build pass. The
test helper builds with two recorded legacy dependency warnings; no claim of
a warning-free full tree is made.

## Reproduce

Prepare the pinned runtimes/dependencies per `WEBOS-REPRODUCIBLE-BUILD.md`, then:

```sh
CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1 npm run build
CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1 ./node_modules/.bin/webpack --config test/webos/webpack.config.cjs
npm run check-code
./node_modules/.bin/webpack --config test/mechanical/webpack.storage-stage-write.config.cjs
node --test test/project/document-lifetime.test.mjs /tmp/codi-storage-stage-write-tests/tests.cjs
```

Serve the rebuilt `dist` from an explicit directory, rather than starting the
server inside a directory that the next build deletes. Use loopback and a
separate Chromium profile. Set `JSKETCHER_TEST_URL`, `CODI_TEST_CDP` and
`PUPPETEER_CORE_PATH`, then run the listed scripts sequentially. The recorded
CSP was `default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src
'self' 'unsafe-inline'; worker-src 'self' blob:; img-src 'self' data: blob:;
connect-src 'self'; font-src 'self' data:; frame-src 'self' blob:`.

## Still open

Subsequent checkpoint: desktop `73c1e8b13` packages fork `d3d36bc5` and both
workers. The lead passed signed small-model and dependent five-hole/fillet
plate workflows at phone/1080p/4K, plus ordinary fillet/chamfer resize/reopen,
visible invalid-size error and Native Mesh refusal checks. See desktop
`docs/evidence/cad-packaged-workers-20261104.md` and its JSON receipt. These
later tests supplement the exact-source checks above; they do not repeat or
expand every earlier test. No deployment is claimed.

The full Gate 1 workflow, units, feature patterns, bracket/enclosure, shared
agent commands, broader both-engine matrix and production swappable mounts
remain unfinished. Snapshot/stringification still includes main-thread work;
all operations' captured services, native handles and resource bounds are not
qualified. The current evidence is not a complete clean-machine release,
physical device, generic solver, assembly or manufacturing qualification.
