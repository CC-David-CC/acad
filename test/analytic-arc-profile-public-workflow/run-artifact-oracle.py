#!/usr/bin/env python3
"""One explicitly pinned offline AFTER-whole invocation, preserving FIRST.
No browser/Native application calls. CGAL children are readonly derived tools.
"""
import hashlib,json,os,stat,subprocess,sys
from pathlib import Path
sha=lambda x:hashlib.sha256(x).hexdigest()
def need(ok,message):
 if not ok:raise ValueError(message)
def capture_inputs(whole,configuration):
 root=Path(whole);need(root.is_dir()and not root.is_symlink(),'real immutable whole root');rows={};total=0
 for p in sorted(root.rglob('*')):
  info=p.lstat();need(not stat.S_ISLNK(info.st_mode),'no linked whole input')
  if stat.S_ISDIR(info.st_mode):continue
  need(stat.S_ISREG(info.st_mode)and info.st_size<=134217728,'bounded regular original input');need(len(rows)<10000,'whole inventory count');total+=info.st_size;need(total<=1073741824,'whole input1GiB cap');h=hashlib.sha256()
  with p.open('rb')as stream:
   for block in iter(lambda:stream.read(1048576),b''):h.update(block)
  rows[str(p.relative_to(root))]={'bytes':info.st_size,'sha256':h.hexdigest()}
 config=Path(configuration);raw=config.read_bytes();need(len(raw)<=65536,'bounded reviewed config');parsed=json.loads(raw);external={str(config.resolve()):{'sha256':sha(raw),'bytes':len(raw)}}
 for kind in('global','planar'):
  for key in('executable','cpp_source'):
   p=Path(parsed[kind][key]);info=p.lstat();need(p.is_absolute()and stat.S_ISREG(info.st_mode)and info.st_size<=134217728,'reviewed regular derived executable/source');external[str(p)]={'bytes':info.st_size,'sha256':sha(p.read_bytes())}
 return{'whole':rows,'external':external}
def main(whole,configuration,directory,commit):
 whole=Path(whole).resolve();configuration=Path(configuration).resolve();out=Path(directory).resolve();need(not out.exists()and whole not in out.parents and out!=whole,'NEW output outside immutable original whole');out.mkdir(parents=False);r=json.loads((whole/'receipt.json').read_text());need(r['status']=='PASS'and r['ownedContextsRetired']and not r.get('pendingWrite'),'whole terminal PASS/owned retirement, no unknown write');need(len(commit)==40 and all(c in'0123456789abcdef'for c in commit),'explicit verifier Git commit');here=Path(__file__).resolve().parent;repo=here.parents[1];sources=[here/n for n in('run-artifact-oracle.py','check.py','truth.py','mesh_oracle.py','step_oracle.py','negative_archive.py','producer-roster.json')]+[repo/'test/native-cad-container/archive_oracle.py',repo/'test/library-validation/planar_coverage.py',repo/'test/library-validation/cylindrical_surface_certificate.py',repo/'test/analytic-preparation-refusals/check_refusals.py'];source_rows=[]
 for p in sources:
  relative=str(p.relative_to(repo));raw=p.read_bytes();g=subprocess.run(['git','-C',str(repo),'show',commit+':'+relative],capture_output=True,check=True);need(raw==g.stdout,'actual verifier equals frozen Git object '+relative);oid=subprocess.run(['git','-C',str(repo),'rev-parse',commit+':'+relative],capture_output=True,text=True,check=True);source_rows.append({'path':str(p),'relative':relative,'commit':commit,'gitBlobOID':oid.stdout.strip(),'sha256':sha(raw)})
 before=capture_inputs(whole,configuration);custody={'verifierSource':source_rows,'before':before,'wholeReceiptSha256':before['whole']['receipt.json']['sha256'],'scope':'AFTER terminal whole only; no rewriting inputs/FIRST; virtual/CPU/wall limits are derived tool limits, not production model quotas'};(out/'custody-before.json').write_text(json.dumps(custody,indent=2)+'\n');code=None
 try:
  with(out/'oracle.stdout.log').open('wb')as stdout,(out/'oracle.stderr.log').open('wb')as stderr:code=subprocess.run([sys.executable,str(here/'check.py'),str(whole),str(configuration),str(out/'FIRST-ORACLE.json')],stdout=stdout,stderr=stderr).returncode
 finally:
  after=capture_inputs(whole,configuration);source_after={s['relative']:sha(Path(s['path']).read_bytes())for s in source_rows};custody.update(after=after,sourceAfter=source_after,returnCode=code,inputsUnchanged=after==before,verifierUnchanged=all(source_after[s['relative']]==s['sha256']for s in source_rows));(out/'custody.json').write_text(json.dumps(custody,indent=2)+'\n')
 need(custody['inputsUnchanged']and custody['verifierUnchanged'],'complete original whole/source/config/executable custody');need(code==0,'FIRST independent oracle refused/failed; retain outputs and do not retry');result=json.loads((out/'FIRST-ORACLE.json').read_text());need(result['status']=='PASS','actual complete independent oracle PASS');return{'status':'PASS','wholeReceiptSha256':custody['wholeReceiptSha256'],'firstOracleSha256':sha((out/'FIRST-ORACLE.json').read_bytes()),'custody':str(out/'custody.json')}
if __name__=='__main__':
 need(len(sys.argv)==5,'WHOLE REVIEWED_VALIDATOR_CONFIG NEW_AFTER_DIRECTORY VERIFIER_COMMIT');print(json.dumps(main(*sys.argv[1:])))
