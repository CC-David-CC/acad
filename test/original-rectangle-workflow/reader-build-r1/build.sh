#!/usr/bin/env bash
set -euo pipefail
root=/mnt/data10tb/codi-original-rectangle-step-reader-20261107-r1
core=/mnt/data10tb/codi-acad-original-rectangle-20261107-r1
native=/mnt/data10tb/codi-occ-owned-step-adaptive-20261107
cohort=/mnt/data10tb/codi-occ-four-corner-clean-20261104
set +u
source "$cohort/emsdk/emsdk_env.sh" > "$root/emsdk.log" 2>&1
set -u
export EMCC_CFLAGS="-MD -MF $root/dependencies.d"
{ emcc --version; command -v em++; command -v node; node --version; git -C "$native" rev-parse HEAD; git -C /mnt/data10tb/codi-occ-four-corner-source-20261104 rev-parse HEAD; } > "$root/toolchain.txt"
python3 "$root/pin.py" before
set +e
bash "$core/test/owned-step-worker/build-reader.sh" "$native" "$cohort/build/include/opencascade" "$cohort/build/lin32/clang/lib" "$root/runtime" "$core/test/original-rectangle-workflow/step-reader.cpp" > "$root/compile.log" 2>&1
result=$?
set -e
printf '%s\n' "$result" > "$root/exit-code.txt"
python3 "$root/pin.py" after
exit "$result"
