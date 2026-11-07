#!/usr/bin/env python3
from pathlib import Path
import json,hashlib,subprocess,sys
root=Path(__file__).parent;repo=root.parent.parent;r=json.loads((root/'evidence-matrix-r3/receipt.json').read_text());assert r['status']=='PASS' and r['sourcePinsBefore']==r['sourcePinsAfter']
for name,pin in r['sourcePinsBefore'].items():assert hashlib.sha256((repo/name).read_bytes()).hexdigest()==pin,name
v=json.loads(subprocess.check_output([sys.executable,str(root/'check-zip.py'),str(root/'evidence-matrix-r3')]));assert v['status']=='PASS' and v['exports']==16 and any(x['file']=='shared-main.3mf'for x in v['rows'])
for name,pin in json.loads((root/'proof-pins.json').read_text())['files'].items():assert hashlib.sha256((root/name).read_bytes()).hexdigest()==pin,name
assert json.loads((root/'evidence-first-zip-check/result.json').read_text())['status']=='FAIL'
assert 'pass 1'in(root/'evidence-before-region-scope/tests.log').read_text()and'fail 1'in(root/'evidence-before-region-scope/tests.log').read_text()
print(json.dumps({'status':'PASS','encoderWorkerExports':16,'sourceControls':19,'retainedCoreControls':10,'multiRegionAndGeneralCurvedNesting':'OPEN','scope':'Experimental component only; no fresh Native/browser/public3MF/SaveOpen claim'},indent=2))
