# Owned orthographic Worker component v1 — schema proposal

Frozen before implementation at CAD base `c25aeefd96ca6a88627157d23d1095a0b0870640`. This stage owns new protocol/codec/tests only. Common Worker/controller/type edits await the wrapper owner's final checkpoint and root's exact ownership approval. No GUI, Craft, Desktop, drawing persistence, dimensions, public API or E22 completion is claimed.

Native input is qualified `9ff18a9e58d6fcd7aeabd14f36629588ff4591a9`, based on STEP/adaptive1c3b. Production raw JS `7202839b7daee058710ce3a9587e18b714aed846b1431e853274932daab1764d`; WASM `26d94303a8561b0922acae5b921f486e857083d8febaa9638d1ebd0eff590018`. Native projection header `4cd54defccceb55b665e8edff77efddda19bad09ff6ea8e31d6fe5824c9be856`; FFI header `3f97e4d5e31317e41ea34cee1159507e49728b1904c3242ea671e89eba7e21a6`. No portable hash is invented: the reviewed single global-exchange transformation must be applied/pinned separately to these actual bytes. Old runtimes/defaults remain unchanged.

## Exact Native schema

The Native payload has exactly these own-data fields:

```
{version:1,unit:'millimeter',scope:'response-local',persistentIds:false,
 quality:'native-brep-orthographic',frame:[12 finite numbers],
 copyTShapesDisjoint:true,groups:[8 group records],fragmentCount}
```

Frame order is origin3,u3,v3,n3. Camera is from+n toward origin. Canonical top is u+X,v+Y,n+Z; front u+X,v+Z,n−Y; right u+Y,v+Z,n+X. Native gp_Ax2 behavior and its qualified1e-12 orthonormal admission are retained; no frame snapping or replacement is introduced. All frame numbers are finite/absolute≤1e6; Native echoed frame must match the captured request. Only Worker code performs physical basis tests.

Groups are exactly ordered: sharp-visible, sharp-hidden, outline-visible, outline-hidden, smooth-visible, smooth-hidden, seam-visible, seam-hidden. Each group has exactly `{category,visibility,curves}`. Arrays are dense, records have exact own-data keys, and their total equals fragmentCount0..8192. Preserve all fragments, duplicates and group order. Categories do not imply persistent identity.

Every line has exactly:

```
{kind:'line',parameterSpace:'source-3d-curve',parameterization:'affine',
 range:[first,last],orientation,start:[x,y],end:[x,y],
 origin:[x,y],direction:[x,y]}
```

Every conic has exactly:

```
{kind:'projected-conic',parameterSpace:'source-3d-curve',
 parameterization:'trigonometric',range:[first,last],orientation,
 start:[x,y],end:[x,y],sourceKind:'circle'|'ellipse',
 mayBeDegenerate:true,center:[x,y],a:[x,y],b:[x,y]}
```

Orientations are FORWARD,REVERSED,INTERNAL,EXTERNAL. Ranges satisfy last>first. Curve parameters, endpoints and coefficients are finite/absolute≤4e6, matching the Native header. Line p(t)=origin+direction*t; conic p(t)=center+a*cos(t)+b*sin(t). Verify endpoint agreement using the same qualified Native bound `max(1e-9,hypot(endpoint)*1e-12)`; do not alter supplied numbers. Retain source3D parameters, orientation and actual trim ranges without reversing endpoints, choosing a minor arc or reducing angles. Zero projected line direction and rank-deficient/backtracking conics remain explicit. This preserves Native represented numbers; it is not new arbitrary-precision geometry or a dimension witness. Separate genuine source-ellipse coverage remains open where the Native proof left it open.

## Lossless packed internal transport

API request:

```
{op:'solid.drawing.orthographic.read',version:1,unit:'millimeter',
 handle,frame:{origin:[3],u:[3],v:[3],n:[3]}}
```

Capture exact own data and detach the12 numeric frame values before any await. Resolve only a current handle owned by this mount/Worker; Native names/pointers never come from the caller. Future candidate ledger establishes producer/build/document provenance independently. Native DBRep membership alone is not that authority.

Worker reply uses private kind/seq and these three data fields: `metadata`, `values:ArrayBuffer`, `tags:ArrayBuffer`. Controller returns:

```
{op:'solid.drawing.orthographic.read',contractVersion:1,unit:'millimeter',
 metadata,values,tags}
```

Exact metadata fields:

```
{version:1,quality:'native-brep-orthographic',scope:'response-local',
 persistentIds:false,copyTShapesDisjoint:true,frame:[12],
 fragmentCount,groupCounts:[8],layout:'orthographic-f64le12-u8x4/1',
 valueBytes,tagBytes}
```

Fragments concatenate the eight Native groups without deduplication. For fragment i, values contains12 little-endian IEEE754 binary64 values:

| Slots | Contents |
|---|---|
|0,1|first,last|
|2,3|start.x,start.y|
|4,5|end.x,end.y|
|6,7|line origin or conic center|
|8,9|line direction or conic a|
|10,11|conic b; canonical+0 reserved padding for line|

Tags has4 unsigned bytes per fragment:

| Slot | Encoding |
|---|---|
|0|0=line,1=projected-conic|
|1|0=line,1=source-circle,2=source-ellipse|
|2|0=FORWARD,1=REVERSED,2=INTERNAL,3=EXTERNAL|
|3|0=line,1=conic mayBeDegenerate; no other bits|

Require consistent tags; line padding is unused, not an invented Native b coefficient. Maximum values bytes8192*12*8=786432, tags bytes32768, total819200. Both are separate transferables, never JSON fields passed through a public registry. Buffers are mutable derived copies; no immutable/geometric-authority claim and no persistence as authored refs. No HLR/Native ordinal is saved as identity.

Main/controller checks only exact small metadata, eight counts,12 echoed frame values, intrinsic ArrayBuffer brands/byte lengths and detached-buffer rejection. It does not scan projected scalars. Complete numeric/tag/endpoint validation happens in the producing Worker and again in any Worker consumer before use. A later renderer may approximate for display only; dimensions cannot use sampled points or renderer pixels. A later linked-drawing command returns bounded summary/witness metadata; it cannot paginate4MiB JSON around the64KiB public metadata cap.

## Lease/state/error policy

Keep Native Begin/Read/Release headers≤2048 UTF-8 bytes. Payload cap4194304 is internal only. One Native lease, monotonically issued1..1024, read scratch≤65536, sequential offsets/tail/zero EOF, strict scalar status and exact receipt binding. A failed begin/chunk publication discards all data and cannot resume. Release in guaranteed cleanup before any final transfer; free Native allocations even on malformed/decode/packing failure. Unknown resource after malformed Begin is terminal realm teardown, not guessed release.

Allocate one bounded JS byte buffer, decode fatal UTF-8 and parse once in Worker, then validate/pack. Do not keep a per-coordinate cache or whole-file copy on main. Native JSON, JS bytes/string/parsed objects and packing buffers have different lifetimes; output caps do not establish a hard WASM-used-memory limit or immediate GC/OS reclamation.

A proposed private `orthographic-read-begun` marker belongs only to the one pending job/seq/op and existing deadline. Set no global synchronized lease flag. It records observed Native begin; cancellation terminates the Worker and revokes module ownership, without claiming Native finally ran. Use the existing30s bounded controller deadline initially; no speculative timeout increase.

Native stable status−1..−11 is ORTHOGRAPHIC_INVALID_REQUEST,INVALID_FRAME,INVALID_INPUT,RESOURCE_LIMIT,CURVE_UNSUPPORTED,NUMERIC_RANGE,FAILED,INPUT_CHANGED,BUSY,INVALID_READ,PUBLICATION_FAILED. The first seven are recoverable read refusals only after cleanup/input preservation. INPUT_CHANGED, internal BUSY/INVALID_READ, publication loss, malformed transport and unknown statuses are terminal. Never infer codes from free-form text, call a projection refusal invalid source geometry, return stale/zero projection as current, or silently fall back to mesh.

Read creates0 persistent shape names and does not charge the32-name result budget. HLR/copy/JSON/lease work remains real bounded work. Assert Native owned-name count and exact target record/binding unchanged; Native itself checks BRep/catalog/all tolerances and disjoint copy TShapes. Read at result quota is required.

## Proposed production files and later boundary

New: `ownedOrthographicReadProtocol.mjs` (small schema/lease/status and O(1) binary-envelope admission), `orthographicAnalyticRecord.mjs` (Worker-only decode/validate/pack/consume), `occ-orthographic-profile-mount.mjs`, exact portable adapter, component stager and this test directory. Necessary common edits, ONLY after coordination: `oci-verified-worker.js`, `worker-controller.mjs`, `SolidKernel.ts`; root coordinates bootstrap pins/other stagers. Optional codec imports/rootModules must not expand old asset graphs. No second large Worker fork.

Root retains catalog/normal app registration/default, ledger/Craft/current-document observer, dimensions, drawing definition/journal/save format and Desktop. Later extend the existing `evaluateWorkerSolidRead`/candidate ledger, not a new feature executor. Re-evaluate frozen source/history/build under pipelineTail, verify current producer/accepted facts, project using private live candidate handle, close and restore ID context before returning. Cache only a disposable current revision-bound derived artifact. HLR curves have no qualified stable dimension anchors; source and hole-wall witnesses remain separate work. All linked E22/Undo/Save/Open/human workflow rows remain open.

## Qualification sequence

1. Node Worker codec tests on exact recorded9ff Native payloads: complete numeric/group/range/orientation round-trip, rank1/backtracking, duplicate categories preserved, real71557-byte payload, byte/pointer-free metadata. These are recorded-byte tests, not fresh Native execution.
2. Clearly labeled synthetic malformed/resource/tag/endpoint/finiteness/UTF-8/schema controls; transfer/detach tests; no fake successful Native message.
3. After common ownership approval, actual strict-CSP Chromium/new Native cohort: known top/front/right/translated/oblique views, Native>64KiB, exact before/after input topology/mesh/metrics, refusals/healthy continuation, held genuine begin/final cancellation/late replies, read at32-name quota and cleanup. Independent frozen Native analytic oracle must inspect packed coefficients/intervals, not producer expectations.
4. Retain same-cohort STEP/adaptive and relevant ordinary geometry reads, old cohorts/default smoke. Freeze exact full source/Native/portable/closedgraph/bootstrap hashes. No shared app/GUI/drawing dimension claim from component PASS.
