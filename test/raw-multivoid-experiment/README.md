# Whole-container multi-material / void experiment

This is a failing real Chromium/Worker/native-binding control, not a release acceptance. Production `rawMount.mjs` and `rawWorker.js` are unchanged. `prepare.cjs` removes precisely the two multi-material-plus-void refusal clauses in generated fixture copies and records the different Worker pin. The unchanged native WASM owns the complete BRep; the test never extracts regions, heals, reclassifies, or substitutes geometry.

Run from this checkout, using the existing test-only shared Chrome and your own browser context:

```sh
mkdir -p .build/multivoid/baseline
scp r730:/mnt/data10tb/codi-raw-provider-display-20261105/raw-provider.mjs .build/multivoid/
scp r730:/mnt/data10tb/codi-raw-provider-display-20261105/raw-provider.wasm .build/multivoid/
scp r730:/mnt/data10tb/codi-raw-provider-display-20261105/raw-smlib-worker.js .build/multivoid/baseline/
PATH=/tmp/codi-files-move-node/bin:$PATH node test/raw-multivoid-experiment/prepare.cjs
PATH=/tmp/codi-files-move-node/bin:$PATH \
PUPPETEER_CORE_PATH=/tmp/codi-occt-release-control/node_modules/puppeteer-core \
CODI_TEST_CDP=http://127.0.0.1:19329 \
CODI_RECEIPT=/tmp/raw-multivoid-receipt.json \
node test/raw-multivoid-experiment/browser.test.cjs
```

Current expected command outcome: **exit 1**, because native census/volume disagrees with the analytic and mesh controls. The fixture is a separate ephemeral loopback server with strict same-origin CSP; it closes its context and server. No app builds or running fixtures are changed. `prepare.cjs` only builds two tiny Workers. The browser test checks the glue, WASM, baseline Worker and experimental Worker hashes before starting.

See [the review note](../../docs/research/RAW-MULTIVOID-EXPERIMENT-20261105.md) and [final raw receipt](receipt-r7-final.json). The initial mismatch receipt is retained as [receipt.json](receipt.json). [receipt-r4-direct.json](receipt-r4-direct.json) preserves a failed first direct-binding harness attempt: it omitted `_binding_init` and returned `NOT_READY`; that run provides no native geometry proof. The corrected final direct Worker calls `_binding_init` first and bypasses both JavaScript evidence gates.

These are direct-mount and native-binding subsystem controls. They do not qualify registered commands, shared graph/history, undo/redo, native-file replay, manufacturing export, general curved geometry, or all native Boolean configurations. The production eight-name and tessellation resource gates remain unchanged. Surface component counts describe tessellated boundaries, not inferred native material counts.
