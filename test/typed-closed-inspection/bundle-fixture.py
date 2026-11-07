"""Build one private test app from existing desktop source plus candidate dist.

Inputs are code only. This never reads or copies fixture service/account state.
"""
import argparse,json,shutil,subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--desktop-source',type=Path,required=True);p.add_argument('--builder-dir',type=Path,required=True);p.add_argument('--node',required=True);p.add_argument('--stage',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
root=Path(__file__).resolve().parents[2];assert not a.stage.exists() and not a.output.exists();app=a.stage/'system/jsketcher';app.parent.mkdir(parents=True);shutil.copytree(a.desktop_source/'apps/system/jsketcher',app,ignore=shutil.ignore_patterns('node_modules'));(app/'node_modules').mkdir();target=app/'node_modules/jsketcher-build';shutil.copytree(root/'dist',target,ignore=shutil.ignore_patterns('*.map'))
manifest=json.loads((app/'app.json').read_text());manifest['assets']=[x for x in manifest['assets'] if '/static/' not in x];manifest['assets']+=['node_modules/jsketcher-build/'+f.relative_to(target).as_posix() for f in (target/'static').rglob('*') if f.is_file()];manifest['assets']=sorted(set(manifest['assets']));(app/'app.json').write_text(json.dumps(manifest,indent=2)+'\n')
config=a.stage/'builder-config.json';config.write_text(json.dumps({'source':str(a.stage.resolve()),'output':str(a.output.resolve()),'apps':['jsketcher'],'entries':{'jsketcher':'system/jsketcher/index.mjs'}}));subprocess.run([a.node,str(a.builder_dir/'build.mjs'),str(config)],check=True)
