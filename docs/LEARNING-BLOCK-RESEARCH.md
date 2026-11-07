# Beginner block: bounded research operation

The first learning slice creates a single OCC Box in a fresh, explicitly
millimeter project using the same BOX feature used by the CAD UI. It can append
one existing SCALE_BODY_PIVOT feature about the origin to change size uniformly,
then undo and redo that feature. It does not create a closed sketch, supply
independent parameterized X/Y edits, make a washer, or finish learning gate L01.

The internal service is `ctx.services.blockLearning` in an authorized CAD
window. `inspect(options)` returns an opaque single-use revision token, active
history position, body ID, six-face BREP bounds and dimensions in millimeters,
and a geometry-derived volume in cubic millimeters. `create(revision,{x,y,z},
options)` accepts finite values from 0.01 to 10000; `scale(revision,factor,
options)` accepts a uniform factor from 0.1 to 10 provided resulting dimensions
stay within those limits; `travel(revision,'undo'|'redo',options)` handles the
single scale history step. `options.valid` is a caller-supplied synchronous
window/account authorization check and `options.signal` supports cancellation.
Both are checked immediately before dispatch. If authorization is lost after
dispatch, the service reports the outcome may have completed; inspect before
retrying. It does not blindly repeat mutations. The desktop host must still
register these methods and enforce its session/frame boundary.

The service rejects unsupported operation histories, geometry, non-mm units,
open sketch/wizard operations, material assignments and nonempty project
expressions rather than silently rewriting them. Tokens are bound to the current
CAD context, project ID, actual history/model objects and bounded serialized
history. A changed, reset or reopened document must be inspected again. It is
not a general modeling API. Model history serialization is bounded in scope to
a validated box plus one scale; this is not a general large-document solution.

A real Chromium strict-CSP test starts with an empty project, rejects invalid
and invalidated requests, creates a 60×40×10 mm box, checks its BREP bounds and
24000 mm³ volume, scales it to 120×80×20 mm (192000 mm³), undo/redoes the
scale, snapshots and restores it in a fresh CAD window, and checks stable
resulting body ID. It also verifies a token from the first window is refused in
the second and material-assigned models are refused. Desktop and emulated-phone
runs passed against the combined canonical-unit codec. These do not prove
physical accuracy, cross-account file synchronization, full agent host wiring,
real-device touch, arbitrary topology, material-aware 3MF, or washer behavior.
