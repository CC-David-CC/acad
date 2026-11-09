#!/usr/bin/env bash
set -euo pipefail
codi_finite_source=/mnt/data10tb/codi-occ-finite-curve-export-source-20261109
codi_finite_sdk=/mnt/data10tb/codi-occ-four-corner-clean-20261104
codi_finite_output=/mnt/data10tb/codi-occ-finite-curve-native-build-20261109-r1
codi_finite_evidence=/mnt/data10tb/codi-occ-finite-curve-native-evidence-20261109-r1
codi_finite_phase=initialization
codi_finite_child=none
printf '%s\n' "$$" > "$codi_finite_evidence/wrapper.pid"
codi_finite_status() {
 printf 'phase=%s\nwrapper_pid=%s\ncompiler_shell_pid=%s\nexit_code=%s\nutc=%s\n' "$codi_finite_phase" "$$" "$codi_finite_child" "$1" "$(date -u +%FT%TZ)" > "$codi_finite_evidence/status.txt"
}
trap 'codi_finite_rc=$?; codi_finite_status "$codi_finite_rc"' EXIT
codi_finite_status running
source "$codi_finite_sdk/emsdk/emsdk_env.sh" >/dev/null 2>&1
{
 em++ --version
 "$codi_finite_sdk/emsdk/upstream/bin/clang++" --version
 "$codi_finite_sdk/emsdk/upstream/bin/wasm-ld" --version
} > "$codi_finite_evidence/compiler-version.txt" 2>&1
codi_finite_phase=input-capture-before
codi_finite_status running
python3 "$codi_finite_evidence/capture-inputs.py" before
codi_finite_phase=compilation
bash -x "$codi_finite_source/scripts/build-selected-profile-v2.sh" "$codi_finite_source" "$codi_finite_sdk/build/include/opencascade" "$codi_finite_sdk/build/lin32/clang/lib" "$codi_finite_output" > "$codi_finite_evidence/build.log" 2>&1 &
codi_finite_child=$!
printf '%s\n' "$codi_finite_child" > "$codi_finite_evidence/compiler-shell.pid"
codi_finite_status running
set +e
wait "$codi_finite_child"
codi_finite_rc=$?
set -e
printf '%s\n' "$codi_finite_rc" > "$codi_finite_evidence/build-exit-code.txt"
codi_finite_phase=input-capture-after
codi_finite_status "$codi_finite_rc"
python3 "$codi_finite_evidence/capture-inputs.py" after "$codi_finite_rc"
codi_finite_phase=complete
exit "$codi_finite_rc"
