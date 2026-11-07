"""Tighten provisional labels using captured data; do not manufacture runs."""
import json, pathlib
p=pathlib.Path(__file__).parent
r1=json.loads((p/'provisional-r1.json').read_text())
r2=json.loads((p/'provisional-contact-r2.json').read_text())
r3=json.loads((p/'provisional-cross-r3.json').read_text())
cross={r['engine']:r for r in r3['records'] if r.get('case')=='cross-engine' and 'result' in r}
out=[]
empty={'disjoint-common','face-contact-common','edge-contact-common','point-contact-common','coincident-subtract'}
for r in r1['records']:
    if 'result' not in r:
        continue
    case=r['case']
    if case=='cross-engine':
        r=cross[r['engine']]
    result=r['result']
    if case in ('zero-box','negative-box'):
        good=not result['ok'] and result.get('code')=='INVALID_REQUEST' and len(result.get('after') or [])==0
        r['status']='pass' if good else 'fail'
        r['reason']='invalid request rejected with no published body' if good else 'invalid request did not cleanly refuse'
    elif case=='cross-engine':
        after=result.get('after') or []
        good=not result['ok'] and result.get('code')=='ENGINE_MISMATCH' and len(after)==1 and after[0]['engine']==r['engine'] and abs(after[0]['volume']-1000)<.1 and result.get('before')==after
        r['status']='pass' if good else 'not-tested'
        r['reason']='second-engine box refused; first body ID and mesh summaries unchanged; cross-engine Boolean not reached' if good else 'did not establish expected single-engine graph refusal'
    elif case in empty:
        preserved=result.get('before') is not None and result['before']==result.get('after')
        explicit=result.get('code') in ('EMPTY_OR_NON_SOLID_UNSUPPORTED','UNSUPPORTED_CASE')
        r['status']='unsupported' if not result['ok'] and preserved and explicit else 'fail'
        r['reason']='empty result refused; prior body IDs and mesh summaries unchanged' if r['status']=='unsupported' else 'empty result or state preservation not established'
    if result.get('ok') and r['status']=='pass':
        assert result.get('noNativeHandles') is True
        assert all(h.get('engine')==r['engine'] for h in result.get('history',[]))
    out.append(r)
for r in r2['records']:
    if 'result' not in r:
        continue
    r['expected']={'volume':2000,'bounds':[[0,0,0],[20,20,10 if r['case']=='edge-contact-union' else 20]],'solid_manifoldness':'unproven'}
    out.append(r)
for engine in ('occ','manifold','smlib'):
    out.append({'engine':engine,'case':'cross-engine-boolean','status':'not-tested','reason':'second engine is refused at body creation, so a cross-engine Boolean could not be issued'})
    for name in ('extrusion','revolve','curved-profile','shell','fillet','STEP-import-export'):
        out.append({'engine':engine,'case':name,'status':'unsupported','reason':'not advertised by this common worker-solid command surface; other paths not evaluated'})
receipt={'version':1,'source':'4a3d7aba4','appSha256':'4a340ecf3973c88c67d879a697fcb17d7e55e523812aedcd356323be388bfa53','runtimeWorkerSha256':{'occ':'d1dfb0c42929870f07037a9e83590e0568d92803873053879042d1f820035fd1','manifold':'494a336a665759a1c3002b2cbcc6881f375bc78711186c65a254a3bb7dbef301','smlib':'078dc881c488e82fff16cfdcdaef077c107a61e8b7ab45e522f32f7509f403ed'},'wasmSha256':{'occ':'13617eda9a2118edfd1244b5d46523e7d9628a87ec995a0237b2b5cc58d532f2','manifold':'7bb5f8ee10fcafdab78799b1e5dd2cdc7c282ea0bf8e7939c43f3ad34b823e3d','smlib':'a48a3283760c21337881c5e2d5c973dbc62cf95cae46d1c012effd75389eb1ae'},'scope':'actual registered craft commands, fresh context per case, synthetic host binding, strict-CSP local fixture; independent triangle summaries; not signed desktop command bridge','classification':'r1 provisional labels corrected from captured evidence; contact controls from r2; cross-engine controls from r3; execution body unchanged','records':out}
(p/'receipt-20261105.json').write_text(json.dumps(receipt,indent=2)+'\n')
from collections import Counter
print(Counter(r['status'] for r in out))
