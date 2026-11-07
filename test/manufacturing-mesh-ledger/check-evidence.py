#!/usr/bin/env python3
"""Offline genuine component observations + unchanged independent box oracle."""
import hashlib,json,importlib.util
from pathlib import Path
root=Path(__file__).parent
load=lambda p:json.loads(p.read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
r=load(root/'evidence-after/catalog-ledger.json')
assert r['status']=='PASS' and r['ownedBrowserClosed'] and r['sourcePinsBefore']==r['sourcePinsAfter']
for name,pin in r['sourcePinsBefore'].items():assert sha(root/name)==pin,name
assert not r['console'];a=r['actual'];assert len(a['rows'])==2 and len(a['workers'])==2 and all(w['terminated']for w in a['workers'])
x,y=a['rows'];assert x['purpose']=='observation' and x['ownerState']=='candidate' and x['rejected']=='OBSERVATION_PUBLICATION_FORBIDDEN';assert x['usageBefore']==x['usageAfter'];assert y['purpose']=='model' and y['ownerState']=='accepted' and y['outcome']['code']=='OBSERVATION_AUTHORITY_REQUIRED'
assert a['usage']=={'owners':0,'mounts':0,'candidates':0,'accepted':0,'detached':0,'cleanupFailed':False}
assert x['metadata']['sourcePreserved'] and x['metadata']['byteLength']==368 and x['metadata']['vertexCount']==8 and x['metadata']['triangleCount']==12
f=root/'evidence-after'/x['sink']['file'];assert sha(f)==x['sink']['sha256'] and f.stat().st_size==x['sink']['bytes']==368
spec=importlib.util.spec_from_file_location('unchanged_mesh_math',root.parent/'owned-manufacturing-mesh-worker/check-mesh.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);math=m.check(f,'box')
for row in a['rows']:assert abs(row['metrics']['nativeVolume']-6000)<=1e-6 and row['metrics']['nativeValidity']['valid'] and row['metrics']['solidCount']==1
p=load(root/'evidence-after/optional-prep.json');assert p['status']=='PASS' and p['restoredOwnStage'] and len(p['rows'])==3 and p['rows'][-1]['exit']!=0
comparison=load(root/'evidence-after/root-source-comparison.json');assert len(comparison)==9 and all(x['identical'] and x['ownSHA256']==x['root9baSHA256'] for x in comparison.values())
old=load(root/'evidence-factory-setup/before-resource-minimization-inventory.json');assert old['files']['manufacturing-mesh/manufacturing-mesh-occ-portable.js']['sha256']!='32eec74e3019d9e2d767c9016f05aa3daa49441c6102423a269d67b9c7f02a08'
for name in ['before-numeric-alias.json','before-cleanup-baseline.json','before-accept-usage-baseline.json']:assert load(root/'evidence-factory-setup'/name)['status']=='FAIL'
pins=load(root/'proof-pins.json')
for name,pin in pins['files'].items():assert sha(root/name)==pin,name
print(json.dumps({'status':'PASS','actualCatalogLedgerRows':2,'optionalPreparationControls':3,'rootProductFilesIdentical':9,'independentActualMesh':math,'scope':'Native catalog/private candidate ledger/component only; no normal app, source replay, Save/Open or 3MF claim'},indent=2))
