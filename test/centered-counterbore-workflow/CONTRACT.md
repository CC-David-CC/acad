# Finite semantic centered counterbore — implementation design

**DESIGN ONLY; not implemented or runtime-qualified.** Source baseline
`0e7e1183b98db1cef2a8bff57a117b44f11c09a9`, the frozen blind-hole packet.
That packet itself awaits root review/qualification. No product edits, probes,
TSC, builds, Native calls or browser execution accompany this document. This
neither changes existing exercise signoffs nor closes the remaining C06 backlog.

## Authored domain and exact mathematics

One unplaced genuine `WORKER_SELECTED_PROFILE_EXTRUDE_V2` constructor, retained
independent four-Segment rectangular source/region, positive thickness T, actual
unique current last-cap entry and one exact explicitly selected OCC cohort.
The initial producer is the source constructor itself. Descendant/placed,
nonrectangular, multi-solid or ambiguous targets refuse before publication.
Source frame F=(O,x,y,z), original curve identities, region and current native
cap ancestry establish top; global Z, AABB, display mesh or caller pose do not.
Current centering is the rectangle's source-local midranges, recomputed after
supported source edits. No private tool becomes authored sketch/history data.

Let r=throughDiameter/2, R=stepDiameter/2 and h=stepDepth. The finite domain is
`0 < throughDiameter < stepDiameter`, `0 < h < T`, all finite bounded lengths.
Both circular supports must satisfy the existing polygon provider's actual
strict-containment/clearance policy. There is no equal-diameter simplification,
through/blind conversion, clipping, minimum shoulder invented from an epsilon,
nearest selection or standards-library inference. Exact represented comparison
and subsequent Native resolvability are separate questions: very thin positive
annuli or floors which cannot be qualified refuse honestly.

The small bore is explicitly THROUGH the original thickness. The large step is
explicitly h from current actual top: shoulder level s=T-h. Parent T20→25 keeps
h unchanged and moves the shoulder from20-h to25-h. The intended removed set is

```
{0 <= z <= T, rho < r} union {T-h < z <= T, rho < R}
removedVolume = pi*r*r*T + pi*(R*R-r*r)*h
```

Here z/rho are relative to the actual source datum/center, not saved world
coordinates. The shoulder is the genuine annulus at z=s with r<rho<R; center
rho<r remains void below and above it. There is no flat disk floor. A single
blind-floor witness or existing full-height single-cylinder THRU witness is
insufficient for this shape.

Proposed exact saved type `WORKER_CENTERED_COUNTERBORE_V1`, fifteen own bounded
fields, detached/immutable capture, existing canonical positive-safe IDs:

```js
{version:1,unit:'millimeter',engine:'occ',engineRevision,
 featureId,target,producerFeatureId,sourceFeatureId,
 sourceFaceId,sourceRegionId,entryFaceId,
 kind:'centered-counterbore-flat',throughDiameter,stepDiameter,stepDepth}
```

`producerFeatureId===sourceFeatureId` identifies the earlier live selected
constructor; target is its normal body ID. A fresh feature ID differs from it.
entryFaceId is an actual discovered opaque last-cap selection, never parsed or
assembled. No frames, tool names, floor coordinates, Native indices, cached
measures, proof flags or second parameter document persist. Numeric literals
and existing named length bindings use the current authoritative typed facade;
only materialized numeric values enter Native. All three fields retain their
raw names across inspection, numeric-erasure refusal, replay/travel and Open.
No reserved-name workaround for literal engine/unit/source strings.

## Existing Native ingredients; no new primitive or ABI

The reviewed primary manufacturing pair is explicit and unchanged:
JS32eec74e3019d9e2d767c9016f05aa3daa49441c6102423a269d67b9c7f02a08 /
WASMabbf2aa02a6f2101c600aa1eedd20fa80ab2db206e677ca860d9c5103cdfbfcc.
The blind packet's SOURCE.md binds this pair to actual component receipt and
retained Native source0e429519/c15e49df; this design does not infer new runtime
qualification from similar source. Its protected planar-entry addition remains
a dependency until qualified. No new binary, ABI, backend default or quota.

Actual existing ports are `_CreateSelectedProfileV3` (single Circle prism with
real first/last caps and swept-cylinder construction provenance),
`_ApplyOwnedBooleanHistoryV1` (non-destructive subtract with source-copy and
composed original-input A/B ancestry), `_ReadOwnedTopologyV1` (actual analytic
plane/cylinder support, wires/edge occurrences/vertices), `_InspectOwnedSolidV2`
and `_ClassifyOwnedPointV2`. Existing JS `validatePrismProvenance`,
`validateOwnedBooleanResult`, `reconcileNativeSelectionClaims` and
`deriveInheritedSelectionIndexV2` authenticate those actual records. Existing
`nativePlanarAttachmentFacts` rechecks the same owner/source/current cap.
No union, cone primitive, new topology descriptor or general raw-DRAW executor
is required for this finite counterbore. Countersink is a separate obligation.

The proposed construction is TWO sequential cuts, not a union tool whose
history is guessed. All four results have unique monotone privately owned names:

| Native result, exact lifetime cost | Source-derived request / actual purpose |
| --- | --- |
| small Circle tool (1) | F origin O-z, same axes/center, radius r, depth T+2: actual represented endpoints must strictly overrun both source caps using existing1mm margin. |
| first subtract (1) | Original constructor minus small tool; expected removal pi*r²*T, actual unique full-through small cylinder and real closed-loop top/bottom openings. |
| large Circle tool (1) | F origin O+(T-h)z, radius R, depth h+1: interior first cap and positive top overrun, no lower overrun or negative extrusion. |
| final subtract (1) | Actual first result minus large tool; ADDITIONAL removal pi*(R²-r²)*h, never pi*R²*h (the center was already void). |

All tool endpoints must be finite/represented, depth<=1e6 and actual circle
requests satisfy existing V3 constraints. The existing internal volume
resolution guard is reused separately for each actual removed increment:
max(128*EPS*max(abs(Vbefore),abs(Vafter)), expectedRemoval*1e-8), with below8×
resolution refused. It is not an analytic substitution or50pm certificate.
Final Native volume, validity, positive single-solid and unchanged source outer
bounds independently corroborate the complete removal expression.

## Genuine stepped-wall and annular-shoulder proof

NEW private `counterboreFacts` must join actual invocation/provenance/ancestry
records. No saved Native slots or public certificate may supply authority.

1. Bind the actual small tool's swept cylinder through first-cut B ancestry.
   Check its support, source center/axis/radius, actual finite source-cap span
   and ordinary closed rim/seam occurrences before releasing that tool.
2. Bind that SAME first-result cylinder through final-cut A ancestry, requiring
   one unique surviving same/modified actual cylindrical face. Its radius is r;
   its final actual rims span source bottom0 to shoulder s, not full T.
3. Bind the large tool's swept cylinder through final-cut B ancestry, uniquely.
   Radius R, finite span s toT, distinct actual face from the small cylinder.
4. Bind the large tool's actual first cap through final-cut B ancestry to ONE
   unique analytic planar shoulder, with actual orientation toward+source z.
   It is a trimmed annulus: exactly two ordinary closed circular boundary wires,
   distinct edges centered on the actual common axis at s, radii r andR. The
   inner rim is the actual edge shared with the small cylinder, outer rim the
   actual edge shared with the large cylinder, established by topology indices
   within this SAME result, never nearest matching or public ID grammar.
5. Actual top opening is the large rim atT and bottom opening the small rim at0,
   with real same-edge adjacency to inherited source caps. The two genuine
   cylinders/shoulder cannot be conflated by their supports. Native occurrence
   orientation, effective traversal and valid one-solid shell membership are
   checked; generated/multiple/merged/lost claims outside the finite ordinary
   correspondence policy refuse before publication.
6. Actual Native points corroborate: central small-bore void throughout;
   annulus material below s, shoulder boundary at s, void above; source outer
   material outside R; both actual cylindrical boundaries and both open ends.
   Use resolvable derived probes, refuse unknown/indistinguishable probes rather
   than clamp/snap or invent success.

Reuse explicit finite existing cylinder refusal vocabulary where applicable;
new annular/adjacency failures have their own finite codes. Do not route arbitrary
`DRAWING_*`, resource or ownership failures into geometric qualification. Plane
incidence1e-9mm/alignment1e-12 and inherited cylinder1e-7mm/1e-8direction policies
remain separately named qualification bounds, not50pm Native accuracy. No total
Native face/edge count is prescribed. Independent artifact shell checks may
corroborate the actual through handle; they cannot replace the ancestry proof.

## Ownership, work and transaction lifecycle

One existing evaluation owner/ledger; one authored append/edit event and one
final public body. Intermediate names, tokens, tool profiles, first cut and
private proof never enter the registry, public commands or journal. Public shape
request is numeric saved intent plus current private handle/sourceHandle, op
`solid.holes.counterbore`; ordinary ShapeResult handle/evidence and op union.
Private result binding includes exact numeric intent and work receipt
`{version:1,nativeResults:4,resultTriangles:[small,firstCut,large,final]}`.

Reserve and charge EXACTLY4 lifetime results and all4 real tessellation work
counts before acceptance. Existing max32 lifetime names and100k cumulative
result triangles remain. Parent+these4 consume5 names over this finite replay,
not a new quota. Release small tool after first-cut proof; then create large
tool/final, release first cut and large tool after final proof. At most4 owned
published names coexist for this one-parent sequence (parent, first cut, large
tool, final); Native internal working copies/meshing and physical RAM peak are
NOT bounded or measured by this name census. No performance claim follows.

Reuse the blind follow-up's tracked attempting/owned/releasing/released/unknown
custody policy for all4 calls, exact-name lookup before release and global
baseline reconciliation: final success leaves baseline+1, any ordinary refusal
baseline+0. Unknown/partial release is terminal ENGINE_CLEANUP_FAILED; original
failure retained; never blindly retry/release unrelated names. Lifetime work is
not refunded. Reread original retained parent topology/metrics/source bindings
on both success and refusal; Native source/copy/BRep/tolerance preservation is
the existing primitive contract, not proved merely by a name count. Every
intermediate's source-copy/ancestry snapshots must bind the real calls before
its name retires. Actual first/final metrics and final Inspect/read observations
must describe that exact final shape. Final inherited source selections compose
original→first cut→final actual A ancestry; generated shoulder/walls remain
unclaimed unless a separately reviewed semantic read owns them.

No temporary model/J publication. Exact source/namespace/history/evaluation epoch,
source plane/current cap, build, expression source+result/streams and owner fence
every await and final publication. Cancel/failure preserves accepted last-valid
intent/J/material/drawing/source, with only audited candidate invalidation tokens
where an attempted candidate actually ran. Realm termination revokes module
ownership, not proof that Native finally/Release ran or immediate RAM reclamation.
Material review remains required after actual geometry changes; no metadata
clearing/automatic retarget. Creation Undo restores the constructor; Redo restores
same15fields/IDs/high-water. Numeric dimension edits and typed definition changes
use existing prepared full-suffix replay and shared LIFO history, no second J.

The lifecycle is derived, not a saved flag: captured source → current discovery
→ exact selected reference → prepared candidate → actual Native qualification
→ one atomic publication. A stale/foreign selection refuses; lost/ambiguous
Native continuation cannot silently retarget. A source edit derives a new frame
and tools only inside the current authorized candidate; failure retains the
old accepted source/geometry/J. Undo/Redo and Open reconstruct from exact authored
intent plus current source; validation-only Open/read never heals or writes a
successful cache. No derived radius/depth/frame or tool is a second authority.

## Exact proposed source/consumer ownership

| Existing seam / proposed small addition | Required closure |
| --- | --- |
| NEW ownedCounterboreIntent + authored materializer/declarations | Exact15fields/finite codes; names separate from numeric requests; <=64KiB own-data capture using existing ID/text/length limits. |
| NEW ownedCounterborePlan/counterboreFacts | Source-derived tools and volume increments; actual stepped/annular provenance joins above. Reuse bounded contracts, do not modify old blind/through semantics. |
| OCI/controller/SolidKernel | Separate exact counterbore branch/flag/capture, cost4/work binding, result op, finite recoverable vs terminal failure, source-name/cleanup fences. No Native ABI change. |
| Exact primary MFG catalog/factory/catalogMount/stager | Add counterboreVersion1 and descriptor only this reviewed pair; new leaves in exact graph, all common bootstrap guards repinned together. No default/old Shell/Circular capabilities inherited accidentally. Descriptor: id solid.holes.counterbore, version1, kinds['centered-counterbore-flat'], source selected-rectangle, entry source-last-cap, termination small-through-large-interior-step, nativeResultCost4. |
| Ledger/modeler operation/shared commands | Actual earlier live constructor/same source/region/entry/build, private same-owner handles; consume parent once, publish only final standard MWorkerSolid. Add AUTHORED_SOLID_KINDS and descriptor registration. Actual entry validation repeats in Native owner. |
| Shared J/Craft/budget/source history policies | Existing operation-append plus exact3-field dimension edit/travel; retain all15identity fields, no C07 family widening. Known unsupported history states refuse before allocation. source consumers must retain genuine source and reject foreign/consumed targets. |
| Physical fields/manifest/typed preparation | throughDiameter/stepDiameter/stepDepth length fields ONLY; all other schema strings literal. Reuse accepted expression facade, same current/proposed suffix, actual source bindings and original-request proof. Numeric edit cannot erase bindings. |
| Validation/.cad/current readers | Project validation exact earlier constructor/cap intent; typed values use existing evaluator, actual replay before adoption. Finite structured codes forwarded at authoritative boundary. Point/STEP/manufacturing/drawing read classifiers include this exact integrated family, preserving all read-only/source/build/resource fences. No PM archive-owner/Files change. |
| Drawing/semantic refs | Actual HLR and genuine source/cap thickness dimensions may observe final shape. Current single-cylinder THRU annotation must NOT describe the large counterbore or reduced small wall. Step diameter/depth dimensions are NOT advertised without a new actual stepped-reference witness; not silently reused from blind/through. |
| NEW Desktop counterbore adapter/example | Genuine create/inspect/history/edit via same shared methods, bounded descriptors<=4096, current account/window/document/native signal/scoped settlement, no raw tool recipe. Root owns index splice. |

Proposed public methods: inspect-worker-counterbores/create-worker-counterbore/
inspect-worker-counterbore-history/edit-worker-counterbore. Create uses inspected
revision/body/source/entry IDs plus the3authored lengths, no caller build/frame.
Edit requires actual current index/feature/revision and all3numeric unbound fields;
named edits go through existing public physical definitions/bindings. Numeric
stale/no-op/binding erasure rules match actual current authoring, not a bypass.
Suggested finite new codes: COUNTERBORE_UNSUPPORTED_TARGET, COUNTERBORE_ENTRY_UNRESOLVED,
COUNTERBORE_DIAMETER_ORDER, COUNTERBORE_STEP_NOT_INTERIOR,
COUNTERBORE_OUTSIDE_PROFILE, COUNTERBORE_CYLINDERS_UNQUALIFIED,
COUNTERBORE_SHOULDER_UNQUALIFIED, UNSUPPORTED_COUNTERBORE_BUILD. Existing
INVALID_REQUEST/RESOURCE_LIMIT/Native Boolean/measurement/cleanup code semantics
remain separated. No prefix/message-derived refusal classification.

## ONE complete eventual public workflow and after-whole oracle

Freeze full product/host/source/Native closure and exact producing tuple before
root normal build/fixture/whole execution. No private successful seed/schema
executor. Root alone executes one full packet; first failures stay frozen.

| Stage / actual public transition | Independent required assertion |
| --- | --- |
| New100×50×20 genuine selected rectangle; discover real last cap | Actual source equations/curve IDs/frame, explicit pair and genuine current source-owned entry; metadata eligibility is not Native success. |
| Create smallD4/largeD8/h6 | V=100000-152*pi; shoulder14; actual r2 cylinder0→14 and R4 cylinder14→20, annulus2<rho<4, central void and retained source. Immediate creation Undo/Redo restores exact15fields/IDs/high-water and actual constructor. |
| Edit h8, then smallD6/largeD10 | First V=100000-176*pi with r2/R4/h8; then V=100000-308*pi; shoulder12; all3authored lengths and actual Native intervals/point classes. Mixed shared Undo/Redo restores each real prior state. |
| Parent thickness20→25; supported source width/height edit/revert | Same h8, shoulder17, V=125000-353*pi; center follows actual declared source, not old tool coordinates. Source curve/entry identity preserved where genuinely unique, else precise refusal. Source-edit travel and full suffix validated. |
| Stale/foreign entry, zero/negative, small==large/small>large, h==T/h>T, large outside source | Exact layer/code, original state/J/source/material/resources; no implicit THRU or blind/equal-diameter simplification. Candidate epoch/token changes admitted ONLY by actual provenance; healthy continuation and real Undo/Redo prove chronology after failures. |
| Bind named T/small/large/h, edit definitions, named invalid order/equality, erasure refusal, inch/mm | Raw directed bindings/units preserved, numeric-only Native inputs; existing independent original/cold/captured source proof and Native geometry agree. Exact no-op retains redo/tokens. |
| Material assign, real source-dimension drawing, STEP/core3MF/SVG; first.cad Save/sync/Open | Actual semantic metadata/build/15fields/source preserved; archive CRC/SHA/root entries/browser-server equality; only honest drawing witnesses/labels. Actual read-only artifacts and model unchanged by reads. |
| Fresh Open reedit named step/parent; real Undo/Redo; material review/reexport; second Save/sync/Open | Actual current stepped geometry/entry-relative semantics, source/counters/metadata/drawing and named bindings preserved twice, session-local J explicitly clears on Open. |
| Own valid-archive malformed semantic copies | h=T, reversed diameter ordering and actual wrong-role cap each reject before adoption with precise code and preserve healthy document. Negative copies never count as positive authoring. |

The AFTER-WHOLE oracle must parse ACTUAL saved sources and source equations with
Fraction/Decimal, explicit parameter definitions and actual IDs/ownership (no ID
grammar). Compute both removed increments/total using high-precision pi. Audit
all3field bindings and shared creation/edit/source/physical travel from complete
receipts. Classify genuine Native points independently at radial/axial regions,
including annular shoulder and distinct cylinder boundaries. No coordinate
expected chosen solely from an underconstrained solve or display mesh.

Independently parse both .cad ZIPs, CRC/SHA/root/design records and all authored
source/parameter/material/drawing domains. Actual STEP analytic subset must prove
source outer boundary, two distinct actual coaxial cylinders with different
radii/finite spans, genuine annular plane with two shared rim edges and actual
small bottom/large top openings, closed oriented topology and volume from those
parsed surfaces. No total face-count oracle or analytic copies substituted for
Native geometry. Actual controlled3MF XML components/material resources/indices,
closed oriented mesh/source binding and bounded tessellation error are separate
from exact BRep; SVG XML proves actual available projection and truthful source
axis/thickness labels, never a false THRU large bore or invented step dimension.
Source geometry budget50pm (5e-8mm), Native bounds1e-6mm and volume1e-6mm³ remain
distinct from named topology qualification/tessellation policies. No tolerance,
quota, performance/RAM budget or Files/race test is added by this design.

No genuine missing Native primitive was identified in this source-only finite
construction. Missing WORK remains the shared counterbore operation, exact
annular/two-cylinder proof and complete consumer/acceptance closure above;
existing blind/through success cannot stand in for it. Countersink, draft, rib,
body mirror, radial pattern, split and solid offset/thicken remain explicit C06
obligations, not waived by this design or the earlier ordinary exercise scopes.
