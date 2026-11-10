#!/usr/bin/env bash
# Separate complete normal product build with only Boolean-history unconfigured.
# Source recipe only; Root executes after coherent source/acceptance freeze.
set -euo pipefail
acad_commit=${1:?full Core commit required}
acad_root=${2:?new absolute R730 output worktree required}
[[ "$acad_commit" =~ ^[0-9a-f]{40}$ ]]
[[ "$acad_root" == /mnt/data10tb/* && ! -e "$acad_root" ]]
acad_dependencies=/mnt/data10tb/codi-acad-build-20261107-r2
[[ -d "$acad_dependencies/node_modules" ]]
git --git-dir=/mnt/data10tb/git/ACAD.git worktree add --detach "$acad_root" "$acad_commit"
# Keep generated node_modules/.cache files in this build, not in the old
# dependency checkout. Top-level dependency packages remain shared inputs;
# this does not itself prevent writes into those package directories.
mkdir "$acad_root/node_modules"
shopt -s dotglob nullglob
for dependency in "$acad_dependencies"/node_modules/*; do
  [[ "${dependency##*/}" == .cache ]] && continue
  ln -s "$dependency" "$acad_root/node_modules/${dependency##*/}"
done
shopt -u dotglob nullglob
mkdir "$acad_root/node_modules/.cache"
for cohort in codi-oci-census codi-manifold codi-raw-smlib; do
  mkdir "$acad_root/node_modules/.cache/$cohort"
done
cp --reflink=auto "$acad_dependencies/node_modules/.cache/codi-oci-census/main.js" "$acad_dependencies/node_modules/.cache/codi-oci-census/main.wasm" "$acad_root/node_modules/.cache/codi-oci-census/"
cp --reflink=auto "$acad_dependencies/node_modules/.cache/codi-manifold/manifold.js" "$acad_dependencies/node_modules/.cache/codi-manifold/manifold.wasm" "$acad_root/node_modules/.cache/codi-manifold/"
cp --reflink=auto "$acad_dependencies/node_modules/.cache/codi-raw-smlib/raw-provider.mjs" "$acad_dependencies/node_modules/.cache/codi-raw-smlib/raw-provider.wasm" "$acad_root/node_modules/.cache/codi-raw-smlib/"
(
  cd "$acad_root/node_modules/.cache"
  sha256sum --check <<'PINS'
7dfb70d551333756d9936f7a7882d9f8f5482b921c7bee398e95ad03ef979641  codi-oci-census/main.js
07d763a05f35cd257501d339d9087df63c65bcaeb51a4f4f80832e333892e12e  codi-oci-census/main.wasm
cd2031fd75cbbc812b550dd228f95b9fd666ae4da6557f840e3d3ed4cbed268b  codi-manifold/manifold.js
7bb5f8ee10fcafdab78799b1e5dd2cdc7c282ea0bf8e7939c43f3ad34b823e3d  codi-manifold/manifold.wasm
8e49622c97d839cf94d6c4d5e2de6cbd96d1166075741e08dcbda3b1a223d8fa  codi-raw-smlib/raw-provider.mjs
f33f19cd0098b610756db70ae0d25ac1dcba315e9af9eb90e387d0668be90daa  codi-raw-smlib/raw-provider.wasm
PINS
)
cd "$acad_root"
[[ "$(git rev-parse HEAD)" == "$acad_commit" ]]
[[ -z "$(git status --porcelain --untracked-files=no)" ]]
export PATH=/mnt/data10tb/codi-3mf-qualification-SrUmue/node/bin:$PATH
export CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1
export CODI_FINITE_CURVE_SUPPORT_NATIVE_DIR=/mnt/data10tb/codi-occ-finite-curve-native-portable-20261109-r1
export CODI_CIRCULAR_NATIVE_DIR=/mnt/data10tb/codi-occ-circular-root-build-20261108-r3
export CODI_SELECTED_NATIVE_DIR="$acad_dependencies/.build/arrangement-native-inputs/selected-profile"
export CODI_POLYGON_NATIVE_DIR="$acad_dependencies/.build/arrangement-native-inputs/polygon-profile"
export CODI_MECHANICAL_NATIVE_DIR="$acad_dependencies/.build/arrangement-native-inputs/mechanical-profile"
unset CODI_BOOLEAN_HISTORY_NATIVE_DIR
export CODI_REVOLVE_NATIVE_DIR="$acad_dependencies/.build/arrangement-native-inputs/revolve-profile"
export CODI_SWEEP_NATIVE_DIR="$acad_dependencies/.build/arrangement-native-inputs/sweep-profile"
export CODI_LOFT_NATIVE_DIR="$acad_dependencies/.build/arrangement-native-inputs/loft-profile"
export CODI_ADAPTIVE_METROLOGY_NATIVE_DIR="$acad_dependencies/.build/arrangement-native-inputs/adaptive-metrology"
export CODI_STEP_NATIVE_DIR="$acad_dependencies/.build/arrangement-native-inputs/step-export"
export CODI_MANUFACTURING_MESH_NATIVE_DIR="$acad_dependencies/.build/arrangement-native-inputs/manufacturing-mesh"
export CODI_SHELL_NATIVE_DIR="$acad_dependencies/.build/arrangement-native-inputs/shell"
export CODI_MECHANICAL_COHORT_NATIVE_DIR=/mnt/data10tb/codi-occ-mechanical-native-portable-20261109-r1
export CODI_ANALYTIC_PROFILE_NATIVE_DIR=/mnt/data10tb/codi-occ-analytic-arc-build-20261110-r2
[[ ! -e "$acad_root/.build/manufacturing-mesh-assets" ]]
npm run build:physical-parameters-worker
npm run build:sketch-worker
npm run build:project-worker
npm run build:native-archive-worker
npm run build:manufacturing-hash-worker
npm run build:controlled-3mf-worker
npm run build:prism-workers
node node_modules/webpack/bin/webpack.js --config test/polygon-profile-app-history/webpack.app.cjs
node node_modules/grunt-cli/bin/grunt copy:resources copy:lib_assets mark-revision
[[ "$(git rev-parse HEAD)" == "$acad_commit" ]]
[[ -z "$(git status --porcelain --untracked-files=no)" ]]

python3 "$acad_root/test/box-build-admission/fixture_custody.py" build "$acad_root" "$acad_commit" "$acad_root/box-omission-build-custody.json"
