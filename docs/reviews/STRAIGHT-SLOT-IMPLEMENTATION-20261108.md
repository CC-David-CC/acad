# StraightSlot coherent source packet

Source only on c36579c baseline, after qualified cubic/Ellipse source.
No execution, tests, probes, TSC, build or new browser/native success claim.
This implements the approved bounded source operation, not C02 Arc regions.

## Authored data and exact parameter mapping

Use existing version3 source and actual stage constraint serialization:
typeId StraightSlot; objects [axis,upper,startCap,lower,endCap]; constants
{radius:<numeric literal string>}; actual stage index, annotations and
fresh admission. No new saved geometry flags or format. Actual axis Segment
ID is public slotId. Constructors allocate five real roots privately once
before the coordinator's first await. Existing factories allocate their own
actual child IDs; no caller/native map ordinal becomes stored authority.

Axis role construction; other four members ordinary. Start/end native Arc
traversals are CCW. Given physical A→B unit direction d and left normal n:
upper B+rn→A+rn; start A+rn→A−rn around A; lower A−rn→B−rn;
end B−rn→B+rn around B. Reversal changes source roles/traversal and retains
actual identities. It is not a no-op just because the undirected locus agrees.

StraightSlotSchema params:
0..5: axis ax,ay,bx,by,angle,signed-t;
6..12: start ax,ay,bx,by,cx,cy,r;
13..19: end ax,ay,bx,by,cx,cy,r.

Ten original polynomial residuals, ALL in mm:
(1..4) start.cx−axis.ax, start.cy−axis.ay,
end.cx−axis.bx, end.cy−axis.by.
(5..6) start.r−literalRadius, end.r−literalRadius.
(7..10) each cap endpoint's (P−C)·d, four radial/direction dot products.
Here d=sign(t)*(cos(angle),sin(angle)). Trig/sign are dimensionless factors;
there is NO dimensionless-only residual mislabeled as mm.
The same unchanged registered length residual policy applies, not an
invented global tolerance or coefficient cutoff. Full geometry/current-source
and replay checks remain separate from equation acceptance.

Actual Jacobian: for a radial residual, derivatives w.r.t. point/center
coordinates are ±d; angle derivative is (P−C)·n, equal ±r at the intended
semicircle endpoints, so regular for admitted r. sign(t) derivative is0
within each nonzero directed chart. At t0 physical direction is undefined;
the existing Segment numerical envelope |t|>1e-9 is required. No derivative
or branch is persisted; exact zero/small-domain refusal is not zero snapping.
Near this excluded discontinuity the new row does not claim smoothness.
Canonical fixed-function certification is unchanged.

Native intrinsic equations remain: 3 Segment Polars with2 equations each
and2 ArcConsistency sets with4 equations each. Four actual PCoincident
junction rows add8 equations. 36 native scalar Params −14 intrinsic −10 Slot
−8 junction =4 primary axis-coordinate freedoms in the regular independent
case. This count motivates the formulation, not an admission rank certificate.
Actual solver determines accepted/redundant rows, never forced classifications.
We deliberately avoided22 endpoint equations plus duplicate junction rows.

Directed side is an actual domain condition: start.a:+n/start.b:−n;
end.a:−n/end.b:+n. Radial length follows original native ArcConsistency and
radius equalities, not dot-normal extrema (which would be singular there).
Both actual native domain and independent source witness must corroborate.
The current Arc full-circle endpoint predicate can confuse tiny semicircles;
SLOT_UNSUPPORTED_RESOLUTION explicitly rejects that encoding. No Arc threshold
or general source interpretation changed. r0/nonfinite/collapsed source and
unsupported represented scales remain distinct. No new .001mm/1e6 radius cap.

## One source/solver/journal boundary

Strict IO registers the real schema and validates declaration arity, roles,
source stage, unique root membership, literal radius, actual native directed
geometry and real endpoint junctions before native Open adoption. It rejects
unknown new Slot fields and generator-owned members; no hidden metadata cache.
The existing project validation Worker already calls this same native factory
preflight. Reading existing non-Slot native documents is unchanged. Restoring
actual role on its temporary rebuilt roots matches the existing strict loader.

Disposable Worker authenticates real Segment/Arc/EndPoint classes, roots,
children, stages, index/Param ownership and unchanged native graph. Create/edit
validates original current source, constructs the requested declared candidate
from actual axis/radius using real factories, and preserves unrelated raw data.
The new rows' real first solve establishes admission; retained classifications
cannot silently change. Fresh solve, captured original equations and independent
next solve check candidate/reconstruction under existing budgets. We return
the declared checked candidate, never copy unchecked optimizer geometry over
requested coordinates. A second disposable Worker reconstructs the COMPLETE
original request and compares exact candidate bytes/change/identity receipt.
Generic point edits do not gain Slot authority or silently repair its boundary.

Public new create/edit are thin shared coordinator paths through existing
candidate overlay, source-byte journal, currentness, cancel and commit rules.
No extra journal/model, lazy source creation, autosave or shutdown write.
Travel reuses exact historical source-byte proof. Typed Slot mutation is not
advertised; literal radius is explicit and named binding cannot be overwritten.
Actual native inspection is a cold read only; primary stored coordinates may
differ from reconstruction within the separately declared replay budget.
Returned native endpoint IDs/centers/radii/angles bind actual native objects;
the main client validates identity/data, not geometry or original equations.
Root/point maps keep new inspection validation linear in bounded reply size.

## Qualification boundary

test/straight-slot-public-workflow prepares one complete actual registered
public chain, normal .cad Save/Open, real external constraint/refusal/travel
and independent ZIP/source/Arc+Segment oracle. It is NOT executed here.
Source/controller/driver pins and all first failures must be retained.
No public Slot region/extrusion is claimed; selectedSketchProfile still only
supports polygon Segments/full Circles. No Native C++/catalog/default, PM/Files,
sourceFrame, Canvas/human UI, global solver/reduction/threshold modifications.
