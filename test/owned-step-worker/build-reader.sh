#!/usr/bin/env bash
set -euo pipefail
source_root=$(realpath "$1")
include_root=$(realpath "$2")
library_root=$(realpath "$3")
output_root=$4
probe_source=${5:-"$(dirname "$0")/reader.cpp"}
test ! -e "$output_root"
mkdir -p "$output_root"
em++ -std=c++0x -O2 -I"$source_root/shape-io" -I"$source_root/occt/src/CommandInterpreter" -I"$include_root" \
 "$probe_source" -L"$library_root" \
 -lTKTopTest -lTKBool -lTKBO -lTKBRep -lTKernel -lTKFeat -lTKFillet -lTKG2d -lTKG3d -lTKGeomAlgo -lTKGeomBase -lTKHLR -lTKMath -lTKMesh -lTKOffset -lTKPrim -lTKShHealing -lTKTopAlgo -lTKXSBase -lTKSTEPBase -lTKSTEPAttr -lTKSTEP209 -lTKSTEP \
 -s NODERAWFS=1 -s ALLOW_MEMORY_GROWTH=1 -s NO_DISABLE_EXCEPTION_CATCHING \
 -o "$output_root/reader.js"
