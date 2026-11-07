#!/usr/bin/env python3
# Only the legacy exchange callback changes for a standalone Worker realm.
from pathlib import Path
import sys,hashlib,json
sourcePath=Path(sys.argv[1]);source=sourcePath.read_bytes()
expected='f8b5476a999a9a65ca31440b40e54d47c6e3bc29ff3d7b91e721b143a6535eb3'
expectedWasm='c154a4e04961a9a50108fadcf72eca54169ba4db2e9564d24519f197e0568c2f'
expectedPortable='ca349411fc9e27677bf27072497abb22077d80c28e27ef073266966d16b07733'
if hashlib.sha256(sourcePath.with_name('main.wasm').read_bytes()).hexdigest()!=expectedWasm:raise SystemExit('Unexpected WASM hash')
if hashlib.sha256(source).hexdigest()!=expected:raise SystemExit('Unexpected original main JS hash')
before=b'window.__OCI_EXCHANGE_VAL = null;\nwindow.__OCI_EXCHANGE = function(objStr) {\n  __OCI_EXCHANGE_VAL = JSON.parse(objStr);\n  console.log("EXCHANGE VALUE:");\n  console.log(__OCI_EXCHANGE_VAL);\n};'
after=b'globalThis.__OCI_EXCHANGE_VAL = null;\nglobalThis.__OCI_EXCHANGE = function(objStr) {\n  globalThis.__OCI_EXCHANGE_VAL = JSON.parse(objStr);\n};'
if source.count(before)!=1:raise SystemExit('Expected exactly one legacy callback')
output=source.replace(before,after)
if hashlib.sha256(output).hexdigest()!=expectedPortable:raise SystemExit('Unexpected adapted JS hash')
with Path(sys.argv[2]).open('xb') as f:f.write(output)
print(json.dumps({'originalJS':expected,'portableJS':hashlib.sha256(output).hexdigest(),'replacements':1,'bytes':len(output)}))
