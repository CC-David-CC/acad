# Finite-curve query-only leaves: source handoff

SOURCE ONLY / UNRUN. Base `e36de15ab3ce4f0b1804600a0f9813c7ecb56051`.
Implements the NEW-leaf slice approved in
[Root query-mount approval](CAD1-FINITE-CURVE-QUERY-MOUNT-ROOT-APPROVAL-20261109.md),
following [the BEFORE splice inventory](CAD1-FINITE-CURVE-SUPPORT-COMMON-SPLICES-BEFORE-20261109.md).
Packet3/5 approval4710a66 remains separate. No existing source, raw codec,
Native adapter, controller/OCI/catalog/build, SolidKernel, runtime, binaries or
frozen evidence are changed. No tests, parsers, imports/module evaluation,
builds, Native or browser execution.

## Delivered leaves

All paths begin `modules/engine/mount/`; each has a matching `.d.mts`.

| New leaf | Contract |
|---|---|
| `ownedFiniteCurveSupportCandidate.mjs` | Pure frozen actual source/tree/portable/raw/byte identities; exact479f0620/746da919 pair, query engine and representation. `available:false` and `status:'unmounted-unqualified'` are ingredient status, not installed readiness. |
| `ownedFiniteCurveSupportResources.mjs` | Main/build canonical list of exactly two Worker leaves: unchanged Native adapter and raw protocol. Required Module query/malloc/free ports; no model DB/InitCommands. The data leaf itself is NOT imported by Worker. |
| `finiteCurveSupportRequest.mjs` | Pure Main request/result/descriptor capture around the unchanged raw codec. Strict exact own-data fields/arrays/plain built-in or null prototypes, detached frozen outputs, existing raw DTO/domain/F64 rules retained. No geometry arithmetic or numerical certificate. |
| `occ-finite-curve-support-mount.mjs` | Thin explicit `createFiniteCurveSupportOccMount` passing the Root-approved query-only config to existing `createWorkerMount`. Pending common support is a composition prerequisite, not claimed availability. No catalog/default registration. |

The source-only factory deliberately references the future approved common branch.
It must NOT be executed or exposed until Root composes that branch, verifies the
exact assets and reviews the complete source closure. An ordinary old controller
does not become query-only simply by receiving an unknown config field.

## Frozen Main API for common composition

`finiteCurveSupportRequest.mjs` exports:

- `FINITE_CURVE_SUPPORT_OPERATION`: frozen sole operation descriptor.
- `captureFiniteCurveSupportRequest(value)`: exact frozen
  `{op,version:1,unit:'millimeter',curves}`. Delegates actual tuple/curve
  validation to unchanged `encodeFiniteCurveReadInput`.
- `encodeFiniteCurveSupportRequest(value)`: frozen `{request,input}`;
  `input` is the unchanged raw codec's `EncodedFiniteCurveReadInput`.
  The complete ordered id/stage/geometry tuple remains in `request` and input,
  not merely its numeric inputBits.
- `captureFiniteCurveSupportResult(value,input)`: exact frozen
  `{contractVersion:1,op,unit:'millimeter',observation}`, recapturing raw
  observation against THAT encoded input. The caller must already have settled
  actual invocation/cleanup and query lifetime.
- `captureFiniteCurveSupportDescriptor(value)`: exact capture below.

Exact descriptor keys:
`contractVersion,engine,mountId,generation,unit,representation,bootstrap,
runtimeAssets,maxLifetimeNames,maxPending,sourceQueryOnly,
finiteCurveSupportReadVersion,operations`.

Values: version/generation1; approved engine/representation; nonempty opaque
mountId; unitmillimeter; `bootstrap:'host-trusted'`;
runtimeAssets exact `{jsSha256,wasmSha256,verification:'worker-sha256'}`
for479/746; `maxLifetimeNames:0,maxPending:1,sourceQueryOnly:true,
finiteCurveSupportReadVersion:1`; precisely one operation. Extra fields or shape
operations refuse. No generic OCC tolerance description is used as an accuracy
claim.

The operation has precisely:
`id:'sketch.curves.support-intersections.read',version:1,
input:'prepared-finite-curve-support-mm-v1',
output:'raw-analytic-support-query-v1',nativeResultCost:0,
scope:'response-local',qualification:'component-research',
maxCurves:2,maxInputValues:24,maxRawPoints:8,maxBytes:65536`.

Factory config exact keys:
`engine,representation,sourceQueryOnly,finiteCurveSupportReadVersion,mesh,
profile,jsSha256,wasmSha256,captureFiniteCurveSupportRequest,
encodeFiniteCurveSupportRequest,captureFiniteCurveSupportResult,
captureFiniteCurveSupportDescriptor,finiteCurveSupportOperation`.
mesh/profile false, sourceQueryOnly true and flag1; other values/functions as
above. Root acknowledged this API/descriptor/config before source freeze.

The declared mount exposes only descriptor/ready/execute/
readFiniteCurveSupportIntersections/close. It is not a SolidKernel, does not
return ShapeResult and cannot issue dispose/model handles. Ready resolves void,
matching the existing controller's lifecycle. Structural refusal codes remain
CURVE_QUERY_INVALID_REQUEST; malformed result wrappers use the existing
FINITE_CURVE_READ_PROTOCOL; descriptor mismatch INVALID_MOUNT.

## Closure and still-unimplemented obligations

The NEW Main wrapper imports unchanged raw protocol plus pure candidate data.
The factory imports controller, candidate and wrapper. These are normal Main
bundle dependencies, not new Worker roots. The Worker closure remains
`finiteCurveNativeCalls.mjs -> finiteCurveReadProtocol.mjs`, exactly two.
No staged assets, producer, entry or bootstrap digest is invented here.

Root still owns common exact-pair-only query initialization, the query-only
closed ownedKinds Map, no _InitCommands/model initialization, actual ABI/memory/
allocator validation, one lexical job owner, response seq/generation/input
binding, adapter private WeakMap failure classification and terminal cleanup.
No wrapper capture can supply settled-Native or current-source authority.
ShapeCost0 still occupies one actual observation mount and bounded work.

These leaves preserve the actual raw observation schema/limits. They do not
certify OCCT completion flags, empty/identical/parallel reports, root count,
finite domains, coincidences, overlaps, actionable IDs or publication accuracy.
Captured original source/two real Worker receipts, finite candidate verification
and eventual shared edit/public lifecycle are separately approved packets.
CAD-ARC-01 remains OPEN; no inherited ambiguous Arc branch is healed or promoted
by these structural wrappers.

No query availability, functional qualification or Gate1 result is claimed.
