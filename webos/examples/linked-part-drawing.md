# Linked part drawing commands

`linked-part-drawing.mjs` is an on-disk JavaScript example. It calls only the public
registry through `createCadAgent`; importing it performs no command. This source
addition has not been executed or qualified in a browser. Discover installed
commands first. It is not a new app-entry export, and no immutable served URL is
assumed. App source can import it as `./examples/linked-part-drawing.mjs`; a module
beside this document uses the relative import below. Build exposure is separate.

Use the outer signed-in desktop page, not the CAD iframe. Select the intended
existing CAD window from `codiDesktopCommands.list()`. That list supplies command
descriptions/schemas, window IDs and opaque document tokens. Never derive
references from URLs, labels, coordinates, Native ordinals or display edges.

```js
import {createLinkedPartDrawingExample} from './linked-part-drawing.mjs';

// A callable example; defining/importing it does not execute commands.
function forDrawingWindow({api = window.codiDesktopCommands, windowId, signal}) {
  const listed = api.list().filter(row =>
    row.appId === 'jsketcher' && row.windowId === windowId);
  if (!listed.length) throw Error('Select an actual current CAD window.');
  const drawings = createLinkedPartDrawingExample({api, windowId, signal,
    onStep: event => console.log(event.command, event.phase, event.error ?? '')
  });
  const discovery = drawings.discover();
  if (discovery.missing.length) {
    throw Error('This build lacks: ' + discovery.missing.join(', '));
  }
  console.log(discovery.windowId, discovery.documentToken);
  return drawings;
}
```

The helper pins the document token once. External New/Open makes it stale even
in the same window. Create a new helper for that replacement. Its own explicit
`open(path)` adopts only the normal accepted Open receipt when still current.
A signal stops later steps; the submitted command owns its in-flight outcome.
Earlier accepted edits/files remain accepted if a later step fails. Never retry
committed or uncertain operations automatically.

## Supply authentic authored definitions

The caller supplies the existing linked-part drawing definition schema. This
example invents no target, region, source point, edge, cap or hole reference.
Use actual construction receipts and current public inspection: selected-profile
history/source inspection for source feature/face/opaque region/curve IDs,
current edge-treatment or solid selection discovery for authored face/edge keys,
and through-hole history for a hole's feature/source binding. Discover command
names and supported cases from the installed descriptors. An unresolved authored
reference cannot be replaced by a geometric lookalike or nearest display edge.

A definition has exactly `version`, `unit`, `drawingId`, `title`, `target`,
`datum`, `sheet`, `views`, and `dimensions`. Canonical unit is millimeter. Use
1–3 unique views in top/front/right subsequence order and at most16 dimensions.
Sheet/paper coordinates and scale are presentation, not edits to the part.
Datum components use `datum-x`/`datum-y`; cap separation uses `datum-normal` in
front/right, not top. The dimension kinds are `source-distance`, `plane-distance`,
`edge-length`, `hole-diameter`, and `hole-offset`. The registry describes their
variant fieldsets; the shared manager/Worker validates the complete schema.
Definition admission does not prove Native reference resolution or measurement.

The request wrapper plus all IDs must fit64KiB UTF-8. Individual field limits
also apply. The helper captures bounded own-data metadata before its first await.
Accessors, sparse arrays, cycles, symbols and nonfinite values are rejected.
Neither model snapshots nor solved geometry are supplied to drawing commands.

```js
async function createReferenceDrawing(drawings, suppliedDefinition) {
  const created = await drawings.create(suppliedDefinition);
  console.log(created); // Retain the actual accepted receipt.
  const inspected = await drawings.inspect();
  console.log(inspected.definition, inspected.quality);
  return inspected; // authored-definition-only, not a measurement assertion.
}

async function retitleDrawing(drawings, title) {
  const current = await drawings.inspect();
  if (!current.definition) throw Error('No drawing to replace.');
  return drawings.replace({...current.definition, title});
}

async function removeSelectedDrawing(drawings, drawingId) {
  // Pass the actual ID from inspection, never a guessed ID.
  return drawings.remove(drawingId);
}
```

Create/replace/remove obtain fresh document and geometry revisions for the shared
command. Stale changes still refuse. Replacement retains the drawing identity;
removal requires an explicit ID. Exact no-op replacement preserves tokens/redo.
`drawings.travel('undo')` and `drawings.travel('redo')` use the existing shared
session journal. Inspect its target first when other edits may have occurred.
There is no separate drawing Undo stack; the session journal itself is not saved.

## SVG export and normal native Save/Open

```js
async function exportAndSaveDrawing(drawings) {
  // An authored drawing is required. Both paths must be new My files paths.
  const svg = await drawings.exportSvg('/Plate-reference.svg');
  console.log(svg); // Actual file receipt; unresolved refs are visibly labeled.
  const native = await drawings.save('/Plate.jsketcher.json');
  console.log(native);
  return {svg, native};
}

async function reopenDrawing(drawings, savedPath) {
  const opened = await drawings.open(savedPath);
  console.log(opened);
  if (opened.status !== 'opened') return opened; // Cancellation is not Open.
  return drawings.inspect();
}
```

SVG export first inspects the current drawing, then invokes the shared Native
read/export path for that revision. It may refuse an unsupported runtime/target
or produce an explicitly unresolved reference drawing. Conic SVG paths are
presentation approximations; dimension labels use separate observed facts with
ΔX/ΔY, ΔZ, L or Ø semantics. SVG is a derived handoff, not the editable source or
persistent reference authority.

Normal Save/Open uses My files and the native `.jsketcher.json` envelope. A saved
project uses its current path: call `drawings.save()` without a different path;
Save a copy remains a UI operation. Open is intentional document replacement and
may request normal dirty confirmation. Browser persistence and
`serverStatus:'not-verified'` are not server durability; wait for ordinary Files
synchronization separately. Inspect actual paths/versions before retrying an
uncertain write. This example adds no geometry or persistence qualification claim.
