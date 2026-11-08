# Ordinary Segment driving/reference lengths — source checkpoint

Status: implemented source, **not executed, compiled, qualified or deployed**. Base is ACAD `8a79bde127bdca9333a6c08c0ca415aec0816e9e`. Parent must compose the complete application and execute the complete public workflow before accepting this slice. Existing orientation/length/Native failures are not changed or retagged by this work.

## One model and native intent

A persistent ordinary ruler remains the existing native `LinearDimension` record `{id,type,data:{a,b,offset}}`. The record contains actual endpoint IDs and layout only. Role and measurement are derived from the actual Segment and its actual `SegmentLength` membership. No role flag, synchronized value, UUID schema field, dormant formula, copied geometry or second history is introduced.

* No matching driver means reference; exactly one real admitted driver means driving. Duplicate drivers/rulers and generated/unowned targets are explicit refusals.
* Converting reference to driving appends one actual `SegmentLength` with explicit positive finite literal millimeters in `(0,1000000]`; it keeps the ruler.
* Converting driving to reference removes that exact actual equation and keeps the ruler. If there was no ruler, the coordinator privately allocates one normal native ruler ID, returned on success. Undo removes that first-created record; Redo restores the same ID.
* Existing ruler endpoint order and offset stay exact. Constraint locators are discovery addresses under the inspected source revision, never persistent IDs. Callers submit no new identity or stage/index override.
* A conversion changes no original object coordinate or other authored object field. Full-candidate cold admission and captured-coordinate validation still prove all original equations and actual ownership. A cold result is proof, never replacement geometry. Its fresh classifications are retained explicitly; no numerical failure is called an inconsistency.
* The independent second Worker reconstructs from the unchanged original source, exact original intent and private allocated ruler ID. A finite unrelated geometry change cannot pass by merely solving the candidate.
* Formula/identifier-bound driver conversion is explicitly refused (`BOUND_DIMENSION`); editing formulas and typed role mutation remain outside this first slice. Read-only typed discovery can derive current values using the existing typed-length external bindings; it advertises mutations as unsupported.

## Public core methods

`inspectClosedSketchMeasurements({revision,faceId}, options)` returns:

```
{revision, faceId, unit:'millimeter', presentationRevision,
 measurements:[{segmentId|null, measurementId|null, constraintId|null,
   role:'reference'|'driving'|'unresolved', canonicalValue:number|null,
   unit:'millimeter'|null, canCreate:boolean, canConvert:boolean, reason:string|null,
   display:normal formatDisplayQuantity result|null}],
 mutations:'ordinary-segment-literal-only'|'unsupported-typed',
 referenceValues:'derived-from-current-endpoints', persistedRole:false}
```

`createClosedSketchLengthMeasurement({revision,faceId,segmentId}, options)` creates a ruler on one current ordinary Segment, or validates a no-op when the single existing ruler already covers it. A current literal driving Segment can receive a ruler without removing its equation.

`convertClosedSketchLengthRole({revision,faceId,target,role,...}, options)` takes an exact `target:{measurementId}` or `target:{constraintId}`. A driving request requires `value:number`; a reference request must omit it. No supplied stage/index, numeric measurement or source bytes are accepted. Same-role requests are validated no-ops; an already-driving different value explicitly requires the normal driving-dimension edit.

Mutation receipt matches the normal source command contract:

```
{changed, faceId, measurement:<canonical row without display>, revision,
 persistence:'volatile-workspace', authoredUndo:changed,
 manufacturingAssignments:'review-if-present'|'unchanged'}
```

All methods use the existing captured source face/frame, document generation, services, storage version, history, material, readiness and caller lifetime fences. Presentation is separately captured/rechecked through final formatting; canonical source revision does not become a global units preference. Read metadata is bounded to 1024 rows and 64KiB; native source/equation/evidence limits remain unchanged. This is a bounded read-operation limit, not a new native Save/project limit.

## Shared editor preparation and presentation

`actions/lengthMeasurementPreparation.js` owns actual Segment/ruler/equation matching and transactional admission used by both the existing editor gesture and the new Worker. The ordinary editor still uses its existing synchronous viewer checkpoint. This patch does not claim that legacy viewer checkpoint is the modern full-part authored journal, or that the existing active-editor transport is interchangeable with the new guarded closed-source commands.

The modern commands use the existing `sketch-bytes` journal and full-history prepared replay. No journal implementation, PM, IO, Native, algorithm/reduction, engine identity, build policy or source format is edited. Craft changes are only three optional method types; its existing `Object.assign` installs returned closed-sketch commands.

`LinearDimension` presentation derives reference parentheses from actual current driver membership. An actual corresponding solver length annotation is suppressed when the persistent ruler already displays the admitted driver, avoiding two texts for one length. Other reference/annotation schemas keep their previous semantics; names such as legacy `DiameterDimension` do not imply conversion support. Actual canvas paint/human gesture delivery remains unqualified until observed; a formatter result alone is not paint evidence.

## Source files and graph

New source modules:

* `web/app/sketcher/actions/lengthMeasurementPreparation.js`
* `web/app/sketcher/actions/lengthMeasurementPresentation.mjs`
* `web/app/sketcher/headless/lengthMeasurementIntent.mjs`
* `web/app/sketcher/headless/lengthMeasurementTransition.ts`
* `web/app/sketcher/headless/lengthMeasurementClient.ts`

Narrow existing seams: `lengthMeasurementRoles.js`, `dim.js`, `annotations/angleAnnotation.ts`, `headless/client.ts`, `headless/solveWorker.ts`, `cad/craft/closedSketchTransitions.ts`, and the three CraftService type lines. New imports are normal bundled sketch-worker/application sources, not verbatim Native bootstrap modules; no hardcoded Native/bootstrap pins are changed or claimed unchanged after a build.

The separate Desktop packet adds `apps/system/jsketcher/length-measurement-commands.mjs` plus `test/length-measurement-public-workflow/{driver,oracle}.mjs` and contracts. Parent receives an exact index registration splice rather than an overlapping index edit.

## Full acceptance to execute after integration

The complete driver authors one actual anchored 100×50 rectangle and unrelated Point, then a current discovered 20mm extrusion. It first creates a ruler while retaining the original width driver, then converts that driver to reference, moves four actual right-corner point IDs to120, converts the same ruler back with literal120, uses the existing driver editor to127, inspects inch presentation as5in, and traverses the entire mixed source-edit plus ruler-creation journal both directions. It checks exact role-only geometry, original source intent/classifications, unrelated Point, counters, IDs, native prism metrics and actual read-only point queries.

It then saves a reference120 source normally to My files, awaits server sync, fresh Opens, changes source to125, converts to driving125, edits127, travels, resaves/fresh Opens, reedits130 and saves. Saved native editable JSON bytes are independently checked; this packet deliberately uses the currently supported `.jsketcher.json` route and does not claim the separately developed `.cad` archive path. Pending writes must settle before owned context cleanup.

Refusal controls cover stale discovery, unknown actual ruler, attempts to use conversion as a different driving-value edit, contradictory point movement, and exact accepted-state preservation. Only the real coordinate failure `COORDINATE_CONFLICT` is expected for that conflicting edit; a numerical/transport failure is not accepted as an equivalent contradiction. Formula/typed/generated/schema boundaries remain explicit; this single ordinary workflow does not qualify all those domains or all Gate1 competencies.

Source review correction: the first6021 checkpoint attached an own `admissionCause:undefined` to cause-less cold-solve failures. The follow-up uses the shared `withAdmissionCause` only for a present valid diagnostic and captures the final cause once. This preserves the original failure code/message without treating absence as invalid metadata. It is a source-review fix, not an executed failure/recovery claim.

Source review resource correction: display-manager/formatter inspection now starts inside the job try/finally, so a throwing presentation inspection cannot leak a job captured just before it. This is source ownership review, not a reproduced public incident or measured cleanup proof.

Independent receipt contract follow-up: the second Worker now strictly captures the first Worker's bounded canonical measurement row/list in addition to candidate bytes and independently compares both against its original-request reconstruction. Exact candidate source alone did not bind the first receipt's ruler/role/value/constraint locator. No numeric residual-array equality is required; normal residual/domain validation stays in place. This closes a source-review verifier-contract gap, not a reproduced public corruption claim.
