# Closed EqualRadius — bounded C03 contract proposal

SOURCE AUDIT / PROPOSAL ONLY, based on qualified main `78a70d2`. No product,
status or evidence changes; no tests, probes, builds, type checks or browser runs.
This fills one finite C03 family; it does not equate19 scoped workflows with
exercise or competency signoffs. Root must approve the product scope first.

## Existing mathematics, ownership and actual gap

- `web/app/sketcher/constr/ANConstraints.ts`, `ConstraintDefinitions.EqualRadius`:
  `defineParamsScope` takes exactly the two real objects' `r` Params;
  `collectPolynomials` emits `r1-r2`. No authored constants or auxiliary Params.
  Circle/Circle, Circle/Arc and Arc/Arc are already valid signatures in
  `headless/sketchValidation.ts`. Same-object relation is forbidden there.
- `shapes/arc.ts`: Arc owns `r`, `ang1`, `ang2`, actual endpoint/center Params.
  `syncGeometry()` initializes radius from actual A/C coordinates; the actual
  internal `ArcConsistency` row couples radius/angles/endpoints. Saved Arc data
  remains A/B/C coordinates, not a new persistent radius/angle flag. EqualRadius
  must preserve its actual finite directed branch through those real internals;
  matching radii alone does not prove an unchanged quarter/major branch.
- `constr/registeredConstraintPolicy.mjs` includes EqualRadius. Both actual
  circular objects must have finite radius strictly above1e−9 mm. Its existing
  registered residual is `r1-r2` in mm with1e−6 mm acceptance. This is NOT the
  50 pm physical coordinate reconstruction budget, a new radius minimum, exact
  algebraic redundancy or universal physical DOF. All existing domains stay.
- `headless/capturedParameterOwnership.ts` inventories actual descendants and
  compares each registered factory's geometric Param identities. EqualRadius's
  two radius slots are actual geometry, never an unrecognized auxiliary batch.
  Arc internal rows still undergo existing full domain/equation/ownership proof.
- `actions/constraintActions.js` currently exposes human EqualRadius for at least
  two Circle/Arc selections. It builds **consecutive pairs**, not a star:
  `(0,1),(1,2),…`, and calls existing `addConstraintGroup`. That helper owns one
  transaction/checkpoint and rolls back the entire group if any new/old row is
  rejected. Preserve this atomic selection behavior when sharing admission.
- There is no closed EqualRadius create/discover/remove operation in
  `cad/craft/closedSketchTransitions.ts`. Inspection already exposes source
  constraints, but `headless/drivingDimensionTarget.mjs` recognizes only real
  dimension-value fields and therefore does NOT make EqualRadius removable.
  Do not mislabel this zero-value relation as an editable radius dimension.

**Writer contract:** `AlgNumConstraint` constructor's optional constants defaults
undefined. `write()` includes that JS field; real JSON serialization omits it.
New EqualRadius rows must be taken from the actual serialized, admitted warm
source, retaining annotations, stage, ordered object IDs and actual admission.
Accept no authored constants (absent or exact empty own-data record), never
require invented `{}`, insert own-undefined fields or accept null/false/arrays/
nonempty fields. Retained source raw fields remain exact. The Point R1–R3 and
Projected R1 lessons in
[SHARED-CONSTRAINT-AUTHORING-CONTRACT-20261108.md](SHARED-CONSTRAINT-AUTHORING-CONTRACT-20261108.md)
apply, including resolving real constants before polynomial collection.

## Proposed minimal shared operation

**Public two-object scope** (numeric/native-local source initially):

- Core `applyClosedSketchEqualRadius({revision,faceId,ids:[idA,idB]}, options)`;
  registered `apply-closed-sketch-equal-radius` uses the same exact envelope.
  Identities are real inspected nongenerated root Circle/Arc IDs, bounded by
  existing inspection limits; never debug constraint IDs, geometry matches,
  endpoint-name grammar or Native indices. Current source membership, actual
  stage order, distinct object and nonaliasing actual radius Params are proved.
- `inspectClosedSketch` gains detached `equalRadiusTargets`: actual source row
  locator, stage/index, typeId, ordered objects, actual admission state,
  `canRemove/reason`. Locator is ephemeral/revision-bound, never persisted or
  supplied as authority without resolving the same current source row.
- Core `removeClosedSketchEqualRadius({revision,faceId,relationId}, options)`;
  public `remove-closed-sketch-equal-radius` deletes exactly the discovered
  authored EqualRadius row. No numeric edit field exists; edit a current radius
  dimension through the already genuine radius/dimension operation instead.
- EqualRadius is symmetric. Existing exact unordered pair is a semantic no-op,
  including reversed request order: return the actual retained row/order and
  admission, exact original source and no J event. A distinct transitive A–C
  cycle after A–B/B–C must author a genuine new redundant row if actual admission
  accepts it; graph connectivity or a repeated no-op is not redundancy evidence.
  Multiple actual matching rows make creation ambiguous rather than silently
  picking one; discovery can still address each specific valid retained row.
- Actual human action delegates to the same pure inspection/stateful preparation
  and preserves atomic consecutive-pair group insertion. Public API stays two
  objects; it does not turn partial human selection into multiple transactions.
  No new human UI redesign or gesture qualification is included.

**Preparation and proof:** one pure owned-object/row/domain inspector is safe in
captured-coordinate IO's already-open transaction; a separate mutable prepare
wrapper retains `pm.inTransaction` refusal. Pure inspection constructs only an
uninserted genuine registered constraint: no `_add`, begin/end transaction,
optimizer, writer mutation or caller-controlled bypass flag. Resolve its real
constants/domain before collecting actual original polynomials. Reuse
`captureConnectedGeometryScope`/captured ownership and the existing original-
coordinate versus authenticated affected-delta transition pattern. Unaffected
coordinates/IDs/intent stay exact; allowed affected fields must come from actual
Param dependencies, including ArcConsistency, not a hand-picked geometry list.
Warm solve cannot authorize unrelated geometry. Full independent cold original
rows, captured-coordinate equations and classifications must validate the final
candidate under current50 pm coordinate budget and unchanged dimensional,
branch and domain policies. A moving generator dependency refuses explicitly;
unrelated carried components still receive the full existing cold proof.

A second disposable Worker receives **the unchanged original request**, not
rewritten source or caller proof flags; independently redoes create/remove and
exact-compares canonical candidate, actual changed/no-op outcome and returned
row locator/type/order/admission metadata. Self-membership alone is insufficient.
Creation/removal both publish via existing prepared full-suffix replay and one
`sketch-bytes` journal event. Same source/frame/build/document/currentness,
material-review, accepted-state and lifetime guards apply. Do not add a new
journal, constraint UUID/schema, solver or model. Typed/formula-bearing mutations
are explicitly unavailable in this first numeric slice; retain all original
expressions, and never replace formulas with numeric values. Existing inspection
may remain truthful/readable under its current typed policy.

**Errors:** realm-safe exact own-data/dense-array capture at the host boundary;
malformed requests/unknown or aliased/generated targets, stale revisions and
unsupported typed/generator dependencies have distinct owned errors. New
admission refusal should be `EQUAL_RADIUS_REJECTED` with an existing bounded
actual admission cause where available. Preserve genuine cancellation and
unknown downstream errors; do not call a numerical failure a contradiction.
Removal must not invalidate old accepted rows or silently remove consumer
constraints. Solver-owned classifications, not parallel manual flags, supply
accepted/redundant/conflicting state. Any generator stage work must follow the
same genuine current lifecycle, not serialize stale generated outputs.

## One eventual complete public workflow and independent oracle

One real document: public factory10×10 rectangle at(100,100) provides a genuine locked datum. Append Circle A center(0,0)/r5, B(20,0)/r3, C(40,0)/r7, and positive quarter Arc Q center(60,0), A(68,0), B(60,8). Anchor centers using inspected actual points and existing signed-distance commands. A has a real numeric RadiusLength5; B/C/Q initially have free radii, and Q has genuine zero-Y(start)/zero-X(end) relative-to-center directional constraints retaining its positive quarter branch. Preserve unrelated Point(77,99) and the original rectangle exactly.
All source creation uses registered public append/constraint operations.

1. Apply A–B (actual radius movement), B–C, then distinct A–C. Observe actual
   accepted/accepted/redundant classification from the solver; reversed B–A is
   a semantic no-op with no source/J change. Apply A–Q: actual Arc endpoints
   adjust to radius5 while center and positive quarter branch remain original.
   Discover every actual new/removable row by the current inspection revision.
2. Extrude only actual discovered Circle A region with one explicit supported
   OCC build, depth20. Change A's existing radius5→6: B/C/Q follow from actual
   equalities, original centers/IDs/branch and unrelated geometry stay fixed;
   actual Native cylinder volume is720π and bounds ±6 in X/Y with Z0..20.
3. Remove only actual A–C redundant row: no geometry moves. Remove B–C, add an
   actual independent RadiusLength8 to C, then attempt A–C. The original
   equal-radius plus fixed6/fixed8 equations are analytically incompatible;
   record the real refusal layer/cause and exact accepted-state preservation,
   never relabel a generic numerical failure as contradiction. Healthy A radius
   reedit propagates only to still-related B/Q; C8 remains independent.
4. Mixed real creation/removal/radius edit UndoRedo must restore exact rows,
   actual original object/feature/output IDs and chronology, including redundant
   reactivation and the explicit reversed-pair no-op. Add stale/unknown/alias
   refusals and exact prior-state preservation. Actual local Jacobian reports
   compare this fixture's independent radius freedoms; no global physical DOF
   claim and no equation-count guess. Arc branch/center/radius checks are separate
   from a Native Circle cylinder, not an unsupported Arc extrusion substitute.
5. Three normal `.cad` Save→own browser/server byte equality→fresh signed Open→
   current discovered radius/relation reedit/removal/travel→resave cycles; session
   J reset is explicit. Native bound current point queries check A cylinder
   material/exterior/planar boundary. Full read-only state/resources and actual
   cleanup must remain exact. No private source setter, seed, simulated success,
   raw Native handle, file race, account probe or UI injection.

Freeze all fixture coordinates/branches before execution. The after-WHOLE oracle
imports no production solver/codec and independently checks actual ZIP CRC,
SHA/designRevision, exact original raw source/IDs/constants/order, Circle radii
and Q's two radial distances/directed quarter, equality and retained numeric
radius equations, unaffected datum/rectangle/Point, actual classification claims,
Native cylinder volume/bounds/point classes and three persistence cycles. Use
50 pm physical coordinates separately from declared BRep metrology and existing
registered residual thresholds; do not rewrite historical stricter receipts.
This is a proposal, not an executed fixture or promised positive result.

## EqualLength / exact ratio1 offset0 is a SEPARATE item

`ConstraintDefinitions.EqualLength` already calls the actual LengthRelation
polynomial with `{factor:1,offset:0}` on genuine Segment length Params. Existing
closed `apply-closed-sketch-length-relation` can express exactly that equation
as **LengthRelation**, preserving its real schema/constants; it is not an
EqualRadius operation and must not be renamed `EqualLength` in saved evidence.

Existing source `test/webos/equal-length-worker-browser.test.cjs` covers selected
human EqualLength serialization plus a real headless Worker route using a test
subject. It is NOT a signed public full Save/Open proof. Frozen
`test/length-relation-cold-candidate/desktop-driver.mjs` uses factor2/offset0 and
factor2/offset5; the small-polynomial workflow uses2^-40/0; ordinary orientation
also uses independent fixed-length relationships. These demonstrate mechanisms,
not an identified exact1/0 complete public assertion. The current C03 closure
ledger correctly keeps the explicit1/0 case separate.

Smallest remaining length assertion: in its own ordinary public same-source
fixture, apply factor1/offset0 to actual unequal Segments with one driving length
and independently anchored starts/branches; verify resulting equal actual lengths,
true separate redundant equality where policy allows, conflict preservation,
source edit/full suffix, creation/edit travel and native Save/Open. Reuse the
existing LengthRelation operation and after-whole arithmetic; do not add another
solver or conflate that evidence with the new Circle/Arc EqualRadius packet.

## Proposed ownership, pending root approval

New `actions/equalRadiusAdmission.js` + `equalRadiusOperation.js`,
`headless/equalRadiusEnvelope.mjs` + `equalRadiusTransition.ts` + small discovery
helper. Narrow additive human action, closed-sketch inspection/client, Worker
client/dispatcher/transitionClient/coordinator routes. Dedicated Desktop adapter
and one complete recipe/driver/independent oracle; root may splice Craft optional
methods and host registration. No PM/native/file-format/Apply/solver reduction
edits, no new persistent authority. Coordinate shared routing files with any
active lane before product edits. Root decides whether the separate exact1/0
length assertion is appended to the same eventual whole packet or kept a named
finite companion; neither is silently qualified by this source contract.
