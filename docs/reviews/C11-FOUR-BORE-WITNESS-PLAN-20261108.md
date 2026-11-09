# C11 four-bore drawing references: source-only implementation plan

Reviewed Core1d8fa59ca01f0d0b5f9ef9e17495bcd26eda1f2d, Desktop728456989
composition. Notes only: no product/UI edits, execution, tests, probes,
TSC/build, Native/browser calls, runtime or frozen-proof changes.
Existing centerØ10/six-dimension E22 remains accepted; isometric/EqualRadius
qualification is independent. This does not claim four-bore drawing support.

## Actual available evidence versus missing production

1. modules/engine/mount/ownedThroughHolePlan.mjs planOwnedThroughHoles derives
   actual four rectangle-corner placements from the captured source and explicit
   offsets. Its existing semantic anchors are MIN_X_MIN_Y, MAX_X_MIN_Y,
   MAX_X_MAX_Y, MIN_X_MAX_Y (or center). It builds four separate circular
   prism requests, strictly checks circle/profile clearance and separation,
   and ensures tools span measured current target bounds. These are authentic
   proposed tool inputs, NOT observations of surviving final bore walls.
2. oci-verified-worker.js createOwnedThroughHoleResult authenticates Native
   runtime, actual parent/source tokens/producers, captured profile and current
   source construction. cutOwnedBoreTools creates the four real tools, performs
   three real disjoint unions, then one subtract. All current source tables,
   constructionProvenance and A/B ancestry come from genuine Native calls.
   Four-corner native cost is8; center cost2. Result-volume checks are useful
   admission but do not identify individual wall descendants.
3. cylinderCutWitness.mjs deriveCylinderCutWitness validates actual single-circle
   prism construction, corresponding Native source cylinder, Boolean result/
   correspondence and UNIQUE same-support B-descendant. Native source-copy
   mappings are ALREADY composed: applying sourceCopyB again is wrong.
   The helper is deliberately one single-circle subtract-tool contract.
4. Production currently emits such a new drawing witness ONLY when
   drawing.intent.kind===centered-through. During multi-tool union it releases
   the originals and keeps only the combined tool name/volume; no four member
   lineage is composed. Feeding the final multi-solid union and tools[0]'s
   single-prism construction to the old helper would be false provenance.
5. drawingReferenceFacts.mjs propagateDrawingCylinders claims center:featureId;
   the general Boolean branch deduplicates by intent.featureId. BOTH must change
   to a semantic feature+slot key, or four correct records collapse/alias.
   Current duplicate-current-face protection must remain.
6. booleanSelectionClaims.mjs reconcileNativeSelectionClaims already reports
   unique, MULTIPLE_DESCENDANTS, MERGED_DESCENDANT, NO_DESCENDANT and Native
   reportedDeleted. It never chooses the nearest/equal-looking face.
7. drawingReferenceFacts finiteCylinder proves the current unique cylindrical
   support, two actual complete circle rims, seam, source alignment and0..depth
   rim extent. It returns radius/intersection/diameter anchors. This is adequate
   for the EXISTING diameter/offset slice, not automatically a proof of THRU
   across an arbitrary later complete body.
8. Public inspect-through-holes/history are source/intent/creation/edit
   discovery, explicitly requiring Worker validation. Current drawing schema
   admits only center-hole/slot:center; public drawing inspection is authored-
   definition-only. There is NO public final four-bore measurement discovery.
   Reading a nominal diameter/offset or counting four ID strings cannot fill it.

## Smallest genuine lineage extension (no new Native API initially)

In cutOwnedBoreTools, retain a PRIVATE bounded semantic record for each actual
tool invocation: featureId, explicit slot from the same admitted tool plan,
actual prepared request, detached Native construction and source topology.
The plan should return explicit slot-to-tool records, not recover the slot by
parsing derived-through-hole labels. Validate the initial Native prism cylinder
while its actual source topology/creation binding is present.

For EACH actual union step, reconcile every existing A-member and new B-member
against that union's actual source topologies and A/B ancestries. Require one
unique unchanged-support cylinder descendant and retain the RESULT face index
privately for the next union. Preserve the original semantic slot. After final
subtraction, resolve each combined-tool cylinder through actual B ancestry,
corroborating same analytic support. Never treat a union as a new single-circle
prism or map Native copies twice. A helper can factor initial-cylinder capture
and unique descendant reconciliation while retaining the old center contract.

This adds JS proof tracking, not result names, solids, native operations or
Native cost. Existing APIs _CreateSelectedProfileV3, _ApplyOwnedBooleanHistoryV1,
_ReadOwnedTopologyV1 and _InspectOwnedSolidV2 supply the required data. Initial
createOwnedProfileResult returns created/evidence, so the implementation must
capture/reuse the actual tool topology while owned, or reuse the immediately
captured first union's original source topology; it cannot retain a released
shape name and read it later. Native pair/defaults need not change for lineage.

Store only private response-local records on selectedDrawingCylinders per
current owned token; delete with the token/owner. Keys are feature+slot, not a
face ordinal, sourceCurveId spelling or object-array position. General A/B and
unary/treatment propagation must preserve these keys, exact source binding,
current unique support and first unresolved cause. Duplicate semantic keys from
both operands and multiple semantic keys mapping to one face stay ambiguous;
do not silently JSON-deduplicate them.

Malformed construction/Native integrity errors remain failures with cleanup.
Genuine absent/split/merged/deleted lineage produces an unresolved MEMBER,
without discarding a valid part or inventing a value. Replaying Undo naturally
reconstructs prior proof; read never heals old records by proximity.
Linear patterns remain separate: no automatic pattern/slot support claim.

## THRU is a separate current-part fact

Counterexample to reusing source depth as THRU authority: after the original
0..20 hole, union a cover over z20..25. The wall may remain cylindrical on0..20
with unchanged radius/ancestry while the complete current part is now closed
above it. Existing diameter truth can survive; a new THRU claim cannot.

First slice should certify the actual CURRENT prismatic slab family, not every
Boolean solid: valid positive one-solid BRep; complete analytic topology consists
only of the two admitted end-plane levels and supported vertical planar/
cylindrical walls; actual bounded wires/curves/vertices establish constant
cross-section and no material beyond those levels. The member's unique full
cylinder rims must bound those actual cap levels and share their real cap
incidence, not merely lie on the same infinite planes. Use existing current
_ClassifyOwnedPointV2 for bounded genuine axis-midpoint void and adjacent
material observations to corroborate the void side; unknown is NOT outside.

Neither endpoint adjacency alone nor a few sample points prove through extent
in general. The complete admitted prismatic-domain proof is essential. A cover,
intermediate floor, bridge, unsupported surface/trim or unproved domain yields
through-unqualified. Do not change existing diameter/offset availability merely
because this stronger new fact is unavailable. If the analytic whole-topology
certificate cannot be made sound with current data, the fallback is explicit
through-unqualified pending a separate owned Native line/section intersection
reader, NOT a new optimistic flag or finite point samples pretending to prove
an arbitrary axis ray.

Freeze exact tolerance/domain policy before implementation; retain existing
Native cylinder support/finite-extent tolerances and50pm source policy. No
welding, coordinate normalization, wall-radius substitution or cap-count parity
across engines. The initial whole flow needs the genuine unplaced rectangle/
through-holes/vertical treatments family only.

## One shared discovery, authored schema and observation path

Proposed public read: inspect-linked-part-bore-references, wrapping a new method
on createWorkerDrawingReadCommands and the EXISTING private read-only evaluator.
Exact input: version1/unit millimeter, document revision, geometryRevision,
target {bodyId,featureId,engine,engineRevision}, datum {featureId,faceId,regionId}.
All IDs come from real public current inspection. Do not fabricate a temporary
drawing/measurement definition just to invoke another query.

Reuse actual owner/producer/build/source/frame/full-head/native-metric/currentness
capture and candidate retirement. A narrow private solid.drawing.bores.read
verb can return bounded typed facts through the controller, never native face
indices, handles, full topology or projected-mesh authority. Exact reply binds
both revisions/target/datum plus rows of reference/status/reason and current
axis/center/diameter/finite-extent/through facts. Public canMeasure/canCallout
are derived capabilities, never accepted as proof on a later mutation/read.

Proposed reference: {kind:through-hole,featureId,holeKind,sourceFeatureId,faceId,
regionId,slot,geometry:cylinder}; holeKind/slot are exact existing semantic enums.
New references are issued from actual captured feature+slot lineage. Preserve
legacy center-hole refs cheaply, without rewriting them or parsing opaque IDs.
A read-only discovery result is not a persistent ID allocator or a second graph.

Keep create/replace/remove-linked-part-drawing and document-metadata J; add no
special annotation stack or direct setter. Recommend ONE new definition version
for C11 typed annotations/additional view variants, with a bounded annotations
array. Existing definition1/2 stay cheaply valid; no migration/import machinery.
Dimensions keep their current physical distance semantics; annotations save
typed refs/layout/requirement intent only, never observed centers/radii/counts/
values/axis vectors/through flags or synchronized measurements.

Initial admitted annotation variants:
- bore-center: one discovered ref +viewId/paper style. Face-on top view derives a
  center mark at the real axis; front/right/isometric derive finite centerlines
  from actual current cap-center anchors. Paper extension/tick lengths are
  presentation, not model geometry. Unsupported alignment stays explicit.
- baseline group: four refs, datum-x, labels. Scalars remain nonnegative datum-
  axis distances with signed geometric anchors; origin is the actual source
  datum, NEVER rectangle minimum.
- ordinate group: four refs, datum-y, labels. TRUE ordinate coordinates may be
  signed; existing dimension.value>=0 must NOT be reused as abs(coordinate).
  Recommendation is a distinct typed ephemeral signed-datum-coordinate fact.
  This explicit distinction requires owner approval before implementation;
  do not silently widen all existing dimensions or disguise magnitude as sign.
- hole callout: four distinct discovered corner slots of the SAME authored
  group/source. Derive count4, equal current diameter and THRU only if all four
  current members prove them. CenterØ10 remains an independent reference.
  Missing/split/merged/covered member makes the group unresolved; no3x fallback,
  nominal4, averaging unequal radii or surviving-only truncation.

Keep later datum/GD&T/finish/fit as explicit typed variants in this same model;
do not admit unimplemented tags or invent a generic annotation-plugin framework.
Section/detail require their own real derived geometry, not this bore proof.

Whole discovery <=16 members, definition/requests/observation <=64KiB, initial
annotations <=16, each group exactly4; existing dimensions <=16 and view/buffer/
history/source/result budgets remain. Resolve repeated bore refs once WITHIN
the same owner read, using an exact private key and current capture, not a
cross-candidate cache. Charge all reference occurrences/work, including repeated
group members; preserve bounded metadata and fail rather than truncate.

The registry parameters-description4096 cap is also real: the isometric host
repair already compacts metadata. New annotations must use compact public
descriptions/capability summaries and public recipe/docs with full authoritative
Core validation, rather than dumping a growing duplicated schema into registry
or increasing the cap. Every actual registered descriptor must fit before mount.

## Exact source ownership for the later approved packet

- ownedThroughHolePlan.mjs explicit slot/tool pairing; cylinderCutWitness.mjs
  bounded seed/correspondence factoring; drawingReferenceFacts.mjs per-slot
  propagation, finite-current-extent/typed annotation facts; a small private
  slab-domain helper if justified, not a second model.
- oci-verified-worker.js cutOwnedBoreTools, A/unary/Boolean paths and token
  cleanup; no C++/native main edits for initial metadata lineage.
- ownedDrawingReadProtocol/SolidKernel/controller/factory/catalog/stagers:
  exact configured operation/capability and source closure only after source
  complete. Existing Native bytes remain pinned; no blanket old-cohort claim.
- workerDrawingReadCommands, solidLedger readCandidateWorkerDrawing and narrow
  Craft observer dispatch: same private pipeline and lifecycle, no public
  native handles or allowed-flag authority.
- modules/drawing definition/operation and same manager/validation/.cad custody;
  Desktop dedicated discovery adapter, existing drawing metadata commands.
- existing Worker SVG renderer/encoder derives linked marks/lines/group leaders,
  signed ordinate facts and actual callout text; no decorative-only overlay.

## ONE complete whole-flow/oracle contract after source

Public100x50x20 rectangle, actual centeredD10 and four-cornerD4/offset10:
volume100000-820pi mm3, bounds[0,0,0]..[100,50,20]. Discover exactly the five
real members, author linked4views+six existing dimensions+typed annotations.
Immediate annotation replacement Undo/Redo preserves exact definitions/IDs/
source/part/J. Actual width150/height30/depth25 gives cornerX10/140,Y10/20,
centerØ10 separate, four bores remainØ4; volume112500-1025pi if center staysD10.
If a later explicit centerD14 edit is included, freeze its distinct volume
112500-1625pi before execution. No shared formula between independent edits.

Real source/diameter/offset edits and mixed travel; three normal.cad browser/
server-equality/fresh signed Open/reedit/SVG cycles, full read-only before/after
state/tokens/resources, actual native bore/near-wall/cap/exterior classifications.
A translated source-origin case must verify actual datum-coordinate semantics;
negative ordinates require the explicit signed-fact decision, not abs/welding.

Geometry negatives use real public solid-commands Boolean tools, not invented
witness rows: subtract a band crossing one wall mid-depth (multiple descendants),
enlarge/consume one bore (missing old wall), fill a bore or add a top cover
(through unavailable even if diameter survives). Genuine merged/ambiguous
ancestry needs a real construction producing that observation; if no supported
public case is found, record that missing case, never fabricate Native maps.
Exact current ancestry/status must be captured before assertions. Geometry
Undo/Redo must restore the same refs or same unresolved reason. Structurally
valid unresolved definitions persist with no fake measured values; explicit
reference repair uses actual new discovery, never a nearest cylinder.

Independent AFTER-WHOLE source/.cad ZIPCRC/SHA/designRevision and XML/path
oracle derives all centers/radii/axis spans/voids from actual saved intent and
compares actual Native facts; checks5 separately bound bores, baseline/ordinate
coordinates and exact4xØ4THRU versus centerØ10, not just text/counts. It checks
mark intersections/centerline spans against real projected axes and existing
HLR hidden walls; plate resize follows actualsource semantics. Native inputs,
tolerances/catalog, name cost, accepted source/history/material/presentation/J
and owned cleanup must remain exact. No Native50pm/slicer/print/fullC11 claim.

Owner decisions before product: approve signed ordinate fact distinction;
choose the single bounded annotation-definition extension; review the current-
part prismatic through certificate and exact operation/byte caps. No authority
to publish unproved THRU or broaden unsupported Native geometry is implied.
