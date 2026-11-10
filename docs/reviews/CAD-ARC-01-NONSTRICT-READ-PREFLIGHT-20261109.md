# CAD-ARC-01 read preflight and final endpoint correction

2026-11-09. SOURCE CONFIRMED / UNEXECUTED. Follow-up to product2c1d979e and
handoffa1bf4821. Independent dxf review found two actual source gaps; no
runtime failure or qualification is claimed. Root authorized these narrow fixes.

## Preflight before either read mode clears accepted source

IO.prepareSketchRead previously called validateStrictSketch only when strict
was true, then cleanUpData. Actual project.js loadSketch,
cad/sketch/inPlaceSketcher.js and sketcherBundle.ts default load paths omit
strict. A missing/unknown branch reached the new Arc.read AFTER cleanup; the
non-strict readSketchBody catch could then skip that Arc. Therefore the original
source packet's mandatory branch contract was insufficient on those routes.

The correction preserves both read modes and all unrelated policies:

- Strict reads keep validateStrictSketch before cleanup. Its existing ordinary
  object traversal still calls captureArcData; boundary Arc preflight is factored
  into validateSavedBoundaryArcBranches. Direct strict validation stays protected.
- Non-strict reads invoke the SAME canonical captureArcData on every incoming
  ordinary Arc and the SAME boundary Arc helper BEFORE parameter checks,
  high-water reservation, cleanUpData, transaction creation or model mutation.
- Missing/unknown branch, unknown Arc data fields, nonfinite points, center
  endpoints, same-ray proper and unequal-seam full source refuse at that point.
  No saved default, proximity join or full/proper inference is introduced.
- This is branch-domain preflight, not a second global strict schema. Unrelated
  legacy records and genuine NURBS boundary geometry retain their own behavior.
  Existing radius/admission/solver policies are not replaced or relaxed.
- Strict ordinary objects are not scanned twice: their capture remains inside
  the existing strict traversal. Legacy mode adds one ordinary Arc traversal;
  boundary Arcs retain the existing10000-entry envelope.

## Successful final endpoint retains relative-command semantics

The new AddArcTool.finishStep had omitted the old final pointPicked(B.x,B.y).
Tool.pointPicked updates viewer.referencePoint as well as its picked message;
without this effect the reference stayed A, changing subsequent relative input.
After a successful validated transaction, and only with the actual validOrigin,
the correction records B in the same current reference object and emits the
same picked message. Reference identity/currentness are checked before writing.
The reference is written BEFORE notifying synchronous subscribers; after that
notification there is no reference write and releaseControl rechecks the origin.
A stale/rejected/Cancel path never reaches this final accepted notification.
No new reference flag, source value, solver call or history is introduced.

Required whole regression: accepted nonempty source/history must remain intact
after actual strict AND default non-strict attempted ordinary/boundary Arc reads
with missing/unknown/invalid branch. Successful proper/full tool Finish must
leave the actual final B reference, and a subsequent real relative command must
use B. Cancel/rejection/stale ownership must retain their original criteria.
Healthy reads, native Save/Open and unrelated NURBS carry remain required.
Root owns execution; no parser, test, solver, build, Native or browser calls
were run here. Frozen historical sources/evidence are unchanged.
