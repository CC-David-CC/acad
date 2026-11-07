# Source-bound sweep preparation controls

These tests cover the eleven-field authored definition, two captured source
frames/digests, raw Arc branch/direction, immutable asynchronous preparation and
the production semantic Worker dispatch. They do not claim a solved sketch,
native solid, shared history, app command, Save/Open or full E14 qualification.

Run offline controls with Node24:

```sh
node --test test/selected-profile-sweep/*.test.mjs
```

The independent review's six assertions are retained with only the absolute
source import prefix made relative. Original review/source hashes and scope are
in `evidence-r1/independent-review.json`. The combined42 count additionally runs
the existing8 revolve contract and7 ledger admission tests.

Build the actual production semantic Worker without changing native caches:

```sh
node node_modules/webpack/bin/webpack.js --config build/webpack.prism-semantic-worker.cjs --output-path /tmp/codi-sweep-semantic-worker-20261107
python3 test/selected-profile-sweep/serve-semantic.py /tmp/codi-sweep-semantic-worker-20261107 20933
```

In another process, use an existing private Chromium CDP endpoint and a fresh
evidence directory:

```sh
CODI_TEST_URL=http://127.0.0.1:20933/ CODI_TEST_CDP=http://127.0.0.1:19329/ CODI_EVIDENCE=/tmp/new-sweep-component-evidence PUPPETEER_CORE_PATH=/path/to/puppeteer-core node test/selected-profile-sweep/semantic-browser.mjs
```

This mounts no canvas or simulated app UI. The blank loopback host serves only
the actual Worker bundle; Chromium owns source preparation off the UI thread.
The driver closes its own context and disconnects without closing shared
Chromium. Stop the owned Python server afterward. It is not a deployed service.

The native implementation and analytic oracle are separate lanes. Their output
must be integrated and qualified through the real shared operation, history and
native file path before E14 can pass. See `docs/CAD1-SWEEP-20261107.md`.
