# jSketcher

**In development; not available in the desktop yet.** This integration embeds
our [jSketcher fork](https://github.com/CC-David-CC/jsketcher) with an independent
temporary CAD workspace per window. Its File menu asks the desktop host to open,
save, or save a copy of a `.jsketcher.json` project in the signed-in account's
My files. Projects contain the modeling history and sketches together. A save
first writes the browser mirror; it can still be pending or conflicting while
server synchronization runs. The Linux guest filesystem is separate.

The host checks the selected file version and stages an open in a separate
window before replacing the current model. A failure keeps the existing model.
Saving captures one model snapshot: changes made while saving remain unsaved.
Finish an open sketch or operation and return to the newest history before
saving. Assembly constraints and custom workbenches are not yet supported by
the project bridge; it rejects those projects instead of silently dropping data.
A rebuild failure leaves the candidate workspace unusable and it is discarded.

An isolated research shell registers this app, associates `.jsketcher.json`
files, and includes `w.jsketcher?.hasChanges?.()` in its window close guard.
These shell changes have not been deployed. Upstream local-file export routes
and dialogs also require review. Embedded code is same-origin and the iframe
sandbox is **not** a security boundary from the desktop.

Local desktop and emulated-phone tests using the real CAD engine and an in-memory
stand-in for the file mirror cover a sketch/extrusion, save, a second-window
restore, malformed input, source-version change, an edit during save, forged
parent-window messages and disposal. A separate local solver probe created two
nonparallel segments and verified the actual parallel-constraint solver produced
finite, parallel geometry. With an experimental opt-in numeric build and a fork
that restricts expression execution, these tests passed with the live site's
exact CSP applied to the iframe response. Targeted hostile model/sketch
expressions and a nonfinite expression were rejected without their script side
effects or replacement of the open model.

The upstream default numeric runtime uses dynamic JavaScript generation and
does not start under the site's `script-src 'self' 'wasm-unsafe-eval'` policy.
The experimental build precompiles known numeric operations and rejects
unrecorded dynamic factories; its solver compatibility, complete dynamic-code
coverage and ability to handle arbitrary hostile CAD files remain unqualified.
In the isolated research shell, local registered-account desktop and
emulated-phone tests created a sketch and extrusion, checked the dirty-close
dialog, saved to the browser mirror, compared synchronized server bytes,
opened in a second window through the My files picker, and reopened in a
fresh browser context using the desktop's file-association router. A second
account's mirror returned `File not found.` and its signed server request
returned HTTP 404. The tests checked that both original iframe elements were
detached and their close callbacks removed. They used the exact captured live
CSP and a test-only intercepted CAD helper; they did not use the Files app UI.
Separate physical devices, physical touch, broad CAD fidelity, full app
security and arbitrary hostile files remain unverified. Do not publish the app
or relax the desktop CSP to accommodate it.

The in-page `inspect` command reports the current path, dirty state, total
operation count, up to 100 operation type names of at most 128 UTF-16 units
each, and sketch count. It refuses an open sketch, unfinished operation,
failed rebuild, rewound history, or ongoing file operation. It reads the
workspace without calling the project-save or storage-write functions.
Local registered-account desktop and emulated-phone tests covered those
guards, bounded names, independent windows and registration cleanup; the
processing flag was forced in the host test, with real pipeline behavior
tested separately in the fork. The dirty comparison serializes the model and
sketches locally, so memory use grows with project size. Inspection is not
CAD or manufacturing validation, and it is not a remote-agent interface.

## Rebuilding and local testing

`prepare.py` currently produces **local-only experimental output** using
`--experimental-local-only --update-manifest --manifold-research-input /path/to/staged-inputs`. It needs Node, npm and Git
access to the pinned fork. The prepared OCCT source and dependency notices do
not establish that the WebAssembly binary was built from that exact source;
the build receipt explicitly leaves reproducibility unverified. Provenance and
license review are release gates. Generated assets and `node_modules` are not
committed. The current experimental pin is `5713236d59480d8776bfa1406d961437dd3a61f5`,
including opt-in numeric and source-built Manifold changes. The local input
directory must contain the pinned Manifold JS/Wasm, source archives and build
receipt; hashes are checked before use. Two matching builds used the same R730
toolchain, so this is repeatability rather than independent provenance. Run the normal public app builder only
after the preparer succeeds and its asset manifest is reviewed.

An optional `--occt-source-research-input /path/to/occt-input` selects one
specific source-built interpreter for local research. Put the exact `occt.js`
and `occt.wasm` in that directory, together with `build-receipt.json` copied
from the checked-in `occt-source-build-receipt.json`. The preparer hashes the
bytes it copies, checks the receipt and fetched source tree and notices, still
verifies the installed npm artifacts first, then checks the final built files.
The normal pinned npm engine remains the default. Both paths still require
`--experimental-local-only` and the Manifold research inputs.

The candidate was built from the source commit in the receipt, but its Wasm
is not byte-identical to the published npm binary, and two independent builds
also differed. The limited geometry tests do not establish equivalence. The
interpreter root license is separately included as
`OCCT-INTERPRETER-LICENSE.txt` alongside the OCCT LGPL and exception notices;
the root license has distinct terms requiring independent review. The exact
source archive and build evidence are described in the receipt and in the
source-only `research/occt-source-provenance-20261102` branch. Neither this
option nor its notices establish permission to publish, complete corresponding
source, or independently reproducible binaries. Do not deploy the result.

For the isolated host harness, stage a tested upstream build at
`/tmp/codi-jsketcher-host-test/node_modules/jsketcher-build`, bundle `index.mjs`
with esbuild (CSS may use the `empty` loader for this harness), copy
`tests/fixtures/jsketcher-host-harness.html` to the staging directory as
`index.html` along with this app's `style.css`, and serve the directory on
loopback. The CAD test helper `static/webosTest.bundle.js` must be built using
the fork's `test/webos/webpack.config.cjs`. Then run
`tests/jsketcher-host-local.test.mjs` against the loopback server and a local
Chrome DevTools endpoint; set `CODI_PHONE=1` for an emulated-phone viewport.
The harness is not a replacement for desktop or live-account testing.

For the isolated registered-account test, first prepare the app assets and
build a local app bundle with `jsketcher` selected. Build the test-only CAD
helper from the same pinned fork using `CODI_EMBED_NUMERIC=1` and
`test/webos/webpack.config.cjs`; keep its output out of the app bundle. With
the project Python dependencies installed, run:

```
python tests/jsketcher-preview-csp.py --isolated --port 19725 --apps-bundle /path/to/local/bundle
JSKETCHER_HELPER_PATH=/path/to/webosTest.bundle.js timeout 240s node tests/jsketcher-account-integration.test.mjs
CODI_PHONE=1 JSKETCHER_HELPER_PATH=/path/to/webosTest.bundle.js timeout 240s node tests/jsketcher-account-integration.test.mjs
```

For the final local Manifold candidate, use
`tests/jsketcher-final-account-integration.test.mjs` with the same environment.
At b9e57cdf, b1b818ad and bcab4a2f, desktop and emulated-phone registered-account runs passed: the
product's own Manifold initialized and fetched its Wasm under captured CSP
before the test helper loaded; the modeling icons loaded; DXF import, surfacing
save, exact server sync, separate-window isolation and fresh-session reopen
passed. This does not independently establish general native/OCC equivalence,
physical-phone behavior, provenance or release clearance.
At b1b818ad, a separate strict-CSP test covered XYZ movement and history, and
six bounded native/OCC box cases. A 0.000001-unit overlap was retained by the
native path but treated as empty by OCC; this tolerance discrepancy remains.
At bcab4a2f, `tests/jsketcher-native-account-integration.test.mjs` also passed
on desktop and emulated phone with real isolated accounts: two native boxes,
intersection, engine-mixing guards, history, browser/server sync and fresh
Files reopen. It drives action and wizard services programmatically; it does
not qualify all physical touch or manual UI gestures.
The surfacing patch toolbar, OCC tools, and separate Native Mesh Box and Native
Mesh Boolean actions are present. A model-wide engine selector and complete
native equivalents are not implemented; incompatible engine solids cannot be
mixed.

At UI candidates 7e9233b8, dc6bd9d9, ab6a44e1, c162e17c and 5713236d, `tests/jsketcher-native-ui-account.test.mjs`
passed at 1080p, 4K and emulated-phone viewport sizes against real isolated
accounts. It clicks native and OCC toolbar actions, enters numeric fields,
chooses native Boolean operands, saves, closes and reopens through Files.
The dc6bd9d9, ab6a44e1, c162e17c and 5713236d runs also select an OCC body and rotate it through the wizard. The c162e17c and 5713236d tests additionally scale the body and check that its measured bounds double. These account tests do not exercise the object explorer; see the fork’s separate real-sketch explorer tests.
Phone dropdown choices use browser automation after a touch; a physical phone
and the full range of 3D pointer interactions remain unqualified.

The adapter refuses non-isolated state and injects the captured production CSP
only into this preview process; it leaves the ordinary preview source alone.
The browser test requires `puppeteer-core` and a Chrome DevTools endpoint
(default `http://127.0.0.1:19255`). It intercepts the helper request inside
the test session and does not add the helper to the public catalog. It creates
disposable accounts in that isolated preview and removes its project file.

The experimental surfacing branch extends the local inspect command to account
for surfacing and feature counters in its dirty-state result. The combined
local candidate still requires independent source, notice, provenance and
runtime review before distribution or deployment.

Vendored PNLTRI 2.1.1 is loaded by the application HTML. Its delivered
`lib/pnltri.js` SHA-256 is pinned by the preparer; compared with
`build/pnltri.js` in upstream `jahting/pnltri.js` commit
`72f162d39da3a84c78ff16181940da79f3f50ba9`, its two differences are
whitespace only. The packaged `PNLTRI-LICENSE.txt` is the exact upstream MIT
license and copyright notice; the preparer verifies both hashes. Source:
https://github.com/jahting/pnltri.js/tree/72f162d39da3a84c78ff16181940da79f3f50ba9

`index-webos.html` also loads `verb.js` and `diff_match_patch.js` directly.
The original jSketcher `verb.js` at commit `933f7ae4` is byte-identical to
`build/js/verb.js` in upstream `pboyer/verb` commit
`976e8bcf167ea115fb0d70584d575e4efd9c449c` (package version 2.0.1). The
current fork includes later modifications. `VERB-LICENSE.txt` is that upstream
commit's MIT license and copyright notice. The current `diff_match_patch.js`
is byte-identical to `javascript/diff_match_patch.js` at upstream
`google/diff-match-patch` commit `0ae308daa77aeddb089cd6b7b0a443fca026266e`.
The archive supplies that commit's Apache 2.0 license and the copyright/license
header from its uncompressed source, separately, since its minified file has no
header. These matches do not prove the complete source or notice requirements
of the generated libraries and their incorporated components. Exact delivered
asset and notice hashes are enforced by the preparer.

The webpack bundle includes `babel-polyfill/node_modules/regenerator-runtime`
0.10.5. Its installed `runtime.js` matches upstream commit
`74c76264bf3be1f2bf60082c2e03dec522c96816`, tag `runtime@0.10.5`.
Although its npm metadata says MIT, that source file identifies the upstream
Facebook BSD license and accompanying PATENTS grant. Both exact upstream texts
are supplied, with the source file and notice bytes checked by the preparer.
This evidence is retained for independent rights review.

The separate JavaScript `clipper-lib` 6.2.1 dependency is also a webpack
candidate. Its package source identifies Angus Johnson and Boost Software
License 1.0; the preparer verifies its source hash and includes that copyright
and attribution header and the Boost 1.0 license text. This dependency is
separate from the C++ Clipper2 source archive supplied for Manifold.

This does not close the notice inventory. The webpack inventory flags, among
others, emitter-component 1.1.1 for review, and the OCCT and
toolchain/transitive inputs remain separate review items. The package retains
the local-only gate and makes no claim of legal or source completeness.
