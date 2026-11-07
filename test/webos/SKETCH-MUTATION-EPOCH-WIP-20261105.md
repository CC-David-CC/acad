# Sketch mutation epoch: research evidence

This is an additional stale-detection layer, not an authoritative replacement
for the exact 1 MiB strict sketch snapshot. The counter is realm-local and
conservatively invalidates captures for another sketch in the same realm.
Workers run in separate realms. It increments only when `Param.set` changes a
value, and fails closed instead of wrapping at `Number.MAX_SAFE_INTEGER`.

Current hooks include parameter setters (including segment polar parameters),
constraint membership and edited constants, stage/object/layer membership,
generator membership, workspace reset/IO cleanup, object roles and translation,
and the listed B-spline update and knot methods. Focused tests cover parameter,
hidden-polar, role, constraint membership/constant, stage, layer, reset and
spline-knot ABA; no-op parameter and identical-knot setters remain current.
Direct writes to mutable internals and every possible richer shape mutation
path have not yet been inventoried or proved. Keep the exact snapshot and do
not claim the counter alone is authoritative. UI-thread serialization and the
worker-first performance gate remain open.

At source `6530b8c7`, an R730-built full app with local isolated Chromium
passed the full signed-dimension selected-action/editor/undo/redo/fresh-native
snapshot/ID stale suite. Separate actual UI-created interpolation and
control-vertex splines were redrawn between inspection and submission; the
current command remained valid and a subsequent hidden polar ABA was refused.
This is a local desktop browser result, not physical phone or account evidence.
Index/sketcher/test-helper SHA-256:
`89f32fc7df179fb656fb45a7009b7a35035582def637c934308a71b91758e5dc`,
`5dc06c0b54f1cf7a8582b7daa9a89c6fee7ecbce55d0a7d5e437455babd91067`,
`3f2e1afa66b2a1e191e73740c9a82d063d68253b4efb01db5adef5a46f9a1199`.
The browser test uses `test/webos/sketch-epoch-spline-browser.test.cjs` on an
isolated strict-CSP fixture, with `CODI_SPLINE_MODE=cv` for the second mode.

At `381c66d9`, the same fixture's closed-CV mode created an actual closed
curve, preserved its derived IDs across redraw, accepted a current command,
refused a hidden-parameter ABA, and preserved those IDs and knots through a
real mouse drag and undo/redo. A base-point Lock constraint and exact spline
records survived native workspace save, fresh-page reopen and redraw. Focused
model controls also checked base reorder, object replacement, count changes,
duplicate derived IDs and rejection of tampered saved periodic output. Hidden
derived points are excluded from sketch traversal/constraint target lookup;
this result does not establish generic persistent topological naming.
Existing desktop and emulated-phone spline history controls also passed; the
closed-CV drag/reopen itself used desktop mouse input. The app index, sketcher,
test helper and worker hashes for `381c66d9` were respectively
`054fc55d2eec843034a3adf2c2e619a73b456e1e4672ee8cfd8150dbf4fabac9`,
`f67adb42840a3c17f87ce321ed285ece2dd3b4cd07a6336dc0cc8bcf5cf10fcb`,
`6079b5eb61d624fd5a574a3a6055ea9a635a1ecc4c81188d528d3c9e1fbef2fc` and
`4c1ccb798c0d7fbb70f6303868a7ed65605fa3f0b3f3d09dbb644394e5c985c2`.
