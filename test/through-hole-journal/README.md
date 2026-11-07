# Source-bound through-hole authored-edit journal

**PASS15 new groups +46 retained groups**. This lane changes only the existing
`authoredEditJournal.mjs` and adds these tests/evidence. It performs no geometry,
Worker, browser, native persistence, source reconstruction or public command
qualification. No new journal, document copy or feature-creation Undo is added.

The new helpers are:

```js
captureThroughHoleParameters(parameters)
recordThroughHoleEdit(state, {
  document, revision, index, featureId, parameters,
  after: {diameter} // centered
  // or {diameter, offsetX, offsetY} for four corners
})
planThroughHoleTravel(state, {
  document, revision, direction, index, featureId, parameters
}) // -> frozen {index, featureId, dimensions, next}
```

Capture delegates to the one canonical `captureOwnedHoleIntent` parser for
WORKER_THROUGH_HOLES_V1's full12/14 parameters. The journal entry kind is
`through-hole`. Eleven non-dimension identity fields, including featureId,
source feature/face/region, current target/producer, kind, unit and backend
revision, remain exact immutable primitives. Before/after store only the numeric
diameter (center) or diameter/offsetX/offsetY (corners). Unknown/accessor fields,
coercion, nonpositive/nonfinite values and exact no-ops refuse. Positive finite
primitive values are not rounded or converted; geometric feasibility is evaluated
by the caller, not this pure journal.

Travel requires the same document/revision/index/feature, full canonical identity
and exact current dimensions. Returned next states are proposals. The caller
still validates WORKER_THROUGH_HOLES_V1, current full-tip ownership and native
replay, then atomically publishes both model and journal only on success.

Entry byteSize charges the full serialized identity and both dimension records
conservatively for UTF8/UTF16 plus fixed metadata. `through-hole` participates in
the existing64-entry/8MiB oldest-first trim. Tests prove this charge changes mixed
snapshot eviction, rather than silently using the old256-byte fallback.

Run:

```sh
node --test test/through-hole-journal/journal.test.mjs
node --test test/mechanical/authored-edit-journal.test.mjs test/edge-treatment-journal/journal.test.mjs test/selected-profile-depth/journal.test.mjs test/selected-profile-depth-review/journal.test.mjs test/legacy-expression-refresh/journal.test.mjs test/typed-bracket-bindings/journal.test.mjs test/typed-enclosure-bindings/journal.test.mjs test/review-reference-repair/repair-journal.test.mjs test/smlib-integration/solid-journal.test.mjs
```

First executions passed; exact logs and source hashes are retained under
evidence/. Existing tests/assertions are unchanged. Geometry/controller/craft
hooks, browser validation, source/depth replay and Save remain separate work.
