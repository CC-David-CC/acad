# Finite-curve packet5: certification boundary BEFORE implementation

PLAN ONLY, 2026-11-09; isolated from Root at Core
`37a87360a97f646a6ac3f5a6ed0aa6800da698bf`. No product/common changes,
parser, tests, build, Native/module/browser execution or qualification. This
refines packet5 of `CAD1-FINITE-CURVE-QUERY-AUTHORING-BRIDGE-20261109.md`
and preserves `CAD1-FINITE-CURVE-ROOT-DECISIONS-20261109.md`.

The actual compiled raw source is Native d3b2afa, not merely the original
unexported header. Pure wire56eeb1c and private invokerbf444ec remain unmounted;
their input/cleanup custody grants no original-source or finite-event authority.
Raw done/empty/parallel/identical and proximity are never the certificate.

## What the actual library and source establish

Read the actual retained OCCT7.6 source, not a menu/API inventory. SDK forwarding
headers resolve into `/mnt/data10tb/codi-occ-four-corner-source-20261104/occt/`.
`IntAna2d_AnaIntersection_1.cxx` uses RealEpsilon tests for line parallelism and
coincidence; `_2.cxx` uses Epsilon tests for circle separation/tangency and can
clamp a negative intermediate square to zero; `_3.cxx` uses Epsilon(radius)
for line/circle tangency. These are legitimate numerical-library policies, not
exact represented-source topology. No new tolerance argument fixes that fact.

|Actually read source|SHA256|
|---|---|
|Native shape-io/finiteCurveIntersectionsV1.hpp|8228887d4890218fefaf4516b8b9866e18be3a5a03ad4047051946a0b61a9f28|
|OCCT IntAna2d_AnaIntersection.hxx|8591ec3a735413750495fbe8066ef0afc16e4ad2cd401b0e2f8a331c039bcddf|
|OCCT IntAna2d_AnaIntersection_1.cxx|4e4c931f7b751bc85ad786d8221a5c88ed857a086894d844bfdcf5880e2e4622|
|OCCT IntAna2d_AnaIntersection_2.cxx|6e2abce8feef2e0e43e7bcb6220c3b9e8b36ce5cd859fe5e97cf697b2e008433|
|OCCT IntAna2d_AnaIntersection_3.cxx|028f7278fda10096f935e6c2a4530cf7cd68b8c65a60777f4bfe9291d6a1af19|

Existing exact leaves are `simplePolygon.mjs:orientationSign/segmentRelation`
and `circularTopology.mjs:circularRelation/circlePointSign/circularEventSide`.
They classify represented coordinates, not approximate Native root points. The
circular leaf's existing4e6 arithmetic admission must remain unchanged; the raw
wire permits1e8. Do not silently pass larger coordinates into that leaf or
globally change its consumers. A new bounded certificate-arithmetic leaf needs
exact dyadic sums/products and rational interval operations for the equations
below. Those operations verify witnesses; they are not a second root generator.
Do not import the app-layer exact Polar solver leaf into the engine graph.

## Source model and strong initial domain

Require BOTH independent unchanged-original-request extractions, original
equations/domain/ownership proofs and exact source/parameter/frame/job binding
before certification. Only genuine distinct nongenerated authored root Segment,
Circle and finite CCW Arc inputs; all unrelated source remains unchanged.
Continue the existing wire bounds, with no new minimum length/radius.

For a Segment use original endpoints a,b and exact d=b-a, q(t)=a+t*d,
t∈[0,1]. This dimensionless source parameter is distinct from Native's
millimeter parameter on its rounded normalized direction. For a Circle use
the original extracted center c and positive represented radius r,
F(q)=|q-c|²-r². Signed zero is mathematical zero, while original input bits
remain preserved for custody. Never round a subtraction before exact expansion.

For initial Arc certification additionally require exact endpoint incidence
|a-c|²=|b-c|²=r², a≠b, and the independently extracted genuine CCW nonfull branch.
The current full-turn convention must also be excluded explicitly: Arc.drawImpl
and Fix use both endpoint coordinate differences <1e-6 as a full-turn branch.
Inputs entering that inherited branch are ARC_BRANCH_UNCERTAIN here, not a new
finite-Arc success. This is a guard against conflicting existing semantics,
not use of1e-6 as mathematical endpoint equality or a new radius minimum.
Use its AUTHORED endpoint directions for finite circular order, not a tolerance
test against Native sin/cos evaluation. This admits arbitrary exact Pythagorean
directions, translation, minor/semicircular/major spans and seam crossings,
not only a quarter-circle recipe. It deliberately does not certify all currently
admitted numeric Arcs: Arc.write persists a/b/c; Arc.read reconstructs r with
distanceA and angles with Math.atan2; ArcConsistency validates trig equations
numerically. That does not prove exact incidence on the represented-r circle.

This is a material approval boundary: treat the persisted endpoint-defined CCW
sector as finite-domain intent, with cached angle lifts checked for branch
agreement, not as a new authored floating-radian cut. Do NOT silently replace
an endpoint by a radial projection. If the current source extractor cannot
authenticate that branch, return uncertainty. Nonincident ordinary Arc inputs
and CAD-ARC-01 full/near-full/near-zero semantics remain required work, listed
below; this initial strong domain does not narrow Gate1 or change Arc storage.

## Complete support census and candidate verification

For line/line below, c is the second line's original start and e its original
end-minus-start vector. Use exactly ONE actual OCCT support query. It supplies ALL numerical candidate
points. No alternate solver, requery, missing-root construction or fallback is
permitted. Exact equations establish the expected census independently:

|Pair|Exact certificate equation and root census|
|---|---|
|line/line|D=cross(d,e); D≠0 gives exactly one root, t=cross(c-a,e)/D and u=cross(c-a,d)/D. D=0 plus exact collinearity gives common support, otherwise no roots.|
|line/circle|A=d·d>0, B=2*d·(a-c), C=|a-c|²-r²; f(t)=At²+Bt+C. Δ=B²-4AC is negative/zero/positive for0/one double/two simple roots.|
|circle/circle|d=c1-c0, D=d·d. If D=0, exact radius equality gives common support, otherwise no roots. For D>0 set K=D+r0²-r1², H=4*D*r0²-K². Parameterize q(v)=c0+(K*d+v*Jd)/(2D), Jd=(-dy,dx); v²-H=0. H<0/0/>0 gives0/one double/two simple roots.|

These rational identities are proof witnesses, never substitute published
coordinates. For discrete cases require done:true, every raw row matched
one-to-one to the expected support roots and flags compatible with that census.
An exact2-root case reported as one tangent is UNCERTAIN, never welded. Any
missing/extra/duplicate candidate, unfinished algorithm or contradictory flags
is UNCERTAIN. No dropping raw neighbors or accepting only roots inside the
finite domains before proving the complete support census.

Concrete proposed bounded verifier (Root approval before code):

1. Around each actual raw point p construct closed boxes Q_k using exact
   predecessor/successor binary64 endpoints, k=1,2,4,8,16,32,64 ULP steps.
   These are candidate enclosures, NOT a distance-equality tolerance. Reject
   overflow/unbounded arithmetic; never modify p or create another point.
2. For line/line and exact double roots, test their exact rational proof point
   lies in Q_k. For a simple root, invert BOTH affine coordinate constraints
   q(I)⊆Q_k to form one rational parameter interval I. Check opposite endpoint
   signs (or an exact endpoint zero) and strict nonzero derivative over I.
   This proves existence and uniqueness in that interval, not only a residual.
   Constant coordinate components must also lie in their exact Q_k bounds.
3. Permit at most64 exact interval bisections of an ALREADY proved unique
   candidate bracket to decide domains/order. These refine a certificate only;
   they cannot supply a missing OCCT root, new coordinates or a solver retry.
   Require distinct simple-root brackets and a complete one-to-one census.
4. Record exact discriminant/sign, multiplicity, bracket, derivative lower
   bound, pairwise separation and mapped coordinate enclosure. A small numeric
   residual alone proves none of those facts. A tangent uses the exact Δ/H=0
   proof, not a derivative lower bound or merged nearby simple brackets.

Proposed resources: existing2curves/24values/8raw rows/64KiB wire unchanged;
at most2 isolated support roots;7 box sizes per raw row;64 refinements per
candidate;16384-bit numerator/denominator/intermediate bound;500000 charged
exact operations per pair. Every operation checks bounds before enlargement.
Implementation must show the actual intermediate bit accounting, not assume
IEEE magnitude proves it. Excess is RESOURCE_LIMIT, never a partial result.

Native gp direction is generally rounded and need not be exactly parallel to
the source d. Capture/validate its actual basis and source input echo, but prove
roots against ORIGINAL equations above. A wrong/drifted Native candidate only
passes if its actual enclosure proves the correct source root independently.
Map raw parameter fields through algorithmOrder without relabeling them. A
missing implicit second parameter stays missing in the raw report. Derived
source t/brackets/circular order are separately identified certificate facts;
no guessed atan2 parameter is inserted into the Native packet.

## Finite membership, endpoint occurrences and common-support intervals

Every support root is either proved inside, proved outside or unresolved for
EACH source domain. Segment membership compares exact algebraic t with0/1.
Endpoint equality requires an exact original endpoint to satisfy both support
equations and match the isolated root; a box near t=0 is not endpoint equality.
If a nonendpoint interval straddles a boundary after the work bound, UNCERTAIN.

For a Circle, order radial directions by half-plane and exact cross sign.
The seam is a canonical ordering boundary, not a second geometric point. For
an Arc use the closed CCW interval from its authenticated a-c to b-c in that
order: ordinary interval when start≤end; wrapped union otherwise. Exact same
endpoint rays require the actual positive radial direction and support incidence,
not collinearity alone. Evaluate cross/half-plane signs over the isolated root
enclosure; unresolved zero/sign or lift agreement refuses. Exact endpoint roots
carry the genuine a/b occurrence(s), independently of their approximate raw
angles. Reversed query order preserves source owners and occurrence identity.

For exact common lines, intersect the finite source parameter intervals using
exact rational order: separate, singleton contact or positive overlap. For
exact common circles, intersect original Circle/full and Arc/closed CCW domains
using exact endpoint circular order, including wrapped intervals. An exactly
zero affine half-plane/cross predicate can be proved by its rational zero
parameter satisfying the support polynomial and the already isolated root;
otherwise a zero-straddling enclosure is unresolved. Thus a genuine canonical
seam/cardinal-ray root is not automatically uncertain merely because strict
interval signs cannot prove a mathematical zero. This also constructs no new
published root. Return the
complete bounded interval set and authentic endpoint owners. Interval overlap
is not an isolated cut event. No nearest boundary is inferred from a continuum;
later action must explicitly choose an authenticated interval boundary or refuse.

Available-empty means ALL support roots were proved and excluded, or exact
support separation was positively proved with a consistent completed raw query.
No discarded/uncertain point, exhausted budget or raw IsEmpty can yield it.

## Explicit Segment endpoint-ray extension policy

Propose a semantic query-domain union for Root approval, not a Native ABI flag:
finite-pair, OR endpoint-ray with actual target Segment ID and endpoint a/b.
The other source is the finite boundary. Source-derived pair/endpoint ownership
is mandatory; callers provide no ray coordinates, bounds or positive proof.

For target a use q=a+μ(a-b), μ>0 (equivalently t<0). For target b use
q=b+μ(b-a), μ>0 (t>1). Boundary Segment remains [0,1], Circle remains periodic,
Arc remains its certified finite CCW domain. Prove the SAME complete support
root census before ray filtering. Equality at the old endpoint is an existing
contact/no-op, never a positive extension. Every eligible root is returned;
the caller MUST explicitly choose its current response-local occurrence. Two
forward roots never mean “choose nearest”. A finite-pair empty result grants
no extension authority. A coincident interval requires explicit boundary
selection; no automatic endpoint or nearest-overlap rule is introduced.

Public event identity is opaque and response-local, bound to exact original
source/parameter/frame/pair/domain/branch/job and candidate proof. Source change,
travel, Open or owner retirement revokes it. Nothing persists query roots.

## Accuracy, states and actual remaining ordinary work

Certification returns a root enclosure and actual error bound, not a blanket
50pm intersection claim. For a proposed publication of actual Native point p,
bound its distance to EVERY point in the certified exact-root enclosure using
exact squared bounds. Separately require that bound AND all original-request /
candidate/replay/source-preservation checks meet the existing50pm source-write
budget. No new geometric equality tolerance follows from that budget. If p is
too inaccurate, the query may retain nonactionable certified facts but the
edit must refuse; never publish a computed alternative or claim full precision
of an irrational root from its rounded coordinates. Existing exact endpoint
no-ops preserve original endpoint bytes instead of snapping to p.

|Outcome|Required meaning|
|---|---|
|certified finite points|Complete support census, both finite domains and all occurrence/error facts proved; edit eligibility separate.|
|certified intervals|Exact common support plus complete finite intersection; no implicit isolated trim choice.|
|certified finite empty|Complete positive separation/exclusion proof, completed compatible raw query.|
|uncertain|Unfinished/mismatched Native census; unresolved conditioning/basis/Arc/domain/branch/root matching. No actionable IDs.|
|unsupported|Actual source type/generator/cohort/domain policy not admitted; never disjoint.|
|resource failure|Exact work/bit/output bounds exceeded; no truncated certificate.|
|stale/terminal|Original job/source changed or invocation/input/cleanup failed; existing authority/retirement error wins, no geometric conclusion.|

The first general strong domain includes arbitrary translated nondegenerate
Segments/Circles, transversal crossings, exact rational tangencies/endpoints,
exact parallel/coincident supports and the explicitly authenticated Arc family.
It is not restricted by recipe grouping, fixed orientation, nominal dimensions,
integer coordinates or a fixed separation epsilon. The following remain required
ordinary closure, not waived by advertising that first domain:

- numerically admitted Arc endpoints not exactly incident on represented r;
  require a separately approved source-to-analytic deviation/branch contract;
- full-turn/near-full/near-zero Arc intent and the inherited1e-6 display heuristic;
- ill-conditioned or subnormal/large cases whose actual Native candidates cannot
  be completely bracketed, separated, domain-classified or published accurately;
- library epsilon branches that disagree with exact source topology (must remain
  explicit uncertainty until mature-library/numerical support is extended);
- finite endpoint trim versus middle split, Circle→Arc and Arc endpoint mutation;
  those require their own stable-ID/constraint/reference mapping, not query proof;
- richer curves and noncoplanar projection, and actual shared profile consumers.

Before implementation Root must approve the Arc intent gate, certificate resource
policy, native-point-only publication/error rule and explicit ray-domain union.
Suggested source leaves are NEW pure `finiteCurveCertificateArithmetic.mjs` and
Worker `finiteCurveFiniteCertificate.mjs` plus strict result declarations; no
existing Native solver/codec/public schema or common graph is changed by this
plan. Exact current-source preparation is still a dependency, not an input flag.

One eventual complete public corpus must exercise all pair orders, translated
general Segments, Circle roots at(3,±4) from radius5 centers(0,0)/(6,0), genuine
tangent and10±1e-6 source separation, exact endpoints, minor/major/seam Arcs and
Pythagorean directions, overlap intervals and honest uncertainty. Include a
Segment from(0,0)to(2,0) extended at b toward Circle center(5,0),radius1: BOTH
forward candidates4 and6 must be visible and explicitly chosen, never nearest.
Then actual shared endpoint edit, all-state refusal/travel, source edit/stale
capability rejection and normal .cad lifecycle with independent artifacts.
No seeded successful source, manufactured result or new execution is part of
this BEFORE packet; the wider approved whole remains required.
