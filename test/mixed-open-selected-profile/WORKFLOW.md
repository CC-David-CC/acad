# Prepared complete E01 mixed-source workflow — not run

Wait for root's normal composed app/strict signed fixture containing source
`e7647b38c` (or its root cherry-pick) and matching runtime pins. This driver is
source preparation only: no tests/TSC/build/browser were run while implementing.
It must not be executed against an old app or retag old component evidence.

Use the existing signed public harness from the exact supplied Desktop source;
all authoring is registered public commands. It creates a fresh own account and
context, keeps shared Chrome alive and retires only its own context after awaited
command/file/sync settlement. Capture its source separately from application
runtime pins, since producer-only source may postdate a frozen app build.

Required nonsecret environment:

```
CODI_DESKTOP_SOURCE_ROOT=/path/to/exact/desktop/source
CODI_SIGNED_PINS=/path/to/exact-composed-runtime-pins.json
CODI_EXPECT_SOURCE=<exact Core app source commit>
CODI_EXPECT_DESKTOP=<exact Desktop app source commit>
CODI_ENGINE_REVISION=sha256:<actual registered JS SHA256>:<actual WASM SHA256>
CODI_TEST_URL=http://127.0.0.1:<root-authorized-fixture>/
CODI_TEST_CDP=http://127.0.0.1:<authorized-existing-Chrome>/
PUPPETEER_CORE_PATH=/path/to/qualified/puppeteer-core
CODI_EVIDENCE=/fresh/output/directory
```

Execute the complete workflow once after composition:

```
/path/to/qualified/node test/mixed-open-selected-profile/desktop-driver.mjs
```

The flow first authors the actual E01 ordinary Segment(0,0)→(30,40) plus separate
Circle(60,20)R5, with no dimensions/construction flags/seeded native model. It
requires explicit complete sourceAnalysis and one genuine Circle region before
extruding depth10. Expected native volume is250πmm³; bounds[55,15,0]→[65,25,10].

It then adds an actual Circle diameter, edits it to14 (490πmm³), travels Undo/Redo,
checks unrelated original Segment coordinates remain exact, and attempts to move
that Segment endpoint into the circle's bounds. The attempted source change must
refuse atomically. Next it publicly appends one isolated chain continuation,
requires both real Segment IDs in the open component census, and refuses a third
branching Segment instead of silently filtering the branch. These are ordinary
shared edits, not fabricated successful Worker responses or private geometry.

Normal native JSON Save/server sync/fresh Open must retain the original feature,
opaque region, exact whole-part backend, actual source objects and nine authored
extrusion parameters. SourceAnalysis remains derived and is not saved as authority.
Fresh Open/re-edit diameter12 (360πmm³), Undo/Redo and final ordinary Save complete
the flow. Source/feature/endpoint/curve IDs always come from real receipts or
inspection; opaque region/selection IDs are never parsed or manufactured.

Raw pre/post refusal states are retained. Stable accepted source/history/models,
counters/journal/dirty fields must match; inspection revision tokens may refresh
when a candidate attempt invalidates old selectors, following the existing shared
harness contract. Live candidates/mounts/accepted-candidates must settle to0,
processing must stop and cleanupFailed must remainfalse. Detached/owner metadata
counts are recorded without calling them used memory or forcing GC.

The actual runtime/native numeric values, failures, saves and cleanup will be
reported only after execution. General arrangements, near-contact completeness,
depth-free mixed-source consumers and E05 combined edit/reselection remain open.
