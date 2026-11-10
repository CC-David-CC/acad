"""Independent AFTER-WHOLE dyadic source/incidence/cell/Native/.cad checks.
No production geometry/validator import and no standalone per-step runner.
"""
import hashlib, json, math, sys
from fractions import Fraction as F
from pathlib import Path
sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'native-cad-container'))
from archive_oracle import read_archive

PHYSICAL = 5e-8
NATIVE = 1e-6
SAVE_LABELS = ['per-cell-tiny-represented', 'per-cell-native-eligible', 'per-cell-native-reedited']
OBS_LABELS = [
 'Per-cell initial tiny source', 'Per-cell outer Native cells', 'Per-cell epsilon1e-8',
 'Per-cell restored epsilon1e-6', 'Per-cell redone epsilon1e-8', 'Per-cell positive adjacent cell',
 SAVE_LABELS[0]+' before Save', SAVE_LABELS[0]+' fresh Open',
 'Per-cell newly eligible source', 'Per-cell actual middle Native creation',
 'Per-cell middle absent after creation Undo', 'Per-cell middle present after creation Redo',
 SAVE_LABELS[1]+' before Save', SAVE_LABELS[1]+' fresh Open',
 'Per-cell reedited eligible source', 'Per-cell reopened source undone', 'Per-cell reopened source redone',
 SAVE_LABELS[2]+' before Save', SAVE_LABELS[2]+' fresh Open']
TRAVEL_LABELS = ['Per-cell epsilon1e-8 Undo','Per-cell epsilon1e-8 Redo','Per-cell middle creation Undo','Per-cell middle creation Redo','Per-cell reopened source Undo','Per-cell reopened source Redo']
def need(ok, text):
    if not ok: raise ValueError(text)
def canonical(v):
    return json.dumps(v, sort_keys=True, ensure_ascii=False, separators=(',', ':'))
def finite(v):
    need(type(v) in (int,float) and math.isfinite(v), 'finite actual number')
    return F(v)
def near(a,b,budget):
    need(type(a) in (int,float) and math.isfinite(a) and abs(a-b)<=budget, 'physical/Native numeric budget')
def point(v):
    need(set(v)=={'x','y'}, 'exact stored endpoint fields')
    return (finite(v['x']),finite(v['y']))
def on(p,c):
    a,b=c['a'],c['b']
    return ((a[0]==b[0] and p[0]==a[0] and min(a[1],b[1])<=p[1]<=max(a[1],b[1])) or
            (a[1]==b[1] and p[1]==a[1] and min(a[0],b[0])<=p[0]<=max(a[0],b[0])))
def source_truth(row,b,initial):
    raw=json.loads(row['state']['capture']['native']['source'])
    need(len(raw['objects'])==9 and len(raw['stages'])==1 and len(raw['stages'][0]['constraints'])==11 and raw['stages'][0]['generators']==[], 'complete nine-root/eleven-row source')
    need(raw['version']==3 and raw['dimensions']==initial['dimensions'] and raw['labels']==initial['labels'] and [o['id'] for o in raw['objects']]==[o['id'] for o in initial['objects']], 'exact source schema, labels and root order')
    need(raw['stages']==initial['stages'] and raw['boundary']==initial['boundary'] and raw['metadata']==initial['metadata'] and raw['constants']==initial['constants'], 'exact original source intent/admission/frame')
    objects={o['id']:o for o in raw['objects']}
    need(len(objects)==9 and set(objects)==set(b['A']+b['B']+[b['point']['id']]), 'same actual source identities')
    prior={o['id']:o for o in initial['objects']}
    need(all(objects[x]==prior[x] for x in b['A']) and objects[b['point']['id']]==b['point'], 'unrelated locked A and Point exact')
    left=finite(row['left']); need(0<left<10 and finite(row['epsilon'])==10-left, 'positive actual represented overlap')
    curves=[]; positions={}
    for ids,vertices in [(b['A'],None),(b['B'],[(left,F(0)),(F(20),F(0)),(F(20),F(10)),(left,F(10))])]:
        for k,identity in enumerate(ids):
            o=objects[identity];need(o['type']=='Segment' and o['stage']==0 and o['role'] is None, 'actual ordinary Segment')
            need(o==dict(prior[identity],data=o['data']), 'only original B coordinates change')
            a,z=point(o['data']['a']),point(o['data']['b'])
            need((a[0]==z[0]) != (a[1]==z[1]), 'nonzero exactly axis-aligned represented source')
            if vertices is not None:need((a,z)==(vertices[k],vertices[(k+1)%4]), 'original requested represented endpoints, no snap')
            curves.append({'id':identity,'a':a,'b':z});positions[identity+':A']=a;positions[identity+':B']=z
    positions[b['point']['id']]=point(objects[b['point']['id']]['data'])
    cold={p['id']:p for p in row['inspection']['points']}
    need(len(cold)==17 and set(cold)==set(positions), 'actual complete cold endpoint identities')
    for identity,p in positions.items():
        q=cold[identity];need(math.hypot(float(p[0])-q['x'],float(p[1])-q['y'])<=PHYSICAL, 'raw to cold Euclidean budget')
    # Independently check all original rows on both saved and actual cold points.
    def equations(points,exact):
        def xy(identity):return points[identity]
        def endpoints(identity):return xy(identity+':A'),xy(identity+':B')
        for c in raw['stages'][0]['constraints']:
            need(c['stage']==0 and c['admission']=={'version':1,'state':'accepted'}, 'retained genuine accepted source row')
            kind,ids,constants=c['typeId'],c['objects'],c.get('constants',{})
            if kind=='PCoincident':
                a,z=map(xy,ids);res=[a[k]-z[k] for k in range(2)]
            elif kind=='LockPoint':
                a=xy(ids[0]);res=[a[k]-F(constants[axis]) for k,axis in enumerate(['x','y'])]
            elif kind=='SegmentLength':
                a,z=endpoints(ids[0]);res=[math.hypot(float(z[0]-a[0]),float(z[1]-a[1]))-float(constants['length'])]
            elif kind in ('Horizontal','Vertical'):
                a,z=endpoints(ids[0]);angle=float(constants['angle'])*math.pi/180
                residual=math.remainder(math.atan2(float(z[1]-a[1]),float(z[0]-a[0]))-angle,2*math.pi)
                need(abs(residual)<=1e-8, 'actual directed H/V branch')
                res=[z[1]-a[1] if kind=='Horizontal' else z[0]-a[0]]
            else:raise ValueError('unexpected original rectangle row')
            need(all(abs(float(n))<=(0 if exact else PHYSICAL) for n in res), 'original saved/cold equations')
    equations(positions,True);equations({k:(F(v['x']),F(v['y'])) for k,v in cold.items()},False)
    return raw,curves,left

def source_events(curves):
    events={p for c in curves for p in (c['a'],c['b'])}
    for c in curves:
        for d in curves:
            if (c['a'][0]==c['b'][0]) != (d['a'][0]==d['b'][0]):
                vertical=c if c['a'][0]==c['b'][0] else d;horizontal=d if vertical is c else c
                p=(vertical['a'][0],horizontal['a'][1])
                if on(p,c) and on(p,d):events.add(p)
    return {p:sorted(c['id'] for c in curves if on(p,c)) for p in events}
def census(row,b,curves,left):
    ev=source_events(curves);need(len(ev)==8, 'complete eight represented events')
    by_incidence={tuple(ids):p for p,ids in ev.items()};need(len(by_incidence)==8, 'unique event membership')
    intervals={};expected={}
    for c in curves:
        axis=0 if c['a'][0]!=c['b'][0] else 1
        points=sorted((p for p in ev if on(p,c)),key=lambda p:p[axis])
        intervals[c['id']]=[]
        for a,z in zip(points,points[1:]):
            key=tuple(sorted((a,z)));expected.setdefault(key,sorted(d['id'] for d in curves if on(a,d) and on(z,d)));intervals[c['id']].append(key)
    need(len(expected)==10 and sum(len(x)==2 for x in expected.values())==2, 'ten spans retain exactly two dual-owner intervals')
    discovery=row['discovery'];analysis=discovery['sourceAnalysis']
    need(analysis['version']==2 and analysis['policy']=='v3-extrusion-axis-rectangle-arrangement-v1', 'actual arrangement source contract')
    need(sorted(map(sorted,analysis['sourceLoops']))==sorted(map(sorted,[b['A'],b['B']])), 'all source loops retained')
    def span(ref):
        s=ref['sourceSpan'];need(s['kind']=='source-span' and len(s['ends'])==2, 'actual source-span descriptor')
        ends=[]
        for e in s['ends']:
            need(set(e)=={'incidentCurveIds'}, 'exact event descriptor')
            ids=e['incidentCurveIds'];need(ids==sorted(ids) and tuple(ids) in by_incidence, 'all exact event owners')
            ends.append(by_incidence[tuple(ids)])
        key=tuple(sorted(ends));need(key in expected and ends[0]!=ends[1] and s['owners']==expected[key], 'complete genuine atomic-span owner set')
        encoded=('ACAD/source-span/1\n'+canonical(s)).encode()
        need(ref['id']=='source-span:1:'+hashlib.sha256(encoded).hexdigest(), 'independent declared source-span identity schema')
        return key
    spans=analysis['spans'];need(len(spans)==10, 'complete span census');pairs={r['id']:span(r) for r in spans}
    need(len(pairs)==10 and set(pairs.values())==set(expected), 'each atomic interval appears exactly once')
    actual_intervals=analysis['sourceIntervals'];need(len(actual_intervals)==8 and {r['curveId'] for r in actual_intervals}==set(intervals), 'complete source interval rows')
    for r in actual_intervals:need([pairs[x] for x in r['spanIds']]==intervals[r['curveId']], 'ordered complete source intervals')
    need(len(discovery['regions'])==3, 'tiny source cell never omitted')
    cells={};all_ids=[]
    for r in discovery['regions']:
        d=r['descriptor'];need(d['version']==2 and d['kind']=='axis-rectangle-arrangement-cell' and d['holeBoundaryRefs']==[], 'exact cell descriptor')
        coverage=d['coveringSourceLoops'];has_a=sorted(b['A']) in coverage;has_b=sorted(b['B']) in coverage
        label='middle' if has_a and has_b else 'left' if has_a else 'right' if has_b else None
        need(label is not None and label not in cells and len(coverage)==(2 if label=='middle' else 1), 'exact cell source membership')
        lo=F(0) if label=='left' else left if label=='middle' else F(10);hi=left if label=='left' else F(10) if label=='middle' else F(20)
        corners=[(lo,F(0)),(hi,F(0)),(hi,F(10)),(lo,F(10))]
        edges={tuple(sorted((corners[k],corners[(k+1)%4]))) for k in range(4)}
        need(len(d['outerBoundaryRefs'])==4 and {span(ref) for ref in d['outerBoundaryRefs']}==edges, 'cell boundary equals actual represented source spans')
        area=(hi-lo)*10;need(area>0, 'positive dyadic source area')
        unsupported=label=='middle' and 10-left<F('0.0001')
        need(r['support']==('unsupported' if unsupported else 'supported'), 'per-cell Native eligibility')
        need((r['reason']['code']=='PROFILE_BELOW_RESOLUTION') if unsupported else r['reason'] is None, 'precise Native-only tiny-cell reason')
        cells[label]={'id':r['regionId'],'descriptor':d,'lo':lo,'hi':hi,'area':area};all_ids.append(r['regionId'])
    need(set(cells)=={'left','middle','right'} and len(set(all_ids))==3 and set(analysis['cells'])==set(all_ids), 'all complete source cells')
    need(sum(c['area'] for c in cells.values())==200, 'exact dyadic source union area')
    need(cells['left']['area']+cells['middle']['area']==100 and cells['right']['area']+cells['middle']['area']==(20-left)*10, 'exact source interior area/ownership')
    return cells,span

def native(row,cells,span,build,plans):
    s=row['state'];solids=s['capture']['solids'];models=row['models']
    need(len(solids['bodies'])==len(models)==len(solids['outputs']), 'exact live Native result count')
    need(len(row['queries'])==len(models), 'one actual Native query per current body')
    need(s==row['after'], 'all raw/cold/discovery/Native queries read-only')
    need(s['ownership']['processing'] is False and s['ownership']['resources']['cleanupFailed'] is False, 'settled Native owner')
    need(all(s['ownership']['resources'][k]==0 for k in ['candidates','accepted','mounts']), 'no leaked transient owners')
    need(s['lifecycle']['pipelineFailed'] is False and s['lifecycle']['cleanupFailed'] is False, 'valid accepted pipeline')
    for m in models:
        body=next(x for x in solids['bodies'] if x['id']==m['outputId']);output=next(x for x in solids['outputs'] if x['id']==m['outputId']);cell=cells[m['label']]
        need(body['featureId']==output['featureId']==m['featureId'] and m['regionId']==cell['id'], 'same actual body/feature/source cell')
        metrics=body['metrics'];need(metrics['nativeValidity']['valid'] is True and metrics['resultKind']=='single-solid' and metrics['solidCount']==1, 'genuine valid single-solid result')
        need('sha256:'+metrics['runtime']['jsSha256']+':'+metrics['runtime']['wasmSha256']==build, 'actual declared Shell pair')
        near(metrics['nativeVolume'],float(cell['area']*2),NATIVE)
        for k,(lo,hi) in enumerate(zip([float(cell['lo']),0,0],[float(cell['hi']),10,2])):
            near(metrics['nativeBounds']['min'][k],lo,NATIVE);near(metrics['nativeBounds']['max'][k],hi,NATIVE)
        need(all(metrics['nativeTopology']['counts'][k]==n for k,n in [('faces',6),('edges',12),('vertices',8)]), 'actual rectangular cell topology')
        selection=body['selections'];need(selection['status']=='available', 'actual source-span Native selections')
        plan=selection['plan'];need(plan['version']==2 and plan['scope']=='authored-source' and plan['source']=='prism-construction-history', 'real construction selection provenance')
        need(plan['sourceContexts']==[{'kind':'sketch-profile','featureId':m['featureId'],'regionId':cell['id']}] and plan['vertices']==[] and plan['unresolved']==[], 'exact source selection context')
        need(len(plan['edges'])==12 and len(plan['faces'])==6 and len({x['id'] for x in plan['edges']+plan['faces']})==18, 'complete distinct Native selectors')
        refs={r['id'] for r in cell['descriptor']['outerBoundaryRefs']}
        for rows,roles in [(plan['edges'],{'first-boundary':4,'last-boundary':4,'connector':4}),(plan['faces'],{'first-cap':1,'last-cap':1,'swept-boundary':4})]:
            need({r:sum(x['role']==r for x in rows) for r in roles}==roles, 'all required actual constructor roles')
            for x in rows:
                need(x['originFeatureId']==m['featureId'] and 'curveId' not in x and 'incidentCurveIds' not in x, 'derived span is never a whole authored curve')
                if 'boundaryRef' in x:need(x['boundaryRef']['id'] in refs, 'cell-local source span');span(x['boundaryRef'])
                if 'incidentBoundaryRefs' in x:
                    pair=x['incidentBoundaryRefs'];need(len(pair)==2 and pair[0]['id']<pair[1]['id'] and all(r['id'] in refs for r in pair), 'canonical actual connector spans')
                    ends=[set(span(ref)) for ref in pair];need(len(ends[0]&ends[1])==1, 'actual finite shared source event')
        if m['outputId'] in plans:need(plan==plans[m['outputId']], 'exact selector identity/meta across all edits/travel/Open')
        else:plans[m['outputId']]=plan
        query=next(q for q in row['queries'] if q['args']['bodyId']==m['outputId']);args,result=query['args'],query['result']
        need(args['featureId']==m['featureId'] and args['revision']==solids['revision'] and args['engineRevision']==build and args['unit']=='millimeter', 'actual query source tokens')
        expected=[[(float(cell['lo'])+float(cell['hi']))/2,5,1],[float(cell['hi'])+1,5,1],[float(cell['lo']),5,1]]
        need(args['points']==expected and [p['point'] for p in result['points']]==expected and [p['classification'] for p in result['points']]==['inside','outside','boundary'], 'independent Native material/void/rim points')
        need(result['quality']=='native-re-evaluation-observation' and all(result[k]==args[k] for k in ['revision','featureId','bodyId','engineRevision']), 'genuine current query receipt')

def check_resolution(packet,evidence_root):
    need(packet['version']==1, 'per-cell packet version')
    b=packet['binding'];rows=packet['observations']
    need([r['label'] for r in rows]==OBS_LABELS, 'exact complete nineteen-observation finite sequence')
    need([p['label'] for p in packet['persistences']]==SAVE_LABELS and len(packet['refusals'])==2, 'three real .cad cycles and two unsupported-cell refusals')
    need([r['label'] for r in packet['travels']]==TRAVEL_LABELS, 'all source and genuine creation travels')
    need(len(b['A'])==len(b['B'])==4 and len(set(b['A']+b['B']+[b['point']['id']]))==9, 'genuine source allocation')
    initial=json.loads(rows[0]['state']['capture']['native']['source']);identity=None;plans={}
    expected_lefts=[10-1e-6,10-1e-6,10-1e-8,10-1e-6,10-1e-8]+[10-2**-49]*3+[10-.001]*6+[10-.002,10-.001,10-.002,10-.002,10-.002]
    need([r['left'] for r in rows]==expected_lefts, 'all represented small and ordinary phase coordinates')
    need(rows[5]['left']==math.nextafter(10,-math.inf), 'adjacent positive F64 strip is actually exercised')
    counts=[0,2,2,2,2,2,2,2,2,3,2,3,3,3,3,3,3,3,3]
    for row,count in zip(rows,counts):
        raw,curves,left=source_truth(row,b,initial);cells,span=census(row,b,curves,left)
        ids={k:(c['id'],c['descriptor']) for k,c in cells.items()}
        if identity is None:identity=ids
        else:need(ids==identity, 'source topology identities are independent of dimensions/eligibility')
        need(len(row['models'])==count, 'exact per-phase actual Native body census')
        native(row,cells,span,packet['engineRevision'],plans)
    need(all(r['error']['code']=='UNSUPPORTED_REGION' and r['error']['committed'] is False and r['error']['possiblyCommitted'] is False and r['before']==r['after'] for r in packet['refusals']), 'precise pre-submit no-delta refusal')
    for t in packet['travels']:
        before,after=t['before'],t['after'];direction=t['direction'];need(direction in ['undo','redo'], 'real travel direction')
        need(before['capture']['native']['counters']==after['capture']['native']['counters'], 'travel preserves exact allocator highwater')
        need(before['capture']['journal']['canUndo' if direction=='undo' else 'canRedo'] is True and before['capture']['journal']['revision']!=after['capture']['journal']['revision'], 'actual authored travel token')
        need(after['capture']['journal']['redoTarget' if direction=='undo' else 'undoTarget']==before['capture']['journal']['undoTarget' if direction=='undo' else 'redoTarget'], 'actual inverse journal identity')
    # Exact actual source/history and outer selection/body membership at each travel.
    for travel,before_row,after_row in zip(packet['travels'],[2,3,9,10,14,15],[3,4,10,11,15,16]):
        need(travel['before']==rows[before_row]['after'], 'travel begins at actual prior whole observation')
        need(travel['after']==rows[after_row]['state'], 'travel ends at actual following whole observation')
    creates=[o for o in packet['operations'] if o['command']=='create-selected-extrusion']
    need(len(creates)==3 and [o['args']['regionId'] for o in creates]==[identity[k][0] for k in ['left','right','middle']], 'only eligible real creations, no tiny Native result')
    need([c['label'] for c in packet['creations']]==['left','right','middle'], 'three complete actual creation boundaries')
    for c,op in zip(packet['creations'],creates):
        before,after,result=c['before']['capture']['native'],c['after']['capture']['native'],c['result']
        need(result==op['result'] and after['counters']==dict(before['counters'],featureId=before['counters']['featureId']+1) and result['featureId']==after['counters']['featureId'], 'exact one-ID creation and unchanged other counters')
        need(before['source']==after['source'] and len(after['history'])==len(before['history'])+1 and after['history'][:-1]==before['history'], 'one atomic actual history append with original source preserved')
        entry=after['history'][-1];need(entry['type']=='WORKER_SELECTED_PROFILE_EXTRUDE_V2' and entry['params']['featureId']==result['featureId'] and entry['params']['regionId']==identity[c['label']][0] and entry['params']['faceId']==b['faceId'] and entry['params']['depth']==2, 'actual declared source cell producer')
    for saved in packet['persistences']:
        result=saved['result'];file=Path(result['savedFile']);file=file if file.is_absolute() else Path(evidence_root)/file
        info=read_archive(file);need(info['sha256']==result['sha256'] and info['bytes']==result['bytes'], 'actual .cad bytes/CRC/entry SHA/root')
        before=result['before'];after=result['after'];a=before['capture']['native'];z=after['capture']['native']
        need(a['source']==z['source']==info['rawSketches'][b['faceId']], 'exact authored source bytes through native Save/fresh signed Open')
        model=info['envelope']['project']['model'];need(model['history']==a['history']==z['history'] and model['counters']==a['counters']==z['counters'], 'native history/source IDs/highwater persistence')
        need(after['capture']['journal']['canUndo'] is False and after['capture']['journal']['canRedo'] is False, 'fresh session journal not fabricated')
    return {'status':'PASS','observations':19,'travels':6,'refusals':2,'cadCycles':3,'scope':'Exact represented source incidence/positive tiny cells, separate per-cell Native eligibility, actual large and later eligible Native geometry; no subnormal/universal tiny Native claim'}
