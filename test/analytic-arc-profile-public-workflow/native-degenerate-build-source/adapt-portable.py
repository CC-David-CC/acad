#!/usr/bin/env python3
# Same reviewed one-occurrence OCI wrapper adaptation; no JS/WASM evaluation.
from pathlib import Path
import sys,hashlib,json,re
if len(sys.argv)!=5 or not all(re.fullmatch('[0-9a-f]{64}',v)for v in sys.argv[3:]):raise SystemExit('RAW_JS NEW_JS REVIEWED_RAW_JS_SHA REVIEWED_WASM_SHA required')
source_path=Path(sys.argv[1]);output_path=Path(sys.argv[2])
raw=source_path.read_bytes();wasm=source_path.with_name('main.wasm').read_bytes()
expected_js=sys.argv[3]
expected_wasm=sys.argv[4]
sha=lambda b:hashlib.sha256(b).hexdigest()
if sha(raw)!=expected_js or sha(wasm)!=expected_wasm:raise SystemExit('Unexpected reviewed analytic Native raw inputs')
before=b'window.__OCI_EXCHANGE_VAL = null;\nwindow.__OCI_EXCHANGE = function(objStr) {\n  __OCI_EXCHANGE_VAL = JSON.parse(objStr);\n  console.log("EXCHANGE VALUE:");\n  console.log(__OCI_EXCHANGE_VAL);\n};'
after=b'globalThis.__OCI_EXCHANGE_VAL = null;\nglobalThis.__OCI_EXCHANGE = function(objStr) {\n  globalThis.__OCI_EXCHANGE_VAL = JSON.parse(objStr);\n};'
if raw.count(before)!=1:raise SystemExit('Expected exactly one legacy OCI receiver')
portable=raw.replace(before,after)
with output_path.open('xb') as f:f.write(portable)
print(json.dumps({'scope':'portable source transformation only; unregistered/unqualified','sourceCommit':'4510c9a112ce3bda5335256d5bc58d1b339226f5','rawJS':{'sha256':sha(raw),'bytes':len(raw)},'wasm':{'sha256':sha(wasm),'bytes':len(wasm)},'portableJS':{'sha256':sha(portable),'bytes':len(portable)},'replacementCount':1,'beforeSha256':sha(before),'afterSha256':sha(after),'adapterSha256':sha(Path(__file__).read_bytes())},indent=2))
