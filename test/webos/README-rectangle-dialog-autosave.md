# Rectangle dialog and autosave

On 2026-11-05, `rectangle-dialog-autosave.test.cjs` passed in isolated
Chromium using CAD `70aebd73f65e46d7105b88e83b412eac4e18760f` and desktop
source `a5717a702d9d354ec6d3da7f3ff6879d53781180`. The test opened the real
desktop app's rectangle-dimensions dialog, scheduled and observed two actual
project autosave writes more than two seconds apart, verified the inspected
authored revision stayed unchanged, typed new dimensions, and submitted the
same dialog successfully. Separate same-byte sketch rewrite and delete/re-add
controls caused the still-open dialog to reject its stale token and preserve
the prior dimensions.

The desktop fixture uses its real app/dialog and command registry with an
in-memory test host; it is not a signed account or public deployment. The CAD
frame was served through `tests/jsketcher-host-csp-server.py` with its
self/wasm-unsafe-eval script policy. Feature setup and menu selection use test
APIs; the dimension fields and submit button use browser input/click.

R730 checkout `/mnt/data10tb/codi-dialog-autosave-70-20261105` used Node 24,
`CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1`, a freshly built private project
validation worker and a test-only webpack wrapper setting `resolve.symlinks`
false and pointing the validator alias/rule to that private worker. App bundle
SHA-256 `cfed7b0b49961e1ef1e7bf2d29cc11bb66d1c4f28f3e0296a96e30b0dfb49beb`;
project validator `db099300dcc0ad80e904b998fce55c5aa38aeff20eadd2d3ae85210ebdd20f94`.
Other compiled worker/assets were reused from the prior isolated fixture; this
is not a clean full release rebuild.

```sh
JSKETCHER_HOST_URL=http://127.0.0.1:19733/ CODI_TEST_CDP=http://127.0.0.1:19329 \
PUPPETEER_CORE_PATH=/tmp/codi-occt-release-control/node_modules/puppeteer-core \
/tmp/codi-files-move-node/bin/node test/webos/rectangle-dialog-autosave.test.cjs
```
