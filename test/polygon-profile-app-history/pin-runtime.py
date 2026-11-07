"""Pin completed private code outputs and independently compare packaged bytes."""
import argparse,hashlib,json,subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--runtime',type=Path,required=True);p.add_argument('--packaged',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
root=a.runtime.resolve();assert not a.output.exists()
subprocess.run(['git','-C',str(root),'diff','--exit-code'],check=True)
source=subprocess.check_output(['git','-C',str(root),'rev-parse','HEAD'],text=True).strip()
sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
files={str(f.relative_to(root/'dist')):sha(f) for f in sorted((root/'dist/static').rglob('*')) if f.is_file() and not f.name.endswith('.map')}
assert files['static/polygon-profile/polygon-profile-occ-portable.js']=='5414a24c96eff09b77f7d3fe758287c9696e63127c91e73011f6f2939de2a8eb'
assert files['static/polygon-profile/polygon-profile-occ.wasm']=='534ffdd2d88632a7878d654742f2df72c16691f3c814085e4f525efc74961e19'
for name,pin in files.items():assert sha(a.packaged/name)==pin,('Packaged code mismatch',name)
v={'source':source,'sourceBase':'186972b7d8aeea664954bad67bbc8366174a1523','desktop':'d5959a0461480b583e2eea85e781ee544b24d2d7','files':files,'packagedComparison':{'status':'PASS','files':len(files)},'appConfigSha256':sha(root/'test/polygon-profile-app-history/webpack.app.cjs')}
a.output.write_text(json.dumps(v,indent=2)+'\n');print(source,len(files),files['static/index.bundle.js'])
