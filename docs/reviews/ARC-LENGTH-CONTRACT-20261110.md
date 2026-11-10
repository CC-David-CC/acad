# Arc length measurement contract — before implementation

This packet is source-only. No tests, build, runtime qualification or public
capability is claimed. It concerns finite ordinary circular Arcs already owned
by the sketch model, with its authored `proper-ccw` / `full-ccw` branch. It does
not cover ellipse, spline, compound-path length, generated Arcs or arbitrary
interval trimming. These remain distinct requirements.

## Mathematical meaning and units

The measured length is `L = radius * sweep`, in canonical millimeters. Radius
is positive; sweep comes from the current authored center/endpoints and branch
via `requireArcInterval`. Proper arcs have `0 < sweep < 2π`; full arcs have
exact seam equality and sweep `2π`. No decimal truncation or near-full flag is
introduced. Existing geometry-domain floors and numeric residual tolerances
remain unchanged. Unknown or unrepresentable intervals are explicit failures.

A driving `ArcLength` equation has one actual Arc target and one positive
length-valued constant named `length`. Reference length is derived, consumes no
DOF, and never creates a synchronized equation or a persisted measured value.
A reference ruler must target the actual Arc ID rather than its endpoint chord.

For proper arcs the existing solver uses periodic angle auxiliaries. At
polynomial collection derive an ephemeral integer chart `k` from the current
original interval and angle parameters. The equation is
`r * (angleEnd - angleStart + 2πk) - length = 0`.
Its derivatives are `(sweep, -r, +r)`. The chart is not persisted and does not
carry geometry authority. Full-arc length uses `2πr - length = 0`, derivative
`2π`. The original-equation residual verifier independently recomputes radius
and sweep from actual endpoint geometry, so a converged solve on a wrong chart
cannot pass merely by satisfying the solver's lifted polynomial. Existing
ArcConsistency verifies auxiliaries and actual endpoint positions.

## Shared lifecycle and state rules

Discovery must authenticate real owned Arc/stage membership, current revision,
branch and unique driver/ruler. UI and agent use the same operation. Create a
reference ruler without changing geometry. Promotion adds one equation only
when it is admitted without changing the captured shape; an explicit driving
edit may change supported geometry. Demotion removes the equation while
retaining its ruler. Removing a reference removes only that ruler. Never remove
a driving equation by deleting a label. Existing driver edit/remove targets are
revision-scoped source locators, never synthetic stable constraint IDs.

Preparation, solver admission and verification run in the sketch Worker.
Publication uses the existing source-bytes transaction/history path. Rejected,
stale, contradictory, unrepresentable or uncertain outcomes preserve the last
valid document; unknown mutation settlement retains ownership. Undo/redo and
native Save/fresh Open retain Arc branch, equation, ruler linkage and typed
parameter intent. No separate human/agent document or bypass is introduced.

## Required integration before advertising public support

1. Core schema, strict source signature and original geometric residual policy.
2. Arc-specific native ruler data/IO and derived role presentation. LinearDimension
   currently names two Points and measures a chord; it cannot be relabeled.
3. Strict bounded intent/reply capture and Worker producer/verifier supporting
   Arc targets. Current length rows name `segmentId` and are Segment-only.
4. Shared command discovery/create/role conversion, edit/remove, currentness,
   history-delta verification and ordinary human action.
5. Source resources, archive validation and producer-roster closure.
6. One grouped workflow: minor/major/cross-atan2-seam/full arcs, radius/sweep
   changes, typed units, redundant/contradictory demands, degenerate and
   unrepresentable intervals, role conversion/remove, both history directions,
   save/fresh-open and independent source-derived length checks.

No passing Segment ruler workflow or radius dimension implies ArcLength PASS.
No Gate 1 requirement is removed by this packet's bounded implementation scope.
