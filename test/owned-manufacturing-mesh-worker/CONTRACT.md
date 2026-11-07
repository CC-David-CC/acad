# Owned manufacturing-mesh Worker transport: proposed first component

Status: **proposal and BEFORE capability controls only**. Core base `8b8adfc7b39d968e026c2078d971d62cf8cd6d37`. No dispatcher, bootstrap, catalog, shared operation, ledger, public API or UI was changed. No geometry-positive Worker reply was simulated. The native source/results are independently frozen at `c15e49dfbb5bb5fcf7b5c81e7c63724c81807ae0` on `feature/owned-manufacturing-mesh-v1-20261107`; product source remains `0e429519e97a29e991ec4aa42b5ea6ddab24ddbb`.

The single authored project, saved engine revision and accepted current output remain authoritative. This read creates no feature, saved mesh, secondary project, material assignment, native name, timeline/journal entry, source edit or implicit geometry migration. Generic 3MF, paired material interfaces, export/file writes and manufacturing readiness are outside this slice.

## Reuse the existing transport

`worker-controller.mjs` already holds one pending sequence/deadline and mount-bound handle→private token→frozen evidence record. Its STEP and orthographic methods capture before async dispatch, require the appropriate exact-runtime capability, validate a single Native-begun marker, check small result envelopes, and recheck record/current handle after the reply.

`oci-verified-worker.js` already owns the private token→native name map, one operation at a time, verified native bytes, exact owned-name calls, scratch allocation, chunk yields, tagged exception capture, release in `finally`, and unchanged names/counters/token checks. Reuse those paths. Do not add a public job, scheduler, separate cancellation token, buffer cache or mutable readiness flag.

Reference seams: `readOrthographic` / `readOwnedOrthographic` and `ownedOrthographicReadProtocol.mjs` for binary transfer and bounded metadata; `exportSTEP` / `exportOwnedSTEP` and `ownedStepExportProtocol.mjs` for Begin/Read/Release status validation and cleanup precedence. `solid.mesh.read` remains display-only; old enclosure manufacturing is a separate specialized contract. Neither is widened or relabeled.

## Explicit runtime and capability

The new component constructor is proposed as `createManufacturingMeshOccMount(options)` in `modules/engine/mount/occ-manufacturing-mesh-mount.mjs`, with descriptor engine `occ-manufacturing-mesh-v1-component`, representation `occ-brep-worker-owned` and `manufacturingMesh:true`.

Exact production inputs:

- Original full-main JS: `2914d9598842df0e0a1f1ba228728ea05b338d84454931d71b75dcd6e5a936bf`, 313795 B.
- One reviewed exchange-callback adaptation, portable JS: `32eec74e3019d9e2d767c9016f05aa3daa49441c6102423a269d67b9c7f02a08`, 313745 B.
- WASM: `abbf2aa02a6f2101c600aa1eedd20fa80ab2db206e677ca860d9c5103cdfbfcc`, 36011152 B.
- Prospective exact revision: `sha256:32eec74e3019d9e2d767c9016f05aa3daa49441c6102423a269d67b9c7f02a08:abbf2aa02a6f2101c600aa1eedd20fa80ab2db206e677ca860d9c5103cdfbfcc`.

The adapted JS/WASM pair costs 36,324,897 B before shared module/embedded-wrapper overhead. No old native asset may be dropped to conceal this increment. Native binaries remain outside Git.

The new capability is permitted only when both exact native hashes and the explicit flag agree. Require the three Native FFI exports before `ready`. Extend the existing inherited-runtime guard chain explicitly (manufacturing→orthographic→STEP→adaptive→loft→sweep→revolve/Boolean), retaining all old exact pairs and default flags false. Native inherited exports have real retained evidence; the new composed Worker must still run inherited controls. A new native pair merely containing a function is not authority to advertise it. Old constructors, old saved revisions, SMLib and Manifold keep their original descriptors and refusals.

Proposed descriptor operation:

```
{id:'solid.manufacturing.mesh.read',version:1,
 input:'owned-current-single-solid-controls-v1',output:'owned-manufacturing-mesh-buffer-v1',
 maxBytes:8388608,maxChunkBytes:65536,maxVertices:150000,maxTriangles:100000,
 linearDeflectionMm:0.01,angularDeflectionRadians:0.1,relative:false,
 nativeResultCost:0,scope:'response-local',qualification:'native-component'}
```

No catalog registration/default promotion in the first component. A later separately reviewed catalog step must register the exact pair, module graph and optional availability. An unstaged build must remain absent/unavailable, not advertised. Existing whole-part history never silently switches native revision.

## Request and source binding

Proposed mount request has exactly nine own-data fields:

```
{op:'solid.manufacturing.mesh.read',version:1,unit:'millimeter',handle,
 linearDeflectionMm:0.01,angularDeflectionRadians:0.1,relative:false,
 maxVertices:150000,maxTriangles:100000}
```

Finite positive but unsupported controls yield `MANUFACTURING_MESH_UNSUPPORTED_CONTROLS`; invalid primitive data, unknown fields/accessors, mutable shared storage or malformed handles yield `INVALID_REQUEST`. Limits can be caller-lowered positive integers within the hard bounds. Capture/freeze all small input before any await or signal/user callback. No native name/pointer/resource ID is caller input.

The controller requires a current same-mount/generation/representation handle and the SAME private `solidRecords` entry before dispatch and after result admission. Authenticated saved evidence must establish positive finite native volume, `solidCount===1`, `empty===false` and native validity, under the exact mount runtime. A sole-solid count alone does not prove absence of orphan children: Native performs the full bounded shape-tree test. Unsupported empty/multi/non-solid shapes refuse; cavities with multiple boundary shells may pass.

Worker wire request is exactly `{kind:'solid-manufacturing-mesh',seq,token,linearDeflectionMm,angularDeflectionRadians,relative,maxVertices,maxTriangles}`. Resolve the token only through the private `shapes` map (`nameFor`); retain the map entry, actual name, native name count, `nextName`, selected-result triangle budget and input name bytes around the operation. Native owns original BRep/catalog/location/tolerance/attached-mesh preservation and current-name membership. Never adopt a legacy pointer or DRAW name. Native owned-name membership alone is not trusted creator provenance; only the Worker map established by admitted actual operations supplies that boundary.

A mount component does not prove project/source-feature membership. Later ledger integration must follow `exportCandidateWorkerSTEP`: capture bodyId+producer featureId+exact engine revision+expected native metrics under the existing candidate owner; require registry model object identity and immutable private output record; map to the private handle; recheck owner/revision/geometry revision/model/metrics before and after each await and before artifact use. No body-ID grammar, selection ordinal or display mesh can replace that check. The output is temporary and does not alter manufacturing metadata or the source document.

## One pending read and one Native lease

Native ABI and all code/status positions remain exactly the frozen Native contract:

```
BeginOwnedManufacturingMeshV1(namePtr,nameBytes,linearMm,angularRad,relative,maxVertices,maxTriangles)
ReadOwnedManufacturingMeshV1(resourceId,offset,destination,capacity)
ReleaseOwnedManufacturingMeshV1(resourceId)
```

1. Capture the same request once, bind the private source and check all preconditions. Allocate bounded name bytes; call genuine Native Begin and admit its exact 17-field receipt (≤2048 encoded bytes). One active Native lease; monotonically issued IDs1..1024.
2. Emit exactly one small `{kind:'manufacturing-mesh-begun',seq,op:'solid.manufacturing.mesh.read'}` marker for the SAME pending operation. Derive the begun state from the existing pending record. No Native resource ID leaves Worker. Duplicate/unsolicited/wrong-sequence/wrong-operation markers close the mount. Check deadline/signal/state around callbacks, as the current STEP/orthographic guards do.
3. Allocate one detached-from-WASM `ArrayBuffer(begin.byteLength)` (≤8 MiB) plus one ≤65536-byte Native scratch region. Read only exact sequential offsets/capacity min(remaining,65536); each receipt must match id/offset/length/EOF. At most128 nonempty chunks. Reacquire HEAP views after every Native call because memory can grow. Yield between chunks; use the same original deadline and signal. Validate a final zero-length EOF read at `offset===byteLength`.
4. Require explicit Native release with `released:true,activeCount:0` BEFORE result decoding/publication; cleanup in `finally` if any earlier phase failed. Free all scratch/name allocations. Release/cleanup failure overrides ordinary outcome and closes the realm; preserve the original failure as `operationError`. Use tagged failure records, not truthiness of thrown values.
5. In Worker only, validate/decode the binary described below; retain the SAME captured controls, source token, counters and evidence. No main-thread coordinate/index traversal or geometry hashing.
6. Recheck current private source mapping, source name bytes, Native owned count, `nextName` and result budget. Transfer the buffer once. A failed publication or unexpected nondetachment is fatal; never blindly resend. Normal completion retires the Native lease before publication, preserves the accepted source and creates no new owned name or result-budget charge.

Main cancellation/timeout/close terminates the pending Worker under the existing mount lifecycle. During synchronous Native Begin the Worker cannot process another message; termination reclaims that realm/heap. Do not claim the explicit Native Release function executed after termination. When execution continues normally or throws within a live realm, `finally` must establish release. Ordinary domain/resource refusals keep the existing source/mount usable; cancellation closes that candidate realm. Later accepted-model protection belongs to the existing owner/candidate transaction, not a new rollback system.

## Binary, heavy validation and detached result

The proposed first output transfers ONE standalone binary ArrayBuffer, retaining the frozen explicit little-endian layout and avoiding a second whole-mesh copy. It never transfers `HEAP8.buffer`. Main consumes only bounded metadata and intrinsic buffer length; geometry consumers decode in Worker. No host-endian assumption is needed: use DataView with littleEndian=true there.

Header: ASCII `CMESH001` at0..7; Uint32 vertexCount@8, triangleCount@12, positionsOffset32@16, indicesOffset(32+24*vertexCount)@20; reserved zeros@24/28. Float64 XYZ positions followed by Uint32 zero-based triples. Exact length `32+24*vertexCount+12*triangleCount`; no extra/truncated bytes. Bounds:1..150000 vertices,1..100000 triangles,≤8MiB.

Worker decoder checks actual header/counts/offsets against captured Native Begin; finite coordinates; all indices integral/in-range/distinct per triangle; nonzero finite triangle geometry; no duplicate triangles; every undirected edge has two opposite directed uses; each used vertex has one cyclic link; no unused payload vertices. Work is bounded by the declared vertices/triangles and at most300000 halfedges/triangle corners; explicit temporary adjacency work caps must refuse rather than truncate. Curved cavities/multiple boundary shells must not be rejected merely for disconnected boundary components or Euler characteristic4. This decoder does NOT certify general geometric self-intersection, shell nesting, material assignment, paired interfaces or an achieved global surface-error bound. It must not require mesh volume to agree with native BRep within1e-6.

Proposed private final wire packet is exact `{kind:'manufacturing-mesh-result',seq,token,metadata,buffer}`. Metadata is ≤2048 encoded bytes and exact:

```
{version:1,quality:'native-controlled-tessellation',format:'owned-manufacturing-mesh-v1',
 byteLength,vertexCount,triangleCount,positionsOffset,indicesOffset,
 linearDeflectionMm,angularDeflectionRadians,relative,
 correspondence:'native-topology-parameters-v1',maxBoundaryDiscrepancyMm,
 sourcePreserved:true}
```

Counts/controls/offsets must equal admitted Begin and requested hard/lowered caps. `maxBoundaryDiscrepancyMm` is finite, nonnegative and ≤0.01; it is the measured edge-sample discrepancy, NOT a global achieved surface certificate. Main result capture is descriptor-only/own-data, intrinsic attached nonshared ArrayBuffer length and exact seq/token/record binding. Public component result is `{op:'solid.manufacturing.mesh.read',contractVersion:1,unit:'millimeter',metadata,buffer}`; no token, native name, pointer, native lease or persistent mesh ID escapes. The receiver owns the transferable artifact; the Worker must observe its output buffer detached after successful postMessage. A released/disposed source cannot be substituted by an equal-looking body or same name.

Native input caps also remain1000 faces/4096 edges/8192 vertices/65536 incidence visits, bounded16MiB snapshot streams; output work can allocate before counts are known. Current app paths have their own smaller catalog/whole-part limits. Do not claim this increases those domains or establishes peak-work/RSS limits. Artifact triangles are bounded per read and do not increment the existing cumulative authored-result/display triangle budget.

## Error and integrity policy

Native codes/status mapping (negative position, unchanged): INVALID_REQUEST1, UNSUPPORTED_CONTROLS2, INVALID_SHAPE3, EMPTY_INPUT4, UNSUPPORTED_SHAPE5, CORRESPONDENCE_UNAVAILABLE6, NON_MANIFOLD7, RESOURCE_LIMIT8, FAILED9, INPUT_CHANGED10, BUSY11, INVALID_READ12, STALE_SOURCE13, PUBLICATION_FAILED14; each is prefixed `MANUFACTURING_MESH_`.

Caller schema/handle/stale-lifetime errors refuse before Native work. Valid unsupported controls and shape/domain/correspondence/nonmanifold/resource refusals are ordinary only after their exact Native status/receipt and successful cleanup/source checks. `INPUT_CHANGED` is always fatal and preserved. Native FAILED remains an engine failure, not topology rejection. Unexpected Native INVALID_REQUEST/BUSY/INVALID_READ/STALE_SOURCE after the validated private state, missing/mismatched native receipts, malformed progress/final payloads, decode failure, callback/publication or cleanup failure are integrity/protocol failures: reject and close. Do not reinterpret missing proof as invalid geometry, fabricate success, fallback to display tessellation or silently change controls.

## Candidate files and ordering after review

First component implementation only:

- NEW `modules/engine/mount/ownedManufacturingMeshProtocol.mjs`: exact small captures/status/receipt/result metadata and native code lists. Main-safe; no scalar mesh loops.
- NEW `modules/engine/mount/manufacturingMeshRecord.mjs`: Worker-only exact binary decode/validation, no DOM/renderer.
- NEW `modules/engine/mount/occ-manufacturing-mesh-mount.mjs`: explicit exact-pair constructor, inherited capabilities.
- Narrow `worker-controller.mjs` and `oci-verified-worker.js`: flag/pair guards, one marker/operation, Native lease service, read-only/private source and result checks.
- NEW `build/prepare-manufacturing-mesh-profile-assets.cjs`: fresh component output only, pinned bootstrap and native input, existing `stageOwnedProfileComponent`/embedDisplayProjection. Include the protocol/decoder and all inherited dynamic plan/lineage modules. Refuse ANY existing destination before invoking the shared stager; do not widen the known default-output destructive behavior in this task.
- Update every retained OCI bootstrap pin consumer TOGETHER when bootstrap changes: `prepare-selected-profile-assets.cjs`, `embedded-oci-worker.cjs`, `prepare-loft-profile-assets.cjs`, `prepare-adaptive-metrology-profile-assets.cjs`, `prepare-step-export-profile-assets.cjs`, `prepare-orthographic-profile-assets.cjs`, plus the new stager. Existing native hashes remain unchanged.

Later, separately reviewed: SolidKernel request/result types, an optional normal-build asset entry/availability factory and engineCatalog registration, inherited build eligibility, ledger candidate mesh read, generic material metadata/3MF interface proof, Craft/host/UI and normal signed acceptance. None is authorized by this proposal or BEFORE results. Current full builds/defaults must remain loadable with no new native directory configured.

## Proof plan

The checked BEFORE test uses actual current constructors/controller/catalog with an **init-only** Worker double. It proves ten existing OCC adapters do not advertise or dispatch this operation, old display-only classification stays intact, new native pair is not registered/defaulted, inherited exact-runtime guards reject pair substitution, and unsolicited new phase cannot bind an ordinary pending job. It does not qualify geometry or the future Worker.

After implementation: pure exact Native protocol controls; decoder positives from the actual committed native buffers and corruption controls; init/lifetime/routing/phase/metadata/transfer/cancel controls with no fabricated geometry-success reply. Then actual production embedded Worker/strict-CSP Chromium on a frozen source/module/native graph, replaying genuine source profiles/Booleans/holes/treatments/32holes and independent binary analytic approximation/material-void checks. Preserve first failures. Hold genuine positive after Begin and before final, cancel and prove Worker/candidate cleanup; ordinary refusals followed by real healthy read; source/evidence/budget/count preservation; exact detached transfer; repeated bounded reads and1024 lifetime refusal. Rerun inherited STEP/HLR, loft/sweep/revolve/profile/point/Boolean/edge controls on the SAME frozen component. Record worker/heap/work bounds honestly. No app/3MF/Save/Open or universal geometric certification claim follows from that component.

W02 inventory input: derive read substates from the ONE pending seq plus its begun marker: ready→pending-before-Begin→pending-begun→released/decoded→transferred→ready, or typed refusal→ready; any integrity/cancel/timeout/cleanup failure→closed. Native lease is private subordinate state, never a second document/job authority.
