#!/bin/bash
set -euo pipefail
root=$1
cd "$root"
printf '%s  %s\n' 86ccaa4d1974b15a1ee8a26e69db20e7c04f5000ffd4924008cebcd1a82fb9e4 source.tar.gz | sha256sum -c -
mkdir source emsdk
 tar -xzf source.tar.gz -C source
curl -fsSL --retry 3 --connect-timeout 15 https://codeload.github.com/emscripten-core/emsdk/tar.gz/d7b4130688bfa348392b921ab04015aa15c4f154 -o emsdk-source.tar.gz
sha256sum source.tar.gz emsdk-source.tar.gz > source-hashes.txt
tar -xzf emsdk-source.tar.gz --strip-components=1 -C emsdk
(cd emsdk && ./emsdk install 2.0.30 > "$root/emsdk-install.log" 2>&1 && ./emsdk activate 2.0.30 >> "$root/emsdk-install.log" 2>&1)
source "$root/emsdk/emsdk_env.sh" >/dev/null 2>&1
{ printf '%s\n' 'upstream_source=5efaf53accb45bac475155fc4d5552642c19e91e' 'upstream_tree=f820351dd52207a3ad757bdeaf5510f7b4ae01fc' 'emsdk_source=d7b4130688bfa348392b921ab04015aa15c4f154'; emcc --version | head -1; node --version; cmake --version | head -1; python3 --version; uname -a; } > build-environment.txt
mkdir -p source/build-mapped
flags="-ffile-prefix-map=$root/source/occt=/occt -ffile-prefix-map=$root/source/build-mapped=/build -ffile-prefix-map=$root/emsdk=/emsdk"
emcmake cmake -S "$root/source/occt" -B "$root/source/build-mapped" "-DCMAKE_C_FLAGS=$flags" "-DCMAKE_CXX_FLAGS=$flags" -DCMAKE_SUPPRESS_REGENERATION:BOOL=ON -DBUILD_USE_PCH:BOOLEAN=OFF -DUSE_TBB:BOOLEAN=OFF -DUSE_TCL:BOOLEAN=OFF -DUSE_FREETYPE:BOOLEAN=OFF -DBUILD_LIBRARY_TYPE=Static -DBUILD_SHARED_LIBS:BOOL=OFF -DBUILD_MODULE_ApplicationFramework:BOOLEAN=OFF -DBUILD_MODULE_DataExchange:BOOLEAN=ON -DBUILD_MODULE_Draw:BOOLEAN=OFF -DBUILD_MODULE_FoundationClasses:BOOLEAN=ON -DBUILD_MODULE_ModelingAlgorithms:BOOLEAN=ON -DBUILD_MODULE_ModelingData:BOOLEAN=ON -DBUILD_MODULE_Visualization:BOOLEAN=OFF -DBUILD_MODULE_CommandInterface:BOOLEAN=ON > "$root/configure.log" 2>&1
emmake make -C "$root/source/build-mapped" -j4 > "$root/compile.log" 2>&1
sed -e "s@/build/include/opencascade@$root/source/build-mapped/include/opencascade@g" -e "s@/build/lin32/clang/lib/@$root/source/build-mapped/lin32/clang/lib/@g" -e "s@/shape-io/@$root/source/shape-io/@g" -e "s@/scripts/@$root/source/scripts/@g" -e "s@  -O2 @  -ffile-prefix-map=$root/source/shape-io=/shape-io -ffile-prefix-map=$root/source/occt=/occt -ffile-prefix-map=$root/source/build-mapped=/build -ffile-prefix-map=$root/emsdk=/emsdk -O2 @" "$root/source/scripts/wasm-link.sh" > "$root/link-adapted.sh"
(cd "$root/source/build-mapped" && bash "$root/link-adapted.sh" > "$root/link.log" 2>&1)
sha256sum "$root/source/build-mapped/main.wasm" "$root/source/build-mapped/main.js" > "$root/outputs.sha256"
printf '%s\n' 'SOURCE_BUILD_COMPLETE' > "$root/result.txt"
