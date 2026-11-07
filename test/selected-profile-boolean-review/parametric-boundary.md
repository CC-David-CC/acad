# Actual post-Boolean parametric boundary — confirmed availability gap

Source323866, exact normal20683 app SHA
`a0e2ef4030f29d17e83b5290277480e80414bcb5a0ce10d907f73ed00d65ccc2`.
`parametric-boundary.cjs` publicly creates two disjoint radius10 circles at
x0/30, extrudes each5mm, and unions their selected-build solids. The accepted
result has two valid native solids and independently expected volume1000*pi.
Only returned public IDs and revisions are used for authoring.

| Next public request | Actual readiness/result | Preservation |
|---|---|---|
| Original circle diameter20→24 through public applySketchDiameter/full replay | inspectSketchTransitions ready:true, but candidates:[]; AbortError(code20), "Sketch edit was cancelled or superseded." | Exact source/history/models/versions; no Worker dispatch; uncommitted |
| Independent XZ plane at7 | ready:false; "This sketch creation path requires supported part history with room for another plane."; request refuses same reason | Exact source/history/models/versions; no Worker dispatch; uncommitted |

This is a known-history admission gap. The current helper recognizes selected
profiles but not generic BOX/BOOLEAN entries, so its sentinel classification
cannot admit the existing supported replay path or new plane path. The diameter
refusal is not evidence of solver inconsistency, bad source geometry, a kernel
failure or a mathematical inability to resize the circles. No solve was
attempted for these two requests.

`dependency-proposal.md` describes the bounded known-operation map, exact
schemas/build checks, conservative source propagation through empty results,
and rejection of consumed/forward/unknown operands. It does not implement the
map or claim dependent regeneration now works. The existing full atomic replay
must be qualified after the root-owned fix.

Actual receipt: `parametric-boundary-receipt.json`; raw log:
`evidence/parametric-boundary.log`; source/hash receipt:
`parametric-boundary-pins.json`. The browser closes only its own context and
disconnects from shared Chromium. No product or finished edge-case proof changed.
