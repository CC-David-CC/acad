# Direct SMLib provider: bounded browser corpus

The real Worker at CAD source `ab8f97135948236a7a843ff1e18d9ba4c2de0aba` was exercised under loopback strict CSP in an isolated Chromium context. This is provider-level evidence, not a registered CAD-agent graph, save/reopen or undo test. The script checks served SHA-256 hashes before accepting results; no interception, mocked kernel, canvas or GPU is involved.

For each of edge/point/face/disjoint union, contained-box subtraction, and disjoint common, the test creates separate native inputs and compares their complete exposed evidence plus SHA-256 of their fixed-tolerance Float64 triangle buffers before and after the Boolean. This establishes bounded observed preservation, not native byte identity or authored-intent equivalence. Independent analytic box expectations check material and void counts and signed triangle volumes; edge nonmanifold volume is null, never inferred from the kernel volume API. A separate mount cuts two disjoint through-openings (1000→960→920 mm³) and reuses a real empty common result in union (1000 mm³). Signed mesh volume is a test oracle for these boxes, not a manufacturing qualification. Outputs and actual source evidence are in `receipt.json`.

Run with the fixtures/assets below, using an isolated Chrome CDP endpoint:

```sh
PUPPETEER_CORE_PATH=/path/to/puppeteer-core CODI_TEST_CDP=http://127.0.0.1:19329/ JSKETCHER_TEST_URL=http://127.0.0.1:20565/ CODI_RECEIPT=/tmp/raw-corpus.json node test/raw-smlib-corpus/browser.test.cjs
```

## Exact build and asset handoff

- NVIDIA usd-brep upstream base `3fd5b9548d19aa8c12c29bc9637a96d42a06f8a5`; our provider source `e854d6ced3886c8533cea06dd5506e2385fdf6c1`, `research/production-raw-provider-20261105`, in both LAN `usd-brep.git` mirrors.
- CAD provider source `ab8f97135948236a7a843ff1e18d9ba4c2de0aba` (includes shared display helper originally `e28015591`); `research/raw-smlib-provider-20261105` in both JSKetcher mirrors.
- Emscripten SDK 4.0.10 on R730 `/mnt/data10tb/codi-smlib-emsdk-20261105`, CMake 3.28.3, Ninja 1.11.1. Native source build prerequisites and full commands are in usd-brep `research/wasm-solid-contact-20261105/README.md`; use target `raw-provider`, not `raw-contact`. Current candidate build output is `/mnt/data10tb/codi-raw-smlib-contact-build-20261105/`.
- Exact tested runtime: `raw-provider.mjs` SHA-256 `8e49622c97d839cf94d6c4d5e2de6cbd96d1166075741e08dcbda3b1a223d8fa`, `raw-provider.wasm` `4d35fd5b3a37e500d79388523329d5e61560fcd80cb963b2824533d6cf0f8f21`, bundled `raw-smlib-worker.js` `5c17193baaabef79fb4cc6ad4e552e56e36bc9d07fd1b0ebf03ea392eac5f45f`, tested mount source `d79a98f714d0e36489ee91ef450b692c3a5f166c3587d7631d347527dce156a8`.
- Pinned artifacts are retained at R730 `/mnt/data10tb/codi-raw-provider-display-20261105/` and example.invalid `~/codi-artifacts/raw-provider-display-20261105/`. Copy the three named runtime files into a private application build input directory, verify the hashes, then point the application asset builder at them; the mount source belongs to CAD source, and must not be confused with the native glue. Root owns actual application build inclusion and final deployed naming. Do not copy the older `codi-raw-provider-candidate-20261105` artifacts as these are earlier pins.
- To reproduce the Worker in a private CAD checkout with matching webpack (observed 5.74.0): `CODI_RAW_SMLIB_GLUE=/absolute/path/raw-provider.mjs CODI_RAW_SMLIB_OUTPUT=/absolute/private/output node node_modules/webpack/bin/webpack.js --config modules/engine/raw-smlib/webpack.worker.cjs`; the configuration verifies glue SHA before bundling. Verify resulting Worker hash above. The Worker itself hashes the WASM before use; hosting must authenticate the bootstrap and glue.

The test server needs `/static/rawMount.mjs`, `/static/raw-smlib-worker.js`, `/static/raw-provider.wasm`, and a minimal `/static/index.html`; use CSP `default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; connect-src 'self'`. The actual run used `CODI_ENGINE_TEST_ROOT=/tmp/codi-raw-provider-fixture CODI_ENGINE_TEST_PORT=20565 python3 modules/engine/mount/strict-csp-server.py` from the existing CAD checkout. No application packaging or deployment is performed by this recipe.
