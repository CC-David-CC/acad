# Worker-backed rectangle extrusion: investigation and proposed boundary

Research only. This records a candidate next slice, not implemented support or
an engine qualification. Based on fork `9bde6b29`. A signed desktop test on
the preceding rectangle source created an authored 100×50 mm sketch, reopened
it from My files, edited it to 150×50, saved and reopened, and used the current
EXTRUDE wizard to produce a solid with independently measured 150×50×10 mm
bounds. That test did not establish volume, generic profiles or a command API.

## Actual path and gaps

* The user-facing operation is `ExtrudeOperation` in
  `modules/workbenches/modeler/features/extrude/extrude.operation.ts`. It
  resolves its selected face and `SKETCH_REGION` references via the normal
  operation schema, and reads the native authored sketch via the sketch storage
  service. Its dependent-sketch solver already uses the isolated sketch Worker.
* It then synchronously calls `occ.utils.sketchToFaces`: the existing sketch
  loader creates named OCC geometry/edges/wires from authored contours and the
  actual face frame, `mkplane` makes faces, and `prism` makes the solid. Explicit
  regions and body policy determine region cuts/unions. `FromSketchProductionAnalyzer`
  classifies generated topology and attributes IDs to authored source segments.
  `occ.io.getShell` interrogates the kernel and constructs the model. Neither
  this production path nor its topology classification is presently a worker
  operation: `interact.js` reads `window.__OCI_EXCHANGE_VAL` and carries native
  pointers, and EXTRUDE itself registers a `window` pagehide handler.
* `oci-verified-mount` is a separate research worker. Its declared versioned
  commands currently cover box, three Boolean operations and dispose, not
  sketch contours, face construction, extrusion or imported CAD model objects.
  It returns bounded summary evidence and opaque mount-scoped handles, not the
  full topology/provenance needed by JSketcher's renderer, registry and later
  operations. It does not prove a nonempty result is exactly one solid. The
  interpreter runtime's key/name ownership and command-specific return semantics
  must be qualified against the actual pinned source; content hashing alone is
  not proof that arbitrary commands or native memory lifetime are safe.
* The Manifold research worker also exposes box/Booleans, with a different
  mesh representation. It is not the native JSketcher BREP and cannot be
  substituted for OCC or silently converted. Neither worker mount is yet the
  production CAD engine. Mesh and OCC capabilities remain separate.
* Opaque worker handles cannot be persisted as a project, passed as main-thread
  WASM addresses, or reused after worker death. Current production replay and
  several later operations expect `brepShell` external pointers in their own
  interpreter. Thus a returned triangle preview or a worker-created `box` is
  insufficient to publish the authored extrusion as an editable CAD feature.

## Smallest honest command

A first version may accept exactly one explicitly chosen current rectangular
region on the plane produced by the rectangle command: an XY principal frame,
four authored straight edges and one bounded region with no holes, no Boolean,
positive finite one-sided depth, and body policy `separate` (one result). It
must create a real EXTRUDE authored request referring to that face and region,
not an anonymous BOX or copied vertices. This deliberately does not claim
support for general rectangles, rotated planes, multiple regions, nested
profiles, Native Mesh extrusion, Boolean modifiers, or other history states.
Those must be typed refusals, not fallbacks. Unit is millimeter.

Proposed discovery: `inspectRectangleExtrusion()` returns readiness, a
revision token bound to document/project/storage/service identities and the
relevant history/model/region/engine revisions, an opaque stable face ID,
the complete persisted region descriptor/ID (including its authored edges),
and engine/capability information. `extrudeRectangleRegion({revision, faceId,
regionId, engine:'occ', depth}, {signal, valid})` checks the token and exact
identity, obtains the selected sketch and current frame from authored state,
and appends the same normalized `EXTRUDE` request that the wizard consumes.
Do not infer a hole from nesting or select an arbitrary current face. Stable
feature IDs belong to the document; worker handles do not. A human action and
the registered command must call the same validated operation and revision
boundary, rather than a special agent-only geometry path.

## Required sequence before exposing it

1. **Domain extraction.** Extract a narrowly typed, bounded profile/operation
   preparation from EXTRUDE's existing region selection, direction and
   provenance semantics; retain the current wizard's validated path. Supply an
   authored sketch, exact selected descriptor, current face frame, and explicit
   direction/depth; do not pass a viewer, DOM, native pointer or fake canvas.
   If this logic cannot yet be shared without changing the wizard semantics,
   keep the new command unavailable.
2. **Actual OCC worker operation.** Extend the verified mount with a versioned
   selected-profile extrusion operation using the *same* contour-to-wire,
   face, prism and topology/provenance rules, adapted to a worker-safe kernel
   interface. Pin/verify the worker bootstrap and its runtime; prove exact
   command return/fresh-output handling and ownership against the runtime used.
   Define finite payload, topology/tessellation/shape/name and time budgets;
   reject degenerate/unclassified results, no-op stale names, bad or empty
   outputs. Do not use the old `window` exchange or assume all interpreter
   commands have the same success return. Manifold must explicitly refuse until
   its own representation and behavior are qualified.
3. **Result/ownership bridge.** Define a versioned bounded response containing
   a worker-owned live BREP handle plus data needed to build the renderer and
   full model/registry entities, with persistent authored-to-generated topology
   identities and a documented precision/tolerance policy. Validate that the
   worker result is one valid closed solid and independently measure bounds,
   orientation and volume. Establish how later supported operations address the
   same mount-owned object, and how worker crash/close invalidates results.
   No raw native pointer crosses realms and no derived mesh replaces the native
   document. If the result bridge cannot preserve production IDs and downstream
   use, return an explicit unavailable error and keep the previous model.
4. **Atomic coordinator.** Privately evaluate the current accepted history
   with its storage overlay and the candidate EXTRUDE, await the worker under
   the existing document/window/account cancellation and revision discipline,
   then recheck model/history/storage/expression/engine lifetimes. Publish the
   complete accepted history, live model/registry, engine ownership and any
   affected sketch state together, with no callbacks/await between install
   steps. A canceled, crashed, invalid or conflicting candidate must dispose
   its private mount and leave the last complete state intact. A reset after
   installation reports committed supersession. Retire previous mounts only
   after accepted references no longer use them; bound active/queued jobs and
   total worker resources. Save only authored native history and selected IDs;
   on reopen regenerate into a fresh mount or show an explicit stale/failure
   state with recoverable authored intent.
5. **Only after those gates**, register an app command and human action using
   the same core operation. Do not advertise it merely because a standalone
   worker can make a geometric prism. Preserve the existing ordinary wizard and
   main-thread behavior until the shared path is genuinely qualified.

The implementation should reuse `modules/engine/mount/worker-controller.mjs`,
`oci-verified-{mount,worker}.*`, `inventory.mjs` and existing extrusion files
where their contracts actually apply. Likely narrow new files belong under
`modules/workbenches/modeler/features/extrude/` for the shared data-only
profile and adapter, `modules/engine/mount/` for the versioned worker operation
and bridge, and focused tests in `test/webos/` plus mount tests. Publishing a
worker-backed model will require explicitly reviewed changes to shared craft,
registry, model/scene and project-lifecycle APIs; those files require ownership
coordination with the lead before edits. Native Mesh is a separate lane. No
new transport, hidden editor, provider connection or duplicate file store is
needed for this boundary.

## Evidence required

* Actual Chromium Worker with strict CSP and verified runtime: rectangle at a
  nonzero origin and plane depth, at least two sizes, one valid closed solid,
  independent bounds/volume/orientation and authored-edge topology identity;
  no `window`, DOM, canvas, or main-thread kernel call during the operation.
* The same input via the real wizard and command produces equivalent geometric
  and persistent-reference semantics. Test changing the original width, replay,
  undo/redo, save/reopen and an existing consumer referencing a generated face;
  no mere screen/success check or hard-coded topology index.
* Contradictory/rejected dimensions, missing/replaced/stale region, multiple or
  touching regions, unsupported Native Mesh/engine, invalid depth and unit,
  deleted source, ambiguous topology and invalid/empty kernel result all fail
  explicitly while retaining previous accepted geometry and authored bytes.
* Hold actual jobs while changing account, window, project generation, history,
  sketch bytes, expression state, engine generation and service identity; test
  reset/abort before and during publication, wrong revision, worker timeout,
  crash and disposal. Verify no new accepted model or storage before commit,
  exactly one coherent accepted publication, and honest committed-superseded
  results afterward. Enforce and test admission/memory bounds.
* With a real signed isolated My files service, save and compare server digest,
  close/reopen in a fresh session and rerun independent geometry and reference
  checks. Two accounts and window disposal remain separate tests. This does not
  establish a production release or physical printing.
