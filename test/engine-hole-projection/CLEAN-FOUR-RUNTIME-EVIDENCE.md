# Clean four-corner-capable runtime: existing centered-hole regression

An isolated R730 checkout of exact CAD commit
`160620f2cf1ad55ca7f738844ba66692c95b0280` at
`/mnt/data10tb/codi-four-corner-clean-integrated-20261104` ran a fresh
`npm ci --ignore-scripts --no-audit --no-fund`, the six-input
`build/prepare-webos-runtime.cjs`, and the ordinary
`CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1 npm run build`. The default app
build completed and `dist/.rev` reports that exact commit. The test-only
`test/webos/webpack.config.cjs` helper was then built from the same source and
inputs; `tsc --noEmit` completed with an empty diagnostic log. No shared source
or dependency cache was modified.

The Worker uses the clean-library line-frame OCC runtime: original JS
`81996d394b9fd2fcd7b02a0448bf7968c2decc04969d2be7ace4512cbfc5620a`,
embedded portable glue `a8774acbbe3a90d7c82fe294c769096179eae351e5a8c854d4d0a31737a706ee`,
and WASM `13617eda9a2118edfd1244b5d46523e7d9628a87ec995a0237b2b5cc58d532f2`.
The native source is `8c4f30048fe65d9205c310d164b45d00d3fe77c3`;
`test/engine-four-corners/CLEAN-BUILD.md` on the research branch records the
fresh OCCT-library build and checked child-source link. The original main-thread
OCC and Manifold artifacts are separately pinned by the preparation script.

Actual emitted hashes:

- `static/index.bundle.js`: `6b206f7d650c6e990fe636628534503b54aef3ee49e0033d8ff3c6d393aacabf`
- `static/oci-verified-worker.js`: `b0713d865ec90f3778f65118098138a86fc6dba707070374f9eb166d5e03a3ca`
- `static/occ-portable.js`: `a8774acbbe3a90d7c82fe294c769096179eae351e5a8c854d4d0a31737a706ee`
- `static/13617eda9a2118edfd12.wasm`: `13617eda9a2118edfd1244b5d46523e7d9628a87ec995a0237b2b5cc58d532f2`
- test-only `static/webosTest.bundle.js`: `51fa83afe22515e26669428497699319e2a650519429fac5a997d20513cdfce4`

The exact `dist` was served from R730 over an SSH-forwarded loopback server
using `script-src 'self' 'wasm-unsafe-eval'` and `worker-src 'self'`; it did
not allow blob scripts or JavaScript unsafe-eval. Real Chromium in fresh
incognito contexts ran these unmodified tests from the exact source commit:

- `history-browser.test.cjs`, SHA-256 `c0b72471272d0d6475cf654ff970dbbb2568d279cfe49fc253b901a950ca784d`: actual authored prism and centered hole, dimension and depth changes, invalid edit, undo/redo, native snapshot/reopen, and wizard commit passed.
- `diameter-history-browser.test.cjs`, SHA-256 `2bf336c54ed665688686e5ae868a1d4b2a90a01f536f03dcdf48f76d70e6d784`: diameter 10→8, independent mesh sections, retained history/registry on invalid or touching edits, repair and fresh reopen passed.
- `history-abort-browser.test.cjs`, SHA-256 `29d197cf8e1973b038c15318a4006dde4089fcb609fd01427b515157e080b70f`: abort after native cut dispatch terminated its Worker, rejected with AbortError and retained the prior six-face model/history.
- `hidden-restore-browser.test.cjs`, SHA-256 `bf6cb17e8ceb3e35c09c8fce6962b865a6f1a77595494701a1dd91a4f6abbbd3`: hidden-page restore finished with the expected history and no running replay.

Tests bind a local test host lifetime and do not establish signed parent/My
files behavior, public deployment, four-corner history publication, broad
geometry, manufacturing correctness, or independent runtime reproducibility.
The R730 checkout, `dist`, and build logs are retained for inspection.

The test-helper webpack build emitted two warnings: `sketcherTPI.js` imports a
`distance` export not provided by `math/commons`, and `react-icons/all.js` has
conflicting Io star exports. The four controls above passed; they do not
qualify the affected untested helper paths or every icon.
