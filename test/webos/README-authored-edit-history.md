# Authored edit history qualification

The isolated `ef676d45` app passed the OCC/Chromium controls in
`authored-depth-history-browser.test.cjs`: a five-hole plate kept its full
history and 11-face result while extrusion depth, centered-hole diameter, and
four-corner diameter/offset edits were each undone and redone through the
authored journal. The test checked analytic centers/radii, failed and no-op
edits, autosave and Save preparation, same-byte and delete/re-add sketch
changes, held worker cancellation, cache writes, competing commands, caller
input mutation, editor refusal, and synchronous revision changes. The
manufacturing revision test uses document-state reset, not an actual material
assignment. Hole wizard coverage calls the real wizard service programmatically.

`authored-depth-wizard-ui.test.cjs` separately passed real typed depth input
and an actual wizard OK click, followed by authored undo/redo. Its initial
feature setup and timeline selection are programmatic. The earlier real typed
input failed on `915f`'s predecessor because the form supplied a numeric string;
the bounded numeric conversion in `915f` fixed that failure.

App bundle SHA-256 `d87271b4c72b763a54d1e889899e6e60bf55fda6ee36d69e8ce39cc0b782c909`;
test helper SHA-256 `9fedbd30bb7494bfbeadb677f66085cb8d5dbb38f001535e2372a80d4a35c4da`.
The isolated R730 checkout was `/mnt/data10tb/codi-authored-edit-ui-20261104`.
It reused previous test worker assets; the loopback server did not impose a
CSP. These are not signed-host, release-build, or physical-device results.
The rectangle sketch-byte travel hook was not registered or tested here.

Run against an isolated loopback app and browser, with the matching test helper:

```sh
JSKETCHER_TEST_URL=http://127.0.0.1:19732/ CODI_TEST_CDP=http://127.0.0.1:19329 \
PUPPETEER_CORE_PATH=/tmp/codi-occt-release-control/node_modules/puppeteer-core \
/tmp/codi-files-move-node/bin/node test/webos/authored-depth-history-browser.test.cjs
JSKETCHER_TEST_URL=http://127.0.0.1:19732/ CODI_TEST_CDP=http://127.0.0.1:19329 \
PUPPETEER_CORE_PATH=/tmp/codi-occt-release-control/node_modules/puppeteer-core \
/tmp/codi-files-move-node/bin/node test/webos/authored-depth-wizard-ui.test.cjs
```
