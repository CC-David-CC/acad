# Default project validation worker under strict CSP

The signed Save control exposed a build footgun: project-worker webpack used
the optional app numeric flag. Without it, npm numeric tried Function.apply
at worker startup and CSP blocked project reopen. The sketch worker already
required the prepared numeric alias. Project validation now does likewise;
the standalone build:project-worker command first generates the pinned numeric
module. Missing preparation fails the build instead of emitting an unsafe
worker. No browser policy was relaxed.

The integration lead built the worker with CODI_EMBED_NUMERIC unset and ran
project-worker-csp-browser.test.cjs in actual Chromium with no unsafe-eval,
no injected numeric implementation and no test helper. Both an empty native
document and the synthetic enclosure/material document from the failed signed
reopen were accepted; unsupported version999 returned a structured rejection.
Workers are terminated and the isolated context closes after each run.

Default-built worker SHA-256:
ad525e6c97b2c00b037c2a9fff7e472f176363a150b9545c96b2eed8649768f3.
This matches the correctly flagged signed fixture's worker byte for byte.
The committed synthetic-only native input, with no account/session data, is
test/fixtures/project-worker-native-v2.json, SHA-256
27ccd7a62cead12035405119debd1c23b2ebd22cd640d8a010dc05a28cfa2ffa.

Reproduce by running npm run build:project-worker with the numeric flag unset.
Serve a disposable loopback fixture containing index.html, static/worker.js
from node_modules/.cache/codi-project-worker/worker.js, and lib/verb.js from
web/lib/verb.js. Return this header for every response:

```text
default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; connect-src 'self'; object-src 'none'
```

Then run with JSKETCHER_TEST_URL pointing to that loopback fixture,
CODI_TEST_CDP pointing to a separately running Chromium, and
PUPPETEER_CORE_PATH pointing to puppeteer-core:

```sh
node test/webos/project-worker-csp-browser.test.cjs
```

An optional CODI_PROJECT_INPUT_PATH selects another synthetic native input.
This is worker/CSP evidence; signed account Save/reopen has its own desktop
receipt, tests/jsketcher-agent-save-signed-20261104.md. Neither is a final
combined beta activation or full-agent bracket completion claim.
