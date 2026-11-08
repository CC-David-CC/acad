# Browser CAD command examples

[Projected distance recipe](projected-distance.mjs) is the exact public-command
helper used by qualified complete workflow ACAD4325ef1, actual
Core0133698/Desktop95d8023b0. Start with a normal fresh project and its existing
document-bound agent. Importing the helper does not author anything:

```js
const recipe = createProjectedDistanceExample(agent);
const sketch = await recipe.build();
await recipe.euclidean(sketch, 5);
await recipe.projected(sketch, -3);
await recipe.edit(sketch, 3);
```

Import `createProjectedDistanceExample` from this module. The direction is the
actual inspected live Segment, not a frozen vector or reference measurement.
Creation, positive/zero/negative scalar edits, direction rotation/reversal,
named length formulas, removal, typed point movement, mixed Undo restoring the
binding and three normal .cad Save/server/fresh Open cycles passed the complete
browser run and FIRST independent equations/archive oracle. Use the desktop's
normal Save/Open commands separately; the helper does not write raw source.
Typed point edits retain bindings and prove supported Undo before publication;
the finite travel domain is1..32 changed supported point handles in one stage.
No general typed-mutation, arbitrary reference-role or native BRep claim.


[Point coincidence recipe](point-coincidence.mjs) is the exact helper used by
qualified whole workflow6407d6b (actual Core8353d12/Desktop8eac41c9e). Pass the
existing document-bound agent. It authors genuine points, discovers actual IDs,
and uses public symmetric coincidence; same/reversed duplicate preserves the
real row, while a distinct transitive pair is actually redundant. Normal Save/
Open remains separate. Three save/reopen cycles, Native suffix and original
point-equation/rational-rank checks pass. No identity welding or raw source writes.


The finite two-Circle hardcoded public path is qualified in ACAD's
`test/circular-arrangement-workflow/desktop-driver.mjs` with its README and
QUALIFICATION.md (proof235b8de). It uses genuine source creation and actual
`inspect-selected-profiles`/`inspect-selected-regions` results before
`create-selected-extrusion`; never construct opaque region IDs yourself.
Supply the explicitly staged9789a617/707facb3 engine revision. Source dimension
and region repair require actual discovery/current revisions. Fifteen .cad
Save/server/freshOpen checkpoints and the independent artifact checker pass.
This is finite Circle-cell support, not general mixed-curve arrangements.


[RadiusLength recipe](radius-length.mjs) is the exact public-command helper used
by the qualified finite Circle/quarter-Arc workflow (Core d0069f0, Desktop dd58df71e).
It discovers actual identities, anchors centers, creates/edits/removes radius,
and extrudes the Circle through an explicitly selected verified engine build.
Import `createRadiusLengthExample`, pass the existing document-bound agent, then
use `const part = await recipe.circle(); await recipe.create(part, 5);` and
`await recipe.dimension(part, 'RadiusLength', 6)`. Normal public Save/Open remains
separate. Three save/reopen cycles, mixed travel and dependent Circle solids
passed; Arc BRep and generator-bearing radius transitions are not qualified.


[Midpoint and directed angle groups](sketch-constraint-groups.md) provides a new
source-only public example with actual inspected point/segment IDs, atomic
constraint groups, source edits, shared travel and normal Save/Open. Composed
signed-runtime qualification is pending.

The [source-bound shell example](source-bound-shell.md) is a new on-disk helper
for a genuine native box, discovered builder-semantic top face and inward shell.
It uses shared thickness/source replay, travel and normal Save/Open. Source only:
the complete composed signed workflow and app-entry export are pending; no
Native-success or arbitrary-shell claim follows from this addition.

[Explicit deletion and parent repair](reference-repair.md) describes the new
source-only shared reference commands. They require actual discovery, checked
replay and separate Save; candidate eligibility is not a geometry guarantee.

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

## Inspection coordinates and saved intent

`inspect-closed-sketch` reconstructs and validates a solved copy of the saved
sketch. Returned coordinates are in sketch-local millimeters. They may differ
from stored coordinates within the applicable reconstruction budget; inspection
does not rewrite the saved source. Stable entity IDs and revision-bound commands
identify the authored objects. Do not infer a source edit from a small replay
coordinate difference, or treat reconstructed coordinates as exact saved bytes.
Numerical accuracy against an independent reference and source-to-replay drift
are separate checks, even when both use the same tolerance.

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

The modern typed-parameter recipe is `source-bound-parameters.mjs`, exporting
`createModernParametersExample({engineRevision, ...cadAgentOptions})` and
`mechanicalParameterDefinitions()`. Choose a genuinely staged explicit build that
supports selected profiles and modern through holes. `build()` authors a numeric
100×50×20 plate and five holes in a new empty document; `bind(receipt)` links the
actual selected rectangle width/height, depth and hole dimensions to the returned
length definitions. `replaceDefinitions(definitions)` edits directed formulas
through the existing shared parameter transaction and journal. For example, replace
`width`'s expression with `mm(120)` to drive height60 and depth24; a separate
`edge: mm(14)` edit moves the corner holes. `inspect()`, `travel('undo'|'redo')`,
`setDisplayUnits('inch'|'millimeter')`, `save(path)` and `open(path)` use ordinary
public commands and the helper's pinned window/document scope. Save/Open is
intentional; do not reuse a stale helper after an unrelated document replacement.

This recipe is source-ready pending its complete composed application workflow.
It evaluates a dependency graph, not simultaneous equations. Only the canonical
selected rectangle/extrusion and modern through holes are integrated with typed
parameters in this slice. Other generic families and typed STEP/3MF/drawing export
remain explicit gaps. All feature/source/opaque region IDs come from actual
receipts or discovery; importing the module performs no authoring or upload.

`source-bound-history.mjs` provides `createSourceBoundHistoryExample` using only
public commands and the existing document-pinned agent. Supply an actual staged
modern `engineRevision`; it never substitutes an engine. `build()` authors a
100×50×20 source rectangle/extrusion, an unrelated box, and a centered D10 hole.
Use `inspect()` and the returned authentic feature IDs with `suppress(id,true|false)`.
`prefix(id)` evaluates a prefix while retaining the future; `branch()` explicitly
commits that inspected prefix before `createCenteredHole(...)` can append a new
feature. `travel`, `save` and `open` remain the shared operations. No IDs or native
geometry are seeded. Suppression and branch are **source-ready, unqualified**
until the composed full public workflow runs. Only the finite numeric modern
families advertised by actual discovery are supported; active-child, assigned
output and source-plane suffix dependencies refuse rather than retarget/delete.
The helper is not auto-executed or exported from the app index by this packet.
Root registration: import `registerFeatureHistoryCommands` from
`./feature-history-commands.mjs` and register it through the existing
`host.onDispose(...(host,()=>rectangle.target()))` mount pattern.

`source-bound-frame.mjs` exports `createSourceBoundFrameExample` for explicit
numeric custom source frames and earlier-source-plane attachment. Import it,
create a helper for one signed CAD window, then call its methods deliberately.
`build()` requires a new empty document and returns genuine parent/child source
receipts. `parentPose`, `pivot`, `points`, `travel`, normal `.cad` Save/Open use
registered shared commands and one pinned document token. It never invents a
source, region, Native face ID or geometry model. Add primitives/selected
extrusions using actual public discovery and returned source IDs. This is
the Phase A source-plane recipe. Its saved meanings remain unchanged. Native
extruded-face attachment uses the separately staged Phase B path below; the
Phase A recipe alone never establishes that capability.

`source-bound-native-frame.mjs` prepares the separate Phase B example,
`createSourceBoundNativeFrameExample`. It requires the new explicitly staged
planar-attachment capability. Given an actual public extrusion/body receipt,
`discover` obtains genuine native observations; `attach` selects the single
measured last cap and creates an independent sketch source. `depth`, explicit
`repair`, shared `travel` and ordinary `.cad` `save`/`open` use registered shared
operations and the same pinned document helper. Author local primitives and
selected extrusions with their normal public commands and actual returned IDs.
No native IDs/face ordinals, geometry seeds, automatic execution or AI service.
The corresponding finite full-tip Native attachment flow is qualified R2 (ACADd82b3c1); arbitrary faces remain open.


Numeric principal placement uses the existing createCadAgent helper for an
explicit signed CAD window. Inspect actual features and choose a returned face
ID; do not parse or invent it. The following runs only when deliberately called:

```js
async function placePrincipal(agent, chosenFaceId, orientation, depth) {
  const i = await agent.execute('inspect-source-plane-placements');
  const rows = i.features.filter(row => row.faceId === chosenFaceId);
  if (rows.length !== 1 || !rows[0].canEdit) throw Error('Choose an editable inspected source.');
  const p = rows[0];
  return agent.execute('edit-source-plane-placement', {
    revision: i.revision, index: p.index, featureId: p.featureId,
    faceId: p.faceId, orientation, depth
  });
}
```

Orientation is XY/XZ/ZY; depth is signed finite millimeters within advertised
bounds. Save/open/travel use existing explicit helper methods. No AI provider,
private state injection, automatic execution or uncertain-write retry. The
corresponding command workflow has finite R4 qualification ACAD25fc19e on
Core6f6ccef/Desktopc8779dd83, including Native closure/4file cycles/64-entry trim
and independent oracle. This recipe is transport guidance, no separate geometry
proof or promise for unsupported families.


`sketch-mirror.mjs` exports createSketchMirrorExample for one explicitly chosen
signed CAD window. Nothing runs on import. Its build() recipe requires a normal
empty document and authors actual supported primitives and one real generator
through registered shared commands. Keep its returned binding for point,
diameter, arc, axis, travel, save and open methods; never fabricate/parse IDs.
The same actual recipe participates in finite whole R2 qualification24f4269,
Core104c24e/Desktop9bdb3a512, with3.cad files/two fresh Opens, ordinary source
edits/conflict recovery and six malformed-file refusals. Stored/cold geometry
are independently checked against Fraction/90-digit reflected-locus truth.
Scope is Point/Segment/Circle/Arc sketch generation; no BRep/ellipse/cubic/Slot
or all-C01 promise. Source-producing/checker failure history remains frozen.
