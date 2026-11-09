# C11: one genuine center section and linked detail2:1

DESIGN ONLY, source-reviewed on2026-11-09. Core base
`e2a3027fd5fff516cbcda412e8f5f9d9b3531f57`; source contract freeze e2a3027 /
Desktopc6d2bfe91. No product/UI edits, tests, probes, TSC, builds, browser, Native
execution or new status claims. Actual qualification failures take priority.
Existing orthographic/isometric/bore workflows remain accepted on their pins;
the later warning-layout whole proof82dd692 is separate retained evidence;
this is one next vertical flow, not a reset or a full C11/standards claim.

Requirement: Desktop COMPETENCIES.md C11 explicitly requires a center section
revealing through bores and a2:1 detail whose paper geometry doubles while the
physical nominal remainsØ4. The finite closure audit retains these obligations.
A new centerØ10-only detail would not cover that literalØ4 case. No circular
aperture shape, universal drafting standard, assembly/BOM or human UI redesign
is added to the active requirement.

## Decision: existing Shell geometry ports suffice for this finite section

No new C++ ABI is inherently needed for the proposed principal-plane, line-bound
section of the current unplaced plate. Existing exact Shell JS/WASM:
`57b74074e0a249b917ac68357fbd003c37d1ab61897206886b575088e6995858` /
`60dc956b08e01f43d08a48035a384e478e63bb34fb55f21a152c8cd12e8b8947`.
It exports an actual box builder with Native face-role provenance, detached-copy
Boolean common with original-input ancestry, complete bounded topology and owned
release. Worker can collect the ACTUAL cut-plane cap faces and project their
ACTUAL analytic trims. That is a real BRep cut, not nominal rectangles or a
clipped screenshot. This contract precedes the isolated source implementation; no runtime qualification is implied.

This is NOT a claim that existing orthographic HLR alone computes sections.
Native ownedOrthographicReadV1.hpp read requires one positive valid complete
solid; it cannot accept a disconnected cap-face compound. Its whole-solid HLR
curves cannot identify cut material by image proximity. First slice therefore
renders explicit cut-boundary/material patches from actual cap topology, with
no invented beyond-plane hidden geometry. Later beyond-cut contours would use
a separate genuine half-solid HLR pass, not be silently inferred here.

Actual Native source: occt-interpreter-codi branch
feature/owned-shell-v1-20261107, tip2f10f1e1ee04bd0a81ad828404511287f590fdec;
shape-io/owned-shell-v1/build-r2/runtime-pins.json binds the above pair to source
910aab3151bd5cc9663dd896f92cd4ccb1fcbaad and the recorded SDK/archive cohort.
Relevant actual functions:

- ownedShellFFIV1.hpp CreateOwnedBoxWithFacesV1 and ownedShellV1.hpp box:
  finite positive axis-aligned box; actual MakeBox face handles become complete
  X_MIN/X_MAX/Y_MIN/Y_MAX/Z_MIN/Z_MAX membership. Native call has NO authored
  featureId. JS createBoxSelectionIndex adds a REAL author feature only for
  actual modeling operations; it must NOT mint one for a section cutter.
- main.cpp ApplyOwnedBooleanHistoryV1 and ownedBooleanHistoryV1.hpp apply/build:
  actual Common, deep working copies, SetNonDestructive/FillHistory, original
  input→result ancestry and sourceCopy certificates. BRep/catalog/tolerances are
  snapshotted before/after; source-to-working mapping is ALREADY composed by
  Native and must not be applied twice. Failures are not success evidence.
- ownedTopologyV1.hpp catalog: valid complete V/E/F membership, analytic planes,
  cylinders and line/circle edges; each face has actual ordered
  BRepTools_WireExplorer edge uses/orientations. Ellipse and other edge types
  currently have analytic:null, so cannot become invented exact section curves.
- Core ownedBooleanContract.mjs validates full actual inputs/result/copies and
  ancestry. booleanSelectionClaims.mjs deliberately requires UNIQUE authored
  selections; it must NOT be weakened to turn split faces into one selection.
- Core readCandidateWorkerDrawing / workerDrawingReadCommands / Craft drawing
  observer capture current full history/source/services/producer/build/valid
  Native metrics and retire the one private candidate. New section uses them.
- Existing HLR protocol retains4MiB private Native JSON,64KiB read chunks,
 8192 fragments and819200 packed bytes per projection. Full decode/math stays
  in Workers. These caps are not permission to send raw topology/JSON to UI.

## One definition, current references and precise sufficient domain

Keep existing operation1, document-metadata J domain, drawing-bearing envelope3
and .cad format. Extend the CURRENT definition3 with bounded view variants;
v1 andv2 keep their exact existing fieldsets/order/limits/meaning. No version
per feature, migration/import framework, second drawing file or cached model.
Older code must refuse unknown variants instead of dropping them on Save.

Proposed v3 canonical view order: required top/front/right, optional existing
isometric, optional ONE section, optional ONE detail. Maximum6 TOTAL; maximum4
Native whole projections. Existing dimensions≤16 and annotations≤16, definition /
request / observation metadata64KiB stay unchanged. Existing view objects keep
exact fields. Proposed new objects, exact variant fields (names for review):

- Section: `{viewId,basis:'bore-center-section',hole,retainedSide:
  'positive-datum-y',paperOrigin,visibility:'cut-boundary-only'}`. `hole` is an
  ACTUAL discovered through-hole semantic reference, initially centered-through.
  No user coordinates, normal, BRep, ordinal, cap selection or proof flag.
- Detail: `{viewId,basis:'detail',parentViewId,focus,aperture,scale,paperOrigin,
  visibility:'inherit'}`. Parent must be the existing canonical TOP view (no
  cycles or detail-of-detail). `focus` names one ACTUAL discovered four-corner
  bore, initially MIN_X_MIN_Y. `aperture` is exactly
  `{kind:'rectangle',halfWidth,halfHeight}` in MODEL projection mm, positive
  finite bounded literals. `scale` is exactly2:1 ABSOLUTE paper/model scale,
  independent of sheet scale; no undocumented relative zoom. No saved center,
  measured values, clip intervals or derived availability.

Initial target is the current accepted valid positive unplaced single solid on
that exact Shell cohort, genuine prism/center/four-bore/treatment family. Source
frame is an exact principal signed permutation; actual bore axis must be exactly
parallel to source Z and lie in the section plane. Source/bore/producer/slot
membership comes from current owner-bound witnesses. No tolerance turns a tilted
axis into a center section. Current actual BRep bounds must fit the finite
MakeBox domain including a1mm outward margin. Unsupported/coincident/zero-area /
missing/ambiguous/multi/curved-cap domains report explicit unresolved reason.
Geometry can still Save/Open; never substitute a nominal or nearest surface.

## Actual section construction and cap authority

1. Under the existing SAME private drawing candidate, authenticate accepted and
   rebuilt current producer/build/nativeValidity.valid===true, positive volume,
   single solid and exact existing expected metrics; resolve the real current
   center-bore cylinder. Resolve its actual axis/source-plane intersection C,
   not nominal diameter/position params. Derive plane through C with normal
   sourceY, section frame u=sourceX,v=sourceZ,n=−sourceY, origin=C. C is ephemeral
   observation data, never a new persisted datum origin.
2. Keep the positive sourceY half. Use actual CURRENT Native bounds, extend the
   other five cutter sides by1mm OUTWARD with representability/domain checks.
   If sourceY is +world axis j, cutter lower coordinate is C[j] (role j_MIN);
   if −world axis j, upper is C[j] (role j_MAX). The other sides must be strictly
   outside all current bounds. Never round/snap the plane to a source vertex.
   Initially refuse a pre-existing target plane on the same section support;
   this avoids a coincident-boundary provenance claim in the first slice.
3. Create the actual temporary box through CreateOwnedBoxWithFacesV1; validate
   the COMPLETE six-face constructor census AND chosen role's actual analytic
   plane/finite membership against the requested cutter. No guessed ordinal,
   synthetic author featureId or “find nearest coplanar face” substitution.
4. Run actual Native Common(target,cutter) through ApplyOwnedBooleanHistoryV1.
   Require valid positive ONE material solid in this finite family. Validate
   actual original source topologies, full detached copies, original-input
   ancestry and result topology. Input/copy/history error cannot become a
   nominal successful section. A multi/empty result is explicit unsupported/
   unresolved here, not raw-multi silently treated as one drawing part.
5. Obtain the COMPLETE face descendant SET of the actual cutter plane from
   its Native same/modified/generated rows, after validation against real
   source/result counts. Validate each selected result face is a positive
   planar cut patch with the authenticated exact support and outward side;
   validate all result faces on that cut plane are accounted for. SourceCopyB
   is not applied again. Any missing/extra/ambiguous ancestry is unresolved.
   This intentional one-plane→several-cut-patches observation is NOT an authored
   unique-face selector; keep general selection reconciliation unchanged.
6. Initial cap domain≤16 patches, each one simple closed wire of nondegenerate
   actual LINE trims;≤512 total uses. Confirm oriented connectivity by actual
   vertex membership, complete edge-use coverage and actual analytic endpoints
   in the exact cut plane. INTERNAL/EXTERNAL/seam/multiple-wire/nonline cap cases
   are explicitly unsupported initially. This covers the real vertical center
   cut: two disjoint rectangular material patches around the open bore channel.
   Distinguish raw Native faces from connected material regions: if selected
   coplanar patches share an actual edge with opposite uses, cancel that INTERNAL
   partition edge from the rendered section boundary by exact Native membership.
   Do not weld coincident coordinates or require a kernel face-count parity.
   More than two selected owners, contradictory uses or unshared coincident
   ambiguity is unsupported. Trace remaining actual boundary loops; raw patch
   areas may still sum because interiors are disjoint in the valid solid.
   Project actual curves into the section frame. Area is the sum of actual
   patch Green integrals abs(1/2 Σ(u_i v_next−v_i u_next)); no width×depth formula
   is used by production and no per-loop abs that would fill holes. Public
   metadata has areas/patch counts, not Native face ordinals or selectors.
7. Render only these real closed material patches and their boundaries, with
   explicit section hatch/pattern clipped to them. Aperture/border/hatch lines
   are tagged presentation, never Native model edges or dimension witnesses.
   No HLR of an isolated cap compound is attempted. If later line/circle inner
   wires are admitted, original oriented/nesting/material proof must precede
   area/fill; current Native data can support circles, but it is not this slice.

### Temporary ownership/work policy (explicit, no hidden budget increase)

Existing applyOwnedBooleanResult JS helper also calls interrogate/summarize and
charges modeling result/display work. Do not call it blindly for a read. A new
private section helper reuses the actual Native PORTS plus pure result/copy/topo
validation, without display mesh, output-model creation or registry publication.
Two temporary Native results are genuine work: cutter and common result.

Smallest proposal: reserve TWO slots atomically within the EXISTING32 cumulative
Worker name/work allowance before either call. Use existing allocator/owned
release; do not reset nextName, invent a free namespace bypass, or charge a fake
zero-work Boolean. They cost0 AUTHOR features/J entries/model counters and no
permanent outputs, but2 private observation-work results. The finite qualified
plate uses12 modeling results;12+2 fits. Histories using31/32 remain valid and
keep all old projection/bore reads, but this new section view reports a precise
section RESOURCE_LIMIT until a separately approved scratch-lease or Native
stack-only reader exists. This limitation is disclosed, not a model rejection
or a raised default/name ceiling. No claim of section-at-quota is proposed.

Record both attempted temporary names before Native dispatch. Release in reverse
order in finally even when a constructor/Boolean result publication fails (the
Boolean FFI inserts before publishing). Attempt every scratch pointer/name
cleanup, compare Native owned-name count to the captured baseline, and keep
source handle/token/producer/currentness pinned. Known-success insertion must
release exactly once; an uncertain attempted insertion still gets a release
attempt and count reconciliation. Cleanup/input mutation uncertainty overrides
success with existing ENGINE_CLEANUP_FAILED/input-integrity diagnostics and the
candidate is retired, never accepted. Native Boolean verifies source BRep,
catalog and tolerances via its real before/after snapshots; no borrowed working
shape/curve remains after read. The whole candidate then closes through the
existing observer finally before reply. No disk writes, Native import, legacy
DRAW authoring, saved cutter or shared-cache result. Cancellation cannot commit.

### When a NEW Native API really is needed

The bounded Shell path has all necessary geometry/cap data; implementation is
missing shared observation/lease/validation/consumer code, not a Native Boolean
algorithm. MFG32eec/abbf must NOT be assumed equivalent to Shell57b/60dc: the
new box-with-faces port is an explicit Shell prerequisite. Keep MFG old drawing
semantics and refuse unsupported new section capability, not change its backend.

Arbitrary tilted half-spaces cannot be made by the existing axis-aligned box
port. Elliptical/BSpline cut trims cannot be reconstructed from current topology
analytic:null. Exact Native Section/half-space plus analytic trim/patch/area
transport (or a deliberate topology extension) is needed for those domains.
A stack-owned, name-cost0 Native read would also be needed to guarantee section
at full32 quota without changing the approved modeling cap. None is smuggled
into this finite plan or emulated by HLR samples/display mesh.

## Detail: exact Native-curve intervals, absolute2:1, physicalØ4

Use current actual TOP projection plus its matching current four-bore witness;
resolve MIN_X_MIN_Y center in that parent frame. No pixel crop or screenshot.
Initial aperture halfWidth6/halfHeight6mm encloses the actualØ4 rim while excluding
far features. Detail paper frame centers this focus at its authored paperOrigin.
Each point maps to paperOrigin+2×(parent model-plane point−current focus), with
SVG Y inversion. Physical dimension value stays4mm; a full rim's PAPER diameter
is8mm. Sheet-scale edits do not redefine this absolute detail ratio.

Then change aperture halfWidth1.5/halfHeight6 through normal definition REPLACE:
actual circle x=±1.5 trim endpoints are y=±sqrt(4−2.25) about its REAL center.
This proves actual partial conic clipping, not only excluding distant objects.
The nominal remainsØ4, NOT aperture width3 and NOT paper width6. Undo restores
full aperture; Redo same partial trim/ref/IDs, original Native geometry unchanged.
A separate real group diameter edit4→5 must recompute its actual projected arcs
and physical value5; travel back to4 tests source binding rather than scaling
stored text. No typed formula is replaced by a literal.

Proposed new Worker-only detail clip helper consumes already validated immutable
packed parent fragments. For each finite line/conic retain ORIGINAL coefficients,
source parameterization, category/visibility and only derived subintervals:

- Line: four exact half-space inequalities intersect the existing finite trim;
  constant coordinates are handled as constant, not divided by zero.
- Conic: solve each aperture boundary A cos(t)+B sin(t)=C analytically, enumerating
  roots in the ORIGINAL interval, with endpoints/critical events ordered once.
  Constant-coefficient and exact tangent/endpoint cases are explicit. Initial
  detail domain admits at most one actual2π conic turn; other valid parent curves
  remain visible in the parent but this detail is unsupported, not truncated.
- Membership between COMPLETE boundary events can only be accepted with a
  conservative numerical/error-bound decision; uncertainty/tangent degeneracy
  may refuse this NEW detail. No sampling polyline, rounded root deduplication,
  epsilon weld, clamping into acos domain or changed original Native trim.
  No positive-length image from a zero-length contact. An actually empty clip
  is available-empty with an explicit derived notice, never stale old geometry.

No duplicate coefficient buffers/cache: detail is bounded parent-fragment index
+start/end parameter references. Parent frame/buffers remain the real Native
observation; the detail's derived focus/frame is not relabeled as a new Native
HLR receipt. Renderer validates each reference lies in that exact parent's trim,
uses the child's explicit scale and clips ONLY geometry. Aperture border is
presentation, not a model edge. Reference dimension leaders/labels remain
separate paper annotations and can extend outside a partial crop; their3D
anchors/value still come from the real cylinder, not the aperture.

Existing hole-diameter schema accepts ONLY center-hole. For literal requiredØ4,
propose v3 ONLY accept the already-authenticated through-hole BoreReference for
that EXISTING dimension kind. Preserve v1/v2 center-only capture. In
resolveOwnedDrawingReferences/hole, retain an admitted bore's actual holeKind /
slot instead of always forcing centered-through. Generalize no math/radius from
nominal params. Detail inherits parent's TOP dimension-axis visibility; section
has FRONT semantics. Isometric physical dimensions remain unsupported. No new
persistent measurement role/value or new dimension subsystem.

## Explicit proposed transport/render budgets

These are review proposals, NOT current capability or a silent limit increase.

| Resource | Existing retained bound | Proposed section/detail bound |
|---|---|---|
| Definition/request/observation metadata |64KiB UTF-8; dims16,annotations16 |UNCHANGED; extra views may hit same real cap |
| Schema views |v1≤3,v2 exactly4,v3≤4 |v1/v2 UNCHANGED;v3≤6 total:≤4 projections+1 section+1 detail |
| Native HLR |4MiB private JSON,64KiB chunks,8192 fragments/view |UNCHANGED; do not run extra HLR for detail or pretend cap compound is a solid |
| Whole-projection packed bytes/buffers |4×819200=3276800,8 unique buffers |UNCHANGED native projection aggregate |
| Section boundary |absent |≤16 simple patches,≤512 actual line uses;12 f64+4 tag bytes/use≤51200,2 buffers |
| Detail ranges |absent |walk≤8192 parent fragments,≤8 boundary roots/conic turn;≤4096 retained intervals×24B=98304,1 buffer |
| TOTAL projected/derived transfer |3276800,8 |3426304 bytes,11 DISTINCT buffers; no alias exemption/duplicate parent transfer |
| SVG |16MiB,total200000 presentation segments |UNCHANGED aggregate incl new curves; bounded hatch pattern clipped to real material |
| Temporary geometry work |model32 Native cumulative results |UNCHANGED32; section reserves2 within allowance; detail allocates0 Native shapes |

Overflow makes the NEW view explicitly unavailable/resource-limited, never
silently drops patches/curves/intervals or narrows existing supported parent
observations. Curves/roots/areas/clipping/full buffer validation and SVG encoding
stay in Workers. Main admits only bounded typed metadata/intrinsic buffer sizes
and unique transfer handles. The section has a DISTINCT cut-boundary layout /
quality, not a forged orthographic HLR record; patch indices are response-local
ranges, never authored IDs. Detail has its one interval buffer and explicit
parent reference, no aliased values/tags masquerading as a second Native view.
The renderer cannot assume every available view has the old values/tags pair.

Inspect should report per-version/per-role limits plus total6. Existing current-
source isometric/bore compatibility checks may update ONLY advertised total-view
limits; old full geometry/history/file proofs and historical artifacts remain.
All stages/controller/codec/ledger/export-client must enforce the SAME proposed
sums before advertising capability; old “views×819200” allocation assumption
must be replaced by explicit role sums, not removed.

## Concrete implementation boundaries (not authorized by this design note)

| Files/functions | Minimum later delta |
|---|---|
| linkedPartDrawingDefinition.mjs/.d.mts | v3 exact section/detail variants, canonical order/per-role limits, v3 BoreReference for existing hole-diameter; v1/v2 unchanged |
| linkedPartDrawingOperation.mjs + metadata Worker/client | keep SAME create/replace/remove/document-metadata travel; complete before/after capture/charge; effective-after total/per-role counts checked, no fixed4 leftover |
| projectManagerBundle inspect/capture/restore/Save + projectEnvelope/projectValidationCore | retain complete v3 fields through normal/manufacturing reconstruction; same native graph/envelope/container; Native resolution remains separate from structural validity |
| NEW ownedDrawingSectionProtocol/Worker helpers | actual private handle+semantic plane request, complete bounded cap-set validation,2-slot reservation/cleanup, distinct packed cut-boundary facts |
| oci-verified-worker.js/controller/SolidKernel/catalog/factory | exact new gated section read declaration→controller verb→safe-owned allowlist→handler→receipt; actual Shell export/source closure checks. No unbound opcode recurrence or default promotion |
| solidLedger readCandidateWorkerDrawing + workerDrawingReadCommands/Craft drawing observer | SAME full-history candidate/expectedNative metrics/source currentness; dispatch by admitted view role; independent count/byte aggregates and finally retirement |
| drawingReferenceFacts/ownedDrawingReadProtocol | derive section frame and detail focus from actual current bore; actual area and raw geometry are observation-only; typed per-view result variants, not all available rows are HLR buffers |
| NEW drawingDetailClip.mjs + existing Native analytic codec | analytic bounded parent intervals in Worker; no change to old Native decoder math/domain for ordinary views |
| workerLinkedDrawingSvg/linkedPartDrawingSvg | admit11 distinct buffers/exact total, decode/render in Worker, real section fill/hatch, detail absolute scale/clip, physical labels, current derived-warning legend |
| Desktop drawing-commands/inspect-state/index | compact transport metadata within4096 registry cap; retain accepted v3/.cad/dirty comparison; existing public operations, no private successful setter/new format route |
| actual stage/asset emission/source pin lists | every new import emitted, exact common Worker SOURCE SHA repinned everywhere after coherent integration; Native pair unchanged for Shell-only first slice |

No Native topological ordinals/handles become public references. Public typed
metadata uses the same discovery IDs and shared preparation as any future human
consumer. The current UI redesign remains deferred. Do not enable a schema that
an outer/manager/Worker/encoder then silently drops. Proposed limits must be
wired together before capability is advertised. Ordinary leader autolayout,
GD&T/finish/fit, arbitrary section planes and extended Native curves remain
separate finite obligations, not implied by these two view kinds.

## Dependency/ownership lifecycle

| Transition | Required invariant / visible result |
|---|---|
| Current discovery→authored section/detail | actual current target/source/bore producer+slot; exact own data, no guessed IDs/plane or display pixels |
| Definition replacement→J | one atomic existing metadata event; source/H/body/counters unchanged, exact full definition before/after |
| Source/native edit→fresh realization | same exact current full tip/source/material/document/producer/build; recompute plane, cap set, detail focus/ranges, physical values; no cached old geometry |
| Available→reference missing or unsupported | first actual cause retained, base views/body still truthful where supported; no nearest bore/cap, old image or nominal section |
| Detail parent/focus unavailable | derived dependency unresolved; no source-less crop/value or reattachment by matching coordinates |
| Valid empty clip | explicitly available-empty,0 ranges, no old contour; physical reference remains separately measured if valid |
| Retarget current real Boolean producer | explicit authored operation, same semantic refs re-resolved against ACTUAL current BRep, not a hidden “follow latest” flag |
| Read→stale/cancel/native/cleanup failure | no publication/Save; release both attempted names/all scratch, retire owner; original accepted source/body/J/material/presentation remain exact |
| Save/fresh Open | exact definition and editable native source/H persist; new session J empty; all section/detail geometry is freshly re-derived, not serialized as truth |
| Undo/Redo | SAME shared J; actual reference/clip/scale IDs and full definitions return exactly; model high-water is preserved, never manufactured rollback |

No new synchronized canSection/canDetail/available field is persisted. Derived
readiness is a function of the current role, refs, real Native observations,
work/transport limits and current owner. A prefix/wizard cannot borrow full-tip
geometry: retain the current full-tip Native-read policy or explicitly refuse.
The existing stale document/window token and captured manager/service/signal
checks cover every await. Read-only results return only AFTER actual cleanup;
no accepted temporary tip/model is published.

## ONE complete public workflow and independent after-whole oracle

Freeze a NEW packet before execution; root alone runs the entire app workflow,
then its independent source/archive/geometry/XML oracle. No microtests/probes or
fake positive Native/canvas fixtures. Reuse the actual public Shell plate recipe:
100×50×20, centerD10 + four D4 offset10/10, actual one vertical corner fillet3,
existing top/front/right/isometric plus8 bore annotations and4 physical refs.
Keep those qualified ordinary outputs, original IDs and physical budgets.

1. Discover actual current bore refs. ONE public REPLACE adds sectionA-A and
   detail of actual MIN_X_MIN_Y bore, plus depth-in-section and detailØ4 physical
   refs. Immediate Undo restores EXACT old4-view definition, Redo SAME6-view
   definition/IDs. Native source/history/body/material/counters are unchanged.
   Exact same-definition no-op adds no J entry. No private model authoring.
2. At initial dimensions, section material has two actual connected regions: in its
   bore-centered X/Z frame,[-50,−5]×[0,20] and[5,50]×[0,20]. Area1800mm².
   These rectangles are the INDEPENDENT expected set, not production geometry.
   Production derives the real cap wires from Native Common. Native material/
   void/cap probes corroborate each patch, channel and section plane.
3. Detail full aperture6/6 at2:1 has actual paper rim diameter8mm and nominalØ4.
   Real definition edit to aperture1.5/6 yields true partial-circle endpoints
   (±1.5,±sqrt(1.75)) in model-plane coordinates and twice those offsets in paper.
   Immediate shared Undo/Redo restores the same complete/partial curves/ref IDs;
   physical value4, Native model and original view geometry do NOT change.
4. Separate genuine model edits width100→150,height50→30,depth20→25,
   centerD10→14. The center plane follows actual current Native bore center;
   corner focus follows actual slot. Section patches[-75,−7]/[7,75]×[0,25],
   total3400mm²; base3D volume remains independently source-derived with its
   actual holes/fillet. A real corner diameter4→5 gives detail nominal5/paper10
   full rim, then shared edit travel back to4. Geometry is not changed by scale.
   Save/sync/own server byte equality/fresh signed Open cycle1; reedit afterward.
5. Actual public box/Boolean2mm top cover, OLD drawing target first consumed;
   explicit metadata retarget to REAL returned Boolean producer keeps bore refs.
   Actual center section must show a roof/U material region, area3700mm²
   (3400+2×150), not fake old through gap. Section derives this nonconstant
   cross-section BRep; it does NOT require the bore THRU flag. Old caps/dims may
   honestly become unresolved, four-THRU callout must remain unqualified, while
   measurable boreØ4/detail and real current cut geometry stay distinct.
   No old-target failure may mask this observation. Undo retarget/Boolean/tool
   through actual shared J recovers original complete part, with real allocated
   high-water retained. This extends real cover truth already used by bore proof.
6. Structural/refusal cases: stale revision/document read; malformed/duplicate
   derived-view fields, invalid2:1 scale/aperture, unsupported detail parent;
   actual source/cap unsupported domain and budget exhaustion are explicit.
   Freeze exact codes from implemented owned producers before the eventual
   driver, never equate kernel/numeric uncertainty with malformed intent or
   accept arbitrary status after observing failure. Rejected requests preserve
   actual accepted source/H/IDs/body/J/material/presentation and no false file
   acknowledgement. A healthy read/edit follows each refusal.
7. Use an ACTUAL discovered fillet feature in section-hole/detail-focus refs:
   valid but unresolved authored intent, base real model/views intact. Export
   visible bounded error legends with NO stale section/detail buffers or values.
   Save/sync/fresh signed Open cycle2 retains this COMPLETE unresolved definition
   and valid native model. Explicit repair of those SAME reference fields;
   immediate Undo restores exact unresolved refs, Redo same repaired refs.
8. Reedit actual width140/depth22/centerD12; section material area2816mm²,
   detail remains linked to actual cornerØ4 at2:1. Mixed shared travel across
   real source and definition edits. Save/sync/fresh signed Open cycle3, then one acknowledged final reedit/
   resave (three fresh-Open cycles plus four saved artifacts) and actual SVG My files exports/readable outputs. Repeat or add the
   existing negative-datum family so plane/focus are never rectangle-min origins.
   Protect all submitted durable writes/sync; no forced-close/race/account probe.

Independent AFTER-WHOLE criteria: actual saved source equations and exact intended
feature/slot bindings; original body volume/bounds/material/void points; genuine
Native cut-patch3D→2D boundary connectivity, line equations/area, missing through
channel versus real roof; every emitted section boundary/hatch material region;
actual parent Native analytic coefficients/visibility and retained detail trim
intervals/endpoints; doubled paper coordinates but unchanged physical nominal;
exact source/J/travel/currentness/resource states, ZIP CRC/size/SHA/designRevision
and complete v3 custody, SVG XML/physical units/clip/scale/labels/unique warnings.
No production planner/provider supplies expected areas or curves. A same-OCCT
read is not labeled a separate independent kernel. Point samples corroborate,
never replace the actual cap/curve provenance proof. Keep50pm source acceptance,
existing1e−6 Native/dimension/projection bounds and old frame-direction policy;
section area gets an explicit proposed absolute1e−6mm² fixture budget. No global
epsilon change. Record whole latency/cleanup honestly, no large-part claim.

Approval needed before product: v3 variants/generalized corner dimension, six-
view/derived buffer budget, within32 two-result section allowance and its honest
31/32 limitation, and finite cap-line/parent-top detail domains. This document
implements none of them. Current qualified outputs and source remain unchanged.
