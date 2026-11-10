# Arc dimension dependency repair — source only

The retained R6 boot exception is documented in the BEFORE file. This repair
has not been compiled, booted or runtime-qualified. The observed original
R6 app, receipt, stack and contexts are untouched.

## Structural changes

1. `dimensionBase.js` now owns the ONE original Dimension constructor and the
   unchanged formatDimensionValue function. `dim.js` imports and reexports those
   same bindings. Existing viewers, annotations, IO and subclasses continue to
   share constructor/prototype identity; there is no duplicate fallback base.
2. ArcLengthDimension imports that lightweight base/helper directly. It no longer
   eagerly loads all legacy concrete dimensions merely to define its superclass.
3. `arcClass.mjs` owns the unchanged string `TCAD.TWO.Arc`. Arc.prototype._class
   uses it; dim's radius-label predicate uses exactly the same `_class` equality
   that `isInstanceOf(obj, Arc)` previously performed. The concrete dim module
   therefore no longer imports the Arc class/ANConstraints graph at all. This
   removes the original dim → Arc → ANConstraints → annotations → dim cycle for
   every module entry order. The predicate remains presentation-only; source
   ownership, strict IO, branch semantics and math are unchanged.
4. SketchObject's Param/Viewer/Layer/SolvableObject imports and Shape's Viewer
   import are explicitly type-only. The new base cannot accidentally acquire a
   runtime viewer back-edge through preserved type imports.

The lightweight base's runtime dependencies are SketchObject and the pure
unit formatter. SketchObject depends on Shape, ID generation, mutation epoch,
styles and the generic icon (React/SVG); it does not depend on Arc, dim,
ANConstraints or annotation subclasses. The Arc ruler's other imports are the
text helper, math-only Arc interval/domain modules and this base. The ordinary
concrete dimensions retain their existing class names, prototype identity and
serialization markers through the reexported base.

## Review and closure

The Arc acceptance producer roster includes dimensionBase.js, arcClass.mjs,
Arc, SketchObject and Shape in addition to its original files. Root must bind
these new actual inputs in the next assembled candidate as well; passing old
pin metadata cannot certify new bundle inclusion or boot behavior. No Native
WASM or manufacturing geometry dependency changed in this source packet.

Independent review should confirm the actual dependency break, exact formatter
and constructor identity, unchanged Arc marker semantics, no hidden lazy-class
registration, and fresh build input closure. Root owns the next coherent normal
build and grouped boot/workflow. Source review alone is not a repaired-runtime
claim; both prior failed boot artifacts remain failed evidence.
