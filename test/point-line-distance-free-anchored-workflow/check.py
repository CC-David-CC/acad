#!/usr/bin/env python3
"""AFTER-WHOLE independent source/equation/archive oracle. No production imports."""
import hashlib,json,math,sys
from decimal import Decimal,localcontext
from fractions import Fraction
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive
BUDGET=Decimal('5e-8')
def require(v,m):
    if not v:raise ValueError(m)
def one(xs,m):require(len(xs)==1,'one '+m);return xs[0]
def D(v):
    require(type(v) in (float,int) and math.isfinite(v),'finite represented number')
    return Decimal.from_float(v) if type(v) is float else Decimal(v)
def near(a,b,t=BUDGET):require(abs(D(a)-b)<=t,f'{a} != {b}, budget {t}')
def source(state,b):return json.loads(one([x for x in state['capture']['native']['sketches'] if x['id']==b['faceId']],'actual source')['source'])
def normalized(s):
    v=json.loads(json.dumps(s))
    for x in (v['host'],v['parameters'],v['capture']['journal'],v['capture']['solids']):x.pop('revision',None)
    return v
def quantities(row):
    defs=row['definitions']
    if not defs:return {}
    require(len(defs)==2 and defs[0]['name']=='base' and defs[0]['dimension']=='length' and defs[1]=={'name':'clearance','dimension':'length','expression':'base'},'exact named length graph')
    raw=row['before']['capture']['native']['expressions'];prefix='codi-physical-parameters:1\n'
    require(raw.startswith(prefix) and json.loads(raw[len(prefix):])==defs,'actual authoritative definitions')
    text=defs[0]['expression'];require(text.startswith('mm(') and text.endswith(')'),'explicit canonical mm')
    value=Decimal(text[3:-1]);require(value.is_finite() and value>=0,'nonnegative named dimension')
    return {'base':value,'clearance':value}
def value(raw,q):
    require(type(raw) in (str,int,float),'numeric literal or actual name')
    if type(raw) is str and raw in q:return q[raw]
    n=Decimal(raw) if type(raw) is str else D(raw);require(n.is_finite(),'finite dimension');return n
def signed(p,a,b):
    dx,dy=D(b['x'])-D(a['x']),D(b['y'])-D(a['y']);length=(dx*dx+dy*dy).sqrt();require(length>Decimal('1e-9'),'nonzero source line')
    return (-dy*(D(p['x'])-D(a['x']))+dx*(D(p['y'])-D(a['y'])))/length,(-dy/length,dx/length),length
def validate_cold_equations(constraints,points,lines,q):
    # This inventory contains only actual cold-inspected coordinates. All source
    # equations below are also evaluated separately at the stored coordinates.
    for c in constraints:
        refs=c['objects'];k=c.get('constants',{});typ=c['typeId']
        if typ=='PCoincident':
            x,y=[points[id] for id in refs]
            for key in ('x','y'):near(x[key],D(y[key]))
        elif typ=='LockPoint':
            p=points[one(refs,'cold lock')]
            for key in ('x','y'):near(p[key],value(k[key],q))
        elif typ in ('Horizontal','Vertical','SegmentLength'):
            d=lines[one(refs,'cold Segment')];x,y=d['a'],d['b']
            if typ=='SegmentLength':require(abs(signed(x,x,y)[2]-value(k['length'],q))<=BUDGET,'cold original length equation')
            else:
                angle=value(k['angle'],q);axes={Decimal(0):(1,0),Decimal(90):(0,1),Decimal(180):(-1,0),Decimal(270):(0,-1)};require(angle in axes,'cold original rectangle angle');ux,uy=axes[angle];dx,dy=D(y['x'])-D(x['x']),D(y['y'])-D(x['y']);require(abs(-uy*dx+ux*dy)<=BUDGET and ux*dx+uy*dy>0,'cold original ordered rectangle direction equation')
        elif typ in ('SignedDistanceX','SignedDistanceY'):
            x,y=[points[id] for id in refs];key='x' if typ=='SignedDistanceX' else 'y';require(abs(D(y[key])-D(x[key])-value(k['distance'],q))<=BUDGET,'cold original signed coordinate equation')
        elif typ=='DistancePL':
            line=lines[refs[1]];observed=signed(points[refs[0]],line['a'],line['b'])[0];target=value(k['distance'],q)*(-1 if k['inverted'] else 1);require(abs(observed-target)<=BUDGET,'cold ORIGINAL supporting-line equation within50pm')
        else:raise ValueError('Unexpected cold finite fixture schema '+typ)
def settled(state):
    r=state['ownership']['resources'];require(not state['ownership']['processing'] and not r['cleanupFailed'] and all(r[k]==0 for k in ('candidates','accepted','mounts')) and r['owners']==r['detached'],'scoped resources retired')
def validate(row,build):
    b=row['b'];s=source(row['before'],b);i=row['inspection'];q=quantities(row);objects={o['id']:o for o in s['objects']}
    require(len(objects)==len(s['objects']) and s['version']==3 and len(s['stages'])==1 and not s['stages'][0]['generators'],'unique real ordinary source')
    require(s['metadata']['boundaryFrame']=={'origin':[0,0,0],'x':[1,0,0],'y':[0,1,0],'z':[0,0,1]} and all(not x for x in s['boundary'].values()),'actual XY/no source seeds')
    rect=[objects[id] for id in b['rectangleIds']];require(len(rect)==4 and all(o['type']=='Segment' for o in rect),'original rectangle members')
    expected={((100,100),(110,100)),((110,100),(110,110)),((110,110),(100,110)),((100,110),(100,100))}
    actual={(tuple(o['data']['a'][k] for k in ('x','y')),tuple(o['data']['b'][k] for k in ('x','y'))) for o in rect};require(actual==expected,'exact unrelated rectangle')
    require(objects[b['qRoot']]['type']=='Point' and objects[b['qRoot']]['data']=={'x':7,'y':9},'unrelated Point exact')
    line=objects[b['lineId']];require(line['type']=='Segment','actual line');a,z=line['data']['a'],line['data']['b'];require(a=={'x':0,'y':0},'source anchor exact')
    mode=row['frameMode'];require(mode in ('requested','free','partial-x','anchored'),'explicit test expectation phase')
    if mode in ('requested','anchored'):
        for key,want in zip(('x','y'),row['end']):near(z[key],D(want))
    elif mode=='partial-x':near(z['x'],Decimal(-10))
    points={};cold_points={};cold_lines={}
    for p in i['points']:
        require(p['id'] not in points,'unique actual cold point')
        o=objects[p['parentId']];data=o['data']
        if p['id']==b['aId']:require(p['parentId']==b['lineId'],'actual A parent');matched=a
        elif p['id']==b['bId']:require(p['parentId']==b['lineId'],'actual B parent');matched=z
        elif o['type']=='Point':matched=data
        else:matched=one([v for v in (data['a'],data['b']) if all(abs(D(v[k])-D(p[k]))<=BUDGET for k in ('x','y'))],'parent-owned source endpoint')
        for key in ('x','y'):near(p[key],D(matched[key]))
        points[p['id']]=matched;cold_points[p['id']]=p
        if o['type']=='Segment':
            line=cold_lines.setdefault(o['id'],{});end='a' if matched is data['a'] else 'b';require(end not in line,'unique actual cold endpoint');line[end]=p
    for o in objects.values():
        if o['type']=='Segment':require(set(cold_lines.get(o['id'],{}))=={'a','b'},'both actual cold Segment endpoints')
    if mode=='partial-x':near(cold_points[b['bId']]['x'],Decimal(-10))
    wanted={}
    if row['hasDistance']:wanted[b['pointId']]=(D(row['distance']),False,row['rawDistance'])
    if row['minus']:wanted[row['minus']['id']]=(Decimal(2),True,'2')
    if row['alias']:wanted[b['aId']]=(Decimal(0),False,'0')
    found={}
    original=s['stages'][0]['constraints'];require(len(i['constraints'])==len(original),'actual cold constraint census')
    for index,c in enumerate(original):
        cold=i['constraints'][index];require(cold['typeId']==c['typeId'] and cold['stage']==c['stage'] and cold['index']==index and cold['objects']==c['objects'] and cold['constants']==c.get('constants',{}) and cold['admission']==c['admission'],'actual cold source identity/constants/classification')
        require(c['admission']['version']==1 and c['admission']['state'] in ('accepted','redundant'),'actual original admission');refs=c['objects'];k=c.get('constants',{});typ=c['typeId']
        if typ=='PCoincident':
            x,y=[points[id] for id in refs]
            for key in ('x','y'):near(x[key],D(y[key]))
        elif typ=='LockPoint':
            p=points[one(refs,'lock')]
            for key in ('x','y'):near(p[key],value(k[key],q))
        elif typ in ('Horizontal','Vertical','SegmentLength'):
            d=objects[one(refs,'Segment')]['data'];x,y=d['a'],d['b']
            if typ=='SegmentLength':require(abs(signed(x,x,y)[2]-value(k['length'],q))<=BUDGET,'original length equation')
            else:
                angle=value(k['angle'],q);axes={Decimal(0):(1,0),Decimal(90):(0,1),Decimal(180):(-1,0),Decimal(270):(0,-1)};require(angle in axes,'actual authored rectangle angle');ux,uy=axes[angle];dx,dy=D(y['x'])-D(x['x']),D(y['y'])-D(x['y']);require(abs(-uy*dx+ux*dy)<=BUDGET and ux*dx+uy*dy>0,'original ordered rectangle direction equation')
        elif typ in ('SignedDistanceX','SignedDistanceY'):
            x,y=[points[id] for id in refs];key='x' if typ=='SignedDistanceX' else 'y';require(abs(D(y[key])-D(x[key])-value(k['distance'],q))<=BUDGET,'original signed coordinate equation')
        elif typ=='DistancePL':
            require(len(refs)==2 and refs[1]==b['lineId'] and refs[0] in wanted and set(k)=={'distance','inverted'},'exact ordered two-constant authority')
            require(refs[0] not in found,'one actual row per fixture pair');found[refs[0]]=c
            distance,inverted,raw=wanted[refs[0]];require(type(k['inverted']) is bool and k['inverted'] is inverted,'original literal side');require(str(k['distance'])==str(raw),'exact named/literal source');require(value(k['distance'],q)==distance,'actual authoritative distance')
            p=points[refs[0]];observed,normal,length=signed(p,a,z);target=-distance if inverted else distance
            require(abs(observed-target)<=BUDGET,'ORIGINAL stored source equation within50pm')
            # Cold equation/metadata use the SAME inspected A, B and P. Raw
            # source coordinates have their own original equation above.
            replay=cold_points[refs[0]];cold_line=cold_lines[refs[1]];cold_a,cold_b=cold_line['a'],cold_line['b'];cold_signed,cold_normal,cold_length=signed(replay,cold_a,cold_b);require(abs(cold_signed-target)<=BUDGET,'cold original supporting-line distance within50pm')
            if mode in ('requested','anchored'):
                idealA={'x':0,'y':0};idealB=dict(zip(('x','y'),row['end']))
                for actual in (p,replay):require(abs(signed(actual,idealA,idealB)[0]-target)<=BUDGET,'stored/cold equation independently meets requested anchored frame within50pm')
            d=one([d for d in i['dimensionTargets'] if d['typeId']=='DistancePL' and d['objects']==refs],'actual inspected row');w=d['supportingLine']
            require(d['canEdit'] and d['canRemove'] and w['lineId']==refs[1] and w['inverted'] is inverted and w['normalBasis']=='native-polar-angle' and w['quality']=='source-local-supporting-line-mm','actual branch/normal binding')
            require(w['polarLength']>0,'observed cold gauge positive');near(w['polarLength'],cold_length)
            for axis,key in enumerate(('x','y')):near(w['anchor'][axis],D(cold_a[key]))
            for x,y in zip(w['normal'],cold_normal):near(x,y,Decimal('1e-12'))
            near(w['signedDistance'],cold_signed)
        else:raise ValueError('Unexpected finite fixture schema '+typ)
    validate_cold_equations(original,cold_points,cold_lines,q)
    require(set(found)==set(wanted),'actual complete DistancePL census')
    locks=[c for stage in s['stages'] for c in stage['constraints'] if c['typeId']in('SignedDistanceX','SignedDistanceY') and c['objects']==[b['datumId'],b['bId']]]
    if mode=='free':require(not locks,'B is genuinely free during definition update/Open/travel')
    if mode in ('free','partial-x'):require(not any(c['typeId']=='SignedDistanceX' and c['objects']==[b['datumId'],b['pointId']]for stage in s['stages']for c in stage['constraints']),'P tangential freedom retained')
    if mode=='partial-x':require(len(locks)==1 and locks[0]['typeId']=='SignedDistanceX' and value(locks[0]['constants']['distance'],q)==Decimal(-110),'one actual X anchor; By genuinely free with no requested Y or normal')
    if mode=='anchored':
        require(len(locks)==2,'actual two authored B anchors')
        for typ,want in [('SignedDistanceX',-110),('SignedDistanceY',-100)]:require(value(one([c for c in locks if c['typeId']==typ],'B anchor')['constants']['distance'],q)==want,'actual datum-relative B anchor')
    if row['label']=='Actual supporting-line distance2 accepts foot beyond Segment endpoint':
        p=points[b['pointId']];dx,dy=D(z['x'])-D(a['x']),D(z['y'])-D(a['y']);require(((D(p['x'])-D(a['x']))*dx+(D(p['y'])-D(a['y']))*dy)>dx*dx+dy*dy,'actual foot outside finite Segment, still valid supporting-line positive')
    if row['expectedPoint']:
        p=objects[b['pointRoot']]['data']
        for key,want in zip(('x','y'),row['expectedPoint']):near(p[key],D(want))
    require(row['before']==row['after'],'read-only exact state');settled(row['before'])
    body=one(row['before']['capture']['solids']['bodies'],'actual unchanged Native body');m=body['metrics'];require(body['id']==b['body']['outputId'] and body['featureId']==b['body']['featureId'] and m['nativeValidity']['valid'] is True and m['solidCount']==1,'real Native producer')
    require('sha256:'+m['runtime']['jsSha256']+':'+m['runtime']['wasmSha256']==build,'actual native runtime identity')
    near(m['nativeVolume'],Decimal(2000),Decimal('1e-6'))
    for key,vs in {'min':[100,100,0],'max':[110,110,20]}.items():
        for x,y in zip(m['nativeBounds'][key],vs):near(x,D(y),Decimal('1e-6'))
    query=row['query'];request=row['input'];require(query['quality']=='native-re-evaluation-observation','real Native point quality')
    for key in ('revision','bodyId','featureId','unit','engine','engineRevision'):require(query[key]==request[key],'actual query binding')
    require(request['bodyId']==body['id'] and request['featureId']==body['featureId'] and request['engineRevision']==build and request['engine']=='occ' and request['unit']=='millimeter' and request['revision']==row['before']['capture']['solids']['revision'],'query current owned body/source/build')
    def point_class(p):
        require(len(p)==3 and all(type(v) in (int,float) and math.isfinite(v) for v in p),'finite query point')
        bounds=((100,110),(100,110),(0,20))
        if any(v<lo or v>hi for v,(lo,hi) in zip(p,bounds)):return 'outside'
        return 'boundary' if any(v in (lo,hi) for v,(lo,hi) in zip(p,bounds)) else 'inside'
    require(query['points']==[{'point':p,'classification':point_class(p)} for p in request['points']],'independent analytic rectangle point classes')
    return s
def rational_rank(rows):
    matrix=[[Fraction(v) for v in row] for row in rows];rank=0
    for col in range(2):
        pivot=next((i for i in range(rank,len(matrix)) if matrix[i][col]),None)
        if pivot is None:continue
        matrix[rank],matrix[pivot]=matrix[pivot],matrix[rank];div=matrix[rank][col];matrix[rank]=[x/div for x in matrix[rank]]
        for i in range(len(matrix)):
            if i!=rank:
                mul=matrix[i][col];matrix[i]=[x-mul*y for x,y in zip(matrix[i],matrix[rank])]
        rank+=1
    return rank
def check(directory):
    directory=Path(directory);r=json.loads((directory/'receipt.json').read_text());require(r['status']=='PASS','complete browser PASS first');require(r['ownedContextsRetired'] and r['sharedBrowserDisconnectedOnly'],'owned-only cleanup');require(r['sourcePins']==r['sourcePinsAfter'],'producing source unchanged');require(not r['sourceSeeds'] and not r['privateAuthoring'] and not r['fakeReplies'],'public-only authoring')
    for x in r['sourceSnapshots']:require(hashlib.sha256((directory/x['file']).read_bytes()).hexdigest()==x['sha256'],'actual source custody')
    with localcontext() as ctx:
        ctx.prec=110
        for row in r['observations']:validate(row,r['engineRevision'])
    require([d['expected'] for d in r['diagnostics']]==[4,3,2,2],'finite local report chain')
    ranks=[rational_rank(rows) for rows in ([],[[0,1]],[[0,1],[1,0]],[[0,1],[1,0],[0,1]])];require([4-rank for rank in ranks]==[4,3,2,2],'independent P rank plus Q2, not physical/global DOF')
    for d in r['diagnostics']:require(d['before']==d['after'] and d['report']['localJacobian']['localNullity']==d['expected'],'actual readonly report')
    require(any(x['label']=='SIGNED endpoint reversal preserves actual raw polar-normal side' and x['end']==[-10,0] for x in r['observations']),'required SIGNED dimension reversal, not only syncGeometry coordinate edits')
    require(any(x['end']==[0,10] for x in r['observations']) and any(x['end']==[-10,0] for x in r['observations']),'required ordinary live rotation/reversal positives')
    require(any(x['distance']==0 and x['hasDistance'] for x in r['observations']) and any(x['minus'] for x in r['observations']) and any(x['alias'] for x in r['observations']),'zero/both sides/endpoint alias positives')
    for x in r['refusals']:require(normalized(x['before'])==normalized(x['after']) and not x['error']['committed'] and not x['error']['possiblyCommitted'],'refusal preservation except four derived opaque revisions')
    labels=[x['label'] for x in r['refusals']];require(all(any(k in label for label in labels) for k in ('contradicts','Stale','nonzero conflicts','Collapsed','Negative supporting','Unknown','numeric erasure','Undefined','Wrong dimensional','Negative named','Cyclic')),'finite refusal inventory')
    noop=one([x for x in r['rows'] if x['label']=='Exact literal no-op keeps source and redo'],'actual scalar no-op');require(noop['before']==noop['after'] and noop['before']['capture']['journal']['canRedo'] and not noop['noop']['changed'],'actual redo preserved')
    require(any(x['command']=='remove-closed-sketch-dimension' and x.get('result',{}).get('dimension',{}).get('typeId')=='DistancePL' for x in r['commands']),'genuine discovered removal')
    create_noop=one([x for x in r['rows'] if x['label']=='Identical literal creation is a genuine no-op'],'actual creation no-op');require(create_noop['before']==create_noop['after'] and not create_noop['createNoop']['changed'],'creation no-op exact preservation')
    require(len(r['saves'])==5,'five real .cad saves/fresh Opens including original four and new free phase');archives=[]
    require(any(item['label']=='supporting-line-signed-reversed' for item in r['saves']),'actual negative signed branch saved and fresh opened')
    for item in r['saves']:
        archive=read_archive(directory/item['savedFile']);require(archive['sha256']==item['sha256'] and archive['bytes']==item['bytes'],'independent actual ZIP/CRC/hash bytes');e=archive['envelope'];require(e['unit']=='millimeter','canonical physical unit');project=e['project'];model=project['model'];native=item['before']['capture']['native']
        require(model['history']==native['history'] and model['counters']==native['counters'] and model['expressions']==native['expressions'] and e.get('presentation')==native['presentation'],'one exact saved graph/counters/names/presentation')
        saved=one([x for x in project['sketches'] if x['id']==item['b']['faceId']],'actual native source');require(saved['data']==source(item['before'],item['b']),'exact source/IDs/two-constant branch fields')
        require(len(model['history'])==2 and sum(x['type']=='PLANE' for x in model['history'])==1,'one plane and real Native extrusion')
        op=one([x for x in model['history'] if x['type']=='WORKER_SELECTED_PROFILE_EXTRUDE_V2'],'unchanged Native suffix');p=op['params'];b=item['b'];require(p['faceId']==b['faceId'] and p['featureId']==b['body']['featureId'] and p['regionId']==b['regionId'] and p['engineRevision']==r['engineRevision'] and p['depth']==20,'actual source/region/producer/build binding')
        archives.append({'file':item['savedFile'],'sha256':archive['sha256'],'designRevision':archive['manifest']['designRevision']})
    free=r['freePhase'];b=r['binding']
    def reduced_source(s):
        for o in s['objects']:
            if o['id']==b['lineId']:o['data']['b']={'x':None,'y':None}
            elif o['id']in (b['pointRoot'],r['observations'][-1]['minus']['root']):o['data']={'x':None,'y':None}
        for stage in s['stages']:
            for c in stage['constraints']:c.pop('admission',None)
        return s
    def reduced(state):return reduced_source(source(state,b))
    require(reduced(free['before'])==reduced(free['changed']),'free update changes only actual coupled B/P/M geometry, keeps A/rectangle/Q/source intent exact')
    for key in ('history','counters','presentation'):require(free['before']['capture']['native'][key]==free['changed']['capture']['native'][key],'free update preserves '+key)
    for actual,expected in [(free['undone'],free['before']),(free['redone'],free['changed'])]:
        for key in ('source','sketches','history','expressions','counters','presentation'):require(actual['capture']['native'][key]==expected['capture']['native'][key],'free travel exact accepted '+key)
    observations={x['label']:x for x in r['observations']}
    for label,n in [('FREE current line before actual named2 to3',2),('FREE definition2 to3 satisfies original coupled equations',3)]:
        row=observations[label];require(row['frameMode']=='free' and row['distance']==n,'real free external2 to3 observation already independently validated above at110digits')
    free_save=one([s for s in r['saves']if s['label']=='supporting-line-free-named3'],'actual added free Save')
    require(free_save['frameMode']=='free' and free_save['before']['capture']['native']['source']==free['redone']['capture']['native']['source'],'free .cad binds accepted validated source, not preselected coordinates')
    require(any(x['frameMode']=='anchored' and x['label']=='ANCHORED public SignedX and SignedY hold B negative10 zero'for x in r['observations']),'subsequent genuine public B anchors')
    anchors=r['anchorCreations'];require([x['axis']for x in anchors]==['x','y'],'immediate actual creation travel for BOTH anchors')
    for item,want,before_mode,after_mode in zip(anchors,[-110,-100],['free','partial-x'],['partial-x','anchored']):
        axis=item['axis'];typ='SignedDistanceX'if axis=='x'else'SignedDistanceY';require(item['beforeMode']==before_mode and item['afterMode']==after_mode,'exact partial anchoring phase')
        result=item['result'];require(result['changed']is True and result['authoredUndo']is True and result['dimension']['axis']==axis and result['dimension']['typeId']==typ and result['dimension']['objects']==[b['datumId'],b['bId']] and result['dimension']['distance']==want,'actual public literal anchor creation receipt')
        smaller=source(item['before'],b);larger=source(item['created'],b);matches=[(si,ci,c)for si,stage in enumerate(larger['stages'])for ci,c in enumerate(stage['constraints'])if c['typeId']==typ and c['objects']==[b['datumId'],b['bId']]]
        si,ci,c=one(matches,'actual new anchor row');require(type(c['constants']['distance'])in(int,float) and c['constants']=={'distance':want} and c['stage']==si,'actual numeric writer row bound to requested datum')
        require(not any(c['typeId']==typ and c['objects']==[b['datumId'],b['bId']]for stage in smaller['stages']for c in stage['constraints']),'anchor was genuinely absent before creation')
        restored=json.loads(json.dumps(larger));restored['stages'][si]['constraints'].pop(ci);require(reduced_source(restored)==reduced_source(smaller),'exact single anchor row/source delta; only actual coupled B/P/M geometry may move')
        for key in ('expressions','history','counters','presentation'):require(item['created']['capture']['native'][key]==item['before']['capture']['native'][key],'creation preserves definitions/feature highwater/other native '+key)
        require(item['created']['parameters']['definitions']==item['before']['parameters']['definitions'] and item['created']['manufacturing']==item['before']['manufacturing'],'creation retains actual typed definitions/material metadata')
        target={'kind':'sketch-bytes','faceId':b['faceId']};require(item['target']==target and item['created']['capture']['journal']['undoTarget']==target and item['undone']['capture']['journal']['redoTarget']==target and item['redone']['capture']['journal']['undoTarget']==target,'same actual source/J target through creation UndoRedo')
        for actual,expected in [(item['undone'],item['before']),(item['redone'],item['created'])]:
            for key in ('source','sketches','history','expressions','counters','presentation'):require(actual['capture']['native'][key]==expected['capture']['native'][key],'anchor creation travel exact accepted '+key)
            require(actual['parameters']['definitions']==expected['parameters']['definitions'] and actual['manufacturing']==expected['manufacturing'],'anchor travel exact definitions/material metadata')
    require(anchors[0]['before']['capture']['native']['source']==free_save['before']['capture']['native']['source'],'X creation snapshot is genuine same-project FREE post-.cad source')
    require(anchors[1]['before']['capture']['native']['source']==anchors[0]['redone']['capture']['native']['source'],'Y creation follows the actual X Redo source')
    require(any(x['frameMode']=='partial-x' and x['label']=='PARTIAL-X actual X lock with genuinely free By'for x in r['observations']),'actual X-only phase observed and independently validated')
    return {'status':'PASS','scope':'NEW complete free-coupled and explicitly anchored source DistancePL/named edits/live reversal/five native archives; not finite Segment proximity/parallel-line offset/BRep precision/allC03C04','observations':len(r['observations']),'refusals':len(r['refusals']),'archives':archives}
if __name__=='__main__':print(json.dumps(check(sys.argv[1]),indent=2))
