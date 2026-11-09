#!/usr/bin/env bash
set -euo pipefail
acad_root=/mnt/data10tb/codi-acad-build-20261107-r2
cd "$acad_root"
[[ "$(git rev-parse HEAD)" == 323ee19168a6850ec368eb5ac92846976e8ad32a ]]
[[ -z "$(git status --porcelain --untracked-files=no)" ]]
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
# Restore ALL original optional-cohort aliases; prerequisites already have the
# exact unchanged product/OCI source from R8 and enlarged MFG emission from R9.
node node_modules/webpack/bin/webpack.js --config test/polygon-profile-app-history/webpack.app.cjs
node node_modules/grunt-cli/bin/grunt copy:resources copy:lib_assets mark-revision
