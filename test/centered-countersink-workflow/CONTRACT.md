# Finite semantic centered countersink — design only

**DESIGN, not implemented or qualified.** Core baseline323ee19168a6850ec368eb5ac92846976e8ad32a, current frozen blind source, not the later unmerged
counterbore or C11 product. No product/Native edits, probes, tests, TSC, builds,
browser or Native execution accompany this document. Root continues blind
qualification first. Existing exercise signoffs and qualified finite families
remain unchanged. This is one remaining ordinary C06 feature, not all C06.

## Decision: two diameters and ONE included angle

One genuine unplaced selected four-Segment rectangular constructor, one source
frame/region and actual last-cap entry; same bounded domain as centered blind
and proposed counterbore. One authored semantic feature consumes that constructor.
No descendant/placed/multi-solid/ambiguous target in this first family. Actual
source frame and cap ancestry establish center/top, never global Z, AABB, display
mesh, caller frame or guessed face ordinal. Both circles strictly clear the
actual source rectangle under existing provider containment/clearance policy.

Proposed saved `WORKER_CENTERED_COUNTERSINK_V1`, exactly15 own bounded fields:

```js
{version:1,unit:'millimeter',engine:'occ',engineRevision,
 featureId,target,producerFeatureId,sourceFeatureId,
 sourceFaceId,sourceRegionId,entryFaceId,
 kind:'centered-countersink-conical',
 throughDiameter,entryDiameter,includedAngleRadians}
```

Diameters are canonical millimeters. The angle is the FULL included angle,
canonical radians, not half angle or degrees. All3 may be numeric literals or
existing authoritative named quantities of the correct dimension. No default
angle, mode flag, alternate depth parameter, silent formula replacement or
standards lookup. An input containing both angle and sink depth refuses exact
schema admission. Derived depth/transition/apex are not persisted. A future
depth-driven mode would be a separately reviewed mutually exclusive intent,
not an ignored fourth dimension. Existing IDs/source/entry bindings stay opaque;
one actual app allocator ID, no authored tools/intermediate features.

Let r=d/2, R=D/2, alpha=included angle, k=tan(alpha/2), T=actual part thickness:

```
0 < r < R; 0 < alpha < pi
h = (R-r)/k; s = T-h; require finite k>0 and 0<h<T
rho_limit(z) = r                         for 0<=z<=s
             = r+k*(z-s)                 for s<=z<=T
removed = {0<=z<=T and rho<rho_limit(z)}
Vremoved = pi*r^2*T + pi*h*(R^2+R*r-2*r^2)/3
```

For100×50×20, throughØ4/entryØ8/included90deg: nominal h2/s18,
Vremoved=80pi+32pi/3=272pi/3. This matches the explicit finite C06 requirement
in docs/reviews/GATE1-FINITE-CLOSURE-AUDIT-20261107.md:215. A counterbore's flat
annulus and a single cone/disk cannot substitute. Full precision is preserved:
the canonical represented pi/2 and its actual tangent need not produce a
bit-exact2. Never snap h/s to nice numbers. Actual Native geometry is checked
against independent nominal/represented arithmetic under named existing bounds.

Positive finite math, represented-tool viability and Native resolvability are
separate. Refuse tan under/overflow, indistinguishable s/T/radii, excessive tool
coordinates/radii/heights and an unqualified actual cone. Do not clamp alpha,
convert h>=T into THRU, use epsilon equality to pick another feature, raise
Native minimums or claim every positive input is Native-representable.

## What the actual source already provides

Audited Native Git source0e429519e97a29e991ec4aa42b5ea6ddab24ddbb, the production
source recorded by qualificationc15e49dfbb5bb5fcf7b5c81e7c63724c81807ae0. The exact
existing portable MFG pair remains JS32eec74e3019d9e2d767c9016f05aa3daa49441c6102423a269d67b9c7f02a08 /
WASMabbf2aa02a6f2101c600aa1eedd20fa80ab2db206e677ca860d9c5103cdfbfcc.
Those existing bytes must not advertise the missing bindings below.

| Actual available ingredient | Precise source and limitation |
| --- | --- |
| Exact conical construction via genuine revolution | Native shape-io/main.cpp:63–82 exports CreateOwnedRevolveV1; ownedRevolveV1.hpp:40–75 builds a real planar face and BRepPrimAPI_MakeRevol, requires a valid positive single solid and preserves input BRep/catalog/tolerances. A closed one-sided trapezoidal meridian revolved full2pi makes an exact frustum, not a mesh approximation. Its current receipt is ONLY metrics; no builder construction association is published. |
| OCCT's direct exact frustum builder is present in source/link inputs | occt/src/BRepPrimAPI/BRepPrimAPI_MakeCone.hxx:47–100 exposes R1/R2/H and gp_Ax2 constructors. BRepPrim_OneAxis.hxx:163–171/241–245 exposes actual LateralFace/TopFace/BottomFace and TopEdge/BottomEdge. scripts/build-selected-profile-v2.sh:9–11 links TKPrim. No cone constructor C ABI is evidenced by the audited shape-io/main.cpp; do not assume an exported Module._CreateCone exists. |
| Real ordered generatrix provenance is possible, but not exported | selectedProfileV2.hpp:33–61 retains actual sourceEdges/sourceVertices. OCCT BRepPrimAPI_MakeRevol.cxx:383–451 implements Generated/IsDeleted using the real builder, including its actual internal modification history. Current ownedRevolveV1 destroys the builder before returning shape/metrics; JS cannot reconstruct that association by matching a face. |
| Native topology names cones but does NOT describe their support | ownedTopologyV1.hpp:33 names GeomAbs_Cone. faceGeometry:56–61 emits analytic data only for planes/cylinders; cone has analytic:null/support:unsupported. Core modules/engine/mount/ownedTopologyContract.mjs:28–34 enforces exactly that contract. A type label and two circular rims are not a cone support certificate. |
| Owned non-destructive Boolean/copy/ancestry, validity, metrics and point reads | main.cpp:86+ ApplyOwnedBooleanHistoryV1 returns actual original-input composed A/B history and copy evidence. ReadOwnedTopologyV1/InspectOwnedSolidV2/ClassifyOwnedPointV2 and existing ownership/release ports remain useful. Source-to-working maps are already composed by Native; consumers must not apply them twice. |
| Existing STEP/controlled mesh/HLR can operate on general genuine BReps | ownedStepExportV1.hpp uses real STEPControl_Writer/MM/AP214IS; ownedManufacturingMeshV1.hpp:68–86 meshes a detached copy with actual edge/vertex parameter correspondence and closed-manifold checks, not a plane/cylinder-only display conversion. ownedOrthographicReadV1.hpp:52–76 admits actual LINE/CIRCLE/ELLIPSE projected curves; it does not require analytic conical face data. Countersink outputs on the new cohort still need actual finite acceptance; source capability is not proof of the new shape. |

The current public revolve envelope requires an authored face/hash/source segment
axis (Core ownedRevolveIntent/ownedRevolvePlan). That is a wrapper's intended
source contract, not a kernel inability to make a cone. A private derived tool
could use the genuine depth-free face preparer/Native revolution without
fabricating an authored faceId/hash/axisId. Nevertheless existing exported data
cannot soundly bind its conical wall and finite support. Neither nominal
parameters, Native volume nor point sampling alone can fill that real gap.

## Smallest recommended Native extension and new explicit pair

Prefer a finite **owned frustum constructor with real builder roles**, rather
than broadening public revolve or exposing arbitrary DRAW/face selectors:

1. Proposed private `CreateOwnedConicalFrustumV1(resultName,frame12,r0,r1,H)`
   uses the existing OCCT BRepPrimAPI_MakeCone with full revolution, r1>r0>0,
   H>0 and captured orthonormal frame. The Worker derives these values from the
   authenticated source/entry. No public caller frame or trust flag. Require
   ordinary Native valid one-solid/positive measurements and fresh exact name;
   return actual constructor LateralFace/BottomFace/TopFace and BottomEdge/TopEdge
   indices resolved by IsSame in the SAME resulting catalog, distinct/support/
   cap/rim checks, actual resultCounts and detached request binding. No nearest
   matching or caller-assigned role. Reusing a new provenance-returning revolution
   variant is mathematically possible, but is NOT needed for this finite primitive;
   direct existing builder roles make the smaller construction contract.
2. Proposed private `ReadOwnedConeTopologyV1(name)` returns ONE joint observation
   `{version:1,scope:'response-local',persistentIds:false,topology,coneFaces}`.
   topology is the unchanged actual V1 catalog. For EVERY actual GeomAbs_Cone,
   coneFaces contains its actual face index and gp_Cone reference origin,
   axis/x/y basis, reference radius and signed semiAngle. Build both from the
   same shape/maps during one Native call; validate actual count/unique membership.
   A cone axis/angle is read from BRepAdaptor_Surface::Cone, never inferred from
   a requested diameter or rim fit. Bind the joint catalog EXACTLY to the actual
   Boolean result/source catalog in the same private invocation. Existing V1
   topology/Boolean schemas and old cohort observations remain unchanged.

The supplement is response-local Native inspection, not a second model, saved
geometry, cached truth or public topology API. No apex is needed: a shallow
cone's derived apex can be arbitrarily far away although its actual bounded
reference frame/radius is valid. Keep reference semantics explicit; do not
serialize a truncated apex. Native read must preserve complete BRep/catalog/
tolerances and allocate no owned result names; constructor request bytes and
all prior owned shapes remain unchanged on success AND failure.

Use the same Native topology visit/count bounds (1024vertices/512edges/256faces,
4096wires/uses) and one512KiB aggregate cap INCLUDING support supplement, not
512KiB plus another unbounded payload. Constructor provenance is fixed-size
(<4KiB) and derived from one ordinary frustum. Parse/validate/hash only in Worker;
public metadata remains64KiB and no Native ordinal escapes. Existing input
snapshot8MiB cap/release custody applies. Native minimums are real: actual
BRepPrim_Cone.cxx:191–200 checks Precision::Confusion for nonzero radii, radius
separation and H; gp_Cone.hxx:63–72 also excludes unsupported near-zero/right
semiangles. Map those known construction/domain refusals honestly; don't widen
math to pretend Native accepts them.

These genuine C++/ABI observations require a **new compiled, qualified explicit
JS/WASM pair**. No invented hash here. Proposed separate catalog/factory cohort
with countersinkVersion:1/conicalConstructionVersion:1/conicalTopologyVersion:1,
full required MFG/read flags and exact pair gates in BOTH controller and bootstrap.
Retain old32e/abb, Shell/circular/defaults and their semantics. Create the complete
new acceptance history on this explicit cohort from the start; no silent backend
swap on an already32e part. Exact pair, API availability, descriptor schemas,
staged dynamic graph and all actual common-bootstrap pins must agree before
capability is advertised. Native source/SDK/archive/build receipts and portable
loader adaptation need the same exact producing roster as blind/counterbore.

## Genuine four-result construction and finite evidence

From actual source F=(O,x,y,z), center C and current last cap T, derive:

1. Small Circle tool, radius r, frame origin O-z, depth T+2; actual represented
   endpoints overrun both original source caps. Existing real V3 prism/provenance.
2. First subtract original constructor minus small tool. Actual removed pi*r²*T,
   positive valid single solid, real cylindrical descendant from B ancestry,
   full0..T cylinder seam/rims and same actual source cap adjacency.
3. New exact frustum tool: source-frame origin C+s*z, axes x/y/z, r0=r,
   H=h+1, r1=R+k. Its cone agrees with r at s and R at T and overruns top by1mm.
   Actual radius/height/coordinate bounds and represented endpoint separation
   must pass; no synthetic vertex/curve/author feature ID. A meridian-based
   constructor could instead derive [0,s],[r,s],[R+k,T+1],[0,T+1] with full2pi,
   but must return genuine builder associations, not the old metrics-only port.
4. Final subtract first result minus frustum. ADDITIONAL removed volume is
   pi*h*(R²+R*r-2r²)/3, NOT the entire tool frustum volume or pi*R²*h. The center
   was already void. Corroborate each real increment separately with the existing
   owned volume-resolution guard, and final actual Native volume/bounds/validity.

Charge exactly4 lifetime Native results and all4 actual triangle counts within
existing32/100k, not4 live objects exempted by early release. Parent+four results
has planned cost5. Release small tool after detached first proof; release first
cut/frustum after final proof; only final result enters the public ledger.
Attempted/owned/releasing/released/absent/unknown obligations, positive exact-name
ownership/census, original falsey failures and unknown cleanup precedence match
the reviewed blind/counterbore protocol. An uncertain release/copy/preservation
obligation overrides prospective success as ENGINE_CLEANUP_FAILED; no retry of an
unknown release. Original input BRep/catalog/tolerances and prior mesh data must
remain unchanged on success/refusal. No temporary result escapes its candidate.

Final evidence is NOT a cylinder THRU witness. Bind the first small cylindrical
face through actual final A ancestry to one unique shortened wall0..s, and the
actual frustum lateral face through final B ancestry to one unique conical face.
Inspect actual coupled cone support and finite actual trims:

- source-coaxial reference axis/basis and radius law agree with the requested
  source center/alpha; the signed Native semiangle/reference plane is interpreted
  as supplied, accounting for actual axis direction. Never infer support from
  the word cone, volume or fitting two rim centers;
- actual final cone has two nonseam circular rims at s/T with radii r/R and one
  ordinary straight generatrix seam used twice with opposite traversal; actual
  circles, seam endpoints/range and all trim vertices lie on that SAME support;
- actual generatrix LINE must satisfy the cone equation along its entire finite
  parameter interval (quadratic/linear/constant coefficients), not endpoints
  alone. A slanted chord with two correct endpoint radii is insufficient;
- transition rim is the SAME actual final edge shared by conical wall and
  shortened cylindrical wall, and top/bottom openings share actual final edges
  with inherited source caps. There is NO annular planar shoulder or floor;
- final top rim is a new intersection at T; tool top rim is at T+1 and normally
  absent. Do not fabricate inherited tool-top identity. Tool-bottom rim history
  may corroborate transition, but unique conical-face ancestry plus actual closed
  trim/shared-edge incidence establishes the final intersection even where a
  coincident source edge was retired. Such an edge never gains a public selector
  or healed old identity;
- require actual Native validity, one closed oriented solid, ordinary seam and
  cap incidence. Existing source selections propagate through BOTH actual A
  ancestry stages, preserving all first-stage unresolved identities. The approved
  counterbore private sequential helper is an unqualified source dependency,
  not already integrated/qualified functionality at baseline323ee19;
- actual Native material/void/boundary reads corroborate central void throughout,
  small wall, cone wall, both openings and remaining outer material. A point in
  the annulus at z=s and rho>r is INSIDE material, not a counterbore shoulder.
  At z=s+h/2, rho below/above (r+R)/2 distinguishes cone void/material. Unknown
  classification, indistinguishable probes, split/merged/lost wall or unsupported
  trim refuses. Sampling never replaces topology/support authority.

New cone qualification budgets must be explicit before execution: propose the
existing finite cylindrical position/incidence1e-7mm and axis1e-8 policies for
support comparison, with included-angle agreement1e-12rad and existing source-cap
plane incidence1e-9mm/alignment1e-12. They are Native qualification bounds, not a
50pm Native claim. Source coordinate budget remains50pm=5e-8mm; artifact Native
volume1e-6mm³/bounds1e-6mm stay unchanged. No blanket tolerance substitution.

## Shared source, typed angle and persistence integration

This is one H/S/J document and one feature append/dimension edit event. Proposed
Core seams: new owned/authoredCountersinkIntent, ownedCountersinkPlan and
coneCutWitness; existing controller/SolidKernel/solidLedger/modeler registration,
AUTHORED_SOLID_KINDS/budget, selected source dependency admission and validation
Worker finite codes; narrow shared Craft submit/append/edit/travel and journal
capture; explicit new catalog/factory/stager/asset entry/current bootstrap pins.
No second solver, source file, journal, geometry cache or raw Native invocation.
Native indices/handles stay in the private Worker/owner and do not persist.

A real typed-unit integration gap must be fixed, not hidden by numeric-only mode:
physicalBindingFields currently lists LENGTH fields only; physicalBindings.mjs:16
resolves every feature field as length, and line23 labels every field length.
For this new family, a bounded authoritative field-role lookup must distinguish
throughDiameter/entryDiameter:length and includedAngleRadians:angle. Reuse all
existing old-family length roles unchanged. Both manifest producer and Worker
resolver/capture/travel must use the same explicit role schema; angle resolves
through actual expressions.resolveQuantity(name,'angle'), not resolveAuthoredLength
or a second evaluator. Operation schema declares angle, authored materialization
compares the real prepared value, and source/Worker currentness are rechecked.
Existing named expression grammar and seven quantity kinds do not change.

No blanket refusal because a document is typed. No named angle erasure to literal,
length-as-angle/count/boolean coercion, degree-valued numeric guess, h literal
substitution, formula rewrite, or undefined auxiliary trusted flag. Numeric edit
may require all3 unbound fields as existing semantic-hole commands do; bound edits
use authoritative physical bindings/definitions and the same full suffix/J.
Inspection reports raw bindings and canonical/derived display values separately;
actual C09 formatter can display angle in degrees while storing radians. Existing
literal-empty physical inspection has null presentationRevision; valid typed-ready
v1/v2 uses the captured PM presentation token. Freeze the correct source-conditional
acceptance rather than inheriting the blind first-run assumption.

Validation/Open must admit exact15-field schema, genuine earlier same-build
source/producer and literal diameter/angle domain; actual resolved named order,
derived interior h, entry/Native proof and complete replay are validated BEFORE
adoption. Own CRC/SHA-correct malformed native files cannot inject saved proof,
frame or wall ID. Save captures raw names, source, quantities definitions, geometry
history, materials/drawing definition and stable IDs; derived cone data is not a
saved extra truth. Stale/aborted/failed candidate preserves the last-good authored
state, baseline/association and shared J; epoch/inspection invalidation is recorded
precisely rather than broadly normalized. Undo creation restores original producer;
Redo restores the same one feature ID. Dimension/source/named travel preserves
all12 identity fields and formula semantics. Session J remains honestly reset on
fresh Open; reedit creates a new session event.

Thin public discovery/create/history/edit adapter and reusable recipe use actual
returned IDs/opaque entry discovery. No caller frame/tool/history seeds, native
ordinals, private successful setters or new UI redesign. Discovery is only current
eligibility; resolved shape/angle facts derive from current owner/source/result.
Lifecycle: discovered current reference → authored intent → recomputed available
or explicit unresolved/refusal. Source or document change invalidates old tokens;
no nearest reattachment. Read/export uses a candidate owner and retires all scratch
before returning. Private Native validity is not a caller boolean.

Existing source/cap reference drawing/HLR/SVG can target the new operation through
the ordinary owner-bound read producer map. Do NOT feed the shortened cylinder to
current full-height THRU/hole witness or advertise a countersink diameter/angle
annotation before a separately complete authentic typed cone-reference consumer
exists. Actual projected cone edges/silhouettes and physical source dimensions
can be exported now after new-cohort qualification; descriptive text is not proof.

## Finite dependency and ownership transitions

| Event | Required real custody / outcome |
| --- | --- |
| Discover | Current live constructor/source/entry/build; eligibility is not a cone fact. No allocation or J mutation. |
| Create/edit | Capture exact raw intent/document/source/material/J; resolve typed units in Worker; perform four genuine results/proofs. One final H/S/J publication or unchanged last-good model. |
| Read/export | Current accepted producer + independently replayed private owner; native cone data is derived response-local evidence. Read-only snapshots/resources stay exact; no saved canMeasure/THRU flags. |
| Source/named change | Recompute center/T/h/cone and current trim from the same source. Stale tokens refuse; bad order/angle/interior/ancestry rejects atomically. No nearest reattachment or cone-to-cylinder conversion. |
| Undo/Redo/Open | Same exact saved intent/IDs/bindings; creation travel restores producer/output relationship. Recompute evidence with fresh owner; Open does not retain borrowed handles or invent a session J. |
| Cancel/stale/cleanup failure | Do not publish; retire every positively owned scratch obligation. Unconfirmed release overrides success; no accepted-model overwrite by a late reply. |

## One complete eventual acceptance, only after source review

Freeze exact new pair/producer/helper/Native SDK/archive roster and criteria,
complete coherent Native+Worker+consumer+host source, then root alone executes:

1. Public New100×50×20 constructor plus independent control source on the NEW
   explicit cohort. Discover true entry; create throughØ4/entryØ8/90deg. Check
   actual Native volume100000−272pi/3, bounds, distinct finite cylinder/cone,
   void/material/boundaries (including annulus-at-transition INSIDE distinction).
   Immediately creation Undo restores original body/source/high-water and Redo
   the SAME semantic intent/IDs/source/opaque inherited selectors/resources.
2. Actual entryØ8→10 (h3, removal107pi), shankØ4→6 (h2, removal584pi/3), parent
   T20→25 (same h2, removal719pi/3), source width/height resize/recenter and mixed
   travel. Positive included-angle90→60deg changes h to2sqrt(3) for r3/R5,
   with additional removal44sqrt(3)pi/3. Independent expected interval/volume
   arithmetic follows actual requested canonical angle, never provider geometry.
3. Wrong actual entry/source/build/stale/unknown extra-depth field, equal/reversed
   diameters, alpha0/pi/nonfinite, invalid units/types, h>=T and containment
   refusals preserve last-good state and allow healthy continuation. Freeze exact
   error layer/code from the completed producer source, no invented acceptance
   list or relabeling numerical failure. Resource/uncertain cleanup cases require
   honest typed outcome; no fake positive evaluator. No filesystem-race probes.
4. Bind actual named shank/head LENGTHS, included ANGLE (e.g. deg(90)) and parent
   LENGTH. Update named angle/diameters/source, reject dimensional mismatch and
   numeric binding erasure, retain raw names through shared travel. MM/inch and
   readable degree display preserve physical/canonical facts. One genuine PLA
   printable region, material rebind/review after real geometry edit.
5. Three normal current .cad Save/browser/server equality/fresh signed Open cycles
   (numeric, typed, reopened reedit/resave), real STEP/core3MF and source/cap-dimension
   SVG to My files. Every submitted write/copy/sync must settle/read back before
   own-context retirement; retain uncertain write for root, never forced close.
   Own integrity-correct malformed .cad derivatives (angle domain/type, order,
   derived-depth equality, actual wrong-role cap) refuse pre-adoption, then healthy
   public read/edit/export continuation. Preserve exact source/control/material/
   presentation/association/J data and documented transient-token changes.
6. ONLY AFTER the complete whole: independent archive CRC/SHA/root/intent/equation
   oracle and actual finite STEP analytic reader. Extend the bounded STEP subset
   for genuine CONICAL_SURFACE reference radius/signed semiangle, actual cone
   equation and generatrix LINE consistency, finite circle trims/shared transition
   edge, inward shell orientation/top/bottom openings, genus1 and NO annular floor.
   Read actual declared STEP length/plane-angle units as well: current writer
   explicitly selects angle mode1/Rad (Native STEPControl_Controller.cxx:73–78;
   STEPControl_ActorWrite.cxx:471–472), but do not infer units from a nice90 value.
   Volume/support-only or face-count-only checks cannot pass. Core3MF oracle checks
   actual material/producer bindings, closed oriented controlled mesh and finite
   conical boundary/triangle geometry with derived deflection-volume allowance;
   source/Native points independently distinguish a cone from cylinder/flat step.
   SVG oracle checks actual projected line/conic geometry and physical dimensions,
   not labels/counts or an unsupported THRU flag. Pin all executed helpers and
   producing Git blobs, preserve FIRST failures/unchanged original snapshots.

Separate Native component evidence will be needed for genuine constructor roles,
cone read completeness/preservation, invalid/empty/unsupported/alias/name/cap
refusals, unknown cleanup and healthy continuation, plus retained real ordinary
ports on the new full-runtime pair. That future qualification does not happen
in this design task. No historical migration framework, alternate import scheme,
blanket cap increase, display-mesh manufacturing shortcut or default promotion.
