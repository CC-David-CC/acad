#!/usr/bin/env bash
set -euo pipefail
codi_analytic_source=/mnt/data10tb/codi-occ-analytic-degenerate-edge-20261110
codi_analytic_sdk=/mnt/data10tb/codi-occ-four-corner-clean-20261104
codi_analytic_output=/mnt/data10tb/codi-occ-analytic-degenerate-native-build-20261110-r4
# The two copied helpers are inputs. Claim this output exactly once before
# creating/truncating any build artifact; failed attempts keep the claim.
mkdir -- "$codi_analytic_output/.build-once"
for codi_analytic_artifact in build-pid.txt compiler-version.txt build-inputs-before.json build.log build-exit-code.txt native-build-result.json main.html main.js main.wasm; do
 if [[ -e "$codi_analytic_output/$codi_analytic_artifact" || -L "$codi_analytic_output/$codi_analytic_artifact" ]]; then
  printf '%s\n' "Refuse existing Native build artifact: $codi_analytic_artifact" >&2
  exit 1
 fi
done
printf '%s\n' "$$" > "$codi_analytic_output/build-pid.txt"
source "$codi_analytic_sdk/emsdk/emsdk_env.sh" >/dev/null 2>&1
{
 em++ --version
 "$codi_analytic_sdk/emsdk/upstream/bin/clang++" --version
 "$codi_analytic_sdk/emsdk/upstream/bin/wasm-ld" --version
} > "$codi_analytic_output/compiler-version.txt" 2>&1
python3 "$codi_analytic_output/capture-inputs.py" before
set +e
bash -x "$codi_analytic_source/scripts/build-selected-profile-v2.sh" "$codi_analytic_source" "$codi_analytic_sdk/build/include/opencascade" "$codi_analytic_sdk/build/lin32/clang/lib" "$codi_analytic_output" > "$codi_analytic_output/build.log" 2>&1
codi_analytic_rc=$?
set -e
printf '%s\n' "$codi_analytic_rc" > "$codi_analytic_output/build-exit-code.txt"
python3 "$codi_analytic_output/capture-inputs.py" after "$codi_analytic_rc"
exit "$codi_analytic_rc"
