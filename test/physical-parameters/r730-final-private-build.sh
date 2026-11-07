#!/usr/bin/env bash
set -euo pipefail
commit=${1:?exact commit required}
out=${2:?new private directory required}
[[ "$commit" =~ ^[0-9a-f]{40}$ ]] || { echo 'Need exact 40-character source commit' >&2; exit 2; }
[[ "$out" == /mnt/data10tb/codi-diag-final-* && ! -e "$out" ]] || { echo 'Need a new private codi-diag-final-* directory' >&2; exit 2; }
repo=/mnt/data10tb/git/JSKetcher.git
deps=/mnt/data10tb/codi-typed-common-transaction-20261105/node_modules
baseline=/mnt/data10tb/codi-diag-combined-0b9-20261105/node_modules
nodebin=/mnt/data10tb/codi-3mf-qualification-SrUmue/node/bin
"$nodebin/node" --version
git --git-dir="$repo" cat-file -e "$commit^{commit}"
git clone -q --shared "$repo" "$out"
git -C "$out" checkout -q --detach "$commit"
[[ "$(git -C "$out" rev-parse HEAD)" == "$commit" ]]
cd "$out"
mkdir -p node_modules/.cache
for p in "$deps"/* "$deps"/.bin; do
  [[ "$(basename "$p")" == react-toastify ]] || ln -s "$p" "node_modules/$(basename "$p")"
done
cp -a "$baseline/react-toastify" node_modules/
mkdir -p node_modules/.cache/codi-oci-census
cp /mnt/data10tb/codi-occ-topology-census-build-20261105/main.js /mnt/data10tb/codi-occ-topology-census-build-20261105/main.wasm node_modules/.cache/codi-oci-census/
cp -a "$baseline/.cache/codi-manifold" node_modules/.cache/
mkdir -p node_modules/.cache/codi-raw-smlib
cp /mnt/data10tb/codi-smlib-6c-provider-20261105/raw-provider.mjs /mnt/data10tb/codi-smlib-6c-provider-20261105/raw-provider.wasm node_modules/.cache/codi-raw-smlib/
export PATH="$nodebin:$PATH" CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1
npm run build > "$out-build.log" 2>&1
node node_modules/webpack/bin/webpack.js --config test/webos/webpack.config.cjs > "$out-helper.log" 2>&1
sha256sum dist/static/index.bundle.js dist/static/webosTest.bundle.js .build/headless-sketch-worker/worker.js node_modules/.cache/codi-project-worker/worker.js .build/physical-parameters-worker/worker.js .build/prism-semantic-worker/worker.js .build/manufacturing-hash-worker/worker.js .build/prism-assets/oci-verified-worker.js .build/prism-assets/manifold-verified-worker.js .build/prism-assets/occ.wasm .build/prism-assets/manifold-worker.wasm | tee "$out-sha256.txt"
printf 'source %s\n' "$commit"
