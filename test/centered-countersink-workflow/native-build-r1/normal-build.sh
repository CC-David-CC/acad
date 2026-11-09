#!/usr/bin/env bash
set -euo pipefail
codi_mechanical_source=/mnt/data10tb/codi-occ-mechanical-native-source-20261109-r1
codi_mechanical_sdk=/mnt/data10tb/codi-occ-four-corner-clean-20261104
codi_mechanical_output=/mnt/data10tb/codi-occ-mechanical-native-build-20261109-r1
source "$codi_mechanical_sdk/emsdk/emsdk_env.sh" >/dev/null 2>&1
{
 em++ --version
 "$codi_mechanical_sdk/emsdk/upstream/bin/clang++" --version
 "$codi_mechanical_sdk/emsdk/upstream/bin/wasm-ld" --version
} > "$codi_mechanical_output/compiler-version.txt" 2>&1
python3 "$codi_mechanical_output/capture-inputs.py" before
set +e
bash -x "$codi_mechanical_source/scripts/build-selected-profile-v2.sh" "$codi_mechanical_source" "$codi_mechanical_sdk/build/include/opencascade" "$codi_mechanical_sdk/build/lin32/clang/lib" "$codi_mechanical_output" > "$codi_mechanical_output/build.log" 2>&1
codi_mechanical_rc=$?
set -e
printf '%s\n' "$codi_mechanical_rc" > "$codi_mechanical_output/build-exit-code.txt"
python3 "$codi_mechanical_output/capture-inputs.py" after "$codi_mechanical_rc"
exit "$codi_mechanical_rc"
