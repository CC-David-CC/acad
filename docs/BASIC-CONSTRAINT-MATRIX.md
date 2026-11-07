# Basic sketch constraint qualification

This is a living evidence table for the integrated WebOS research branch.
“Tested” names the specific exercised case; it does not imply full numerical,
degenerate, branch, accessibility, phone, network or durability coverage.

| Capability | Current evidence and limit | Status |
| --- | --- | --- |
| Coincidence | Actual solver cyclic, redundant and external-stage tests; no complete rendered edit/undo matrix yet. | Partial |
| Horizontal / vertical | Rendered commands align initially angled segments without collapsing them; strict sketch reload retains their relations. Underconstrained lengths moved during solve, so users must dimension length to fix it. | Partial |
| Parallel / perpendicular | Found wrong radians/degrees branch selection. Rendered commands now preserve same/opposite parallel and ±90° perpendicular geometry; strict sketch reload preserves data. Unit tests check branch boundaries. More edits, contradictions and undo remain. | Partial; fix in this branch |
| Segment length / radius | Solver rejects nonpositive, blank, nonnumeric and nonfinite values while accepting a resolved positive named constant. Rendered radius dialog rejects -5 without changing geometry, then applies 10 via Enter. Full parameter edits and persistence still need qualification. | Partial; positive-domain fix in this branch |
| Diameter | Existing measurement presentation is not a dedicated qualified driving diameter constraint. | Unsupported as a qualified driving command |
| Point distance / tangency | Existing schemas; finite versus supporting-domain and branch semantics need explicit testing. | Untested |
| Equal length / equal radius | Existing schemas; independent editable/persistent examples still needed. | Untested |
| Midpoint | Actual-solver equations, conflict/redundancy, point-on-line compatibility and repeated solves pass; no full rendered geometry workflow yet. | Partial |
| Point lock / conflicts | Rendered Lock dialogs reject contradiction without moving the point; saved priority/backlinks survive native project reopen; removing winner reactivates other lock, then drag tool moves released point. This uses a test host/loopback, not an account server. | Partial |
| Degrees of freedom / redundancy | Redundant and conflicting relations have actual-solver tests. A rendered free segment previously reported a false zero/fully-constrained status; subsystem and numerical-isolation DOF now report unknown (`null`). Directly eliminated locked points still receive fixed styling. Rank-aware under/fully constrained diagnostics remain absent. | Unknown; competency not met |
| Parameter formulas / edit / undo | Rendered rectangle uses width and height=width/2; 100, 120, 1, 1e-6, 1e6 give expected geometry and strict sketch reload. Zero and negative dimensions fail with prior geometry intact. Invalid text remains authored, forward references/cycles report unknown variable, and rank/singularity and host persistence are not qualified. Rendered horizontal relation undo/redo keeps its segment. | Partial; invalid-authored-text handling is a blocker |

The parallel/perpendicular source compares all selected angle branches in degrees
and chooses the nearest same/opposite (0/180°) or left/right (90/270°) branch.
Prior behavior compared radians with degree thresholds; a real rendered case
changed an already parallel 100-unit segment from x=10..110 to approximately
x=76.7..43.3. No claim is made about arbitrary nonlinear or degenerate cases.

Run `test/mechanical/webpack.basic-angle-branches.config.cjs` then
`node --test /tmp/codi-basic-angle-branches/branches.cjs`. For the rendered
test run `test/webos/basic-branches-browser.test.cjs` against an isolated,
matching built runtime and test-only helper with `JSKETCHER_TEST_URL` and
`CODI_TEST_CDP` on loopback; see `test/webos/README-sketch-history.md`.

The basic radius test initially demonstrated that entering -5 applied a
negative radius and made the circle disappear. Radius and segment-length
constraints now require positive finite resolved values, checked both in the
editor and solver. The editor keeps invalid input open with a message, and
Enter follows the same validation/application path as the Apply button.
Existing parameter expressions still resolve through the sketch constant
table. This does not qualify parameter dependency cycles or all dimension
domains. Run `test/mechanical/webpack.dimension-domains.config.cjs` and
`node --test /tmp/codi-dimension-domains/domains.cjs`; the browser cases are
`test/webos/radius-domain-browser.test.cjs` and
`test/webos/basic-orientation-browser.test.cjs`.

`test/webos/rectangle-parameters-browser.test.cjs` constructs a real
rectangle via sketch actions, applies named width/height dimensions and anchors,
then changes width through 100, 120, 1, 0, -10, 1e-6 and 1e6. It checks
geometry, solver status, conflict counts, invalid-value geometry preservation
and strict sketch serialization/reload. This is a bounded case, not proof of
rank-based full constraint or numerical robustness at all scales. The
`parameter-formulas.test.mjs` unit test confirms ordered named evaluation and
that both forward references and cycles are rejected as unknown names; it does
not provide a dependency graph or distinguish cycle diagnostics.
`test/webos/constraint-undo-browser.test.cjs` verifies a Horizontal relation
can be undone/redone without deleting its segment.

The rendered control `test/webos/solver-dof-browser.test.cjs` originally
failed because a free segment reported `fullyConstrained=true` and DOF 0. It
now passes by reporting both as unknown. `test/mechanical/dof-status.test.mjs`
checks that a directly eliminated locked point still receives fixed styling.
Unknown is deliberately not a rank-qualified DOF diagnosis; the competency
remains open.
