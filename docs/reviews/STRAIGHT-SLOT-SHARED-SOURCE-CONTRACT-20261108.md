# C01 straight Slot: bounded source and math proposal

PLAN ONLY, 2026-11-08. Source baseline 94029cca94d81a72bba61ac42219b1ca801cfd61.
No Slot product, tests/probes/TSC/build/browser, native geometry success or
human UI/physics claim. Frozen cubic/Ellipse branches, drivers and evidence
remain unchanged. Root approval is required before the seams below are edited.

Prerequisite status reported by root: cubic R2 whole workflow and independent
Fraction/ZIP oracle PASS, actual Core 26d7a55/Desktop f6d1c07d1, frozen source
proof e381b70  / Desktop 1d63d8566. This is a prerequisite only; it proves no Slot.

## Actual inventory / missing contracts

No Slot/Obround/Capsule ordinary shape, constraint schema, registered shared
command or old Slot tool was found in the checked-in sketcher/native model,
CAD sketch tool registry, workbench modeler or relevant legacy action sources.
The remaining Slot in the finite closure audit is a requirement, not an
existing implementation. Package internal-slot is a JavaScript dependency,
not a geometric primitive. Do not cite it or draw a rounded rectangle and
claim a semantic Slot operation exists.

Available actual representations:

* `web/app/sketcher/shapes/segment.ts`: real Segment owns 2 EndPoints plus
  angle/signed length Params and intrinsic Polar equations. Direction is the
  actual A->B vector; normalized angle alone is not enough if signed t flips.
* `web/app/sketcher/shapes/arc.ts`: real Arc owns a,b,c EndPoints plus radius,
  start/end-angle Params. Writer stores a/b/c; reconstruction infers radius/
  angles. Arc traversal is actual CCW a->b, not an inferred shortest branch.
* `ANConstraints.ts`: PCoincident, Polar, ArcConsistency, length/radius/angle,
  Parallel/TangentLC etc exist. A collection of those without a Slot declaration
  is not an authoritative named Slot. No existing row captures the relationship
  between a centerline and both semicircular ends/parallel sides as one intent.
* `headless/primitiveTransition`, `closedSketchTransitions`, existing Desktop
  primitive adapter: ordinary Segment/Arc authoring, parameter/point operations,
  true native ownership, independent original-request proof, candidate overlay
  and sketch-byte journal are reusable. Do not call a sequence of public appends
  and claim atomic Slot creation or a permanent Slot relation.
* `headless/stageGeneratorPolicy.mjs`: only Mirror stage generators currently
  have an admitted graph. A new Slot generator would widen generator/derived
  authority unnecessarily. Prefer a registered ordinary geometric relation over
  existing native Segment/Arc objects, within the SAME source/solver model.
* `headless/typedRectangleReconstruction.ts` and rectangle dimension edit:
  useful precedent for explicit declared-geometry construction plus genuine
  equation/replay proofs. Do not copy rect-ID grammar or its hardcoded positive
  width/height limits into Slot; derive actual owned members from source rows.
* `ordinaryEntityDomain.mjs`, native `io.ts`, registered residual/domain policy:
  appropriate shared pre-adoption/source-domain seams. Native Open must not
  accept a fake Slot declaration whose member geometry no longer represents it.
* `renderSketchProjection` supports ordinary Segment/Arc projection. It is a
  source/display observation, not a new authoritative Slot or BRep topology.
* `modules/engine/extrusion/selectedSketchProfile.mjs` currently admits ordinary
  polygon Segments and full Circles, NOT these semicircular Arc profiles. A
  closed source Slot does not imply current selected-profile extrusion/region
  support. No hidden cylinder/box Boolean recipe can substitute for that gap.

## Preferred smallest authoritative representation (decision for root)

Add ONE actual registered schema `StraightSlot`, using existing native shapes.
Saved row exact intent is the normal constraint representation:

`{typeId:'StraightSlot',objects:[axis,upper,startCap,lower,endCap],constants:{radius:<full-roundtrip literal mm>},admission:<actual fresh status>,stage:<actual stage index>}`.

Types in this authored order are Segment,Segment,Arc,Segment,Arc. Axis role is
construction; the four boundary members are ordinary. IDs are genuine native
root/child IDs, allocated privately once before await and retained. This row,
not a metadata trust flag or AABB guess, declares the semantic relationship.
Use the actual axis Segment ID as the public slot identity (`slotId`); do not
invent a second persistent Slot-ID model. Require a unique row for that axis
and unambiguous member ownership. Point/control identities come from the real
native objects, never parsed suffixes or nearest coordinates.

Primary authored data: actual axis endpoints A,B plus this literal radius.
Boundary coordinates are derived witnesses tied by original equations. No
second saved center/angle/length/radius flag, duplicated external document or
parallel feature stack. This preserves source format3 and the current solver/
constraint/history model. Old clients lacking the registered schema must refuse
it rather than interpret the objects as a qualified semantic Slot.

Also create four real PCoincident junction relations using actual member
EndPoints. They express loop connectivity for the source graph, not an epsilon
weld. Their fresh accepted/redundant classifications may differ by actual
independence; preserve the real result, never force every row accepted. Source
construction and original request verifier prove the whole group atomically.
Any legacy/general collection of similar lines/arcs without the declared row
remains ordinary geometry, not automatically recognized as Slot.

New schema equations use actual registered native Param membership. Reuse
existing signed-direction handling, including DIRECTION_SIGN-style semantics,
so physical axis direction is sign(t)*(cos(angle),sin(angle)); do not assume a
normalized polar angle always means positive A->B. This is a relation/schema
addition, not permission to change the solver, coefficient policy, stopping or
generic AngleBetween. Source axis geometry remains the primary meaning.

## Mathematical slot meaning and directed boundary

A!=B, L=|B-A|, d=(B-A)/L, n=(-dy,dx), radius r>0. Boundary in CCW order:

1. upper Segment B+r*n -> A+r*n;
2. start Arc center A, a=A+r*n -> b=A-r*n, CCW outer semicircle;
3. lower Segment A-r*n -> B-r*n;
4. end Arc center B, a=B-r*n -> b=B+r*n, CCW outer semicircle.

Cap half-turn and side placement must be enforced by the new registered
row's original equations, not solely by construction metadata. The concrete
equation list and residual units must be reviewed with the implementation;
this proposal does not claim those equations already exist.

The roles are relative to the directed axis, not world top/left or proximity.
Each cap has declared half-turn intent; never use shortest-angle guessing.
Reversing A/B retains the same undirected locus but changes authored traversal/
role placement. It is not a source no-op and must not silently swap IDs or erase
this changed intent. Edits retain actual axis/member/junction identities.

True locus is the line segment Minkowski-summed with a radius-r disk:
area=2*r*L+pi*r², perimeter=2*L+2*pi*r, coordinate bounds
[min(Ax,Bx)-r,min(Ay,By)-r]..[max(Ax,Bx)+r,max(Ay,By)+r]. Tangency follows from
side direction d perpendicular to cap radial n at each join. Verify actual
native member observations independently; the mere presence of the row is
not a geometry certificate.

Finite required fixture A=(0,0),B=(20,0),r=3 has bounds[-3,-3]..[23,3],26x6,
area120+9*pi, perimeter40+6*pi. Radius 4 gives bounds28x8 and area160+16*pi;
then length 30 gives bounds38x8/area240+16*pi. Rotated/translated fixture
A=(10,10),B=(22,26),r=3 uses exact 3-4-5 direction, bounds[7,7]..[25,29] and
same area120+9*pi. Source reversal keeps locus/area and follows actual new
start/end roles while preserving IDs. No shape is relocated to fit the frame.

## Accepted/refused initial domain

One ordinary independent source plane, canonical mm, same captured revision/
frame/currentness; finite directed endpoints and r; actual native Segment and
Arc numerical envelopes. No new arbitrary .001mm or 1e6 Slot-only dimension
floor/cap. Existing public coordinate/source/work envelopes still apply, and
finite computed member parameters/bounds must be representable. Mathematical
L=0 is the limiting disk, but outside the first straight Slot domain: explicit
refusal, no Circle conversion. r=0 collapses width/caps; negative/nonfinite r or
nonfinite source is a request/domain failure. Very small positive data outside
an existing representation/precision envelope is unsupported scale, not proof
of mathematical invalidity or global infeasibility.

Important existing representation boundary: generic Arc append/projection/
source-path interpretation use a per-coordinate endpoint-nearness full-circle
predicate (abs(delta x)<1e-6 AND abs(delta y)<1e-6). Antipodal endpoints of a
mathematically valid tiny semicircle can satisfy that predicate. The Slot
builder must refuse that ambiguous existing Arc encoding explicitly, e.g.
SLOT_UNSUPPORTED_RESOLUTION, rather than author a cap that consumers interpret
as a full circle. This is inherited capability behavior, not a proposed global
threshold change or a fake radius-independent mathematical floor. Ordinary
20/r=3 is safely outside it. Any deliberate Arc-branch representation repair
requires a separate coherent approval/whole workflow, not a hidden Slot flag.

First editable Slot radius is a literal. Named/typed radius bindings are
explicitly readonly/unsupported until an actual typed-field integration exists;
never overwrite a formula because a numeric value resolved. Existing ordinary
constraints remain. Additional constraints may legitimately reject a requested
edit; do not remove/readd constraints or alter unrelated geometry to succeed.
Curved centerline, variable width, unequal end radii, full-circle/collapsed slot,
self-crossing custom boundaries, automatic shape recognition, offsets/trim,
arbitrary rounded rectangles and BRep profiles are not added by this slice.

## Proposed public API and shared transaction

Reuse inspect-closed-sketch(es); add a bounded slots array built from the actual
registered row/member factory and native ownership. Row includes slotId, row
locator/status, axis actual Point IDs+coordinates, literal/resolved radius,
ordered member IDs/roles and actual native Segment/Arc geometric observations,
source frame, canEdit/reason. Its binding is source/revision-specific; no native
Map indices are persisted. The list does not grant generic primitive deletion
or arbitrary constraint-schema execution authority.

New `create-closed-sketch-slot({revision,faceId,a:{x,y},b:{x,y},radius})` and
`edit-closed-sketch-slot({revision,faceId,slotId,a:{x,y},b:{x,y},radius})` use
common Craft service methods and a dedicated disposable Worker transition.
Exact own-data capture; no caller new IDs/member coordinates/schema flags.
All 5 objects +real constraints are one atomic group, never sequential visible
open/intermediate profiles. One genuine source candidate publication, existing
sketch-byte journal, existing lifetime/cancel/counter/resource semantics.

Worker validates current original source, actual registered row/member/Param/
SolverParam ownership and declared branch; constructs the requested canonical
geometry from the actual axis/radius before optimization; validates original
edited equations/domain/classification and fresh replay. Source boundary data
comes from real Segment/Arc construction. Return the declared checked candidate,
not an unchecked optimizer copy. A SECOND independent Worker reconstructs the
whole original request including actual group IDs and compares candidate/receipt.
Unrelated source, constraints, frames and formulas remain exact. No global
healing on read/Open/extrusion, rounding, epsilon weld or proof waiver.

Edits use the same group IDs; update only actual primary axis endpoint values/
radius literal plus their genuinely derived boundary witnesses. Reversing the
axis is an authored change even if the locus agrees. No-op preserves original
bytes/J after full current-source checks. UndoRedo restores exact historical
source via the existing journal proof path, no new state stack or creation-only
undo substitute. A generic edit must never corrupt declared Slot semantics;
the shared domain/semantic verifier catches it rather than erasing the relation.

Observe actual native Arc/Segment primitives through the same Worker-backed
slots inspection, including real radius/endpoints/centers/CCW branch, not just
an expected area field computed from radius metadata. Point/arc observations
must bind their actual owning instance, source snapshot and frame, with native
parameters unchanged before/after read. Existing generic cubic point-read is
NOT silently broadened to grant Slot/member authority.

## Exact proposed ownership before implementation

New: constr/straightSlotSchema.ts, headless/straightSlotIntent.mjs,
headless/straightSlotTransition.ts (create/edit/inspect+original verifier),
headless/straightSlotSource.ts (pure structural +Worker actual semantic proof),
one public example and one complete driver/independent oracle directory.
Actual names/schema/DTO must be frozen with root before code.

Narrow old seams: ANConstraints registry; registeredConstraintPolicy domain/
residual classification (all coordinate residuals explicitly mm); headless
signature/semantic checks, captured native graph custody as needed; ordinary
source/native IO pure Slot-declaration admission and projectValidationCore
Worker geometric/provenance checks; closedSketchInspection/inspectionClient,
transition/generic clients/solveWorker dispatch; common closedSketchTransitions/
Craft type and existing Desktop adapter. New mathematical schema uses current
polynomial interface and original-row validation; no global solver math,
reduction/threshold/order changes. No new generator protocol or shape class.
Existing PCoincident/Polar/ArcConsistency remain genuine and unchanged.

No root PM/Files, Native kernel/catalog/default, archive codec/schema version,
Canvas/human toolbar redesign or staged service/browser work. Root coordinates
shared IO/Craft/constraint file owners before approval. Current semicircular
Arc profiles are not supported by selectedSketchProfile; closing that future
3D/profile gap needs a distinct source/native contract, not an implied pass.

## One eventual complete acceptance and independent truth

Actual registered public authoring on an ordinary plane with unrelated Point/
Segment and current frame, Slot 20/r=3. Verify actual semantic row/member identity,
closed CCW junction graph and real native member observations; derive bounds/
area/tangency independently from observed members AND actual saved primary
source, not from a naked expected field. Include radius/length/3-4-5 placement/
reversal changes, mixed shared UndoRedo/no-op, incompatible external constraint,
zero/nonfinite/representation-resolution/stale/wrong-row/wrong-member refusals,
healthy continuation and exact last-good source/J/counters/resource retention.

Then ordinary .cad Save/My files/server bytes/fresh login Open/reedit/resave/
second Open, preserving actual group/source/history IDs. Own malformed files
derive only from actual healthy public Save (missing/aliased member, wrong cap
branch, radius/boundary inconsistency, duplicate declaration), and must refuse
before adoption. No raw positive source seed, fake successful reply, held-reply
injection or filesystem/account race. Unimplemented BRep/region remains explicit.

Freeze independent tolerances BEFORE observation: relevant source/control
identities and primary literal parameters exact; physical coordinates 50 pm=
5e-8mm for these finite fixtures; area/perimeter get separately labeled scalar
budgets, never infer an area unit tolerance from a coordinate epsilon. Proposed
fixture-area absolute 1e-9mm²/perimeter1e-9mm, subject to root approval. Exact
Fraction geometry for horizontal/3-4-5 primary data, high-precision pi/circular
integrals plus actual observed radius/angles, no production geometry imports.
Use full directed branch and actual IDs, never opaque-ID parsing/nearest-role
selection, mesh comparison or BRep validity guesses. Existing declared render
approximation is not authoritative source or independent geometric truth.

## Read-only cubic admission repair review (26d7a55)

No blocker found. validateStrictObject now uses the same already-mandatory
inspectBoundedSpline instead of an earlier generic check: accepted set is not
widened, caps/actual derived checks remain, no constructor/rebuild added there.
Constant Bezier still reaches ordinary domain; knot order/alias get typed
INVALID_SPLINE_DATA; over-cap source gets SPLINE_RESOURCE_LIMIT before sampling;
stale fit data reaches actual Worker SPLINE_DERIVED_MISMATCH. Archive error
transport forwards these real codes instead of generic Error falling back to
CAD_ARCHIVE_INVALID. Optional private admissionCause records remain outside
the existing archive error wire (code/message only); this is not a new public
structured-cause transport claim. Review only; root ran the unchanged whole
R2/independent oracle successfully afterward as separately recorded above.
