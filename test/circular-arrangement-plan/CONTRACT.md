# C02 finite circular arrangement — source inventory and proposed contract

Docs only, based on candidate `eff8af0` (main includes `c365`), while root owns
the unchanged native attachment R2 run. No product edits, execution, tests,
build, WASM compilation, probes, UI or service changes. This is a proposal for
approval, not circular-arrangement capability or geometry qualification.

## Current source and exact boundary of reuse

| Seam | Actual current behavior |
| --- | --- |
| `modules/engine/extrusion/selectedSketchProfile.mjs` | Reads genuine solved v3 source/frame/digest; ordinary Segment and full Circle only. Construction entities and Points have explicit non-boundary treatment; an ordinary Arc or unknown ordinary curve refuses the whole source. V3 extrusion alone may classify isolated open chains. Depth-free consumers retain stricter closed-boundary rules. |
| `modules/workbenches/modeler/features/extrude/authoredRegions.mjs` | Derives membership cells from stable whole-curve outer/hole IDs and nesting. It does not split circles or solve intersection events. |
| `modules/engine/mount/polygonProfilePlan.mjs` | Supports full circles and simple segment polygons; circle-circle relation is strict containment/separation using the existing `0.0001 mm` provider clearance. Intersecting, tangent, coincident or too-close relationships are ambiguous/refused, not arrangements. |
| `selectedRegionDescriptor.mjs` | Captures the whole-source census, actual curve IDs and opaque region descriptors. Whole-circle nested/disjoint cells use complete authored curve membership. |
| `rectangularArrangement.mjs` + `selectedArrangementDescriptor.mjs` | Exact finite TWO axis-aligned rectangle proper-overlap arrangement. Version2 descriptor is specifically `axis-rectangle-arrangement-cell`; boundaries are straight source spans with two distinct incidence events, up to2 owners, no holes. This is not a generic curved arrangement contract. |
| `modules/engine/mount/selectedProfilePlan.mjs` | V2/V3 capture only `segment` or `circle`; a loop is one full Circle or ordered straight segments. No trimmed-arc payload. Existing boundaryProvenance admits only the strict rectangle arrangement contract. |
| `polygonProfilePlan.mjs` Native values | V3 depth/frame/loops plus tag1 full circle `(cx,cy,r)` or tag2 polygon vertex list. Depth-free face values use the same geometry tags without depth. |
| Native `shape-io/selectedProfileV2.hpp` | `buildPlanarFace` makes tag1 full `gp_Circ` edge or tag0 rectangle/tag2 polygon; no arc kind/trim interval. `_CreateSelectedProfileV3` returns actual builder provenance and one owned prism. `_CreateSelectedProfileV2` behavior remains separately bounded. |
| `arrangedPrismSelectionIndex.mjs` | Joins actual Native constructor membership to rectangle-derived source-span refs. A derived span is never relabeled an original whole source curve. Native indices stay private. |
| `selectedProfileRegionCommands.ts` + `selectedProfileSourceDimensionCommands.ts` | Existing explicit same-feature reselection and literal driving-dimension/source+region atomic repair, captured source digest/revision, independent preparation, full descendant replay and one journal. No automatic fallback selection. |

Source evidence also includes `test/rectangle-arrangement-public/evidence-r2`:
the scoped rectangle workflow passed159 rows/six native files, while tangent
circle and coincident-loop sources remain explicit refusals. That proof does
not qualify circular cells. Existing E05 three nested circles remains a distinct
positive whole-circle nesting workflow; it must not be replaced gratuitously.

The reviewed Native source is on R730 at
`/mnt/data10tb/codi-occ-owned-shell-20261107/shape-io/selectedProfileV2.hpp`;
current checkout tip `2f10f1e1ee04bd0a81ad828404511287f590fdec`, last change to
that header `0c638b352620cc57cad913384eb64638814d7ac0`. Reading it is not a new
binary/source equivalence qualification. The currently staged Shell Native
pair remains unchanged by this plan.

## Finite required domain and explicit source semantics

First new domain: exactly TWO distinct-ID ordinary full Circle objects in one
genuine current source, no silently omitted ordinary curves. Preserve all
original objects, IDs, constraints, source ordering, local frame and solver
admissions; no rewrite into authored Arcs or polygons. Complete source census
reports every circle and every interval/contact owner. Points/construction
objects retain their explicit existing census roles. Mixed ordinary Segment/
Arc sources remain a truthful whole-source refusal until separately supported.

Circle has no public reversed-traversal field. Its support is full-circle
geometry, not user-directed winding proof. Derived arc uses must carry their
actual interval and traversal; never choose the shorter arc implicitly. The
existing authored Arc `a/b/c` CCW/full-sweep branch is a different contract and
is not made supported merely because new Native cell boundaries contain arcs.

All required positive cases must eventually succeed through actual public
source→discovery→explicit selected-cell construction, not be closed by an
unsupported declaration:

| Case | Independent cell truth and required policy |
| --- | --- |
| Proper overlap: r5 centers `(0,0)` and `(6,0)` | Exactly3 bounded positive-area cells: A-only, B-only and A∩B. Lens area `L=50 acos(3/5)-24`; crescent areas `25π-L` each. Intersections `(3,±4)`. No fourth sliver/unbounded face. |
| Strict nested/disjoint circles | Preserve the existing whole-circle region IDs and supported nesting path when its contract applies. Existing r15/10/5 source gives outer125π annulus, middle75π annulus, inner25π disk; source selection remains explicit. |
| External tangent: r5 centers0 and10 | Exactly2 bounded disks, each25π; one shared source contact and no positive-area lens. Separate bodies allowed; no claim their union is a manifold single solid. |
| Coincident full circles: same center/radius, distinct actual IDs | Exactly1 disk25π with explicit duplicate boundary ownership by BOTH source IDs; not two coincident solids or a discarded source curve. |
| Distance10±1e-6 and separated gap1e-3/1e-8 | Source relation must retain the actual represented distinction, never snap/weld into tangency. Geometry resolution/admission is separate; any unqualified tiny-cell result stays an explicit outstanding qualification, not a false topology classification or completed positive row. |

Internal tangency/pinched annuli, more than2 intersecting circles, arbitrary Arc
arrangements, mixed curved/polygon crossings and general Boolean arrangements
are outside this first finite implementation. Report them, rather than infer
support from the two-circle marker. Polygon shared-edge/full-edge-touch/
collinear-zero-area obligations in C02 remain distinct; this task cannot close
them by adding a circular algorithm.

## Proposed authoritative geometry/identity split

Keep ONE existing saved selected feature with its current semantic parameters
`version/unit/engine/engineRevision/featureId/faceId/regionId/depth/bodyPolicy`.
No persisted solved intersections, sampled points, Native handles/indices or
coordinate-derived IDs. Region IDs remain opaque discovery results. Physical
source edits preserve the same feature ID and exact backend revision.

Use a NEW versioned circular descriptor (not a relaxed rectangle descriptor):
`kind:'two-circle-arrangement-cell'`, source circle IDs, covering membership,
canonical directed boundary uses, explicit complete-circle versus trimmed-arc
refs, and complete source/contact/interval census. Limits:2 circles, at most2
geometric intersection events, at most8 canonical analytic span records and3
bounded cells; proposed metadata aggregate≤64KiB, region ID≤8192, real source
curve ID≤256. Final constants/schema require review before code.

The rectangle event key `incidentCurveIds:[A,B]` is insufficient: both circle
intersections have that same incidence. New events need an independently
validated branch discriminator, e.g. left/right of the oriented center line
ordered by canonical source IDs, with separate tangent/coincident cases. No
coordinate hashing, arbitrary Native enumeration or nearest-event retargeting.
Span refs retain all owners plus ordered event/branch/cyclic interval identity;
full-circle refs need no fabricated pair of distinct endpoints. Parameters and
world coordinates are transient numerical witnesses, not saved identity.

Topology classification must distinguish exact represented coincidence/contact
from separated/overlapping inputs without a universal proximity epsilon.
Native construction tolerance and curve intersection residuals are separate
admission facts. If Native cannot substantiate the classified cell, refuse
before publication; do not normalize source or manufacture a matching result.
Existing clearance is not permission to weld, and50pm is not a new topology
threshold. Original source-circle equations must independently validate event
coordinates/interval endpoints and full interval coverage.

## Native extension versus existing Native reuse

The CURRENT V3 ABI cannot encode a lens/crescent: both require trimmed circular
arcs. Approximating them as polygons, silently using solid Boolean outputs as
source regions, or relabeling generated edges as whole circles is invalid.
Existing owned Boolean API can make solid common/cuts, but alone lacks this
selected planar cell/interval ownership contract and therefore does not close
the public selected-region workflow.

Smallest recommended Native slice: bounded two-circle planar face preparation
using existing OCCT face/Common/Cut or Splitter/history facilities, followed by
the existing prism builder. New versioned Native discover/read and owned-create
bindings accept only the genuine numeric two-circle source/frame plus explicit
cell membership; produce actual analytic circle/trim intervals and original
edge→cell descendant ownership. Do not implement a second general arrangement
engine or manual approximate wire algorithm. New create publishes exactly one
owned final solid; local input faces/cells have no persistent DBRep names.
Rollback/name collision/source/settings preservation follows existing owned
constructors. Discover/read publishes0 persistent results. A same-pair Native
result and its history must be corroborated against independent source equations.

Reviewed installed OCCT7.6 SDK under
`/mnt/data10tb/codi-occ-four-corner-clean-20261104/build` has actual TKBO/TKBool/
TKGeomAlgo archives and forwarding headers for `BRepAlgoAPI_Splitter`,
`BOPAlgo_Splitter`, `Geom2dAPI_InterCurveCurve`; real source headers are under
`/mnt/data10tb/codi-occ-four-corner-source-20261104/occt/src/`. Existing
`ownedBooleanHistoryV1.hpp` uses non-destructive Common/Cut/Fuse with history.
Splitter supports history/safe processing, but this is API availability, NOT a
qualified new binding. `Geom2dAPI_InterCurveCurve` explicitly has tolerance-defined
tangent segments and default1e-6; those defaults cannot decide exact source
contact/coincidence or be imported as a silent weld policy.

Proposed mount addition: explicit `circularArrangementVersion:1` and a separately
versioned `solid.profile.extrude` circular-cell input descriptor (e.g.version4),
alongside unchanged ordinary V2/V3. Keep selectedProfileVersion3 for its existing
ordinary path; do not globally reinterpret every V3 region. New Native pair and
exact closed assets/factory admission required; existing saved build cannot
silently convert or fall back. Existing profile operation/saved nine parameters
need no duplicated solved representation; Worker replay dispatches by the real
validated descriptor and exact declared build capability.

## Proposed ownership and full workflow, pending approval

New bounded Native header/probe/contract and explicit FFI exports; new circular
descriptor/planner/selection-index modules. Narrow existing source extraction,
region descriptor capture, selected-profile request preparation, constructor
slot provenance join and Worker/controller dispatch. Root separately owns exact
new catalog/factory/stager/bootstrap closure and normal composed build. Existing
shared source-dimension/region repair/journal/public APIs are reused, with only
reviewed exact descriptor capability admission where necessary. No PM/archive/
Files/AI/UI changes, second document, second history or global guard removal.

One complete actual public workflow after coherent source: create two actual
Circles and driving diameter constraints through genuine commands; discover
three proper-overlap cells; explicitly create lens and both crescents as
separate bodies; verify Native volumes/bounds/material/void and source coverage.
Edit a discovered diameter while overlap remains, retaining feature/source IDs;
mix source/region/depth/creation UndoRedo. Attempt a source edit destroying the
selected lens: reject with exact last-valid source/J/material/resources intact,
then use existing explicit atomic literal source+region repair to a discovered
surviving cell. No silent A-only↔disk/lens retarget. Stale region/revision,
ambiguous ownership and unknown source curves refuse without allocation.

Include separate genuine tangent/coincident and retained nested setups, source
edits away/back across each branch with explicit new-region selection where
identity changes, normal `.cad` Save/server sync/fresh Open/reedit/resave and
independent archived source/descriptor proof. Add compatible/incompatible child
selection cases; a lost/merged arc reference is unresolved, never nearest edge.

Existing public operations are concrete: `create-empty-sketch-plane`,
`append-sketch-primitive` with actual Circle data, `inspect-closed-sketch`,
`apply-closed-sketch-diameter`, `edit-closed-sketch-dimension`,
`edit-closed-sketch-points`, `inspect-selected-regions`, `create-selected-extrusion`,
`inspect-selected-profile-region-choices`, `edit-selected-profile-region`,
`inspect-selected-profile-source-dimension-regions`,
`edit-selected-profile-source-dimension-region`, `travel-authored-edit`,
`classify-worker-solid-points`, normal `save`/`open-project`. These exist already;
their current circular-arrangement refusal needs the reviewed source/Native
capability, not a private authoring endpoint. Target/constraint/region IDs come
from actual current receipts/discovery. Primitive creation alone establishes
neither solved validity nor Native cell support.
All heavy source solve/hash/arrangement/Native work remains Workers; main accepts
only bounded metadata. Currentness binds document/source/frame/feature/build;
cancel/failed Native work disposes one candidate and preserves accepted state.

Standalone AFTER-wholeflow oracle: `L` above, union area `50π-L`, each source
coverage25π, lens bounds `[1,-4]..[5,4]`, A-only `[-5,-5]..[3,5]`, B-only
`[3,-5]..[11,5]` before extrusion; independent circle membership at actual queried
points, analytic arc extrema and actual orientation/frame/depth. Check complete
source owner/interval census, preserved original IDs/formulas, actual saved
Opaque selectors, source+J chronology, units and all output artifacts. No mesh
approximation or agreeing-engine result is dimension truth. Native adaptation,
exact preservation/resource/component controls and the eventual public whole
workflow are all OPEN until implemented and actually qualified.
