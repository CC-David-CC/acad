"""Independent set-relation test oracle over recorded v2 native observations.
All IDs below are arithmetic fixture-local labels over source catalog members,
NOT authored persistent IDs, recovered public bindings or geometry matches.
"""
import json,hashlib
from pathlib import Path
from collections import defaultdict,Counter
root=Path(__file__).parent
out=[]
for r in map(json.loads,(root/'matrix-r3/observations.jsonl').read_text().splitlines()):
    if not r.get('result'):continue
    groups={};owners=defaultdict(set)
    for side in ['A','B']:
        prefix='shared' if r['case'].startswith('same-handle-') else side
        a=r['result']['ancestry'+side]['data']
        for plural,singular in [('vertices','vertex'),('edges','edge'),('faces','face')]:
            for row in a[plural]:
                label=f"fixture:{r['case']}:{prefix}:{singular}:{row['source']}"
                key=(singular,label)
                if key not in groups:groups[key]={'candidates':set(),'deleted':[]}
                g=groups[key];g['candidates'].update(row['same'][plural]);g['candidates'].update(row['modified'][plural]);g['deleted'].append({'input':0 if side=='A' else 1,'reportedDeleted':row['reportedDeleted']})
    for (kind,label),g in groups.items():
        for target in g['candidates']:owners[kind,target].add(label)
    resolved=[];unresolved=[]
    for (kind,label),g in sorted(groups.items()):
        candidates=g['candidates'];merged=any(len(owners[kind,t])>1 for t in candidates)
        if len(candidates)==1 and not merged:resolved.append({'kind':kind,'id':label,'index':next(iter(candidates))})
        else:unresolved.append({'kind':kind,'id':label,'reason':'MERGED_DESCENDANT' if merged else 'MULTIPLE_DESCENDANTS' if candidates else 'NO_DESCENDANT','candidateCount':len(candidates),'reportedDeleted':g['deleted']})
    out.append({'case':r['case'],'resolved':resolved,'unresolved':unresolved})
(root/'oracle.json').write_text(json.dumps({'scope':'independent Python native-relation oracle; all IDs arithmetic fixture-local only','rows':out},indent=2)+'\n')
