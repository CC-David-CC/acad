# Project envelope and admission compatibility research

`codi-jsketcher-project` revision 2 has exactly `format`, `version`, `unit`,
`project`, and optional `manufacturing` at the top level. Its project holds `model`,
`sketches` and optional supported surfacing. It deliberately has no legacy
top-level `model` or `sketches`; unwrapped and other-version inputs are rejected.
Each stored constraint must carry version-1 admission intent. Manufacturing
metadata stays validated and the guarded snapshot path still checks revisions.
This is a research contract, not a deployed format or migration mechanism.

Before importing, the project manager validates serialized sketches: it
constructs detached shapes and boundary/ground objects, builds an index, checks
dimensions/labels, supported constraint records and replay hints, resolves
constraint references, and validates generators. This does not prove numerical
solvability, kernel behavior, correctness under arbitrary hostile input, or
complete project recovery after a later reconstruction failure. Detached
construction advances internal ID counters; it does not intentionally alter
authored workspace geometry. Current JSON parsing and preflight run on the UI
thread and are not suitable for 128 MiB files; a bounded worker-based path,
cancellation, memory and responsiveness evidence are required before release.

`test/webos/project-admission-browser.test.cjs` uses a disposable Chromium and
two loopback fixtures under the captured CSP. The old fixture is source
`6e8b6324`; the new fixture is this candidate. It runs real rendered Lock
constraint dialogs, checks the contradictory constraint preserves geometry,
saves and restores the project, verifies intent and object backlinks, removes
the winning constraint to reactivate the other, then uses the sketch drag tool
to move the released point. It also checks that a missing reference in an
unopened sketch fails before workspace import, and that the previous guarded
host reader rejects the new envelope with its empty workspace unchanged. This
is not a physical device, real account sync, all legacy standalone importers,
nonlinear branch coverage or a power-loss test.

The pure codec tests run with `node --test test/project/project-envelope.test.mjs`.
Build the sketch preflight with `webpack --config
test/mechanical/webpack.project-sketch-preflight.config.cjs`, then run
`node --test --test-force-exit /tmp/codi-jsketcher-project-preflight/preflight.cjs`.
The browser test requires `JSKETCHER_TEST_URL`, `JSKETCHER_OLD_URL`, and
`CODI_TEST_CDP` pointing at separate loopback-only assets and Chromium; the
matching test-only helper must be built for the new fixture. See
`test/webos/README-sketch-history.md` and `docs/WEBOS-REPRODUCIBLE-BUILD.md`.

Revision 1 requires top-level `unit: "millimeter"`; geometric lengths are in
millimeters and derived volumes in cubic millimeters. Other units are rejected,
and manufacturing metadata independently requires the same unit. The
`ctx.projectManager.unit` getter returns the authored unit without serializing
history. Empty projects use the same envelope.

The experimental `restoreSnapshotBytesInEmptyWorkspace(blob, {signal, valid})`
path uses a content-hashed same-origin worker. `npm run build`, `npm start` and
`npm run pack` first bundle the worker; it is emitted as
`static/project-validator.<contenthash>.js` and imports the existing same-origin
`lib/verb.js`. The app asset package must retain both. The worker parses JSON,
checks a 128 MiB byte limit, maximum one million JSON nodes, depth 128, 10,000
sketches and 100,000 combined sketch entries, then performs the same detached
sketch preflight. Cancellation, page closure and an invalid session terminate
the worker; a 120-second timeout fails the request. The UI checks the guard
again immediately before import and during asynchronous reconstruction.

The actual 32 MiB worker cancellation test covers both AbortSignal and a session
that becomes invalid. A worker-validated Blob successfully restores a sketch,
and invalid references fail before import. The worker also serializes model and sketch storage values. The one-shot
restore stores those values and loads the already parsed model, avoiding the
immediate UI-thread stringify and reparse. Structured cloning, CAD geometry
reconstruction, and later sketch opening still run on the UI thread. Memory, cancellation after mutation, concurrent request
semantics and full 128 MiB responsiveness must be measured and qualified before
release. The worker is bundled separately with inert CSS because it imports
existing geometry modules that also reference UI components; it runs no host
DOM and sets its own worker-local window alias for the existing verb library.


The actual Blob may originate in the parent window: the iframe validates it via
the native WebIDL Blob size getter rather than realm-specific `instanceof`.
Real Chromium tests pass a parent-created Blob into a child app and check that
a mismatched manufacturing unit is rejected by both encoder and decoder.

On R730, a 134,213,632-byte project with a synthetic unknown `model.padding`
field is now rejected by the worker in 1,301 ms with a 21 ms maximum gap in a
20 ms UI timer. Before strict unknown-field rejection, that same synthetic
fixture was accepted, took 2,203 ms and caused a 1,098 ms UI timer gap; the
measured UI work included 678 ms JSON stringify and 238 ms JSON parse. This is
an unknown-field rejection/cost probe, not legitimate CAD geometry. A separate
supported-field synthetic sketch of 2,000 segments (205,003 bytes) restored in
546 ms with a 45 ms maximum timer gap. Neither is proof that a real 128 MiB CAD
model reconstructs responsively. Memory was not measured. The probe source is
`test/webos/project-worker-large-browser.test.cjs`; set `CODI_PERF_CASE` to
`unknown-padding` or `supported-sketch` and use a disposable loopback fixture.

The shared bounded project-tree check rejects non-finite numeric values,
including valid JSON exponent text such as `1e309`, on both string and worker
paths. A browser regression puts such a value inside an unopened operation and
confirms rejection before workspace import. This is not a substitute for each
operation's typed dimension/domain checks.

A bounded `tsc --noEmit` comparison against integrated baseline `6e8b6324`
found three pre-existing solver/manager type errors (unknown conflicting-set
element and two private-stage-solver accesses). The codec/worker initially
added four type errors; canonical envelope return types, the unit getter and
the worker importScripts call were corrected. The candidate now reports the
same three baseline errors; this is not a claim of a type-clean tree.

The existing `test/webos/snapshot-workflow.test.cjs` has been updated to the
canonical envelope and passes in Chromium for a real plane/sketch/extrusion,
expression roundtrip, guarded drafts/history, malformed input, isolated
restore and injected load/engine failures. It uses temporary local browser
storage, not account-backed Files.

## Semantic version 2

Native version 2 uses the corrected cylinder, cone and sphere datum-basis semantics. Version 1 and all other native versions are rejected before project mutation; there is no conversion or legacy importer. The `unit` remains required and is `millimeter`. This is the top-level project version, not the separate sketch-admission or manufacturing metadata versions. Project hosts must inspect and save version 2 and must not relabel version 1 as version 2.

A separate real-Chromium tilted-datum roundtrip uses a `DATUM_CREATE` feature at (3,4,5) with a 90-degree X rotation and persistent `D:0` references from both a cylinder and cone. With the complete supported boolean definition (`kind: NONE`, `simplify: false`, `targets: []`), the version 2 Blob-worker restore preserved feature history and tessellated Y bounds −26..4. A first research fixture omitted `boolean` while calling `craftService.modify` directly: creation was accepted, but reopen failed with `unsupported boolean kind: undefined`. That is a separate incomplete-command validation/persistence gap; the successful tilted test does not cover or excuse it.
