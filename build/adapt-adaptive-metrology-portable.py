#!/usr/bin/env python3
# Only the legacy exchange callback changes for a standalone Worker realm.
from pathlib import Path
import sys,hashlib,json
sourcePath=Path(sys.argv[1]);source=sourcePath.read_bytes()
expected='2bd938544cb4721998d897be923282996b69bb8101a30ac59ba54461dea0ce39'
expectedWasm='bc8895ceb123e33aad68c8a1cf6322b5c0ccef9bfb129207defe1b8a5a7c893a'
expectedPortable='ed06b634a3e81f9a51c89f75b3d65e03b8ace1fc483900ea2858eae8eff970a4'
if hashlib.sha256(sourcePath.with_name('main.wasm').read_bytes()).hexdigest()!=expectedWasm:raise SystemExit('Unexpected WASM hash')
if hashlib.sha256(source).hexdigest()!=expected:raise SystemExit('Unexpected original main JS hash')
before=b'window.__OCI_EXCHANGE_VAL = null;\nwindow.__OCI_EXCHANGE = function(objStr) {\n  __OCI_EXCHANGE_VAL = JSON.parse(objStr);\n  console.log("EXCHANGE VALUE:");\n  console.log(__OCI_EXCHANGE_VAL);\n};'
after=b'globalThis.__OCI_EXCHANGE_VAL = null;\nglobalThis.__OCI_EXCHANGE = function(objStr) {\n  globalThis.__OCI_EXCHANGE_VAL = JSON.parse(objStr);\n};'
if source.count(before)!=1:raise SystemExit('Expected exactly one legacy callback')
output=source.replace(before,after)
if hashlib.sha256(output).hexdigest()!=expectedPortable:raise SystemExit('Unexpected adapted JS hash')
with Path(sys.argv[2]).open('xb') as f:f.write(output)
print(json.dumps({'originalJS':expected,'portableJS':hashlib.sha256(output).hexdigest(),'replacements':1,'bytes':len(output)}))
