# Finite-curve support query: common splices BEFORE

SOURCE PROPOSAL ONLY / UNRUN. Reviewed Core base
`9831c7a8f740c19ad403d157ece5606d4a047d16`. This packet changes this note only.
Root owns common-source composition, normal builds, staging and complete execution.
No product, registry, runtime, Native, frozen producer or evidence changes; no
module/import/parser/test/probe/build/browser execution.

This refines packets 2/4 of
[the original handoff](CAD1-FINITE-CURVE-QUERY-AUTHORING-BRIDGE-20261109.md).
Its historical statement that no compiled/exported pair exists is superseded by
the custody below; source binding and finite-event certification remain absent.

## Actual ingredients; no installed availability claim

| Ingredient | Exact retained identity |
|---|---|
| Native source / tree | `d3b2afa0524807d04021eeeba3ca37298dabd160` / `b3800d4e4c858b003b8a3cdead4b77e8e8918ba5` |
| Native thin port | `shape-io/main.cpp:ReadFiniteCurveIntersectionsV1(const double*,int)` → `shape-io/finiteCurveIntersectionsV1.hpp`; module `_ReadFiniteCurveIntersectionsV1`, asm `ReadFiniteCurveIntersectionsV1`, void pointer/count ABI |
| Portable JS | `479f0620b6dfe131dac05131a3798fc533e05a2bd11e8074ef240284f61bbe86`, 316530 bytes |
| Unchanged WASM | `746da919c8457e98daa821fae98c62c0a6c9ad1acafd1c3d5412e0207d6b6325`, 36216184 bytes |
| Raw compiled JS | `5f1730c347eb3edeb8b6d5e06eeeedcdf04b2348aac0c92b04001bd5edd5b7de`, 316580 bytes |
| Portable adaptation | `build/adapt-finite-curve-portable.py`, source 2168e9f / composed f7d1130, SHA256 `d6e06ed93276306ddf1ebc8eb747d6c1416d00d660d9b38072de18168441b659` |
| Structural codec | `finiteCurveReadProtocol.mjs/.d.mts`, 56eeb1c; no runtime imports |
| Private Native adapter | `finiteCurveNativeCalls.mjs/.d.mts`, `10dcb601f21656770f3ac647f16ac91851ef1967`; imports only that codec |

Full raw compile/static ABI and portable-copy custody:
`test/finite-curve-intersections/native-build-r1/` and
`portable-candidate-r1/`. The two directories explicitly record preparation,
not module instantiation, Native invocation or qualification. R730 binaries:
`/mnt/data10tb/codi-occ-finite-curve-native-portable-20261109-r1/`;
raw originals remain in `.../codi-occ-finite-curve-native-build-20261109-r1/`.
No binaries/SDK enter Git. These are a NEW exact pair, never an alias for
mechanical, MFG, Shell or circular runtimes.

## Exact proposed vocabulary and private wire

Freeze these names before implementation:

| Layer | Exact name / meaning |
|---|---|
| Capability, factory config and init flag | `finiteCurveSupportReadVersion:1` |
| Internal operation | `sketch.curves.support-intersections.read`, version1, unit `millimeter` |
| Controller method | `readFiniteCurveSupportIntersections` |
| OCI request / success kinds | `finite-curve-support-read` / `finite-curve-support-result` |
| Catalog constant | `OCC_FINITE_CURVE_SUPPORT_BUILD` |
| Mount engine / representation / family | `occ-finite-curve-support-v1-component` / `occ-analytic-source-query-worker-owned` / `source-query` |
| New manifest | `finite-curve-support-component/1` |
| Descriptor input / output | `prepared-finite-curve-support-mm-v1` / `raw-analytic-support-query-v1` |

The build has id `occ`, the exact revision
`sha256:479f0620b6dfe131dac05131a3798fc533e05a2bd11e8074ef240284f61bbe86:746da919c8457e98daa821fae98c62c0a6c9ad1acafd1c3d5412e0207d6b6325`,
and `experimental:true,sourceQueryOnly:true,finiteCurveSupportReadVersion:1`.
It carries NO selected-profile, model, mesh, Boolean, point, export or certified
finite-intersection capability.

Private request exact fields:
`{op,version:1,unit:'millimeter',curves:[PreparedFiniteCurve,PreparedFiniteCurve]}`.
OCI exact fields: `{kind,seq,curves}`; success: `{kind,seq,observation}`.
The controller returns a narrow query result
`{contractVersion:1,op,unit:'millimeter',observation}`, where observation is
the existing strictly captured `RawFiniteCurveReadResult`, unchanged.
Do not add a token, handle, Native shape name, BRep evidence, bounds or mesh.

One operation descriptor binds input/output above, `version:1`,
`nativeResultCost:0,scope:'response-local',qualification:'component-research'`,
`maxCurves:2,maxInputValues:24,maxRawPoints:8,maxBytes:65536`.
The query consumes shapeCost0, but owns one actual mount and bounded work.
Qualification means raw component research only. It does not claim current
source authority or finite contacts. The structural codec's 64-value capacity
does not permit trailing values: actual encoded count is 12..24.

A narrow query mount type belongs beside the protocol declarations:
`{descriptor,ready,execute,readFiniteCurveSupportIntersections,close}`.
Keep `SolidKernel.ts`, its shape-result union and authored representation
vocabulary unchanged. Do not cast this mount to SolidKernel merely to satisfy
an existing catalog return type.

## Concrete source splice inventory

Paths below are relative to `modules/engine/mount/` unless stated otherwise.

| File / actual symbol | Smallest required splice |
|---|---|
| NEW `ownedFiniteCurveSupportCandidate.mjs` | Frozen source/pair identities above; no availability or model capabilities. |
| NEW `ownedFiniteCurveSupportResources.mjs` | One canonical Worker-resource list containing exactly `finiteCurveNativeCalls.mjs` and `finiteCurveReadProtocol.mjs`. These two have a complete static leaf closure. |
| `finiteCurveReadProtocol.mjs/.d.mts` | Add exact request/wrapper captures and the narrow query mount/descriptor declarations; retain existing raw result/Native error codec and limits. Own-data fields only, no success/provenance flags. |
| `worker-controller.mjs:createWorkerMount` | Add an exact-pair query-only config branch; pin flag iff this pair, prohibit every shape mode, create the single-op descriptor and narrow returned API instead of the existing unconditional box/Boolean/mesh API. Keep existing branches unchanged. |
| Same: init `postMessage`, incoming whitelist, pending capture, `send`, `execute`, `shutdown/close` | Send flag1 plus owned lifetime mode without selected-profile flags. Capture immutable complete prepared tuple and encoded input before dispatch. Add only the new success kind; validate exact keys, sequence and active pending generation, then recapture raw observation against THAT encoded input. Add an explicit query-refusal branch before the current profile-only refusal logic. Reuse single pending job/deadline/abort/terminate; no shape reservation or result charge. `execute` rejects every nonquery operation in this mode. |
| `oci-verified-worker.js:self.onmessage` init branch | Admit flag1 iff the exact new JS/WASM pair; reject this pair without flag1 and reject all other flags/modes in query-only init. Validate real query/allocator/asm-memory ABI and load the two declared leaves through a literal, query-gated dynamic import. Keep all old-pair gates intact. Query readiness must not depend on an invented V3 profile or command-created shape. |
| Same: the ONE `ownedKinds` Map | Query-only branch is exactly `new Map([['finite-curve-support-read',false]])`; otherwise retain the existing full closed Map. Merely appending a false entry to the current Map would still admit its unconditional shape-producing entries on the new pair. |
| Same: nonproducing handler / outer failure boundary | Exact request capture; one lexical per-job owner and synchronous currentness guard; instantiate existing adapter with genuine Module/malloc/free. Call `read(curves)` once; publish bounded raw observation only after adapter settlement. No `allocateName`, `shapes.set`, `ownedJSON(name)`, `beginOwned`, selected-result charging or disposal token. |
| NEW `occ-finite-curve-support-mount.mjs` | Thin explicit query factory using `createWorkerMount`, new pair/engine/representation/flag only; no import of mechanical/constructor/solid helper graphs. |
| `engineCatalog.mjs` | Add the query constant and dedicated `requireFiniteCurveSupportBuild` / `validateFiniteCurveSupportMount` exact own-data validation. Do not add it to `CAD_ENGINES`, `preferredCadEngineBuild`, normal `requireCadEngineBuild` or `validateEngineMount`, which require/advertise shape methods. This preserves rejection on saved model and new-part selection paths. |
| `catalogMount.ts` | Add optional asset import and dedicated `requireAvailableFiniteCurveSupportBuild`, `listAvailableFiniteCurveSupportBuilds`, `createFiniteCurveSupportCatalogMount`. Reuse bounded path/hash/manifest checking; require the new exact graph and query descriptor. Do not dispatch it from `createCatalogMount` or include it in box/profile/STEP/manufacturing lists. |
| `web/app/cad/craft/evaluationResources.mjs` | No policy change needed: its actual observation owner can hold this closable mount. Later packet3 uses `begin({purpose:'observation',signal,valid})`, `requireObservationOnly`, `getOrCreateMount`, finally `close`. `accept()` already refuses observation publication. |

The query-only branch is necessary: current controller descriptor always includes
box and mesh operations, its return exposes shape methods, current OCI ownedKinds
includes box/Boolean producers regardless of individual flags, and
`validateEngineMount` demands shape readers/bindings. Enabling an extra port on
the existing mechanical factory would falsely claim unqualified inherited work.
A dedicated query type/factory uses the same existing Worker/pool lifecycle.

## Invocation, error and revocation contract

Create the adapter per actual lexical query job; its captured owner/guard cannot
be repointed. The guard checks actual Worker phase, current job/seq, Module
identity and lifetime; it must synchronously throw and return undefined on
success. No caller callback or public flag supplies this authority.

Reuse adapter10dcb60 without reimplementing exchange/scratch custody: actual
input F64 bits including signed zero; one qualified allocation/free; same memory
with genuine growth/view reacquisition; one bounded exchange; exact descriptor
restoration; settle invocation and cleanup BEFORE JSON capture. It invokes the
void pointer/count export once, not a shape command.

Only `finiteCurveCallFailure(error)` private WeakMap membership with
`terminal:false` permits the existing settled Native invalid-request,
uncertain or resource-limit packets as ordinary refusals. Error code/properties
alone cannot establish settlement. All unknown, predispatch adapter failure,
input-changed, allocator/free, receiver, publication, owner/currentness or
cleanup uncertainty retires the actual Worker and invalidates every payload.
In particular zero malloc's RESOURCE_LIMIT is terminal, not an acknowledged
ordinary Native refusal. Abort/deadline closes the realm; never retry an
uncertain Native call or use a mutating release to discover custody.
PostMessage failure after successful computation is terminal publication failure.

Controller recaptures prepared input and raw echo independently. Native inputBits
bind numerical wire values, NOT original id/stage/source/frame authority.
Preserve the complete ordered prepared DTO in the pending record. Future source
request hashes must bind actual original source/frame/identity, not just inputBits.
No global raw result cache or persistent event ID is introduced.

## Exact graph, preparation and emitted assets

Proposed new build files:

- `build/prepare-finite-curve-support-assets.cjs`: thin pinned asset producer.
  Verify actual portable JS/WASM above; embed actual shared OCI bootstrap using
  the existing reviewed receiver/embedding convention; stage the two verbatim
  Worker leaves and manifest sources/files/hashes. Bind actual embedding helper
  and bootstrap bytes. No fake constructor module or profile graph.
- `build/finite-curve-support-assets-entry.cjs`: enforce exact format/pair/flag/
  Worker/leaf closure, then emit `.build/finite-curve-support-entry.mjs`.
- `build/finite-curve-support-candidate-entry.mjs`: default export null.
- `build/prepare-finite-curve-support-cohort.cjs`: optional normal-build wrapper,
  configured only by `CODI_FINITE_CURVE_SUPPORT_NATIVE_DIR`. Absence yields null,
  not fallback to a different installed pair. Existing optional-cohort custody
  conventions apply to stale output/fresh verification.
- `package.json`: optional `build:finite-curve-support` plus its normal
  `build:prism-workers` preparation hook.
- `webpack.config.js`: alias `codi-finite-curve-support-assets$`, new asset rule
  and JS-loader exclusion for `.build/finite-curve-support-assets`; output prefix
  `finite-curve-support/`.

Exact outputs: `modules/engine/mount/finite-curve-support-worker.js`,
`finite-curve-support-occ-portable.js`, `finite-curve-support-occ.wasm`,
and the two original-path Worker leaves. Main factory/controller/catalog stay
normal pinned application code; they are not falsely counted as those two
Worker leaves. Main may import the bounded pure protocol; actual Native adapter
remains Worker-only. Existing `assertOwnedProfileResourceClosure` is reusable
unchanged for the two leaves; producer must additionally bind its query-gated
literal dynamic-import roots and exact bootstrap. No unaccounted dynamic root.

Do not reuse `stageOwnedProfileComponent` unchanged: its required
constructorModule and hardwired prism/topology/selection resources would stage
an unrelated geometry graph. The new thin producer uses the existing embedded
runtime conventions, without changing old producer defaults.

Any shared OCI edit changes bootstrap identity. Root must refresh the actual
guard in ALL TEN existing sites, preserving their old pair/graph semantics:
`build/embedded-oci-worker.cjs`, and `build/prepare-`{selected-profile,
loft-profile,adaptive-metrology-profile,step-export-profile,orthographic-profile,
manufacturing-mesh-profile,shell-profile,circular-profile,
mechanical-cohort-profile}`-assets.cjs`. The new producer adds its own guard.
No invented replacement hash; compute only after coherent Root composition.
The new lazy import is unreachable in old modes, so old Worker leaf lists need
not acquire these two resources. Old Native JS/WASM pairs remain unchanged.
If implementation instead makes a new import reachable in an old mode, its
actual producer closure must be updated rather than hiding that dependency.

## Ordered delivery and remaining authority

1. Root approves this vocabulary/type separation. Implement codec/controller/
   OCI query branch plus exact catalog/factory and asset producer as one coherent
   source packet. Refresh all actual bootstrap guards and source closures.
2. Root normal build/stage verifies optional absent and actual configured cohort,
   actual export/worker identity and immutable pair; no production-default
   substitution. This note reports none of those checks as executed.
3. Packet3 still must authenticate current original closed source, actual
   registered Segment/Circle/Arc IDs/stages/Params/typed bindings/frame, two real
   disposable Workers and captured job/currentness, using Craft's exclusive
   pipelineTail and observation owner WITHOUT solid replay or ledger.
4. Packet5 still must independently qualify finite domain/endpoint/periodic
   events, coincident support/overlap, completeness, conditioning and uncertainty.
   Raw IntAna2d flags/points/bases do not certify finite absence, contact,
   overlap or permission to trim/extend. No public raw query command now.
5. Root executes the eventual complete public lifecycle and FIRST independent
   oracle only after source-authority/certification/public-operation packets are
   frozen. Preserve source/J/counters/model/readiness and owned-context cleanup;
   require actual query observations and uncertainty/refusal evidence, with no
   fake BRep handle, positive helper seed, pair alias or global precision claim.

This is a bounded common-integration plan, not implementation approval,
functional proof, new CAD capability or full Gate1 signoff.
