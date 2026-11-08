# Shared ordinary Ellipse implementation packet (source only)

Core base df70adfb6d2eca0dabef393db0e2758174e80bf0; Desktop base
9fd652f1b9a0d4b3a30a9b47c8e04f146ee1e177. Prepared on isolated branches.
No checks, tests, probes, TSC, build, browser or positive runtime result. Parent
owns the one coherent build and complete real application run. Historical
contract3caa379 and all other evidence/drivers are unchanged.

The existing native Ellipse/EndPoint/Param representation is authoritative:
center c, labeled semiaxes rx/ry mm, raw rotation rot radians. No major-axis
sort, normalization, Circle conversion, approximate reconstruction, extra
ellipse magnitude limit or weakened source/replay/admission checks. Equal axes
and rx<ry are legitimate. The existing>1e-9mm axis envelope is a supported
numerical domain, not a theorem that smaller positive ellipses are invalid.
Existing overall source-tree/Worker numeric/size/work bounds still apply.

New ellipseRecord.mjs is pure own-data capture shared by native strict Open,
headless carried admission and author/edit capture. Canonical and legacy
endpoint-axis native input are distinguished, not merged or stripped. Legacy
conversion matches the actual native decoder's midpoint/sqrt/atan2 operations,
including refusing a nonfinite derived constructor input. Its existing native
read path remains. This packet does not loosen exact replay equivalence to
make a legacy raw encoding roundtrip as a different source representation;
that existing public replay limitation remains explicit. Parameter editing is
canonical-only and cannot rewrite legacy source as a hidden migration.
EllipticalArc/Bezier policies remain unchanged.

Append adds Ellipse to the existing registered primitive operation. Its real
constructor owns two native objects (root+center); the existing independent
append inventory and capturedSketchEvaluation now account for that child.
All old kinds retain their counts/intrinsics/limits. This narrow shared-helper
addition and the generic client's new task branches were explicitly approved
by root during source preparation. No public raw caller identity authorizes an
owned native center or parameter.

Inspection returns bounded exact ellipses rows through a matching strict
inspectionClient capture. It preserves existing points, metadata, dimension
and constraint wires; the center is not silently added to generic coordinate
mutation authority. Actual native loaded root/center/stage/Param ownership
binds rows. Extra load/ownership work is skipped entirely if there are no
ellipses and captured once per source otherwise. Typed source mutation remains
unavailable. Returned geometry remains verified cold replay, not a claim of
bit-identical retained bytes. Semantic projection no longer clamps Ellipse
axes to1e-8; Canvas-only display behavior and EllipticalArc are separate.

The new shared edit accepts exact revision/face/root/c/rx/ry/rot. It validates
original source by genuine solve plus captured original equations/auxiliary
witness, captures real five-Param ownership, changes only requested literal
source values, validates a full candidate and a fresh second replay, and
returns the requested candidate rather than optimizer geometry. Original
constraints/classifications, unrelated source, IDs/stage/role/frame/generators,
dimensions/labels/formulas are retained. This is a geometry setter, not a
constraint deletion/readdition or generalized dependent-geometry redistribution
feature. Unsatisfied original equations or an unavailable proof refuse without
publication. A separate real Worker reconstructs the entire operation from
original source+intent; candidate membership, receipt and changed/no-op outcome
must match. Existing lifecycle/currentness, full model candidate overlay,
publication and sketch-byte journal are reused. No second state/history model.
No-op keeps original bytes and no journal entry after real source proof.
Failures preserve bounded actual code/message/admission cause, not raw stack.

Core changed seams: ordinaryEntityDomain, io strict native validation,
carriedCurvePolicy, primitiveTransition, independentPrimitiveAppend,
capturedSketchEvaluation(two-member Ellipse only), semantic projection,
closedSketchInspection/inspectionClient, new ellipseParameterTransition,
transitionClient, generic client producer/verifier routing, solveWorker dispatch,
closedSketchTransitions and one Craft method type. No rectangle/frame route,
solver arithmetic/tolerance, Native kernel, archive codec or source format edit.
Desktop changes: existing primitive-commands accepts Ellipse; existing
closed-sketch-commands registers exact edit; one public recipe uses actual
registered commands and document tokens. No index/toolbar/dialog/UI injection.

Complete prepared acceptance and independent source/archive oracle are in
`test/ellipse-public-workflow/`. The actual tiny5e-9/2e-9 case demands EXACT
observed/source axes: the50pm coordinate budget cannot hide the old clamp.
The whole workflow includes true native `.cad` Save/server-byte equality,
fresh login/Open/reedit/resave, mixed travel/no-op/refusals and healthy recovery.
Malformed own native archives derive only from a real public healthy save;
normal Open must reject before adoption. Source snapshots and producer commit
are recorded separately from compiled runtime identity. The independent Python
oracle uses the existing standalone ZIP reader plus Decimal110 analytic ellipse
math, no production solver/renderer/codec import. Derived source area/extrema
are labeled expectations, not invented kernel/canvas measurements. No positive
BRep region, tangent, solid, nanoscale physical or general UI claim.

Next: parent reviews/composes both source packets, runs the full unchanged
prepared workflow once on newly frozen runtime, freezes first failure if any,
then runs the independent complete-artifact checker after terminal success.
