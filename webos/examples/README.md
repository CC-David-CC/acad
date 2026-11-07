# Browser CAD command examples

[Linked part drawing commands](linked-part-drawing.md) now have an on-disk
`linked-part-drawing.mjs` helper for caller-supplied authentic definitions,
create/replace/remove, shared Undo/Redo, SVG export and native Save/Open.
It uses the existing public document-bound agent, performs nothing on import,
and adds no app-entry export. This source-only addition awaits full workflow
qualification; installed commands and measurement support must be discovered.

[Printable parts and material assignments](printable-parts.md) documents the new
shared transaction commands. Source only; combined browser acceptance pending.

The [source-bound sweep example](source-bound-sweep.md) is now present in source,
pending combined signed-runtime qualification. Its exported helper uses the same
public commands for genuine two-plane source authoring, creation and Save.
Its presence does not imply the deployed beta contains the sweep API.

The new [source-bound pattern recipe](source-bound-pattern.md) uses the generic
owned part path, semantic holes and outer edge treatments. Its JavaScript lives
in `source-bound-pattern.mjs`, exported as `createSourceBoundPatternExample` by
the app entry. It is awaiting fresh signed-runtime qualification and is not
included in the historical public R4 result below. Discover installed commands
before attempting it; the old separate-mount bracket recipe is a different path.

Use these JavaScript examples in the **outer signed-in desktop page**.
They call `window.codiDesktopCommands`; a button, person or future agent uses
this same API. No AI provider, injected geometry or private history writer is
needed. `cad-agent.mjs` is the shared implementation for the Agent tools panel.

## Document binding in the new source helper

The current source helper requires every command for the chosen window to expose
one current `documentToken`. Loading, detached, unbound or older command services
without a token refuse before any helper command is sent. This new contract is
pending combined-runtime qualification; it does not retag the historical public
R4 result below.

One helper pins that opaque token for its entire lifetime, including every
`execute` in a multi-step recipe. External New/Open in the same window makes the
helper stale. Create a new helper for the replacement document. The registry
checks `expectedDocumentToken` synchronously immediately before dispatch, after
argument JSON serialization; a preliminary inspection alone is not a guard.
Earlier accepted transactions retain their actual outcomes. The helper's own
explicit `newProject()`/`open()` may adopt only the accepted receipt's token when
it still matches the current public list. A later replacement preserves that
accepted receipt but leaves the helper stale. Saving or changing a path does not
change the authoritative document signal or its token.

The registry accepts at most64 KiB of UTF-8 JSON argument metadata per command,
disclosed as `argumentMaxBytes` in command descriptors. This total bound includes
all argument keys and strings; individual field limits also apply. It changes no
file-size/storage limits and does not transport model snapshots. Direct registry
calls without `expectedDocumentToken` remain supported; those callers do not get
whole-recipe document binding automatically.

## Build availability

Beta static `337b69de…` now includes the helper export, visible **Agent tools**
menu beside File and guarded public New/Open commands. The app is **CAD Modeler
(JSketcher inspired)**. Actual public workflows pass create/edit/refuse/travel,
normal native Save/Open and the scoped DXF/3MF recipes. Always discover installed
commands first; this does not imply the full22-exercise gate is complete.

## Discover and choose a window

Open CAD Modeler and wait for “New model.” In Chromium Developer Tools →
Console, choose the outer desktop page, then run:

```js
const commands = window.codiDesktopCommands.list();
console.table(commands.filter(c => c.appId === 'jsketcher'));
const ids = [...new Set(commands.filter(c => c.appId === 'jsketcher')
  .map(c => c.windowId))];
console.log(ids);
// When several CAD windows exist, explicitly choose the intended ID.
const windowId = ids.length === 1 ? ids[0] : 'YOUR_WINDOW_ID';
const call = (command, args = {}) => window.codiDesktopCommands.execute({
  windowId, command, args
});
console.log(await call('inspect'));
```

Descriptors include descriptions and argument schemas. Revisions are opaque;
inspect again before each mutation. Never guess geometry IDs.

## Direct creation calls, without the helper

In a separate new CAD window:

```js
const r = await call('inspect-rectangle-creation');
const created = await call('create-rectangle-sketch', {
  revision: r.revision, unit: 'millimeter', origin: [0, 0],
  width: 100, height: 50, depth: 0
});
const f = await call('inspect-worker-features');
const region = f.extrusionCandidates.find(c =>
  c.faceId === created.faceId && c.regionId === created.regionId);
if (!region) throw Error('No supported extrusion candidate.');
await call('create-worker-extrusion', {
  revision: f.revision, ...region, depth: 20
});
```

This creates actual unsaved geometry. Do not run the complete empty-model demo
in this same window afterward: it will refuse rather than replace that work.

## Load the shared helper in a build containing Agent tools

The app's entry exports `createCadAgent`. Find its already-loaded immutable
module URL rather than copying a stale content hash:

```js
const urls = [...new Set(performance.getEntriesByType('resource')
  .filter(e => new URL(e.name).origin === location.origin &&
    /\/apps\/jsketcher\/[a-f0-9]{64}\/index\.mjs(?:\?|$)/.test(e.name))
  .map(e => e.name))];
if (urls.length !== 1) throw Error('Select the current CAD app module URL in Network.');
const {createCadAgent} = await import(urls[0]);
if (!createCadAgent) throw Error('This build does not export the examples yet.');
const cad = createCadAgent({windowId,
  onStep: ({command, phase, error}) => console.log(command, phase, error ?? '')
});
console.table(cad.discover());
```

App source can import directly from `./examples/cad-agent.mjs`. The helper
refuses ambiguous window selection, overlapping helper operations, nonempty
demo targets and ambiguous geometry candidates. Multi-step examples consist
of separate accepted transactions: failure does not undo earlier steps.

## Build, edit, reject, undo and redo

Use a new, empty, unsaved window:

```js
await cad.buildBracket(); // 100×50×20 mm plate, central Ø10, four Ø4 holes.
await cad.resizeBracket(); // 150×30×35 mm; dependent holes regenerate.
console.log(await cad.verifyRejectedEdit()); // Oversized holes; inspect refusal.
await cad.travel('undo');
await cad.travel('redo');
console.log(await cad.inspect());
```

“Bracket demo” means this supported five-hole mounting plate. It does not
promise bent geometry, fillets, arbitrary profiles or full CAD1/CAD2. The
rejection example compares published bodies and returns the actual refusal;
it is not an independent proof of solver or kernel correctness. The demo
uses the qualified OCC path without automatic engine switching.

## Native Save and Open in My files

```js
console.log(await cad.save('/My-bracket.jsketcher.json'));
await cad.save(); // Same open document path/version.
const fresh = await cad.newProject(); // May ask about unsaved work.
if (fresh.status === 'cancelled') console.log('Kept the current project.');
console.log(await cad.open('/My-bracket.jsketcher.json'));
```

New/Open require their commands to be listed in the running build. Earlier
beta: use Applications for another window and File → Open or Files to reopen.
The new commands use the normal staged open/dirty confirmation, not raw JSON
injection. A cancelled result does not mean a new/open operation succeeded.

First-save paths must be new. A saved project uses its existing path; use
File → Save a copy for a different one. A Save receipt proves browser
persistence; `serverStatus: 'not-verified'` is not server durability. Wait for
Files' sync status. On `possiblyCommitted`, inspect Files and reconcile;
never retry an uncertain write blindly. Files remain account-scoped, backed
by browser storage/server disk, separate from temporary Linux and PC Download.

## Explicit supported exports

```js
console.log(await cad.exportSketchDxf('/My-bracket-sketch.dxf'));
console.log(await cad.exportCore3mf('/Manufacturing-model.3mf'));
```

The mounting-plate demo currently has no eligible DXF target, so that call
refuses honestly. DXF exports a supported saved sketch in sketch-local
millimeters, not the 3D solid. The standalone Circle example below is a
qualified positive DXF workflow.
With multiple candidates, use `inspect-sketch-dxf-exports` and
`export-sketch-dxf` directly with an explicitly selected `faceId`.

Core 3MF requires supported, current, material-assigned manufacturing geometry,
such as the qualified enclosure/body/lid/inset-label workflow. The plate demo
alone does not establish eligibility; unsupported/stale assignments are
refused. Exports need new paths and have separate browser/server outcomes.
The native project is the editable source; exports are handoffs. These
examples do not promise STEP, outside CAD import or slicer project support.

## Positive DXF example: a standalone circle

Use a build listing New/Open and the primitive commands. Stop if the user
cancels New, rather than continuing in their existing project.

```js
if ((await cad.newProject()).status !== 'opened') throw Error('New cancelled.');
const creation = await cad.execute('inspect-sketch-creation');
const plane = await cad.execute('create-empty-sketch-plane', {
  revision: creation.revision, unit: 'millimeter', plane: 'XY', depth: 0
});
const sketches = await cad.execute('inspect-closed-sketches');
const sketch = await cad.execute('inspect-closed-sketch', {
  revision: sketches.revision, faceId: plane.faceId
});
await cad.execute('append-sketch-primitive', {
  revision: sketch.revision, faceId: plane.faceId, stage: 0,
  kind: 'Circle', role: null, data: {c: {x: 3, y: 4}, r: 5}
});
await cad.exportSketchDxf('/Agent-circle.dxf');
```

The actual signed Agent tools workflow verified this circle's exported center
(3,4) and radius5 in millimeters, in addition to honest plate-export refusal.

## Positive core 3MF example: assigned enclosure

This uses the same public creation and assignment commands as the qualified
enclosure workflow. Material names are manufacturing identities; they do not
assert physical properties or simulation validity.

```js
if ((await cad.newProject()).status !== 'opened') throw Error('New cancelled.');
const features = await cad.execute('inspect-worker-features');
const enclosure = await cad.execute('create-worker-enclosure', {
  revision: features.revision, version: 2, unit: 'millimeter',
  width: 100, length: 70, height: 30, wall: 2, clearance: 0.3,
  lidThickness: 2, lipDepth: 3, labelWidth: 40, labelLength: 20, labelDepth: 1
});
const materials = await cad.execute('inspect-enclosure-materials');
if (!materials.featureIds.includes(enclosure.featureId)) throw Error('Missing enclosure target.');
await cad.execute('assign-enclosure-materials', {
  revision: materials.revision, featureId: enclosure.featureId,
  roles: {
    BODY: {material: {id: 'pla', name: 'PLA'},
      appearance: {id: 'body-blue', name: 'Blue', color: '#3366cc'}},
    LID: {material: {id: 'pla', name: 'PLA'},
      appearance: {id: 'lid-blue', name: 'Blue', color: '#3366cc'}},
    LABEL: {material: {id: 'tpu', name: 'TPU'},
      appearance: {id: 'label-white', name: 'White', color: '#ffffff'}}
  }
});
await cad.save('/Agent-enclosure.jsketcher.json');
await cad.exportCore3mf('/Agent-enclosure.3mf');
```

Both exact code fences passed in an actual signed browser on the R3 private
candidate: these material IDs/colors, native Save/server sync and fresh Files
reopen. Independent core 3MF checks verify two objects, three regions, winding
and the intended interface. See [exact recipe proof](../../../../research/beta-cad-agent-recipes-20261106/README.md).
Later phone-menu ordering does not change these commands or example bodies.
Geometry edits can make assignments stale: inspect/propose/confirm their rebind explicitly
before exporting a changed design. Native saves remain the editable source.

## Lifetime and evidence

The optional helper `signal` stops subsequent example steps; it does not
cancel an already pending public command. Registered app handlers own
in-flight lifetime checks, and Close/account changes invalidate the window.
A command accepted before cancellation remains accepted. Inspect after an
uncertain outcome; no hidden retry or batch rollback is performed.

Command schemas/handlers: `../*-commands.mjs`. Registry:
`../../../../active-system/assets/desktop/command-registry.mjs`.
Actual geometry and file regression tests:
`../../../../test/agent-cad-corpus/selected-profile-capacity-combined/composition/`.
Actual deployed beta receipts:
`../../../../research/beta-cad-public-acceptance-20261106/`.
These older receipts keep their original source/build pins, not new UI pins.

### Native point observation (bounded signed qualification passes)

The shared command `classify-worker-solid-points` accepts exact fields
`revision,version:1,unit:'millimeter',engine:'occ',engineRevision,bodyId,featureId,points`.
Use current `inspect-worker-solids` output to select the actual body/producer
and its runtime pin. Points are1–64 dense world-space millimeter triples within
±4,000,000. Initial core support is the explicit registered OCC sweep build and
a current unplaced valid single-solid at the full authored history tip, without
typed/project expressions. Unsupported domains refuse; there is no fallback to
preview mesh classification or an older live handle.

The response retains the binding, `quality:'native-re-evaluation-observation'`
and `points:[{point,classification}]`. Classifications are `inside`, `outside`,
`boundary`, or `unknown`; unknown stays unknown. The core privately re-evaluates
captured current history, checks the resulting native metrics/bindings, queries
the kernel, then retires temporary resources before returning. It does not save,
allocate authored IDs, or publish geometry. This is a kernel observation, not a
continuous geometric or physical certificate. The adapter's tests cover metadata
and lifetime routing only. Separate signed native proof passes13queries/77points over four saved-source fixtures; see desktop test/agent-cad-corpus/sweep/signed-point-evidence-r1. Full capacity/general domains/interruption remain unqualified.
