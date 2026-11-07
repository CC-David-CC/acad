Production Worker stage-local diagnostics
========================================

Base `f1072e9f5734feb6e1c23bf2b71b77556e1c7347`. Product ownership is only
`web/app/sketcher/headless/localJacobian.mjs` and `solve.ts`. The existing
AlgNumSubSystem/Isolation physical DOF fields remain null; algebra, admission,
solver equations, thresholds, models, Craft, UI and persistence are unchanged.

The missing seam was a valid two-stage solve whose requested local report
returned `unsupported-stages`. The real production Worker reproducer uses
stage 0 point p=(1,2), locked in X/Y, and stage 1 point q=(5,2), constrained by
SignedDistanceX(p,q)=4. `before.json` retains the successful solve and absent
multi-stage diagnostic. A separate clean base checkout rebuilt the original
production Worker byte-identically (`903bba99…`); the exact new opt-in request
returns INVALID there (`before-opt-in.json`). These are observed before
responses, not expected-result rewrites.

Use the existing production Worker dispatcher with an explicit new option:

```js
{revision, sketch, boundary, externalParameters,
 localJacobian:{version:1, scope:'per-stage'}}
```

Only after the existing full solve, finite original residual/domain checks and
intent-preserving serialization succeed does `solveSketch` inspect the real
stage systems. The report is:

```js
{version:1, status:'stage-local', scope:'stage-local-fixed-inputs',
 physicalDof:null, stages:[{stage:0,localJacobian:/* existing local estimate */},
                         {stage:1,localJacobian:/* existing local estimate */}]}
```

For the reproducer, stage 0 has 2 variables/2 equations/rank 2/local nullity 0;
stage 1 has 2 variables/1 equation/rank 1/local nullity 1, with two actual
prior-stage parameters fixed. Ground/boundary objects belong to the real
workspace ground stage and may also supply fixed inputs. Unknown/non-prior
external-stage ownership refuses that stage's diagnostic explicitly.

There is no aggregate rank, nullity or project DOF. Each result concerns the
current stage's original Jacobian at the accepted point with earlier/ground
inputs fixed. Existing equilibration, threshold bands, rank uncertainty,
ordered contributions, zero/near-zero gradient warnings and unavailable cases
are retained. Rank bounds remain numerical estimates, not certified bounds.
In particular, coincident p/q with DistancePP=0 has a zero gradient: the new
report preserves unknown contribution and physicalDof:null, even though the
first-order nullity is positive. It must not be read as a count of actual
nonlinear motions. Numerical failure is never converted into contradiction.
Only the solver's existing exact reduced-row cause labels the tested
contradictory locks; zero segment/radius examples retain invalid-domain errors.

The existing `{version:1}` request is unchanged, including its single-stage
report shape and explicit unsupported-stages result for multi-stage input.
Requests without diagnostics remain unchanged. The new option is wired into
the actual generic headless solve path. The existing saved/active diagnostic
service, typed-task wrappers and UI continue using their existing single-stage
contracts; this lane does not widen those APIs or claim their integration.

Work remains bounded across the entire diagnostic request: 32 stages (the
existing source policy bound), 128 collected variables, 128 original equations,
4096 parameter visits and 262144 estimated derivative-term work. These budgets
are shared across stages rather than reset for every stage. A later stage can
report unavailable while the valid original solve and earlier reports remain
available. No accepted sketch/source size limits are narrowed by diagnostics.

Qualification
-------------

The actual `solveWorker.ts` entry is webpack-built in production mode and run
in fresh Node24 worker_threads. The adapter provides only self/location,
importScripts loading the unchanged real Verb library, and message transport.
It supplies no DOM, canvas, model, Jacobian, solver hook or replacement math.
Every job terminates its owned Worker. There are 9 new Worker groups plus the
10 retained local-Jacobian numerical/ownership controls. Real Worker cases cover
under/full/redundant stages, exact contradiction, singular zero distance,
degenerate segment/circle domains, prior/ground fixed inputs, old report/no-option
compatibility, shared variable/equation budget boundaries, the 32-stage source
boundary, and invalid opt-in fields. Original per-equation residual tolerances
and exact input preservation are checked. No midpoint fix is claimed anew.

The initial source fixture omitted SignedDistance annotation offset data;
`annotation-fixture-before.json` retains its error. The initial stage-bound
test wrongly expected a 33-stage source to solve; the existing source policy
already refuses it. `stage-fixture-before.json/.tap` retain that test failure.
Its corrected control verifies 32-stage support and the unchanged 33-stage
source refusal. No product workaround was made for either fixture issue.
The first cross-check build also needed its cwd set to the separate clean
source root for Babel to load that root's configuration; the builder now does
this explicitly. No application/compiler configuration was changed.

Current final Worker SHA256:
`5d0176a0f5e2fbba5281a9c1611f0c60f8d1536bd54c62c125825e62a9534457`.
Unchanged Verb SHA256:
`55f13091a656c635d1ebe3931a9b52236c65023549b7b69bc8278362f87686f3`.
The final build manifest records exact tracked-source fingerprints before/after
compilation, direct source hashes, numeric dependency and output bytes.
Runtime files remain outside Git under `.build/solver-report-worker/static/`.

Reproduce from this checkout with qualified dependencies available:

```sh
/tmp/codi-files-move-node/bin/node test/solver-stage-diagnostics/build.cjs
/tmp/codi-files-move-node/bin/node test/solver-stage-diagnostics/verify.mjs
```

`SOLVER_REPORT_SOURCE_ROOT`/`SOLVER_REPORT_OUTPUT` select isolated source/output
roots for a clean before build. `SOLVER_REPORT_WORKER` selects a retained
runtime when running the tests. No public deployment or browser/app workflow
was run. This closes one opt-in Worker reporting gap and does not qualify all
remaining 21 Gate 1 exercises or E17/C10, which the user moved to Gate 2.
