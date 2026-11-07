# CAD Modeler branding — scoped PASS

Product source `e5f603b609fe2b9948c4fa03181a706f4a9ee759` changes only `uiConfigBundle.js`, `coreActions.js` and `index-webos.html`: removes Donate/GitHub from the footer configuration and remote action definitions, and sets the HTML title to exactly **CAD Modeler (JSketcher inspired)**. No geometry, history, solver or Worker code changes.

The ordinary application was rebuilt using the exact qualified6f `.build` and `dist` prerequisites, via `node node_modules/webpack/bin/webpack.js --config test/combined-axis/webpack.app.cjs`, followed by copying the authored HTML entry. Native providers and Workers were not rebuilt. Build exit0. Runtime and complete pins remain outside Git:

`/mnt/data10tb/codi-cad-inspired-branding-20261106-r1/`

Pins: `.build/inspired-branding-pins.json`, SHA256 `d6d2fe8a6d784ece9dec258551b06c0f85af89d349a196d991830e543586c17d`.

App SHA256 `d78d53333222222404fcd030d187b655a24132f750a429b0fa55cbd9b8c1b319`; HTML SHA256 `fd42181f1f5e0630d06bacc5362a404f927c179cbed3b1eea8aa1e752da59e80`.

All 11 remaining pinned selected/default/Manifold/native/solver/project/semantic assets match the qualified6f baseline byte-for-byte. The app references exactly one unchanged sketch, project and semantic Worker and contains no `webosTest` entry. Geometry corpus acceptance is inherited from those unchanged components; this lane does not claim it reran the corpus.

`browser.cjs` opens the real normal app in its own fresh Chrome browser context on loopback20689, checks the served app hash, exact document title, actual visible menus/canvases and absent Donate/GitHub DOM elements and action registrations. `browser-receipt.json` passes. No overlay, DOM substitution or fake UI is used. Parent owns desktop window/catalog labels and the managed final artifact; nothing was deployed by this lane.

The first test oracle omitted the existing Debug menu appended by `debugBundle.js`; its assertion failed. `initial-assumption-failure.json` retains that test limitation. The corrected oracle explicitly preserves Debug; product code was unchanged during correction.
