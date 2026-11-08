# Phase B: current-source implementation contract for native face attachment

Proposal only, reviewed against integrated Phase A `df70adf` and root's bounded
equal-frame-role repair `a9022ce`. No product edits, tests, probes, builds or
browser execution. This refines `NATIVE-ATTACHMENT.md`; its concrete replay and
publication ordering below supersedes the earlier generic installer suggestion.
Phase A is not native-face attachment or C08 closure. Its R1 failure/evidence
and original source branches remain unchanged; this document claims no new pass.

## 1. Actual seams and authority

| Current source/function | What it proves; what it does not |
| --- | --- |
| `modules/engine/mount/prismSelectionIndex.mjs`, `createPrismSelectionIndex` | Actual constructor provenance maps `first-cap`/`last-cap` to real native members. `selectionLineageIndex.mjs` lifts/carries unique inherited membership and unresolved evidence. Public callers discover an opaque ID and role; they never construct an ID or join response ordinals. |
| `modules/engine/mount/oci-verified-worker.js`, `solid-selections` | Builds/caches `selectedSelectionIndices` against the actual owned native shape and binds its producing feature. `selectedSourceProfiles` holds the real prepared source frame/region/depth, only in modes which actually populate it. These private maps, not a source-context string, can corroborate attachment. |
| Same Worker, `readOwnedDrawingReferences` | Joins a private selection resolver, complete validated `_ReadOwnedTopologyV1` and genuine source profile in the Worker. It is a useful pattern, not an attachment API: drawing facts/tolerances do not grant frame authority. |
| `ownedTopologyContract.mjs`, `validateOwnedTopology` | Validates bounded complete native faces, including analytic plane origin/normal, orientation and wire uses. Its topology-index fields are private response-local locators. Its general direction-validity bound does not establish the stricter frame/placement policy. |
| `worker-controller.mjs`, `readSolidTopology` | Returns detached topology and expressly denies authoring authority. Do not use it on main as an alternative to the new protected join. |
| `solidLedger.mjs`, `evaluateWorkerSolid`, private `ledgers`, `s.outputs`, `s.sources` | Genuine candidate membership/build/producer, original selected-profile source binding and native handles. `s.outputs` removes consumed operands; retained native names alone do not make an operand a current result. Accepted `MWorkerSolid` objects have retired ownership and cannot supply borrowed handles. |
| `sourceFrame.operation.ts`, `sourceFrameRun` | Runs inside the actual candidate, before returning its independent `MOpenFaceShell`. It currently handles only earlier source-plane parents and checks saved source against the derived frame. It must gain a distinct native-parent branch, not pretend a native face is a source plane. |
| `craftBundle.ts`, `evaluatePipeline` loop | Awaits a feature, then installs its created models through `registry.setModels`. The loop is serialized under the existing pipeline tail and evaluation owner. This is the point at which parent BRep production and child source adoption can be ordered. |
| `cadRegistryBundle.ts`, `createEvaluationRegistry.setModels` | Calls `sketchStorage.readSketch(id)` before setting the sketch on a newly created independent face. Once `sourceFrameRun` returns, it is too late to prepare that source before this read. Keep `checkWorkerFace`'s prohibition against sketches on native Worker-owned faces. |
| `sourceFrameCommands.ts`, `graph`; `candidateSketchStorage.mjs` | Phase A prepares static source/frame overrides before replay. This cannot know a changed native parent plane which is produced later during replay. The existing static path must remain compatible; it is insufficient for Phase B. |
| `authoredFeatureOperation` in Craft | Selected depth/region changes currently prepare journal proposals before native replay. Native-attached source deltas become known during replay, so the proposal/workspace must be finalized before publication using a private prepared participant, rather than appending another journal event afterward. |

The smallest native seam is a **new Worker-only semantic join over the existing
native topology export**. No new C++/WASM ABI, geometry algorithm, raw pointer,
face-count expectation or native persistent result name is proposed.

## 2. Saved intent and public admission

Keep Phase A's exact `{featureId,faceId}` source-parent form and its null parent.
Add one explicitly tagged native form to `SOURCE_FRAME_V1.parent`:

```js
{
  kind:'native-planar-face', engine:'occ', engineRevision,
  bodyId, featureId, selectionId, originFeatureId,
  sourceFeatureId, sourceFaceId, sourceRegionId,
  framePolicy:'extrusion-cap-source-datum-v1'
}
```

This record has eleven keys. It is a saved locator, not a saved plane witness.
The existing `placement` remains the only authored relative pose. Persist no
native member ordinal, native handle, analytic plane or additional world pose.
The existing `sketch.metadata.boundaryFrame` remains a derived persisted witness
and must be validated; do not claim the ZIP has no frame cache.

Discovery is a bounded actual observation (`inspect-source-frame-attachments`),
bound to current document/history/geometry revision and an actual accepted
body/producer. It reports discovered opaque selections, eligibility/reasons and
small derived facts only after successful observation cleanup. A public create
uses the existing `create-source-frame` operation and a compact parent input
`{kind:'native-planar-face',bodyId,featureId,selectionId}`. The service infers the
saved build/origin/constructor fields from actual discovery and revalidates them
in the real write candidate. Public facts/frames are not reusable capabilities;
no caller may supply a plane, claimed role or constructor datum as authority.
Normal frame editing cannot replace the parent. A separate guarded
`repair-source-frame-parent` operation changes it explicitly through the same
source-frame journal family, preserving local sketch intent and relative pose.

First required success is a selected-extrusion last cap with genuine unique
current planar membership. The candidate may carry that cap through an already
qualified ancestry operation only when the actual resolver remains unique and
the native face still satisfies the frame policy. Capability is never inferred
from the descriptor's old role alone. First-cap/box/side/general curved support
must not be advertised without its own implemented policy and whole workflow.

## 3. Minimal protected plane read

Proposed private mount request (not a JSON-registry command):

```js
{op:'solid.face.frame.read',version:1,unit:'millimeter',
 handle,sourceHandle,producerFeatureId,originFeatureId,selectionId,
 sourceFeatureId,sourceRegionId,
 framePolicy:'extrusion-cap-source-datum-v1'}
```

The private ledger derives both handles. It checks its actual current candidate
output/model and producer, constructor source/face ID, exact whole-part engine
revision, selection snapshot and registered descriptor. The source face ID is
the ledger's actual model-source binding; the current native profile request
does not independently contain that face ID. Do not pretend the Worker has
proved it a second time or parse a region ID to recover it. The Worker checks
both owned tokens, their current producer bindings, the actual prepared source,
feature/region/context and the requested opaque selection's unique `resolveFace` result.
It reads/validates the **complete** current topology before privately resolving
that member. No ordinal, bounding-box extreme, proximity match, mesh or displayed
face is accepted. Missing/split/merged/generated-only members remain unresolved;
a different generated planar face is never substituted.

Frame policy is explicit. Let O/X/Y/Z be the genuine constructor datum, and
P/N the actual selected native support plane. Apply the actual face orientation
to its normal. For last cap, require the eligible positive-extrusion alignment;
unknown/internal/external orientation, nonplane support, nonfinite/range failure
or unqualified alignment refuses. Use the native plane's intersection with the
datum-normal line through O as the frame origin. Derive its in-plane X from the
datum X and actual normal, then the right-handed Y. This basis construction is
the declared coordinate-system policy, not snapping or modifying BRep geometry.
Do not use nominal depth as the origin or silently clamp/project a bad frame.
The original source orientation resolves in-plane roll; native plane parameters
alone do not. Plane incidence/alignment and right-handed-basis checks run in the
Worker. Do not copy the drawing tolerance constants or treat the general
topology validator's direction bound as attachment acceptance. Freeze exact
policy constants in the implementation review: existing source-frame basis
checks remain dimensionless `1e-12`, saved-frame equality remains `1e-9 mm`,
and neither is the user's independent 50 pm geometric acceptance criterion.
An unresolved numerical qualification refuses rather than using nominal data.

Return at most one frame and a small analytic-plane/orientation witness,
`<=4 KiB`; long requested IDs need not be echoed because the controller binds
the exact pending request/token/sequence privately. No complete catalog crosses
to main for this operation. Existing native topology bounds remain
1024 vertices/512 edges/256 faces and existing total encoded-observation bounds
remain unchanged. This is a capability limit, not a prediction of shape counts.
The read costs zero result names and mutates no native input. Native BRep,
catalog, tolerances/settings and name census must be preserved independently.

## 4. Exact causal replay and candidate source installation

Use **one** `evaluatePipeline`, registry, ledger and owner. Do not pre-run a
second feature graph or retain duplicate native geometry to obtain a plane.
Proposed NEW `sourceFrameReplay.ts` is a small private coordinator, not a general
pre-initialization hook, public callback or alternate storage model:

1. Capture the exact history, original source bytes/versions/namespace, existing
   accepted frames and target definitions under the existing document/service,
   source, expression, journal and resource currentness guards. No live fallback.
   Inventory remains at most 64 sources, chain depth 16 and the existing bounded
   source/frame preparation charges. Reserve no native result for a read.
2. Create the candidate-only storage view before the evaluation registry. Keep
   its public interface read-only. Its private coordinator may install only
   exact authenticated source-frame rows for the currently executing captured
   SOURCE_FRAME entry, once per replay. No arbitrary ID/function installer.
   Existing static overrides/removals keep their old semantics; competing
   proposals for the same source must match exactly or refuse.
3. Evaluate the real parent feature normally. Before the child's SOURCE_FRAME
   operation returns its model, a lexical candidate-context method
   `prepareNativeAttachedSource(rawEntry)` checks exact captured params identity,
   current loop index, genuine registered operation and causal parent position.
   It calls the protected ledger plane read on the actual current parent result.
   The independent source has not yet been registered or read as a sketch.
4. Apply the saved relative placement to that actual parent frame in the existing
   headless frame Worker. Validate/reframe the captured local source in the
   Worker using existing original-equation/domain/replay checks. Compare every
   authored field, IDs, order, constraints and local geometry exactly; only the
   derived boundary-frame witness can change. Distinct frame roles in a request
   remain detached trees, preserving the shared client guard and `a9022ce`.
5. Install the resulting source bytes and derived frame in the private view
   **before returning the child `MOpenFaceShell`**. Registry `setModels` then
   performs its unchanged strict source adoption/read. Every later selected
   profile/hole consumer reads those same candidate bytes/frame. Source-parented
   grandchildren resolve after this child in the same real history loop.
6. At pipeline completion require exact coverage, unique ownership, causal order
   and no unconsumed pending preparation. Return a privately held prepared source
   delta to the existing publication preparation. Never expose that installer,
   native handles or source bytes as a public authoring shortcut.

A parent is current **at the child entry's causal position**. Consumption before
that entry invalidates the locator. Consumption later in history does not
retroactively remove a plane witness already obtained legitimately at that
position; it also does not grant a public handle to a consumed final output.
New attachment/repair discovery still requires an actual selectable current
accepted parent. No automatic retargeting to a later consumer is allowed.

## 5. Edit, read and Open modes; one publication/journal

The private coordinator has modes issued only by real entry points, not saved
or caller-controlled flags:

| Actual entry | Source/cache behavior |
| --- | --- |
| Fresh attachment | Prepare the genuine new local empty source and derived witness; source ID is allocated by the ordinary guarded allocator only after preflight. |
| Authorized parent depth/region, source pose/depth or explicit attachment repair | Check original cached frame against the captured accepted source, derive the new frame from this candidate's parent, prepare changed source bytes. Child local intent remains exact. |
| Shared Undo/Redo | Recompute against the selected historical definition and require the exact recorded source before/after bytes and locator deltas. Never regenerate a different journal truth. |
| Read-only point/STEP/mesh/drawing replay | Validate existing cache against the actual re-created parent; return no source writes, epoch publication or model changes. |
| Native `.cad`/JSON Open | Validate the saved cache against actual parent replay before successful adoption; stale cache refuses. No cache healing during import. |

Phase A's eager `graph` cannot independently derive native parents. When a
native-attached closure is present, route affected source-frame preparation
through this coordinator; do not silently omit native children from the graph.
The finite successful write paths must include selected depth and region edits,
their travel, principal/custom source edits and attachment creation/repair.
Other operation families must either use that same closure or refuse a known
affected attachment before allocation/publication. Add metadata-only dependency
census to existing deletion/repair admission where necessary. C07 controlled
families/caps do not widen: Source-frame histories remain outside that finite
suppression/branch capability until separately integrated.

Actual source deltas are known only after parent-native production. Finalize the
existing edit's journal proposal and `storage.prepareWrites` from that private
delta **before** the normal publication commits anything. Extend existing
selected-depth/region/source-frame entry records with the same bounded source
delta when needed, not a second event or Undo stack. Apply existing eviction,
redo truncation, byte charge and high-water rules without raising global caps.
Failure to fit refuses before publication. Complete workspace/model/J/full-tip
and document-token installation has no callback/read/await in its commit
interval. No-op changes preserve redo and tokens. Notification failures after
commit stay committed and Undoable; receipt failure must not imply rollback.

Preflight `sourceFrameValidation.ts` may validate a native locator's exact
schema, earlier-producer relation, cache's finite orthonormal structure and
dependent-source order. It cannot claim native plane equality without OCCT.
Keep this deferred check private and derived, with no persisted trusted flag.
The full candidate pipeline must complete the native check before resource
acceptance. Existing PM native-restore staged-write rollback and exact-owner
cleanup remain the authority; no archive-owner, container ABI or Files change is
needed. A dangling or stale-cache own archive must fail the actual Open pipeline
and retain healthy continuation, not bypass validation.

## 6. Ownership, errors and cancellation

The protected ledger reader requires genuine `ledgers.get(owner)` membership,
candidate state/currentness, current registry output and exact engine/source.
It may be called internally during a model-purpose candidate, or from the
actual observation-purpose replay. The public discovery wrapper requires
`owner.requireObservationOnly()` permanently; no role is switched or promoted.
The internal read does not make an observation owner acceptable. Native shapes
and their existing constructor handles remain within that owner's lifetime and
the current native-result budget; no extra retained seed/source geometry.

Document/native/caller signals use actual native intrinsics, plus exact captured
manager/service/document generation, namespace/source versions, current authored
definition/journal, material/drawing/presentation and operation descriptors.
Check before/after every awaited read/preparation and before publication. Late,
cancelled or superseded work cannot install accepted sources or return an
available observation. Any candidate failure closes only its own owner and
discards candidate source/workspace data. Cleanup uncertainty remains latched;
falsy thrown causes and original operation failure must remain truthful. Read
receipts are issued only after owner cleanup is established. No claim that
termination ran native finally or synchronously reclaimed OS memory.

Use structured codes/reasons, never message inference. Reuse existing
`INVALID_FRAME_DEPENDENCY`, `UNSUPPORTED_FRAME_PARENT`, `UNRESOLVED_SOURCE`,
`STALE_FRAME`, `RESOURCE_LIMIT`, abort/currentness and engine-integrity channels.
Unresolved detail distinguishes missing parent, lost selection, split, merged,
type/orientation change, source-datum change and unqualified plane/frame. Preserve
the earliest recorded lineage failure; generated evidence does not heal it.
Discovery may report unavailable eligibility, but real regeneration throws on an
unresolved required source. Native parent failure remains attributed to that
parent; downstream attachment failure remains distinct. No fallback source or
last-frame guess turns either failure into a successful current result.

## 7. Exact proposed implementation ownership, pending approval

| Slice | Proposed files / smallest splice |
| --- | --- |
| Semantic native read | NEW `ownedPlanarAttachmentProtocol.mjs`/types and Worker-only `nativePlanarAttachmentFacts.mjs`; narrow `oci-verified-worker.js`, `worker-controller.mjs`, `SolidKernel.ts`. Existing `_ReadOwnedTopologyV1` only. |
| Private current binding | `solidLedger.mjs`/types: one candidate plane reader. Reuse current outputs/constructor source/selection witnesses and mount validation; no new public handle factory. |
| Causal source preparation | NEW `web/app/cad/craft/sourceFrameReplay.ts`; narrow private candidate-store variant in `candidateSketchStorage.mjs`; exact lexical callback/finish-participant in `evaluatePipeline` and existing prepared publication. Existing static overlay callers unchanged. |
| Authored intent/validation | `sourceFrameIntent.mjs`/types native-parent union; `sourceFrame.operation.ts`; `sourceFrameMath.ts`/transition/client envelope for existing bounded Worker arithmetic; `sourceFrameValidation.ts` structural/deferred native checks. No general IO rewrite. |
| Shared commands/history | `sourceFrameCommands.ts`, bounded `authoredEditJournal.mjs` attachment/source deltas, selected-depth/region Craft preparation and travel, pure dependency admission for affected operations such as `workerFeatureDeleteCommands.ts`. No second graph/J or unrelated Craft edit. |
| Public bridge | Existing Desktop `source-frame-commands.mjs` compact schema expansion and on-disk example; root owns index splice. Public discovery/create/repair use the same shared operations as human invocation; no new UI framework. |
| Packaging | Root-coordinated exact optional mount capability/closed dependencies, stagers and common bootstrap pins. Feature is advertised only when genuinely staged. Native bytepairs, current default and exact saved whole-part backend remain unchanged. |

These shared seams require explicit ownership approval before code. No current
common Worker, ledger, controller, source producer, PM or Desktop file was edited
for this plan. This is a required complete foundation slice, not a proposal to
declare native-face attachment unsupported forever.

## 8. One complete eventual public workflow and independent truth

1. Publicly create an actual XY rectangle 100×50 and selected extrusion F,
   depth 20, on one explicit qualified native build. Discover F's actual
   last-cap opaque selection and native attachment facts; never construct its
   ID. F volume is 100000 mm³. No face-count oracle.
2. Create attached independent source S with identity relative placement.
   Author a genuine local Circle centered (50,25), radius 5, then selected
   extrusion G depth 10. S is not a sketch on F's Worker face. Independent G
   volume is 250π mm³ and bounds [45,20,20]→[55,30,30]. Classify G inside
   (50,25,25), outside (56,25,25); F inside (20,20,10), outside (20,20,22).
3. Public depth F 20→25. F volume becomes 125000; G remains 250π and moves to
   bounds [45,20,25]→[55,30,35]. G contains (50,25,30), excludes (50,25,22),
   and F now contains (20,20,22). Require identical source-local geometry,
   constraints, feature/body/source IDs and parent locator; cached S frame
   changes from z20 to z25 through genuine candidate preparation/publication.
4. Include a non-origin pivot/custom parent pose, independent exact transformed
   point oracles, source/grandchild propagation and mixed creation/edit Undo/Redo.
   Verify exact historical source-byte restoration and unchanged high-water
   semantics. No material/drawing references are deleted or retargeted.
5. Prepare another eligible parent before S and a real alternate source region.
   Changing F to the alternate region must refuse the old locator/datum rather
   than bind a geometrically similar new cap. Preserve the accepted state/J.
   Explicitly repair S to the genuinely discovered alternative parent and then
   retry the original edit; verify S follows only the chosen parent. Lost versus
   split/merge/type-change controls require genuine native evidence; absent
   actual cases remain unqualified, not synthetic native passes.
6. Cover stale/wrong producer/origin/build/source/selection, nonplane, alignment,
   cancellation/concurrent writer/late reply, resource cap and cleanup failure.
   Source BRep/catalog/tolerances/settings/name census before/after the read are
   exact; healthy continuation and no read-result names. Model/source/currentness
   checks are not independent geometry proof.
7. Normal `.cad` Save/sync/real Files Open in a fresh signed context, native
   reconstruction, depth reedit/travel/resave/second Open. Independently inspect
   ZIP/source: one authored locator/relative pose, exact local source intent,
   derived boundary-frame witness matching actual parent, no ordinal/handle or
   extra authoritative world pose. Own dangling-locator/stale-cache archives
   refuse without successful adoption; healthy file continues to open. No
   account/race/security probes.

Use independent formulas/points and saved-source identity, not two engine paths
agreeing as geometry truth. Native expanded bounds/metrology estimates, frame
cache validity, solver residuals and the 50 pm geometry criterion remain distinct.
Only the complete required Phase A+B workflow can qualify the finite C08 scope.
