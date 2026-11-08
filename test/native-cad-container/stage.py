#!/usr/bin/env python3
"""Stage the real CAD and Files apps for the complete native-container workflow."""
import argparse,json,shutil,subprocess,sys
from pathlib import Path
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--desktop-source',type=Path,required=True)
p.add_argument('--cad-dist',type=Path,required=True)
p.add_argument('--output',type=Path,required=True)
a=p.parse_args();source=a.desktop_source.resolve();output=a.output.resolve()
subprocess.run([sys.executable,str(source/'test/agent-cad-corpus/manufacturing-shared/stage.py'),'--desktop-source',str(source),'--cad-dist',str(a.cad_dist.resolve()),'--output',str(output)],check=True)
shutil.copytree(source/'apps/system/files',output/'system/files',ignore=shutil.ignore_patterns('node_modules'))
config=json.loads((output/'builder-config.json').read_text())
config['apps']=['jsketcher','files'];config['entries']['files']='system/files/index.mjs'
(output/'builder-config.json').write_text(json.dumps(config,indent=2)+'\n')
print(json.dumps({'scope':'actual native CAD plus Files integration fixture; no qualification','apps':config['apps']}))
