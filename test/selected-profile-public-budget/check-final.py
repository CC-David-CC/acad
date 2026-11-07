"""Independent check of final actual public32 evidence; no product imports."""
from pathlib import Path
from urllib.parse import urlparse
from math import pi,isclose
import json
root=Path(__file__).resolve().parent
r=json.loads((root/'public-receipt.json').read_text());p=json.loads((root/'runtime-pins.json').read_text())
assert r['source']==p['source']=='6f01a09fea5c75beba9297772edd50ff37b1b2a4'
assert r['result']=='PASS public32 owned budget and persistence'
assert r['app']['sha256']==p['files']['index.bundle.js']
a=r['actual'];assert 'error' not in a and len(a['created'])==32 and len({x['outputId'] for x in a['created']})==32
for i,x in enumerate(a['progress'],1):
 b=x['budget'];assert x['created']==b['plannedNativeResults']==i and b['remainingNativeResults']==32-i
 assert b['scope']=='selected-owned-evaluation-v1' and b['maxLifetimeNames']==32 and b['maxCumulativeResultTriangles']==100000
 assert b['withinLimit'] is True and b['canAppend']==x['canCreate']==(i<32)
full=a['atCapacity']['info'];assert full['ready'] is True and full['reason'] is None and full['canCreate'] is False and full['creationReason']=='RESOURCE_LIMIT'
assert a['atCapacity']['solid']['plannedNativeResults']==32
assert {x['mode'] for x in a['refusals']}=={'selected33','selected-boolean33','selected-build-box33'}
for x in a['refusals']:assert x['error']['code']=='RESOURCE_LIMIT' and not x['error']['committed'] and x['stateExact'] and x['newWorkers']==x['newMessages']==x['allocatorCalls']==0
assert a['readonlyStateExact'] is True
near=lambda x,y:isclose(x,y,rel_tol=1e-9,abs_tol=1e-6)
target=a['created'][0]['outputId']
for state,depth in [(a['atCapacity']['snapshot'],5),(a['afterDepth'],7.5),(a['undone'],5),(a['redone'],7.5),(r['reopened']['before'],7.5),(r['reopened']['edited'],8),(r['reopened']['afterUndo'],7.5)]:
 assert len(state['outputs'])==32 and state['failure'] is None
 for body in state['outputs']:
  m=body['metrics'];d=depth if body['id']==target else 5
  assert m['solidCount']==1 and m['nativeValidity']['valid'] is True and near(m['nativeVolume'],100*pi*d)
  assert m['nativeBounds']=={'min':[-10,-10,0],'max':[10,10,d]}
  assert m['runtime']['jsSha256']=='cbd49d63d0900f50dda7fc53518d5f06183e85b1dea720522cc2994b0876adc9'
  assert m['runtime']['wasmSha256']=='a81af0b78dd585124f3f2d05d09b4a387b276bd1f655f0234002a6ab4646a637'
assert a['atCapacity']['snapshot']['sources']==a['redone']['sources']
assert r['reopened']['before']['history']==r['reopened']['afterUndo']['history']==a['redone']['history']
for trace in [a['trace'],r['reopened']['trace']]:
 assert max(x['nativeResults'] for x in trace)==32
 assert all(x['nativeResults']<=32 and x['nativeResultTriangles']<=100000 for x in trace)
for x in r['workerPins']+r['reopenWorkerPins']:
 name=Path(urlparse(x['url']).path).name
 if name in p['files']:assert x['sha256']==p['files'][name]
known={Path(urlparse(x['url']).path).name for x in r['workerPins']+r['reopenWorkerPins']}
assert {'selected-profile-worker.js',p['workers']['sketch-solver'][0],p['workers']['prism-semantic'][0],p['workers']['project-validator'][0]}<=known
print('PASS actual32/source-matched Workers; zero-work/zero-ID33 refusals; readonly/depth/travel/fresh-native continuation; independent circle volumes/bounds')
