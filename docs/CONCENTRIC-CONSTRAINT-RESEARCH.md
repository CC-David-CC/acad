# Concentric relationship — experimental

Concentric relates exactly two selected circles and/or circular arcs. It
requires equality of both center coordinates in the sketch coordinate system;
it does not equate radii, require contact, constrain start/end angles, or
constrain visible arc extents. The saved constraint identifies the two authored
circle/arc objects and retains its distinct intent instead of replacing them
with generated geometry. The contextual action and the sketch toolbar expose
the same operation.

Unit tests exercise the real algebraic subsystem, circle/arc selection/action,
strict constraint serialization and sketch IO. Chromium tests use the real CAD
sketcher and toolbar action, check geometry and undo/redo, and reopen the saved
sketch at desktop and emulated-phone sizes under strict CSP. The mock-IO test
uses a mock viewer; the browser test is not a physical touch or desktop Files
host test.

**Integration gate:** the last negative test deliberately fails against the
unrepaired `a05a7433` solver. With one fixed center and the second center's Y
fixed incompatibly, it rejects the relationship after moving the second X.
Do not deploy this schema/action until the separate atomic-admission solver
candidate and this test pass together, including other solver review gates.
This feature does not imply general solver robustness or a finished bracket.

## Consolidated solver and bounded command interface

On the combined solver candidate `6e8b6324`, the contradictory fixed-center and
partial-coordinate rejection tests both pass without moving prior geometry. This
is bounded evidence and does not resolve the solver team's broader qualification
and project-format gates. Real Chromium desktop and emulated-phone tests also
exercise the integrated toolbar operation, undo/redo and sketch reopen.

For an already-authorized, active in-place sketch context, the action registry
exposes `ctx.actions.Concentric.inspect(ctx, options)` and
`ctx.actions.Concentric.invokeByIds(ctx, [firstId, secondId], revision, options)`.
Inspection reports up to 1024 circular objects with type, center and radius,
plus existing Concentric object IDs/status and an opaque, single-use revision
token. Only strict serialized sketches up to 1 MiB are accepted. The token is
bound to the viewer, a SHA-256 of the strict sketch, and the inspected object
identities; missing, duplicated or ambiguous IDs, changed state and newly
loaded replacement objects fail before mutation. Hashing uses Web Crypto;
serialization itself is bounded but occurs on the main thread. An active tool,
recovery state or manager transaction blocks the command.

`options.valid`, when supplied, is a synchronous callback binding the operation
to the caller's still-authorized account/window; `options.signal` may cancel
it. Both are rechecked after asynchronous hashing and immediately before the
same model operation used by the UI. The caller must supply and own these
checks. The invocation reports accepted, redundant or conflicting and retains
JSketcher's authored rejected relation when conflicting; it does not claim the
requested geometry was satisfied in that case. The separate WebOS host has to
register a command, bind the correct frame/session and enforce its own access
rules. This internal action is not a remote agent endpoint, a complete generic
CAD API, or a substitute for the user-authorized account boundary.
