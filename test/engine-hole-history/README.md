# Centered-hole history integration

The descriptor factory is registered in source at `e346c012`, but **not deployed or history-qualified**. It admits only
an exact current candidate LID, captures document/expression lifetime, invokes
the checked adapter, installs its synchronous publication guard and consumes
that exact parent. UI and agent commands will use the same operation.

The trusted descriptor hook `admitGeometry` replaces legacy admission only for
operations that explicitly provide it. Existing operations retain the legacy
representation gate. It is not a public permission or geometry conversion.

Build: `node node_modules/webpack/bin/webpack.js --config test/engine-hole-history/webpack.config.cjs`.
Output: `/tmp/codi-centered-hole-history-build`. The fixture exposes the factory,
actual rectangle adapter and evaluation owner. Compilation is not history
acceptance. Actual cut replay, late-publication mutation/closure, edit, undo,
reopen and renderer tests remain required.

The adapter returns `{model,requireCurrent,publicationCheck}`. The factory adds
the check to the owner exactly once; the adapter must not also register it.
The check combines native binding and model invariants without recursively
calling `owner.requireCurrent()`. Test source changes after adapter return but
before publication, including closure of its native mount.
# Controlled centered-hole history admission

On `59caa7ad601d4dfcb38426516e30ef781ec1af54`, the browser test passes with
real authored-sketch Worker, actual pinned embedded OCC Worker, two projected
`MBrepShell` prisms, an evaluation owner and the actual candidate registry. The
controlled adapter returns the second prism as a stand-in; it is **not a hole**
and does not exercise cut geometry, native hole ancestry, craft history
publication, or the craft dispatch hook. Test checks real LID admission,
BASE, invalid diameter, nonregistry face and changed registry refusal, missing
publication guard, returned parent consumption/result identity, stale storage
revision at publication and closed owner refusal.

Build with `PATH=/tmp/codi-files-move-node/bin:$PATH ./node_modules/.bin/webpack
--config test/engine-hole-history/webpack.config.cjs --output-path OUTPUT`.
Prepare a strict-CSP fixture with `test/engine-extrude/prepare-fixture.py`; copy
`OUTPUT/entry.js` to `static/hole-history-entry.js`,
`OUTPUT/semantic-worker.js` to `static/rectangle-semantic-worker.js`, and the
pinned embedded OCI worker (not blob-import worker) to
`static/oci-verified-worker.js`. Serve with `strict-csp-server.py` and run
`JSKETCHER_TEST_URL=LOOPBACK CODI_TEST_CDP=LOOPBACK
PUPPETEER_CORE_PATH=PATH_TO_PUPPETEER /tmp/codi-files-move-node/bin/node
test/engine-hole-history/browser.test.cjs`.

Passing fixture pins: entry `7565eccf7b7a0b4f0d24578c0379211d01d81f56e8d95395d919650e252681cb`,
semantic worker `8989caa093bf866bb8a6110ea8f968c0db08e5f590b0694ed4c12a4d2c939cf9`,
embedded OCI worker `c8071b97322759d8beb8085dab2254fed7010cb56613035d8c3e93a5c6990921`,
WASM `a2b2f7daf6a4eb98b975f8aec136f6cbaf2720295ea32e71edb13ff4c5ceaecb`,
sketch worker `552766a0931c21409d26a3edc771262f924fc611d4c8d9376ef26c72ed3c35a0`.
