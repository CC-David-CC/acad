# Restored history equality: independent source review

```sh
PATH=/tmp/codi-files-move-node/bin:$PATH node --test test/coreTests/history-equivalence.test.mjs
PATH=/tmp/codi-files-move-node/bin:$PATH node test/history-equivalence-review/review.mjs
```

The second command exercises the actual new pure comparator against the exact algorithm extracted from `2ad57a006^:web/app/sketcher/history.js`. The previous full `history.js` SHA-256 is `243e3fb5b4c6610d08e3966c48e1e7a59c54cd1f3e5cecef577b8eddaad024d7`. Only the old exported test function name is changed; this reference is never imported by product code.

Fixed seed `0x07119e2d`; 275 intended differential outcomes pass. The final receipt contains test/product hashes, Node version, large input length and comparator JSON-call instrumentation. An overflow-to-null difference is recorded separately outside serialized native-state scope. The test synchronously instruments JSON methods within a try/finally and restores them before returning.

This is a pure method/control test with no viewer double, browser, Worker, model loading or fake native success. The copied root runtime logs are historical owner evidence and are not relabeled as independent runtime qualification. [Review and practical limits](../../docs/research/HISTORY-EQUIVALENCE-REVIEW-20261105.md).
