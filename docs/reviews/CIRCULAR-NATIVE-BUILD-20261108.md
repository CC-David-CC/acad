# Circular arrangement Native compile checkpoint

Normal Native build only, NOT functional qualification. Root job86376 exits0;
recorded source/archive input hashes remain unchanged. Native source82028bb4b5eb25e6765fadfb958f9d2491de0844
is backed in both occt-interpreter-codi LAN repositories. Detached root source:
R730 /mnt/data10tb/codi-occ-circular-root-source-20261108-r1. Output:
/mnt/data10tb/codi-occ-circular-root-build-20261108-r1. No binary/default/runtime
promotion follows this compile. Native API behavior requires the whole corpus.

Pinned existing SDK /mnt/data10tb/codi-occ-four-corner-clean-20261104:
emsdk/emsdk_env.sh; build/include/opencascade;
build/lin32/clang/lib. Existing scripts/build-selected-profile-v2.sh performs
the normal Emscripten compile/link; no source/threshold change for this build.
Exact invocation/repro input hashes/output result are retained in
/mnt/data10tb/codi-occ-circular-root-build-20261108-r1.sh,
build-inputs-before.json, build.log and native-build-result.json.

Raw main.js SHA256:
731a4e359b3dca9a42f16eef22a6366b54b948f50178aaa7c62420fc357ae1e5
Portable Worker JS SHA256:
f262510bd8f65fc518e6e5ea146004ad357d6d35f80bf0fd5c8eec2de984c504
main.wasm SHA256 (36157054 bytes):
186b13d47f5afee372dddc4aa843275d3d3bd593a764cd85d070014fac87e382

Only loader adaptation: the unique existing window.__OCI_EXCHANGE_VAL and
window.__OCI_EXCHANGE callback becomes its globalThis equivalent; JSON.parse
remains and its two debug console logs are removed, exactly as the qualified
Shell loader adaptation. runtime-pins.json records exact before/after strings,
replacementCount1 and hashes. Original raw loader is retained. No eval/function
constructor, numerical code, exception policy or WASM bytes are rewritten.

Compilation emitted warnings (including existing legacy source warnings and
new parenthesis/signed-count warnings), no errors. That is not a functional bug
reproduction or proof of correct Native cells. Next: register an explicit new
cohort/exact-pair module/factory/closed graph, refresh reviewed common bootstrap
pins, normal complete app build, then ONE full public C02 workflow and independent
artifact oracle. Old cohorts/defaults/pairs stay separately pinned. Final runtime
asset check-in/packaging waits for functional qualification per user direction.

Portable adaptation source is now pinned in Native183ab32cd5261e9f30059cea9546dd74c71f96a9
on both LANs. Recorded inputs cover the listed source files/static archives and
CMake cache, not a full compiler/toolchain or SDK-header attestation. The exact
output pair above remains the binding; functional qualification is still pending.

## Diagnostic-stage native build R2

Normal root Native compile26577 completed0 from5a4f0a825a847667b805937f512c851dfeec4d38.
Recorded source/archive/CMake inputs unchanged across build (not a complete SDK
or toolchain attestation). This adds only per-call closed error-stage labels;
no geometry fix or functional qualification is claimed. The strict JS capture
is composed3659072, and the separate semantic seam fix764e38e is also present.

RawJS0062648f3d408ef55e07caa7e1659d63526ea355c7de3025a42d713a1f4ba1d7;
portableJS9789a61709dc680cce64dfa29030a3862ee636319594bdc839c0ed92e9d3571b;
WASMad06c43be5d895c6cb41a562b53dee3f819c8b003182c5c99b65258e0b000c0d.
Only existing exchange callback transformation window→globalThis and removal
of two debug logs is applied, exactly once. Old adapter's exact raw hash guard
correctly refused the new compiler output; Native71405a03236f5476b8df19a5c048620e577c3b16
pins this build's exact input/output, backed on both Native LANs. Compiler JS
changed53bytes in equal316025byte outputs, including generated ASM_CONSTS addresses.
No engine execution occurred during build/adaptation.

Root output /mnt/data10tb/codi-occ-circular-root-build-20261108-r2, Native source
/mnt/data10tb/codi-occ-circular-root-source-20261108-r2. Existing R1 runtime and
all unrelated kernel pairs remain unchanged. Next: full coherent app build,
fresh isolated fixture, unchanged whole Chrome workflow and artifact analysis.
