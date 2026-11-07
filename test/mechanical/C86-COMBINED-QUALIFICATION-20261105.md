# c86 combined mechanical qualification

Source: `c86c437e90cd1ab262d741076ba9723d5b5d7b99`. Private R730 build `/mnt/data10tb/codi-c86-combined-qualification-20261105`, with a private copy of dependencies and caches. Node 24; `CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1`. Rebuilt `build:physical-parameters-worker`, `build:sketch-worker`, `build:project-worker`, `build:manufacturing-hash-worker`, `build:prism-workers`, the main app, and `test/webos/webpack.config.cjs` helper. The direct TypeScript entry passed with `--noEmit`. The prior pinned OCC WASM was verified by the prism build; no kernel/source rebuild occurred.

Referenced asset SHA-256:

- app `1cea4f414d03540d437026fbdb49ac26e830193c918f94c4aa1b0621bd6804de`
- sketcher `d9898e9d9506ef6e3af25e750663f44144437c1087a64ac671a8b6c0a311c584`
- test helper `83b585e7a7c9636da31d07f2158a73c545120bb5f8330442de4ea4299481311e`
- sketch Worker `80e52f75b9fdd22a555b3e3ccabc640c3c5c3dabbb6260e31bcc5846c33e3690`
- project-validation Worker `02cc95ca855cc53ed2e35d8b597cd61321f461aa325f9e5e2a5887fe97fac758`
- physical-parameters Worker `7c6d2c98eb76958c42dde70f46caa040ec259f57b9884398c2f9b064ff2df175`
- manufacturing hash Worker `3f7cf784c31276d9cca6f700bb524fd3ecf6cf39763c686e43b5d350fdf08125`
- prism semantic Worker `9d9403d70eb38695ae580bc9759f691610150ae44aba74c045e48060f63780d4`
- OCI Worker `4a2d2a32f895bd5c43af4c048394a698c17f1c05cd62dd37e7b2e0872518ed04`
- pinned OCC WASM `13617eda9a2118edfd1244b5d46523e7d9628a87ec995a0237b2b5cc58d532f2`

Five transaction helper, 16 line-relation, 29 signed-distance/revision, 13 affine-length, 25 combined transaction/typed-journal/rectangle/physical-quantity and 5 physical number/publication controls passed. The 25-count includes the five helper controls; it is not an additional 25 independent cases. An initial local Node invocation lacked `acorn` because that checkout had no dependencies; rerunning the same pure tests with the private R730 dependency tree passed 25/25. Bundled test-only webpack wrappers placed output under `.build/qualification-tests` and did not change production source.

Actual Chromium application controls passed: selected Collinear and AxisSymmetry actions and native replay; real Collinear, AxisSymmetry and ProjectedDistance drags; contradictory relationships and rollback recovery; reference/driving segment-length conversion, fast-pointer measurement, strict native reopen and injected rollback recovery; EqualLength/EqualRadius/Coincident selection and history; affine length and EqualLength Worker path; signed X/Y/projected selection, editor, history and native replay; typed bracket transaction, failure/cancellation, undo/redo and native reopen; typed bracket and typed parameter UI on desktop and phone-sized viewports; and typed extrusion history and string/Blob restore. These include synthetic setup and deliberately injected faults, as specified in each test, and do not claim physical phone testing or a complete solver/feature catalogue.

Separate real Chromium sketch Worker controls passed Collinear/AxisSymmetry, signed/projected distances and typed rectangle binding under test-only `script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'`. The Worker test fixture uses the freshly built `.build/headless-sketch-worker/worker.js` (`80e52f75...`) and a client built from `test/webos/headless-sketch-client.config.cjs`. The existing typed-rectangle Worker test has a fixed `/tmp` input path; for isolation a test-only copy changed that path to `/tmp/codi-c86-typed-worker` and used the same Worker bytes and Verb asset. No app or Worker code was changed for this test.

Retained direct app fixture is `http://127.0.0.1:20235/`, strict-CSP Worker fixture `http://127.0.0.1:20236/`, and Chromium CDP `http://127.0.0.1:20212/`; all loopback and disposable. The app fixture uses the existing `test/engine-hole-projection/serve-app-fixture.py` policy, which permits `blob:` in `script-src`; only the separate Worker fixture has the stricter policy stated above. These are component tests, not the signed desktop acceptance or a deployment. Independent signed desktop qualification is owned by lead.
