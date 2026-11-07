# Consistent craft revision publication

This is a development integration change, not a deployed desktop package or
completion of CAD Gate 1. The machine-readable receipt is
`test/webos/craft-publication-evidence-20261104.json`.

## Defect and corrected boundary

The real-browser baseline at application `0680b40b` published new models before
their feature history. A model observer saw one plane with zero history entries,
then two planes with one entry, then three with two. The registry happened to be
current, but the overall accepted revision was inconsistent.

Craft now prepares and installs history, model list, failure status, shell list
and entity index synchronously before notifying any observer. Preparation does
not run modeling operations or bypass admission. Candidate evaluation still
uses its private registry and retained accepted geometry remains untouched.
The isolated remote-part replay path uses the same publication boundary.

State streams have monotonic write revisions, including equal-value writes.
A prepared batch refuses stale revisions before installing anything. Reentrant
replacement installs all values together; the current dispatch stops delivering
the old revision. A busy stream's newest notification is coalesced into one
event-loop task. This yields to browser input rather than recursively spinning.
Ordinary state writes use the same notification mechanism. New subscribers are
registered before their initial value is delivered; dispatch uses a stable
observer list, excludes newly added listeners from duplicate delivery, and
honors removal before a listener's turn.

## Outcomes callers must distinguish

- Successful replay publishes one consistent accepted revision.
- A rejected new/edit command leaves the exact accepted history, model and
  validity unchanged, including a deliberately rolled-back history position.
  Its command error does not make the unchanged valid tip unsavable. Reserved
  feature-ID gaps remain; identifiers are not rolled back or reused.
- Failed replay of authored history retains that requested history with an
  explicit failure state and the last complete geometry. Save/export remain
  unavailable until the failed revision is repaired. This differs from rejecting
  a command before accepting its authored changes.
- Reset installs an empty craft history, model, registry and failure state
  together. Stale callbacks cannot republish the preceding document.
- If a synchronous observer replaces the document after a successful commit,
  the command receives `AbortError` with `committed: true`. Before-commit
  supersession carries `committed: false`. The former must not be described as
  proof that the operation never happened.
- Exceptions in caller success/error callbacks are reported separately and do
  not turn accepted geometry into failed geometry or strand pending counters.

## Validation and reproduction

`test/coreTests/run-state-batch.cjs` bundles the actual stream library without
DOM/canvas stubs. It tests coherent values, equal-value revision conflicts,
sparse/duplicate input refusal, revision exhaustion, nested reset/coalescing,
ordinary nested writes, subscription changes, detach and stale notifications.

`test/webos/craft-publication-browser.test.cjs` runs the real CAD application:
three successive plane revisions, immediate inspection inside a reset callback,
failed-history publication, unchanged saveable command rejection, rollback
rejection, reset inside a failure observer, throwing caller callbacks and a
subsequent successful operation. Unexpected page/observer exceptions fail it.
The receipt also records the combined plate, pattern, lifetime and history
regressions, exact source inputs and served asset hashes.

The application build, typecheck, stream test and 12 distinct browser scripts
pass. The existing pattern fault tests previously compared geometry captured
before history rollback with geometry after a rejected edit at the earlier
pointer. That encoded the old mismatch. They now capture the accepted rollback
revision and compare history, pointer, validity and face tessellation together.
Independent ray checks establish the seed-only rollback geometry; a subsequent
valid edit must restore the complete intended pattern. Boolean-failure,
missing-output, seed/copy freshness and cancellation checks remain in place.

Use the pinned prerequisites in `WEBOS-REPRODUCIBLE-BUILD.md`, then:

```sh
node test/coreTests/run-state-batch.cjs
CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1 npm run build
CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1 ./node_modules/.bin/webpack --config test/webos/webpack.config.cjs
npm run check-code
```

Use the existing strict-CSP fixture and isolated loopback Chromium, set
`JSKETCHER_TEST_URL`, `CODI_TEST_CDP` and `PUPPETEER_CORE_PATH`, and run the
browser scripts listed in the receipt. The helper also needs the two build
flags: omitting them selects the legacy dynamically compiled numeric library,
which the unchanged CSP correctly refuses. The first helper attempt and a
corrected test snapshot-field assumption are retained in the receipt.

## Still open

This is atomic publication of evaluated craft state, not a transaction for
the entire editable document or durable My files. Sketch storage, formulas,
material assignments and file versions still need one guarded preparation and
publication contract. Published model objects remain mutable in legacy paths;
this change does not make arbitrary direct mutations transactional. Deferred
notifications can coalesce intermediate revisions and are not an event log.

The next bounded task is to combine the worker-prepared plane/sketch with
privately staged sketch bytes, exact document generation/revision checks and
one visibility boundary. No rendered editor is required for computation. The
headless rectangle factory remains research until that path, UI/agent parity,
My files round trip and interruption controls are proven. The preferred OCC
and secondary Native Mesh/Manifold runtime work remains separately qualified.

## Private workspace preparation follow-up — 2026-11-04

`storage/volatileWorkspace.mjs` now provides a data-only preparation boundary
for the next command slice. Preparing writes leaves accepted bytes unchanged.
A synchronous commit swaps the prepared map only when its revision and owner
are current; all callbacks follow installation. Equal-byte writes and removals
invalidate the preparation. The metadata map holds existing immutable strings
by reference; it does not copy their contents or perform hashing/JSON parsing.
Native document validation and numerical work remain separate worker jobs.

The new preparation path has one retained candidate per workspace, at most
256 writes, 16,384 indexed records, 1,024 characters per key and eight million
(8 * 1024 * 1024) UTF-16 code units of input values per transaction. Reservation
precedes reflection on caller data; reentrant validation cannot create another
owner or release a newer reservation. Failure, ordinary writes, removal,
document abortion and disposal release the candidate. These limits apply to
this new command primitive, not the existing 128 MiB native-file importer or
all legacy workspace operations. They are structural bounds, not measured
browser-wide memory/latency guarantees.

The application adapter binds preparation and staged-write cleanup to exact
storage/project service identities and document generation. A replaced or
disposed service cannot commit or notify an old preparation. Delayed updates
coalesce separately for every changed key and check lifetime at delivery and
between observers. One observer or validity callback can reset the document;
remaining old delivery stops. Guard exceptions fail closed and do not strand
the queue. Each delivery turn processes at most 64 keys. This is current-byte
invalidation, not an audit log; legacy writes and the overall queue do not yet
have a complete resource budget.

The browser baseline proved that the old global last-value throttle refreshed
only the second of two modified faces. The new control checks both real face
sketches, loops, regions and registry entries; deletion and replacement also
remove obsolete sketch objects and loop identities. A full expression reload
legitimately rewrites both sketches in the new generation. An initial test
incorrectly treated those notifications as stale. The corrected controls test
generation/replay without new writes separately, then attribute full-reload
events to actual new-generation writes. Both attempts are retained in
`test/webos/workspace-preparation-evidence-20261104.json`.

Reproduce the new pure core with `node --test
test/mechanical/volatile-workspace.test.mjs`, and the existing stream coordinator
with `node test/coreTests/run-state-batch.cjs`. The legacy staged-write adapter
suite uses `test/mechanical/webpack.storage-stage-write.config.cjs`; it has a
minimal window-location fixture and is not a browser proof. The decisive
integration test is `test/webos/workspace-preparation-browser.test.cjs` against
the actual application under the unchanged CSP fixture above. No fake canvas
or rendered editor is needed for the new preparation core.

Still required: compose the evaluated plane, worker-produced validated sketch,
storage, history and registry in one document transaction; route UI and agent
creation through that command; qualify its interruption and My files round trip.
The current browser test installs prepared bytes and later updates face views;
it does not claim that entire future transaction is implemented. Legacy
editor-dependent expression recomputation remains tracked work. No desktop
package, runtime pin, public service or CAD gate is promoted by this change.
