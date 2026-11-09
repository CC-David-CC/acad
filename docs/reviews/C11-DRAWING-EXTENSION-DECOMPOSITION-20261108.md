# C11: bounded extensions to the linked part drawing

Source review/proposal only, based on Core d02bed7e0447aae68d5333b3644c180f500e1210
and Desktop78cc1694eca1a88623f33e7ff748673c909a6017. No product/UI changes,
execution, tests, probes, build, runtime calls or status changes.

The finite requirements are Desktop
research/cad-gate1-qualification-plan-20261106/COMPETENCIES.md, C11, and Core
[GATE1-FINITE-CLOSURE-AUDIT-20261107.md](GATE1-FINITE-CLOSURE-AUDIT-20261107.md#c11-drawings-manufacturing-and-exchange).
Human authoring UI redesign is deferred; shared authoring operations and
viewable actual outputs are required. No assembly/BOM scope is restored from
Gate2, and no universal drawing-standard certification is implied.

## Existing authority and accepted proof

Ordinary E22 remains accepted: test/drawing-reference-repair-public-workflow/
QUALIFICATION.md and evidence-r5, actual Corebaf95ccae09b915f1038286e01a674fb3a7fa6f2/
Desktop78cc1694eca1a88623f33e7ff748673c909a6017. It proves three linked
orthographic views/six reference dimensions, two datums, actual model edits,
explicit unresolved-reference repair with immediate UndoRedo, six current.cad
cycles and twelve SVGs. This proposal neither replaces that proof nor promotes
it into the additional C11 cases.

Current production seams, not the older proposed API in
test/linked-part-drawing-plan/CONTRACT.md:

- modules/drawing/linkedPartDrawingDefinition.mjs and .d.mts capture exactly
  version1/mm, one target producer/build, one source datum, one sheet scale,
  1..3 unique top/front/right views in canonical order and 0..16 dimensions.
  Five kinds: source-distance, plane-distance, edge-length, hole-diameter,
  hole-offset. No view crop, section, isometric, centerline, group or annotation
  field is admitted. CenterHole is explicitly slot:center.
- linkedPartDrawingOperation.mjs prepares create/replace/remove and retains exact
  before/after definitions in domain linked-part-drawing of the existing
  document-metadata journal. Version1 is operation-envelope version, not a new
  independent geometry document.
- web/app/cad/projectManager/projectManagerBundle.ts owns drawingJob,
  applyLinkedPartDrawingOperation, travelLinkedPartDrawingMetadata and
  stageDrawingPublication. Existing manager/document/geometry/source/material/
  presentation captures and metadata commit custody must remain authoritative.
- projectManager/projectEnvelope.mjs and projectValidationCore.ts retain one
  definition in the drawing-bearing v3 envelope; actual .cad wraps that payload.
  Schema validity and current reference resolution are separate. Valid unresolved
  intent must still Open/Save without replacement geometry or reference healing.
- web/app/cad/craft/workerDrawingReadCommands.ts captures the actual full-tip
  history, source bytes/frames, registry producer, build, Native metrics and
  document lifetime. It requires a current unplaced, valid single solid.
  solidLedger.mjs readCandidateWorkerDrawing reconstructs a private candidate,
  authenticates the producer/owner/build, corroborates Native metrics, and invokes
  solid.drawing.references.read followed by solid.drawing.orthographic.read.
- modules/engine/mount/drawingReferenceFacts.mjs resolves actual source endpoints,
  current private selection keys and authenticated finite center-hole cylinders.
  cylinderCutWitness.mjs supplies surviving cut-cylinder lineage, not caller
  flags or nominal radius alone. HLR fragments remain response-local.
- ownedOrthographicReadProtocol.mjs already accepts an orthonormal frame.
  Native HLR JSON <=4MiB is read in <=64KiB chunks and decoded in Worker;
  packed analytic curves travel as bounded binary buffers with <=64KiB metadata.
  This is not permission to send 4MiB JSON to the main/UI thread.
- web/app/cad/export/workerLinkedDrawingSvg.ts transfers the actual observation
  to the encoder Worker; linkedPartDrawingSvg.mjs renders lines/conics and
  reference annotations. It uses one sheet-wide scale. SVG curve approximation
  is presentation only. My files export is Desktop drawing-export-command.mjs.
- Desktop drawing-commands.mjs registers inspect/create/replace/remove-linked-
  part-drawing. Existing public schemas explicitly advertise only current kinds.
  Human and agent callers should invoke these same operations; no new private
  successful setter or independent annotation journal.

## Finite missing semantics and implementation cuts

| Required case | Actual missing seam and bounded implementation | Truth/refusal boundary |
| --- | --- | --- |
| Isometric | Add an explicit isometric view variant, source-datum-derived right-handed orthonormal frame and schema/type/host admission. drawingReferenceFacts currently maps any admitted view only to top/front/right. Extend it deliberately; keep ledger on the existing frame-based HLR operation and encoder on actual analytic records. Four views requires an explicit bounded definition/response limit extension. | No new Native API is inherently required for a nonperspective isometric frame. Model dimensions remain physical, not foreshortened image lengths. Never silently treat an unknown basis as right view. Perspective/arbitrary-camera input stays unsupported in this slice. |
| Center section through a bore | Add a source-relative authored section-plane reference/placement, cut direction and hatch intent. Implement a new owned Native section observation over a private copy, with actual intersection/remaining-face classification and analytic section contours; bind its private reader/protocol/ledger result to the same reconstructed target. | Existing HLR projects the whole solid: it does NOT compute a section. Drawing a line or hiding projected curves is not section geometry. No persistent cut feature/body/name or changed part is needed. BRep/tolerances/catalog must remain unchanged. Reject unsupported curved/nonmanifold or ambiguous section domains explicitly; never infer cut material from the display mesh. |
| Detail2:1 | Add a detail view referring to a parent view and a bounded source-linked focus plus rational paper scale. Worker clips the parent's actual analytic projection intervals to an admitted detail aperture; renderer uses that view's scale and boundary. | Current sheet scale can scale an entire sheet but cannot express a linked detail. A cropped screenshot is not the derived analytic view. For an initial circle/line plate family, exact line/conic parameter clipping is bounded; spline intersections remain explicit unavailable until supported. Nominal Ø4 remains4mm while sheet geometry doubles. |
| Centerlines/marks | Add authored annotation references to qualified hole/axis witnesses and bounded paper extension/placement. Extend private finiteCylinder-derived facts to expose the independently authenticated finite axis/center anchors needed by the consumer. | Current diameterAnchors/intersection support the center-hole slice; do not substitute nominal feature positions for final wall membership. E09 four bores need actual per-slot cylinder lineage first. Axis projection to a point yields a center mark, not an invented long line; face-on/edge-on cases are explicit. |
| Baseline/ordinate groups | Add a group that names actual datum/reference targets, axis, display role and paper placement. Derive every member from one current authenticated source frame and each resolved bore center; save no measured arrays. | Required initial X10/90 and Y10/40 become X10/140 and Y10/20 after100x50→150x30. Current hole-offset returns magnitude; it must not be repurposed as signed ordinate without a separate explicit signed projection fact. Datum is actual source origin/axes, never rectangle minima. Negative/transformed datums need the same frame arithmetic. |
| 4×Ø4 THRU, separate centerØ10 | Generalize semantic hole reference from current center-only slot to explicitly discovered actual four-corner slots; extend construction/Boolean/treatment witness propagation and finite through-extent proof per bore. A group references four exact witnessed members; derive count and common diameter, prove through state against actual caps. | Do not parse IDs or derive count from a label/feature name. Four nominal tool parameters, an equal-looking cylinder, or a Boolean sourceContexts entry do not prove four surviving through bores. Unequal/split/missing/ambiguous members produce an unresolved callout, not a fabricated shared Ø4. CenterØ10 remains independently referenced. |
| DatumA/B/C and position⌀0.20|A|B|C | Add typed annotation definitions: three named datum features referencing actual eligible plane selections/source datum semantics, a target witnessed hole/group, tolerance0.20mm, and ordered datum references. Resolve membership/orientation in Worker from current target lineage, not Native ordinals. | This is authored manufacturing tolerance intent plus resolved model targets, NOT measured manufacturing conformance or automatic datum-simulator/GD&T analysis. Initial datum planes/axis must be eligible and unambiguous. Unsupported modifiers, datum feature types and standards-specific constructions refuse explicitly instead of silently reducing to simple text. |
| FinishRa3.2µm | Add an authored roughness annotation with numeric3.2 and explicitµm semantics (canonical physical value0.0032mm), linked to an actual eligible current surface. Preserve its parameter designation and unit for presentation. | BRep smoothness is not a measured Ra. Report authored requirement, never claim actual finish from tessellation or Native analytic type. Invalid/missing surface remains unresolved. |
| Fit clearance0.005..0.035mm | Add typed fit/limit intent targeting actual resolved Ø10 dimension(s): hole deviations0..+0.015mm, shaft−0.020..−0.005mm. Derived interval is min10−9.995=0.005mm, max10.015−9.98=0.035mm; recompute from nominal+deviations, never store a synchronized clearance result. | Link the actual eligible model dimension and explicitly distinguish the paired authored mating-limit requirement from an observed second body. The finite limit example does not by itself demand an assembly or second solid. If an actual own shaft is included, current single-target/center-hole-only observation cannot authenticate it without a new positive-cylinder/second-producer reference contract. A declared shaft limit is not proof of shaft geometry. Do not invent ISO fit-table lookup or physical fit/conformance. |

These are concrete schema/reader/consumer gaps, not missing menu labels.
Isometric and detail reuse projection data; section requires additional Native
geometry. Annotation presentation alone cannot close missing target provenance.

## Shared implementation shape and ownership

Keep one authored definition in the current native document, with a new explicit
definition version for additional variants. Preserve version1 admission and
interpretation byte-for-byte; the existing drawing-bearing envelope need not
become a second file/format authority. No historical migration is proposed.
Old readers must reject unsupported definition variants rather than silently
dropping them. Update actual validation Worker, manager capture/restore/save,
.cad hashing and outer public schemas together before enabling the new version.
Do not enable a codec that the manager/host then discards.

Use existing create/replace/remove operations and document-metadata travel;
view/annotation changes are one atomic metadata edit with both document and
geometry revisions. A model edit changes geometry revision; observations are
derived on demand. Save records references/requirements/layout only, not HLR
curves, values, Native handles, temporary section bodies or cached status.
Unsupported structurally valid references may persist unresolved; malformed
definitions fail admission before replacing accepted state.

Exact owning source groups for a later approved packet:

1. Definition/type admission: modules/drawing/linkedPartDrawingDefinition.mjs,
   .d.mts, and linkedPartDrawingOperation.mjs only where a new version affects
   exact request/retained charge. Add a small variant-capture helper if needed,
   not a generalized drawing framework.
2. Shared metadata custody: projectManager/projectEnvelope.mjs,
   projectValidationCore.ts, projectManagerBundle.ts and its existing metadata
   Worker/client path; retain current manufacturing and presentation saves.
3. Reference/geometry observation: drawingReferenceFacts.mjs,
   cylinderCutWitness.mjs as justified by actual witness domains,
   ownedDrawingReadProtocol.mjs, workerDrawingReadCommands.ts,
   solidLedger.mjs readCandidateWorkerDrawing and narrow SolidKernel types.
4. Native section only: a new owned section read/protocol/private chunk lease;
   existing mount/controller/bootstrap/catalog/stagers must bind the actual
   new Native pair. No default/kernel fallback or old-cohort capability flag.
   Isometric need not change Native bytes but does change shipped source.
5. Consumer: linkedPartDrawingSvg.mjs, workerLinkedDrawingSvg.ts and the actual
   controlled export Worker dispatch. Keep parsing, projection clipping,
   annotation arithmetic/layout and SVG construction in Workers.
6. Desktop drawing-commands.mjs schemas and same manager calls; retain
   drawing-export-command.mjs/My files settlement and existing exact errors.
   No human editing UI redesign. A viewable SVG is an actual consumer output.

Retain the64KiB definition/request/observation metadata and existing source/
history/resource/currentness/cancellation limits. Raising views beyond3 is a
specific admission change, not a blanket native/metadata cap increase: budget
each view's <=8192 fragments/819200 packed bytes and the aggregate transferred
buffers before allocation; all decoded geometry stays Worker-side. Current
60s observer/30s encoder bounds cannot be claimed adequate for more views
without the later whole run. Refuse an over-budget view/result truthfully,
release every temporary lease and never publish partial new authored metadata.

## Smallest next vertical workflow: actual linked isometric view

Implement ONLY a fourth explicit source-relative isometric view through the
same public definition replacement/J, Native frame projection, .cad retention
and SVG consumer. Preserve original top/front/right and all six dimensions.
No section, detail or new annotation claim follows it.

Freeze a deterministic right-handed source-relative frame in the implementation
contract, rather than persist solved axes. One valid convention is
u=(x−y)/sqrt2, v=(−x−y+2z)/sqrt6, n=−(x+y+z)/sqrt3; u×v=n.
The sign convention must be labeled and used unchanged by Native/renderer/
oracle. Orthographic isometric is not perspective. The analytic oracle derives
the frame from the actual saved source basis and all eight plate vertices:
a principal axis edge projects to length L sqrt(2/3); a datum-plane circle
projects to an ellipse with semiaxes r and r/sqrt3. No generated HLR fragment
ID or precomputed picture is authored as model truth.

ONE later whole workflow: public ordinary plate+center/four bores, existing
drawing→replace adding isometric→immediate Undo exact old definition/IDs and
Redo exact new one→actual width/depth/hole edits and unchanged nominal
dimensions→unresolved authentic reference/explicit repair travel→three normal
.cad/server-equality/fresh signed Open/reedit cycles and real My files SVGs.
Read-only observations must preserve H/source/IDs/counters/J/material/dirty/
presentation. Independent AFTER-WHOLE archive/analytic/source/SVG analysis
corroborates the real projection and units; source alone is not PASS.

Then close explicit finite cuts in order: center witnesses/marks plus four-bore
baseline/ordinate/callout; detail2:1; owned center-section; typed datum/GD&T/
finish/fit annotation+target coverage. Each is a coherent shared workflow, not
a catalogue of menu labels or a reason to relabel accepted E22 as incomplete.
Fit's exact model-target versus declared mating-limit contract must be fixed before that final packet; do not add an assembly requirement.
