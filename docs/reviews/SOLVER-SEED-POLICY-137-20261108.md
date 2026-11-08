# Solver seed policy: 137

The user selected **137** if the project does not already have a solver seed. The inspected current sketch solver has no stochastic choice or configurable PRNG seed. Therefore 137 is the chosen default **for any future explicitly introduced stochastic solver strategy**; it has no active numerical effect on the current path. No unused runtime setting, project field, global `Math.random` override, or change to the qualified runtime is introduced by this note.

## Source scope and result

Read-only audit on 2026-11-08, using source `618cf3982cd89d1b859236e968e8ccfabb6d23e9`. The audited solver, initialization, math/geometry helpers and project/sketch serialization files have no changes relative to immutable composed candidate `32ae9c8a10659e43a3c5a5f4f51602b8aad64161`. This is a source finding, not a new runtime qualification. No tests, probes, builds, browser execution or service changes were performed.

| Actual path | Initialization/choice found | Source reference |
| --- | --- | --- |
| Shared editor/headless solver | Headless IO reconstructs the same ParametricManager, stages, objects and registered constraints; each stage is prepared and solved from actual captured geometry. No seed request/option. | `web/app/sketcher/headless/workspace.ts` constructor; `headless/solve.ts:solveSketch`; `web/app/sketcher/parametric.ts` |
| Algebraic reduction and isolation | Arrays plus insertion-ordered Maps/Sets retain actual constraint/parameter order. Intrinsic rows precede authored rows via `validConstraints`; reduction, retries and component traversal do not shuffle or draw random values. Isolation copies current object Params before solving. | `web/app/sketcher/constr/AlgNumSystem.ts:validConstraints,prepare,Isolation.solve`; `constr/polynomial.ts`; `constr/solverParam.ts:reset,rollback` |
| Numerical solve | Deterministic dogleg first; on failure rollback to object values and try Levenberg–Marquardt. Both use the current parameter vector and actual residual/Jacobian. No random restarts, perturbation or PRNG. | `web/app/sketcher/constr/solver.js:prepare,solve_lm`; `modules/math/optim/dogleg.js`; `modules/math/optim/lm.js` |
| QR/pivot choices | Maximum-column norm scan uses strict `>` and existing column order for ties, not randomized pivoting. | `modules/math/qr.js` constructor |
| Bezier point/tangent guesses | PointOnBezier auxiliary t starts at 0.5 and uses explicit endpoint rules; TangentLineBezier scans t from 0 using actual derivatives and `genericCurveStep`, selecting its deterministic best candidate. | `web/app/sketcher/constr/ANConstraints.ts:PointOnBezier,TangentLineBezier,AlgNumConstraint.initialGuess`; `modules/geom/impl/nurbs-ext.ts:genericCurveStep` |
| Ellipse auxiliary parameter | Initial t is `atan2` of the actual point relative to actual ellipse center. | `web/app/sketcher/constr/ANConstraints.ts:PointOnEllipse.defineParamsScope` |
| Singular free Point-distance initialization | Authenticated single reduced quadratic, exact zero gradient; fixed B.x/B.y/A.x/A.y then actual matrix order; first eligible coordinate receives the positive square-root displacement. Local names “seed/seeded” mean this deterministic initial value, not a random seed. | `web/app/sketcher/constr/distancePPSingularInitialization.ts:initializeSingularPointDistance`; called by `AlgNumSystem.ts:Isolation.solve` |
| Numeric dependency | Dogleg calls arithmetic/matrix operations (`clone`, `transpose`, `dot`, norms, add/sub/mul, identity/dim); no `numeric.random`, seeded generator or random API is called by this path. QR and LM are explicit loops. The CSP precompiler retains the reviewed numeric 1.2.6 source; the existence of unrelated dependency APIs is not evidence the solver calls them. | `modules/math/optim/dogleg.js`; `modules/math/qr.js`; `modules/math/optim/lm.js`; `build/precompile-numeric.cjs` |

Source searches covered seed/random/stochastic terms and random APIs in `web/app/sketcher`, `modules/math`, `modules/geom`, and project serialization/manager code, plus actual imported initialization/helper bodies. No active project solver-seed policy or reader was found in `web/app/cad/projectBundle.ts:captureModel`, `web/app/cad/projectManager/projectEnvelope.mjs:encodeProjectEnvelope/decodeProjectEnvelope`, `projectManagerBundle.ts`, `web/app/sketcher/io.ts:_serializeSketch`, or `headless/solve.ts`. An arbitrary authored metadata key named seed would not configure this solver.

## Deliberately separate randomness and identities

`crypto.randomUUID()` remains untouched. Examples include command/revision guards (`web/app/sketcher/actions/sketchRevisionGuard.js`), Worker request correlations, project/material revision tokens, mount/shape handle identities (`modules/engine/mount/worker-controller.mjs`), and rigid-group/ruler identities. These are not numerical starting values. They must not use a reproducible solver PRNG or be globally seeded. Authentication, cryptographic entropy and security identifiers are outside this policy.

The production `Math.random()` calls found in the searched `web/app`/`modules` tree are in `modules/voxels/vixelViz.ts` for voxel display/material-color selection, outside the constraint-solver call path. A seeded graph builder under routingElectrical tests is likewise not the mechanical sketch solver. Neither is changed. “Seed” in `headless/verifiedReplayGeometry.ts` and `capturedGeometryScope.ts` means a dependency-graph starting row/parameter, not stochastic state.

## If a stochastic solver is later proposed

The first implementation must declare its actual algorithm/version and owned PRNG, with default integer seed **137**, and document the exact point where random samples influence a mathematical decision. Keep the PRNG local to that solve/candidate; no ambient/global state, time-derived seed, identity-derived seed, shared stream between independent verification Workers, or change to UUID/crypto APIs. The same explicit strategy/version/seed and same source must initialize independent Workers identically while preserving independent reconstruction and validation.

Before such a strategy ships, decide whether documents can override the default. If yes, add a bounded, strictly captured project solver-policy field with explicit algorithm/version/seed, validation, native Save/Open retention, and captured replay/currentness ownership; the solver must actually consume it. If no override is needed, a versioned fixed strategy default can avoid adding redundant project state. This note does not select a new persistence schema, add stochastic behavior, or authorize importing historical random state.

Source ordering, original geometry/branch, reduction path and floating-point arithmetic can affect a deterministic solve. A PRNG seed does not repair roundoff, certify branch uniqueness, guarantee cross-engine/platform bit identity, prove convergence or relax residual/domain/ownership checks. The separately authorized 50 pm coordinate-reconstruction policy and all exact source, units, non-coordinate and independent-verifier contracts remain unchanged. Native kernel/mesher internals and unrelated imported library algorithms are not universally audited or claimed deterministic here.

## Next action

No solver producer change is necessary for the present deterministic path. Retain 137 as the selected future stochastic default; revisit implementation/persistence only when a concrete stochastic solver choice is introduced. Parent-owned complete Gate 1 qualification of the frozen composed candidate continues separately.
