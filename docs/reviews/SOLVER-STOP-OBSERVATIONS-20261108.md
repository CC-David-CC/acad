# Actual solver termination and accepted iterate ownership

Source-only coherent change. No tests, probes, builds, benchmarks or browser execution were performed for this packet. A new normal build and unchanged complete application workflow are required. This is not an accuracy certificate.

## Actual evidence and units

The unchanged orientation R11 failed its then-current 1 pm replay policy on built ACAD a5368ef / Desktop a0def. Its first coordinate cold proof records peerB.b.y 151.73648176481407 -> 151.7364817693745 mm, a difference of 4.5604338083649054e-9 mm = 0.0045604338083649054 nm = 4.5604338083649054 pm. The record does not identify which optimizer or stopping branch produced either point. Historical receipts remain unchanged.

Parent's separate Decimal80 analysis, conditional on the corroborated anchors, source length and directed antiparallel relation, gives reference Y 151.736481776669307900777529... mm. Warm Y differs by approximately 11.855235 pm and cold Y by 7.294801 pm. Those are accuracy observations under that analytic binding; the 4.560434 pm replay difference alone is not an accuracy measurement. Full vector/actual anchor corroboration remains separate.

The user's final revised small-design budget is 50 pm = 0.05 nm = 5e-8 mm. A separate policy owner applies that revision to explicit physical-coordinate comparisons. This packet changes no geometry, residual, gradient, parameter, iteration, domain or replay threshold and performs no coordinate rounding. Historical stricter-budget passes/failures are not rewritten. Neither budget nor this sketch result qualifies atomistic physics, manufacturing or all kernel precision.

## Existing stopping semantics

`constr/solver.js` passes the actual reduced polynomial residuals and SolverParams to System without dimensional row normalization or a declared physical-coordinate error map. Length, angle and squared/mixed residuals therefore cannot share a universal millimetre interpretation.

Dogleg fine mode uses residual infinity norm <=1e-8 OR gradient infinity norm <=1e-8 as SUCCESS; rough uses 1e-3. Its tiny trust-radius threshold is 1e-80; fine iteration limit500. The existing error scalar is half the sum of squared raw residuals. A small gradient can establish stationarity without proving the geometric accuracy or satisfiability of the original equations.

LM fallback starts from its existing rollback seed and uses cost-relative, parameter-relative and orthogonality tolerances1e-8 (rough1e-3). LM does apply Jacobian-column-norm diagonal scaling internally; that is not a physical local frame or a source-to-geometric-error budget, and it does not normalize different residual dimensions. The wrapper additionally requires sum(abs(raw residual))<1e-3. Its error scalar is not the same objective as dogleg's. All these policies are unchanged.

## Confirmed source defect and repair

Dogleg evaluates a trial by calling live `subsys.setParams(x_new)`. If it rejects that trial, its saved x/J/fx/error still describe the accepted iterate, while live parameters previously retained the rejected point. The next stop or unsuccessful return could therefore expose a point different from its reported objective. The repair restores accepted x after a rejection and immediately before every normal return. No optimizer output is copied into a different source, no extra solve is performed, and existing LM fallback rollback remains unchanged. This source defect is not established as the cause of R11.

## Bounded actual observations

The algorithms now record their actual exit branch, iterations, residual-evaluation count, row/parameter counts, applicable original thresholds, raw residual infinity norm, gradient infinity norm (dogleg) or orthogonality (LM), accepted step norm and trust radius. Nonfinite observations become explicit null. LM orthogonality is the actual iteration-start value, not a claimed final-point gradient; evaluation-limit observations exclude the extra rejected request which did not call the model. Dogleg step norms use its existing parameter vector; LM step norms/trust radius use its existing Jacobian scaling. They must not be labeled geometric mm error. LM's acceptedState=false marks exception exits rather than certifying a publishable iterate. No raw exception text, equation, identifier, source array, stack, geometry vector or caller flag is captured.

`solverTermination.mjs` captures scalar own-data records, freezes them, and issues a private symbol-owned report. Only issued reports are readable. Existing status spreads preserve the symbol during their actual snapshot/rollback; start of a new solve clears the old report. A per-isolation solve retains at most two attempts (dogleg and optional LM); a subsystem retains the first eight observations plus the actual total attempt count. No success/admission decision consumes the report. It is diagnostic data only.

A fourth internal `solveSketch` callback observes the bounded immutable final subsystem report after each actual stage solve. Public requests, success replies and saved source are unchanged. Coordinate cold proofs retain at most eight stage observations. On a solve/proof refusal they append at most220 characters of actual stop summaries within the existing512-character message limit, leaving code/cause and the current field/value diagnostic in place. Summaries retain at most three observations and may be incomplete; the report's total makes omitted observations explicit. A successful call adds no public diagnostic fields. Initial-load/rebuild iterations and exceptions before an algorithm records an observation are not falsely presented as observed final stops.

## Remaining work

The normal complete workflow must establish actual method/stops if a refusal recurs. This repair does not infer that dogleg, LM or early stopping caused the recorded warm/cold accuracy difference. A future coherent physical scaling policy must derive parameter units, source length/angle sensitivities, conditioning and a per-design error budget; merely replacing all raw 1e-8 constants with a smaller number would not establish geometric accuracy. Custom LU/normal-equation behavior and rounded coefficient arithmetic remain separate source-review concerns, not silently expanded changes here.

Policy inventory was sent to the policy owner: diagnosticGeometry.mjs physical position constant and verifiedReplayGeometry.ts diagnostic wording; historical small-polynomial-terms workflow1pm budget/evidence must remain historical. Domain minima, angular tolerances, frame orthogonality and source identity guards have different semantics and must not be blanket replaced.
