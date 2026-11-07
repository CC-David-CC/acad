"""Independent check of retained actual8-publication-limit counterexample."""
import json
from pathlib import Path
root=Path(__file__).resolve().parent/'evidence'
r=json.loads((root/'publication-cap8-failure.json').read_text());p=json.loads((root/'publication-cap8-runtime-pins.json').read_text());a=r['actual']
assert r['source']==p['source']=='b322e02c2d9a3ea26a12ea863e6371ce15e3dba4'
assert r['result']=='FAIL' and r['app']['sha256']==p['files']['index.bundle.js']
assert len(a['created'])==8 and len(a['final']['outputs'])==8 and a['final']['failure'] is None
assert a['error']['message']=='Invalid, duplicate or excessive engine publication check.'
assert a['progress'][-1]['budget']['maxLifetimeNames']==32 and a['progress'][-1]['budget']['remainingNativeResults']==24
assert max(t['nativeResults'] for t in a['trace'])==9
assert max(t['nativeResultTriangles'] for t in a['trace'])==1584
print('CONFIRMED application publication cap8 blocks advertised public32 after genuine ninth native success; no public32 pass')
