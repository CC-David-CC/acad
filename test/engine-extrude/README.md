# Authored rectangle prism in the isolated OCC research mount

This is research only. It is not connected to the CAD model, craft history,
renderer, account commands or production packaging. The versioned OCC mount
adds `solid.profile.extrude` with version-1 and version-2 rectangle-profile input
from `rectangleProfileRequest.mjs`; its nested `profile` includes the authored
sketch JSON/digest, selected face/region IDs, frame, revision and depth. The
worker re-runs that validator. Its revision/digest are attributable input, not
proof that a caller's document, constraint solve or engine session is current;
the eventual coordinator must establish those guarantees. Manifold explicitly
refuses this operation. There is no conversion or anonymous box fallback.

The worker uses the pinned OCC interpreter to create four real points/segment
curves/edges, wire, planar face and prism. All names are unique within the
mount. `gcarc` uses its actual success return of 1; the other used commands use
0. The controller refuses failed/missing output and the Worker closes on
kernel errors. Because this interpreter retains names in its point/curve maps,
the Worker retains command strings until termination; no raw argument, native
shape, interrogation pointer or kernel reference crosses the realm. Logical
`dispose` prevents later use but does **not** individually free native shapes.
The existing mount's eight lifetime reservations apply, including rejected
attempts; termination of the entire Worker is the cleanup boundary. No proof
of exact native memory reclamation or a global cross-tab resource budget is
claimed. Runtime fetching verifies the previously pinned JS/WASM digests, while
the bootstrap and the three local profile modules must themselves be trusted
and pinned by a future release package. No replacement runtime is used here.

For each source edge, the Worker matches its endpoints bijectively to one of
four actual base-face edges, then verifies that OCC's prism generation history
maps that base edge to the uniquely geometry-matched swept face. It returns the
source edge ID, source reversal, base-edge reversal, generated face orientation
and a face ordinal. Ordinals are **ephemeral within this one result**, not
persistent topology IDs or handles. Kernel history references stay inside the
Worker. The controller validates and reconstructs an allowlisted output so no
extra native `ptr`/`ref` fields escape.

Independent mesh checks measure bounds, positive signed triangle volume,
consistent triangle orientation and closed triangle-edge incidence after
1e-6 mm coordinate quantization. This is a check of the tessellation, not an
OCC BRepCheck, a guarantee of a single solid, or manufacturing validation.
For these two examples, interrogation reported six planar faces, one
four-edge loop per face, twelve shared edge groups used twice, and B-spline
edge curves with endpoints, bounds, orientation and tessellation. The raw
interrogation also contains native pointer/reference values that are withheld.
It does not provide a bounded portable analytic model descriptor or persistent
source topology identities suitable for `MBrepShell`; the independently
reviewed worker-prism bridge design remains necessary before publication.

`occ-profile-browser.test.cjs` uses the actual production sketch Worker to
produce authored inputs, then the actual pinned OCC Worker for 100×50×10 and
150×50×10 mm prisms at nonzero local/world origin and plane depth. It verifies
bounds, signed volume, mesh orientation/closedness, source ancestry, returned
handle ownership, and a separately solved/reversed/reordered authored edge
case using exact coordinates. Malformed/stale digest, region, frame, depth,
wrong engine, accessor input, disposed handle and closed mount fail explicitly.
A test-only mutation makes the second prism return success without writing;
the missing result fails and cannot reuse the earlier shape. Another mutation
removes kernel history and must fail ancestry validation. Neither is shipped as
production code.

The retained actual solver output has zero shared-vertex gap, maximum axis
deviation 1.7763568394002505e-14 mm, and reported maximum residual zero.
Version 1 still refuses it as `OPEN_OR_AMBIGUOUS_PROFILE`. Version 2 retains
its actual endpoint coordinates, uses the existing 1e-7 mm classification
tolerance, and passes the real pinned OCC worker with independent bounds,
volume, closure and kernel-history ancestry checks. No coordinates are snapped
or gaps joined. The retained JSON is `fixtures/reversed-solver-output.json`,
SHA-256 `8f3ab4a328ea54797b8f121d985fca9b47a24aef801fa5d8835cd93ba0fa5d3e`.
The outer mount operation remains version 1; the nested profile version is 2.
This evidence does not qualify generic curves or editable model publication.

`occ-profile-lifecycle.test.cjs` checks pre-abort, busy, timeout, crash,
close, forged evidence and typed Manifold refusal using controller doubles,
plus cancellation/termination of an actual initialized OCC worker. The old
verified OCI Boolean/handle suite is a separate compatibility regression.

To reproduce, run `prepare-fixture.py --output NEW_DIR --occ-js ORIGINAL_JS
--occ-wasm ORIGINAL_WASM --sketch-worker MATCHING_SKETCH_WORKER --verb VERB_JS
--node NODE`. Serve it using `modules/engine/mount/strict-csp-server.py` with
`CODI_ALLOW_BLOB=1`, `CODI_ENGINE_TEST_ROOT=NEW_DIR` and a free loopback port.
Set `JSKETCHER_TEST_URL`, `CODI_TEST_CDP` and `PUPPETEER_CORE_PATH` for both
browser tests and `modules/engine/mount/oci-verified-mount.test.cjs`. The tested
original wrapper SHA-256 is `3c56e74e6e08411436a68fb930bab38aedd3137e4369af2bc67fd382e568787e`,
the deterministic no-window wrapper is `4a53dec0dceb5715d070fa7293f6515ab681f6d3de979099526e616dbd052ddc`,
the unchanged WASM is `a2b2f7daf6a4eb98b975f8aec136f6cbaf2720295ea32e71edb13ff4c5ceaecb`,
and the source sketch Worker is `552766a0931c21409d26a3edc771262f924fc611d4c8d9376ef26c72ed3c35a0`.

The first ancestry probe attempted to match the pre-face `mkedge` references
directly to the prism history and failed: in this runtime `mkplane` produces
new projected base-edge identities. The corrected probe matches the four
actual base edges bijectively by geometry before consulting generated
EDGE→FACE history, and confirms the generated faces against the result.
This is scoped evidence for the tested axis-aligned rectangles, not a general
persistent naming algorithm.

The prism's expected volume uses the translated world-space polygon area
vector dotted with its extrusion direction, multiplied by depth; the input
must have finite, positive orientation and nonzero volume. The existing volume
comparison tolerance is unchanged. `prism-volume.test.cjs` distinguishes
this from multiplying adjacent edge lengths and checks invalid orientation.
A real pinned-runtime negative control uses an unsnapped 0.1 mm square with one
corner displaced 1e-7 mm and depth 10000 mm: authored area predicts
99.99995 mm³, while the resulting mesh measures approximately 100 mm³. The old
edge-product check accepted that mesh; the corrected check refuses it with
`ENGINE_FAILURE`. A temporary diagnostic worker observed the matching bounds
and closed, consistently oriented mesh; this does not establish exactly which
kernel or tessellation step lost the distinction. The production worker does
not expose these internal diagnostics. The real retained reversed solver
fixture still succeeds with version 2.

The integration lead combined the profile worker, unsnapped version-2 input,
polygon-volume correction and dense-response validation at
`34b81acf0d0df9c7e53e179dbb98ad5dfeb397bc`. Thirteen focused data/math tests,
the actual sketch-to-OCC browser workflow, lifecycle/forged-response controls,
and existing OCI box/Boolean compatibility suite passed serially. The exact
fixture/runtime/test hashes, observed outputs and scope are saved in
`lead-evidence-20261104.json`. This uses a separately assembled research
fixture, not a newly deployed desktop bundle or completed model/history bridge.
