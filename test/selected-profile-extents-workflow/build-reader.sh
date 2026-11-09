#!/usr/bin/env bash
# Root builds this ONCE for the after-whole public STEP artifact readback.
set -euo pipefail
source_root=$(realpath "$1")
include_root=$(realpath "$2")
library_root=$(realpath "$3")
output_root=$4
reader_source=$(realpath "$(dirname "$0")/read-step.cpp")
test ! -e "$output_root"
mkdir -p "$output_root"
reader_sha=$(sha256sum "$reader_source" | cut -d' ' -f1)
em++ -std=c++0x -O2 -I"$source_root/shape-io" -I"$source_root/occt/src/CommandInterpreter" -I"$include_root" \
 "-DCODI_READER_SOURCE_SHA=\"$reader_sha\"" "$reader_source" -L"$library_root" \
 -lTKTopTest -lTKBool -lTKBO -lTKBRep -lTKernel -lTKFeat -lTKFillet -lTKG2d -lTKG3d -lTKGeomAlgo -lTKGeomBase -lTKHLR -lTKMath -lTKMesh -lTKOffset -lTKPrim -lTKShHealing -lTKTopAlgo -lTKXSBase -lTKSTEPBase -lTKSTEPAttr -lTKSTEP209 -lTKSTEP \
 -s NODERAWFS=1 -s ALLOW_MEMORY_GROWTH=1 -s NO_DISABLE_EXCEPTION_CATCHING -o "$output_root/reader.js"
python3 - "$reader_source" "$source_root" "$include_root" "$library_root" "$output_root/reader-source.json" <<'PY'
import hashlib,json,sys
from pathlib import Path
reader,source,include,library,out=map(Path,sys.argv[1:])
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
names='TKTopTest TKBool TKBO TKBRep TKernel TKFeat TKFillet TKG2d TKG3d TKGeomAlgo TKGeomBase TKHLR TKMath TKMesh TKOffset TKPrim TKShHealing TKTopAlgo TKXSBase TKSTEPBase TKSTEPAttr TKSTEP209 TKSTEP'.split()
out.write_text(json.dumps({'readerSourceSha256':sha(reader),'massHeaderSha256':sha(source/'shape-io/ownedMassPropertiesV1.hpp'),'occtVersionHeaderSha256':sha(include/'Standard_Version.hxx'),'libraries':{name:sha(library/('lib'+name+'.a')) for name in names},'identity':'same-OCCT-separate-build-not-external-kernel'},indent=2)+'\n')
PY
