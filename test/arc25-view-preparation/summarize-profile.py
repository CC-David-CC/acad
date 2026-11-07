"""Compact inclusive trace summary; event durations overlap and are not additive."""
import collections,hashlib,json,sys
from pathlib import Path
trace_path,out_path=map(Path,sys.argv[1:]);events=json.loads(trace_path.read_text())['traceEvents']
start=next(e for e in events if e.get('name')=='arc25-restore-start');end=next(e for e in events if e.get('name')=='arc25-restore-end')
selected=[e for e in events if e.get('pid')==start['pid'] and e.get('tid')==start['tid'] and e.get('ph')=='X' and start['ts']<=e['ts']<=end['ts']+200000]
groups=collections.defaultdict(lambda:{'count':0,'inclusiveMs':0,'maxMs':0})
for e in selected:
 d=e.get('dur',0)/1000;g=groups[e['name']];g['count']+=1;g['inclusiveMs']+=d;g['maxMs']=max(g['maxMs'],d)
long=[{'name':e['name'],'ms':e.get('dur',0)/1000,'args':e.get('args')} for e in sorted(selected,key=lambda e:e.get('dur',0),reverse=True)[:6]]
result={'scope':'Actual app d177, registered native PLANE envelope, same-renderer second actual CAD; inclusive trace durations overlap and tracing adds overhead. Not an exact CPU-share or latency guarantee.','traceSha256':hashlib.sha256(trace_path.read_bytes()).hexdigest(),'pid':start['pid'],'tid':start['tid'],'restoreSpanMs':(end['ts']-start['ts'])/1000,'groups':dict(sorted(groups.items(),key=lambda pair:pair[1]['inclusiveMs'],reverse=True)[:20]),'longEvents':long}
out_path.write_text(json.dumps(result,indent=2)+'\n')
