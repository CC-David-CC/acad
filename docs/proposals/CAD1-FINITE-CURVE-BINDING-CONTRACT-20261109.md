# CAD 1 finite-curve binding — BEFORE contract, 2026-11-09

Proposed small binding for Root review under accepted09c7bc8 and L1eb16deca. NO implementation, capability, tolerance approval or qualification is asserted. No product/registry/pin/runtime changes and no parser/tests/probes/build/Native/browser execution. Actual primary source is Nativefc1654ee5d4471584073d4d8e3363d8c9b324566, OCCT7.6.0 subtree64a6dc03c18c9a0d4d57211854e1292c87fcbd2d. All unapproved choices are identified below; no optional pure DTO code is added while those choices remain open.

## One boundary, first operation

One protected finite2D curve interface initially performs pair intersections only. Its data keeps basis, finite domain, parameter occurrences and source identity usable by later trim/extend/projection/offset. This packet does NOT create a trim feature, change a sketch, rewrite constraints, discover regions, publish a graph or add a second history. No public caller submits source JSON, curve coordinates, tolerances, solved flags or Native handles.

Proposed public read: `inspect-closed-sketch-intersections` with exact own-data `{revision,faceId,ids:[actualA,actualB],engine:occ,engineRevision}`. Exactly two distinct inspected current ordinary nongenerated root Segment/Circle/ordinary finite Arc IDs, one actual independent source face. Proposed Core method `inspectClosedSketchIntersections(input,options)`. A source-only document needs the explicit query-engine revision; a document already committed to another whole-history cohort cannot silently substitute one. Named/typed documents may participate when the existing authoritative source decode/equations and quantity capture support the actual selected curves; no blanket typed rejection and no name→literal mutation. Generated/boundary/foreign/self targets and full-Arc ambiguity are explicit unsupported-source in this first read, not silently filtered out.

Source/frame membership comes from the actual registry/source owner and current source revision, not ID spelling or endpoint equality. The Main coordinator captures existing job/lifetime/source state, validates original source in a dedicated Worker, independently extracts the same pair from the unchanged original request, and transports ONLY the resulting private preparation. Main performs no geometry, solve or hashing. A private request-local capability binds actual source bytes/face/frame/parameter context and derived curve DTO; an unbranded external DTO cannot invoke this as an authored-source query. This is the existing private preparation pattern, not a new public proof flag. Precise issuance seam is an approval item below.

## Exact proposed typed data

All records/arrays are bounded dense own-data captures, detached/frozen, with exact fields. `Point2` is two finite binary64 millimeter numbers, no early decimal rounding. Preserve original -0 bits internally where allowed by the actual source domain; do not make signed zero an event identity. Arrays of IDs use actual inspected identities; no ordinal parsing.

```ts
type Point2 = readonly [number, number];
type CurveSource = Readonly<{
 id:string; stage:number;
 curve: Readonly<
  {kind:"segment";a:Point2;b:Point2} |
  {kind:"circle";center:Point2;radius:number} |
  {kind:"arc";a:Point2;b:Point2;center:Point2;
   radius:number;startRadians:number;endRadians:number;sense:"ccw"}
 >;
}>;
type QueryBinding = Readonly<{
 faceId:string;sourceSha256:string;requestSha256:string;
 // revision/geometry/document generation stay private job custody, not geometry.
}>;
```

Kind/sense/engine tags denote fixed strings, not symbols. Both digest strings are lower-case64-hex SHA256 values derived inside Workers. Arc endpoint coordinates are original captured authored values; radius/angles are derived from the actual owned Arc at captured coordinates AFTER original-equation/ownership admission, never arbitrary serialized auxiliaries. `shapes/arc.ts:read/syncGeometry/calcStartAng/calcEndAng` plus actual ArcConsistency define the source. Preserve CCW branch: unwrapped end=start+the actual positive sweep, strictly between0 and2π. Full Circle is a distinct primitive, canonical interval[0,2π] with source+x radial basis. Do NOT copy the Canvas near-equal-endpoint full-circle heuristic into this interface.

Native segment basis is A+u*unit(B−A), u in[0,length] (length parameter in mm). Circle/Arc basis is center+r*(cos(u),sin(u)) in source local+x/+y; angular parameters are radians. Native explicitly checks finite domain and reconstruction against actual raw endpoints/derived basis. A reconstructed point off the authenticated source within only a larger kernel tolerance is not permission to replace source; uncertain source fidelity is explicit. Current source equation validity, faithful basis reconstruction and finite membership are three separate questions.

Proposed private transport to controller: `{op:sketch.curves.intersections.read,version:1,unit:millimeter,binding,curves:[A,B]}`. IDs/stage/binding are contextual input facts; the Native result cannot mint authored IDs. Proposed controller kind `sketch-curve-intersections`, version gate finiteCurveReadVersion1. Require exact new build descriptor and actual compiled export. No solid bodyId/producerFeatureId/regionId is fabricated merely because this read uses the same mount machinery.

Proposed Native values are a fixed64-double-maximum array with version/count/record lengths and exactly2 records: Segment tag+ax/ay/bx/by; Circle tag+cx/cy/r; Arc tag+ax/ay/bx/by/cx/cy/r/start/end. Initial valid maximum is24 doubles including four header values; extra trailing/unknown records refuse. Native echoes its actual decoded input snapshot in a bounded result, which the Worker compares to its immutable request and actual input heap after invocation. The digest is Worker-computed over actual canonical request and source, not a submitted Native-success certificate. Concrete tags/wire byte contract must be frozen with Root before code.

## Result, multiplicity and finite domains

Proposed public result wrapper is `{version:1,unit:millimeter,revision,faceId,ids,engine,engineRevision,quality:occt-finite-curve-intersections,observation}`. It does not expose full source/basis, pointers or tokens. Proposed observation:

```text
{status:available|uncertain,reason:null|string,
 relation:disjoint|points|overlap|mixed|null,
 points:[{eventId,point:Point2,contact:crossing|tangent|undetermined,
   occurrences:[{a:{parameter:number,at:interior|start|end|seamStart|seamEnd},
                 b:{parameter:number,at:interior|start|end|seamStart|seamEnd}}]}],
 overlaps:[{eventId,aRange:[number,number],bRange:[number,number],
   orientation:same|opposite,closed:boolean,
   ends:[{point:Point2,aParameter:number,bParameter:number}]}],
 diagnostics:{algorithm,algorithmPolicy,pointCount,overlapCount,
   maxSourceResidualMm:number|null,maxBasisResidualMm:number|null}}
```

Every occurrence is on its OWN finite domain; supporting-curve hits outside either selected domain are excluded only with a qualified membership decision. Tangency and endpoint membership are separate facts. Do not group nearby solutions, select the first, relabel0 results as a successful trim, or use an array slot as identity. `available/disjoint` requires a successful algorithm AND qualified absence/domain classification, not an exception or an incomplete result. `uncertain` keeps relation:null and NO actionable event IDs; raw bounded diagnostic counts may remain, never partial actionable success. Unsupported input is a typed refusal, not disjoint.

A full Circle seam may have both0 and2π occurrences at the SAME geometric event; preserve those as distinct parameter occurrences instead of duplicating or deleting the event. Arc endpoints preserve their actual CCW lift. Two finite Arcs on a common circle can overlap in two separated components after periodic lifting. One full coincident Circle pair is a closed overlap component with empty ends and explicit full domains; no arbitrary seam point pretends to be a finite cut endpoint. Opposite directed collinear Segments keep opposite parameter correspondence. Native/Worker event ordering may be deterministic for transport, but sorting cannot certify identity or merge occurrences.

Proposed bounds: two input curves; source IDs≤256, faceId≤256; first selected-root stage policy as current source admission (no new multistage/generator bypass); Native raw points≤8 and raw segment bands≤8, otherwise RESOURCE_LIMIT (no truncation); public physical point events≤2, periodic occurrence pairs≤4 per event and exact common-support overlap components≤2. JSON≤65536bytes, private input≤512bytes. These mathematical output bounds apply to the initial two analytic supports, not future splines; domain degeneracy/uncertainty does not authorize dropping extra results. Bounds and coordinate envelope are proposed Root decisions, not new quotas or widened source validity.

`eventId` is proposed as a response-local opaque ID issued by the shared coordinator ONLY after complete current result capture, backed by the existing style of request-local private capability for that exact query/job/source tuple (not a synchronized/global event map). It expires on source, expression, frame, revision, document, manager, host lifetime or owner change. It is not persisted, parsed, or regenerated from coordinates/ordinal. Future trim will consume the private event plus original request and record actual source before/after/stable output IDs in the existing source-byte J; it cannot persist this query token as geometric truth. Actual selection/continuation policy under later source edits needs its own finite contract.

## Library algorithm and non-negotiable numerical distinction

Actual7.6 source finding: `Geom2dAPI_InterCurveCurve.hxx:100–117` defines Segment as a **tolerance-close tangential band**, where distance between curves is≤Tol. It is NOT by itself a proof of a shared geometric interval. Default Tol1e-6 cannot silently close tiny gaps or become a valid overlap. The private `Intersector()` gives `IntRes2d_IntersectionPoint:ParamOnFirst/Second/TransitionOfFirst/Second` and segment HasFirst/LastPoint/IsOpposite: use these actual parameters and occurrences, not reprojection from a single XY point.

For the initial Segment/Circle/Arc subset, the most direct algorithm candidate is `IntAna2d_AnaIntersection`, whose actual API directly handles line-line/line-circle/circle-circle and exposes IsDone/IsEmpty/IdenticalElements/NbPoints and parameterized points. It avoids general spline approximation and the user-facing tolerance-band interpretation. HOWEVER its source `_1.cxx` classifies nearly parallel/identical lines using RealEpsilon; its header description of machine precision is not an exact-arithmetic certificate. It must still pass the fidelity/domain/classification guards below. Use the general Geom2dAPI facade later through this SAME DTO, not a second public API or per-event runtime fallback.

**Proposed initial choice for Root:** use IntAna2d for the two analytic supports; finite domain clipping/periodic lifting is a small typed adapter. Geom2dAPI is reserved for later general curve support. If Root prefers the general facade now, preserve its raw transition/segment data and explicitly report any uncertified proximity band as uncertain; never call that overlap.

Actual overlap requires independently qualified common original support: identical represented center/radius for Circle/Arc, or an exact collinearity predicate over original represented Segment endpoints. Existing exact dyadic source predicates can supply the latter without inventing another intersection algorithm. Native IdenticalElements alone is only a library report. Common-support finite interval intersection then gives actual overlap components/endpoint occurrences; near-coincident supports remain uncertain or disjoint only with a qualified separation decision. Tangency needs actual support/contact and finite-domain qualification; a tolerance band is not a tangency certificate either.

The binding must report/check point residuals on BOTH actual bases, original endpoint reconstruction, parameter-domain separation and scale/conditioning. A small residual alone does not certify all roots, disjointness, multiplicity or overlap. The initial adapter may explicitly return CURVE_QUERY_UNCERTAIN for unresolved near-tangent/parallel/endpoint/periodic classification rather than emit a false event. It may not accept an approximate tangent merely by changing tolerance or setting a caller flag.

**Not yet approved numerical policy:** keep the existing50pm=5e-8mm source-coordinate acceptance as an upper publication-fidelity bound; do not adopt the unrelated Native1e-7mm incidence budget for source mutation. Root must approve the query coordinate/scale envelope, exact-support predicate reuse and explicit error/conditioning certificate before an actionable-event claim. Proposal is to retain the existing eligible source domain up to±1e8mm/positive radius≤1e8 and refuse uncertain cases based on the actual bound, without lowering source validity or inserting a new radius minimum. No use of universal1e-9, no clamped acos, no close-root merging, no coordinate welding or early decimal conversion. Algorithm construction tolerance, if the general facade is chosen, is a private approved policy, never a public input. No concrete new epsilon is frozen here.

## Minimal Native port and ordinary resource/settlement ownership

Proposed new export: `ReadFiniteCurveIntersectionsV1(const double* values,int count)`, backed by NEW `shape-io/finiteCurveIntersectionsV1.hpp`. It constructs only temporary copied gp/Geom2d supports/curves and a local intersector. No DBRep insertion, result name, tessellation, topology ordinal or authored feature ID. Native-shape result cost is0; ordinary heap/input/result-work is still charged/bounded, not free unbounded work. No shape count/quota increase. Existing old exports stay byte/source-compatible.

Adopt fc1654 staged-capture/publication fences, not an older permissive publisher pattern: bounded input knowledge is explicit; capture exact raw values/count and relevant owned-name census independently; actual native input memory is unchanged before/after algorithm and callback; decode/result counts and finite values are fully checked before delivery; caught success AND error publication; postcallback fences run on every path including early admission/error paths. No untrusted memory dereference beyond validated available transport; no arbitrary caller callback API is added. Thin void wrapper throws terminal JS only after all local C++ RAII handles/strings have destructed. Geometry query failure never deletes/replaces another name. Missing/duplicate exchange, altered input, unknown invocation or unconfirmed allocator/scratch/free outcome causes realm retirement, not a successful empty result or retry.

Reuse the existing OCI lexical busy gate, ownedKinds read/result policy (createsResult=false), intrinsic native signal/currentness transport, exact bounded Worker reply capture and `__OCI_EXCHANGE_VAL` save/clear/restore discipline. Controller checks the result input snapshot against actual immutable values, context/request digest and call sequence before publishing any metadata; a matching digest/echo alone is not Native geometry proof. Query owns only its malloc/string/response buffers and actual local curves; release each confirmed allocation once. The ordinary observation owner closes its mount on completion; cleanup uncertainty overrides successful metadata. Do not mix old release-on-quota wrappers with independently releasing helpers.

Proposed ordinary refusal codes are CURVE_QUERY_INVALID_REQUEST, CURVE_QUERY_UNSUPPORTED_SOURCE, CURVE_QUERY_RESOURCE_LIMIT; a well-formed numerical-uncertain observation has status:uncertain/reason:CURVE_QUERY_UNCERTAIN. Unknown Native/protocol/input-preservation/cleanup outcomes are terminal failures retaining original cause and owner retirement, never normalized into those domain codes. IsDone=false is algorithm failure/uncertainty, never proof of disjointness or contradictory source constraints. Exact code roster/final adapter classification is an approval item, not a current public contract.

## Exact integration seams (no product edits in this packet)

1. `web/app/cad/craft/closedSketchTransitions.ts:captureJob` and NEW `headless/finiteCurveQuery.ts` extraction/verifier: use actual decoded current source/index/owned root/stage/ArcConsistency, existing original-coordinate equation/ownership validation and original-request independent extraction. Reuse current revision/source/parameter/frame/host/document guards. Add ONE public read method after the protected path exists; no changes to current mutation/J behavior.
2. `modules/engine/extrusion/prismSemantic.worker.ts`/client are the existing Worker hashing/immutable source→Native preparation pattern, NOT a reason to call a finite curve a selected prism. Add a small task/helper or reuse that transport only with exact dedicated request kind. Hash actual source and exact immutable request in Worker, compare independent extraction, issue a request-local private preparation, and guard currentness after every await. No submitted success callback/proof flag or raw public CurveSource payload.
3. `web/app/cad/craft/evaluationResources.mjs:begin({purpose:observation})/requireObservationOnly/getOrCreateMount` is the existing discard-only owner. Use its actual current pool/mount reservation, source job signal and cleanup fence, without accepting a model or fabricating a solid result. A new narrow ledger/query helper can use that genuine owner to obtain the exact mount; it does NOT enter solidLedger outputs/sources or reserve feature IDs. Root must choose the internal caller/issuer seam before code; the existing solid-producing `evaluateWorkerSolid` is not an appropriate fake kind/body wrapper.
4. `modules/engine/mount/worker-controller.mjs` adds one exact read request/reply capture and Native operation route, gated by finiteCurveReadVersion1. `oci-verified-worker.js` adds one protected mode, one ownedKinds false entry and lexical Native invocation/settlement helper; no dual lists, synthetic result token, arbitrary script or main-thread Native call. Protect typed source preparation and context at this actual boundary, not only in Host.
5. `modules/engine/solid/SolidKernel.ts`, exact factory/descriptor/catalog and new graph source lists add this single finite read only AFTER actual export/build/closed input roster is complete. fc1654 currently lacks this export: a new explicit compiled JS/WASM pair is required. Existing04fc/688, MFG, Shell, circular pairs/defaults are not relabeled. Root owns final registration/hash/static graph splices; no guessed pair/hash here.
6. Future trim/extend consumes the same private response-local event and original current source request, independently re-proves the intended source delta and publishes via the existing source/J/full-suffix transaction. Projection/offset reuse the same basis/domain/occurrence vocabulary as needed. No framework, second editable geometry, synchronized event catalogue, read-healing or hidden half-mutated model.

## Root decisions before implementation

| Decision | Proposed choice / why it is explicit |
| --- | --- |
| Initial exact algorithm | IntAna2d analytic support solver for Segment/Circle/Arc; general Geom2dAPI later under SAME interface. Near classification remains explicit uncertain. Root chooses, not an automatic fallback. |
| Actionable overlap/absence/tangent certificate | Exact common-support identity predicate + library parameter events + finite-domain/conditioning checks. RealEpsilon IdenticalElements or tolerance bands are insufficient. Root approves minimal reusable predicate/error-bound plan; no claim of exactness from floating library flags. |
| Parameter/Arc policy | Segment length parameter; canonical full Circle seam; actual owned CCW finite Arc branch, preserving source endpoints/derived basis without Canvas full-circle heuristic. No new Arc source validity threshold. |
| Private authority seam | Existing captured source job + two original-request Worker extractions, private request-local preparation, actual discard-only evaluation owner and checked mount. No public coordinates/frames/proofs. Root selects caller/issuer placement, especially source-only documents with no solid. |
| Engine/metadata/event identity | Explicit query build revision; opaque response-local event IDs backed by current private preparation. Never persisted query IDs or Native ordinals. Exact named methods/op/kind above are proposed, not registered. |
| Work/wire/code/numeric bounds | Proposed2curves/24actual64max doubles/64KiB response and analytic event caps; coordinate envelope/source fidelity and numerical uncertainty policy above require explicit approval. No producer quota change or new universal epsilon. |

## One eventual complete public workflow (not executed)

Freeze criteria before execution: genuine source Segment crossings; line/Circle2 roots; genuine tangent versus nonintersecting finite supports; Arc CCW/wrap/endpoints; opposite collinear partial overlap; coincident Circle closed overlap; disjoint/unsupported/multiple/near-uncertain cases. Observe all finite parameters/seam occurrences, source and equation invariance, stale/event expiry, both original-request proofs, typed parameters, normal source edit/mixed travel/.cad Save/server/freshOpen/requery and own malformed source refusal. Preserve first failures. A later trim/extend whole adds exact accepted source delta/unaffected IDs/constraints/generated dependency and genuine Native suffix, not a private query probe or successful fake model. Independent oracle uses actual saved endpoint/center/radius equations and analytic/Fraction parameter/interval truth; Native library flags and volume alone are not the oracle. Source/backend numeric domains remain separate from future region/BRep success. Root alone composes/builds/runs after a coherent approved packet.
