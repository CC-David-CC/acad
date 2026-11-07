#!/usr/bin/env bash
# Code-only private build. Never copy dependency caches back into shared inputs.
set -euo pipefail
task_out=${1:?fresh /mnt/data10tb directory required}
task_commit=${2:?exact source commit required}
[[ "$task_out" == /mnt/data10tb/codi-polygon-combined-* && ! -e "$task_out" ]]
[[ "$task_commit" =~ ^[0-9a-f]{40}$ ]]
task_repo=/mnt/data10tb/git/JSKetcher.git
task_deps=/mnt/data10tb/codi-selected-profile-static-runtime-20261106/node_modules
task_node=/mnt/data10tb/codi-3mf-qualification-SrUmue/node/bin
git --git-dir="$task_repo" worktree add --detach "$task_out" "$task_commit"
cd "$task_out"
task_config=test/polygon-profile-app-history/webpack.app.cjs
[[ -f "$task_config" ]] # Qualification config is tracked in the selected source.
mkdir -p node_modules/.cache
for task_pkg in "$task_deps"/* "$task_deps"/.bin; do
  ln -s "$task_pkg" "node_modules/$(basename "$task_pkg")"
done
for task_cache in codi-numeric codi-oci-census codi-manifold codi-raw-smlib; do
  mkdir -p "node_modules/.cache/$task_cache"
  cp -a "$task_deps/.cache/$task_cache/." "node_modules/.cache/$task_cache/"
done
mkdir -p .build/selected-native
task_old=/mnt/data10tb/codi-selected-profile-static-runtime-20261106/.build/selected-profile-assets
cp "$task_old/selected-profile-occ-portable.js" .build/selected-native/occ-portable.js
cp "$task_old/selected-profile-occ.wasm" .build/selected-native/main.wasm
export PATH="$task_node:$PATH" CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1
export CODI_POLYGON_NATIVE_DIR=/mnt/data10tb/codi-occ-gate1-build-20261106-r2
export CODI_MECHANICAL_NATIVE_DIR=/mnt/data10tb/codi-occ-edge-treatment-main-20261106-r1
export CODI_BOOLEAN_HISTORY_NATIVE_DIR=/mnt/data10tb/codi-occ-boolean-history-main-20261106-r1
export CODI_REVOLVE_NATIVE_DIR=${CODI_REVOLVE_NATIVE_DIR:-/mnt/data10tb/codi-occ-owned-revolve-main-20261106-r2}
export CODI_SWEEP_NATIVE_DIR=${CODI_SWEEP_NATIVE_DIR:-/mnt/data10tb/codi-occ-owned-sweep-main-20261107-r1}
node --version
node build/prepare-selected-profile-assets.cjs .build/selected-native > .build/selected-native-stage.log
for task_build in build:physical-parameters-worker build:sketch-worker build:project-worker build:manufacturing-hash-worker build:prism-workers; do
  npm run "$task_build" >> .build/combined-build.log 2>&1
done
# Use the private no-map configuration with the qualified dependency symlinks.
node node_modules/webpack/bin/webpack.js --config "$task_config" >> .build/combined-build.log 2>&1
node node_modules/grunt-cli/bin/grunt copy:resources copy:lib_assets mark-revision >> .build/combined-build.log 2>&1
node node_modules/typescript/bin/tsc --noEmit > .build/typescript.log 2>&1
git diff --exit-code
sha256sum dist/static/index.bundle.js .build/*-worker/worker.js node_modules/.cache/codi-project-worker/worker.js .build/prism-assets/oci-verified-worker.js .build/selected-profile-assets/selected-profile-worker.js .build/polygon-profile-assets/modules/engine/mount/polygon-profile-worker.js .build/mechanical-profile-assets/modules/engine/mount/mechanical-profile-worker.js .build/boolean-history-assets/modules/engine/mount/boolean-history-worker.js .build/revolve-profile-assets/component.json > .build/combined-pins.txt
printf 'SOURCE %s\n' "$task_commit"
