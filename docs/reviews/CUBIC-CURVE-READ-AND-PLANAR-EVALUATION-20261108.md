# Cubic curve observations and native Bezier coordinate semantics

Compact source-only proposal BEFORE public read or native evaluator edits.
Base ACAD a085d39c07fbe4dad12621fa8849717e43eeb727; Desktop
9d8f51061feb86d1915c5b76e8bc27264ec547d3. Existing spline contracte54bb03
and frozen Ellipse source/evidence stay unchanged. No tests, probes, build,
TSC, browser or runtime-result claim.

## Exact proposed registered read

`inspect-closed-sketch-curve-points({revision,faceId,id,parameters})`, exposed
by shared Craft `inspectClosedSketchCurvePoints(input,options)` and existing
Desktop closed-sketch adapter. parameters is a dense own-data array of1..64
actual finite Numbers t in[0,1]. Keep input order, allow duplicates/endpoints
and do not round/sort/snap. Root/face IDs are actual inspected opaque IDs,
not arbitrary source records, point ordinals or an equation execution route.
Initial eligible types: canonical native BezierCurve and actual cubic Clamped
CVModel=true/interpolation=false/method0 BSpline only. Other valid modes
refuse `UNSUPPORTED_CURVE_MODE`, not invalid geometry.

Private disposable Worker task `sketch-transition-curve-points` captures the
usual `{revision,sketchJSON,externalParameters,intent:{id,parameters}}`.
Existing captured source/revision/frame/service/currentness/lifetime guards
apply. Worker performs genuine current replay/domain/derived-data validation,
reconstructs the actual native shape, verifies real index/root/class/stage/
EndPoint/Param ownership and captures parameter values before evaluating.
It calls the native Bezier exported compute on its actual a/b/cp1/cp2 objects,
or native BSpline.getPoint(t), including the existing dedicated t=1 endpoint
branch. No display polyline, production-external substitute function,
nearest-point lookup or caller-provided successful response is used.

After the calls, verify native/source parameters and identities unchanged;
recheck original source/currentness before returning. Finite x/y mandatory;
Bezier compute must also return actual finite planar z0 before x/y projection.
The request is a curve observation, not a BRep/material/manufacturing result.
No preparation/publication/model candidate/journal/history/source write occurs.
Existing disposable Worker deadline/cancellation/cleanup owns the read lifetime.
Do not terminate a separate accepted model owner or create a second owner stack.
No new cache, hidden currentness flag or sourcePreserved trust certificate.

Worker success exact payload:
`{revision,ok:true,curve:{id,type},samples:[{parameter,x,y},...]}`.
Count/order/each parameter match the captured request exactly; every x/y is
finite. Main client validates bounded own-data DTO and binding before expose.
Public success exact fields:
`{revision,faceId,id,type,unit:'millimeter',coordinates:'sketch-local',quality:'native-sketch-curve-evaluation',observation:'verified-cold-replay',boundaryFrame,samples}`.
Revision is the captured caller revision, frame the actual bound source frame.
Sample coordinates describe that verified cold source observation, distinct
from exact stored control bytes. Retained control values and samples must each
meet their own independently frozen analytic checks; replay agreement is not
an accuracy reference. This API does not report derivatives/tangency, area,
length, topology, BRep validity or universal precision.

Failures preserve existing bounded code/message/admission cause and ownership.
Unknown/nonowned/wrong type target -> explicit target refusal; wrong sampling
input -> invalid request/domain; valid other source mode -> unsupported mode;
nonfinite actual computed value -> actual numeric failure; limits/deadline/
cancel remain resource/lifetime outcomes. No silent clamping or fallback.

Read seams: new headless curve observation module +bounded capture helper,
transitionClient/generic client/solveWorker, existing shared closedSketchTransitions
and its Craft type, Desktop closed-sketch adapter. Core/Worker-heavy parsing,
projection/canonical ownership and evaluation stay off the UI thread. No new UI,
source format, broad generic point authority, Native BRep or archive changes.

## Source-confirmed Bezier z issue and proposed narrow repair

Actual native EndPoint (`web/app/sketcher/shapes/point.ts`) has x/y Params and
NO z. `web/app/sketcher/shapes/bezier-curve.js::compute` currently evaluates
`a*p0.z+b*p1.z+c*p2.z+d*p3.z`, which is NaN for its planar native EndPoints.
However `modules/math/vector.ts` constructor sets `this.z=z||0` (also x/y),
so the returned Vector silently turns that NaN into0. This is a confirmed
source arithmetic/masking path, NOT a measured returned-NaN result.

Actual checked-in direct callers of this compute export are same-file
`labelCenter` at t=.5 and `LUT` for planar Bezier curve selection. Other source
imports found use the class, not compute; generic independent polynomial/
geometry utilities are different functions and remain unchanged. The function
is exported, so preserve a coherent explicit3D option rather than silently
flatten a legitimate future/other call with real3D points.

Proposed change ONLY in bezier-curve.js::compute:

* Require actual finite x/y values for all four input points and finite t.
  Do not impose a new t[0,1] restriction on this polynomial function itself;
  the public curve sampling API owns that interval. No geometry snapping.
* All4z absent/undefined -> explicit PLANAR mode and z=0, consistent with the
  actual native sketch model. No absent coordinate participates in arithmetic.
* All4z are finite Numbers -> actual3D Bernstein evaluation of z, retaining
  existing legitimate3D behavior. Mixed missing/finite/nonfinite z forms
  explicitly refuse unsupported/invalid coordinate encoding. No guessed plane.
* Evaluate the same existing Bernstein polynomial with all available binary64
  precision. Validate computed x/y/z finite BEFORE passing them to Vector, so
  its falsey fallback cannot turn an actual numerical failure into a zero.
* Keep argument ordering compute(t,from,to,controlPoint1,controlPoint2), return
  type Vector, class data/IDs/methods, all external geometry utilities and
  Vector constructor unchanged. No threshold, residual or solver-policy edit.

This repairs an underlying native evaluator rather than hiding NaN in the new
wrapper. The complete real public workflow verifies planar point observations
against independent Fraction Bernstein math for the actual saved source and
observed controls, endpoints, midpoint, edits/reversal/travel/SaveOpen. BSpline
uses independent exact Cox-de Boor on its real clamped source knots, including
five controls/internal0.5. Coordinate budget50pm=5e-8mm remains independent;
no new rounding/residual waiver. No3D/native BRep/tangency qualification follows
from the planar whole-flow proof. Malformed/mixed3D values are source semantics
of the export, not a new public3D authoring API or a synthetic success test.

Root review required before editing compute or implementing the new read API.
Other already-approved author/inspect/control-edit source work may proceed.
