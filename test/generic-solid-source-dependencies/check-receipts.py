"""Independent arithmetic, source intent and actual Worker/build evidence."""
from pathlib import Path
from urllib.parse import urlparse
from math import pi,acos,sqrt,isclose
import json
root=Path(__file__).resolve().parent
p=json.loads((root/'runtime-pins.json').read_text());r=json.loads((root/'public-receipt.json').read_text());j=json.loads((root/'journal-receipt.json').read_text())
assert r['source']==j['source']==p['source']=='20ada87473b452ad3302e4c2bc286462bb1be3d1'
assert r['app']['sha256']==j['app']['sha256']==p['files']['index.bundle.js']
assert r['result']==j['result']=='PASS scoped public regeneration/native persistence'
assert {c['mode'] for c in r['cases']}=={'circle-union','empty-to-solid','default-box'}
near=lambda a,b:isclose(a,b,rel_tol=1e-9,abs_tol=1e-6)
for c in r['cases']+j['cases']:
 assert 'error' not in c and c['final']['failure'] is None
 assert c['restored']['history']==c['final']['history']
 assert c['restored']['sources']==[{k:s[k] for k in ['id','data']} for s in c['final']['sources']]
 for w in c['workerPins']+c['reopenWorkerPins']:
  name=Path(urlparse(w['url']).path).name
  if name in p['files']:assert w['sha256']==p['files'][name],name
 assert any(Path(urlparse(w['url']).path).name==p['workers']['project-validator'][0] for w in c['reopenWorkerPins'])
 assert c['before']['outputs'][0]['id']==c['final']['outputs'][0]['id']==c['restored']['outputs'][0]['id']
circle=next(c for c in r['cases'] if c['mode']=='circle-union');m=circle['final']['outputs'][0]['metrics']
assert m['nativeValidity']['valid'] and m['solidCount']==2 and near(m['nativeVolume'],1220*pi)
assert m['nativeBounds']=={'min':[-12,-12,0],'max':[40,12,5]}
assert circle['refusal']['error']['code']=='STALE_REGION' and circle['refusal']['stateExact']
source=json.loads(next(s['data'] for s in circle['final']['sources'] if s['id']==circle['faceIds'][0]));assert sorted(o['data']['r'] for o in source['objects'] if o['type']=='Circle')==[10,12]
empty=next(c for c in r['cases'] if c['mode']=='empty-to-solid');assert empty['before']['outputs'][0]['resultKind']=='empty';m=empty['final']['outputs'][0]['metrics']
R,radius,d=25,10,30
area=R*R*acos((d*d+R*R-radius*radius)/(2*d*R))+radius*radius*acos((d*d+radius*radius-R*R)/(2*d*radius))-.5*sqrt((-d+R+radius)*(d+R-radius)*(d-R+radius)*(d+R+radius))
assert m['nativeValidity']['valid'] and m['solidCount']==1 and near(m['nativeVolume'],area*5)
for c in [circle,empty]:
 assert c['final']['outputs'][0]['metrics']['runtime']['jsSha256']=='cbd49d63d0900f50dda7fc53518d5f06183e85b1dea720522cc2994b0876adc9'
 assert c['final']['outputs'][0]['metrics']['runtime']['wasmSha256']=='a81af0b78dd585124f3f2d05d09b4a387b276bd1f655f0234002a6ab4646a637'
strong=j['cases'][0]['refusal'];assert strong['stateExact'] and strong['journalVersionExact'] and strong['journalIntentExact']
a,b=strong['journalBefore'],strong['journalAfter'];assert a['revision'].split(':')[:2]==b['revision'].split(':')[:2]
assert {k:v for k,v in a.items() if k!='revision'}=={k:v for k,v in b.items() if k!='revision'}
original=(root.parent/'selected-profile-integration-review/source-dependency.test.mjs').read_text();expected=original.replace('const plane=',"import {OCC_SELECTED_PROFILE_BUILD} from '../../modules/engine/mount/engineCatalog.mjs';\nconst plane=",1).replace("'sha256:'+'a'.repeat(64)+':'+'b'.repeat(64)",'OCC_SELECTED_PROFILE_BUILD.revision')
assert (root/'selected-history-registered-build.test.mjs').read_text()=='// Existing four assertions unchanged; only invalid unregistered-build fixture corrected.\n'+expected
print('PASS3 actual public cases plus strengthened failure journal; independent volumes/build pins/native reopen/source intent; old assertions unchanged with registered fixture')
