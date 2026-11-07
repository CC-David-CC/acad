# Explicit feature deletion and parent repair

Source-only adapter: discover these commands in the installed CAD window before
use. Root registers it after shared Craft integration. This addition runs no
geometry and has not itself been browser-qualified. It adds no history model,
private file writer or automatic native Save.

- `inspect-worker-feature-deletions {}` returns shared discovery. Initial scope
  is selected-profile extrusion only. `canDelete:true` permits an attempted full
  suffix replay; it does not certify absence of dependents.
- `delete-worker-feature {revision,index,featureId}` uses that inspected authored
  identity. Existing source planes/sketches remain. Incompatible dependents must
  cause atomic refusal, preserving the accepted part.
- `inspect-through-hole-parents {revision,index,featureId}` uses the current
  `inspect-authored-edits` revision and an actual centered-through feature from
  history. It returns explicit independent current parent/source alternatives.
- `repair-through-hole-parent {revision,index,featureId,bodyId,sourceFeatureId}`
  accepts one actual advertised pair. Private producer/face/region bindings are
  derived internally; callers supply no handles, Native ordinals, fabricated
  source contexts or new feature IDs.

Use the existing `createCadAgent` for the selected CAD window and pinned public
document token. These callable examples execute nothing until invoked:

```js
async function inspectAlternativeParents(cad, {index, featureId}) {
  const edits = await cad.execute('inspect-authored-edits');
  return cad.execute('inspect-through-hole-parents', {
    revision: edits.revision, index, featureId
  });
}

async function chooseParent(cad, parents, selected) {
  if (!parents.candidates.some(row => row.bodyId === selected.bodyId &&
      row.sourceFeatureId === selected.sourceFeatureId)) {
    throw Error('Choose an actual advertised pair explicitly.');
  }
  return cad.execute('repair-through-hole-parent', {
    revision: parents.revision, index: parents.index,
    featureId: parents.featureId, bodyId: selected.bodyId,
    sourceFeatureId: selected.sourceFeatureId
  });
}

async function deleteSelectedExtrusion(cad, selected) {
  const info = await cad.execute('inspect-worker-feature-deletions');
  if (!info.features.some(row => row.index === selected.index &&
      row.featureId === selected.featureId && row.canDelete)) {
    throw Error('Select an actual currently advertised extrusion.');
  }
  return cad.execute('delete-worker-feature', {
    revision: info.revision, index: selected.index, featureId: selected.featureId
  });
}
```

Do not automatically choose the first parent: congruent bodies are distinct
references. Discovery does not certify source shape or child compatibility. The
normal shared replay remains geometry authority. A failed repair must preserve
children and last-good state; a child's old-parent edge selection may force
refusal rather than silent retargeting. There is no nearest-body/ordinal fallback.

Receipts describe volatile workspace edits. The existing `travel-authored-edit`
command supplies session Undo/Redo; normal native Save, Files sync and Open are
separate. No backend switch, source deletion or server durability is implied.
Lifecycle loss may leave an unknown outcome: preserve committed/possibly-committed
errors and inspect before retrying. Valid linked drawing intent is retained and
may become honestly unresolved. Assigned manufacturing metadata, typed bindings
and other unsupported scenes may refuse in this bounded initial slice.

The bridge captures exact own scalar fields, the actual Craft service method,
window/account/document token and host signal before dispatch. Async inspection
and edits use the existing scoped settlement helper. It does not register itself
on import, alter the active app index or create UI.
