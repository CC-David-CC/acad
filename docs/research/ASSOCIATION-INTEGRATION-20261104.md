# Candidate association integration check

Base `effc3717740b2c3ba65269fd16bc392fc8b41388`; association and projection-invariant changes cherry-picked from `49eaf5af` and `071b1dac`. The existing model projection is already present in the base. No cut or user-facing operation is added.

On this branch, `node --test test/coreTests/centered-hole-intent.test.mjs test/coreTests/candidate-prism-ledger.test.mjs` passed all 12 tests. A freshly built `candidate-webpack.config.cjs` entry and semantic worker were run in Chromium against an isolated loopback strict-CSP fixture. `candidate-ledger-browser.test.cjs` passed with the real OCC worker and model: owner binding, mutation rejection, lazy caches, abort, accepted/closed and foreign owner controls; 20 resolutions averaged 2.085 ms in this run. A repeat with response-URL instrumentation identified the sole 404 as `/favicon.ico`; no worker or module request failed, and the assertions passed again. This is not end-to-end hole creation or a performance guarantee.

Fresh bundle hashes: entry `1cd30a9aa314e8def051ae4c7b43bc2d1ea6896b1122326e7af2cf3171076e89`; semantic worker `facc7e2eb4c9cf9671ba472eee0af24845051e9ec651b10770ce03e05d6c785f`. Fixture worker `c8071b97322759d8beb8085dab2254fed7010cb56613035d8c3e93a5c6990921`, OCC JS `4a53dec0dceb5715d070fa7293f6515ab681f6d3de979099526e616dbd052ddc`, WASM `a2b2f7daf6a4eb98b975f8aec136f6cbaf2720295ea32e71edb13ff4c5ceaecb`, sketch worker `75c0d7358f9278571ab5fffe69de77c1eb6df3227a4cc8bc7109f66cfb0587d0`. Runtime and fixture are local test inputs, not a release package. See `test/worker-rectangle-adapter/README.md` and `test/engine-extrude/README.md` for preparation; the test uses loopback `JSKETCHER_TEST_URL`, `CODI_TEST_CDP`, and `PUPPETEER_CORE_PATH`.

Registration is trusted internal adapter code, not an authentication boundary. The adapter's captured source and guards remain required; frame/depth/sketch bytes are not independently authenticated by the mount binding. Native Mesh, actual cut, topology expansion, publication, history, save/reopen and integration into the UI remain unqualified. No DOM or canvas is introduced into worker contracts.

## Integration lead verification

The root integrated the association and invariant changes as e0dd4f86 and
3848039a. All 12 focused unit tests passed independently. Fresh bundles built
from the combined integration tree passed both the actual candidate-ledger
Chromium/OCC test and the existing authored-profile adapter test under self-only
script CSP. The latter includes two prisms sharing one owner mount, width
rebuild, publication validity, cancellation and bounded ID refusal.

The candidate entry SHA was
`d08f61295c1d18fce4337be3fd5be8dd4f3d78724c353ee2875f05768c3d2d0c`;
the semantic worker was
`8989caa093bf866bb8a6110ea8f968c0db08e5f590b0694ed4c12a4d2c939cf9`.
The embedded runtime worker/glue/WASM pins match those recorded above. The
14 mutation controls passed; 20 resolutions averaged 2.065 ms in this run,
not a performance guarantee. The incidental favicon 404 remains. Build size
warnings are recorded: approximately 518 KiB entry and 417 KiB semantic worker.
Only the owned browser, profile, server and temporary bundles were removed.
No hole, history publication, full plate or new desktop deployment is implied.
