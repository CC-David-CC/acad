# Research only: incremental constraint admission

This is an unqualified experiment on top of the full-rebuild atomic prototype;
**do not merge or deploy it**. A single added constraint is trialed against the
already accepted set. A whole clean, conflict-free batch gets one tentative
build; any definite conflict, numerical failure or non-finite parameter restores
the snapshot and uses the slower deterministic per-constraint fallback. This
reduces clean-case work but is not a general bounded or asynchronous solver.
The nonlinear optimizer can take a different path from sequential admission;
no equivalence across nonlinear branches, singular geometry or scales is
claimed. The parent prototype's cross-stage, object/layer/generator transaction,
exception, rank, tolerance and other limitations still apply. Only a native
constraint write/read simulation is tested; this is not a full desktop project
save/load or a release/security validation.

On one workstation run with independent point locks, 500 clean constraints took
59 ms to bulk-load, 52 ms to add one, and 66 ms to remove one. With one
contradictory lock the 500-constraint bulk load took 10,034 ms and removing one
constraint took 10,156 ms; the process had a 35-second overall timeout. These
are not physical-phone or complete-application measurements. Independent review
also exercised synthetic connected coincidence chains with conflicting locks,
serialization and priority (10/50/100 points: 15/79/378 ms aggregate on one
run; 250 points about 6 seconds). These represent specific cases, not a general
performance bound.

Next work should isolate affected constraint-graph components, maintain
versioned accepted solver snapshots, and move bounded numerical work off the UI
thread with cancellation/revision checks. Membership must account for shared
parameters, generated geometry, cross-stage dependencies and constraints that
bridge previously separate components. Removal can split components. Full outer
object/stage rollback must be designed with the caller; isolated subsystem tests
cannot prove it.

Build `test/mechanical/webpack.incremental.config.cjs` and run
`/tmp/codi-jsketcher-incremental-tests/incremental.cjs`. The conflict benchmark
has a separate config and should be run with an explicit timeout, e.g.
`timeout 35s node /tmp/codi-jsketcher-incremental-conflict-bench/bench.cjs`.

## Versioned replay-priority experiment

A constraint can serialize an optional `admission` object with version 1 and
state `accepted`, `redundant` or `rejected`. Authored constraint arrays are not
reordered. On replay the hint only selects trial order; actual equations are
re-solved and the resulting status is recomputed. Explicit accepted hints take
precedence over unhinted legacy rows, which precede deferred hints. Legacy-only
files retain their historical authored-order behavior; their original winner
cannot be inferred. Older clients ignore this new field and can choose a
different winner. A syntactically valid edited hint can intentionally select a
different consistent branch; the hint is neither authenticated nor proof of
correctness. Unknown versions, values and fields are rejected before sketch
cleanup by both regular and strict sketch IO. Project restore does not yet
necessarily inspect admission metadata in sketches that have not been opened.

The real sketch IO and history classes were tested with a mock viewer: strict
and regular reads, old snapshots, malformed hints before cleanup, mixed hints,
undo/redo and changed-but-valid hints passed. This mocks the viewer and stubs an
unneeded DXF parser, so it is not full browser/project round-trip qualification.
Build `test/mechanical/webpack.admission-io.config.cjs` and run the result with
`node --test --test-force-exit /tmp/codi-jsketcher-admission-io/admission-io.cjs`
from the project root. The forced exit is needed for a React scheduler in this
Node harness; it is not a lifecycle or browser-cleanup test.

Independent source review confirmed that the baseline older client ignores
unknown `admission` fields when reading and discards them on write. A model
saved by that older client can consequently reopen with a different winner.
This is a **blocking compatibility issue**: a future design needs an explicit
document-version or backward-reader gate and real mixed-version tests before
any production use. This research branch does not implement such a gate.

## Consolidated-base retest, 2026-11-03

The prototype was carried onto manufacturing/consolidation base `f3971dc8`.
The default mechanical webpack bundle now includes the four formerly excluded
failed-add regressions and the atomic-admission tests, together with midpoint,
redundancy and removal cases. They pass against the actual solver classes.
The new stage-admission fixture exercises the real `ParametricManager` and
solver: an exception while admitting a constraint no longer leaves its
annotation attached or its stage changed. Accepted and retained conflicting
constraints still get annotations. Run:

```
./node_modules/.bin/webpack --config test/mechanical/webpack.config.cjs
node --test /tmp/codi-jsketcher-mechanical-tests/midpoint.cjs
./node_modules/.bin/webpack --config test/mechanical/webpack.stage-admission.config.cjs
node --test --test-force-exit /tmp/codi-jsketcher-stage-admission/stage-admission.cjs
```

On this workstation the existing bounded contradictory-lock benchmark measured
100 constraints load/add/remove at 155/11/168 ms and 500 at 12,639/64/12,010
ms. This remains too slow for interactive use; it is not a dense nonlinear
benchmark. Deferred bulk transactions can still attach annotations before their
later admission fails, and multi-stage, generator, layer and object rollback
remain unqualified. The stage fix addresses only an immediate solver exception.
Backward-reader priority compatibility and numerical diagnostic limits above
remain blockers. No deployment is implied.

The added bounded dense-conflict benchmark exercises one connected graph with
coincidence cycles, redundant links, an anchored point and a contradictory
endpoint. It verifies the anchor, all point coordinates and explicit conflict
before and after removal. One workstation run measured 30 points / 57 links at
30/23 ms load/remove, 100 / 197 at 360/625 ms, and 250 / 497 at 3,699/6,960
ms. This synthetic linear case does not qualify a real bracket or nonlinear
solver, and the observed seconds-long removal remains a responsiveness blocker.
Run with a hard limit:

```
./node_modules/.bin/webpack --config test/mechanical/webpack.dense-conflict.config.cjs
timeout 35s node /tmp/codi-jsketcher-dense-conflict/bench.cjs
```

## Narrow independent-lock preparation experiment

For the built-in `LockPoint` schema only, mutually disjoint parameters are
batched before retrying conflicts. For bulk load, a lock is selected only if
neither of its parameters appears in any other candidate; interacting locks
still replay in their authored/accepted priority. Other schemas, shared
parameters and nonlinear systems retain the existing ordered fallback. A
failed batch restores coordinates and falls back. This remains research and
requires independent review; it does not prove arbitrary solver equivalence or
fix cross-stage transactions and mixed-version persistence.

Two actual-solver regressions check bounded preparation, conflicting priority,
backlinks, removal and reactivation. The full 16-test mechanical bundle and
seven mock-viewer admission/IO cases pass. Sequential workstation benchmark:
100 independent locks plus a conflict load/add/remove 28/4/11 ms; 500 locks
249/49/165 ms (previously 12,639/64/12,010 ms for 500). The connected cycle
case still uses ordered fallback: 250 points / 497 links load/remove
3,857/6,599 ms. These are isolated single runs, not end-user responsiveness or
phone benchmarks. Dense, mixed and nonlinear solver performance still blocks
release.

## External-stage reclassification blocker

`test/mechanical/external-stage-reclassification.test.mjs` is a deliberately
failing, separately configured negative control on this checkpoint. It uses
the actual algebraic/numeric system: a previously accepted pair sets local
x/y from another stage, while an earlier relation requires local y=0. When the
external x/y change from 0/0 to 1/1, calling the public `prepare()` marks the
pair conflicting but its x equation still moves the local point from 0 to 1.
This can also leave partial reductions for a subsequent solve. The existing
admission regression only checks reclassification while adding a candidate;
it does not exercise later external-stage changes. Do not ship the research
solver until public preparation and hard-solve reclassification are atomic,
restore local geometry, rebuild all reductions and preserve the changed external
stage. Run this expected failure using:

```
./node_modules/.bin/webpack --config test/mechanical/webpack.external-stage.config.cjs
node --test /tmp/codi-jsketcher-external-stage/external-stage.cjs
```

### Experimental reclassification correction

The preceding negative control is now in the default mechanical suite and
passes for both public `prepare()` and hard `solveFine()`: newly conflicting
relations trigger restoration of the pre-build parameter values followed by
whole-constraint readmission. The test also checks that the external stage's
new values survive, object backlinks remain, a subsequent solve does not revive
partial equations, and explicit invalidation can reactivate the relation when
conditions permit. An injected public-prepare exception checks restoration and
subsequent solver use. A 500-independent-lock conflict run after this change
measured load/add/remove 290/59/194 ms on the same workstation. The full
19-test mechanical bundle and prior 7 mock-viewer IO tests pass.

This is an experimental targeted fix, not a claim of full transactional solver
safety. Numerical nonconvergence, arbitrary nonlinear branches, interactions
with mutable generators, multi-stage transactions, account-backed project
round trips and obsolete readers remain unqualified. The reclassification path
adds parameter snapshots to public prepares/hard solves and has not been
profiled with interactive multi-stage models. Independent review is required.

Public preparation now also checks the captured parameters for non-finite
values after building, restores the previous geometry on failure and reports
an error. The added synthetic actual-solver regression covers a non-finite
side effect; it does not certify residual or numerical-convergence diagnostics.

An independent review identified that hard-solve reclassification discarded
interactive parameter preferences. An actual-solver negative control verified
the issue. The correction rebuilds with the saved interactive parameter set;
the regression verifies both preservation and a subsequent drag of a now-free
coordinate. The full 21-test suite passes. This is a linear test and does not
qualify nonlinear branch selection during a drag.
The drag regression also includes a coincident follower: after reclassification,
changing the selected point moves its follower to the same x coordinate. This
checks the linear substitution direction in addition to the interactive set.

During sketch restore, stages created after `startTransaction()` previously
admitted constraints immediately and could replace serialized conflict
priority before the final replay. Newly created stages now join the active
transaction. A test reproduces the lost priority with the real manager and
solver, and a second round-trips the actual strict sketch IO using a mocked
viewer and synthetic point index. Both pass after the fix. This is not yet a
full rendered browser project or multi-stage transaction rollback test.

### Changed external references and reactivation

Independent regression `f335a378` showed that a rejected relation referring to
an earlier stage remained rejected after its external coordinates returned to a
compatible state. This is reachable in the drag tool, which calls prepare at
mouse-down followed by solve on move/up, rather than explicit invalidation.
The research fix records external parameter values for rejected/redundant
relations; a later solve replays admission only when those values change, while
preserving the selected drag parameters. The independent negative control is
part of the default mechanical bundle. A mock-viewer real-manager/strict-IO
regression saves and reloads a rejected cross-stage coincidence, then exercises
prepare/rough/fine solving as the earlier-stage point returns to compatibility.
It verifies the expected redundancy and both object backlinks. All 26 bundle
and 5 stage/IO tests pass. This is not rendered pointer-event automation,
nonlinear validation, complete project round-trip or a multi-stage atomicity
claim; independent review remains required.

### Multi-stage solver-transaction research

Independent controls `094f2a12` found that a failed later stage left earlier
solver changes committed and unvisited later stages in transaction mode. The
candidate now retains per-stage solver snapshots until all stages finish,
rolls those snapshots back on failure, and delays annotations for newly added
constraints until admission succeeds. The actual manager/stage fixture checks
both controls, prior geometry, priority hints, backlinks, later-stage mode and
an injected annotation-attachment failure. All eight stage/IO tests and 26
mechanical tests pass. These are bounded constraint-admission tests with a
mock viewer. They do not establish atomic rollback for deleted annotations,
removed objects/layers, generator side effects, generated geometry, or an
entire project load; do not describe this as a complete model transaction.
Independent review and further failure tests remain necessary.

Follow-up: transactional removal of an existing constraint previously removed
its annotation immediately, leaving it missing after a later-stage failure.
Annotation removal is now deferred through admission; bounded tests cover failure
before removal, successful removal, and a removal that throws after mutation.
The latter also uses the actual annotation `Layer` and checks restoration of
layer membership and stage assignment with a mocked viewer. The 12 stage/IO
tests pass. Object/layer or generator mutations elsewhere, failure of rollback
itself, and complete project transactions remain unqualified.

The independent `0d4c5902` reactivation-failure-and-retry regression is now
included in the default solver suite. A transaction that adds then removes a
constraint also restores its prior stage without attaching an annotation; the
corresponding manager test passes. Current totals: 27 solver and 13 stage/IO
tests, including the independent controls. Remaining limitations above apply.

A later-stage constraint can first capture an earlier-stage parameter after an
in-transaction edit. Forward rollback then restored that late snapshot after
the owner had restored its original value. The manager now rolls stages back
in reverse order, and each stage snapshots its existing objects even when they
have no constraints. Two actual-manager tests cover constrained and
unconstrained earlier-stage objects. All 15 stage tests and 27 solver tests
pass; cross-stage ownership and rollback of removed objects/generators still
require broader validation.
