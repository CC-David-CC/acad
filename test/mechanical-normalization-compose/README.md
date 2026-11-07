# Private mechanical + normalization composition

This is an independent offline qualification branch, not promotion or deployment.
Harness base: `5a9f224236b4365ba72b3c273bc55d4ee55cae36` (product base e361f9524).
Composed source tip before these notes: `2ed70c8ad8ee2077a9fb71e1a14ea4916388b518`.

Only the missing three-commit range was applied:

| Original | Composed | Role |
| --- | --- | --- |
| 874ec624ed7d160aad58ad9d18c09e27113e3ce9 | ac10ea97e | Diagnostic/test prerequisites and retained original evidence |
| 7757cf749f51bc82d79ee0d23b9be35e8305b0c8 | 22f1d1c26 | Exact domain-certified normalization product change |
| 11d88120bfa78f3a0b3703f024b4a5192817816f | 2ed70c8ad | Final ninth normalization test and evidence/docs |

Earlier API, precision and rectangle-planner changes were already in the base;
they were not reapplied. No product edits, guard changes, test expectation edits,
skips or disabled cases were made in this composition. The product trees match
11d88120b exactly. All 41 mechanical test modules and AST loader guards match the
harness base exactly; the nine normalization tests match 11d88120b exactly.

## Newly executed checks

| Check | Result |
| --- | --- |
| Same 41-file mechanical corpus | **228/228** |
| Focused exact-domain/provenance normalization | **9/9** |
| AST writer-boundary/dependency guards | **5/5** |
| TypeScript no emit | **PASS**, exit 0, empty diagnostic output |

Every test run reports zero skipped, cancelled and todo cases. Actual imported
model math is bundled and executed under Node v24.22.1, Webpack 5.74.0 and Babel
7.18.10 with the same retained dependency set. No browser, mounted host, Worker
lifecycle or BRep-engine rerun is claimed. Browser evidence imported with the
three commits retains its original source/runtime pins and is historical here;
it does not become new composed-browser proof.

The first normalization invocation omitted `CODI_AXIS_FIXTURE`. Eight tests
passed; the ninth failed with `ERR_INVALID_ARG_TYPE` because readFileSync received
an undefined path. That failed run/log is retained unchanged. With the documented
fixture environment variable, the same already-built bundle and unchanged ninth
test pass. This was an invocation/configuration error, not a product repair or
weakened assertion.

The independent normalization review remains separate. Passing this bounded
corpus does not close inherited algebraic limitations or establish general solver
correctness. Root owns review/integration and the final actual browser/host gate.

## Reproduce

With the existing package lock installed and supported Node:

```sh
CODI_EMBED_NUMERIC=1 node node_modules/webpack/bin/webpack.js --config test/mechanical-corpus-harness/webpack.broad.cjs
node --test .build/mechanical-corpus-harness/broad/test.cjs
CODI_EMBED_NUMERIC=1 node node_modules/webpack/bin/webpack.js --config test/headless-axis-symmetry/webpack.normalization.cjs
CODI_AXIS_FIXTURE=test/headless-axis-symmetry/fixtures/consumed-axis-zero-x-before.json node --test .build/axis-domain-normalization/test.cjs
node --test test/mechanical-corpus-harness/loader-contract.test.cjs
node node_modules/typescript/bin/tsc --noEmit
```

`receipt.json` records the actual results and initial invocation failure;
`pins.json` records source-tree, exact product/test and executed output hashes.
Complete raw logs and generated test outputs are backed separately on R730.
