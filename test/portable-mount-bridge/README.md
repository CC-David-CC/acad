# Research OCC mount portable-topology path

For the verified OCC mount only, call the existing version-1
`solid.profile.extrude` with `{researchTopology:{version:1}, signal?}` as the
options. The ordinary request and result are unchanged. The optional response
adds a bounded detached `portableTopology` and uses the same real mount-owned
body handle and copied authored `revision`, `sketchDigest`, `faceId`, and
`regionId` in `provenance`. Neither response-local IDs nor the live handle are
persistent names. Other operations and Manifold reject the research option.

`mount.assertPortableBinding(handle, binding, topology)` synchronously checks
the live exact handle, the four-field binding, and the descriptor against the
mount's private detached association. It refuses during another mount job,
after disposal/close, or on mismatch; future callers must check again after any
asynchronous reader work and before publication. The record is cleared on
dispose or worker termination. It proves only association with this live
mount and worker response: the caller must separately bind document generation,
authored revision, source bytes and account/window lifetime.

The controller checks a data-only envelope, counts, the 16 KiB UTF-8 budget,
source IDs/face ordinals against worker evidence, and bounds/triangle count.
This is not solid validation. Full topology and geometric checks must run in
the separate headless reader Worker; no BREP or kernel construction occurs on
the main thread. The current reader accepts only its documented planar prism
subset. No model, history, scene, command or persisted identity is published.

`browser.test.cjs` runs a real pinned OCC Worker, then the real headless reader
Worker with no Verb or DOM. It checks ordinary versus opt-in output, actual
handle/binding, copied-data mutation, wrong mount, disposal and close, malformed
response injection, explicit other-operation/Manifold refusal, cancellation
and a real worker result delayed until after cancellation. The delayed-result
case injects only delivery timing, not geometry. `envelope.test.mjs` has
additional sparse/size/nonfinite controls. Build the reader Worker with
`webpack --config test/portable-mount-bridge/webpack.config.cjs` and copy it to
the isolated engine fixture as `static/portable-reader-worker.js`. The fixture
preparer and pinned input paths are documented in `test/engine-extrude/README.md`.
The bootstrap, envelope and topology modules must all be pinned by a future
release package; this research source does not deploy or promote a runtime.

Lead integration at `f3d1f0f8` passed the two envelope tests and fresh reader
build, then the actual portable mount/reader, authored OCC profile, profile
lifecycle, existing OCI box/Boolean and Manifold box/Boolean suites. Exact
results, source and fixture hashes are in `lead-evidence-20261104.json`.
The shared controller change did not require feature parity: the verified OCC
mount explicitly refuses unsupported empty/non-solid results while Manifold
returns its supported empty and disconnected mesh results.

For the combined fixture, also copy the pinned CSP-safe `manifold.js` and
`manifold.wasm` plus `modules/engine/mount/manifold-verified-worker.js` and
`manifold-delete-failure-double.js` into `static/`. Run this directory's
`browser.test.cjs`, then `test/engine-extrude/occ-profile-browser.test.cjs`,
`occ-profile-lifecycle.test.cjs`, and the two `modules/engine/mount/`
`oci-verified-mount.test.cjs` and `manifold-verified-mount.test.cjs` scripts
serially against the same isolated strict-CSP server. Browser profiles must be
in a directory accessible to the installed Chromium sandbox. These tests do
not change the public engine pin or establish accepted CAD history publication.
