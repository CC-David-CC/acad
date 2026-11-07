# ARC20/21 atomic numeric-expression refresh

Runtime source `378c336fa`, branch `research/headless-expression-refresh-20261105`,
base `b249b5afb`. Integrate the source commits14500161e, eebd10515,552211677,
6b35c52d0,378c336fa in order (or their combined diff). Later evidence-only commits do not
change that runtime. Exact app/sketch/project Worker pins are in `pins.json`.
Matched fixture: R730 `/mnt/data10tb/codi-legacy-expression-20261105-r5`,
loopback20596. This is private qualification, not a public deployment.

## Shared API and publication

`craft.inspectLegacyExpressions()` returns `{ready,reason,revision,source,
format:'legacy-numeric-v1'}`. Await
`craft.applyLegacyExpressions({revision,source},{signal?,valid?})` to receive
`{changed:true,revision,format,sketches,persistence:'volatile-workspace',authoredUndo:true}`.
An exact no-op returns `{changed:false,revision}`. The same command backs WebOS
Script editing; keystrokes update only component-local draft state.

The command captures the host/document lifetime, service identities, authored
revision/history, exact expression source and all expression stream revisions,
old numeric table/properties, namespace version/membership, every saved sketch
byte/version/frame and manufacturing revision. The actual pinned sketch Worker
parses bounded safe arithmetic, checks the old source against the old table,
replays old sketches against old values, then solves against new values through
the genuine nonvisual IO/constraint/solver workspace. Returned native bytes/frame
and authored intent are rechecked in a second genuine Worker call.
No Canvas/Viewer solver is created. The facade retains exact legacy source and
`isTyped=false`; values retain their existing schema-defined units.

Candidate sketch overrides and source-plane frames enter the existing complete
owned history/model replay. Storage writes and model/history/journal/expression
source/list/table/errors are prepared and installed in one synchronous publication
before notification. Nothing writes live sketches before success. Failures retain
the previous accepted state. Source, namespace, frame, history and lifetime guards
continue across Worker waits and model replay.

Undo/redo reuse the existing physical-transaction owner with validated explicit
`parameterKind:'legacy-numeric-v1'`, including empty-source entries. Unclassified
historical nonempty legacy entries refuse; no typed-unit conversion is inferred.
This tag is internal undo ownership, not a native-file schema change. A private
participant latch distinguishes actual installation from precommit refusal, and
checks exact installed values/revisions. Reentrant replacement after acceptance
reports `committed=true` without rolling back newer ownership.

The old table$ observer is gated in WebOS. Its standalone compatibility Canvas is
created lazily only when that non-WebOS path is used. Standalone behavior remains
in source; it was not requalified under this self-only-script fixture's CSP. The
now-unneeded DXF-import bridge was removed. Native project restore remains the
editable file path; DXF/3MF exports remain owned by their existing coordinators.

## Explicit supported bounds

- Existing safe arithmetic definitions/dependencies and allowlisted Math functions;
  no eval/JavaScript. At most256 globals, finite magnitude1e9,64KiB source.
- Existing parameter-edit limits:64 saved sketches,1MiB UTF-8 each,4Mi characters
  aggregate; shared request/tree limits and per-Worker30-second deadline remain.
  Existing undo-journal limits may refuse a larger edit before installation.
- Existing explicit PLANE/Worker ancestry allowlist, at most256 operations, and
  empty-boundary source planes. Consumed rectangle source planes use candidate
  frame provenance. Unknown consumers/generated boundaries/unresolved frames refuse.
- Named global/local sketch values and safe independent local definitions retain
  local-over-global precedence. Direct formulas in sketch constraint fields are
  explicitly unsupported: use a named definition. Feature numeric fields retain
  their existing safe evaluator.

This does not qualify all CAD features, phone/4K polish, general responsiveness,
signed Files or public deployment. Native restore still uses its existing bounded
source-table load; this lane does not claim all parsing/rendering there is off-thread.

## Actual-app evidence

`browser.test.cjs` plus `faults.cjs`, `finish.cjs`, `ownership.cjs` use Chromium155,
actual public craft operations and native saves made by those operations. No fake
solver or Canvas shell is used. The native fixture deliberately authors formulas
into its own save: `base=50`, `W=base*2`, `H=base`, `D=20`; rectangle lengths bind
W/H, extrusion depth binds D. A second independent rectangle has local `W=30`
and `LH=5*2`, shadowing the global W.

`receipt.json` records:

- Base75/depth25 regenerates150×75×25mm, local width stays30mm; names, constraints,
  stages, metadata and source remain native/untyped. Six observed source/table/model
  notifications see coherent old or new state.
- Five invalid/duplicate/cyclic/domain/feature-depth edits preserve source, sketches
  and versions, model/history/table identity, metadata and journal. No stale model
  is presented as accepted failure output.
- Cancel during sketch verification or actual geometry replay, invalid caller
  lifetime, table/source ABA and stale revision abort without writes. Raw old-table
  value corruption is detected by recomputing the old source; no repair is claimed.
- Eleven malformed genuine Worker reply controls reject before publication: extra
  keys, NaN, duplicate names, wrong source-only nulls, accessor, invalid native JSON,
  changed intent, invalid/shifted frames. The accessor executes0 times. Held-message
  cancellation controls do not substitute successful fake solver responses.
- Authored undo/redo restore exact source/sketch bytes and expected geometry. The
  real Script UI keeps typing private and applies160×80×30mm on blur. Host-save
  preparation and fresh native restore retain source/local semantics/exact sketches.
- Exact no-ops preserve stream identities/revisions, sketch versions and journal
  for nonempty source, empty source with two sketches, and an empty document.
  Source-only `k=3*4` evaluates12 with no models and isTyped=false.
- Preaccept document replacement reports committed=false and leaves a new empty
  document. Reentrant source mutation or genuine document replacement during accepted
  publication reports committed=true and preserves newer ownership.
- Zero Canvas allocations during expression operations. All71 tracked disposable
  sketch Workers terminate; candidates return0 and cleanupFailed=false. The active
  document still owns one detached resource owner, as expected.

`checks.json`: existing typed binding/depth/history/refusal/cancel/native-reopen
regression PASS against the same app; full TypeScript noEmit PASS; journal control
for explicit empty→empty legacy format PASS. The first new history oracle compared
JSON key order; it was corrected to compare parsed history because the owned
history capture canonicalizes keys. No product workaround addressed that assumption.

## Reproduction and integration

With the retained fixture, existing Chrome CDP and Node:

```sh
# On R730, when its loopback20596 is free:
cd /mnt/data10tb/codi-legacy-expression-20261105-r5
python3 -B test/enclosure-history/serve-craft-detach-fixture.py --root dist --port 20596
# Forward local20596 with SSH ExitOnForwardFailure, then run from this checkout:
export CODI_TEST_CDP=http://127.0.0.1:19329
export JSKETCHER_TEST_URL=http://127.0.0.1:20596
export PUPPETEER_CORE_PATH=/path/to/node_modules/puppeteer-core
node test/legacy-expression-refresh/browser.test.cjs
node test/physical-parameters/history-browser.test.cjs
node --test test/legacy-expression-refresh/journal.test.mjs
```

UI selectors: `[data-view="expressions"]`, button text `Script`, then
`textarea[aria-label="Numeric expression script"]`; Tab/blur applies the draft.
Tests close their own contexts. The loopback fixture enforces self-only scripts
and Workers. Its helper bundle is private and must never become a public asset.
Root owns the public host command adapter, combined rebuild, signed-account tests
and deployment.

Build using existing checked-in prerequisites. Tested R730 Node:
`/mnt/data10tb/codi-3mf-qualification-SrUmue/node/bin/node`. The isolated stage
inherits locked dependencies/runtime build prerequisites from root's r7 fixture.
With `CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1`, sequentially build
`build/webpack.headless-sketch-worker.cjs`,
`build/webpack.project-validation-worker.cjs`, then private
`test/closed-sketch/webpack.app.cjs`. Remove only stale copied hashed Workers in
the new isolated build after confirming the newly emitted hashes.

Source/tests/notes/compact receipts are mirrored to example.invalid and R730 Git. Raw
logs/earlier receipts/pins are backed at
`/mnt/data10tb/codi-evidence/legacy-expression-refresh-20261105/`.


Signed integration review found an additional UI issue before final checkpoint:
blurring a dirty script onto Reload could apply it before Reload clicked. The
final UI preserves pointer focus on action buttons, skips auto-apply when keyboard
focus moves to Reload, and uses a synchronous in-flight ref to prevent duplicate
blur/click submission. `reload.cjs` proves both real mouse and trusted Chromium
touch Reload reset only the private draft: accepted source, sketches/versions,
models, history, metadata, journal and expression stream versions stay unchanged,
and no Worker is created. This is touch interaction on the test viewport, not a
claim of physical-phone or complete responsive-layout qualification.
