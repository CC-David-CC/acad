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
`--experimental-local-only --update-manifest`. It needs Node, npm and Git
access to the pinned fork. The prepared OCCT source and dependency notices do
not establish that the WebAssembly binary was built from that exact source;
the build receipt explicitly leaves reproducibility unverified. Provenance and
license review are release gates. Generated assets and `node_modules` are not
committed. The current experimental pin is `7242e2d6f5778e1670ad30b1061bb79243bb637b`,
including the opt-in numeric change. Run the normal public app builder only
after the preparer succeeds and its asset manifest is reviewed.

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

The adapter refuses non-isolated state and injects the captured production CSP
only into this preview process; it leaves the ordinary preview source alone.
The browser test requires `puppeteer-core` and a Chrome DevTools endpoint
(default `http://127.0.0.1:19255`). It intercepts the helper request inside
the test session and does not add the helper to the public catalog. It creates
disposable accounts in that isolated preview and removes its project file.

The experimental surfacing research branch extends the local inspect command
to account for surfacing and feature counters in its dirty-state result. The
runtime and generated manifest in this checkout are not automatically updated
by that change. The surfacing-enabled fork must be pinned, prepared and reviewed
separately before distributing or deploying this host adaptation.
