#!/usr/bin/env python3
"""ONCE after whole execution: independent original-source/Fraction/ZIP math.
No production planner/validator/solver/Native/browser invocation.
"""
import collections,hashlib,importlib.util,json,math,sys
from fractions import Fraction as F
from pathlib import Path
spec=importlib.util.spec_from_file_location('independent_archive',Path(__file__).resolve().parents[1]/'native-cad-container/archive_oracle.py');archive=importlib.util.module_from_spec(spec);spec.loader.exec_module(archive)
def need(ok,text):
    if not ok:raise ValueError(text)
def one(rows,text):need(len(rows)==1,text);return rows[0]
def canon(v):return json.dumps(v,sort_keys=True,ensure_ascii=False,separators=(',',':'))
def sha(v):return hashlib.sha256(v).hexdigest()
def near(a,b,t=1e-6):need(isinstance(a,(int,float)) and math.isfinite(a) and abs(a-b)<=t,'Native metric differs from independent source arithmetic')
def point(v):return (F(v['x']),F(v['y']))
def edge(a,b):return tuple(sorted((a,b)))
def on(p,c):
    a,b=c
    return (a[0]==b[0]==p[0] and min(a[1],b[1])<=p[1]<=max(a[1],b[1])) or (a[1]==b[1]==p[1] and min(a[0],b[0])<=p[0]<=max(a[0],b[0]))
def source(raw):
    s=json.loads(raw);need(s['version']==3 and len(s['stages'])==1 and not s['stages'][0]['generators'],'ordinary actual source stage')
    objects={o['id']:o for o in s['objects']};need(len(objects)==len(s['objects']),'unique actual source IDs');return s,objects
def segments(objects,ids):
    result={}
    for identity in ids:
        o=objects[identity];need(o['type']=='Segment' and o['role'] is None and o['stage']==0,'actual ordinary Segment identity');result[identity]=(point(o['data']['a']),point(o['data']['b']));need(result[identity][0]!=result[identity][1],'nonzero source Segment')
    return result
def box(curves):
    points=[p for c in curves.values() for p in c];return tuple(min(p[i] for p in points) for i in range(2)),tuple(max(p[i] for p in points) for i in range(2))
def sides(bounds):
    lo,hi=bounds;p=[lo,(hi[0],lo[1]),hi,(lo[0],hi[1])];return [edge(p[i],p[(i+1)%4]) for i in range(4)]
def source_graph(curves):
    events={p for c in curves.values() for p in c}
    for a in curves.values():
        for b in curves.values():
            av=a[0][0]==a[1][0];bv=b[0][0]==b[1][0]
            if av!=bv:
                v,h=(a,b) if av else (b,a);p=(v[0][0],h[0][1])
                if on(p,a) and on(p,b):events.add(p)
    spans={};intervals={}
    for identity,c in curves.items():
        ps=sorted(p for p in events if on(p,c));need(len(ps)>=2 and ps[0]==min(c) and ps[-1]==max(c),'complete original interval endpoints');intervals[identity]=[]
        for a,b in zip(ps,ps[1:]):key=edge(a,b);spans.setdefault(key,[]).append(identity);intervals[identity].append(key)
    incidence={p:sorted(identity for identity,c in curves.items() if on(p,c)) for p in events};need(len({tuple(v) for v in incidence.values()})==len(events),'unique actual incidence witness');return events,spans,intervals,incidence
def contact_source(case,raw):
    s,objects=source(raw);need(set(objects)==set(case['A']+case['B']+[case['pointId']]),'entire source retained, no skipped boundary');need(objects[case['pointId']]==case['point'],'unrelated Point exact')
    for o in case['initialA']:need(objects[o['id']]==o,'unrelated A Segment exact')
    curves=segments(objects,case['A']+case['B']);A=box({i:curves[i] for i in case['A']});B=box({i:curves[i] for i in case['B']});need(A==((0,0),(10,10)),'actual A unchanged')
    ylo,yhi=(2,8) if case['id']=='partial' else (0,10);need(B[0]==(10,ylo) and B[1][1]==yhi and B[1][0] in (20,22,24),'actual finite B source edits')
    need(collections.Counter(edge(*v) for v in curves.values())==collections.Counter(sides(A)+sides(B)),'whole-source geometric side multiplicity, not arbitrary grouping')
    events,spans,intervals,incidence=source_graph(curves);need((len(events),len(spans))==((8,9) if case['id']=='partial' else (6,7)),'exact source events/spans, no slivers')
    need(len([v for v in spans.values() if len(v)==2])==1 and all(1<=len(v)<=2 for v in spans.values()),'one genuine dual-owner shared span');return {'source':s,'objects':objects,'curves':curves,'A':A,'B':B,'events':events,'spans':spans,'intervals':intervals,'incidence':incidence}
def check_discovery(case,row):
    t=contact_source(case,row['source']);d=row['result'];a=d['sourceAnalysis'];ids=sorted(t['curves']);need(a['version']==3 and a['policy']=='v3-extrusion-axis-rectangle-contact-v1' and a['sourceCurveIds']==ids,'exact contact census tag/source')
    refs={};keys={}
    for ref in a['spans']:
        span=ref['sourceSpan'];need(span['kind']=='source-span' and ref['id']=='source-span:1:'+sha(('ACAD/source-span/1\n'+canon(span)).encode()),'independent exact span identity')
        ends=[one([p for p,owners in t['incidence'].items() if owners==e['incidentCurveIds']],'actual source incidence event') for e in span['ends']];k=edge(*ends);need(k in t['spans'] and sorted(t['spans'][k])==span['owners'],'all actual source span owners');need(k not in keys and ref['id'] not in refs,'unique atomic span');keys[k]=ref['id'];refs[ref['id']]=ref
    need(set(keys)==set(t['spans']),'all geometric atomic spans retained')
    need([x['curveId'] for x in a['sourceIntervals']]==ids,'canonical whole-source interval inventory')
    for x in a['sourceIntervals']:need(x['spanIds']==[keys[k] for k in t['intervals'][x['curveId']]],'independent ascending geometric interval order, traversal-independent')
    need(len(d['regions'])==2 and a['cells']==sorted(x['regionId'] for x in d['regions']),'two actual selectable cells');seen=[];uses=collections.Counter()
    for row in d['regions']:
        c=row['descriptor'];need(row['support']=='supported' and row['reason'] is None and set(c)=={'version','kind','sourceCurveIds','outerBoundaryRefs','holeBoundaryRefs'},'exact supported tagged cell')
        need(c['version']==3 and c['kind']=='axis-rectangle-contact-cell' and c['sourceCurveIds']==ids and c['holeBoundaryRefs']==[],'contact identity retains all source, no false loop assignment')
        need(row['regionId']=='sketch-region:'+canon({'version':3,'faceId':case['faceId'],'cell':c}),'independent semantic identity reconstruction, not ID parsing')
        pieces=[]
        for ref in c['outerBoundaryRefs']:
            need(refs.get(ref['id'])==ref,'cell refs equal actual census');k=one([k for k,v in keys.items() if v==ref['id']],'actual span key');pieces.append(k);uses[ref['id']]+=1
        points=[p for k in pieces for p in k];bounds=(tuple(min(p[i] for p in points) for i in range(2)),tuple(max(p[i] for p in points) for i in range(2)));need(bounds in (t['A'],t['B']) and bounds not in seen,'two distinct specified rectangular cell supports');seen.append(bounds)
        degree=collections.Counter(p for k in pieces for p in k);need(all(n==2 for n in degree.values()),'closed selected-cell endpoint degree')
        for side in sides(bounds):
            intervals=sorted(k for k in pieces if on(k[0],side) and on(k[1],side));need(intervals and intervals[0][0]==side[0] and intervals[-1][1]==side[1] and all(x[1]==y[0] for x,y in zip(intervals,intervals[1:])),'exact selected rectangle side coverage without gaps/overlaps')
        need(all(any(on(k[0],side) and on(k[1],side) for side in sides(bounds)) for k in pieces),'no interior chord masquerades as boundary')
    need(all(uses[identity]==len(ref['sourceSpan']['owners']) for identity,ref in refs.items()),'every real owner reflected in selected-cell boundaries');return {'case':case['id'],'events':len(t['events']),'spans':len(t['spans']),'areas':[float((b[1][0]-b[0][0])*(b[1][1]-b[0][1])) for b in seen]}
def triangle(case,raw,invalid=False):
    s,objects=source(raw);need(set(objects)==set(case['triangle']+[case['pointId']]) and objects[case['pointId']]==case['point'],'triangle source complete and unrelated Point exact');cs=segments(objects,case['triangle']);ps=set(p for v in cs.values() for p in v);need(len(ps)==3,'three actual triangle vertices');middle=one([p for p in ps if p[0]==40],'actual apex');need(ps=={(F(30),F(0)),(F(50),F(0)),middle},'only declared apex coordinate changes');h=middle[1];need(h in ((0,) if invalid else (5,6)),'exact zero/explicit repair height');return s,h,cs
def metric_truth(case,target,sketches):
    if target['label']=='control':
        need(sketches[case['controlFaceId']]==case['controlSource'],'unrelated control source exact');return {'min':[100,0,20],'max':[110,5,20+target['depth']],'volume':50*target['depth'],'polygon':[(100,0),(110,0),(110,5),(100,5)]}
    if case['id']=='zero':
        s,h,curves=triangle(case,sketches[case['faceId']]);return {'min':[30,0,0],'max':[50,float(h),target['depth']],'volume':float(10*h*target['depth']),'polygon':[(30,0),(40,h),(50,0)]}
    t=contact_source(case,sketches[case['faceId']]);need(sketches[case['foreign']['faceId']]==case['foreign']['source'],'unrelated foreign source exact');lo,hi=t[target['label']];return {'min':[float(lo[0]),float(lo[1]),0],'max':[float(hi[0]),float(hi[1]),target['depth']],'volume':float((hi[0]-lo[0])*(hi[1]-lo[1])*target['depth']),'polygon':[lo,(hi[0],lo[1]),hi,(lo[0],hi[1])]}
def classify(truth,p):
    x,y,z=map(F,p);lo,hi=truth['min'],truth['max'];poly=truth['polygon'];cross=[];boundary=False
    for a,b in zip(poly,poly[1:]+poly[:1]):
        a=tuple(map(F,a));b=tuple(map(F,b));v=(b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]);cross.append(v)
        if v==0 and min(a[0],b[0])<=x<=max(a[0],b[0]) and min(a[1],b[1])<=y<=max(a[1],b[1]):boundary=True
    inside=all(v>=0 for v in cross) or all(v<=0 for v in cross)
    if not inside or z<F(lo[2]) or z>F(hi[2]):return 'outside'
    return 'boundary' if boundary or z in (F(lo[2]),F(hi[2])) else 'inside'
def check_state(case,row,build):
    before=row['before'];need(before==row['after'],'Native observations are exact read-only');n=before['capture']['native'];sketches={x['id']:x['source'] for x in n['sketches']};need(len(before['capture']['solids']['bodies'])==len(row['targets'])==len(row['facts']),'actual output/Native read census')
    for fact in row['facts']:
        t=fact['target'];body=one([b for b in before['capture']['solids']['bodies'] if b['id']==t['outputId']],'actual owned Native output');need(body['featureId']==t['featureId'],'actual producer identity');m=body['metrics'];need(m['nativeValidity']['valid'] and m['solidCount']==1 and m['resultKind']=='single-solid' and 'sha256:'+m['runtime']['jsSha256']+':'+m['runtime']['wasmSha256']==build,'genuine positive exact Native cohort')
        intent=one([f for f in n['history'] if f['type']=='WORKER_SELECTED_PROFILE_EXTRUDE_V2' and f['params']['featureId']==t['featureId']],'actual authored feature intent')['params'];need(intent['faceId']==t['faceId'] and intent['regionId']==t['regionId'] and intent['depth']==t['depth'] and intent['engine']=='occ' and intent['engineRevision']==build and intent['bodyPolicy']=='separate' and intent['unit']=='millimeter','strict numeric authored replay intent')
        truth=metric_truth(case,t,sketches);near(m['nativeVolume'],truth['volume'])
        for k in ('min','max'):
            for a,b in zip(m['nativeBounds'][k],truth[k]):near(a,b)
        q=fact['result'];need(q['quality']=='native-re-evaluation-observation' and q['bodyId']==t['outputId'] and q['featureId']==t['featureId'] and q['engineRevision']==build and q['revision']==before['capture']['solids']['revision'],'actual current source-bound Native read');need(len(q['points'])==3 and [x['point'] for x in q['points']]==fact['input']['points'],'actual three independent probes')
        need([x['classification'] for x in q['points']]==[classify(truth,x['point']) for x in q['points']]==['inside','outside','boundary'],'original polygon/prism equations at actual Native points')
    resources=before['ownership']['resources'];need(not before['ownership']['processing'] and not resources['cleanupFailed'] and resources['accepted']==resources['candidates']==resources['mounts']==0 and resources['owners']==resources['detached'],'settled resource custody')
def main(folder):
    folder=Path(folder);r=json.loads((folder/'receipt.json').read_text());need(r['status']=='PASS' and r['ownedContextsClosed'] and r['sharedBrowserDisconnectedOnly'] and r['sourcePins']==r['sourcePinsAfter'] and not r['sourceSeeds'] and not r['syntheticGeometry'],'whole workflow/source/cleanup genuine')
    cases={c['id']:c for c in r['cases']};need(list(cases)==['partial','full','zero'] and all(c['status']=='PASS' for c in cases.values()),'three complete actual setups')
    graphs=[check_discovery(cases[x['case']],x) for x in r['discoveries'] if x['case']!='zero' and x['faceId']==cases[x['case']]['faceId']];need({x['case'] for x in graphs}=={'partial','full'},'both genuine contact discoveries')
    for row in r['observations']:check_state(cases[row['case']],row,r['build'])
    need(len(r['refusals'])==8,'finite stale/foreign/lost/zero-area refusal roster')
    for row in r['refusals']:
        before,after=row['before'],row['after'];need(row['error']['code']==row['expected'] and not row['error']['committed'] and not row['error']['possiblyCommitted'],'precise no-commit refusal')
        if not row['candidate']:need(before==after,'pre-candidate refusal exact state including tokens')
        else:
            need(after['epoch']==before['epoch']+1 and before['capture']['journal']['revision'].endswith(':'+before['host']['revision']),'owned candidate epoch and journal document binding')
            prefix=before['capture']['journal']['revision'][:-len(before['host']['revision'])];need(after['capture']['journal']['revision']==prefix+after['host']['revision'] and after['host']['revision']!=before['host']['revision'] and after['capture']['solids']['revision']!=before['capture']['solids']['revision'],'only exact linked candidate token invalidation')
            a=json.loads(json.dumps(after));b=json.loads(json.dumps(before))
            for x in (a,b):del x['epoch'];del x['capture']['solids']['revision'];del x['capture']['journal']['revision'];del x['host']['revision']
            need(a==b,'all other accepted source/intent/body/J/high-water/resources exact')
        if row['case']=='zero':triangle(cases['zero'],before['capture']['native']['source'],True)
    need(len(r['saves'])==6,'six actual current .cad artifacts');checked=[]
    for row in r['saves']:
        info=archive.read_archive(folder/row['savedFile']);need(info['bytes']==row['bytes'] and info['sha256']==row['sha256'] and row['result']['committed'] and row['result']['nativeArchive']['format']=='codi-cad-project','normal browser/server-verified .cad bytes')
        n=row['before']['capture']['native'];p=info['envelope']['project'];need(p['model']['history']==n['history'] and p['model']['counters']==n['counters'] and info['rawSketches']=={x['id']:x['source'] for x in n['sketches']},'exact persisted editable intent/source/high-water')
        for target in row['targets']:metric_truth(cases[row['case']],target,info['rawSketches'])
        checked.append({'case':row['case'],'file':row['savedFile'],'sha256':info['sha256'],'bytes':info['bytes']})
    need(collections.Counter(x['case'] for x in checked)=={'partial':2,'full':2,'zero':2},'complete edit/reedit files for each real setup')
    print(json.dumps({'status':'PASS','scope':'Independent finite contact source/span/cell ownership and genuine Native/.cad arithmetic; no joined-manifold/near-Circle/fullGate claim','graphs':graphs,'nativeObservationSets':len(r['observations']),'refusals':len(r['refusals']),'archives':checked,'budgets':{'authoredCoordinateMm':5e-8,'nativeVolumeMm3':1e-6,'nativeBoundsMm':1e-6}},indent=2))
if __name__=='__main__':main(sys.argv[1])
