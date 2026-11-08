# CAD-ARC-01: explicit Arc turn intent

SOURCE FACTS / PROPOSAL ONLY. Read current main
78a70d2ac7ec44b259d65e7fb20bbe5a43dfbeb7 and the source-only queued whole-Fix
packet through cef6e588; Native source read at R730
/mnt/data10tb/codi-occ-circular-stages-20261108-r1/shape-io/ownedSweepV1.hpp
and selectedProfileV2.hpp. No product changes, execution, probes, tests, TSC,
build or browser. This is one foundation contract, not a new state inventory.

## Current facts and authority map

`sketcher/shapes/arc.ts` stores actual a/b/c EndPoints and derives r/ang1/ang2
in syncGeometry. write/read persist ONLY a/b/c. Direction is native CCW a→b;
copy preserves order, mirror swaps reflected a/b to preserve CCW. There is no
persisted full/partial bit or independently authored signed sweep.

Draw uses math/equality TOLERANCE=1e-6 and STRICT per-coordinate < comparisons.
Near endpoints mean a full2π turn even if their represented values differ.
This is topology interpretation, NOT the50pm reconstruction budget. Existing
ordinary proofs retain exactly their producing semantics and pins.

| Current consumer / source path | Authority and present branch behavior |
|---|---|
| shapes/arc.ts drawImpl, isPointInsideSector/normalDistance | Display/picking. draw selects full by the1e-6 predicate; sector test uses normalized endpoint rays rather than an explicit full mode. Not source or dimensional authority. |
| tools/arc.js; tools/fillet.js; headless/primitiveTransition.ts | Real producers. Interactive Arc starts as a transient collapsed preview; numeric tool endpoint angle is modulo2π. Closed append requires equal radii within1e-9 and REJECTS full/near-full by1e-6, although model/native IO can carry full Arc. Fillet/Slot construct real Arc instances. |
| io.ts read/write/validateStrictSketch + constr/ordinaryEntityDomain.mjs | Source custody. Strict IO accepts only sketch version3, reconstructs Arc from a/b/c and checks positive endpoint radii>1e-9; ordinary domain alone does NOT prove equal radii, a branch or successful constraints. Arc data has no explicit turn. Unknown extra data can be lost by Arc.read/write; adding a field without a format fence is unsafe. |
| constr/ANConstraints.ts ArcConsistency | Original numerical model: four trigonometric endpoint equations using r/ang1/ang2 and a/b/c. They establish one circle when solved; they do NOT say full versus partial or force a==b for a full turn. Params/angles are derived, not saved independent pose. |
| headless/sketchValidation.ts, capturedSketchEvaluation, verifiedReplayGeometry.ts, transitionGeometryPolicy.mjs | Actual original-domain/residual and reconstruction guards. typeIndex Arc permits only a/b/c; replay separately recomputes1e-6 full, positive CCW interval and major/minor branch, checking angular/reconstruction bounds. Non-geometry data is exact; a new turn field must stay exact. |
| headless/renderSketchProjection.mjs → acceptedSketchProjection.mjs → cad/sketch/workerSketchCanvas.ts | Derived display projection carries fullCircle/start/end/endPoint/endRadius. Its fullCircle repeats1e-6. Main/canvas must consume Worker facts, not select topology again. |
| constr/fixedEntityDomain.mjs + fixedEntitySchemas.ts | Actual whole-Fix literal snapshot includes Arc a/b/c/radius/sweep; sweep repeats1e-6. Queued closed Fix uses these same real schemas. Snapshot sweep is a checked witness, not Arc's independent authored turn. |
| dxf.ts _arc; headless/dxfExport.ts | Genuine Worker DXF export: heuristic full Arc becomes DXF CIRCLE; otherwise ARC with CCW angles. Wrong inference here changes exported geometry, not merely pixels. |
| cad/sketch/sketchReader.ts → sketchModel.ts | Derived legacy profile conversion uses1e-6 to map Arc into a Circle loop or partial Arc connection. Partial Arc's Verb conversion has an exact rational-quadratic short-angle case; legacy OCC gcarc uses endpoints+tangent. None may become durable source or silently relabel an Arc as Circle for modern provenance. io.svgExport's one SVG A command also does not explicitly encode a full turn. |
| headless/mirrorSourceValidation.ts, stageGeneratorPolicy.mjs; shapes/arc.ts mirror; generators/mirrorGenerator.js | Shared new Mirror refuses full/near-full with1e-6 and unequal-radius Arc. Stage preflight has a separate1e-9 endpoint-separation guard. Reflection swaps endpoint roles; not a shortest-arc choice. Preserve honest capability refusals until explicit-mode regeneration is qualified. |
| constr/straightSlotRecord.mjs; headless/straightSlotTransition.ts | Genuine directed semicircle producers. Current cap construction refuses when1e-6 would misread it as full. Analytic branch/radius/source owner guards are real; removing that refusal requires every downstream consumer to understand explicit partial, not a tolerance tweak. |
| engine/extrusion/selectedSketchProfile.mjs + mount selectedProfilePlan/polygonProfilePlan | Modern selected profiles accept their qualified ordinary Segment/Circle families (and explicit two-Circle arrangement). Raw Arc is UNSUPPORTED, including an Arc rendered as a circle. No new Arc profile/region or Circle-lineage permission follows from turn intent. |
| engine/extrusion/selectedSketchSweepPath.mjs → solid/ownedSweepIntent.mjs → mount/ownedSweepPlan.mjs | Current source-bound path captures raw a/b/c and explicit reversed; source adapter and planner repeat1e-6 full refusal. Saved path refs remain curveId/reversed. Full path is deliberately unsupported, distinct from zero path. |
| Native ownedSweepV1.hpp capturePath | Actual version1 raw path ABI repeats1e-6 and returns SWEEP_CLOSED_PATH_UNSUPPORTED; then actual OCCT edge/range/validity/resolution/attachment/transport rules apply. It cannot be taught explicit partial by changing only JS. selectedProfileV2.hpp accepts circle/polygon records, not a general authored Arc profile. |
| cad/sketch/sketchBoundaries.js → boundaryGenerator.js / curvedBoundaryPolicy.mjs | Derived legacy BRep boundary conversion may classify circle by veqXYZ and emit a/b/c Arc otherwise. Current fixed curved boundary Arc rejects endpoint distance<=1e-9. This bridge is not proof of authored turn: use authenticated Native range/closed occurrence where actually available, never display proximity. |
| STEP / controlled3MF / linked drawing | Native STEP and mesh exporters consume rebuilt BReps, not raw sketch Arc JSON. They inherit branch correctness from source replay/feature preparation; display mesh cannot repair it. Drawing HLR conic intervals come from actual Native curves, not this endpoint heuristic. A source Arc not admitted by its feature family must still refuse, not be fabricated as a Circle. |

## Concrete represented-input distinction (not an executed incident)

Let m=1024,s=2^-31,R=(m²+1)s; c=(0,0),a=(R,0),
b+=((m²−1)s,2ms), b−=((m²−1)s,−2ms).
These are exactly representable dyadics; (m²+1)²=(m²−1)²+(2m)² proves the
same radius independently. Both |ax−bx|=2^-30 and |ay−by|=2^-20 are<1e-6.
Current heuristic calls BOTH full. Their intended CCW partial arcs are,
respectively, near-zero angle and near-full2π angle. Radius and chord remain
positive. This source arithmetic is not a Native success/resolution claim.

## Proposed smallest coherent authored contract

ONE existing Arc class/IDs/EndPoints; mandatory `data:{a,b,c,turn}` with
turn:'partial'|'full'. CCW stays the model direction. Do NOT persist another
independent center/radius/startAngle/sweep/minor flag or a separate FullArc model.

- partial: a and b are distinct represented points on the solved circle;
  interval is the actual positive CCW a→b, strictly between0 and2π. Near-zero
  and near-full remain partial. Their distinction follows original directed
  rays (robust represented determinant/dot predicates where classification
  needs them), never a distance epsilon or separately rounded atan2 results.
  If a positive interval cannot be represented/evaluated safely, return explicit
  numerical-resolution uncertainty; never clamp it to zero/full or a line.
- full: a/c define the seam/radius; b is the SAME seam under an explicit full
  closure relation, with stable actual endpoint identity retained. Persisted
  accepted source requires exact numeric a==b. Add the two genuine endpoint
  closure equations to the existing ArcConsistency full mode, not another
  solver/model. Their true rank may be dependent; do not count them as two
  guaranteed physical DOFs. No new independent angular pose/cache is saved.
- partial with a==b is invalid zero/open interval, not automatic full. Full
  with a!=b is branch/geometry mismatch, not an instruction to weld. A solve
  must establish full closure before publication; unresolved equality refuses
  rather than repairing accepted/source bytes after the fact. Current original
  residual/domain checks and exact-request coordinate guards remain separate.
- Creation MUST capture turn explicitly. Ordinary Arc/Fillet/Slot producers
  deliberately author partial; full creation uses an explicit shared full-turn
  operation/option. Interactive transient preview is not accepted source and
  cannot infer committed intent from cursor distance. Numeric modulo2π tool
  input must not erase an explicit requested full turn. No geometry defaults.
- Ordinary coordinate/radius/constraint edits preserve turn EXACTLY. Reaching
  the other mode requires one explicit branch edit through the same prepared
  source/J transaction. It must validate all original equations and downstream
  consumers before commit; no automatic mode switch, snap or retarget.
- Full seam edit moves its coupled endpoints consistently or refuses. It is
  not two independently authored poses. Copy keeps turn. Mirror preserves turn
  and swaps reflected endpoints for CCW; full seam identity remains explicit.
  Derived projection/DXF/legacy readers use turn, never proximity. Fix derives
  sweep2π only for full; partial uses its actual interval. Fix witnesses stay
  literal checked metadata, not a second turn authority.

## Format fence, numerical and Native boundaries

Propose explicit sketch format4 for Arc-bearing sources, same existing graph/J;
non-Arc format3 may stay readable without changed semantics. Format4 Arc requires
exact four fields; no omitted/default/unknown turn. Do NOT silently upgrade
format3 Arcs using their old1e-6 heuristic. No real-user migration is required;
reject ambiguous legacy Arc source with a typed unsupported-format reason.
Historical source/artifacts/proofs stay immutable on their original runtimes.

All new IO paths, INCLUDING loose interactive load, validate supported format
BEFORE cleanUpData. Old readSketchBody(non3) simply returns after cleanup, so it
is NOT a safe forward-format rejection guarantee. Native project/.cad needs an
explicit newer envelopeVersion (proposed4) and decoder/validation/host whitelist
composition so current public old readers reject before adoption; do not pretend
an unknown Arc data key alone gives that protection. No new document or history.

Heavy branch predicates/solve/hash/reconstruction stay Workers. Exact represented
source classification, positive-radius/entity domain, solver residual/convergence,
profile admissibility, Native resolution/topology and dependency lifetime remain
DIFFERENT questions. Preserve50pm coordinate reconstruction, existing residual/
angle budgets and Native tolerances; none decides full versus partial. Invalid
branch, unresolved numerical interval, unsupported feature family, Native
below-resolution/contact and lost dependency need truthful distinct refusals.

Owned Sweep version1 cannot consume newly supported near-partial semantics:
its Native input still applies the heuristic. A new explicit versioned Native
path capture/build capability must carry/validate turn against genuine source
and actual OCCT interval/orientation, retain raw endpoints/reversed and fail
closed on unsupported full paths. New exact cohort/pins, no automatic backend
substitution or modification of frozen pairs/default. Full circular sweep SOLID
support is not granted by this source change; near-full may legitimately fail
actual overlap/contact. Modern Arc profiles likewise remain a separate genuine
feature capability; no polyline/Circle conversion posing as support.

Protected Native boundary adapters must obtain closed/range meaning from the
actual owned curve occurrence (parameter range/orientation/closure plus analytic
support), corroborated in its source frame. If that evidence is unavailable,
refuse that bridge explicitly; a sampled/legacy proximity boundary cannot supply
branch authority. No raw names, face ordinals, nearest matching or display data.

## Coherent ownership and eventual single whole workflow

One reviewed implementation packet needs Arc class/format/creation/solver-domain
and original-equation edits; shared pure turn policy; IO/project preflight and
native envelope/archive/source bridges; Worker projection/replay/captured scope/
point operations and mirrors/slots; fixed witnesses; DXF/legacy SVG/ReadSketch/
Verb/OCC adapters; exact source profile/sweep inventory/semantic contracts; public
creation/branch-edit transport and one J. Native Sweep cohort/FFI packaging, if
included, is a separately owned versioned dependency with unchanged old cohorts.
These are actual required seams, not permission to edit now or a hidden broad
arrangement/foreign-import project. Root must review file ownership before code.

Prepare ONE public workflow: exact quarter/major/full and the dyadic near-zero/
near-full pair; explicit creation/discovery, accepted edits preserving turn,
full seam motion, deliberate full↔partial transition, contradictory/ambiguous
input refusals, actual Mirror/Slot continuation and lost-reference failure where
supported, shared mixed Undo/Redo, mm/inch display, normal .cad Save/server/fresh
Open/reedit/resave. Check projection AND actual DXF CIRCLE/ARC content against
independent represented-input intervals/radii/lengths, not screenshots. Every
Native/export path invoked must report actual capability/result or truthful
kernel-resolution refusal; no fake successful source or geometrical fallback.
Independent ZIP/source/digest/equation/interval oracle runs only AFTER the whole
workflow. This proposal supplies no new execution evidence or broad C01 signoff.
