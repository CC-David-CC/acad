"""Independent recorded scope/status/byte/preservation checks; no Native rerun."""
from pathlib import Path
import json,hashlib
root=Path(__file__).resolve().parent;p=root/'evidence-component-r1';pins=json.loads((p/'pins.json').read_text())
for name,digest in pins['evidence'].items():assert hashlib.sha256((p/name).read_bytes()).hexdigest()==digest,name
for name,digest in pins['sources'].items():assert hashlib.sha256((root.parents[1]/name).read_bytes()).hexdigest()==digest,name
r=json.loads((p/'current/browser.json').read_text());assert r['status']=='PASS' and r['ownedBrowserClosed'];a=r['actual'];assert len(a['views'])==11 and len(a['refusals'])==4
for row in a['views']:
 assert row['before']==row['after'] and row['preserved'];assert row['valueBytes']==row['metadata']['fragmentCount']*96 and row['tagBytes']==row['metadata']['fragmentCount']*4;assert row['valueBytes']+row['tagBytes']<=819200
 assert len([x for x in row['replies'] if x['kind']=='orthographic-read-begun'])==1 and len([x for x in row['replies'] if x['kind']=='orthographic-read-result'])==1
for row in a['refusals']:assert row['before']==row['after'];assert row['outcome']['code']==('ORTHOGRAPHIC_CURVE_UNSUPPORTED' if row['label']=='unsupported-loft-curve' else 'ORTHOGRAPHIC_INVALID_FRAME')
c=json.loads((p/'current/controls.json').read_text());assert c['status']=='PASS' and c['ownedBrowserClosed'];assert len(c['actual']['rows'])==13 and all(w['terminated'] for w in c['actual']['workers'])
q=next(x for x in c['actual']['rows'] if x['name']=='read-at32-name-capacity');assert q['created']==32 and q['posts']==0 and q['outcome']['code']=='RESOURCE_LIMIT' and q['classification']['classification']=='inside'
t=json.loads((p/'current/native-trace.json').read_text());assert t['status']=='PASS' and len(t['traces'])==1;trace=t['traces'][0];assert trace['byteLength']==71557 and [x['length'] for x in trace['reads']]==[65536,6021,0] and trace['released'] and trace['activeCount']==0
old=json.loads((p/'current/retained.json').read_text());assert old['status']=='PASS' and old['ownedBrowserClosed'] and len(old['actual']['rows'])==5
for row in old['actual']['rows']:assert row['refusal']['code']=='UNSUPPORTED_OPERATION' and row['refusalPosts']==0 and not any(x['id']=='solid.drawing.orthographic.read' for x in row['descriptor']['operations'])
print(json.dumps({'status':'PASS','views':11,'refusals':4,'runtimeControls':13,'retainedCohorts':5,'nativeChunkLengths':[65536,6021,0],'scope':'recorded genuine Worker evidence; no new run/app/dimension claim'},indent=2))
