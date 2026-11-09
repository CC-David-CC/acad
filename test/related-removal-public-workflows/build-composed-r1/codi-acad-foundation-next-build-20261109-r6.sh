#!/usr/bin/env bash
set -euo pipefail
acad_commit=${1:?exact commit required}
[[ "$acad_commit" =~ ^[0-9a-f]{40}$ ]]
acad_root=/mnt/data10tb/codi-acad-build-20261107-r2
cd "$acad_root"
[[ -z "$(git status --porcelain --untracked-files=no)" ]]
git fetch /mnt/data10tb/git/ACAD.git "$acad_commit"
git checkout --detach "$acad_commit"
export PATH=/mnt/data10tb/codi-3mf-qualification-SrUmue/node/bin:$PATH
export CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1
export CODI_CIRCULAR_NATIVE_DIR=/mnt/data10tb/codi-occ-circular-root-build-20261108-r3
export CODI_SELECTED_NATIVE_DIR="$acad_root/.build/arrangement-native-inputs/selected-profile"
export CODI_POLYGON_NATIVE_DIR="$acad_root/.build/arrangement-native-inputs/polygon-profile"
export CODI_MECHANICAL_NATIVE_DIR="$acad_root/.build/arrangement-native-inputs/mechanical-profile"
export CODI_BOOLEAN_HISTORY_NATIVE_DIR="$acad_root/.build/arrangement-native-inputs/boolean-history"
export CODI_REVOLVE_NATIVE_DIR="$acad_root/.build/arrangement-native-inputs/revolve-profile"
export CODI_SWEEP_NATIVE_DIR="$acad_root/.build/arrangement-native-inputs/sweep-profile"
export CODI_LOFT_NATIVE_DIR="$acad_root/.build/arrangement-native-inputs/loft-profile"
export CODI_ADAPTIVE_METROLOGY_NATIVE_DIR="$acad_root/.build/arrangement-native-inputs/adaptive-metrology"
export CODI_STEP_NATIVE_DIR="$acad_root/.build/arrangement-native-inputs/step-export"
export CODI_MANUFACTURING_MESH_NATIVE_DIR="$acad_root/.build/arrangement-native-inputs/manufacturing-mesh"
export CODI_SHELL_NATIVE_DIR="$acad_root/.build/arrangement-native-inputs/shell"
graph_backup="$acad_root/.build/native-graphs-before-foundation-next-20261109-r6"
[[ ! -e "$graph_backup" ]]
mkdir "$graph_backup"
for graph_dir in polygon-profile-assets mechanical-profile-assets boolean-history-assets revolve-profile-assets sweep-profile-assets loft-profile-assets adaptive-metrology-assets step-export-assets manufacturing-mesh-assets shell-assets circular-assets; do
  if [[ -e "$acad_root/.build/$graph_dir" ]]; then mv "$acad_root/.build/$graph_dir" "$graph_backup/$graph_dir"; fi
done
npm run build:physical-parameters-worker
npm run build:sketch-worker
npm run build:project-worker
npm run build:native-archive-worker
npm run build:manufacturing-hash-worker
npm run build:controlled-3mf-worker
npm run build:prism-workers
node node_modules/webpack/bin/webpack.js --config test/polygon-profile-app-history/webpack.app.cjs
node node_modules/grunt-cli/bin/grunt copy:resources copy:lib_assets mark-revision
