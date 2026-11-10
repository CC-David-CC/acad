# CAD-ARC-01: one authored Arc branch contract — BEFORE

SOURCE PLAN ONLY / UNIMPLEMENTED / UNRUN. Basis Core
`362451971a2bd88f1c986d1a6bfb1d2ff4c8ffc0`, Root4710a66 and Host's recorded
CAD-ARC-01 state. New note only; no geometry/model/schema/runtime/proof changes,
parsing, imports, tests/probes, TSC/build, Native or browser execution.

## Source finding and representation decision

The problem is not just Arc.drawImpl. The per-coordinate1e-6 full-turn predicate
is repeated in renderSketchProjection, fixedEntityDomain, verifiedReplayGeometry,
sketchReader, DXF and selectedSketchSweepPath. primitiveTransition rejects the
same small proper-Arc band, and straightSlotGeometry refuses small semicircles
because of that encoding. A proper quarter Arc r=1e-7 has two positive ordinary
radii >1e-9 but enters the full-turn render branch. This is a source counterexample,
not an executed public authoring/Native result. ArcConsistency currently imposes
four support equations, not proper/full/zero intent. Picking independently uses
normalized dot/cross; finite tangency already rejects same-ray ambiguity.

Recommend ONE mandatory authored enum in ordinary Arc data:

```ts
type ArcBranch = 'proper-ccw' | 'full-ccw';
type ArcData = { a:Point2; b:Point2; c:Point2; branch:ArcBranch };
```

It is semantic intent, not a cached fullCircle/near flag. Radius, angles, sweep,
minor/major class, bounds and displayability remain derived. Keep TYPE Arc and
actual root/A/B/C IDs; Circle remains a distinct full periodic entity with c/r.
There is no authored zero branch or clockwise branch in this slice.

Rejected alternative: declaring exact a==b to mean full without an enum still
cannot distinguish a collapsed proper Arc from an intended full turn. Declaring
all Arc proper and using only Circle for full would remove the existing editable
full-Arc/FixArc semantics and seam point identity. A synchronized derived boolean
would retain the same ambiguity. Two enum values solve this without a second
model or a general version/geometry framework.

No old-user migration obligation: require branch on CURRENT serialized Arc and
boundary-Arc records; missing/unknown values refuse before native Open adoption.
Keep the existing sketch version3 and .cad envelope; this is an explicit breaking
current Arc record contract, not a silent read upgrade. Frozen old files/drivers
remain historical evidence. Necessary current-source acceptance-schema changes
must be separate, documented, and frozen before new whole runs.

For NEW ordinary creation only, existing public Arc requests may omit branch
with a documented proper-ccw default; current private prepared intent captures
that default BEFORE Worker admission/second verification. Explicit full-ccw must
be requested. Never infer a full branch from endpoint proximity or apply this
default to loaded saved source. Expose branch in inspection; caller intent alone
never certifies owned geometry or successful admission.

## Authoritative classification and transitions

NEW small pure `shapes/arcBranch.mjs/.d.mts` owns exact record/enum capture and
proper/full classification; live Arc and data consumers delegate to it.
Use existing bounded represented-F64 exact polar arithmetic for endpoint
orientation/positive-ray equality, not atan2 equality or a new global epsilon.
Classification is separate from existing radius/domain/equation residual proofs.

| Accepted intent/state | Required invariant / result |
|---|---|
| proper-ccw | Existing positive radius/support admission; a-c and b-c nonzero; endpoint rays distinct. CCW endpoint sector uniquely determines minor/semicircle/major. No endpoint welding. |
| full-ccw | Existing positive radius/support admission; a and b are exactly the same geometric coordinate (signed zero is not separate geometry), both distinct from c; one CCW turn from the actual seam. Root/A/B/C remain actual distinct owned objects. |
| zero/collapsed proper | Invalid accepted source. Exact equal positive rays are zero, including distinct coordinates differing only radially; never reinterpret as full. |
| near-zero / near-full proper | Still proper when exact rays differ. These are not new persistent classes or tolerance bands. If a consumer cannot represent a faithful angular interval it returns explicit unrepresentable/uncertain, never zero/full. |
| transient tool draft at c or a==b | Explicit uncommitted tool state only. May display a draft marker; cannot finish, solve as accepted source, save, query or enter a feature. No new persistent draft flag. |
| Circle | Always its existing full periodic support, independently of Arc endpoint conventions. |

Named output statuses proposed: proper(minor/semicircle/major), full, invalid,
and consumer-unrepresentable. New bounded errors should distinguish bad authored
branch/domain from representational uncertainty; Root approves exact codes before
implementation. They must retain original admission causes and actual outer
resource/currentness/cleanup failures. Requirements are not fulfilled by a label.

| Operation | Exact branch policy |
|---|---|
| Create ordinary Arc | Captured proper default or explicit enum; full requires exact seam equality. Ordinary radii/limits unchanged. Invalid draft cannot commit. |
| Edit radius/center/endpoints | Retain authored enum. Proper becoming same-ray refuses atomically. Full edits retain the actual seam-equality equations; moving just B off the seam cannot silently make proper. Explicit future proper/full conversion needs its own current original-request/J operation, not an automatic inference. |
| Solver/cold replay | Enum is non-coordinate authored intent and must remain exact. Actual full/proper class and existing directed/major-branch/50pm fidelity checks survive. Solver output never chooses/relabels branch. |
| Mirror | Copy enum; existing proper mirror swaps source A/B into destination B/A to preserve CCW reflected set. Full keeps full and the same genuine generated seam/member IDs. Do not derive output branch from rounded reflected endpoints. |
| Copy/Slot/fillet-generated Arc | Constructor/write carries explicit proper/full declaration. Slot caps and fillet arcs declare proper. No generic raw-data field stripping. |
| Undo/Redo/Open | Original branch bytes and IDs replay from the SAME sketch-byte J/document. No stored query event or cached fullCircle is restored as authority. |
| Rejected edit / stale owner | Draft/last accepted source, definitions, history/J, IDs/material and handles remain unchanged; no intermediate accepted collapse or repair. |

## Solver and numerical requirements

Arc.syncGeometry's r/ang1/ang2 remain genuine derived Params. Proper branch
requires existing original support/domain/residual checks plus exact sector class.
For full-ccw, extend the actual intrinsic ArcConsistency polynomial factory with
real Bx-Ax and By-Ay equations (same registered actual owned Params); do not add a
fake authored PCoincident row, rank label or user-supplied proof. Exact intrinsic
membership must be checked by capturedParameterOwnership and captured evaluation.
Use normal algebraic reduction/admission; confirm full seam equality at captured
publication. Never copy a malformed solved B onto A merely to pass validation.
If the actual existing solve cannot preserve this declared equality, refuse and
retain last good source; a narrowly authenticated constructor would require a
separate demonstrated need/review rather than generic read healing.

Derived branch classification cannot depend on whether cold solve rounded a/b
inside a proximity band. Original-coordinate proofs retain exact enum and source;
full original equations/admission and two unchanged-original-request Workers
remain mandatory for mutations. Existing registered residual/radius domains,
non-coordinate/frame limits,50pm publication fidelity and solver initialization
stay separate. Seed137 has no active numerical role; no new solver/random field.

For rendering, use explicit full=>TAU; proper=>derived endpoint CCW interval.
No modulo operation may turn a representationally collapsed tiny interval into
TAU. A major sector may be split at existing cardinal/seam boundaries for faithful
rendering without altering source; if required numerical interval representation
is unavailable, expose an explicit unavailable rendering/query rather than an
invented full circle. Rendering/picking are consumers, not geometry authority.
Bounds may remain conservatively the entire support circle as today. Exact
sector membership for picking/tangency shares the bounded predicate, while
radial hit distance retains its own existing display/picking tolerance. No
nearest-reference fallback or display-mesh-derived domain.

## Exact consumer change list

| Current file/symbol | Required delta; preserved boundary |
|---|---|
| `shapes/arc.ts`: constructor/read/write/copy/mirror/syncGeometry/drawImpl/labelCenter/isPointInsideSector/normalDistance | Store/capture ONE enum; delegate sector/full decision; remove proximity full predicate. Preserve actual Params/IDs and source-backed endpoints. Define full label center explicitly (current midpoint normalization degenerates for exact opposite endpoints); choose derived half-sweep point, not a new authored label. |
| `constr/ordinaryEntityDomain.mjs`; `io.ts`: validateStrictObject/validateProjectSketch/read/serialize | Require declared branch and actual full/proper domain before adoption; no permissive missing-field upgrade. Keep other entity/ruler/generator validation. |
| `headless/sketchValidation.ts`: typeIndex; `ANConstraints.ts`: ArcConsistency; `registeredConstraintPolicy.mjs` | Capture added key; genuine branch-specific intrinsic equations/domain. Keep all original rows/constants/ownership/residual policies. |
| `headless/primitiveTransition.ts`; `shapes/cubicCurveRecord.mjs`: existing generic private primitive keys (retain if unchanged); `closedSketchTransitions.ts`/client/Host append schema | Default only NEW public authoring intent to proper, carry explicit full; replace old1e-6 endpoint refusal with authoritative branch admission. Original request verifier binds the resulting enum; no ID-pattern geometry inference. |
| `tools/arc.js`: createArcStep/finishStep/processCommand | Keep temporary zero state uncommitted; validate actual intended branch at finish; numeric zero cannot mean full. Full selection must be an explicit existing-command numeric full-turn gesture or bounded request, not accidental proximity. No UI redesign. |
| `headless/verifiedReplayGeometry.ts`; `transitionGeometryPolicy.mjs`; `physicalCoordinateReconstruction.mjs`; `capturedGeometryScope.ts` | Remove old full band; compare exact enum/sector class under actual candidate intent. New field stays non-coordinate and cannot be altered by optimizer deltas. Keep affected scope/50pm/directional bounds. |
| `constr/fixedEntityDomain.mjs`, fixedEntitySchemas/Intent/Inspection/Reply and existing Fix producer/verifier | Compute sweep from enum/sector, never near(a,b). Full witness TAU, proper witness true interval; object enum is independently bound. Keep existing literal Fix constants/rank semantics and exact source/J. A numerically unrepresentable proper sweep refuses Fix explicitly instead of recording TAU. |
| `headless/renderSketchProjection.mjs`, acceptedSketchProjection/projectionWitness; `cad/sketch/sketchReader.ts` | Derived fullCircle comes ONLY from enum; source witness binds that enum. Tiny proper must never become sm.Circle/full display. Full may remain derived sm.Circle preserving originating Arc ID as today; no authored conversion. |
| `cad/sketch/sketchModel.ts`: Arc.toNurbs/toOCC; `sketcher/io.ts`: old SVG export; `sketcher/dxf.ts`: writer/importer; headless/dxfExport | Consume authoritative sector/full. DXF CIRCLE only for declared full; ARC for proper with faithful start/end. A full SVG requires circle or two nonzero Arc segments; the old single coincident-endpoint A command is insufficient. Existing DXF ARC/bulge construction declares proper, CIRCLE stays Circle. No general foreign-import framework. Preserve units/frame and native/export limits. |
| `generators/mirrorGenerator.js`, headless/mirrorSourceValidation/stageGeneratorPolicy/mirrorReply | Copy/validate actual branch in every stored generated row and regenerated result; retain exact source/output bindings, stable IDs and constraints. |
| `constr/straightSlotRecord/straightSlotSource.mjs`, straightSlot transitions/replies; `tools/fillet.js` | Declare proper cap/fillet branches. Remove only the old encoding-specific SLOT_UNSUPPORTED_RESOLUTION rejection once shared semantics are installed; keep actual ordinary minima, exact topology, branch/scale/solver guards. |
| `constr/finiteTangencyPredicates.mjs` / tangencyDomain | Use actual proper/full branch. Full angular membership is all directions, proper exact sector remains; keep finite segment contact/domain/error proofs and no optimistic contact. |
| `generators/boundaryGenerator.js`, cad/sketch/sketchBoundaries.js/boundaryValidity, headless/curvedBoundaryPolicy | Derived Native boundaries get actual proper/full classification from their genuine trim/domain, NOT endpoint distance. Preserve immutable boundary/source reference IDs and incidence/currentness. Native full circles remain circles where already represented so; no unrelated attached-source expansion. |
| `modules/engine/extrusion/selectedSketchSweepPath.mjs`, selectedSketchSweep; mount ownedSweepPlan/Protocol | Require proper explicitly for the existing open Arc path. Keep full path explicitly unsupported. Carry branch in source hash/membership; lower wire may remain proper-only a/b/c after private source admission. Preserve Native pair, corrected-Frenet and all path budgets. |
| `selectedSketchProfile.mjs` / descriptor/source census | Current ordinary Arc bounded-profile family remains unsupported (ARC-PROFILE-01); do not silently promote full Arc/tiny proper to Circle or advertise new profile support. Validate/retain branch before truthful unsupported status. Genuine Arc-boundary region support needs its own library-backed packet. |
| `headless/finiteCurveSourceExtraction.ts`, ArcPolicy; `finiteCurveFiniteCertificate.mjs` | Authenticate actual proper enum instead of inherited draw-full band. Keep exact radius incidence/branch/candidate/error/custody checks. Raw wire remains proper Arc only; declared full Arc stays explicit unsupported until separately bound full-support identity, while actual Circle is supported. No source authority from raw payload flags. |
| `.cad` project validator/source hashes/J/save/Open; public discovery/export schemas and producer rosters | Preserve ONE saved enum in the ordinary source record and all existing original bytes/IDs/counters/definitions/material. Malformed/missing/contradictory branch fails before Open adoption. Update current-source checkers explicitly; retain frozen old evidence unchanged. |

Two concrete source-closure cautions: `cad/sketch/sketchBoundaries.js` currently
recognizes circular NURBS by evaluated derivatives and classifies full with
veqXYZ(A,B). Those approximate observations do not become exact authored full
intent merely by adding the enum. Prefer the EXISTING owned Native analytic
circle support/range/incidence provenance when it is genuinely available and
coupled to that actual face. If the legacy NURBS-only path cannot establish its
trim/full meaning, expose that boundary conversion as unavailable; do not write
a guessed branch. No new Native API/ABI is asserted necessary without tracing
that actual caller/port. Existing raw analytic circle/range ports and legacy
NURBS interpretation must not be conflated.

Also, the new shared leaf's actual imports must be included in every affected
verbatim Worker/semantic/headless resource closure and emitted inventory; Root
must derive any common bootstrap/graph hashes from the coherent final source.
No unchanged-hash or extra Native-pair capability claim follows from this plan.

EllipticalArc has a similar tolerance-based full convention but a different
schema/Params/domain. This ordinary circular-Arc packet must neither silently
change it nor claim its branch gap closed; record the explicit analogous next
consumer/domain obligation. No global replacement of1e-6/1e-9 constants.

## ONE complete qualification packet after source coherence

Freeze one ordinary fixture with an unrelated rectangle/extrusion and source
entities authored ONLY through public commands: proper quarter r=10, tiny proper
quarter r=1e-7, proper semicircle, seam-crossing minor, explicit major/near-full,
near-zero distinguishable proper, explicit full Arc and actual Circle. Every
chosen numeric endpoint must have an independent exact represented-direction
oracle; no after-failure geometry choice. Keep native profile admission limits
separate: tiny sketch/sector truth is not a tiny Native-solid claim.

Prove actual source enum/IDs and derived sector against independent equations;
visible accepted projection and live Arc picking use the same set (off-sector
points reject; full accepts all directions), proper never emits a full CIRCLE;
DXF/SVG ordinary source geometry/frame/units agree. Real radius/endpoint edits,
Mirror and Fix/remove must preserve intended branch or refuse correctly. Include
proper→collapsed refusal, full→off-seam refusal, unknown/missing branch refusal,
stale/refused source preservation and zero numeric/tool-draft Cancel recovery.
No success from source seeding/private setters or fake model/query observations.

Immediate genuine creation Undo/Redo, branch-bearing edits and mixed travel must
restore exact original source/IDs/high-water/J/definitions. Perform three normal
.cad Save/server equality/fresh signed Open/reedit cycles; independent archive
CRC/SHA/schema/sector equations verify retained branch. Current supported query
families require two genuine original-request preparations/candidates; full Arc
and unrepresentable domains must report precise unsupported/uncertain, never
empty/disjoint or a fake Circle identity. Preserve all original radius/Mirror/
Slot/Fix/tangency/finite-query positive and refusal cases in affected complete
regressions; historical producer receipts remain frozen.

Root approval requested for mandatory branch field/current-format boundary,
full-Arc intrinsic seam equations, NEW-authoring proper default and the complete
consumer/qualification scope before implementation. This note closes no issue
or exercise. CAD-ARC-01 and full Gate1 remain OPEN until the coherent affected
source and eventual whole/render/artifact qualification establish their scopes.
