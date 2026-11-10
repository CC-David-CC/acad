# Analytic Arc native build — 2026-11-10

Build evidence only; no browser, geometry, accuracy, or Gate 1 test ran.

The first build of Native `83598373` failed because the pinned OCCT
five-argument `BRepBuilderAPI_MakeEdge` requires a `Handle(Geom_Curve)`,
not `gp_Circ`. Its preserved log is
`/mnt/data10tb/codi-occ-analytic-arc-build-20261110-r1/build.log`.
Native `147015f5349e85b8bf9e5025012944b3f03d81ae` uses a `Geom_Circle`
handle around the same circle, retaining vertices and parameter range.

The corrected source built successfully in a detached, task-owned worktree
`/mnt/data10tb/codi-occ-analytic-arc-buildsource-20261110-r2`, using the
existing `codi-occ-four-corner-clean-20261104` Emscripten SDK, OCCT headers
and static libraries. The CommandInterpreter headers and `scripts/call.js`
came from `codi-occ-mechanical-native-source-20261109-r1`; `call.js` was
verified to match the exact Native commit's Git object. The link used the
repository's existing `build-selected-profile-v2.sh` flags and libraries.
Output and full build log remain at
`/mnt/data10tb/codi-occ-analytic-arc-build-20261110-r2/`.

| Input or output | SHA-256 |
| --- | --- |
| Native `ownedAnalyticProfileV1.hpp` | `7921e2642d15e8fcd44d878c1e3b85c4af2b62ee08763a82794b096ea5407b47` |
| Native `main.cpp` | `583c391b82ca423fe7241a86be23fb4435eb789e7ae33a7eb13d8c2cced10bc7` |
| Raw `main.js` | `65b41925747402eaceccc168e1245ffb2e316be98104e6f626a8d9dd080e0ff8` |
| Worker-adapted `occ-portable.js` | `717767d46f3f260b1458d702e1e61d2a1a90f6e3c48400ac5943a11db577c484` |
| `main.wasm` | `47c9d4c96b61ba1a2792c72ccf1b7f2e22d5faa5b50948db144032436edeba25` |
| Build log | `a1cb904c35554c5163f2304395c1e7694c62a539133299d5ab63d4a857548e07` |

The worker glue adaptation replaced exactly one legacy `window` exchange
callback with the existing `globalThis` callback form after verifying the raw
JS hash; the WASM was unchanged. The Core pin leaf records the actual adapted
pair and source/header identities. Staging remains optional and requires this
exact pair; pinning does not deploy it or establish feature availability in an
assembled application. The 100 pm OCCT edge/vertex builder boundary and all
previously stated analytic-profile limitations remain open.
