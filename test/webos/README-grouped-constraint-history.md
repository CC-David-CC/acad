# Grouped constraint browser check

The integration lead independently rebuilt and ran the five focused controls
from the combined source through `6d34d820`; all passed and the Node process
exited normally. The initial Node-only run retained React's browser-scheduler
MessagePort because the shared fixture defines `window` on Node. This fixture
now selects React's timer fallback by disabling Node's MessageChannel before
imports. No application scheduler, browser worker or solver is replaced.

On 2026-11-04, the isolated Chromium test passed for Equal Length, Equal Radius,
and Coincident using selected-object global UI action dispatch, followed by
undo and redo. It also used the real diameter command and Equal Radius action
to attempt a group linking fixed unequal radii; the complete serialized sketch
and history bookkeeping were unchanged after refusal. The contradictory case
invoked the registered action directly; this is not a physical pointer test.

The tested source was `d5d0b9a9` (parent `065a6fee`, based on `c9e05a18`).
The R730 checkout is `/mnt/data10tb/codi-grouped-constraint-ui-20261104`.
Application `dist/static/index.bundle.js` SHA-256 was
`338bce15471a40d0af955b8765835ccf58bb3e9011fba1b02db88baf15900661`;
test helper `dist/static/webosTest.bundle.js` SHA-256 was
`9fedbd30bb7494bfbeadb677f66085cb8d5dbb38f001535e2372a80d4a35c4da`.
The fixture reused the `.build` workers and `dist` assets from
`/mnt/data10tb/codi-spline-replay-test`; it did not independently rebuild or
qualify those workers. The loopback server did not impose a CSP, so this is
not a CSP or release-build qualification.

The app and matching test helper were rebuilt from this source using the
existing R730 Node and dependency cache. Because that cache resolves through
symlinks outside the checkout, the disposable webpack invocation added the
real paths of `react-toastify` and `.cache/codi-project-worker` to the
corresponding existing CSS and worker include rules. No source rule was changed.
Run the test against a disposable served build and an existing loopback Chromium:

```sh
JSKETCHER_TEST_URL=http://127.0.0.1:19731/ CODI_TEST_CDP=http://127.0.0.1:19329 \
PUPPETEER_CORE_PATH=/tmp/codi-occt-release-control/node_modules/puppeteer-core \
/tmp/codi-files-move-node/bin/node test/webos/grouped-constraint-browser.test.cjs
```

Earlier focused controls show the original three history assertions failing
before `065a6fee`, and the mixed valid/contradictory Equal Radius group failing
before `d5d0b9a9`. The browser test is scoped to one stage and these actions;
it does not establish general multi-stage transaction behavior.
