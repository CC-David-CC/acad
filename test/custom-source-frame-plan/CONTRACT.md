# Proposed finite C08 source-frame contract

Status: SOURCE PLAN ONLY. Base ACAD `32ae9c8`. No product implementation or runtime completion claim.

## What the current source actually provides

| Source | Reusable behavior / current limit |
|---|---|
| `web/app/cad/craft/sourcePlaneDepthCommands.ts`, `web/app/sketcher/headless/sourcePlaneDepthTransition.ts`, `sourcePlaneDepthEnvelope.mjs`, `sourcePlaneDepthClient.ts` | One source-plane depth edit already captures a real current source face/bytes/frame, reconstructs in disposable sketch Workers, preserves every local field except `metadata.boundaryFrame`, submits one prepared replay and travels in the single authored journal. Current admission is exactly independent principal `PLANE` with `datum:null`; it does not admit an arbitrary or attached frame. |
| `modules/workbenches/modeler/features/plane/simplePlaneOperation.ts` | `paramsToPlane` produces a mathematical plane from its normal and scalar offset. `run` makes a source shell with a stable canonical authored feature ID. Passing a datum does not preserve arbitrary x/y axes and tangential origin in the resulting source face: `MFace.evalCSys` derives them later from the shell/origin defaults. Merely exposing the legacy datum field is insufficient. |
| `web/app/cad/model/mopenFace.ts`, `mface.ts`, `surfacePrototype.js` | `MOpenFaceShell` already accepts an explicit `csys` and stable explicit shell ID; it passes the same csys to `MFace`. This is the narrow construction seam to preserve all four explicit frame vectors. Keep a genuine planar surface; no dummy prism or kernel result. |
| `web/app/cad/craft/datum/create/createDatumOperation.js`, `datum/rotate/rotateDatumOperation.js` | Legacy datum placement is a different family. Create silently remains at origin if a requested face is absent; rotate rotates basis vectors about origin while retaining the datum origin. These cannot be advertised as the proposed exact attachment or pivot operation. They stay untouched. |
| `modules/math/csys.ts`, `modules/math/matrix.ts` | Existing basis, forward/inverse and explicit-pivot rotation implementations can be reused inside the sketch Worker. Their normalization helpers must not silently repair invalid authored frames. No new geometry engine is needed. |
| `web/app/cad/craft/craftBundle.ts` `submitPreparedReplay` / `evaluatePipeline` | A private preparation can provide up to 64 exact source overrides plus frame witnesses, replay the complete graph and commit source writes/model/J together. `verifySketchFrames` currently binds only `PLANE`; add exact registered custom-source admission rather than weakening that guard. A dependent source requires a flushed candidate registry, unlike the existing contiguous-independent-plane optimization. |
| `web/app/cad/craft/cadRegistryBundle.ts` | Candidate source adoption is already tracked privately and checked at a full tip. Worker-owned solid faces explicitly cannot host sketches. The finite attachment must therefore use an actual retained source plane, not borrow a displayed solid face or native ordinal. |
| `modules/workbenches/modeler/features/workerSelectedProfile/workerSelectedProfile.operation.ts`, `modules/engine/mount/{selectedProfilePlan,polygonProfilePlan}.mjs` | Current V3 selected extrusion already consumes the actual face's full frame, solves the saved local sketch twice, prepares twice, and constructs the genuine Native solid. Both planners validate right-handed orthonormal frames at `1e-12`. No Native ABI or binary change is proposed. |
| `web/app/cad/craft/{closedSketchTransitions,unconsumedSketchSave}.ts/.mjs`, `modules/engine/mount/selectedProfileBudget.mjs` | Several explicit source/dependency and budget allowlists currently recognize only `PLANE`. They must recognize the new registered source producer deliberately; adding it to `AUTHORED_SOLID_KINDS` would be wrong. Source frames allocate zero Native result names. |
| `workerSolidPointCommands.ts`, `workerStepExportCommands.ts`, `workerManufacturingMeshReplay.ts`, `workerDrawingReadCommands.ts` | Each read captures its real operation descriptors and presently admits only the genuine standard `PLANE` implementation or registered solid features. All four must use the same narrow source-descriptor predicate so a new frame part is not stranded from existing read/export paths. Their publication/currentness/resource protections remain unchanged. |
| `projectEnvelope.mjs`, `projectValidationCore.ts`, `nativeArchiveSource.ts` in `web/app/cad/projectManager/` | Saved history is captured as data and evaluated through actual registered operations; canonical feature IDs are validated. New authored operation type gives older operation registries an explicit unsupported-operation failure, rather than silently treating new fields as a principal plane. Existing `.cad` streaming/codec/owner lifecycle needs no rewrite. |

## Finite saved operation

Proposed registered operation: `SOURCE_FRAME_V1`. It is a source-plane producer, not an authored solid, not a derived datum snapshot and not a second graph.

Exact params:

```js
{
  version: 1,
  unit: 'millimeter',
  featureId, // canonical positive safe authored identity
  parent: null | { featureId, faceId },
  placement
}
```

`placement` has exactly one of these two forms:

```js
{ kind: 'basis', frame: { origin:[ox,oy,oz], x:[xx,xy,xz], y:[yx,yy,yz], z:[zx,zy,zz] } }
{ kind: 'rigid', frame: { origin, x, y, z },
  axis:[ax,ay,az], angleDegrees, pivot:[px,py,pz], translation:[tx,ty,tz] }
```

The rigid form contains one explicit rotation plus translation applied to its saved base frame. There is no recursive transform list. These authored base/axis/angle/pivot/translation values are retained exactly; do not replace them in the document with a solved matrix or decompose/re-round them after replay.

Every vector is a dense exact length-3 own-data array. Each record is exact bounded plain own data across realms; reject getters, symbols, extras, sparse arrays, cycles, nonfinite values and invalid canonical IDs. Frame/translation/pivot coordinates use the existing signed source-placement envelope `abs(value)<=1e8 mm`; composed world origin must remain within that bound and a downstream kernel request may impose a stricter domain. Proposed angle domain is `[-360,360]` degrees; angle 0 is valid. Frame axes must already be orthonormal and right-handed at the existing dimensionless `1e-12` planner test. Reject zero/nonunit/nonorthogonal/left-handed axes; do not project, clamp or Gram-Schmidt them. The rotation axis must be finite, bounded and nonzero; its direction is explicitly normalized inside the Worker before rotation, following the existing Matrix3x4 rotation convention. Its exact authored components are retained. This normalization applies only to the rotation direction, never to a supplied frame basis. Zero direction is refused before calling Matrix3x4 (which otherwise returns identity for zero). Exact numeric requests, not expressions, in this slice.

Column convention: `world = O + x*u + y*v + z*w`. Inverse is the transpose of a validated rotation applied to `(world-O)`. Rigid placement in the parent's coordinates is `q' = pivot + R(axis,angle)*(q-pivot) + translation`; its basis vectors receive rotation only. Compose the resulting local frame on the left by the current parent frame. Parent null means world identity. Reject overflow/nonfinite composition before creating a source or allocating an ID. Derived values use binary64 without coordinate snapping.

Parent is the exact earlier active `PLANE` or `SOURCE_FRAME_V1` feature AND its actually recreated unique `MOpenFaceShell.face` ID. Canonical numeric/string ID equality follows existing authored identity policy. Never parse face ID grammar, infer parent by proximity or use ordinal/native face membership. Parent index must precede child; depth at most 16, custom-source count at most 64, existing total part bound 256. No dangling, self, forward, cyclic or suppressed parent. No solid-face, extrusion-cap or arbitrary datum parent is admitted. Reparenting an existing source is not included: edit retains the exact parent pair; remove/reparent requires a later reviewed dependency operation.

Use the current stable source-shell identity implementation shared narrowly from the standard plane constructor, so the source's one face ID is generated by the actual producer and stays stable across frame edits/replay. Neither public callers nor saved records supply a new shell/face ID. No native pointers, world-frame caches, meshes, digests or resolved parent matrices are saved in this operation.

## Public operation proposal

Core methods and matching Desktop commands (names proposed, not currently registered):

| Method / command | Exact public args |
|---|---|
| `inspectSourceFrames` / `inspect-source-frames` | `{}`; returns revision, genuine source rows/parents, detached authored placement, derived current world frame, scope and eligibility/refusal reasons. |
| `createSourceFrame` / `create-source-frame` | `{revision,unit:'millimeter',parent,placement}`. Internally allocate feature ID only after complete cheap bounds/dependency/domain preflight; create one empty saved sketch through the actual existing Worker empty-sketch preparation. Receipt exposes actual feature/face IDs. |
| `editSourceFrame` / `edit-source-frame` | `{revision,index,featureId,faceId,placement}`. Parent, feature, face and all local source intent are immutable. This changes basis/pose, not source geometry or a native result in place. |
| `inspectSourceFramePoints` / `inspect-source-frame-points` | `{revision,featureId,faceId,direction:'local-to-world'|'world-to-local',points}` with 1..16 bounded points; read-only Worker evaluation against the same captured current source frame. Returns bound derived coordinates, not authoring authority or Native material classification. |

No public request accepts source bytes, matrices as proof, allocator IDs, callbacks, handles or native indices. Existing `create-empty-sketch-plane`, `edit-source-plane-depth`, primitive append/rectangle source editing, selected-profile create/edit and `travel-authored-edit` stay public entry points for the whole workflow. Desktop uses existing registry documentToken, account/window scope, abort and scoped committed/unknown settlement; descriptor text stays under 4096 characters and total metadata under 64 KiB.

## One transaction, including descendants

1. Capture actual current manager/document, full-tip immutable history, operation descriptor/run identities, source namespace/key/version/bytes, complete bounded source-parent inventory and each actual frame, J/token/material/drawing/parameter state, current engine and resource authority. Refuse unsupported typed/assembly/active editor/prefix contexts explicitly; no automatic native build substitution.
2. Worker validates the original source graph, exact parent memberships, numeric placement and all local source residual/domain/admission facts. Compute the complete affected source-descendant closure from saved explicit parent IDs, not model coordinates. This includes custom children when an existing principal parent's depth changes.
3. In the Worker change only each affected sketch's `metadata.boundaryFrame`. Preserve all object/constraint/generator/label IDs, local parameters and numbers, constants, ordering, branch/admission semantics and every other metadata field. Require empty referenced boundary geometry; no remapping of projected model edges. Genuine local solver validation remains required. Independently recompute from the same original captured request in a fresh Worker; no solved candidate becomes an unverified seed. Journal travel checks the exact historical target bytes and returns them without canonicalizing their formatting.
4. Submit the SAME prepared candidate replay with the operation definition delta, all affected sketch overrides/frame witnesses and one prepared storage write set. The registered producer obtains its actual earlier parent in the candidate registry, computes its world frame in the Worker, and makes one real planar `MOpenFaceShell` with explicit csys. Candidate frame checks compare every affected source's actual frame; source adoption census must cover every saved source. Rebuild the actual owned suffix through existing operations. No display transform, accepted-input mutation, native copy as authority or borrowed retired handle.
5. Prepare all J records/charges/receipts/tokens first. Existing publication installs source writes + full history/models + shared J/full-tip anchors atomically before observer notification. No getter/callback after first write until publication is complete. No-op has no Native/J/token/ID change; failed/stale/cancelled operations preserve the entire last accepted source/model/J state. Postcommit observer/receipt failures remain committed and Undoable. Discard candidate resources before a failed receipt, and latch uncertain cleanup as currently required.

The depth command must enter the same preparation helper for affected descendants rather than retain its current one-source-only shortcut in an attached part. Its journal kind may retain its public identity, but stores/checks the complete bounded affected-source byte delta for exact travel. Custom edit gets a `source-frame` delta in the SAME journal. Custom creation needs one compound source-append delta (operation + exact initially empty source bytes), with source removal only on matching latest Undo and exact restoration on Redo; ordinary operation-append currently cannot own that storage delta. This is a narrow journal extension, not a second history. Apply existing 64-entry/8MiB charge and max(UTF16,UTF8) convention; never retain solved models or world caches.

## Exact proposed ownership

All paths are proposed, not changed by this packet. Root may split the shared integration splices serially.

| Owner slice | Proposed files / precise extent |
|---|---|
| New source capture/policy | NEW `modules/engine/source/sourceFrameIntent.mjs` + `.d.mts`; NEW `web/app/cad/craft/sourcePlanePolicy.ts` recognizes exact registered standard/custom source descriptors, captures their actual identity/dependency, never broadens solid membership. |
| New genuine source producer | NEW `modules/workbenches/modeler/features/sourceFrame/sourceFrame.operation.ts`; narrow export of existing canonical stable source identity in `.../plane/simplePlaneOperation.ts`; import/register splice only in `web/app/cad/workbench/workbenchesLoaderBundle.ts` `registerCoreOperations`. Existing principal plane output behavior unchanged. Reuse explicit csys in MOpenFaceShell; no model-class edit is expected. |
| Worker calculation/preparation | NEW `web/app/sketcher/headless/sourceFrameTransition.ts` + private envelope/client if not accommodated by existing depth envelope/client; narrow `solveWorker.ts` task route and `client.ts` reply admission. Extract/reuse existing depth metadata-only validation in `sourcePlaneDepthTransition.ts`/`sourcePlaneDepthEnvelope.mjs`; no global replay-equivalence change. Existing matrix/csys reused, not modified. |
| Coordinator/J | NEW `web/app/cad/craft/sourceFrameCommands.ts`; narrow `sourcePlaneDepthCommands.ts` delegation for descendant closure; `rectangleCreation.ts` PreparedSketchCommand type only if an explicit source-append delta is needed; `authoredEditJournal.mjs` capture/charge/travel for exact source deltas; `craftBundle.ts` imports/registration/source-append and source-frame travel/commit callbacks, candidate descriptor/frame guard. Share `pipelineTail`, evaluation resources, existing source writes and publication. |
| Existing source consumers | `unconsumedSketchSave.mjs` exact new source/dependency schema; `closedSketchTransitions.ts` source-owner recognition only (primitive authoring on a genuine custom source); `selectedProfileBudget.mjs` recognize validated source as zero result-name cost. Use new descriptor policy in the four existing Worker read/export files listed above. No engine catalog, Native ABI, kernel/ledger/model transform or default changes. |
| Save/native validation | New operation capture checked in `projectValidationCore.ts` before adoption and during replay; existing feature-ID validation unchanged. `projectEnvelope.mjs`/Native archive schemas and PM owner body require NO changes if arbitrary validated operation records already stream as currently read. Confirm this during implementation; report any extra file needed rather than silently widening the scope. |
| Public host | NEW Desktop `apps/system/jsketcher/source-frame-commands.mjs`, source-bound example and README; root owns index import/register/export splice. Existing host file coordinator and `.cad` route unchanged. |
| Complete proof preparation | NEW `test/custom-source-frame/` full public driver, independent original-matrix/source/native oracle and source notes, prepared only after product source is coherent. No per-step executions. |

Cross-family compatibility is explicit: numeric selected extrusion/through holes and existing read-only STEP/mesh/drawing replay must recognize the source producer correctly, without loosening their exact family/currentness predicates. Typed parameters stay unavailable in a history containing SOURCE_FRAME_V1 until integrated; C07 suppression/branch and modern delete/repair may conservatively refuse this new source family before allocating IDs. Do not silently claim all feature operations now support frame edits. Those preserved refusals should be exposed by discovery. Root must approve the listed shared-file splices before implementation. The numeric physical replay scanner (`web/app/cad/parameters/modernPhysicalBindings.mjs`) keeps its explicit typed-family refusal; it must not silently accept a custom-frame history. The C07 append policy already refuses this new type in a suppressed-history part; keep that preallocation/discovery refusal. No C07 flag/branch implementation expansion is requested.

## Failures and remaining acceptance boundaries

Proposed new specific codes: `INVALID_SOURCE_FRAME`, `UNSUPPORTED_FRAME_PARENT`, `INVALID_FRAME_DEPENDENCY`, `STALE_FRAME`, `UNSUPPORTED_FRAME_HISTORY`, with current `RESOURCE_LIMIT`, stale-document/history/source, abort, Native dependent errors and cleanup fences retained. A missing parent is a dependency failure, invalid handedness is a frame-domain failure, an unsatisfied local sketch is a solver/source failure, and an invalid Native extrusion is a kernel/feature failure. No convergence/impossibility inference. Originating feature/index and requested edit remain distinct on dependent failures.

Actual native point membership, quantities and retained BRep validity must come from existing Worker operations after full replay. Frame mapping observations and a mesh/canvas cannot prove them. A real full signed workflow, independent `.cad`/artifact analysis and cancellation/cleanup observations remain required before C08 qualification. No assembly, arbitrary native face attachment/repair, mirror, affine scaling/shear, large graph, typed frame, or future-version claim is included.
