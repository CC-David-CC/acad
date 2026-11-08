import pathlib,hashlib,json,subprocess,sys,shlex
root=pathlib.Path('/mnt/data10tb/codi-original-rectangle-step-reader-20261107-r1')
core=pathlib.Path('/mnt/data10tb/codi-acad-original-rectangle-20261107-r1')
native=pathlib.Path('/mnt/data10tb/codi-occ-owned-step-adaptive-20261107')
cohort=pathlib.Path('/mnt/data10tb/codi-occ-four-corner-clean-20261104')
sdk=cohort/'emsdk'
sha=lambda b:hashlib.sha256(b).hexdigest()
def record(p):
 p=pathlib.Path(p);data=p.read_bytes();return {'path':str(p),'resolvedPath':str(p.resolve()),'sha256':sha(data),'bytes':len(data)}
archives='TKTopTest TKBool TKBO TKBRep TKernel TKFeat TKFillet TKG2d TKG3d TKGeomAlgo TKGeomBase TKHLR TKMath TKMesh TKOffset TKPrim TKShHealing TKTopAlgo TKXSBase TKSTEPBase TKSTEPAttr TKSTEP209 TKSTEP'.split()
paths=[core/'test/original-rectangle-workflow/step-reader.cpp',core/'test/owned-step-worker/build-reader.sh',native/'shape-io/ownedTopologyV1.hpp',native/'shape-io/ownedMassPropertiesV1.hpp',root/'build.sh',root/'pin.py',sdk/'emsdk_env.sh',sdk/'.emscripten',sdk/'upstream/emscripten/em++',sdk/'upstream/emscripten/emcc.py',sdk/'upstream/bin/clang',sdk/'upstream/bin/wasm-ld']+[cohort/'build/lin32/clang/lib'/('lib'+n+'.a')for n in archives]
value={'scope':'Separate same-OCCT STEP reader compilation only, no reader execution or artifact qualification','sourceCommit':subprocess.check_output(['git','-C',str(core),'rev-parse','HEAD'],text=True).strip(),'nativeSourceCommit':subprocess.check_output(['git','-C',str(native),'rev-parse','HEAD'],text=True).strip(),'occtHeaderSourceCommit':subprocess.check_output(['git','-C','/mnt/data10tb/codi-occ-four-corner-source-20261104','rev-parse','HEAD'],text=True).strip(),'inputs':[record(p)for p in paths]}
phase=sys.argv[1]
(root/(phase+'-pins.json')).write_text(json.dumps(value,indent=2)+'\n')
if phase=='after':
 before=json.loads((root/'before-pins.json').read_text());assert value==before,'Pinned compile inputs changed during compilation'
 code=int((root/'exit-code.txt').read_text());result={'status':'COMPILE_PASS'if code==0 else 'COMPILE_FAIL','exitCode':code,'inputsUnchanged':True,'readerExecuted':False,'pins':value,'toolchain':(root/'toolchain.txt').read_text(),'compileLog':record(root/'compile.log')}
 if code==0:
  dep=(root/'dependencies.d').read_text().replace('\\\n',' ');names=shlex.split(dep.split(':',1)[1]);dependencies=[record(p)for p in sorted(set(names))];(root/'dependencies.json').write_text(json.dumps(dependencies,indent=2)+'\n')
  result['dependencies']=record(root/'dependencies.json');result['dependencyCount']=len(dependencies)
  js=record(root/'runtime/reader.js');wasm=record(root/'runtime/reader.wasm');result['outputs']={'js':js,'wasm':wasm};(root/'reader-pins.json').write_text(json.dumps({'jsSha256':js['sha256'],'wasmSha256':wasm['sha256']},indent=2)+'\n')
 (root/'receipt.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items()if k not in ['pins','toolchain']},indent=2))
