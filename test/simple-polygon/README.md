# Linear polygon profile extension — Gate1 candidate

Public R4 currently refuses genuine Segment-authored triangles, rotated
rectangles and concave L profiles. The independent public baseline records
these as missing required capabilities, with source unchanged after refusal.

`simplePolygon.mjs` classifies the actual binary64 coordinates with an exact
dyadic fallback for orientation. It distinguishes crossings, boundary contact,
collinear overlap, winding, point incidence and nesting without coordinate
welding. Exact summed dyadic area is converted to a numeric measurement.
These are geometry predicates, not constraint solving or kernel validity.

`polygonProfilePlan.mjs` adds a separate explicit version3 request: straight
simple polygons and full circles, including strictly separate contained holes,
one selected region and an orthonormal placement frame. It prepares analytic
volume/bounds and detached native inputs in a Worker. Kernel clearance remains
explicit at0.0001mm for the checked edge lengths and nonadjacent boundaries,
plus its area threshold. This is not a general minimum-width certificate;
an extremely thin triangle can remain valid and be admitted. Refusals never
alter the authored coordinates.
Version2 keeps its original strict four-edge rectangle/circle contract.

Run with the qualified Node24 executable:

```sh
node test/simple-polygon/worker.test.mjs
node --test test/selected-profile-kernel/planner.test.mjs \
  test/selected-profile-kernel/source-region.test.mjs \
  test/selected-region-discovery/discovery.test.mjs
```

Observed: eleven actual Node Worker groups pass, including10,000 independently
calculated integer determinants, cancellation/subnormal controls, analytic
triangle/rotated rectangle/L fixtures, holes, winding, frames and512 vertices.
The25 existing planner/source/discovery controls also pass after the additive
capture refactor. Numerical work runs in a genuine Worker without a canvas or
browser-global shim.

This is component evidence only. General intersecting-loop arrangements, arcs,
splines, native WASM execution, public discovery/history/selection, UI, Save/
reopen and both-engine qualification remain separate work. No public polygon
support or completed Gate1 exercise is claimed from these checks. Root's native
source work is on R730 branch `feature/cad-gate1-kernel-20261106` of
`occt-interpreter-codi.git`, not a second editable design representation.
