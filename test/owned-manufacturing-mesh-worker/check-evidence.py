#!/usr/bin/env python3
"""Offline raw packet, source pin and independent mesh checks, no Native execution."""
from pathlib import Path
import json,hashlib,subprocess,sys
root=Path(__file__).parent;load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
rows=[]
for version in ['r1','r2','r3']:
 p=root/('evidence-'+version);r=load(p/'receipt.json');assert r['status']=='PASS' and r['ownedBrowserClosed'] and r['sourcePins']==r['sourcePinsAfter'];a=r['actual'];assert len(a['meshes'])==14 and len(a['refusals'])==6 and len(a['inherited'])==5
 for row in a['meshes']:
  f=p/row['sink']['file'];assert sha(f)==row['sink']['sha256'] and f.stat().st_size==row['metadata']['byteLength']==row['sink']['bytes'];assert row['preserved'] and row['before']==row['after'];assert len([x for x in row['replies'] if x['kind']=='manufacturing-mesh-begun'])==1 and len([x for x in row['replies'] if x['kind']=='manufacturing-mesh-result'])==1
 assert all(w['terminated'] for w in a['workers']);assert len([x for x in a['controls'] if x.get('realmTerminated')])==2;assert next(x for x in a['inherited'] if x['kind']=='sweep')['point']['classification']=='inside'
 math=json.loads(subprocess.check_output([sys.executable,str(root/'check-matrix.py'),str(p)]));assert math['status']=='PASS' and math['meshes']==14 and math['points']==93;rows.append({'run':version,'meshes':14,'points':93})
for name in ['fault-proof-r4.json','retained-proof-r3.json']:
 r=load(root/'evidence-r3'/name);assert r['status']=='PASS' and r['ownedBrowserClosed'];assert all(w['terminated'] for w in r['actual']['workers'])
r=load(root/'evidence-r3/fault-proof-r4.json');assert len(r['actual']['rows'])==6;assert [x['outcome']['code'] for x in r['actual']['rows']]==['ENGINE_FAILURE']*4+['ENGINE_CLEANUP_FAILED']*2
for row in r['actual']['rows'][3:]:
 w=json.loads(row['outcome']['message']);assert w['sourceNames']==1 and w['releases'][0]['released'] is True and all(x['activeCount']==0 and x['status']==0 for x in w['releases'])
 if row['mode']=='primary-and-release':assert w['caught']['primaryMessage']=='injected-primary-after-genuine-read' and w['caught']['cleanupCauseIsZero']
r=load(root/'evidence-r3/retained-proof-r3.json');assert len(r['actual']['rows'])==5
for row in r['actual']['rows']:assert row['refusal']['code']=='UNSUPPORTED_OPERATION' and row['dispatches']==0 and 'manufacturingMesh' not in row['init']
r=load(root/'evidence-r3/continuation/receipt.json');assert r['status']=='PASS' and r['actual']['before']==r['actual']['afterRefusal']==r['actual']['after'] and r['actual']['refusal']['code']=='MANUFACTURING_MESH_RESOURCE_LIMIT' and r['actual']['sourceRequestPreserved'];assert sha(root/'evidence-r3/continuation/cylinder.mesh')==r['actual']['sink']['sha256']
pins=load(root/'proof-pins.json')
for name,expected in pins['files'].items():assert sha(root/name)==expected,name
assert load(root/'evidence-before-shared-buffer/result.json')['acceptedSharedBuffer'] is True
assert load(root/'evidence-before-scalar-validation/result.json')['scalarToJSONCalls']==1
print(json.dumps({'status':'PASS','scope':'Recorded genuine production Worker/native component + independent fixture math; not generic manufacturing/3MF certification','runs':rows,'faults':6,'oldCohorts':5,'sameSourceContinuation':True},indent=2))
