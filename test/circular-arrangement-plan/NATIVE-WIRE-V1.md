# Two-circle Native/source wire v1 — proposed schema freeze

Source/schema only on main d82b3c1. No implementation success, compilation,
tests, probes or browser execution. This precedes the new Native header and
Worker implementation. Existing Native pair, V2/V3 ABI, default and authored
selected-feature parameters remain unchanged. Root owns later coherent Native
build, exact pair/cohort and actual qualification.

## FFI and ownership

Exactly TWO proposed new exports:

```
int ReadCircularArrangementV1(const double* values, int count);
int CreateOwnedCircularCellV1(const char* resultName,
                             const double* values, int count,
                             double depth, int cellMask);
```

Input is exactly19 Float64 values (152 bytes):
`[1,originXYZ,xXYZ,yXYZ,zXYZ,c0x,c0y,r0,c1x,c1y,r1]`.
Slots0/1 bind in the Worker to actual source Circle IDs in canonical ID order.
No Native slots, numeric geometry or handles become saved selection identity.
Worker authority is the genuine solved source/frame/digest and exact current
document/feature/build, not a caller-supplied trusted flag.

Validate integer pointer/range/alignment/count BEFORE dereference, using heap
size subtraction to avoid overflow. Capture152 bytes once into a local immutable
array. All values finite; existing right-handed basis qualification1e-12;
origin/local coordinates≤1e6, radii in existing Native `(0.0001,1e6]`, derived
world geometry≤4e6. Create depth `(0,1e6]`. Mask is1(A-only),2(B-only),3(A∩B)
and must denote an actual positive-area cell. Bounded resultName admission must
preserve ANY existing DBRep name, not just another owned name.

Read publishes0 persistent names. Create builds local circle faces/cells then
uses the genuine prism builder and publishes exactly1 final owned valid positive
single solid. No dummy prism, temporary DBRep names or external source handles.
Reuse non-destructive OCCT Common/Cut/Splitter/history with local fuzzy0/no glue,
no simplification/parallel callback or global tolerance/settings change. Exact
local input BRep/tolerances and retained global names/catalog/settings survive.

Return0 means exact success JSON was published. Negative statuses remain
unambiguous even if JSON publication fails: -1 CIRCULAR_INVALID_REQUEST,
-2 CIRCULAR_UNSUPPORTED_RELATION, -3 CIRCULAR_GEOMETRY_UNQUALIFIED,
-4 CIRCULAR_CONSTRUCTION_FAILED, -5 CIRCULAR_PROVENANCE_UNRESOLVED,
-6 CIRCULAR_RESOURCE_LIMIT, -7 CIRCULAR_INPUT_CHANGED (fatal, overrides others),
-8 CIRCULAR_NAME_COLLISION, -9 CIRCULAR_PUBLICATION_FAILED,
-10 CIRCULAR_ALLOCATION_FAILED, -11 CIRCULAR_BUSY,
-12 MEASUREMENT_PRECISION_UNRESOLVED (existing checked mass meaning).
When deliverable, error JSON is exactly `{version:1,error:CODE}`. A private
synchronous call guard rejects callback reentrancy without overwriting the
outer exchange. No retries. Compare input/name bytes after callbacks. Prepare
receipt/string before insertion; failed insertion/publication/input preservation
retires ONLY this call's new allocation under its captured name. Caller must
check both returned status and fresh exact exchange value, never stale JSON.

## Exact represented relation versus Native construction residual

Relation enum: `disjoint`, `external-tangent`, `proper-overlap`, `nested-0`,
`nested-1`, `coincident`, `internal-tangent`. No proximity band. Compare squared
center distance with squared radius sum/difference using exact represented
binary64 arithmetic, including differences BEFORE rounding. Proposed bounded
helper: IEEE754 mantissa/exponent decomposition and signed product accumulation
in fixed80×32-bit dyadic limbs. The stated finite domain, including subnormals,
fits that constant bound; no external arithmetic library/new geometry engine.
Root reviews this scalar helper before compilation. Signed zero is mathematical
zero. Internal tangency is explicitly recognized/unsupported, not misclassified.
Proper overlap, external tangent and coincidence are required positive domains.

Bound justification: base unit is2^-2148 (smallest product of represented
subnormals). Each coordinate/radius is≤1e6<2^20, so product magnitude<2^40;
the expanded distance-versus-sum/difference expression has9 products with
coefficients at most2 and needs fewer than2196 magnitude bits.80×32=2560 bits
therefore leaves explicit carry headroom. Mantissa multiplication uses bounded
32-bit limbs and64-bit carries, not compiler-dependent128-bit arithmetic. Any
unexpected overflow is a typed refusal, never wraparound or floating fallback.

NEW separately named proposal `CIRCULAR_SUPPORT_INCIDENCE_MM=1e-9`: actual curve
supports/endpoints and events satisfy original source circles/plane within that
bound; unit direction/plane alignment uses1e-12. These are construction
qualification, not topology welding or50pm surface certification. No source
coordinate/radius/branch or Native tolerance is clamped. Unqualified geometry
refuses before publication; analytic area never substitutes Native metrics.

## Internal read JSON — Worker only, aggregate≤64KiB UTF8

Exact success:
`{version:1,unit:'millimeter',scope:'response-local',relation,sourceCount:2,
events,spans,cells}`.

`events`:0..2 records
`{branch:'left'|'right'|'tangent',point:[u,v],owners:[0,1]}`. Left/right is the
sign about center0→center1 in canonical source ID order. Coordinates must satisfy
both original equations and their branch. No nearest/ordinal identity. Tangency
may be an analytic support contact without a shared Native vertex: do not claim
a topological vertex unless actual topology establishes one. Coincidence has no
fabricated intersection events.

`spans`:1..8 records
`{owners:[slot...],range:'full'|'inside-other'|'outside-other',
ends:[branch...],fragments:[fragment...]}`. Owners sorted unique0/1; full circle
has empty ends, trimmed span has both proper-intersection branches. Coincident
full support has BOTH owners. Complete interval census covers each ordinary
source circle exactly once, including duplicate ownership. No dropped source
curve or synthetic full-circle pair of endpoints.

`fragment` exact fields:
`{center:[u,v],a:[u,v],b:[u,v],first,last,orientation}` for ACTUAL Native
`p(t)=center+a*cos(t)+b*sin(t)` on the original parameter interval; orientation
FORWARD/REVERSED. Retain support phase/location, long arc and actual seam
fragmentation. Never assume Native parameter equals source phase, shorten,
sample or silently merge topological edges. Max2 fragments/span,16 total;
first/last finite ordered interval of length≤2π, vectors finite domain-qualified.
Apply actual TopLoc before projection into the source-local orthonormal frame.

`cells`:1..3 records
`{mask,area,bounds:{min:[u,v],max:[u,v]},outer:[use...],holes:[[use...],...]}`.
Use is `{span:slot,orientation}`, a bounded response-local slot only. Loop≤8
uses, holes≤1 for a strict annulus. OuterCCW/holesCW in source basis with actual
fragment/use traversal. Native observed faces/wires, not approximating polygons.
Positive area and complete directed interval/union/source coverage must also
match independent source equations. Enumeration order is not persistent ID.
Local area is diagnostic Native measurement, not another authoritative quantity.

## Create result / actual membership

Exact success:
`{version:1,valid:true,solidCount:1,nativeVolume,nativeBounds,
constructionProvenance}`. Metrics use existing checked adaptive mass and actual
bounds. Provenance carries validated source relation/cell/interval records plus
actual prism caps and source edge/vertex→swept descendants. Complete provenance
required; unavailable/ambiguous builder history fails before owned publication.
Source ownership uses actual builder membership and non-destructive history,
then analytic support qualification, not support proximity as ancestry.

Native indices stay private. A semantic span with multiple descendants is
explicitly unresolved for selection; do not coalesce Native edges/faces to make
it unique. Generated seams are not original authored curves. Cap names come
only from actual prism membership, never face count/order. Native graph records
must have exact versioned schema/field and aggregate bounds as above; the
existing profile-prism graph is reused only where its actual source slots apply.

The EXACT new provenance shape is
`{version:1,scope:'response-local',persistentIds:false,relation,mask,
profile:READ_RECORD,caps:{firstFace,lastFace},fragments:FRAGMENTS,
resultCounts:{edges,faces,vertices}}`.
Each FRAGMENTS record is exact
`{span,fragment,firstEdge,lastEdge,sweptFace}` and maps one actual selected face
boundary edge through the real prism builder. Max16 records, unique Native
membership with caps/sides checked against the actual current result catalog.
Private1-based topology indices never persist or reach the registry. All Native
faces must be accounted by actual membership, without a fixed face-count oracle.
Vertices/connectors not given unique authored meaning remain explicitly unclaimed
in the translated selection plan, rather than invented intersection/seam IDs.
The old profilePrismProvenanceV1 helper requires either a full-circle edge or
straight polygon≥3vertices; it CANNOT be called unchanged for two-arc cells.
Use a new circular helper and leave that old contract untouched.

## Worker semantic translation / saved identity

New circular descriptor version3: kind `two-circle-arrangement-cell`, canonical
actual circle IDs, covering source set, canonical directed outer/hole refs and
complete source interval/contact census. Full ref retains all owner IDs; trimmed
ref retains owners, inside/outside selector and branch endpoints. Hash keys
derive ONLY from those source-event semantics, never parameters/coordinates,
Native slots/indices, enumeration or samples. Canonical loop rotation preserves
direction; reversal must explicitly reverse uses. Large validation/hash stays
Workers. Public region metadata≤64KiB, opaque regionID≤8192/sourceID≤256.

Keep existing whole-circle nested/disjoint region IDs when eligible. A vanished
lens/span is STALE_REGION/UNRESOLVED_SELECTION, not a nearest arc/disk retarget.
Actual current source/digest/build is rebound on every discovery/replay. Saved
selected nine-key semantic intent stays unchanged; no solved events/intervals
or new authored Circle reversal field. Authored Arc support is NOT broadened.

Proposed new explicit circularArrangementVersion1 cohort admits a separate
`solid.profile.extrude` version4 circular-cell request alongside untouched V2/V3.
Old builds refuse new descriptors before allocation. Worker recreates Native
read/create from the SAME captured19 values and explicit mask, verifies complete
source bindings/original equations, then returns ordinary owned ShapeResult.
No second graph or source mutation. A new Native read does not preserve a handle
or solved cache between calls;0 persistent discovery names and1 create output.

Native ownership: NEW shape-io/ownedCircularArrangementV1.hpp and a narrow
shape-io/main.cpp include+two exports on a separate branch/worktree from qualified
2f10f1e1 Shell source. Existing Native headers/algorithms remain unchanged.
Core owns NEW circular descriptor/planner/provenance adapter plus exact source
extraction/request captures. Coordinate common Worker/controller/ledger/selected
region admission splices before editing them. Root owns catalog/factory/stager/
Native pair/build pins and final composed build. Craft/sourceFrame/Apply,
curve/constraint registry, PM/archive/Files stay reserved. Public whole workflow
and independent source/lens/material oracle from CONTRACT.md remain required;
no delegated per-step compilation/tests/probes.
