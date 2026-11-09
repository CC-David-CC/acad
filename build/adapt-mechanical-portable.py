#!/usr/bin/env python3
# Same reviewed one-occurrence OCI wrapper adaptation; no JS/WASM evaluation.
from pathlib import Path
import sys,hashlib,json
source_path=Path(sys.argv[1]);output_path=Path(sys.argv[2])
raw=source_path.read_bytes();wasm=source_path.with_name('main.wasm').read_bytes()
expected_js='5783cd8900f94e4661bec7f7b65a1e24dfa48ffa3cce695c9314994c7a6eba09'
expected_wasm='688c9d11ececf67d5187445491b4269647d810528e37161bcd7e676bc8d9125c'
sha=lambda b:hashlib.sha256(b).hexdigest()
if sha(raw)!=expected_js or sha(wasm)!=expected_wasm:raise SystemExit('Unexpected frozen mechanical Native raw inputs')
before=b'window.__OCI_EXCHANGE_VAL = null;\nwindow.__OCI_EXCHANGE = function(objStr) {\n  __OCI_EXCHANGE_VAL = JSON.parse(objStr);\n  console.log("EXCHANGE VALUE:");\n  console.log(__OCI_EXCHANGE_VAL);\n};'
after=b'globalThis.__OCI_EXCHANGE_VAL = null;\nglobalThis.__OCI_EXCHANGE = function(objStr) {\n  globalThis.__OCI_EXCHANGE_VAL = JSON.parse(objStr);\n};'
if raw.count(before)!=1:raise SystemExit('Expected exactly one legacy OCI receiver')
portable=raw.replace(before,after)
with output_path.open('xb') as f:f.write(portable)
print(json.dumps({'scope':'portable source transformation only; unregistered/unqualified','sourceCommit':'fc1654ee5d4471584073d4d8e3363d8c9b324566','rawJS':{'sha256':sha(raw),'bytes':len(raw)},'wasm':{'sha256':sha(wasm),'bytes':len(wasm)},'portableJS':{'sha256':sha(portable),'bytes':len(portable)},'replacementCount':1,'beforeSha256':sha(before),'afterSha256':sha(after),'adapterSha256':sha(Path(__file__).read_bytes())},indent=2))
