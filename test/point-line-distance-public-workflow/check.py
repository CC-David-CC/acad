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
    for key,want in zip(('x','y'),row['end']):near(z[key],D(want))
    points={}
    for p in i['points']:
        o=objects[p['parentId']];data=o['data']
        if p['id']==b['aId']:require(p['parentId']==b['lineId'],'actual A parent');matched=a
        elif p['id']==b['bId']:require(p['parentId']==b['lineId'],'actual B parent');matched=z
        elif o['type']=='Point':matched=data
        else:matched=one([v for v in (data['a'],data['b']) if all(abs(D(v[k])-D(p[k]))<=BUDGET for k in ('x','y'))],'parent-owned source endpoint')
        for key in ('x','y'):near(p[key],D(matched[key]))
        points[p['id']]=matched
    wanted={}
    if row['hasDistance']:wanted[b['pointId']]=(D(row['distance']),False,row['rawDistance'])
    if row['minus']:wanted[row['minus']['id']]=(Decimal(2),True,'2')
    if row['alias']:wanted[b['aId']]=(Decimal(0),False,'0')
    found={}
    for c in s['stages'][0]['constraints']:
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
            else:near(y['y' if typ=='Horizontal' else 'x'],D(x['y' if typ=='Horizontal' else 'x']))
        elif typ in ('SignedDistanceX','SignedDistanceY'):
            x,y=[points[id] for id in refs];key='x' if typ=='SignedDistanceX' else 'y';require(abs(D(y[key])-D(x[key])-value(k['distance'],q))<=BUDGET,'original signed coordinate equation')
        elif typ=='DistancePL':
            require(len(refs)==2 and refs[1]==b['lineId'] and refs[0] in wanted and set(k)=={'distance','inverted'},'exact ordered two-constant authority')
            require(refs[0] not in found,'one actual row per fixture pair');found[refs[0]]=c
            distance,inverted,raw=wanted[refs[0]];require(type(k['inverted']) is bool and k['inverted'] is inverted,'original literal side');require(str(k['distance'])==str(raw),'exact named/literal source');require(value(k['distance'],q)==distance,'actual authoritative distance')
            p=points[refs[0]];observed,normal,length=signed(p,a,z);target=-distance if inverted else distance
            require(abs(observed-target)<=BUDGET,'ORIGINAL stored source equation within50pm')
            # Check intended frame independently, not just reconstruction agreement.
            idealA={'x':0,'y':0};idealB=dict(zip(('x','y'),row['end']))
            idealSigned,idealNormal,_=signed(p,idealA,idealB);require(abs(idealSigned-target)<=BUDGET,'independent requested-frame normal distance within50pm')
            replay=one([v for v in i['points'] if v['id']==refs[0]],'actual replay Point');require(abs(signed(replay,idealA,idealB)[0]-target)<=BUDGET,'replay observation meets SAME independent reference')
            d=one([d for d in i['dimensionTargets'] if d['typeId']=='DistancePL' and d['objects']==refs],'actual inspected row');w=d['supportingLine']
            require(d['canEdit'] and d['canRemove'] and w['lineId']==refs[1] and w['inverted'] is inverted and w['normalBasis']=='native-polar-angle' and w['quality']=='source-local-supporting-line-mm','actual branch/normal binding')
            require(w['polarLength']>0,'observed cold gauge positive');near(w['polarLength'],length)
            for x,y in zip(w['normal'],idealNormal):near(x,y,Decimal('1e-12'))
            near(w['signedDistance'],target)
        else:raise ValueError('Unexpected finite fixture schema '+typ)
    require(set(found)==set(wanted),'actual complete DistancePL census')
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
    require(len(r['saves'])==4,'four real .cad saves/fresh Opens including signed gauge reversal');archives=[]
    require(any(item['label']=='supporting-line-signed-reversed' for item in r['saves']),'actual negative signed branch saved and fresh opened')
    for item in r['saves']:
        archive=read_archive(directory/item['savedFile']);require(archive['sha256']==item['sha256'] and archive['bytes']==item['bytes'],'independent actual ZIP/CRC/hash bytes');e=archive['envelope'];require(e['unit']=='millimeter','canonical physical unit');project=e['project'];model=project['model'];native=item['before']['capture']['native']
        require(model['history']==native['history'] and model['counters']==native['counters'] and model['expressions']==native['expressions'] and e.get('presentation')==native['presentation'],'one exact saved graph/counters/names/presentation')
        saved=one([x for x in project['sketches'] if x['id']==item['b']['faceId']],'actual native source');require(saved['data']==source(item['before'],item['b']),'exact source/IDs/two-constant branch fields')
        require(len(model['history'])==2 and sum(x['type']=='PLANE' for x in model['history'])==1,'one plane and real Native extrusion')
        op=one([x for x in model['history'] if x['type']=='WORKER_SELECTED_PROFILE_EXTRUDE_V2'],'unchanged Native suffix');p=op['params'];b=item['b'];require(p['faceId']==b['faceId'] and p['featureId']==b['body']['featureId'] and p['regionId']==b['regionId'] and p['engineRevision']==r['engineRevision'] and p['depth']==20,'actual source/region/producer/build binding')
        archives.append({'file':item['savedFile'],'sha256':archive['sha256'],'designRevision':archive['manifest']['designRevision']})
    return {'status':'PASS','scope':'finite source DistancePL/polar side/named edit/live reversal/native archives; not finite Segment proximity/parallel-line offset/BRep precision/allC03C04','observations':len(r['observations']),'refusals':len(r['refusals']),'archives':archives}
if __name__=='__main__':print(json.dumps(check(sys.argv[1]),indent=2))
