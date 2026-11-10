# Arc dimension startup dependency repair — before changes

Root's real R6 boot diagnostic retained in
`/mnt/data10tb/codi-acad-startup-diagnostic-20261110-r6/run.log` reports
`TypeError: Super expression must either be null or a function` while evaluating
`angleAnnotation.ts`, with ANConstraints → Arc → dim in the emitted stack.
This is an observed startup failure, not a geometry failure or a passing run.
No further boot retry is authorized before a source repair and review.

The new first IO import starts this concrete eager dependency path:
IO → ArcLengthDimension → dim → Arc → ANConstraints → angleAnnotation → dim.
The last module defines annotation subclasses using exported dim base classes
before the first dim evaluation completes. The older cycle was already present;
the newly introduced dependency made its entry order observable at startup.

Structural repair: move the ONE existing Dimension constructor and unchanged
formatDimensionValue implementation into a lightweight module. dim imports and
reexports exactly those bindings. ArcLengthDimension imports that lightweight
module directly; it does not eagerly enter the legacy concrete-dimension module.
No duplicated constructor, alternate formatter, async class registration,
exception suppression or rearranged import ordering is accepted as a substitute.

SketchObject and Shape references to Viewer/Layer are type uses; make those
imports explicitly type-only so the light base cannot acquire a runtime viewer
back-edge from compiler import-preservation behavior. Keep all class behavior,
prototype identities, serialized names, measurement math and source authority.

Independent review must trace the lightweight dependency graph, confirm all
old Dimension import paths still refer to the same constructor and formatter,
and update actual source custody. Build/boot qualification remains Root-owned
and pending after source review. No tests or builds in this repair lane.

The legacy dim → Arc edge exists only to call `isInstanceOf(obj, Arc)` in
radius-label presentation. That helper compares the `_class` string and does
not use JavaScript instanceof. Share the unchanged native Arc class marker in
a pure constant module, used by both Arc.prototype._class and the exact same
presentation predicate. Removing this runtime class edge breaks the legacy
cycle itself, rather than merely avoiding one newly observed entry into it.
The predicate is not geometry/type authority; strict IO ownership remains.
