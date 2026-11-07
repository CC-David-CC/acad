# Research only: atomic constraint admission

This is an experimental per-subsystem solver prototype, not suitable for merge
or deployment. It trials complete constraints in deterministic priority order,
restores a checkpoint on rejection, and rebuilds accepted equations so an
inconsistent sibling cannot contaminate later constraints. Retained conflicting
or redundant constraints have object backlinks. Previously accepted relations
are processed before formerly conflicting relations, which are retried after
removal. On a fresh bulk load, serialized order supplies priority.

The 4 earlier failed-add research cases and the existing midpoint suite passed.
Seven additional tests cover prior priority, full redundancy and reactivation,
injected collection failure during add/removal/bulk admission, restored links,
and native constraint `write`/`read` in stored order. These are small isolated
subsystem tests, not full desktop save/reload or nonlinear validation. The
solver's numeric success and conflict tests are unchanged; rank/DOF, tolerances,
finite residual correctness, degenerate geometry and complex nonlinear branches
are not certified. Exceptions arising from all mutation and model-lifecycle paths
have not been exhausted. Outer `ParametricManager` transactions span stages,
object layers, generators and disposed-state mutations; this code does not
provide cross-stage or full-object rollback. Do not use on valuable models.

A Node benchmark on this workstation for independent `LockPoint` constraints
showed: 10 constraints load/add/remove 8/2/1 ms; 100: 102/123/121 ms; 500:
9183/9259/8885 ms. This full-rebuild strategy is not responsive at 500 and
must not run on the production UI thread. The benchmark is not a physical-phone
or mixed-geometry measurement. A next prototype should reuse accepted solver
state or isolate the affected constraint graph and coordinate outer transactions.

Build `test/mechanical/webpack.atomic.config.cjs` and execute the output under
`/tmp/codi-jsketcher-atomic-admission-tests/atomic.cjs`. The benchmark config
writes to `/tmp/codi-jsketcher-atomic-admission-bench/bench.cjs`; bound it with
`timeout 45s node .../bench.cjs`. Existing midpoint tests have their own config.
Whole-tree TypeScript check was blocked by the borrowed dependency directory:
`manifold-3d` and `@dxfjs/parser` were missing and DXF writer types differed;
that is not a passing release check.
