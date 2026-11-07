# Real bundled DXF backend qualification

`browser.cjs` runs against a built, loopback-served `index-webos.html` in a
fresh owned Chromium browser context. It closes only that context. The default
CDP address is the shared test browser on port 19329; the application URL is
provided by the integrator. The test never creates a Canvas/Viewer substitute
or synthesizes a successful geometry/Worker reply.

```sh
PUPPETEER_CORE_PATH=/tmp/codi-occt-release-control/node_modules/puppeteer-core \
JSKETCHER_TEST_URL=http://127.0.0.1:PORT/ \
CODI_APP_SHA256=EXPECTED_APP_SHA256 \
CODI_WORKER_SHA256=EXPECTED_SOLVER_WORKER_SHA256 \
CODI_RECEIPT=/tmp/dxf-production-result.json \
/tmp/codi-files-move-node/bin/node test/dxf-production/browser.cjs
```

The fixture must include the actual `sketch-export-dxf` task dispatcher and
the Blob reply validator in the shared Worker client, plus the craft service
registration. Merely adding the pure DXF helper is insufficient.

The assertions cover:

- Public creation of a translated XZ sketch plane and Point, Segment, Circle,
  and Arc through the normal craft commands.
- Public DXF discovery and export. An independent group-code parser checks
  the actual entity coordinates, circle/arc radii, arc angles, and millimeter
  `$INSUNITS`. Coordinates remain sketch-local despite the displaced plane.
- No source bytes, key/namespace/workspace revisions, feature history,
  authored edit journal, script, or model identity changed by export or a
  refused stale revision. `snapshotCurrentProject` is deliberately not used
  as a no-write oracle because it can itself persist workspace project state.
- A genuine classic OCCT `BOX` operation with its 30 by 40 mm Z-positive face and no saved
  sketch. The actual four exported boundary lines retain those lengths, and
  no source key or tombstone is created by the outline-only Worker path.
- Actual successful DXF replies held immediately before shared-client
  delivery, followed by host close or source invalidation. Delivery must reject
  with `AbortError` and publish nothing. The source case deliberately changes
  valid JSON bytes by appending whitespace via real workspace storage; it is
  a controlled currentness fault, not a claim of a second public edit running
  concurrently with the origin-wide geometry lock. After host close, comparisons
  use raw source/history observations, not public current-document revision or
  journal APIs that correctly reject a dead host.
- Every observed Worker is terminated. Application and observed Worker bytes
  are SHA-256 recorded and optionally checked against integrator pins.

This lane proves backend/transport behavior. It does not prove the desktop
File menu, signed My files save, account isolation, server durability, every
DXF consumer, physical phone behavior, or a release-wide CAD gate. Full ellipse,
typed parameters, boundary mismatch, unsupported curves/annotations, and
protocol-malformation controls have separate lower-layer tests under
`test/headless-dxf-export` and `test/sketch-dxf-coordinator`; their proof labels
must remain distinct from this actual application lane.

## Actual r6 qualification — 2026-11-05

PASS against integrator source `1d2b19d5d`, R730 build
`codi-worker-sketch-view-20261105-r6`, served on local port 20497.
`receipt-r6.json` records the actual returned DXF and state observations.

- Application SHA-256:
  `a1ac3fa4a31180a321218d906845864da84605f73a0f80b9c9a44c75d2b9e2e5`
- Actual `sketch-solver.0410219891e377ed6b3a.js` SHA-256:
  `57a4c0416837f8879b44c8b1a9695fbc7e7a37f2124555963a4cb8cb6ba727a8`
- Saved/outline/host-close/source-change pages observed respectively
  10/1/4/4 Worker starts and exactly as many terminations.
- The XZ plane frame is origin `[0,7,0]`, X `[-1,0,0]`, Y `[0,0,1]`,
  Z `[0,1,0]`; actual DXF remains the authored local coordinates.

Two initial harness assumptions were corrected before the complete run passed;
neither required a product change. Classic BOX naming calls the Y-positive side
`LID`, whose edge lengths are 30 and 5 for this box; the intended Z-positive
30 by 40 face is `FRONT`. All six actual face DXFs were inspected to establish
that distinction. The initial host-close observer called
`inspectDocumentRevision()` after closing its host; it correctly threw
`AbortError`. The observer now compares raw persisted bytes/versions/history
without trying to use a closed document API. These corrections do not broaden
the ordinary-arc claim to near-full or degenerate arcs, which remain a separate
review lane.


## Combined r7 integration — 2026-11-05

Root reran the actual production backend controls after integrating the Arc
full-sweep fix and the desktop File-menu action in source `b249b5afb`.
Private R730 fixture `codi-worker-sketch-view-20261105-r7`, direct loopback20498:

- App SHA256 `e8d809e7f6775c0e0e331ab874d3197e7ab61c4f231e349401ef597719c3ed65`.
- Observed production sketch Worker `sketch-solver.29ef6a83789d1bb965c4.js`,
  SHA256 `3e1b41242e8f4a279d7598ab75675380d5cc124f925e2469a74d03e330debf91`.
- Project Worker `project-validator.1c3d792b2bdd7998cb7c.js`,
  SHA256 `c0f6db34857b0b4bf1e211f79f90615a1052097c75afd2d2bbea7f38efa74cc8`.

`receipt-r7.json` repeats the public primitive DXF oracle, unsaved genuine BOX
outline, source/history/model preservation, host-close/source-change held real
reply controls and19/19 Worker terminations. Root also passes actual
`test/point-diameter-full-app/browser.cjs` (28/28 +5/5 Workers, native reopen),
`test/worker-sketch-view/browser.test.cjs` (19/19 Workers), and
`test/rectangle-edit/browser.test.cjs` (five-hole edit, exact undo/redo,
no-op/refusal/cancel/currentness, Save/native reopen). Point/view compact
receipts are under `test/point-diameter-full-app/final/*r7.json`.

The near-full Arc core regression has independent real-Worker evidence in
`test/headless-dxf-export/`; this backend script still tests an ordinary Arc.
Visible File-menu and signed My files tests are recorded in the desktop
repository, with their own source/runtime pins and scope. This checkpoint
alone is not proof of that UI or completion of the full CAD release.
