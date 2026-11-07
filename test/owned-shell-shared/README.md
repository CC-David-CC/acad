# Prepared public E12 shell workflow

**Not executed.** This is a complete workflow preparation for root's next normal
composed application, not a per-step test or a native-success receipt. No runtime
was started or rebuilt for this preparation. Existing E01 work stays separate.

## Required coherent runtime

The root fixture must include the shared shell source, real Native shell Worker
transport and explicit catalog/factory registration, root's Craft and ledger
hooks, and these actual public commands:

```
inspect-worker-shells       create-worker-shell
inspect-worker-shell-history edit-worker-shell
```

It must also include explicit `engineRevision` on `create-worker-solid-box`, the
ordinary box history edit, shared authored travel and normal native Save/Open.
`classify-worker-solid-points` must admit this **exact new registered build** for
genuine temporary replay. This driver requires real native point observations;
it does not replace missing public classification with a fake or mesh ray.

```
sha256:57b74074e0a249b917ac68357fbd003c37d1ab61897206886b575088e6995858:60dc956b08e01f43d08a48035a384e478e63bb34fb55f21a152c8cd12e8b8947
```

Native build completion alone does not qualify any of the following workflow.
Do not substitute a different runtime automatically. Defaults and old saved
backend pins remain unchanged.

## One complete run after root authorization

Use Node 24 and the existing qualified Puppeteer 24.35.0 installation. Supply a
fresh output directory and root's final signed runtime pins/source commits:

```sh
CODI_DESKTOP_SOURCE_ROOT=/path/to/exact/desktop-source \
PUPPETEER_CORE_PATH=/path/to/qualified/node_modules/puppeteer-core \
CODI_TEST_URL=http://127.0.0.1:ROOT_FIXTURE/ \
CODI_TEST_CDP=http://127.0.0.1:19329 \
CODI_SIGNED_PINS=/path/to/root-final-runtime-pins.json \
CODI_EXPECT_SOURCE=ROOT_FINAL_CORE_COMMIT \
CODI_EXPECT_DESKTOP=ROOT_FINAL_DESKTOP_COMMIT \
CODI_EVIDENCE=/tmp/new-owned-shell-complete-workflow \
/path/to/node24 test/owned-shell-shared/desktop-driver.mjs
```

The runner registers only its own fixture account and uses its own context. It
closes that context after awaited commands/file sync and disconnects from the
shared Chrome without closing/restarting it. It never seeds native model data,
writes private model APIs, changes services or uses another account's files.
Source/read-only accepted-state observations are labeled separately from public
authoring. Raw native replies are saved before analytic assertions. Failures
remain in the fresh output directory; never overwrite or retag an old run.

The complete chronology is:

1. Pin every declared runtime file and actual outer bundle. Invoke the reusable
   on-disk example through real public registry dispatch, including its pinned
   `expectedDocumentToken`.
2. Create a genuine `100×50×20` box with the exact shell build. Read its actual
   box-origin selection plan, choose the descriptor whose native builder role
   is `Z_MAX`, then shell inward by `2`. No opaque ID grammar is constructed.
3. Verify `20512 mm³`, original bounds and real native material/void/exterior/
   boundary classifications. Undo shell creation to the real full box and Redo
   with the same authored feature and selection IDs.
4. Edit thickness to `3` (`29688 mm³`); check same-value no-op token preservation.
   Resize the original source box to `120×60×25` and require downstream replay
   with the same source/producer and removed-face intent.
5. Undo source resize, thickness edit and shell append in one chronology, then
   Redo all three. Preserve original IDs and feature high-water counters.
6. Refuse nonpositive thickness, genuine native collapse, a stale history edit
   and reuse of the already-removed top face. Compare accepted source/history,
   native metrics, counters, document and net resources. Opaque discovery tokens
   and the attempted candidate evaluation epoch may advance after failed work;
   those are recorded, not claimed to be accepted-state mutation. Read-only
   queries and no-op edits must preserve their complete captured state exactly.
7. Complete native Save and browser/server byte equality; fresh context/login/
   public Open; require identical semantic history/source counters and fresh
   session-only journal. Reedit thickness to `2.5`, Undo/Redo, resave and perform
   a second fresh Open verification of that reedit.

Analytic material volume is independently computed from the declared dimensions:
`W*D*H-(W-2t)*(D-2t)*(H-t)`. Absolute volume/bounds assertions remain `1e-6` in mm³/
mm. Classifications use independently selected points away from ambiguous edges,
plus explicit bottom/inner-floor boundary probes. Display mesh and engine-to-
engine agreement do not act as geometric truth. The native STEP, arbitrary
curved-shell and multiple-removal domains are outside this bounded E12 case.

## User-facing JavaScript example

`source-bound-shell.mjs` is ready for root to copy beside the existing Desktop
`examples/cad-agent.mjs`. Root owns app exports/index wiring. It never executes
on import, replaces existing work, builds native IDs or uses a private writer.
Its `createCadAgent` instance pins one current account/window/document for the
entire recipe; only intentional `open()` can adopt its accepted replacement.

Once the actual application exports this copied helper, ordinary browser usage
is:

```js
import {
  createSourceBoundShellExample,
  SHELL_ENGINE_REVISION
} from './source-bound-shell.mjs';

const api = globalThis.codiDesktopCommands;
const windows = [...new Set(api.list()
  .filter(row => row.appId === 'jsketcher')
  .map(row => row.windowId))];
if (windows.length !== 1) throw Error('Choose one CAD window explicitly.');
const demo = createSourceBoundShellExample({
  api, windowId: windows[0], engineRevision: SHELL_ENGINE_REVISION
});
const binding = await demo.build();
await demo.editThickness(binding, 3);
await demo.resizeBox(binding, {width: 120, depth: 60, height: 25});
await demo.travel('undo');
await demo.travel('redo');
await demo.save('/My-shell.jsketcher.json');
// Await normal My files synchronization before testing another browser session.
// Intentional ordinary Open keeps its accepted receipt and rebinds only to the
// exact replacement document token supplied by that public operation:
await demo.open('/My-shell.jsketcher.json');
await demo.editThickness(binding, 2.5);
await demo.save();
```

The Node workflow loads these exact example bytes with only its relative helper
import rebound to the pinned Desktop helper. Its API proxy delegates every
request to the actual browser registry, preserving expected-document-token
dispatch and refreshing real descriptors after settlement. This is explicitly
**Node-transport recipe execution**, not a claim of served browser-module export
or of a separate human UI interaction. Root's later Desktop copy/build can make
that additional served path available without changing authored intent.
