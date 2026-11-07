# Source-bound inward shell

**Source only; complete signed workflow qualification is pending.** This helper
is present on disk and performs nothing on import. Its presence does not imply
that the current app entry exports it, the mounted runtime contains the new
Native cohort, or arbitrary shell geometry has been qualified. Discover actual
installed commands first. Root owns app-entry registration/exports.

`source-bound-shell.mjs` exports `createSourceBoundShellExample` and the explicit
`SHELL_ENGINE_REVISION`. It uses the existing document-bound `createCadAgent`.
Its `build()` requires a new empty unsaved window; it does not replace work.
Every mutation goes through the same public registry used by a person or agent.

The example explicitly creates a genuine native box, inspects its actual
box-builder face descriptors, chooses `Z_MAX`, and passes that descriptor's
opaque ID to the shell command. It never constructs an ID, sends a native face
ordinal or handle, writes private history, or makes a box-subtraction cavity.
Its saved shell intent retains the selected source face, producer, exact build,
inward direction and thickness. Source-box changes replay that same intent.

Once these commands and the explicit Native build are actually mounted:

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
const binding = await demo.build(); // 100×50×20 mm, top open, thickness 2 mm
await demo.editThickness(binding, 3);
await demo.resizeBox(binding, {width: 120, depth: 60, height: 25});
await demo.travel('undo');
await demo.travel('redo');
await demo.save('/My-shell.jsketcher.json');
// Await ordinary My files synchronization before using another browser session.
await demo.open('/My-shell.jsketcher.json');
await demo.editThickness(binding, 2.5);
await demo.save();
```

The shared agent pins the window/account/document across recipe steps. Only an
intentional accepted Open can adopt its exact replacement document token. A
later command refuses after unrelated document replacement; an already accepted
receipt remains accepted. No mutation is retried automatically. Save/Open use
the existing file coordinator, not an example-specific persistence mechanism.

The independent complete-workflow expectations are `20512 mm³` at thickness 2
and `29688 mm³` at thickness 3 for the original box:
`W*D*H-(W-2t)*(D-2t)*(H-t)`. These are analytic acceptance targets, **not observed
results in this source checkpoint**. Genuine native metrics, material/void reads,
source/thickness edits, invalid/collapse rejection, shared append/edit travel,
Save/sync/fresh Open/reedit and cleanup still need the composed full workflow.
Multiple removed faces, curved shells and broader native offset domains remain
unqualified. Generated walls/rims are not invented persistent named faces.

Recommended root app-entry exports, after composition:

```js
export {
  createSourceBoundShellExample,
  SHELL_ENGINE_REVISION
} from './examples/source-bound-shell.mjs';
```

The companion transport helper is `registerShellCommands(host, getTarget)` from
`shell-commands.mjs`. Root should register it with the same current Craft target
and disposer collection used by the other feature adapters. Four public names
map directly to the four shared Core methods:

| Public command | Core method |
| --- | --- |
| `inspect-worker-shells` | `inspectWorkerShells` |
| `create-worker-shell` | `createWorkerShell` |
| `inspect-worker-shell-history` | `inspectWorkerShellHistory` |
| `edit-worker-shell` | `editWorkerShell` |

Transport accepts only exact own data and dense unique face IDs, detaches/freezes
them before asynchronous Core work, and uses existing scoped settlement. Core
owns build/selection/native validation, allocation, journal and publication.
No tests or build were run for this source assembly checkpoint.
