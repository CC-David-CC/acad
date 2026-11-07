#!/usr/bin/env python3
# Only the legacy exchange callback changes for a standalone Worker realm.
from pathlib import Path
import sys,hashlib,json
sourcePath=Path(sys.argv[1]);source=sourcePath.read_bytes()
expected='7202839b7daee058710ce3a9587e18b714aed846b1431e853274932daab1764d'
expectedWasm='26d94303a8561b0922acae5b921f486e857083d8febaa9638d1ebd0eff590018'
expectedPortable='2f2e9f92b2b57024b372143c3f2f4aa3dc4999bad7f6636c36f0b0f599f04cb7'
if hashlib.sha256(sourcePath.with_name('main.wasm').read_bytes()).hexdigest()!=expectedWasm:raise SystemExit('Unexpected WASM hash')
if hashlib.sha256(source).hexdigest()!=expected:raise SystemExit('Unexpected original main JS hash')
before=b'window.__OCI_EXCHANGE_VAL = null;\nwindow.__OCI_EXCHANGE = function(objStr) {\n  __OCI_EXCHANGE_VAL = JSON.parse(objStr);\n  console.log("EXCHANGE VALUE:");\n  console.log(__OCI_EXCHANGE_VAL);\n};'
after=b'globalThis.__OCI_EXCHANGE_VAL = null;\nglobalThis.__OCI_EXCHANGE = function(objStr) {\n  globalThis.__OCI_EXCHANGE_VAL = JSON.parse(objStr);\n};'
if source.count(before)!=1:raise SystemExit('Expected exactly one legacy callback')
output=source.replace(before,after)
if hashlib.sha256(output).hexdigest()!=expectedPortable:raise SystemExit('Unexpected adapted JS hash')
with Path(sys.argv[2]).open('xb') as f:f.write(output)
print(json.dumps({'originalJS':expected,'portableJS':hashlib.sha256(output).hexdigest(),'replacements':1,'bytes':len(output)}))
