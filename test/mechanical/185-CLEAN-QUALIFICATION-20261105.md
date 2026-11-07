# Clean 185 directional snapshot qualification

Exact source: `185e1b9d38e44b75a49111500cabc230ab11fc6d`. The private R730 build is `/mnt/data10tb/codi-185-clean-qualification-20261105`. Its `dist` was created with only unchanged `lib-assets`, `img`, `index-webos.html`, `lib`, `css` and `index.html` copied from the prior c86 fixture; no prior `static` directory, bundles or Workers were copied. All physical-parameters, sketch, project-validation, manufacturing-hash and prism Workers were rebuilt from 185, followed by the app, test helper and TypeScript (`--noEmit`). The prism build reverified the pinned OCC WASM; no kernel rebuild occurred. Dependencies and cache were private to this build.

Each versioned sketch-solver, project-validator, physical-parameters, manufacturing-hash and prism-semantic Worker glob has exactly one file. Key SHA-256 values:

- app `903caa50ca7940dec258b2bf56400f4dc2961f6603084eb8edb8c3c0893ccdc8`
- sketcher `4fafc562cff77e176eb2fca9f79f86f667767a96625bf85cd8bc4b8a2b754c91`
- test helper `83b585e7a7c9636da31d07f2158a73c545120bb5f8330442de4ea4299481311e`
- sketch Worker `7719baa02f787e33d73bbfbfb0a827ab49071cf077a0a8fb865061747216bf68`
- project Worker `02cc95ca855cc53ed2e35d8b597cd61321f461aa325f9e5e2a5887fe97fac758`
- physical Worker `7c6d2c98eb76958c42dde70f46caa040ec259f57b9884398c2f9b064ff2df175`
- manufacturing hash Worker `3f7cf784c31276d9cca6f700bb524fd3ecf6cf39763c686e43b5d350fdf08125`
- prism semantic Worker `9d9403d70eb38695ae580bc9759f691610150ae44aba74c045e48060f63780d4`
- OCI Worker `4a2d2a32f895bd5c43af4c048394a698c17f1c05cd62dd37e7b2e0872518ed04`
- OCC WASM `13617eda9a2118edfd1244b5d46523e7d9628a87ec995a0237b2b5cc58d532f2`

The two source controls in `directional-snapshot-release.test.mjs` pass successful last projected relation removal and preservation of the same snapshot on injected invalidation failure. Two independent controls in `directional-snapshot-release-extra.test.mjs` pass mixed Collinear+AxisSymmetry retention until the final removal and snapshot preservation when final symmetry removal fails. The 29 existing signed-distance/revision controls pass. `directional-snapshot-release-browser.test.cjs` additionally uses the actual sketcher to add and remove the last ProjectedDistance, confirming `projectedLastValid` is null, the directional count is zero and geometry remains finite.

Actual Chromium UI controls passed Collinear and AxisSymmetry selection/native replay, three real directional drags, conflicting relationship rollback and recovery, signed X/Y/projected editor/history/native replay, revision/stale-geometry refusal, and the affine length UI plus matching Worker. Separate strict-CSP real Worker controls passed Collinear/AxisSymmetry and signed X/Y/projected distance. The latter fixture's only 404 was `/favicon.ico`; client, Worker and Verb returned 200. The test-only client bytes were reused from c86 after verifying its source and entry are unchanged; Worker bytes are the freshly rebuilt 185 Worker.

Retained loopback fixtures for independent review: app `http://127.0.0.1:20240/`, strict-CSP Worker `http://127.0.0.1:20241/`, Chrome CDP `http://127.0.0.1:20212/`. The app fixture uses the existing policy that permits `blob:` in `script-src`; the Worker fixture uses `script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'`. These are component tests, not signed desktop acceptance or deployment. The previous c86 artifacts were retained.
