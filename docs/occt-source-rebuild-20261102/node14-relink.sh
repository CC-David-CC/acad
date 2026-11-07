#!/bin/bash
set -euo pipefail
root=$1
source "$root/emsdk/emsdk_env.sh" >/dev/null 2>&1
export EM_NODE_JS="$root/original-image-emsdk/emsdk/node/14.15.5_64bit/bin/node"
"$EM_NODE_JS" --version > "$root/node14-link-version.txt"
mkdir -p "$root/node14-relink"
(cd "$root/node14-relink" && bash "$root/link-adapted.sh" > "$root/node14-link.log" 2>&1)
sha256sum "$root/node14-relink/main.wasm" "$root/node14-relink/main.js" > "$root/node14-outputs.sha256"
