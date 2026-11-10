# Finite-curve certificate transport: source handoff

Base: `df6d8ad57351801ad4b944addba9f1d088f29b26`, including Root's public approval. This packet adds only the new Main-safe envelope, its declaration, and this note. It changes no route, Worker dispatcher, mathematical implementation, source format, registry, event/selection authority, solver, Native port, or runtime asset. Source review only; no imports, parsers, tests, builds, Native calls or browser execution were performed.

## Exact API and ownership

`captureFiniteCurveCertificateRequest(value)` captures exactly `{revision,curves,raw,domain}`. It requires an explicit domain: `{kind:'finite-pair'}` or `{kind:'endpoint-ray',targetCurveId,endpoint:'a'|'b'}` naming an actual input Segment. It reuses the existing light `encodeFiniteCurveReadInput` and `captureFiniteCurveReadResult`; thus the original curve order, actual Native algorithm order, finite input domain, complete raw observation and represented input bits remain bound together.

`captureFiniteCurveCertificateReply(value,originalRequest)` requires Root to retain the captured ORIGINAL request across the disposable Worker await. It recaptures that request and accepts exactly one of:

* `{revision,ok:true,certificate}`;
* `{revision,ok:false,error:{code,message,cause?}}`.

The revision must match. Failure capture reuses `captureSketchFailure`, preserving its actual bounded code/message and, when present, exact admission-cause kind/basis. There is no message classification, replacement mathematical code, success inference, or partial certificate branch. Invalid request/envelope schema uses `FINITE_CURVE_CERTIFICATE_INPUT` / `FINITE_CURVE_CERTIFICATE_PROTOCOL`; envelope resource exhaustion uses `RESOURCE_LIMIT`. Existing light read-protocol refusal codes propagate unchanged.

The returned tree is detached and recursively frozen. Inputs are never frozen or rewritten. The whole-envelope first pass requires plain own enumerable data/dense arrays, rejects cycles/accessors/symbols/extra array fields/nonfinite values, and charges repeated occurrences independently. Sizing invokes JSON stringification only on primitive values and field names, never an object's `toJSON`.

## Structural certificate checks

All certificate union fields are captured explicitly from the current `finiteCurveFiniteCertificate.d.mts`. Version/scope and literal `sourceAuthority:false` / `editAuthority:false` are mandatory. Curve IDs, input bits and domain agree with the original request. Work limit is exactly 500000, with a bounded integer charge. The nine uncertainty reasons are a closed structural vocabulary; a non-null Native index must name an actual original raw point. Uncertainty has no partial proof fields.

Certified support kind is bound to the original pair's curve kinds. Support/count/witness-role/equality-field unions and actual raw flag/count shapes must agree. Isolated Native indices are unique and complete; every candidate and raw parameter is copied bit-exactly from the original raw point, including signed zero and actual algorithm-order identity. Segment membership requires its encoded source parameter; Circle membership is periodic; Arc membership retains its explicit finite locations. Selected finite-index order agrees with the membership booleans without recomputing those booleans. Numeric supports cannot carry overlap intervals; continuum supports cannot carry isolated roots. Endpoint occurrences must name actual original Segment/Arc endpoints of the appropriate support kind, and symbolic periodic seams stay symbolic. No point/event ID is minted.

Encoded rational numerators/positive denominators use the producer's canonical lowercase hexadecimal syntax and at most 4096 magnitude digits (16384 bits). Their strings are never parsed. The leaf does not compare rational values, normalize fractions, prove interval ordering, verify roots, resolve an Arc branch, decide ray direction, or perform distance arithmetic. It checks shape and original-request association, not mathematical truth. In particular, `ok:true`, `status:'certified'`, membership and `withinBudget` never grant source/currentness/edit authority by themselves.

The `.d.mts` has type-only references to the certificate declaration. Runtime imports are only:

| Leaf | SHA256 at the base |
| --- | --- |
| `modules/engine/mount/finiteCurveReadProtocol.mjs` | `05b7fb043ce313321f7c72865705b3023ecc8aa87eec518ee247df49a743ac3c` |
| `web/app/sketcher/constr/admissionCause.mjs` | `5bba6080a679d6dba9e7841cdc68dec6daf555f18abdb00ebc18dd891dff5dc8` |

No heavy certificate/arithmetic implementation, BigInt, numeric parsing, hash, original-source decoder or solver is imported or executed on Main. The mirrored structural vocabulary/field checks must evolve coherently if the producer DTO changes; the current Arc wire shape remains the existing protocol shape rather than an ad hoc authored-branch addition here.

## Bounds and remaining Root integration

Each COMPLETE request and COMPLETE reply independently has a 65536-byte UTF-8 JSON bound, 1024 value nodes (including objects/arrays/primitives) and maximum depth16 (envelope root depth0). Field names are at most64 characters; individual strings at most4097 before their smaller schema limits. Array/node preflight bounds precede recursive copying; all subsequent schema walks are bounded by that detached tree. Request/reply capture plus original-request recapture is a fixed number of bounded passes. This does not claim a bound on prior browser transport allocation or arbitrary Proxy trap behavior.

The outer envelope bound is distinct from the mathematical producer's independent payload bound. A near-cap certificate may truthfully fail transport with `RESOURCE_LIMIT` when its reply wrapper adds bytes/nodes/depth; it is never truncated, downgraded to a partial success, or relabeled mathematical uncertainty. Ordinary two-root positives still require the complete eventual whole workflow; this distinction supplies no waiver.

Root owns `sketch-finite-curve-certificate` client/disposable-Worker routing, exact original-request custody across await, actual Worker execution/error settlement, current job/source/namespace/J/parameter/lifetime guards and all future query/event/edit authority. This packet alone is unmounted and unqualified. The approved public whole, explicit Arc authored-branch integration and remaining middle-trim/Circle-to-Arc variants remain separate obligations.

New source hashes:

| File | SHA256 |
| --- | --- |
| `web/app/sketcher/headless/finiteCurveCertificateEnvelope.mjs` | `9fed90f1ef3349f0bdaf66e51f7813dbb10ca19e196e108d7b6f5a1779c042ef` |
| `web/app/sketcher/headless/finiteCurveCertificateEnvelope.d.mts` | `46b595d005f041f491ce874d1b95bf1412f1e5cb585ed42a0a2745c5db6b53c1` |
