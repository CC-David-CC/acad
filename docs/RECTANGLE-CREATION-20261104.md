# Atomic plane and rectangle creation

This is a bounded core command for the WebOS volatile CAD workspace. It is
not the complete Gate 1, a registered desktop agent command, or a new deployed
runtime. It appends a normal XY plane and a validated dimensioned rectangle
to a valid ordinary part history. It does not require an open sketch editor.

## Core contract

```js
const capability = ctx.craftService.inspectRectangleCreation();
const accepted = await ctx.craftService.createRectangleSketch({
  revision: capability.revision,
  unit: 'millimeter',
  origin: [10, 20], // local sketch coordinates
  width: 100,
  height: 50,
  depth: 7         // XY plane placement in millimeters
}, {signal});
```

Inspection returns readiness, a reason when unavailable, units, the supported
plane, limits, and an opaque current revision. The token binds service
identities as well as monotonic revisions; replacing a workspace with a fresh
one at equal counters invalidates the old token. The caller must inspect again
after a change. Parent-frame plain arguments and native AbortSignals work.

The command returns feature, face and region IDs, the new revision, and
`persistence: 'volatile-workspace'`. This receipt is **not** a durable My files
save acknowledgement. The existing authorized host save must still complete.
Cancellation/replacement uses AbortError; `committed: true` distinguishes a
revision accepted before a reset during notification from a rejected candidate.

Width/height are 0.001–1,000,000 mm, local coordinates and plane depth are
bounded to magnitude 100,000,000. These independent limits do not promise every
combination: the worker also rejects insufficient precision at an extreme
origin. Only principal XY frames are supported by this creation task. Numbers
are literal driving values; shared named-parameter authoring is not supplied.

## Publication and ownership

1. Capture bounded own data fields; reject getters, unsupported units, invalid
   dimensions, stale tokens, an active operation/editor or unsupported workbench.
2. Claim a monotonic feature ID. Rejection may leave an unused ID gap.
3. Evaluate normal PLANE history in the existing private replay context. Use
   the actual new face's frame, not a fabricated world-origin frame. Refuse any
   existing target sketch key, including orphan data.
4. Run the production rectangle task in the disposable sketch worker. Solving
   and serialization occur there. Validate the bounded returned serialization,
   the exact eleven constraint intents/residual evidence, actual frame and four
   requested segment endpoints. Project only this small result into the model.
5. Attach the sketch to the private face and require one bounded region. Prepare
   private workspace bytes and state/registry publication. Recheck lifetime,
   services, workspace revision, expressions, editors, workbench and assembly.
6. Preflight both participants, install bytes and state synchronously without
   observers or an asynchronous gap, then deliver lifetime-guarded notifications.
7. Terminate/release worker resources and abort listeners on every exit. Failed
   preparation leaves accepted history/model/bytes intact. Autosave defers while
   craft evaluation is active, so an earlier timer cannot invalidate its work.

The private candidate's face is traversed into the new registry before state
publication. Existing sketch byte strings remain unchanged when another plane
is added. Undo to before the plane hides it but retains authored sketch bytes
for redo; that is not a physical deletion of document data.

## Qualification

`test/webos/rectangle-creation-browser.test.cjs` exercises the actual production
app and worker under the existing host CSP. It checks accepted first-observer
consistency, a nonzero plane/local origin, undo/redo, native reopen, a second
sketch preserving the first, real held-worker cancellation, storage/expression
ABA, reset, history navigation, orphan writes, concurrent admission, pre-install
storage failure, fresh-service equal-counter refusal, post-commit reset, malformed
worker intent/evidence, and parent-frame calls. It does not use a fake modeler.

Use the existing runtime prerequisites and fixture procedure in
`CRAFT-PUBLICATION-20261104.md`. Build the app and the test helper with both
`CODI_EMBED_NUMERIC=1` and `CODI_EMBED_MANIFOLD=1`. Explicitly set both test
addresses; older scripts have historical defaults pointing to other fixtures:

```sh
JSKETCHER_TEST_URL=http://127.0.0.1:19982/node_modules/jsketcher-build/ \
CODI_TEST_CDP=http://127.0.0.1:19983 \
PUPPETEER_CORE_PATH=/path/to/puppeteer-core \
node test/webos/rectangle-creation-browser.test.cjs
```

The evidence receipt records exact source/assets and which regression scripts
were rerun. A prior test-only assertion counted undo notifications as creation
notifications; it was corrected to capture first accepted observations before
undo. A run without explicit URLs reached historical fixtures and is not
current-build evidence. Its results are retained separately.

## Remaining work

- Register discovery and the core command through the authorized desktop host;
  connect a human-facing action to this same operation. Parent-frame transport
  acceptance is not yet account/window/host-command qualification.
- Test real editor changes and added entities after this creation path, literal
  versus named driving values, numerical boundaries, and durable My files save.
- Complete whole-document transactions for formulas/materials/surfaces, not
  merely this bounded plane/sketch/history composition. Legacy expression and
  DXF paths still instantiate a hidden viewer and need separate extraction.
- Finish the full coupled plate/bracket/enclosure matrix, both engine mounts,
  parameter/units behavior, persistent references and material-aware 3MF.
- The separately researched OCC cleanup runtime is not promoted by this work.
