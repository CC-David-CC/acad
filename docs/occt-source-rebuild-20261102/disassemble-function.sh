#!/bin/bash
set -euo pipefail
root=$1
wasm_dis="$root/emsdk/upstream/bin/wasm-dis"
mkdir -p "$root/disassembly"
for variant in published rebuilt; do
 if test "$variant" = published; then file=/tmp/codi-occt-repro.6ynY3Tok/occt.wasm; else file="$root/source/build-mapped/main.wasm"; fi
 # awk consumes the whole stream, retaining only the one affected function;
 # this avoids storing the >1 GiB full-module text disassemblies.
 "$wasm_dis" "$file" | awk '/^ \(func \$18834 / {keep=1} /^ \(func \$18835 / {keep=0} keep {print}' > "$root/disassembly/$variant.func18834.wat"
 test -s "$root/disassembly/$variant.func18834.wat"
done
diff -u "$root/disassembly/published.func18834.wat" "$root/disassembly/rebuilt.func18834.wat" > "$root/disassembly/diff.txt" || test "$?" -eq 1
sha256sum "$root/disassembly/"* > "$root/disassembly/SHA256SUMS"
