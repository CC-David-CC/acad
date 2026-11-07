# Constraint-add regression history

Current checkpoint: integrated `c9e76b84` passes all four original regressions
and twelve additional atomic-admission controls. Root rebuilt and ran the actual
solver bundle on 2026-11-04:

```
node node_modules/webpack/bin/webpack.js --config test/mechanical/webpack.atomic.config.cjs
node /tmp/codi-jsketcher-atomic-admission-tests/atomic.cjs
```

All 16 passed. This does not qualify every UI transaction or full-model workflow.
The following notes describe the original failure and intermediate research;
their statements that the tests currently fail are historical.


`failed-add-regression.test.mjs` is intentionally excluded from the normal
passing midpoint bundle. It demonstrates four failures of the current
experimental classifier with actual `AlgNumSubSystem`, `AlgNumConstraint`,
`Param` and `Polynomial` classes. Do not interpret the midpoint test as proof
that conflicting edits are atomic.

The fixture has an existing `y=0` constraint. A newly added two-equation
constraint requests `x=1` and `y=1`, and must be rejected without changing
geometry. The current implementation instead changes previously unconstrained
`x` to 1; even when `x` was included in the snapshot, a later solve can replay
its surviving elimination. If the conflicting constraint later becomes valid
when the original constraint is removed, it is not linked back to its object,
so object-deletion lifecycle can miss it. A fourth test shows that a
rejected multi-equation relation can also make a later independent valid
relation appear conflicting, depending on serialized order.

Build separately with the project dependencies installed (the output is outside the source tree):

```
./node_modules/.bin/webpack --config test/mechanical/webpack.failures.config.cjs
node /tmp/codi-jsketcher-mechanical-failures/failures.cjs
```

These four regressions are expected to fail on the reviewed candidate.

An eventual atomic rebuild must snapshot every affected parameter before
normalization/evaluation, stop on a definite contradiction, restore the entire
snapshot and exclude only the offending candidate before recomputing from
pristine state. Retaining redundancy classifications from a contaminated pass
is unsound: a later constraint may appear redundant only because an earlier,
ultimately rejected constraint temporarily supplied an equation. Establish a
stable priority for previously accepted constraints, bound retries, rebuild
all derived solver state after rejection, and retain object backlinks for any
constraint that remains in the model. Numerical failure and exceptions need the
same atomicity guarantees. These are design requirements for follow-up work,
not claims that the current candidate satisfies them.

On the separate incremental-admission research branch, the four tests above
now pass. That result does not resolve the broader limitations recorded in
`docs/INCREMENTAL-ADMISSION-RESEARCH.md`; neither branch is a release candidate.
