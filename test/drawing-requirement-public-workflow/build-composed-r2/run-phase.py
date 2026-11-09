import sys,subprocess,time,json,hashlib,os
from pathlib import Path
phase,*cmd=sys.argv[1:]
p=Path(__file__).parent
s=p/(phase+'-state.json'); log=p/(phase+'.log')
assert not s.exists() and not log.exists()
v={'phase':phase,'command':cmd,'source':'82f9f01b7a6fbc5e2bfc25183a72da87a8e31e97','desktop':'33fc809e3900b3a00b26859b69c5f63dcbbdffb6','status':'RUNNING','startedAtUnix':time.time()}
def save():s.write_text(json.dumps(v,indent=2)+'\n')
with log.open('xb') as f:
 proc=subprocess.Popen(cmd,stdout=f,stderr=subprocess.STDOUT);v['pid']=proc.pid;save();rc=proc.wait()
v.update(status='PASS' if rc==0 else 'FAIL',exitCode=rc,finishedAtUnix=time.time(),logSHA256=hashlib.sha256(log.read_bytes()).hexdigest());save();print(json.dumps(v));sys.exit(rc)
