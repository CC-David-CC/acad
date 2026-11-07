import hashlib,json,re,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[2];base='f21f91b7375f621019c830dd531e09c1569211ba';sha=lambda b:hashlib.sha256(b).hexdigest()
def before(n):return subprocess.check_output(['git','-C',str(root),'show',base+':'+n],stderr=subprocess.DEVNULL)
product=subprocess.check_output(['git','-C',str(root),'diff','--name-only',base+'..e8432ec3c'],text=True).splitlines();sources={}
for n in product:
 p=root/n;sources[n]={'after':sha(p.read_bytes())}
 try:sources[n]['before']=sha(before(n))
 except subprocess.CalledProcessError:sources[n]['before']=None
for d in ['test/adaptive-metrology-registration','test/adaptive-metrology-worker']:
 for p in (root/d).iterdir():
  if p.is_file():sources[str(p.relative_to(root))]={'after':sha(p.read_bytes())}
extra='test/selected-profile-loft/catalog.test.mjs';sources[extra]={'before':sha(before(extra)),'after':sha((root/extra).read_bytes())}
old=before('modules/engine/mount/engineCatalog.mjs').decode();new=(root/'modules/engine/mount/engineCatalog.mjs').read_text()
for line in old.splitlines():
 if line.startswith('export const OCC_') or "export const DEFAULT_CAD_ENGINE=" in line or line.lstrip().startswith(('occ:engine(','manifold:engine(','smlib:engine(')):assert line in new,line
native=lambda s:{n:{'jsSha256':j,'wasmSha256':w} for n,j,w in re.findall(r"export const (OCC_\w+)=engine\(.*?,'([a-f0-9]{64})','([a-f0-9]{64})'\);",s)}
oldPairs,newPairs=native(old),native(new);assert all(newPairs[k]==v for k,v in oldPairs.items());assert len(newPairs)==len(oldPairs)+1
factory=json.loads((root/'test/adaptive-metrology-registration/evidence-r1/factory-assets.json').read_text());assert sum(x['bytes'] for x in factory['files'].values())==328173383
worker=root/'test/adaptive-metrology-worker/evidence-r1';positive=json.loads((worker/'worker.json').read_text());assert positive['status']=='PASS' and positive['ownedBrowserClosed'] is True;assert len(positive['actual']['rows'])==14 and len(positive['actual']['refusals'])==6;assert all(x['terminated'] for x in positive['actual']['workers']);assert positive['liveOwnedWorkers']==0
for name in ['old-new-comparison.json','asset-admission.json','unavailable.json','legacy-default.json']:assert json.loads((worker/name).read_text())['status']=='PASS'
comparison=json.loads((worker/'old-new-comparison.json').read_text())['actual']['rows'];assert comparison[0]['topology']==comparison[1]['topology'] and comparison[0]['mesh']==comparison[1]['mesh']
legacy=json.loads((worker/'legacy-default.json').read_text())['actual'];assert legacy['descriptor']['maxLifetimeNames']==8 and len(legacy['rows'])==8 and legacy['refusal']['code']=='RESOURCE_LIMIT'
files={}
for d in ['test/adaptive-metrology-registration/evidence-r1','test/adaptive-metrology-worker/evidence-r1']:
 for p in (root/d).iterdir():
  if p.is_file() and p.name!='pins.json':files[str(p.relative_to(root))]={'sha256':sha(p.read_bytes()),'bytes':p.stat().st_size}
out={'scope':'Actual experimental catalog/factory/native Worker component only, not full shared app qualification or default promotion','sourceCapture':subprocess.check_output(['git','-C',str(root),'rev-parse','HEAD'],text=True).strip(),'base':base,'productCommit':'e8432ec3c','sourcePins':sources,'existingNativePairsBefore':oldPairs,'nativePairsAfter':newPairs,'existingNativePairsUnchanged':True,'bootstrapBefore':sha(before('modules/engine/mount/oci-verified-worker.js')),'bootstrapAfter':sha((root/'modules/engine/mount/oci-verified-worker.js').read_bytes()),'factoryAssets':{'files':len(factory['files']),'bytes':328173383,'adaptiveBytes':36069441,'oldLoftBytes':36065129,'fullAppBudgetQualified':False},'evidence':files}
p=root/'test/adaptive-metrology-registration/evidence-r1/pins.json';p.write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({'status':'PASS','sourcePins':len(sources),'evidence':len(files),'existingPairs':len(oldPairs),'newPairs':len(newPairs),'pinsSHA256':sha(p.read_bytes())}))
