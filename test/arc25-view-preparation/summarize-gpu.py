"""Extract native caller evidence without attributing all GPU work to one model."""
import hashlib,json,sys
from pathlib import Path
trace_path,receipt_path,out_path=map(Path,sys.argv[1:]);events=json.loads(trace_path.read_text())['traceEvents'];receipt=json.loads(receipt_path.read_text())
a=next(e for e in events if e.get('name')=='arc25-restore-start');b=next(e for e in events if e.get('name')=='arc25-restore-end')
threads={(e.get('pid'),e.get('tid')):e.get('args',{}).get('name') for e in events if e.get('name')=='thread_name'};processes={e.get('pid'):e.get('args',{}).get('name') for e in events if e.get('name')=='process_name'}
selected=[e for e in events if e.get('ph')=='X' and e.get('ts',0)<=b['ts']+200000 and e.get('ts',0)+e.get('dur',0)>=a['ts']]
long=[]
for e in sorted(selected,key=lambda x:x.get('dur',0),reverse=True)[:35]:long.append({'process':processes.get(e['pid']),'thread':threads.get((e['pid'],e['tid'])),'ownRendererThread':e['pid']==a['pid'] and e['tid']==a['tid'],'name':e['name'],'startFromRestoreMs':(e['ts']-a['ts'])/1000,'durationMs':e.get('dur',0)/1000,'args':e.get('args')})
env=receipt['environment'];aux=env['gpuAuxAttributes'];result={'scope':'One instrumented shared HeadlessChrome software-GPU run. Nested durations overlap, some spans extend into post-restore observation. Shared GPU work/contention is not isolated; no hardware-GPU/product-wide latency claim.','traceSha256':hashlib.sha256(trace_path.read_bytes()).hexdigest(),'receiptSha256':hashlib.sha256(receipt_path.read_bytes()).hexdigest(),'rendererPid':a['pid'],'rendererTid':a['tid'],'environment':{'browser':env['browserVersion'],'graphicsFlags':env['graphicsFlags'],'implementation':aux.get('glImplementationParts'),'glRenderer':aux.get('glRenderer'),'glVendor':aux.get('glVendor')},'longNativeEvents':long}
out_path.write_text(json.dumps(result,indent=2)+'\n')
