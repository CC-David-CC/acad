"""Generate a PRIVATE32-cap controller graph; never overwrite product sources.

Only two exact controller constants change. All imported geometry modules and
native assets remain byte-identical. Experimental Worker changes only maxNames.
"""
import argparse,hashlib,json,shutil
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);a=p.parse_args();root=a.root
source=root/'modules/engine/mount';target=root/'test/selected-profile-budget/experiment32/mount';assert not target.exists();target.mkdir(parents=True)
files={}
for item in source.glob('*.mjs'):
 shutil.copy2(item,target/item.name);files[item.name]=hashlib.sha256(item.read_bytes()).hexdigest()
controller=target/'worker-controller.mjs';text=controller.read_text()
for old,new in [('maxLifetimeNames:8','maxLifetimeNames:32'),('if(next>=8)','if(next>=32)')]:
 assert text.count(old)==1,old;text=text.replace(old,new)
controller.write_text(text)
receipt={'scope':'PRIVATE experimental32 lifetime caps; no production/native/default edits','baseControllerSHA256':files['worker-controller.mjs'],'experimentControllerSHA256':hashlib.sha256(controller.read_bytes()).hexdigest(),'originalModules':files,'replacements':{'maxLifetimeNames:8':'maxLifetimeNames:32','if(next>=8)':'if(next>=32)'}}
(root/'test/selected-profile-budget/experiment32/staging.json').write_text(json.dumps(receipt,indent=2)+'\n')
