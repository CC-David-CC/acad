# Experimental associative linear cut pattern

`PATTERN_CUT_LINEAR` is a narrow research operation. It patterns the immediately
preceding authored EXTRUDE/SUBTRACT feature when that seed is one circular
through-cut on an unrotated, axis-aligned rectangular OCC plate. The original is
included in the count. The direction is world X or Y, spacing is signed, and all
circles must be separated and strictly inside the plate. Count is 2–16. Native
Mesh, other seeds, rotated/complex plates, holes touching each other or the edge,
and non-immediate seeds are refused. The seed feature ID and original numeric
circle ID are persisted; the seed feature itself persists the face reference.
The initial research wizard required manual IDs. The current picker discovers
the preceding circular cut and preserves its IDs internally; see below.

The operation stores no pointers in the native project. Full replay allocates a
private ledger, captures a copied pre-Boolean tool only when the next active
operation needs it, and discards the ledger on completion. Temporary names are
bounded; private model and child IDs are namespaced by pattern and instance.
Changing the seed or plate forces a fresh solve and fresh tools. The existing
body-pattern operation is unchanged. Parent review is required of OCC copy and
handle lifetime, global engine names, production analysis and all cross-feature
interactions before release; this is not a general feature-pattern engine.

The browser control uses a dimensioned plate and actual sketch/cut/model
operations. It checks rays and OCC volume, topology IDs with and without capture,
resize, signed spacing/count, seed radius edits, undo/redo, reopen, changed seed,
inactive blind seed, bad spacing and missing seed, checked Boolean failure,
last-valid geometry, and reset while a pattern is held. Native Mesh refusal is
covered separately. These tests do not establish a physical-device UI workflow,
general face reference stability, long-running WASM handle memory behavior, or
all OCC failure modes.

The current custom OCC runtime duplicates a native shape-name key on overwrites
without freeing duplicate allocations; bounded sentinel names prevent stale
result reuse but do not fix that existing leak or dispose interrogation
pointers. This candidate is not qualified for repeated-edit memory safety and
must not be promoted as such. An engine-source fix and independent measurement
are required. No native pointer frees are attempted here.

Before each bounded seed, instance and Boolean output name is reused, the
operation writes and interrogates an empty compound sentinel. The qualified
seed and pattern Boolean paths check command returns and reject empty outputs.
The browser control injects successful no-output responses for seed/pattern
Booleans and both copy stages; each must retain the prior accepted geometry.
This protection does not establish that every possible successful OCC result is
geometrically valid, and unrelated legacy Boolean operations are unchanged.

The pattern wizard proposes the immediately preceding authored circular cut
once for a new insertion and stores its feature and circle IDs in the same
operation as programmatic creation. Editing retains those IDs. If the seed is
changed, the wizard displays an unavailable state and requires an explicit
repair choice; the core remains the authority on supported geometry. To keep
UI parsing bounded, automatic discovery declines sketches above 262,144 string code units or
1,024 objects. History/document changes cancel an open insertion. Browser
controls cover create, cancel, edit, reopen, replacement and repair, plus a
simulated concurrent seed change; this does not qualify a touch workflow.

Boolean preprocessing check (pinned runtime): after a successful pattern with
−20 mm spacing, the browser regression changes spacing to +20 mm while the
second `bfillds` call returns success without running. The operation completed
with the new, correct hole locations and OCC volume for two radius-7 mm cuts.
Independent inspection of the pinned `BOPTest_APICommands.cxx` implementation
found that `bapibop` creates a local BRepAlgoAPI operation and calls its own
`Build` from current object/tool lists; it does not consume the separate filler.
This is a bounded result for the pinned implementation and fixture, not proof
of all Boolean failures or an engine-independent guarantee. The previously
identified output-name and native-allocation limitations still apply.

Lead integration checks: combined source `854dc3b3` passed build/typecheck and
eight real Chromium scripts covering the cut pattern, Native refusal, existing
fillet/body-pattern and wizard controls, failed plate edits, private replay,
feature-ID history and document lifetime. The picker merge `0680b40b` then
passed a fresh build/typecheck and the actual picker, cut-pattern and Native
refusal scripts. The fixture used the desktop's current CAD policy on loopback;
it did not activate a new signed desktop package. Exact receipts and scope are
in `combined-pattern-mount-evidence-20261104.json` next to this file.
