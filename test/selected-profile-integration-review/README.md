# Selected-profile v2: bounded Craft integration review

Read-only source review, 2026-11-06. Reviewed source
`a27040f58e34dcdb960864cfc941fda9879f3053` (tree
`eb678845ca9894cc23457c942059d6981e1c9907`). This branch changes notes only.
It does not qualify a public workflow, new runtime, save/reopen result, or a CAD
gate. Component execution evidence remains in `test/selected-profile-kernel/`.

After this source pin, the integrator started a private
`modules/engine/extrusion/selectedSketchProfile.mjs` adapter for native-v3 exact
source/descriptors → the v2 request, reusing `deriveAuthoredRegions` and
`prepareSelectedProfileExtrusion`. That emerging adapter is a preparation layer,
not a substitute for the independent real Worker solve, currentness/publication,
history, or fresh native reopen tests below. It is not present in this review's
pinned tree and is not assessed here.

## Smallest truthful first feature

Implement one registered, revision-bound operation for **one selected region,
one OCC solid, positive numeric millimeter depth, explicit `separate` body
policy**. Reuse the existing authored history, sketch namespace, candidate
evaluation owner, HeadlessSketchWorkspace, native project envelope and generic
`MWorkerSolid`. Do not add a second editable document or retrofit the rectangle
portable-topology adapter.

Suggested operation name: `WORKER_SELECTED_PROFILE_EXTRUDE_V2`. This is a proposed
Craft feature identity; the kernel request is already
`solid.profile.extrude`, version 2. The mount returns a version-1 generic solid
result/mesh envelope, so these version numbers must not be conflated.

Persist only bounded authored intent: feature ID, source face ID, canonical
region descriptor ID, numeric depth, unit, explicit body policy, selected engine
and exact runtime revision. The existing source sketch remains the sole
editable geometry. Kernel handles, meshes, native face numbers and duplicate
analytic boundary payloads are derived data, not saved intent.

Keep the existing default engine/catalog unchanged during this experimental
wiring. Register an explicit verified selected-profile runtime revision; do not
silently reinterpret an old OCC history entry using new assets. A candidate
must use a coherent runtime for its native handle sequence, or refuse a runtime
mismatch before evaluation. Alternate engines remain explicitly unsupported for
this feature until their equivalent path is qualified.

## Source-to-history sequence

1. Public discovery captures document/source/history/expression/host lifetime
   revision. Read source from the owned candidate storage, solve in the genuine
   headless Worker, then extract its regions. Report region existence, solve
   status and per-backend support separately. Execution must repeat admission;
   discovery is not a transferable authorization token.
2. Resolve the requested canonical descriptor against that solved source and
   current frame. Sorted primitive IDs identify a boundary; they are not its
   traversal order. Recover ordered contours and exact solved endpoints/circles.
   Do not reconstruct a classified rectangle from its bounding box, round
   coordinates, or weld a real gap. `ReadSketch` preserves Point/Segment and Arc
   coordinates; it also derives full-sweep Arc topology as Circle while keeping
   native Arc source unchanged. Ellipse/spline/partial-arc source is not a
   supported selected-profile v2 boundary merely because it is drawable.
3. Bind the prepared request to source bytes/digest, face/frame, canonical
   region identity, parameter/script state and lifetime. Use the same strict
   `captureSelectedProfileRequest` planner for discovery and execution. Explicitly
   map global descriptor primitive IDs to exact source-local objects: global IDs
   can exceed the kernel curve-ID cap. Do not truncate IDs or split arbitrary
   strings to recover a local ID.
4. The owned OCC mount evaluates the request and retains its native handle.
   Verify the result and read its Worker-produced display buffers. Extend the
   checked generic solid ledger for this operation, preserving runtime pinning,
   currentness, resource close and publication checks. Mount ownership binding
   alone does not prove that a returned shape came from the expected authored
   source. Keep source/intent verification before publication and add malformed,
   unsolicited and held-success response controls.
5. Project to `MWorkerSolid`: whole native result, no invented face/edge/vertex
   selection topology. The v2 frame is already applied to native/world geometry;
   keep generic model placement identity rather than applying it twice. Preserve
   native volume/bounds separately from tessellation-signed volume/bounds with
   explicit coordinate space and measurement quality.
6. Publish one accepted history/model transaction using existing Craft replay.
   Return `created:[solid], consumed:[]`. Retain the source plane and all its
   regions, including unselected geometry. Record usage through the authored
   feature's source reference; hiding a plane is a presentation policy, not
   source deletion or consumption. No editable sketch clone per extrusion.
7. Native save captures the existing source namespace and history. Reopen stages
   the native sources and replays this registered feature against its saved
   engine revision. Rebuild a fresh handle and display, never deserialize an old
   native token. Public history inspection/undo/redo must recognize the new
   feature and preserve its selected-region intent.

Retaining the plane does **not** make it safe to use the unconsumed-sketch
fast-save path. Once a feature references that source, an edit must atomically
replay every dependent feature, or refuse explicitly. Keep current fail-closed
guards until this is implemented. The smallest first acceptance can permit
extrude region A then region B from unchanged source, while explicitly refusing
unsupported dependent source edits. Do not claim parametric source editing from
that narrower result. Depth edits require their own existing-owner journal/replay
route; a public append operation plus GUI timeline pointer is not proof of that.

## Exact integration conflicts

| Source | Current behavior | Bounded action |
|---|---|---|
| `web/app/cad/craft/workerFeatureCommands.ts` | Public extrusion discovery accepts four outer IDs/no holes. Execution/receipt expects a v1 prism and LID; history inspection recognizes rectangle/hole/corner feature types. | New typed selected-region discovery/append/history contract, checked through the same Worker preparation. Generic output receipt without `lidFaceId`. Retain v1 behavior separately. |
| `modules/workbenches/modeler/features/workerRectangleExtrude/workerRectangleExtrude.operation.ts` | Calls rectangle Worker preparation and consumes `face.root`. | New feature with retained source. Do not repurpose this operation or silently change old saved semantics. |
| `modules/engine/extrusion/rectanglePrismAdapter.ts` and its rectangle projection | Executes kernel profile version 1 and establishes six-face/twelve-edge/four-source-edge portable provenance. Its profile-preparation `version:2` is not the new kernel version-2 contract. | Bypass for generic selected-profile result. No fabricated LID, swept sides or downstream v1 hole/repair capability. |
| `modules/engine/mount/occ-selected-profile-mount.mjs` | Private pinned v2 component, outside default catalog. | Explicit experimental runtime/factory/assets and checked revision binding. |
| `modules/engine/mount/catalogMount.ts`, `engineCatalog.mjs` | Default OCC uses old verified runtime. Catalog validation checks exact engine/revision. | Deliberate revision-specific binding, no default promotion or silent same-engine mount substitution. |
| `modules/engine/solid/solidLedger.mjs` | Accepts box/Boolean only; owner ledger holds one engine/mount and native output handles. | Share its checked ownership/projection path with new region-bound intent. Refuse incompatible runtime mixing. |
| `modules/engine/solid/solidMetrics.mjs` | Generic OCC metrics expose tessellation-signed volume/bounds; native volume/bounds from v2 are discarded. | Validate and expose native measurements separately without upgrading tessellation quality labels. |
| `web/app/cad/model/mworkerSolid.ts` | Already represents a whole owned native solid with verified Worker Float32 display and empty selectable topology. | Reuse without manufacturing rectangle face roles. |
| `web/app/cad/craft/workerSolidCommands.ts` | Generic body inspection works for `MWorkerSolid`; public solid history specializes box entries. | Add precise selected-profile inspection/history receipt if this is the shared public surface. Avoid a second competing command model. |
| `web/app/cad/craft/craftBundle.ts` | Full replay supplies private source registry/storage and owned engine resources; consumed models are removed. Some edit/journal paths explicitly list v1 feature types. | Reuse replay/publication; explicitly integrate history travel/source-edit dependency semantics rather than broadening type guards blindly. |
| `web/app/cad/craft/unconsumedSketchSave.mjs` | Unknown feature types refuse, existing dependent rectangle source refuses fast save. | Preserve fail-closed behavior for the new dependency; add proper full replay before offering source edits. |
| `web/app/cad/parameters/authoredPhysicalManifest.mjs`, `physicalBindingFields.mjs` | Typed physical bindings specialize existing authored features. | Numeric-depth first; advertise typed parameter binding unsupported until collectors/replay/source bindings are qualified. |
| `web/app/cad/projectManager/projectManagerBundle.ts` | Native save gathers all source sketches; restore requires registered feature runner and stages source before replay. | Existing format suffices. Strictly validate new feature fields and demonstrate fresh reopen with exact runtime available. No migration/import project. |

`selectedProfilePlan.mjs` is intentionally conservative: exact local-axis
rectangles and full circles, at most 24 curves/8 holes, positive bounded depth,
proper orthonormal frame, bounded coordinates and strict separation. Current
region existence classification has different tolerances/coverage. A descriptor
existing in `MSketchRegion` is not proof that this planner accepts it. Unsupported
regions should remain discoverable with their refusal, not disappear or be
described as an invalid sketch.

## Ordered acceptance queue

- [ ] Current public Worker source authoring → discovery → one 10×10 region,
  depth 5 → native solid; independent volume 500 and bounds.
- [ ] Circle r10/depth5 and annulus r20-r10/depth5; native volume 500π/1500π,
  independent opening/boundary checks, no rectangle topology capabilities.
- [ ] Two disjoint rectangles in **one unchanged source**: extrude A, rediscover
  both source regions, extrude B; two stable output IDs/native handles. Undo B,
  redo B; A, source, region IDs and authored bytes remain intact.
- [ ] Nested three-circle descriptors: choose one disk/annulus at a time and
  preserve exact hole membership. Changed descriptor membership refuses or
  requests reselection explicitly.
- [ ] XY/XZ and genuine oblique frame: correct world placement/normal with no
  duplicate transform; save/reopen preserves frame and region selection.
- [ ] Native save/fresh project reopen regenerates both outputs from the one
  source and registered history; no saved handle/display payload masquerades as
  authored intent. Repeated replay does not duplicate source or output identity.
- [ ] Stale revision/descriptor, source replacement, expression change, cancellation,
  visible Close and held genuine successful reply cannot publish after ownership
  is revoked. Owner/mount resources close; previous accepted bytes/history/model
  remain intact. Malformed/private result and unsolicited-source controls refuse.
- [ ] Explicit refusals: unsupported kernel/runtime, body policy, boundary,
  near-rectangle, gap, touching holes, zero/negative depth, ID/cap excess.
  Underconstraint is separate from profile validity and backend support.
- [ ] Dependent source edits and depth edits either perform full atomic replay
  through the shared journal or are explicitly unavailable. Source retention
  alone must not bypass dependency checks. Test supported edit/refusal,
  undo/redo and fresh native reopen before claiming parametric reliability.

Multiple regions in one request, union policy, generated-face provenance,
downstream v1 hole reuse, typed depth, manufacturing export and default runtime
promotion are separate later cells. Existing component success does not qualify
these. STEP/3MF are not implied by a display mesh or a valid native handle.
