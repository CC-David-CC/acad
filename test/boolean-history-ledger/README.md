# Boolean-history shared ledger protocol proof

**PASS**, source `7df9c603f` with the existing 15 selected-profile ledger controls
and 14 new test groups. This is a protocol/projection-double proof. No native
code, real Worker, browser, public CAD command, save/replay, or Files test runs
here. The actual R2 Chromium geometry was qualified separately.

The fixture reads the existing complete R2 observation file at
`../boolean-history-browser/evidence-r2/observed.json` and verifies its pinned
SHA from that lane's receipt. It does not duplicate those 6.5MB observations or
the original 17MB raw receipt. Both full chains comprise 13 results: base, five
circle tools, five cuts, fillet and chamfer. Native metrics, Float64 coordinates,
and selection snapshots are the genuine recorded outputs. Handles, execute
transport and model projection are explicitly doubles. Original Worker Float32
buffers were not retained by the browser recorder; the test derives Float32
preview transport bytes from the actual Float64 coordinates solely to exercise
the modern ledger projection protocol. They are not claimed as recorded native
or browser display observations.

The real `evaluateWorkerSolid` implementation receives each intent, privately
binds the recorded result, reads modern common selection metadata, reads the
recorded mesh, constructs the projection double, checks publication, and updates
the current registry. The tests verify all 13 publications per size, one mount,
correct consumption, the five inferred Boolean feature/producer triples,
unchanged opaque keys, immutable metadata and the flat six-origin final plan.
Consumed operands cannot be reused through the current registry.

Nine altered selection-origin cases (missing/empty/lost/foreign/changed-region/
duplicate/reordered/legacy-top-level-region/wrong-plan-version) must reject
before mesh read or projection; the two previous registry models remain exact.
A separately labeled unavailable-naming transport control retains the genuine
successful geometry while blocking edge operations before dispatch. A mutable
projection-double parent featureId cannot alter private inferred provenance;
restoring it allows normal continuation. Production `MWorkerSolid` additionally
makes its featureId non-writable. No new product flaw was identified by this
bounded read-only review; no shared source is changed.

Run:

```sh
node --test test/selected-profile-ledger/protocol.test.mjs
node --test test/boolean-history-ledger/ledger.test.mjs
```

`evidence/receipt.json` pins the source, unchanged real observation input,
production ledger, test files and actual Node outputs. Logs retain the first
runs, both passing. No filesystem-race/security, UI, Files, service or network
changes occur in this lane. This does not close app/history/semantic-hole or
full Gate1 acceptance.
