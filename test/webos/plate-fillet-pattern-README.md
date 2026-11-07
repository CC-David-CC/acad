# Fillet on a parametric plate

This browser test creates the existing five-hole OCC plate through the sketch,
constraint and feature operations, applies a 2 mm fillet to a referenced corner
edge, resizes the original rectangle, and checks corner material, all five holes,
undo/redo, and native-project reopen. It also verifies that an invalid fillet
preserves the accepted geometry and feature history. The separate Native Mesh
control checks explicit refusal without changing the mesh.

This is a bounded geometry regression, not complete CAD qualification. The
current linear and radial pattern operations copy whole bodies; they do not
implement the requested associative feature or cut pattern. A feature-pattern
operation, its provenance, independent geometry checks, and its behavior across
edit, failure and reopen remain outstanding.
