# Numeric owned edge-treatment journal

This lane changes only `web/app/cad/craft/authoredEditJournal.mjs` and this new
test directory. It extends the existing64-entry/8MiB journal, branch handling
and travel logic. No Craft/public/native/Worker/controller/model/Files edits,
second history, fake geometry, UI or browser qualification.

Exports:

```js
captureSolidEdgeTreatmentParameters(parameters)
recordSolidEdgeTreatmentEdit(state, {
  document, revision, index, featureId, parameters, after
})
planSolidEdgeTreatmentTravel(state, {
  document, revision, direction, index, featureId, parameters
}) // => {index, featureId, size, next}
```

Exact authored parameters are version1, millimeter, OCC, engineRevision,
featureId, target, producerFeatureId, kind(fillet/chamfer-equal), ordered edgeIds
and numeric size. The target must equal the existing canonical
solidBodyId(producerFeatureId), and producer differs from this feature.
Edges are1–16 distinct nonempty data strings≤16384 units. Capture detaches/
freezes their array. It mirrors the real operation capture's data admission;
it neither resolves opaque IDs nor proves a runtime is installed or a size is
geometrically feasible. Numeric size remains >0 and≤1e6, without coercion or
silently substituting a valid value.

Entry kind is **solid-edge-treatment**. Only before/after size is editable.
Identity includes version/unit/engine/exact build/target/producer/kind and the
exact ordered edge-ID values. FeatureId and history index are separately bound.
Travel refuses any mismatch, including a valid alternate target/build/kind or
edge reordering. Equal freshly parsed values work without array-reference
equality. The journal only proposes a next state; Craft must independently
evaluate and publish the complete candidate before installing it.

New entries charge conservative serialized UTF-16/UTF-8 identity bytes through
the existing eviction mechanism. Counting uses bounded field/ID fragments,
not one large joined JSON string or a hash. This is a retained metadata budget,
not a JS/WASM heap or RSS measurement. Same-size proposals refuse without
journal churn, matching existing scalar journal helpers; the public command
will decide how to expose no-op receipts.

## Narrow old-kind fix

Source971fd8ea1 had no entry.kind check in planExtrusionTravel. Actual execution
of that complete Git module demonstrates a selected-profile-depth entry being
accepted as extrusion travel when scalar/index/feature values happen to match.
`before-kind-guard.json` records the source hash and observation; the script
imports the full old module rather than extracting/transpiling a closure.

With owner approval, the only changed old behavior is refusing an entry whose
kind is not extrusion-depth. Existing missing-entry wording and legitimate
extrusion travel stay unchanged. Regressions cover both selected-profile-depth
and the new solid-edge-treatment scalar entries, while proper old extrusion
still undoes correctly.

## Checks

```sh
node --test test/edge-treatment-journal/journal.test.mjs \
  test/mechanical/authored-edit-journal.test.mjs \
  test/selected-profile-depth/journal.test.mjs \
  test/selected-profile-depth-review/journal.test.mjs
node test/edge-treatment-journal/before-kind-guard.mjs /tmp/before.json
CODI_SOLID_INTENT_MODULE=/absolute/current/modules/engine/solid/solidIntent.mjs \
  node test/edge-treatment-journal/parity.mjs /tmp/parity.json
```

Observed: **32/32 tests pass** (13 new plus19 existing), with no skips or weakened
assertions. Controls cover every immutable identity, numeric/no-op/stale refusal,
native-index/handle data rejection, accessors/dense arrays, detached input,
exact undo/redo, redo branching,64-entry bound, exact multibyte/escaped JSON
accounting, byte-budget eviction alongside old snapshots and cross-kind safety.
The largest data fixtures exist only at runtime; no giant identity file is saved.

Separate parity against the actual supplied core capture helper passes all48
cases (3 accepted,45 refused), recording both module hashes and checking the
core file stayed unchanged during execution. The product journal imports only
the existing stable solidBodyId helper; it does not depend on an uncommitted
new capture export. Parity compares supported data decisions/values, not error
wrapping or native feasibility.

No new browser, geometry, source-regeneration, native-save/reopen, caller-loss,
or public size-edit workflow is qualified here. Those are the next serial
Craft/engine integration acceptance steps.
