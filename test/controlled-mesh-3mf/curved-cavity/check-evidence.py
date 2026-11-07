#!/usr/bin/env python3
from pathlib import Path
import json,hashlib,subprocess,sys
p=Path(__file__).parent
for name,pin in json.loads((p/'proof-pins.json').read_text())['files'].items():assert hashlib.sha256((p/name).read_bytes()).hexdigest()==pin,name
r=json.loads(subprocess.check_output([sys.executable,str(p/'check.py'),str(p/'evidence-r1')]));assert r['status']=='PASS'and r['writerGap'].startswith('CONFIRMED')
print(json.dumps({'status':'PASS','nativeValidSolidWithTwoShells':True,'actualEncoderRefusal':r['writerGap'],'nativeVolume':r['nativeVolume'],'meshApproximationResidual':r['approximationResidual'],'scope':'Actual bounded Native+encoder witness only; production repair and general nesting OPEN'},indent=2))
