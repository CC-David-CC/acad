from pathlib import Path
import hashlib,json,subprocess,sys,os
source=Path('/mnt/data10tb/codi-occ-mechanical-native-source-20261109-r1');sdk=Path('/mnt/data10tb/codi-occ-four-corner-clean-20261104');out=Path('/mnt/data10tb/codi-occ-mechanical-native-build-20261109-r1')
commit='fc1654ee5d4471584073d4d8e3363d8c9b324566'
def git(*args):return subprocess.check_output(['git','-C',str(source),*args],text=True).strip()
def digest(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return {'sha256':h.hexdigest(),'bytes':p.stat().st_size}
if git('rev-parse','HEAD')!=commit or git('status','--porcelain'):raise SystemExit('Frozen Native source is not exact/clean')
paths={source/p for p in subprocess.check_output(['git','-C',str(source),'ls-files','-z']).decode().split(chr(0)) if p}
paths.update(p for p in (sdk/'build/include/opencascade').rglob('*') if p.is_file())
paths.update((sdk/'build/lin32/clang/lib').glob('libTK*.a'))
paths.add(sdk/'build/CMakeCache.txt')
for base in [sdk/'emsdk/upstream/emscripten/src',sdk/'emsdk/upstream/emscripten/tools',sdk/'emsdk/upstream/emscripten/cache/sysroot']:
 paths.update(p for p in base.rglob('*') if p.is_file())
for pattern in ['upstream/emscripten/*.py','upstream/emscripten/*.js','upstream/bin/clang*','upstream/bin/wasm-ld','upstream/bin/wasm-opt','upstream/bin/llvm-ar','upstream/emscripten/em++','upstream/emscripten/emcc','emsdk_env.sh']:
 paths.update(p for p in (sdk/'emsdk').glob(pattern) if p.is_file())
paths.update([out/'normal-build.sh',out/'capture-inputs.py'])
if sys.argv[1]=='before':
 files={str(p):digest(p) for p in sorted(paths) if p.is_file()}
 r={'scope':'full normal Native compile inputs; no functional qualification','sourceCommit':commit,'sourceClean':True,'sourceTree':git('rev-parse','HEAD^{tree}'),'sdkRoot':str(sdk),'files':files}
 (out/'build-inputs-before.json').write_text(json.dumps(r,indent=2)+'\n');print('Captured',len(files),'input files',flush=True)
else:
 r=json.loads((out/'build-inputs-before.json').read_text());changed=[]
 for name,row in r['files'].items():
  p=Path(name)
  if not p.is_file() or digest(p)!=row:changed.append(name)
 outputs={p.name:digest(p) for p in [out/'main.js',out/'main.wasm'] if p.is_file()}
 result={'scope':'normal compilation only, unqualified runtime','sourceCommit':commit,'sourceTree':r['sourceTree'],'buildExitCode':int(sys.argv[2]),'inputsUnchanged':not changed,'changedInputs':changed,'sourceClean':not git('status','--porcelain'),'compilerVersionFile':'compiler-version.txt','exactCommandLog':'build.log','outputs':outputs}
 (out/'native-build-result.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2),flush=True)
 if changed or not result['sourceClean']:raise SystemExit('Frozen inputs changed')
