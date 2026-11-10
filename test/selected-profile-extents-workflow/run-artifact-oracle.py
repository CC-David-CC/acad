#!/usr/bin/env python3
"""Single offline complete artifact run with separate post-whole source custody.

The historical browser receipt is never rewritten. This is an owned serial
invocation, not a browser service or filesystem race harness.
"""
import hashlib,json,os,subprocess,sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
FILES=[
 'test/selected-profile-extents-workflow/'+name for name in
 ('run-artifact-oracle.py','check.py','mesh_oracle.py','svg_oracle.py','step_oracle.py','negative_archive.py')
]+['test/library-validation/'+name for name in
 ('cgal_evidence.py','cylindrical_surface_certificate.py','planar_coverage.py','planar_patch_certificate.py')
]+['test/native-cad-container/archive_oracle.py','test/drawing-dimension-oracle.py']

def sha(data):return hashlib.sha256(data).hexdigest()
def git(*args):return subprocess.run(['git','-C',str(ROOT),*args],capture_output=True,check=True).stdout
def capture_inputs(whole,extra):
 # Freeze the entire original evidence tree, not only its JSON manifest.
 # Stream hashes so custody does not allocate detached copies of every file.
 result={};total=0;visited=0
 if whole.is_symlink() or not whole.is_dir():raise ValueError('owned concrete whole directory required')
 def add(path,key):
  nonlocal total
  if path.is_symlink() or not path.is_file():raise ValueError('concrete evidence file required: '+str(path))
  size=path.stat().st_size;total+=size
  if size>134217728 or total>1073741824:raise ValueError('offline evidence hashing budget exceeded')
  digest=hashlib.sha256()
  with path.open('rb') as stream:
   for chunk in iter(lambda:stream.read(1048576),b''):digest.update(chunk)
  result[key]={'bytes':size,'sha256':digest.hexdigest()}
 for path in whole.rglob('*'):
  visited+=1
  if visited>10000 or path.is_symlink():raise ValueError('whole evidence path budget/type exceeded')
  if path.is_file():add(path,'whole/'+path.relative_to(whole).as_posix())
  elif not path.is_dir():raise ValueError('unexpected whole evidence entry')
 for path in extra:add(path,str(path))
 return result

def capture(commit):
 result={}
 for name in FILES:
  actual=(ROOT/name).read_bytes();frozen=git('show',commit+':'+name)
  if actual!=frozen:raise ValueError('verifier differs from frozen Git: '+name)
  result[name]={'bytes':len(actual),'sha256':sha(actual),'gitBlob':git('rev-parse',commit+':'+name).decode().strip()}
 return result

def main():
 if len(sys.argv)!=6:raise ValueError('WHOLE READER NEW_OUTPUT_DIR MESH_CONFIG PLANAR_CONFIG')
 whole,reader,out,mesh,planar=map(Path,sys.argv[1:]);out.mkdir(mode=0o700,parents=False,exist_ok=False)
 commit=git('rev-parse','HEAD').decode().strip()
 before=capture(commit)
 inputs=capture_inputs(whole,(reader,mesh,planar))
 record={'version':1,'role':'complete-post-whole-artifact-oracle','status':'RUNNING','verifierCommit':commit,'sourcesBefore':before,'sourcesAfter':None,'inputSHA256Before':inputs,'inputSHA256After':None,'exitCode':None}
 manifest=out/'custody.json';manifest.write_text(json.dumps(record,indent=2)+'\n')
 env={**os.environ,'CODI_ORACLE_CORE_GIT':str(ROOT),'PYTHONDONTWRITEBYTECODE':'1'}
 command=[sys.executable,str(ROOT/'test/selected-profile-extents-workflow/check.py'),str(whole),str(reader),str(out/'oracle.json'),str(mesh),str(planar)]
 with (out/'stdout.log').open('wb') as stdout,(out/'stderr.log').open('wb') as stderr:
  child=subprocess.run(command,stdout=stdout,stderr=stderr,env=env)
 record['exitCode']=child.returncode
 try:
  after=capture(commit);afterinputs=capture_inputs(whole,(reader,mesh,planar))
  record.update(sourcesAfter=after,inputSHA256After=afterinputs)
  result=json.loads((out/'oracle.json').read_text())
  record['status']='PASS' if child.returncode==0 and result.get('status')=='PASS' and before==after and inputs==afterinputs else 'FAIL'
 except Exception as error:record.update(status='FAIL',custodyError=str(error))
 for name in ('oracle.json','stdout.log','stderr.log'):
  path=out/name
  if path.is_file():record.setdefault('outputs',{})[name]={'bytes':path.stat().st_size,'sha256':sha(path.read_bytes())}
 manifest.write_text(json.dumps(record,indent=2)+'\n')
 print(json.dumps({'status':record['status'],'exitCode':child.returncode,'custody':str(manifest)}))
 return 0 if record['status']=='PASS' else 1

if __name__=='__main__':sys.exit(main())
