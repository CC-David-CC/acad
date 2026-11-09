#!/usr/bin/env python3
# Exact full-literal OCI receiver adaptation only. Never evaluates JS or WASM.
from pathlib import Path
import sys,hashlib,json

if len(sys.argv)!=3:
 raise SystemExit('RAW_MAIN_JS EXCLUSIVE_NEW_PORTABLE_JS')
source_path=Path(sys.argv[1]);output_path=Path(sys.argv[2])
wasm_path=source_path.with_name('main.wasm');adapter_path=Path(__file__)
expected_js='5f1730c347eb3edeb8b6d5e06eeeedcdf04b2348aac0c92b04001bd5edd5b7de'
expected_wasm='746da919c8457e98daa821fae98c62c0a6c9ad1acafd1c3d5412e0207d6b6325'
expected_js_bytes=316580;expected_wasm_bytes=36216184
sha=lambda data:hashlib.sha256(data).hexdigest()
def frozen_js():
 with source_path.open('rb') as stream:raw=stream.read(expected_js_bytes+1)
 if len(raw)!=expected_js_bytes or sha(raw)!=expected_js:
  raise SystemExit('Unexpected frozen finite-curve Native raw JS')
 return raw
def file_record(path,maximum):
 digest=hashlib.sha256();count=0
 with path.open('rb') as stream:
  for block in iter(lambda:stream.read(1048576),b''):
   count+=len(block)
   if count>maximum:raise SystemExit('File exceeds exact finite-curve artifact bound: '+str(path))
   digest.update(block)
 return {'sha256':digest.hexdigest(),'bytes':count}
def frozen_wasm():
 record=file_record(wasm_path,expected_wasm_bytes)
 if record!={'sha256':expected_wasm,'bytes':expected_wasm_bytes}:
  raise SystemExit('Unexpected frozen finite-curve Native WASM')
 return record

raw=frozen_js();wasm=frozen_wasm();adapter=adapter_path.read_bytes()
# EXACT same full receiver literals as the unchanged reviewed mechanical adapter.
before=b'window.__OCI_EXCHANGE_VAL = null;\nwindow.__OCI_EXCHANGE = function(objStr) {\n  __OCI_EXCHANGE_VAL = JSON.parse(objStr);\n  console.log("EXCHANGE VALUE:");\n  console.log(__OCI_EXCHANGE_VAL);\n};'
after=b'globalThis.__OCI_EXCHANGE_VAL = null;\nglobalThis.__OCI_EXCHANGE = function(objStr) {\n  globalThis.__OCI_EXCHANGE_VAL = JSON.parse(objStr);\n};'
if raw.count(before)!=1:raise SystemExit('Expected exactly one full legacy OCI receiver')
portable=raw.replace(before,after)
# Preserve the first partial/failed output if writing or later custody fails.
# Never overwrite an old file, erase an uncertain write or retry implicitly.
with output_path.open('xb') as stream:
 if stream.write(portable)!=len(portable):raise OSError('Incomplete exclusive portable JS write')
actual=file_record(output_path,len(portable))
if actual!={'sha256':sha(portable),'bytes':len(portable)}:
 raise SystemExit('Actual portable JS readback differs from literal transformation')
if frozen_js()!=raw or frozen_wasm()!=wasm or adapter_path.read_bytes()!=adapter:
 raise SystemExit('Frozen input or adapter changed during portable transformation')
print(json.dumps({
 'scope':'portable source transformation only; unmounted/unqualified',
 'sourceCommit':'d3b2afa0524807d04021eeeba3ca37298dabd160',
 'rawJS':{'sha256':sha(raw),'bytes':len(raw)},'wasm':wasm,'portableJS':actual,
 'replacementCount':1,'beforeSha256':sha(before),'afterSha256':sha(after),
 'adapterSha256':sha(adapter),'inputsUnchanged':True,'outputReadbackExact':True
},indent=2,allow_nan=False))
