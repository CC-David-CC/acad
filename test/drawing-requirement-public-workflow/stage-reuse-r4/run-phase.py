import sys,subprocess,time,json,hashlib,os
from pathlib import Path
phase,*cmd=sys.argv[1:]
p=Path(__file__).parent
s=p/(phase+'-state.json'); log=p/(phase+'.log')
assert not s.exists() and not log.exists()
v={'phase':phase,'command':cmd,'source':'82866bf0ee852f1d3b3892972f07d8af4cd8b9b0','desktop':'796c9051331054746d81ea4ea0bb8ec8e8cf2bbd','acceptance':'615716f87f74efc34ed6cd41660db07aa377f4a1','status':'RUNNING','startedAtUnix':time.time()}
def save():s.write_text(json.dumps(v,indent=2)+'\n')
with log.open('xb') as f:
 proc=subprocess.Popen(cmd,stdout=f,stderr=subprocess.STDOUT);v['pid']=proc.pid;save();rc=proc.wait()
v.update(status='PASS' if rc==0 else 'FAIL',exitCode=rc,finishedAtUnix=time.time(),logSHA256=hashlib.sha256(log.read_bytes()).hexdigest());save();print(json.dumps(v));sys.exit(rc)
