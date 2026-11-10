#!/usr/bin/env python3
"""ONE separately pinned AFTER-whole reader with full original input custody."""
import hashlib,json,stat,subprocess,sys
from pathlib import Path
sys.dont_write_bytecode=True
sha=lambda b:hashlib.sha256(b).hexdigest()
def need(v,m):
 if not v:raise ValueError(m)
def inventory(root):
 result={};total=0;root=Path(root);need(root.is_dir()and not root.is_symlink(),'real original whole directory')
 for p in sorted(root.rglob('*')):
  s=p.lstat();need(not stat.S_ISLNK(s.st_mode),'no whole symlink');
  if stat.S_ISDIR(s.st_mode):continue
  need(stat.S_ISREG(s.st_mode)and s.st_size<=134217728 and len(result)<10000,'bounded regular original input');total+=s.st_size;need(total<=1073741824,'complete whole1GiB bound');h=hashlib.sha256()
  with p.open('rb')as f:
   for chunk in iter(lambda:f.read(1048576),b''):h.update(chunk)
  after=p.stat();need((s.st_dev,s.st_ino,s.st_size,s.st_mtime_ns)==(after.st_dev,after.st_ino,after.st_size,after.st_mtime_ns),'original file unchanged during read');result[str(p.relative_to(root))]={'bytes':s.st_size,'sha256':h.hexdigest()}
 return result
def main(whole,output,commit):
 whole=Path(whole).resolve();out=Path(output).resolve();need(not out.exists()and out!=whole and whole not in out.parents,'NEW output outside immutable original whole');r=json.loads((whole/'receipt.json').read_text());need(r['status']=='PASS'and r['ownedContextsRetired']and not r.get('pendingWrite')and not r.get('pendingOpen')and not r.get('pendingMutation')and not r.get('retainedOutcome'),'complete terminal whole/known settlement before independent reader');need(len(commit)==40 and all(c in'0123456789abcdef'for c in commit),'full explicit verifier Git commit')
 here=Path(__file__).resolve().parent;repo=here.parents[1];sources=[here/n for n in('run-artifact-oracle.py','check.py','producer-roster.json')]+[repo/'test/native-cad-container/archive_oracle.py'];rows=[]
 for p in sources:
  relative=p.relative_to(repo).as_posix();raw=p.read_bytes();g=subprocess.run(['git','-C',str(repo),'show',commit+':'+relative],capture_output=True,check=True);oid=subprocess.run(['git','-C',str(repo),'rev-parse',commit+':'+relative],capture_output=True,text=True,check=True);need(raw==g.stdout,'verifier equals frozen Git blob '+relative);rows.append({'path':str(p),'relative':relative,'commit':commit,'gitBlobOID':oid.stdout.strip(),'bytes':len(raw),'sha256':sha(raw)})
 out.mkdir(parents=False);before=inventory(whole);custody={'scope':'AFTER complete public whole only; independent archive/source/original-equation/actual Native observations, no app/Native execution','verifierSources':rows,'wholeReceiptSha256':before['receipt.json']['sha256'],'before':before};(out/'custody-before.json').write_text(json.dumps(custody,indent=2)+'\n');code=None
 try:
  with(out/'oracle.stdout.log').open('xb')as stdout,(out/'oracle.stderr.log').open('xb')as stderr:code=subprocess.run([sys.executable,str(here/'check.py'),str(whole),str(out/'FIRST-ORACLE.json')],stdout=stdout,stderr=stderr).returncode
 finally:
  after=inventory(whole);sourceAfter={s['relative']:sha(Path(s['path']).read_bytes())for s in rows};custody.update(after=after,sourceAfter=sourceAfter,returnCode=code,inputsUnchanged=before==after,verifierUnchanged=all(sourceAfter[s['relative']]==s['sha256']for s in rows));(out/'custody.json').write_text(json.dumps(custody,indent=2)+'\n')
 need(custody['inputsUnchanged']and custody['verifierUnchanged'],'original full whole and verifier custody');need(code==0,'FIRST reader failed/refused; retain outputs, no retry');value=json.loads((out/'FIRST-ORACLE.json').read_text());need(value['status']=='PASS','actual complete independent result PASS');return {'status':'PASS','wholeReceiptSha256':custody['wholeReceiptSha256'],'firstOracleSha256':sha((out/'FIRST-ORACLE.json').read_bytes()),'custody':str(out/'custody.json')}
if __name__=='__main__':
 need(len(sys.argv)==4,'WHOLE NEW_AFTER_DIRECTORY VERIFIER_COMMIT');print(json.dumps(main(*sys.argv[1:])))
