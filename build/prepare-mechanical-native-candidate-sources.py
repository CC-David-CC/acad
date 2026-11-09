#!/usr/bin/env python3
# Source manifest preparation only. Never imports/evaluates JS/Native modules.
from pathlib import Path
import hashlib,json,re,subprocess,sys
root=Path(__file__).resolve().parent.parent
out=Path(sys.argv[1])
rosters=['build/manufacturing-mesh-assets-entry.cjs','build/shell-assets-entry.cjs','build/circular-assets-entry.cjs']
roots=set()
for path in rosters:
 roots.update(re.findall(r"['\"](modules/[^'\"]+\.mjs)['\"]",(root/path).read_text()))
roots.update('modules/engine/mount/'+p for p in ['ownedMechanicalNativeCandidate.mjs','countersinkNativeCalls.mjs','ownedCountersinkWorker.mjs','ownedCountersinkPlan.mjs','ownedConicalContract.mjs','countersinkFacts.mjs'])
roots.add('modules/engine/solid/ownedCountersinkIntent.mjs')
imports=re.compile(r'''\b(?:import|export)\s+(?:[^'";]*?\s+from\s*)?['"]([^'"]+)['"]''')
files={}
def capture(name):
 if name in files:return
 path=(root/name).resolve()
 if not path.is_relative_to(root) or not name.startswith('modules/') or not name.endswith('.mjs'):raise SystemExit('Invalid closed source path: '+name)
 raw=path.read_bytes();dependencies=[]
 files[name]={'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'dependencies':dependencies}
 for match in imports.finditer(raw.decode()):
  spec=match[1]
  if not spec.startswith('.'):raise SystemExit('External candidate source import: '+name)
  dependency=(path.parent/spec).resolve().relative_to(root).as_posix();dependencies.append(dependency);capture(dependency)
for name in sorted(roots):capture(name)
sha=lambda p:hashlib.sha256((root/p).read_bytes()).hexdigest()
result={'format':'unregistered-mechanical-source-inventory/1','available':False,'composed':False,'scope':'exact source snapshot only; no executable component/worker/factory','sourceBasis':subprocess.check_output(['git','-C',str(root),'rev-parse','HEAD'],text=True).strip(),'rosters':{p:sha(p) for p in rosters},'roots':sorted(roots),'sources':dict(sorted(files.items())),'entry':{'path':'build/mechanical-native-candidate-entry.mjs','sha256':sha('build/mechanical-native-candidate-entry.mjs'),'state':'literal-null'},'pendingComposition':['actual current root source batch and caption/C11 fixes, preserving all old cohort inventories','coordinator terminal preflight/decode repair after d5a5c0d','actual immutable constructor-time source binding issuer, not a caller flag','explicit new-pair OCI/controller/ledger/private-factory admission and exact compiled-source closure','extent source roots below are not yet composed; extent admission remains OFF'],'pendingExtentSource':{'commit':'9f9bac866390f5698c34f12864e99f190f8935a3','roots':['modules/engine/mount/ownedProfileExtentPlan.mjs','modules/engine/mount/ownedProfileExtentWorker.mjs','modules/engine/mount/profileExtentHolePlan.mjs','modules/engine/mount/profileMechanicalSource.mjs','modules/engine/mount/profileExtentSelectionIndex.mjs','modules/engine/solid/ownedProfileExtentFeature.mjs'],'admission':False}}
with out.open('x') as f:json.dump(result,f,indent=2);f.write('\n')
print(json.dumps({'available':False,'composed':False,'sources':len(files),'manifest':str(out)}))
