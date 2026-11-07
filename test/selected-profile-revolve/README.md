# Queued E13 source/operation/command candidate

Checkpoint `cb0f4a062` is based on `224f3302d`. Work was safely checkpointed when
the user prioritized the Worker/resource state-machine audit. This is **not**
complete authored/public E13 qualification. No ledger, catalog, default, Craft
journal, public desktop adapter, project format, or deployment changed.

Saved `WORKER_SELECTED_PROFILE_REVOLVE_V1` has exactly these ten parameters:

```js
{version:1, unit:'millimeter', engine:'occ', engineRevision, featureId,
 faceId, regionId, axisSegmentId, angleRadians, bodyPolicy:'separate'}
```

The opaque region comes from actual discovery. `axisSegmentId` is the real local
native Segment object ID scoped by `faceId`; its actual `data.a → data.b`
direction comes from the same solved source and frame. Construction Segments
are already supported by production primitive append, and may lie outside the
selected boundary. Callers do not construct child endpoint IDs or qualify IDs
with a face prefix. Saved intent contains no digest, solved curves/endpoints,
frame, duplicate body, display mesh, native ordinal, or handle.

`selectedSketchProfile.mjs` adds a depth-free verified polygon-source seam,
preserving old extrusion behavior. `selectedSketchRevolve.mjs` discovers actual
source Segments and opaque regions, resolves the chosen real Segment from that
same verified native source, and invokes the existing depth-free revolve plan.
There is no dummy extrusion or new geometric construction algorithm. New
`inspect-revolve` / `prepare-revolve` semantic tasks retain the existing64KiB
response cap and typed failure handling.

The new operation repeats real source solving and semantic preparation in
independent Workers, compares exact results, corroborates axis endpoints with
the real solved native object, and keeps source/frame/history/namespace/host
ownership current through the final publication check. The initial scope is
untyped source with no project/external bindings, numeric signed radians only,
one independent retained source plane, one region, one valid separate solid.
Typed/project parameter inputs explicitly refuse. Generated revolve selection
provenance remains unavailable as in the earlier qualified component.

## Factory contract root must supply

```ts
createWorkerSelectedRevolveOperation({evaluate, buildPolicy})
createWorkerRevolveCommands(ctx, submit, cancelEpoch, buildPolicy)
```

`buildPolicy` uses the real registered catalog and complete generic history:

- `listBuilds()` returns explicit registered revolve-capable records.
- `requireBuild(engine, revision)` requires exact backend identity and
  `revolveVersion:1`; no preference/default substitution.
- `historyBuild(history)` includes consumed and empty generic features and
  refuses mixed builds.
- `budget(history, revision)` returns the existing whole-part native work
  estimate, with `withinLimit`, `remainingNativeResults`, and `reason`.

The operation calls the injected **real shared ledger evaluator** with:

```js
{owner, kind:'revolve',
 request:{version:1,unit:'millimeter',engine:'occ',engineRevision,featureId,
          revolve:capturedPreparedComponentRequest},
 sourceBinding:{featureId,faceId,regionId,axisSegmentId},
 registry, valid, createModel}
```

The `request` above is ephemeral and captured by
`captureOwnedRevolveEvaluation`; it is never the saved authored definition.
`createModel` constructs the real `MWorkerSolid`. The callback returns the
existing ledger shape `{model, consumed:[], publicationCheck}`. The operation
checks actual single-solid native metrics, runtime pins and retained-plane
semantics, then registers its publication check with the existing owner.
No fake evaluator success is provided by this checkpoint.

The command factory exposes:

- `inspectWorkerRevolves()` — readiness, explicit builds/budgets and source faces.
- `inspectWorkerRevolveRegions({revision,faceId,engineRevision}, opts)` — real
  double-Worker source reconstruction/discovery; no native output publication.
- `createWorkerRevolve({revision,unit,engine,engineRevision,faceId,regionId,
  axisSegmentId,angleRadians,bodyPolicy}, opts)` — shared submit, private feature
  allocation only after build/capacity/source admission.
- `inspectWorkerRevolveHistory()` — existing authored entries and edit readiness.
- `editWorkerRevolve({revision,index,featureId,angleRadians}, opts)` — delegates
  exactly to root's `craft.authoredRevolveAngleOperation(args, opts)`.

Old-build histories refuse creation before ID allocation. Fresh parts select
the new backend explicitly. Read-only source inspection remains distinct from
creation capacity. Root still owns ledger-kind support, generic-history/build
and budget accounting, source dependency classification, operation/schema
registration, creation append travel, the distinct angle-edit journal kind,
all Craft hooks and native Save/Open/public adapters.

## Root integration: typed request and ledger admission

The shared SolidKernel request vocabulary now includes the depth-free revolve
request. The owned solid ledger has a dedicated revolve evaluation branch,
requires exact feature/face/region/axis binding before mount allocation, retains
the source face for publication checks, checks explicit mount capability and
requires one valid, measured, positive-volume native solid. It sends the captured
revolve request, without a temporary extrusion or conversion. Revolve does not
claim prism selection ancestry or a hole-constructor lineage.

Seven focused controls exercise refusals before allocation/dispatch for missing
or mismatched source binding, accessor fields and unavailable mount capability.
They use explicit protocol doubles and manual ephemeral input; no successful
native result, solved sketch or model publication is synthesized. Combined with
14 retained source/planner and5 retained ledger controls,26 controls pass; TypeScript
passes. These are candidate admission changes. Success through this ledger with
the real native mount, failure/cancellation cleanup, downstream Boolean behavior,
shared feature history and normal Save/Open remain unqualified.

## Verified scope and remaining work

The real production sketch Worker builds native source through its actual
empty-sketch and primitive-append commands; it is not supplied hand-authored
native JSON. Real coordinate-edit and inspection commands then change source
and axis geometry. Actual Chromium sketch/semantic Workers pass:

- 7 preparations: genuine concave stepped source with full/quarter/reverse
  angles, existing ordinary boundary Segment axis, genuine construction-axis
  coordinate edit, genuine profile coordinate edit, and real annular source.
- 6 typed negatives: missing Segment ID, Circle used as axis, zero/over-angle,
  stale opaque region and changed digest.
- Independent double solves/discovery/preparation agree;51 real disposable
  Workers are terminated. These tests do **not** execute native solid creation
  or authored application history. Earlier native/Worker component evidence
  remains separate.
-14 retained source/planner tests pass, both production Worker builds pass,
  and current TypeScript passes.

The first source fixture omitted its actual vendored `web/lib/verb.js` because
the staging command used the wrong source path. Its real load failure is
retained. The second immutable fixture includes and pins the genuine asset;
no solver/model assertion was weakened. The first TypeScript log preserves an
inference error for a JS map initialized as `{}`; using the normal data-only
null-prototype map resolves typing without relaxing admission.

Still queued: thorough operation/command protocol/lifetime/cancellation tests,
root's real ledger integration, actual shared authored replay, source edits
with dependent native solids, creation and angle Undo/Redo, post-commit caller
loss, signed host commands, native Save/fresh Open/reedit, and the complete E13
acceptance corpus. Public facade handling of unsupported axis discovery rows
also needs focused coverage. Do not promote this candidate on source-only tests.

The source test fixture is `/tmp/codi-selected-profile-revolve-source-20261106-r2`.
`source-r2.json` pins the actual production Worker bytes and contains the real
native source and observations. Its own browser was closed; the owned20934
server was stopped; shared19329 was untouched. Reproduce using a fresh staging
directory with compiled sketch/semantic Workers plus the actual vendored verb
asset, the provided loopback-only `serve.py`, and Puppeteer-core24.35.0:

```sh
PUPPETEER_CORE_PATH="$PUPPETEER" node test/selected-profile-revolve/source-browser.cjs \
  "$STATIC_ROOT" "http://127.0.0.1:$PORT/" "$NEW_RECEIPT"
```

Preserve the real fixture's `workers/sketch.js`, `workers/semantic.js`, and
`lib/verb.js` layout. No account, private state, fake Canvas, or browser UI shim
is involved.
