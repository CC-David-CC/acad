# Minimal missing Euclidean point-distance operation — proposal only

No production changes are authorized or made here. Source inspected at ACAD97352a8:
`web/app/sketcher/constr/ANConstraints.ts` DistancePP; `headless/solve.ts` original
schema/domain admission; `headless/localJacobian.mjs`; `headless/solveWorker.ts`;
`cad/craft/closedSketchTransitions.ts`; current Desktop
`apps/system/jsketcher/{closed-sketch-commands,diagnostic-commands}.mjs`.

## Existing mathematical authority / public gap

DistancePP already exists in the genuine shared constraint system. Its original
polynomial is `(qx-px)^2+(qy-py)^2-distance^2=0`, with finite nonnegative distance.
At distinct valid Point objects with identical coordinates and distance=0, that
row's gradient is exactly zero. The production diagnostic deliberately returns
zero-gradient/unknown contribution, not a physical freedom certificate. Separate
real Worker/service proofs are in `test/solver-stage-{diagnostics,service}`.

Public `apply-closed-sketch-signed-distance` authors SignedDistanceX/Y/Projected,
not DistancePP. Midpoint, coincidence, concentric, a zero-radius Circle or a
collapsed Segment have different equations/domains. No public arbitrary-constraint
import or generic add-group call is advertised. There is no truthful way to author
the component's singular DistancePP source through the current command list.

## Proposed finite shared API

`apply-closed-sketch-point-distance({revision,faceId,ids:[pointIdA,pointIdB],distance})`
delegates to `craft.applyClosedSketchPointDistance(args,{signal,valid})` through the
existing closed-sketch source transaction and sketch-bytes journal. Own exact
data, two unique discovered IDs, same current source/stage initially, finite
canonical mm distance in [0,1e6]. Two distinct valid Point objects may coincide;
zero is a legitimate requested distance, not invalid entity geometry. No caller
coordinates, equation strings, source JSON, schema IDs, feature allocators or
native handles. Current inspection already supplies actual Point IDs/stages.

Use the real `addConstraintGroup` / DistancePP schema exactly once and the existing
full solve → original-domain/residual validation → independent original-request
reconstruction → prepared shared replay/publication path. Preserve ordered source
refs/constants/membership; Euclidean meaning is symmetric but the operation must
not silently replace/reorder a prior authored record. Exact existing same pair /
same distance is a no-op; any contradictory request preserves the accepted source.
Return actual final solved admission, not an incremental precursor classification.

Proposed reply follows current scalar transition receipts:
`{changed,faceId,revision,unit:'millimeter',authoredUndo,persistence:'volatile-workspace',dimension:{typeId:'DistancePP',objects:[...],value,resolvedValue,status}}`.
An actual discovered locator can additionally use the existing driving-dimension
edit/remove interface after explicitly adding DistancePP's nonnegative domain to
that schema. Its zero must not loosen positive SegmentLength/DiameterLength.
No second Undo stack or persisted diagnostics are needed.

## Bounded source ownership for later approval

* NEW `web/app/sketcher/headless/pointDistanceTransition.ts`: exact request,
  genuine model operation, final admission and independent replay verification.
* Narrow task/reply routes in `headless/{solveWorker.ts,client.ts}`; preserve their
  existing transport/lifecycle contracts. Reuse current source/plane capture.
* Narrow `cad/craft/closedSketchTransitions.ts` and Craft method/type registration
  for this new transition only; existing source submission/journal remains owner.
* Narrow `headless/drivingDimensionTarget.mjs` and scalar transition admission
  only if edit/removal is included: DistancePP.distance allows zero, while other
  families keep exact current domains. Reuse opaque locator capture; no ordinal.
* Desktop `closed-sketch-commands.mjs` command metadata/admission and optional
  on-disk example. No project format, PM, native BRep, provider, catalog or defaults.
* NEW complete public workflow/oracle; no component surrogate called public proof.

No existing product file is reserved or edited by this proposal. Root coordinates
the shared Craft/solver/adapter owners before any implementation.

## Complete acceptance after coherent implementation

1. Genuine empty plane + two separately appended Points at (0,0); DistancePP=0.
   Both entities remain valid, row retained with final admission; report must
   expose the actual original zero gradient and unknown ordered contribution.
   With two same-stage points, local tangent nullity4 is not physical DOF: finite
   solutions require p=q and have two common-translation coordinates.
2. Ordinary nonzero Points (0,0),(3,4), distance5; actual original residual,
   analytic length5, positive edit and shared UndoRedo. Distinct IDs persist.
3. Independent contradiction: retain distance0 and request distance1 on same pair.
   p=q cannot have length1; preserve last valid document. Keep actual rejection
   cause separate from this exact fixture proof.
4. Genuine singular seed with requested positive distance: record real acceptance
   or real typed numerical/uncertain failure. Positive distance is mathematically
   satisfiable, so convergence failure cannot establish impossibility. Do not
   force failure or promise this is a reproducible nonconvergence fixture yet.
5. Normal Native Save/server sync/fresh Open/reedit/resave; exact source IDs,
   constants, prior unrelated coordinates and current service report. No saved
   Jacobian/diagnostic/native ordinals. Failed requests add no journal entry.

Numeric failure taxonomy remains current: exact-reduced-row algebraic cause,
approximate reduction, original residual, invalid domain, numerical convergence,
nonfinite result, resources and retained validation are distinct. A new public
distance operation is not a universal nonlinear solvability or physical-DOF fix.
