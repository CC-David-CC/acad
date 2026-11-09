# Finite curve binding: Root source decisions

2026-11-09. Implements the small reuse-first direction; not runtime qualification.
Reviewed BEFORE contract `8a16108` (peer source0cd5ec7), and L1 inventory41f7189.
The complete goal remains shared, editable, persistent trim/extend and subsequent
general profile/projection/offset workflows. A raw library query is an initial
binding component, not a substitute completion criterion.

## Approved first source packet

1. Use the existing pinned OCCT7.6 `IntAna2d_AnaIntersection` for analytic
   Segment/Circle/finite CCW Arc supports. No second framework or alternate
   document. Geom2dAPI may later serve richer curves through the same domain
   interface, but no per-event automatic fallback. A tolerance-close band is
   never an exact overlap.
2. Preserve the proposed Segment length parameter, canonical Circle angular seam
   and original Arc CCW lift/endpoints. Native observes the actual normalized
   basis it constructed. Neither that basis nor residuals become new authored
   coordinates. Native raw algorithm flags are facts, not certified contact,
   multiplicity, finite membership, disjointness or actionable trim events.
3. First implement the small Native support-query component plus typed transport
   capture sources. Root will splice common exports/controller/OCI/descriptors
   and compile an explicit new cohort after review. No existing pair/default
   relabeling. No read that fabricates a body/feature/region just to obtain a mount.
4. The public source-only read remains `inspect-closed-sketch-intersections`,
   prepared from a real captured Craft source job, with two independently
   checked original-request Worker extractions. The semantic Worker issues
   private preparation; a dedicated query helper uses the genuine existing
   discard-only observation owner to obtain and retire the mount. Main does no
   solve, geometry or hash. Do not route it through a fake solidLedger result.
5. Keep source/document/manager/host/expression/frame currentness guards and actual
   explicit query engine revision. Querying another document's chosen kernel is
   not an implicit backend switch. Unsupported cohorts return explicit unsupported.

## Frozen initial native wire

`ReadFiniteCurveIntersectionsV1(const double* values, int count)`, temporary copied
analytic objects only; no named-shape DB insertion or result shape reservation.

Four exact integer-valued double header slots:
`[version=1,curveCount=2,recordLengthA,recordLengthB]`, then exactly two records:

- Segment: `[tag=1,ax,ay,bx,by]` (length5).
- Circle: `[tag=2,cx,cy,radius]` (length4).
- Arc: `[tag=3,ax,ay,bx,by,cx,cy,radius,startRadians,endRadians]` (length10).

The actual legal maximum is24 doubles. Reject extra fields, inconsistent counts,
nonfinite values, zero Segment length, nonpositive radius and invalid finite Arc
branch. Retain the existing eligible source envelope; no new source minimum
radius or tolerance is invented. Arithmetic/normalization that cannot faithfully
represent the supplied geometry is an explicit unsupported/uncertain outcome.
The reserved transport capacity remains64 doubles, not permission for trailing
input; private input stays within512bytes.

Raw response has version1, a fixed analytic-support-query kind, algorithm identity,
actual input bit patterns (16-hex IEEE754 words in original order), actual
constructed basis/domain facts, IsDone/IsEmpty/IdenticalElements and every bounded
library point/parameter result. At most8 raw points and64KiB response; excess is
RESOURCE_LIMIT without truncation. No actionable event IDs, inferred overlap
intervals, fabricated tangency or silent root merging in this raw response.
Use existing bounded JSON/capture/publisher conventions; precise key roster is
to be documented alongside source before Root controller wiring.

Use fc1654 staged-capture/publication/RAII fences. Capture/check actual input
memory before and after invocation/publication; echo original bits, including
signed zero where admitted, without using signed zero as identity. All read
allocations and exchanges have explicit ownership. Caught success/error delivery
and postcallback checks apply on every path. Unknown dispatch/cleanup/input
preservation stays terminal; do not translate it into disjointness or a domain
refusal. No new callback API, arbitrary execution entry or result-name mutation.

## Certification and authored transitions remain required

Worker qualification must distinguish raw library output from certified finite
events. Reuse existing exact dyadic predicates for original-support equality and
collinearity. Root approves exact predicates, finite-domain/periodic membership,
root completeness and conditioning/error bounds as one subsequent coherent
packet; no universal epsilon or residual-only certificate is approved here.

Retain50pm as the existing upper source-publication fidelity requirement, not an
intersection-algorithm accuracy claim. Any unresolved classification returns
uncertain with no actionable event IDs. An available/disjoint or overlap result
needs positive evidence for that conclusion. Query IDs remain response-local,
private and invalidated by source/lifetime changes; never saved as geometry.

Atomic trim/extend then consumes that original query/source and publishes via the
existing source-byte J/full-suffix transaction, preserving unaffected entities,
constraints, generators and stable authored outputs. No remove/append interim
publication, swallowed dependency failure or generic nearest-reference repair.
Save/Open must reproduce authored operations, not cached query answers.

This staging lets the library binding be implemented promptly while keeping
certification and history requirements explicit. It does not reduce Gate1 to a
query demonstration or move required correctness into an unspecified future gate.

Root alone composes common files and executes the eventual complete workflow.
Source agents use isolated branches/new leaves; no frozen runtime/test execution,
old evidence edits, automatic tolerance changes or production default switch.
