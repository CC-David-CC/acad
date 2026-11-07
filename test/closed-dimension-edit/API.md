# Frozen core/desktop boundary

Core methods returned by `createClosedSketchTransitionCommands`:

```ts
editClosedSketchDimension(
  input: {revision:string;faceId:string;constraintId:string;value:number|string},
  options?: {signal?:AbortSignal;valid?:()=>boolean}
): Promise<DimensionReceipt>;
removeClosedSketchDimension(
  input: {revision:string;faceId:string;constraintId:string},
  options?: {signal?:AbortSignal;valid?:()=>boolean}
): Promise<DimensionReceipt>;
```

Exact own data fields only. Revision is nonempty <=256 UTF-16 units, faceId <=1024, constraintId <=4096. `value` is positive finite <=1e6 **canonical millimeters**, or an ASCII identifier matching `[A-Za-z_$][A-Za-z0-9_$]{0,127}` in an actual typed document resolving to a current positive length <=1e6 mm. Numeric strings and arbitrary expressions are refused. Display-unit preference does not rescale input. No caller-supplied stage/index, debug ID, source bytes or callbacks appear in this interface. Normal command names: `edit-closed-sketch-dimension`, `remove-closed-sketch-dimension`.

Existing `inspectClosedSketch({revision,faceId},options)` retains its old fields and adds `dimensionTargets`, one row per actual inspected constraint, in the same order as `constraints`:

```ts
type DimensionTarget = Readonly<{
  constraintId:string|null; stage:number; index:number; typeId:string;
  objects:ReadonlyArray<string>; unit:'millimeter'|null;
  rawValue:string|number|boolean|null; resolvedValue:number|null;
  canEdit:boolean; canRemove:boolean; reason:string|null;
}>;
```

The two supported schemas are `SegmentLength.length` on an actual authored Segment and `DiameterLength.diameter` on an actual authored Circle/Arc. A supported row has a revision-bound opaque constraintId, positive resolvedValue in mm, canEdit/canRemove true and reason null. Other rows have null locator/resolvedValue, false flags and an explicit bounded reason. `unit` is millimeter only for the two known schema fields; other schema rows use null. The stage/index fields remain diagnostic read data, not request addresses.

Typed discovery capability is `{inspection:'supported-typed-length-fields',mutations:'driving-dimension-edit-remove-only'}`. Existing typed point/append/relation/add-diameter commands remain rejected. Read-only typed discovery now reuses the actual typed-dependent length preparation instead of requiring both original rectangle dimensions to remain present.

```ts
type DimensionReceipt = Readonly<{
  changed:boolean; faceId:string; revision:string;
  dimension:Readonly<{
    constraintId:string; action:'edit'|'remove';
    typeId:'SegmentLength'|'DiameterLength'; objects:ReadonlyArray<string>;
    rawValue:string|number|null; resolvedValue:number|null;
    status:'accepted'|'redundant'|'removed';
  }>;
  persistence:'volatile-workspace'; authoredUndo:boolean;
  manufacturingAssignments:'unchanged'|'review-if-present';
}>;
```

Edit rawValue is the actual retained raw constant (normally a string); resolvedValue is actual solved geometry in millimeters. Remove returns both null and status removed. No-op uses changed false, unchanged revision, authoredUndo false, exact original source bytes and unchanged manufacturing assignment status. A real edit/removal uses the existing sketch-bytes authored journal and prepared full replay. Rediscover after any edit/removal/Open; locators are not permanent saved identities.

Errors preserve the existing normal closed-sketch contract. Invalid arguments/current typed units produce a pre-publication error; stale/cancelled/source/host/quantity supersession uses AbortError with committed false. Known post-publication lifetime loss has committed true. Worker errors include INVALID, LIMIT, INVALID_TARGET, INVALID_VALUE, DIMENSION_REJECTED, INTENT_CHANGED, UNSUPPORTED, RESIDUAL, CURRENT_GEOMETRY_MISMATCH and ADMISSION_CHANGED; existing solver/replay codes and dimension-aware quantity failures also propagate. A rejected constraint includes the actual solver admission cause when available. Neither numerical nonconvergence nor an unsupported domain is reclassified as a proven contradiction.

Root owns the two optional Craft interface aliases and desktop registrations. No Craft implementation/journal, selected-region descriptor, native format or product UI file is edited in this lane.

Candidate verification independently recomputes the entire requested transition in its second Worker and compares complete native state, including every object's geometry. Solver-valid unrelated free-loop movement is refused. Typed journal travel proves the complete pair by reproducing at least one forward direction (edit or removal); this permits genuine Undo of an underconstrained nonlinear edit without assuming numerical inverse solves are reversible.
