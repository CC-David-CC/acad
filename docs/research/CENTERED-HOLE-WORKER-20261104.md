# Centered through-hole worker research

This research-only path drills the captured authored rectangle prism in its owning OCC worker. It is not registered as a history operation, published model, or released runtime. The legacy qualified runtime lacks `PerformDrilledCutV1` and is refused; no engine fallback is used. Planner source derives from root checkpoint `33e68e26`, with an additional minimum-radius refusal.

`mount.centeredThroughHole({op:'solid.profile.centered-through-hole',version:1,parent,request:{version:1,unit:'millimeter',revision,sketchDigest,faceId,regionId,diameter}},{signal})` requires a live parent made by the same mount's research-topology extrusion. The request and parent are captured before dispatch. The mount rechecks parent ownership after the worker returns and closes on an invalid post-dispatch association. The result contains a mount-owned transient handle, copied binding, bounded portable topology, and evidence. `assertCenteredHoleBinding` rechecks the live parent/result and exact retained binding and topology; callers must separately validate document lifetime and authored feature identity. Handles and topology indices are not persistent identities.

The native operation builds its own non-destructive cut, checks completion, errors and BRepCheck, and returns operation-local parent and cutter Boolean history. The worker verifies seven faces, two rims, cylinder wall, parent descendants and cutter/support-face rim agreement, analytic volume, bounds, loop incidence and a bounded oriented mesh before issuing a result handle. A post-native rejection terminates the candidate worker. Analytic volume and approximate mesh volume are distinct. This does not establish durable semantic names or an editable projected model.

Native source is `c4dce453` on `research/occ-centered-hole-analytic-20261104` in the LAN OCCT interpreter repository. The tested incremental R730 build uses Emscripten 2.0.30 and retained static libraries from source `5c353d62fac9dd7836105b26cf4cb612ebe81ca5` (upstream tree `f820351dd52207a3ad757bdeaf5510f7b4ae01fc`); build directory `/mnt/data10tb/codi-occ-centered-hole-build-20261104`. `main.js` SHA256 `89b3b85fb8afcfbdf343ec3f7f2ecf222067012d994cf9af6eb649ef30d9257b`, `main.wasm` SHA256 `6079a9e576221a625099abd8044e566b952c80caba47408e6c0c447d8ff3732b`. The earlier R730 build's `environment.txt` and `link-adapted.sh` (SHA256 `0907faecb9ef27e216d95d77df1d03afb925dcf443037e770a660d6d1049452c`) are retained at `/mnt/data10tb/codi-occ-safe-build-20261104`. This is an incremental build receipt, not proof of a clean reproducible runtime build or a replacement for the existing qualified runtime; a clean source/toolchain closure and distribution notices remain release work.

Pure controls: `node --test test/engine-hole/{plan,topology}.test.mjs`. For real Chromium, prepare a disposable fixture with `test/engine-hole/prepare-worker-fixture.py --js <pinned-main.js> --wasm <pinned-main.wasm> --dist <matching-app-dist> --node <node> --out <empty-dir>`, serve it with `serve-worker-fixture.py`, and run the `authored-worker`, `mount-worker`, and `noop-worker` tests with `CODI_TEST_URL`, `CODI_TEST_CDP`, and `PUPPETEER_CORE_PATH` set to isolated local services. The preparation script verifies JS/WASM and worker bootstrap pins and embeds the runtime without dynamic JavaScript execution under self plus wasm-unsafe-eval CSP.

Real worker cases used authored 100×50×20 and 150×30×35 mm prisms translated to (10000,20000,7), diameter 10 mm. The first measured analytic volume 98429.20367320513 mm³ and mesh approximation 98444.4481821307 mm³. Tests also exercise source mismatch, descriptor mutation, cross-mount binding, parent disposal, caller handle mutation during dispatch, cancellation, and a deliberately disjoint native cut rejected without a result handle. Actual feature replay, retained accepted history after a failed edit, semantic projection, signed-host use, a clean build and full CAD qualification remain untested here.

## Integration packaging checkpoint

The integration branch now emits `centeredHolePlan.mjs` and
`centeredHoleTopology.mjs` beside the OCI worker and includes their paths in the
same-origin/colocation check. The raw worker bootstrap pin is
`b61467c1c33eb1803435a7e9880fb8de9cda987aeeda093707196f24d39dc833`.
With the existing qualified legacy glue/WASM, the embedded worker is
`05df3683a879d4283a6b36f05c16a86d5c3e07e542128c913868d8265fe091ca`.
This updates packaging, not the native capability: that older runtime still
refuses the hole command. Research test fixtures explicitly select the newer
pinned runtime; promotion to the default requires the clean native build and
integration qualification, not silently changing an asset hash.

Four embedded-build tests pass (determinism, modified input rejection, tampered
WASM refusal, exact helper source bytes). A full webpack application build with
`CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1` succeeds and emits both helper modules;
it retains the pre-existing react-icons conflicting-export warning. No site was
deployed. Runtime owner/geometry suites also pass 21 focused checks after merge.

## Boundary helper packaging qualification

The centered topology module imports `boundedPrismBoundary.mjs`. Prism asset preparation, webpack resource alias/import and same-origin colocation check, and both disposable fixture builders include that exact helper. The legacy centered native envelope still lacks line origin/direction, so the helper checks ordered paired ranges and lengths but cannot prove absolute parameter origins.

A disposable real Chromium strict-CSP fixture built from the pinned clean OCI runtime passed authored 100×50 and 150×30 cuts, mount ownership/cross-mount/tamper/disposal controls, and the disjoint-cut refusal. Its first mount attempt exposed an outdated test-only `occ-brep` representation; updating that test to the current `occ-brep-worker-owned` contract produced the passing run. Eight pure build/topology controls passed. A full webpack build emitted the exact prepared helper (SHA-256 `c7ca8a53962d587cde7bd162a08ad00b6ae523a432216e19202943726731ad51`) with the known react-icons warning. Shared node_modules and worker inputs were linked from the existing local integration checkout; this fixture build used `resolve.symlinks=false` to keep webpack CSS include paths within the worktree. The first attempt with default symlink resolution failed on that CSS include mismatch. No native runtime pins or public deployments changed.

## Side discovery stays off the UI thread

The four-corner follow-up briefly reparsed and hashed the source sketch in
`centeredHoleAdapter`. It now sends a `side-ids` job to the existing semantic
worker, retaining Web Lock admission, bounded outstanding jobs, timeout,
termination, cancellation and post-await document checks. Unsupported rotated
rectangles still omit corner capability; other validation failures reject.
TypeScript and the semantic-worker webpack build pass. Full-app browser
qualification of this change is pending; the earlier history receipt predates it.
