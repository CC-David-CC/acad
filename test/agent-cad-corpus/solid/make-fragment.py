"""Convert retained, reviewed case classifications to the root corpus schema."""
import json,pathlib
p=pathlib.Path(__file__).parent
r=json.loads((p/'receipt-20261105.json').read_text())
source={'commit':'4a3d7aba490490c1d87bae11be92cb88b962f3e6','appSha256':r['appSha256'],'runtimeWorkerSha256':r['runtimeWorkerSha256'],'wasmSha256':r['wasmSha256']}
scope=('Registered shared craft commands in a fresh local strict-CSP app context with synthetic host lifetime; '
       'triangle-derived display-mesh summaries, not BRep manifold proof or signed desktop bridge. '
       'Engine-unavailable feature labels refer only to this command surface.')
p0={'box','overlap-union','overlap-subtract','overlap-common','multi-body','zero-box','negative-box','cross-engine'}
cases=[]
for item in r['records']:
    name=item['case']; result=item.get('result'); expected=item.get('expected')
    if expected is None:
        if name in ('zero-box','negative-box'):expected={'outcome':'INVALID_REQUEST','publishedBodies':0}
        elif name=='cross-engine':expected={'outcome':'ENGINE_MISMATCH','priorBody':'same ID and mesh summaries'}
        elif name.endswith('-common') or name=='coincident-subtract':expected={'outcome':'empty or explicitly unsupported','priorBodies':'same IDs and mesh summaries'}
        elif name=='cross-engine-boolean':expected={'outcome':'no cross-engine operation or implicit conversion'}
        else:expected={'capability':'not advertised by common worker-solid command surface'}
    actual={'reason':item['reason']}
    if result is not None:actual['observation']=result
    cases.append({'id':'SOLID-'+name.upper().replace('-','_'),'subsystem':'kernel','priority':'P0' if name in p0 else 'P1','level':'CAD1','layer':'registered-agent-command','backend':item['engine'],'status':item['status'],'expected':expected,'actual':actual,'evidence':['test/agent-cad-corpus/solid/receipt-20261105.json','docs/research/AGENT-SOLID-CORPUS-20261105.md'],'scope':scope})
fragment={'version':1,'source':source,'cases':cases}
assert len(cases)==78 and all(c['status'] in ('pass','fail','unsupported','not-tested') for c in cases)
(p/'fragment-20261105.json').write_text(json.dumps(fragment,indent=2)+'\n')
print('fragment cases',len(cases))
