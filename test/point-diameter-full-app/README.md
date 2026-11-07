# Actual public point and Diameter app control

Actual CAD source `d7d1fbde0` on direct loopback fixture `http://127.0.0.1:20494/`, emitted app SHA-256 `70c80256e7c44c6e81ac33212026976ceae6a86ad65086aa588bbdac8fff6eef` and sketch Worker SHA-256 `7fb818ea59ba45ed30638ea4f38b34c760993e822ab8d4993b7d810c86a5d904` (both fetched and independently hashed). One owned Chromium browser context with three fresh app pages and real host-lifetime bindings; the context is closed after the test. There are no Worker or geometry doubles.

All geometry is authored through public craft APIs: an empty plane, Point, Segment, Circle and Arc. Inspection exposes the expected point/segment-end/circle-center native IDs. Moving a point to exactly its current coordinates produces `changed:false`/no authored undo and preserves source bytes, history, journal and model-array identity. Moving a free Segment endpoint preserves the opposite endpoint; moving a Circle center retains its radius. Literal Circle D12 and Arc D14 satisfy D=2r. A contradictory second Circle diameter is rejected without changing source, history, journal or model identity. Arc-diameter undo/redo restores exact sketch bytes; a fresh app page restores the native snapshot and its source exactly. This is native in-memory snapshot restore, not a signed Files persistence test.

A separate public-command page intercepts a genuine successful point-coordinate Worker reply immediately before client delivery, aborts the actual host lifetime, then forwards that same reply. The request rejects AbortError with `committed:false`; source, history and model identity remain unchanged. Instrumented app pages reported 28/28 and 5/5 Workers terminated; the native-reopen page created none. One matching run is in `receipt.json`; an earlier independent run also passed before Worker-count instrumentation. The sibling signed-host lane is separate.

Run `PUPPETEER_CORE_PATH=/tmp/codi-occt-release-control/node_modules/puppeteer-core CODI_APP_SHA256=70c80256e7c44c6e81ac33212026976ceae6a86ad65086aa588bbdac8fff6eef CODI_RECEIPT=/tmp/point-diameter.json /tmp/codi-files-move-node/bin/node test/point-diameter-full-app/browser.cjs`. This test-only branch is based on `a888f7bc5` and contains no product changes.

## Final receiver-budget build

Runtime d177d06c8, R730 /mnt/data10tb/codi-worker-sketch-view-20261105-r4,
private20495. App SHA d7588344757f704ede436fcd32474fe5787b1525a9af78b8e1d7425bb4abc868;
sketch Worker7fb818ea... unchanged. Public point/Diameter and existing
Worker-view/Concentric tests pass on this build; final/ holds receipts. Existing
view test terminates19/19 Workers. Root also reran five-hole edit/refusal/cancel/
Save/native reopen and actual legacy UI typed Diameter with unrelated staged
Mirror on d7; both logs retain that earlier scope. Signed final d177/desktop654
on20387 passes My files/account/reopen and the separately labeled native spline
fixture; desktop test/agent-cad-corpus/mechanical-edit records its exact pins.

Point discovery requires no Canvas. Coordinate edits are ordinary geometry
edits, not persistent dimensions. Exact no-ops preserve original bytes/journal;
correct target seeding preserves a free opposite endpoint while authored
constraints can move related geometry. Diameter retains DiameterLength intent.
The new command path explicitly remains untyped/mm with bounded supported
ancestry. B-spline drawing is a0.01mm one-sided display approximation, bounded
4096 points per curve/8192 overall; the owner enforces that aggregate too. It is
not manufacturing geometry. Native/source geometry stays unchanged by viewing.

Legacy tool/editor migration, broader features/references, scene responsiveness,
final release and managed beta remain open. No public deployment or complete
CAD1/CAD2 claim. Rebuild matching package Worker/app scripts using the recorded
Node24/dependency/native prerequisites and test/closed-sketch/webpack.app.cjs.


## Combined DXF/Arc build regression

Root reran this test on source `b249b5afb`, direct20498, with the exact app
and Worker pins recorded in `../dxf-production/README.md`; all assertions pass.
`final/receipt-r7.json` and `final/view-r7.json` preserve the observations.
For newer builds, pass both `CODI_WORKER_PATH=/static/sketch-solver.HASH.js`
and `CODI_WORKER_SHA256=EXPECTED_SHA256`, alongside `CODI_APP_SHA256`.
The explicit expected Worker hash remains mandatory to pass; the original
pin stays the default for reproducing the historical fixture. No geometric,
transaction, native-reopen or cleanup assertion was relaxed.
