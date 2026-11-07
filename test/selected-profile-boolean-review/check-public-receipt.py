"""Check actual public review evidence against supplied normal-build pins."""
from pathlib import Path
from urllib.parse import urlparse
import json
root=Path(__file__).resolve().parent
r=json.loads((root/'public-receipt.json').read_text());p=json.loads((root/'runtime-pins.json').read_text())
assert r['source']==p['source']=='32386643ab487de2ca40094549274b109822a6f4'
assert r['result']=='PASS scoped public controls' and len(r['cases'])==2
assert r['app']['sha256']==p['files']['index.bundle.js']
for c in r['cases']:
 assert 'error' not in c and c['final']['failure'] is None
 for a in c['refusals']:assert a['stateExact'] and a['noWorkerDispatch'] and not a['error']['committed']
 for worker in c['workerPins']:
  name=Path(urlparse(worker['url']).path).name
  if name in p['files']:assert worker['sha256']==p['files'][name],name
selected=next(c for c in r['cases'] if c['mode']=='selected-empty')
assert len(selected['refusals'])==6
known={Path(urlparse(w['url']).path).name for w in selected['workerPins']}
assert {'selected-profile-worker.js',p['workers']['sketch-solver'][0],p['workers']['prism-semantic'][0]}<=known
print('PASS actual app/known Worker pins, two public cases and six exact-state/no-dispatch refusals')
