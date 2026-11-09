#!/usr/bin/env python3
# Source manifest preparation only. Never imports/evaluates JS/Native modules.
from pathlib import Path
import hashlib,json,re,subprocess,sys
root=Path(__file__).resolve().parent.parent
out=Path(sys.argv[1])
rosters=['build/manufacturing-mesh-assets-entry.cjs','build/shell-assets-entry.cjs','build/circular-assets-entry.cjs','modules/engine/mount/ownedMechanicalNativeResources.mjs']
roots=set()
for path in rosters:
 roots.update(re.findall(r"['\"](modules/[^'\"]+\.mjs)['\"]",(root/path).read_text()))
roots.update('modules/engine/mount/'+p for p in ['ownedMechanicalNativeCandidate.mjs','countersinkNativeCalls.mjs','ownedCountersinkWorker.mjs','ownedCountersinkPlan.mjs','ownedConicalContract.mjs','countersinkFacts.mjs'])
roots.add('modules/engine/solid/ownedCountersinkIntent.mjs')
roots.add('modules/engine/extrusion/profileConstructorSourcePreparation.mjs')
roots.add('modules/engine/mount/occ-mechanical-native-mount.mjs')
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
result={'format':'optional-mechanical-source-inventory/1','available':False,'composed':False,'scope':'exact source snapshot only; optional factory and binding source defined but no generated/qualified component is asserted','sourceComposition':'factory-binding-and-primary-extents-present-unbuilt','sourceBasis':subprocess.check_output(['git','-C',str(root),'rev-parse','HEAD'],text=True).strip(),'rosters':{p:sha(p) for p in rosters},'roots':sorted(roots),'sources':dict(sorted(files.items())),'entry':{'path':'build/mechanical-native-candidate-entry.mjs','sha256':sha('build/mechanical-native-candidate-entry.mjs'),'state':'off-fallback-literal-null'},'pendingComposition':['root review, normal exact-source component regeneration and actual optional emitted graph/availability','whole qualification of actual constructor-time binding and baseline private token custody','countersink semantic operation/typed ANGLE/J/PM/public/export workflow remains unregistered','explicit future new-pair Shell/circular/attachment/blind/counterbore/extent/derived drawing admissions remain OFF'],'extentSource':{'commit':'8678c35b770855fa3978abfeab789c76f303bfd1','composition':'present-on-primary-only','roots':['modules/engine/mount/ownedProfileExtentPlan.mjs','modules/engine/mount/ownedProfileExtentWorker.mjs','modules/engine/mount/profileExtentHolePlan.mjs','modules/engine/mount/profileMechanicalSource.mjs','modules/engine/mount/profileExtentSelectionIndex.mjs','modules/engine/solid/ownedProfileExtentFeature.mjs'],'newPairAdmission':False}}
with out.open('x') as f:json.dump(result,f,indent=2);f.write('\n')
print(json.dumps({'available':False,'composed':False,'sources':len(files),'manifest':str(out)}))
