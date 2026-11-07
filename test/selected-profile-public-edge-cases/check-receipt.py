"""Independent analytic/native/preservation checks over actual browser evidence."""
import json,sys
from math import pi,isclose
from pathlib import Path
r=json.loads(Path(sys.argv[1]).read_text())
assert r['source']=='a0b363bce15e8533be17c9332b46a7e51ddeea5d'
assert r['result']=='PASS scoped corpus' and len(r['cases'])==12
assert len({c['name'] for c in r['cases']})==12
assert r['assets'][0]['sha256']=='8ae3ddc83e706829761c66ddc573fae42f9d746171ee09c1ee3b0f0744d98965'
near=lambda a,b:isclose(a,b,rel_tol=1e-12,abs_tol=1e-6)
for c in r['cases']:
 assert not c['issues'] and c['result']=='PASS scoped behavior',c['name']
 assert c['final']['failure'] is None,c['name']
 if c['classification']!='supported':
  assert not c['final']['bodies'],c['name']
  assert not any('selected-profile-extrude' in t['tasks'] for t in c['trace']),c['name']
 for a in c['authoring']:
  if 'error' in a:assert a['preserved'] is True,c['name']
 for a in c['creation']:
  if 'error' in a:assert a['preserved'] is True,c['name']
control=next(c for c in r['cases'] if c['name']=='nested-rings-control')
assert control['final']['source']==control['acceptedSource']
assert len(control['discovery']['value']['regions'])==3
bodies=sorted(control['acceptedBodies'],key=lambda b:b['metrics']['nativeVolume'],reverse=True)
assert len(bodies)==3
for b,volume,radius in zip(bodies,[2500*pi,1500*pi,500*pi],[30,20,10]):
 m=b['metrics'];assert b['engine']=='occ' and m['nativeValidity']['valid'] is True and m['solidCount']==1 and m['resultKind']=='single-solid'
 assert near(m['nativeVolume'],volume)
 assert all(near(a,v) for a,v in zip(m['nativeBounds']['min'],[-radius,-radius,0]))
 assert all(near(a,v) for a,v in zip(m['nativeBounds']['max'],[radius,radius,5]))
 assert m['runtime']['jsSha256']=='cbd49d63d0900f50dda7fc53518d5f06183e85b1dea720522cc2994b0876adc9'
 assert m['runtime']['wasmSha256']=='a81af0b78dd585124f3f2d05d09b4a387b276bd1f655f0234002a6ab4646a637'
assert any(p['sha256']=='0f3240cdde9b5faced831ace71ee5ffcfb6fe159dacba5b7265e5a09b0ca9853' for p in control['workerPins'])
assert all(t['terminated'] for t in control['trace'] if 'selected-profile-extrude' in t['tasks'])
history=json.loads(control['final']['history'])['history'];features=[f for f in history if f['type']=='WORKER_SELECTED_PROFILE_EXTRUDE_V2'];assert len(features)==3
for f in features:
 p=f['params'];assert sorted(p)==sorted(['version','unit','engine','engineRevision','featureId','faceId','regionId','depth','bodyPolicy'])
 assert p['faceId']==control['faceId'] and p['depth']==5 and p['bodyPolicy']=='separate'
 assert p['engineRevision']=='sha256:cbd49d63d0900f50dda7fc53518d5f06183e85b1dea720522cc2994b0876adc9:a81af0b78dd585124f3f2d05d09b4a387b276bd1f655f0234002a6ab4646a637'
 assert p['regionId'] in [x['regionId'] for x in control['discovery']['value']['regions']]
print('PASS12 scoped cases; exact refusal preservation; independent nested volumes/bounds/validity/runtime; actual native Worker pin/termination; retained source and three explicit intents')
