# Legacy physical writer: an existing public path

Source-only followup to 57c6228, on Core f6156cd852a6a90ed3aee9b50dee915ecd22a54e
plus that review. Desktop source inspected at
5396ff43400cc489eadcde1de30555b11894cef2. No execution, test, build, probe,
product change or qualification claim.

The path exists in the current public API. No new operation or private source
seed is necessary. In particular, the existing Desktop `createCadAgent` helper's
`buildBracket()` already creates the complete literal source/feature chain.
Undoing the FIRST `apply-physical-bracket` transaction is the operation that
selects `legacy-physical-sketch-transaction-solve`. Merely changing extrusion
depth or running a modern selected-profile recipe does not select it.

## Public construction and its actual history

Desktop `apps/system/jsketcher/index.mjs:212` registers rectangle, feature and
parameter commands against the same current window target. The helper in
`apps/system/jsketcher/examples/cad-agent.mjs:73` uses these actual commands:

1. In a new empty host-bound document, inspect `inspect-rectangle-creation`, then
   `create-rectangle-sketch` with `unit:'millimeter'`, `origin:[0,0]`, `width:100`,
   `height:50`, `depth:0`. Keep the returned actual face/region IDs.
2. Inspect `inspect-worker-features`; require `ready`, `capabilities.extrusion`
   and the candidate matching those returned IDs. Call
   `create-worker-extrusion` with that current revision/candidate and `depth:20`.
3. Inspect again and use the actual centered-hole candidate with
   `create-worker-centered-hole`, `diameter:10`.
4. Inspect again and use the actual four-corner candidate, including ALL actual
   semantic side IDs, with `create-worker-four-corner-holes`, `diameter:4`,
   `offsetX:10`, `offsetY:10`.

Do not construct opaque IDs, request a modern selected extrusion instead, or
invoke the workbench's generic legacy `EXTRUDE`. The public facade submits these
three exact operation kinds (`workerFeatureCommands.ts:53`):

| Public command | Actual authored operation and numeric fields |
| --- | --- |
| `create-worker-extrusion` | `WORKER_RECTANGLE_EXTRUDE_V1`; allocated featureId, actual `face`, `[regionId]`, `length:20` |
| `create-worker-centered-hole` | `WORKER_CENTERED_THROUGH_HOLE_V1`; allocated featureId, actual LID `face`, `diameter:10` |
| `create-worker-four-corner-holes` | `WORKER_FOUR_CORNER_THROUGH_HOLES_V1`; allocated featureId, actual center-wall `face`/`sideIds`, `diameter:4`, both offsets10 |

Rectangle creation itself appends the real principal `PLANE` and stores the
actual four-Segment/11-constraint rectangle. Its IDs `rect-0`/`rect-1` are the
producer's genuine source identity, not a caller-supplied seeded sketch
(`rectangleCreation.ts:62–66,112–193`). Width/height binding uses those actual
rows and preserves the same source face. The retained region must remain the
actual matching rectangle region; use discovery after each change.

These operations are still registered in the normal ModelerWorkspace
(`modules/workbenches/modeler/index.ts:72–84`). They use the existing legacy
prism asset graph, not the modern catalog/default chooser. In particular,
`workerRectangleExtrude.operation.ts:16–17,91–105` imports
`codi-occ-portable`/`codi-occ-wasm`; webpack aliases point to `.build/prism-assets`.
`oci-verified-mount.mjs:4–5` fixes JS
`a84b31900e58e61a1d7e3f8d04978408455764ad149923359e7fba19d3d07884` and WASM
`07d763a05f35cd257501d339d9087df63c65bcaeb51a4f4f80832e333892e12e`.
The public facade has no engineRevision argument and must not silently substitute
a newer cohort. Discovery checks registered operations and browser readiness;
it does not prove staged asset availability or successful Native execution.

## Exact reachability of the renamed writer

`inspect-physical-parameters` returns `brackets` only when there is one legacy
extrusion, one four-corner feature and a genuine supported rectangle source
(`craftBundle.ts:947–958`). Use that returned `faceId,index,featureId` and its
current revision. Call `apply-physical-bracket` with names `width`, `height`,
`edgeX`, `edgeY` and four length definitions:

```javascript
[
  {name:'width',  dimension:'length', expression:'mm(150)'},
  {name:'height', dimension:'length', expression:'mm(30)'},
  {name:'edgeX',  dimension:'length', expression:'mm(9)'},
  {name:'edgeY',  dimension:'length', expression:'mm(8)'}
]
```

Desktop `parameter-commands.mjs:27` forwards precisely this public request.
`physicalBracketOperation` (`craftBundle.ts:1130–1138`) binds width/height in the
same actual sketch and offsets on that actual corner feature. Depth20 and both
hole diameters stay numeric. No caller source bytes are accepted by this API.

The relevant branch conditions are all concrete:

* `requireModernPhysicalHistory` returns false for this history: none of these
  legacy kinds belongs to `AUTHORED_SOLID_KINDS`. It neither rejects this history
  nor converts it to modern operations.
* First binding makes a `physical-transaction` journal entry containing empty
  `beforeSource`, typed `afterSource`, exact previous/current sketch bytes and
  the two exact offset changes. This is the current common journal path, not the
  explicitly unavailable old `parameter-bracket` travel.
* Immediately inspect `inspect-authored-edits` and call `travel-authored-edit`
  with its revision and `direction:'undo'`. `authoredEditTravel` dispatches the
  physical transaction back to `physicalSharedOperation`.
* `planPhysicalTravel` (`authoredEditJournal.mjs:204–210`) requires exact current
  source/bindings/sketch bytes, then supplies the entry's empty `beforeSource`
  and actual pre-binding rectangle as `wantedSketch`.
* Consequently `modern===false`, `faceId` is that wanted source face and
  `targetSource===''`. At `craftBundle.ts:1048` these conditions issue the NEW
  `legacy-physical-sketch-transaction-solve` request with the genuine saved
  numeric sketch, its boundary and `externalParameters:{}`.

The Worker retains the old numeric regeneration behavior under this explicit
writer name (`solveWorker.ts:214–228`). The full physical transaction verifies
the saved intent, preserves/restores the exact wanted journal bytes, prepares
the normal source write and replays the actual complete suffix before the same
source/expression/J/model publication. It is not a read-healing path.

Redo uses the same journal target through `travel-authored-edit`, restores the
same named source/bindings/IDs, and selects `typed-rectangle-bind` rather than the
empty-source writer. A depth-only physical edit may have no sketch delta, so
its Undo is not an adequate replacement for this width/height binding chain.

## One feasible complete whole-workflow sequence

This is a proposed complete runner sequence, not an executed proof:

1. Discover the current command/window/document token; create a fresh document
   and execute the literal public bracket sequence above. Retain actual command
   results, source/feature identities and `inspect-published-worker-geometry`.
2. Apply the four named bindings above. Inspect current definitions/quantities,
   the same source/feature IDs, expected bounds150×30×20 and actual five
   cylindrical hole observations (center75/15 R5; corners at9/8,141/8,9/22,
   141/22 R2). This public inspection is bounded published analytic geometry,
   NOT an independent Native mass/classification query.
3. With no intervening authored edit, Undo that physical transaction: empty
   source, original numeric width100/height50/offsets10, same IDs and exact prior
   sketch bytes. This is the target writer invocation. Redo must restore the
   exact typed source/bindings and accepted geometry. Current journal inspection
   must identify the actual travel target; do not manufacture a history entry.
4. Through `apply-physical-bindings` with `changes:[]`, edit the definitions
   (e.g. width160, others unchanged). Exercise a genuine invalid length dimension
   and stale revision refusal while preserving prior accepted source/J/model;
   travel the successful definition edit and back, then save the accepted typed
   document as an owned `.cad` through public `save`.
5. Await ordinary committed Save and normal Files server synchronization. Fresh
   public `open-project` from another owned CAD window must rebuild the same
   legacy operations from actual saved source; compare preserved named fields,
   source IDs, raw rectangle intent, bounds and hole observations. Do not expect
   the old session's Undo stack to persist through Open.
6. Reedit a named definition using freshly inspected targets, prove new-session
   Undo/Redo, normal resave/server-sync and a second fresh Open. Independently
   inspect actual ZIP source entries and quantities/geometry after the whole
   run; keep final `.cad` and historical JSON roles distinct.

Native archive source preparation stores the same `captureModel()` history and
expressions plus actual sketch inventory (`projectManagerBundle.ts:679–708`).
Worker preflight evaluates a recognized typed physical source without a
modern-family-only restriction (`projectValidationCore.ts:25–29`); restore arms
that actual prepared typed state before ordinary history evaluation
(`projectManagerBundle.ts:940–944,993`). There is no source-confirmed .cad format
or public-authoring capability gap in this chain. Asset/runtime admission,
regeneration, all target observations and full Save/Open success still require
the one genuine complete run; this review establishes reachability, not success.

No manufacturing assignment/export or Native-point-reader support for legacy
plate bodies is inferred. The modern protected reader family restriction is a
different capability and is unnecessary to reach or preserve this writer.
