# Saved sketch child ownership correction

This follow-up closes the remaining `SketchingView` coordinator gap in the
preceding open-face cleanup checkpoint. Only `faceView.js` changes product code;
global disposer helpers, concrete child classes, rendering/publication semantics,
geometry math, source history, and material identities remain unchanged.

`SketchingView.disposeSketch()` previously stopped its `forEach` iteration when
one child threw. Later object/loop/region children, array clearing and base
disposal were skipped. The enclosing open-face disposal had already latched its
release flag, so repeating disposal could not recover the skipped ownership.

It now detaches its three owned arrays before callbacks, attempts every captured
child, retains the first failure and reports additional failures. Its `dispose()`
also attempts base disposal after a child failure, retaining the first exception
if the base release also throws. Reporting cannot replace that first failure.
The prior base `View` ownership guard continues to protect newer owners.

The same scoped follow-up fixes an initial display-color regression introduced
by delaying open-face mesh construction: the attribute subscription now retains
`this.color` even before the mesh exists. Existing later color updates and
selection precedence still use the normal rendering path. This is display color,
not a change to material/region identity or a new persistence format.

## Actual saved-source qualification

`sketch-child-disposal.cjs` creates a real 40 by 25 mm rectangle through the public
craft API. Its actual 2232-byte saved workspace sketch owns four object views,
one contour view and one region view. No geometry, Viewer, canvas, solver reply or
resource disposer is faked.

The test constructs a genuine replacement root/face projection from that same
registered model and source, attaches it in place of the older projection, then
retires the older root. This is an explicit derived-view ownership fault control,
not a new user-facing replacement command or a performance workaround. All
authoritative geometry/source identities remain the same.

Selected old child wrappers forward their real complete disposal and then throw.
The face and root base-release controls similarly forward real unsubscription
before throwing. This establishes coordinator behavior when a child reports a
failure; it does **not** claim exception safety inside every individual child's
geometry/material implementation.

| Actual observation | Prior candidate | Corrected candidate |
|---|---:|---:|
| Child disposals attempted | 1 of 6 | 6 of 6 |
| Old child geometry/material release events | 1 pair | 6 pairs, once each |
| Arrays seen by the first child | 4 / 1 / 1 | 0 / 0 / 0 |
| Arrays after disposal | 4 / 1 / 1 | 0 / 0 / 0 |
| Old face base release attempts | 0 | 1 |
| Old root base release attempts | 1 | 1 |
| First exception retained | yes | yes, despite later child/base failures |
| Face attribute observers, including retained newer view | 2 | 1 |
| Viewport observers before / after retiring old projection | 4 / 7 | 4 / 4 |
| Initial retained color `#336699` | incorrectly `#bfbfbf` | `#336699` |

The corrected actual run also verifies:

- Newer root, face, and child model owners all survive older disposal.
- Both old root/face owners become disposed; all old children are disposed.
- Repeating root/face disposal performs no additional release work.
- Existing color updates work; selection stays `#ffff80` across a color update,
  then clears to the new `#228844` color. The replacement creates geometry once.
- Source bytes, source key version and complete authored history do not change.
- Normal public history rewind/replay reconstructs the saved rectangle with
  4 / 1 / 1 child views, one root and face attribute observer each, and four
  viewport observers. Source bytes/version remain unchanged.

The baseline is the preceding product source `6cfc7fe27`, app SHA-256
`145ce7e1e6b959b534c05d5cab210f8efc9a9cc74318f09ccc3e9dde0093e535`.
The corrected product source is `cc28eb60f` (based on final checkpoint
`3d84f42fa`), app SHA-256
`2bae01f048fbf328e921aef14d9c8a4c75515af6534d1142d868eb2351594599`.
It was built on R730 at `/mnt/data10tb/codi-arc25-sketch-disposal-20261105`
using the same frozen generated inputs/dependencies and temporary
`resolve.symlinks=false` build setup documented in the preceding checkpoint.
Webpack compilation succeeded. Testing used an owned Chromium process with full
CPU SwiftShader compositing; no public service was changed.

Compact actual receipts are `sketch-disposal/baseline.json` and `candidate.json`.
Private raw logs/build output are backed up under
`/mnt/data10tb/codi-evidence/arc25-sketch-disposal-20261105/` on R730.

```sh
JSKETCHER_TEST_URL=http://127.0.0.1:20505 \
CODI_TEST_CDP=http://127.0.0.1:20503 \
CODI_EXPECT_APP_SHA=2bae01f048fbf328e921aef14d9c8a4c75515af6534d1142d868eb2351594599 \
CODI_RECEIPT=/tmp/sketch-child-disposal.json \
node test/arc25-view-preparation/sketch-child-disposal.cjs
```

For the prior candidate, point at its exact runtime/app pin and set
`CODI_EXPECT_REPAIRED=0`; this records the known skipped-child/color regression
without calling it a successful lifecycle result. These tests do not broaden the
earlier CAD math, signed Files, arbitrary child-internal failure, atomic scene
rollback or responsiveness claims. ARC25 remains partial.
