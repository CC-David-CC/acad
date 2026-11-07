"""Pinned source inventory, not runtime qualification or a new solver framework."""
import hashlib,json,re,subprocess
from pathlib import Path

pin=subprocess.check_output(['git','rev-parse','22d8a04e3'],text=True).strip()
patterns={
 'derived_cache_reads':r'fullyConstrained|solveStatus|projectedLastValid|paramToIsolation|eliminatedParams|substitutedParams|polynomialIsolations|\.redundant|\.conflicting|isConflicting|impliedByLockedEndpoints',
 'numeric_or_authored_mutation_entries':r'(parametricManager|\bpm)\.(prepare|solve|startTransaction|finishTransaction|add|addAll|_add|remove|removeObjects|removeGenerator|addGenerator|constraintUpdated|newStage|setConstantsFromGeometry|applyConstantDefinition)\(',
}
groups={}
for name,pattern in patterns.items():
 out=subprocess.run(['git','grep','-n','-E',pattern,pin,'--','web/app/sketcher'],capture_output=True,text=True,check=False)
 assert out.returncode in (0,1),out.stderr
 rows=[]
 for line in out.stdout.splitlines():
  _,file,number,text=line.split(':',3)
  if '/headless/' in file or '/constr/' in file or file.endswith('/parametric.ts'):continue
  rows.append({'file':file,'line':int(number),'source':text.strip()[:320]})
 groups[name]=rows
files=sorted({row['file'] for rows in groups.values() for row in rows}|{'web/app/sketcher/tools/manager.js','web/app/sketcher/parametric.ts','web/app/sketcher/constr/AlgNumSystem.ts'})
data={'version':1,'source':pin,'scope':'Legacy current cache consumers. Direct derived reads and selected mutation entries are separate; allConstraints alone is an authored graph read, not proof of prepared cache. Dynamic tool/action dispatch is manually reviewed in README.','groups':groups,'files':{file:hashlib.sha256(subprocess.check_output(['git','show',pin+':'+file])).hexdigest() for file in files}}
Path(__file__).with_name('consumer-inventory.json').write_text(json.dumps(data,indent=2)+'\n')
print('Pinned inventory:',len(files),'files;',', '.join(name+'='+str(len(rows)) for name,rows in groups.items()))
