# Timestamp-only sketch Save candidate — 2026-11-05

Base CAD `0b9e38394ffbbf6478c69ed8a78b8f555a915053`. Runtime changes are
limited to `InPlaceSketcher.save`, the clock-only write in legacy
`reevaluateSketch`, and a data-only comparison helper. No physical
transaction, Worker/parser, cache consumer, host dirty logic or deployment change.
Root reviews before any combined app build or browser qualification.

## Scope and consumer review

The independent signed capture at desktop `907706d57` showed a fresh Files
reopen/no-edit Save-and-Exit changes only the stored sketch's
`metadata.expressionsSignature`. Opening with no save and repeated native
snapshots retain exact native bytes and `dirty:false`; an open-editor discard
prompt is a separate expected guard.

The producer `expressionsBundle.ts:105` assigns a RAM Date.now clock on table
publication. `sketcherBundle.ts:65–79` uses that stamp to conservatively decide
whether a sketch needs reevaluation. This candidate retains the producer and cache invalidation decision:
it neither overwrites the live signature nor labels old cached data current.
Future genuine expression changes still invalidate the old stored stamp.
Conservative extra reevaluation remains possible; cache freshness is not bypassed.

After existing recovery and boundary/frame guards and ordinary serialization,
Save compares the candidate with the current stored JSON. An identical sketch
or a difference solely in the **own**, safe numeric expression-clock
string (including its presence or absence) skips the storage write. All other fields, missing/extra metadata,
geometry, constraints, roles, array order and boundary/frame data are compared.
No numerical tolerance, geometric normalization or generic metadata exclusion
is introduced. Non-clock signatures are not ignored. Metadata objects themselves must remain
present and every other field must match.
The previous stored bytes are retained, rather than rewritten canonically.

Real geometry/constraint changes follow the existing writer. External typed
project-source intent remains outside this sketch comparison and stays dirty
even when its resulting sketch geometry is equal. Successful semantic-save
full-tip/journal integration requested by the server owner is a separate root-
coordinated change; no hook or transaction baseline change was added here.

## Focused verification — nine tests pass

Run with plain Node24.22.1, no bundler/build/dependencies:

```sh
node --test test/mechanical/noop-sketch-save.test.mjs
```

The tests use the captured actual0b9 named-D sketch/native project and extract
the candidate's actual Save method. View/geometry guard functions and the local
store are controlled test doubles: these are source-method/data controls, not
real solver, browser, signed host or native-kernel acceptance.

- Timestamp-only reserialization preserves exact stored text, reconstructed
  native envelope bytes and a clean byte-comparison result; repeated no-op Save
  emits no storage write. The live RAM clock is unchanged, and the old saved
  clock remains conservatively stale for its existing consumer.
- Every captured JSON leaf outside the clock (more than100) must remain
  meaningful. Changing it, adding unknown metadata, deleting boundary metadata
  or changing object order forces the writer path.
- Numeric diameter/geometry edits persist; named-D geometry plus typed project
  edits persist without dropping the authored name. A parameter-only source
  change with equal geometry still changes native project bytes/dirty state.
- Recovery, boundary and frame mismatches still refuse before any write.
  Missing/malformed old JSON and non-clock signature cases do not receive the
  timestamp exception. The actual freshly saved rectangle capture has a boundary
  frame and no clock; its first no-edit Save adds only a numeric clock. That
  clock addition/removal is now accepted while frame, object metadata, unknown
  metadata, malformed clocks and metadata-object changes remain meaningful.

Fixture SHA-256 `5e3d8ebf2b8f9fd39dd66e22d71330d867dae192ef3864d8af82bdec137e1b17`
comes from the synthetic test-model capture SHA
`e7603559f6dd531a0a4ab5c5d4b5a1936b45374c77909f652e22ab8cdb1f34db`.
Helper SHA-256: `6e8796da7ba7614037cdc1083c0f78ee74e929a7deb70f9c2f35df294bc45925`.

## Required combined check after review

On the matching root-built app, independently repeat fresh Files Open → no-edit
editor Save-and-Exit → unchanged native/store bytes, no storage write and
`dirty:false`. Retain the open-editor conservative guard. Then make a real
numeric and typed geometry/intent edit, verify changed native/store bytes and
`dirty:true`, and Save/sync/fresh-reopen through the host. Include genuine table
changes so cache invalidation is checked rather than merely ignored. No positive
fixed-browser pass, full worker-first performance, packaging or release claim
is made by these focused tests.

## Fresh primitive followup — exact0b9 negative control

Fresh public create-rectangle → normal host Save/sync → first editor no-edit
Save-and-Exit changed only absent `metadata.expressionsSignature` to
`"1793881852483"`; dirty false→true. All boundary/frame, objects, constraints,
model history and manufacturing data stayed equal. The server file hash stayed
`a9ab39e43acef041b07f43b09d4ed8054951ad4cc25c4e099bf3247ee2765fc0`:
no subsequent host Save occurred. The account/context were disposable and owned;
contexts closed. The first-save fixture contains only the synthetic model.

This followup changes the comparison helper and focused controls only; Save body
is unchanged from e2d4a34cb. Server owns any staged semantic-save integration.
This is an original-app negative control plus fixed-source tests, not yet a
fixed-app positive. Full capture SHA-256 `fe81862f4219b6ce73509d00bf8941f3ceacfd9919f2d60a0d4fe1df2538381f`.
First-save fixture SHA-256 `5126177452dbe7ecd4d8ffe999bed9ae67ff87f7affce6a90daa3063df9cca4b`.

## Known legacy clock writer — narrowly guarded

Exact0b9 signed fresh Files Open of a non-typed rectangle and a no-op
`expressionService.reevaluateExpressions()` preserve exact native bytes and
`dirty:false`. A controlled equal-value `table$.next({...table$.value})`
publication reaches the actual existing listener, headless Viewer refresh and
`reevaluateSketch` writer: the only native/source change is adding its numeric
clock; dirty becomes true. This injected publication proves the writer behavior,
not occurrence from an ordinary user gesture. A real legacy source/table change
to `unused = 1` changes model intent plus the sketch clock; its dirty state is
correct and must remain. No host Save occurs after either probe.

The one writer now reuses the same comparison before storage.set. Evaluation,
refresh, boundary provenance, signature mismatch checks and ID-generator reset
remain in their previous order. The old clock stays stale; reevaluation is still
conservative. Two extracted-source controls verify clock-only skips while
refresh/reset run, and that geometry/object metadata changes still write with
boundary/frame provenance. These controls fake the Viewer; matching fixed-app
legacy checks remain required after root review/build.

Legacy capture SHA-256 `0d8ef80b6b7f5c5c40ff2216e6fd4bc6b045fc8b9b9d6acec254b873af1baf97`.
The separate existing `expressionsUpdateTable` action throws
`services.extension.reevaluateExpressions is not a function` on0b9. That failed
first probe is retained; the passing source-service control does not claim the
action works. No unrelated action repair is included. The existing synchronous
headless Viewer is still legacy backend debt, not worker-first acceptance.

## Async-save test contract correction

The editor Save is now asynchronous and validates changed sketches in a Worker. This fixture suite tests only the data-only `unchangedSketchSave` comparisons and the separately extracted legacy reevaluate writer with a synthetic Viewer; it no longer extracts or executes a synchronous copy of the editor Save body. Its pass is not evidence of Worker execution, publication, cancellation, no-op race handling or browser Save behavior. Those require the focused async client/receipt controls and actual matching app/browser tests recorded separately.
