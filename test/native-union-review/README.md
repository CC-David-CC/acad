# Independent native union review control

`browser.cjs` is a read-only replay of existing baseline/candidate diagnostic WASM, separate from application runtime qualification. It verifies glue/WASM/Worker SHA-256 before serving them on ephemeral loopback ports under strict CSP, uses its own context on CDP19329, compares actual native output against the two checked-in owner receipts, and closes both servers/context.

```sh
PATH=/tmp/codi-files-move-node/bin:$PATH \
CODI_TEST_CDP=http://127.0.0.1:19329 \
CODI_NATIVE_BASELINE_FIXTURE=/tmp/codi-union-baseline-fixture \
CODI_NATIVE_CANDIDATE_FIXTURE=/tmp/codi-union-regression-fixture \
CODI_RECEIPT=/tmp/native-union-independent.json \
node test/native-union-review/browser.cjs
```

Default fixture directories contain existing artifacts from the native owner's isolated build `/mnt/data10tb/codi-union-survivor-build-20261105` on R730, mirrored on example.invalid at `~/codi-artifacts/union-survivor-research-20261105`. Restore the exact pinned `baseline-regression.{mjs,wasm}` / `candidate-regression.{mjs,wasm}` and corresponding `probe-worker.mjs` under each fixture's `static/` directory before replay. No WASM is checked into this test path. An absent or mismatched artifact fails before running.

PASS means the three bounded corrections and unchanged remaining observed records reproduce. It does not turn the open partial-fill/island cases into correctness passes or qualify application history, general topology, attributes, specialized modes or exports. [Review and exact source references](../../docs/research/NATIVE-UNION-SURVIVOR-REVIEW-20261105.md).
