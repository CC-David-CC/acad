#!/usr/bin/env python3
"""Keep raw native observations outside Git; compact display arrays after checks."""
import hashlib,json,pathlib,shutil,socket,subprocess
here=pathlib.Path(__file__).resolve().parent;root=here.parents[1]
assert subprocess.check_output(['git','-C',str(root),'rev-parse','HEAD'],text=True).strip()=='2c444c8bf657a589355abc961a7e464e28b8c004'
out=here/'evidence-r1';out.mkdir(exist_ok=False)
raw=pathlib.Path('/tmp/codi-owned-revolve-worker-raw-20261106-r1');raw.mkdir(exist_ok=False)
sha=lambda b:hashlib.sha256(b).hexdigest()
def compact(v):
 if isinstance(v,list):return [compact(x) for x in v]
 if isinstance(v,dict):
  result={k:compact(x) for k,x in v.items() if k!='coordinates'}
  if 'coordinates' in v:
   x=v['coordinates'];assert isinstance(x,list)
   result['displayCoordinatesObservation']={'float64Count':len(x),'sha256OfCompactJSON':sha(json.dumps(x,separators=(',',':'),ensure_ascii=False).encode()),'scope':'Display coordinates omitted after original full-array oracles; raw receipt pinned separately'}
  return result
 return v
raws={}
for name in ['browser-r2.json','browser-r3.json','old-browser-r1.json']:
 p=here/name;b=p.read_bytes();r=json.loads(b);assert r['status']=='PASS' and r['ownedBrowserClosed']
 raws[name]={'sha256':sha(b),'bytes':len(b),'local':str(raw/name),'r730':'/mnt/data10tb/codi-owned-revolve-worker-proof-20261106-r1/'+name}
 shutil.move(str(p),raw/name);(out/name).write_text(json.dumps(compact(r),separators=(',',':'))+'\n')
for name in ['browser-r1.json','browser-r1.log','browser-r2.log','browser-r3.log','old-browser-r1.log','stage-r1.log','stage-old-r1.log','stage-default-r1.log','unit-r1.log','protocol-r1.log','retained-unit-r1.log','tsc-r1.log']:
 shutil.move(str(here/name),out/name)
for label,p in [('component',pathlib.Path('/tmp/codi-owned-revolve-component-20261106-r1')),('retained-component',pathlib.Path('/tmp/codi-owned-revolve-old-component-20261106-r1'))]:
 shutil.copyfile(p/'component.json',out/(label+'.json'))
 r=json.loads((p/'component.json').read_text())
 for name,want in r['files'].items():assert sha((p/name).read_bytes())==want['sha256']
 for name,want in r['sources'].items():assert sha((root/name).read_bytes())==want
for port in [20932,20933]:
 s=socket.socket();assert s.connect_ex(('127.0.0.1',port))!=0;s.close()
summary={'status':'PASS_SCOPED_COMPONENT','product':subprocess.check_output(['git','-C',str(root),'rev-parse','HEAD'],text=True).strip(),'revolvePositive':12,'revolveNativePointChecks':29,'revolveRefusals':6,'invalidExtraField':1,'lifetimeResults':32,'nextPreflight':'RESOURCE_LIMIT','aggregateAccepted':17,'aggregateChargedTriangles':95756,'aggregateNext':'RESOURCE_LIMIT','aggregateSmallerContinuation':True,'retainedNewBuildPatternChains':4,'retainedNewBuildPatternControls':8,'retainedNewBuildFiveCutBooleanChains':2,'retainedOldBuildPatternChains':1,'retainedOldBuildPatternControls':8,'retainedOldBuildFiveCutBooleanChains':1,'retainedPlannerTests':15,'newNodeWorkerGroups':7,'protocolDoubleTests':12,'tscExit':0,'ownedServersStopped':True,'shared19329Untouched':True,'publicE13Qualified':False,'registeredCatalogChanged':False,'legacyEmbeddedPinUpdate':'root-owned outstanding'}
(out/'raw-receipts.json').write_text(json.dumps(raws,indent=2)+'\n');(out/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
pins={p.name:{'sha256':sha(p.read_bytes()),'bytes':p.stat().st_size} for p in sorted(here.iterdir()) if p.is_file()}
(out/'source-pins.json').write_text(json.dumps({'scope':'Post-run source snapshot; original receipts separately bind executed driver sources','files':pins},indent=2)+'\n')
print(json.dumps(summary))
