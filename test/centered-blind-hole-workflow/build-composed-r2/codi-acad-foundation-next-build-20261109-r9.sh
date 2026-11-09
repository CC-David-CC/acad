#!/usr/bin/env bash
set -euo pipefail
acad_commit=${1:?exact commit required}
[[ "$acad_commit" =~ ^[0-9a-f]{40}$ ]]
acad_root=/mnt/data10tb/codi-acad-build-20261107-r2
cd "$acad_root"
[[ "$(git rev-parse HEAD)" == 3ed8815ed0b46c136977e437220a932e2ff9bc5d ]]
[[ -z "$(git status --porcelain --untracked-files=no)" ]]
git fetch /mnt/data10tb/git/ACAD.git "$acad_commit"
[[ "$(git diff --name-only HEAD "$acad_commit")" == $'build/manufacturing-mesh-assets-entry.cjs\ndocs/reviews/C06-BLIND-RESOURCE-CLOSURE-20261109.md' ]]
git checkout --detach "$acad_commit"
export PATH=/mnt/data10tb/codi-3mf-qualification-SrUmue/node/bin:$PATH
export CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1
export CODI_MANUFACTURING_MESH_NATIVE_DIR="$acad_root/.build/arrangement-native-inputs/manufacturing-mesh"
# All other product/Worker/Native input sources are identical to completed R8.
# The normal MFG preparation revalidates its complete staged bytes, then emits
# the enlarged entry. Rebuild the normal application and resource/revision copy.
npm run build:manufacturing-mesh
node node_modules/webpack/bin/webpack.js --config test/polygon-profile-app-history/webpack.app.cjs
node node_modules/grunt-cli/bin/grunt copy:resources copy:lib_assets mark-revision
