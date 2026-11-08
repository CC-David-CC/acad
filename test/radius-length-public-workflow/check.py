#!/usr/bin/env python3
"""Independent AFTER-WHOLE native/source oracle, never a production solver.
Reads actual .cad ZIP/CRC/hash/source bytes using the independent archive reader.
No production codec, geometry generator, constraint admission or formatter import.
"""
import hashlib,json,math,sys
from decimal import Decimal,localcontext
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive
PI=Decimal('3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651')
def require(ok,message):
    if not ok:raise ValueError(message)
def one(rows,label):require(len(rows)==1,'one '+label);return rows[0]
def near(x,y,t=5e-8):require(type(x) in (int,float) and math.isfinite(x) and abs(x-float(y))<=t,f'{x} differs from {y}, budget {t}')
def canonical(v):return json.dumps(v,sort_keys=True,separators=(',',':'),ensure_ascii=False)
def source(state,b):return json.loads(one([s for s in state['capture']['native']['sketches'] if s['id']==b['faceId']],'actual captured source')['source'])
def object_source(s,b,r):
    require(s['version']==3 and len(s['stages'])==1 and not s['stages'][0]['generators'],'ordinary single stage')
    require(s['metadata']['boundaryFrame']=={'origin':[0,0,0],'x':[1,0,0],'y':[0,1,0],'z':[0,0,1]},'bounded actual principal XY source frame')
    require(all(not values for values in s['boundary'].values()),'no external source seed')
    objects={o['id']:o for o in s['objects']};require(len(objects)==len(s['objects']),'unique IDs');o=objects[b['id']];require(o['type']==b['kind'],'actual class')
    rectangle=[objects[id] for id in b['rectangleIds']];require(len(rectangle)==4 and all(o['type']=='Segment' for o in rectangle),'original rectangle source')
    expected={((100,100),(110,100)),((110,100),(110,110)),((110,110),(100,110)),((100,110),(100,100))};actual={(tuple(o['data']['a'][k] for k in ('x','y')),tuple(o['data']['b'][k] for k in ('x','y'))) for o in rectangle};require(actual==expected,'exact unrelated rectangle geometry without snapping')
    if b['kind']=='Circle':
        d=o['data'];require(set(d)=={'c','r'},'actual Circle fields');near(d['c']['x'],0);near(d['c']['y'],0);near(d['r'],r,1e-9);free=objects[b['unrelatedId']];require(free['type']=='Point' and free['data']=={'x':7,'y':9},'exact unrelated Point')
    else:
        d=o['data'];require(set(d)=={'a','b','c'},'actual Arc fields')
        for p,wanted in {'c':(40,20),'a':(40+r,20),'b':(40,20+r)}.items():
            for k,v in zip(('x','y'),wanted):near(d[p][k],v)
        ra=math.dist(tuple(d['a'].values()),tuple(d['c'].values()));rb=math.dist(tuple(d['b'].values()),tuple(d['c'].values()));near(ra,r);near(rb,r)
        # Independent oriented cross/dot proves the genuine positive quarter
        # branch; equal radii alone would also accept another angular interval.
        u=(d['a']['x']-d['c']['x'],d['a']['y']-d['c']['y']);v=(d['b']['x']-d['c']['x'],d['b']['y']-d['c']['y']);cross=u[0]*v[1]-u[1]*v[0];dot=u[0]*v[0]+u[1]*v[1];require(cross>0,'positive original branch');angle=math.atan2(cross,dot);near(angle,math.pi/2,1e-8);near(ra*angle,float(PI*Decimal(str(r))/2),1e-6)
    return objects

def equations(s,i):
    objects={o['id']:o for o in s['objects']};points={}
    for p in i['points']:
        o=objects[p['parentId']];d=o['data'];choices=[d] if o['type']=='Point' else [d['c']] if o['type']=='Circle' else [d[k] for k in ('a','b','c') if k in d]
        actual=one([q for q in choices if math.hypot(q['x']-p['x'],q['y']-p['y'])<=5e-8],'actual saved endpoint from discovered parent/coordinates');points[p['id']]=actual
    for c in s['stages'][0]['constraints']:
        require(c['admission']['version']==1 and c['admission']['state'] in ('accepted','redundant'),'actual admitted row');typ=c['typeId'];refs=c['objects'];k=c.get('constants',{})
        if typ=='PCoincident':
            a,b=[points[id] for id in refs]
            for key in ('x','y'):near(a[key],b[key])
        elif typ=='LockPoint':
            p=points[one(refs,'lock target')]
            for key in ('x','y'):near(p[key],float(k[key]))
        elif typ in ('Horizontal','Vertical','SegmentLength'):
            o=objects[one(refs,'segment target')];require(o['type']=='Segment','actual Segment');a,b=o['data']['a'],o['data']['b']
            if typ=='SegmentLength':near(math.hypot(b['x']-a['x'],b['y']-a['y']),float(k['length']))
            else:near(b['y' if typ=='Horizontal' else 'x'],a['y' if typ=='Horizontal' else 'x'])
        elif typ in ('SignedDistanceX','SignedDistanceY'):
            a,b=[points[id] for id in refs];key='x' if typ=='SignedDistanceX' else 'y';near(b[key]-a[key],float(k['distance']))
        elif typ in ('RadiusLength','DiameterLength'):
            o=objects[one(refs,'circular target')];d=o['data'];r=d['r'] if o['type']=='Circle' else math.hypot(d['a']['x']-d['c']['x'],d['a']['y']-d['c']['y']);near(r*(2 if typ=='DiameterLength' else 1),float(k['diameter' if typ=='DiameterLength' else 'length']),1e-9 if o['type']=='Circle' else 5e-8)
        else:raise ValueError('Unexpected fixture schema '+typ)

def settled(state):
    r=state['ownership']['resources'];require(state['ownership']['processing'] is False and r['cleanupFailed'] is False and all(r[k]==0 for k in ('candidates','accepted','mounts')) and r['owners']==r['detached'],'actual resources retired')
def native(state,b,r,build):
    body=one(state['capture']['solids']['bodies'],'actual Native output');require(body['id']==b['body']['outputId'] and body['featureId']==b['body']['featureId'],'actual producer/body binding, no ID grammar');m=body['metrics'];require(m['nativeValidity']['valid'] is True and m['solidCount']==1 and m['resultKind']=='single-solid','genuine Native facts');require('sha256:'+m['runtime']['jsSha256']+':'+m['runtime']['wasmSha256']==build,'exact Native revision')
    with localcontext() as ctx:ctx.prec=110;volume=PI*Decimal(str(r))**2*20
    near(m['nativeVolume'],volume,1e-6)
    for k,vs in {'min':[-r,-r,0],'max':[r,r,20]}.items():
        for x,y in zip(m['nativeBounds'][k],vs):near(x,y,1e-6)
    return float(volume)
def pointclass(p,r):
    x,y,z=p;radial=x*x+y*y
    if radial>r*r or z<0 or z>20:return 'outside'
    if radial==r*r or z in (0,20):return 'boundary'
    return 'inside'
def check(directory):
    directory=Path(directory);receipt=json.loads((directory/'receipt.json').read_text());require(receipt['status']=='PASS','whole browser workflow PASS first');require(receipt['ownedContextsRetired'] and receipt['sharedBrowserDisconnectedOnly'],'owned-only cleanup');require(receipt['sourcePins']==receipt['sourcePinsAfter'],'executed source immutable');require(receipt['sourceSeeds'] is False and receipt['privateAuthoring'] is False and receipt['fakeReplies'] is False,'scope')
    for snapshot in receipt['sourceSnapshots']:require(hashlib.sha256((directory/snapshot['file']).read_bytes()).hexdigest()==snapshot['sha256'],'frozen executed file bytes')
    queries=0;observations=[]
    for row in receipt['observations']:
        before,after=row['before'],row['after'];require(before==after,'all same-window source/geometry/J/tokens/dirty/material unchanged by read');settled(before);s=source(before,row['circle']);object_source(s,row['circle'],row['circleRadius']);equations(s,row['inspections']['circle'])
        if row['arc']:
            s=source(before,row['arc']);object_source(s,row['arc'],row['arcRadius']);equations(s,row['inspections']['arc'])
        if row['query']:
            volume=native(before,row['circle'],row['circleRadius'],receipt['engineRevision']);q=row['query'];request=row['input'];require(q['quality']=='native-re-evaluation-observation','real Native query kind')
            for key in ('revision','bodyId','featureId','unit','engine','engineRevision'):require(q[key]==request[key],'actual query binding')
            require(q['points']==[{'point':p,'classification':pointclass(p,row['circleRadius'])} for p in request['points']],'independent actual material/void/boundary classes');queries+=len(q['points']);observations.append({'label':row['label'],'volumeMM3':volume})
    for row in receipt['refusals']:require(row['before']==row['after'] and row['error']['committed'] is False and row['error']['possiblyCommitted'] is False,'exact atomic refusal preservation')
    require(any('conflicts with retained diameter10' in row['label'] and row['error']['code']=='DIMENSION_REJECTED' for row in receipt['refusals']),'real incompatible request refusal; independent r6 and2r10 equations contradictory')
    require(any(row['command']=='remove-closed-sketch-dimension' and row.get('result',{}).get('dimension',{}).get('typeId')=='RadiusLength' and row['result']['dimension']['status']=='removed' for row in receipt['commands']),'genuine discovered RadiusLength removal, not only diameter removal')
    require(any('reactivate retained diameter' in row['label'] for row in receipt['observations']),'actual redundant-row reactivation observation')
    reports=receipt['diagnostics'];require(len(reports)==5,'ordinary under/full/redundant and Arc local reports');require([r['expectedNullity'] for r in reports]==[3,2,2,1,0],'independent declared formulation freedoms, not universal physical DOF')
    for row in reports:require(row['before']==row['after'] and row['report']['localJacobian']['localNullity']==row['expectedNullity'],'read-only actual local report')
    require(len(receipt['saves'])==3,'three real .cad Save/fresh Open checkpoints');artifacts=[]
    for item in receipt['saves']:
        file=directory/item['savedFile'];archive=read_archive(file);require(archive['sha256']==item['sha256'] and archive['bytes']==item['bytes'],'actual server/local .cad bytes');envelope=archive['envelope'];require(envelope['format']=='codi-jsketcher-project' and envelope['unit']=='millimeter','native authored unit contract');project=envelope['project'];model=project['model'];before=item['before'];require(model['history']==before['capture']['native']['history'] and model['counters']==before['capture']['native']['counters'] and model['expressions']==before['capture']['native']['expressions'],'one exact saved authored graph/counters/expressions');require(envelope.get('presentation')==before['capture']['native']['presentation'],'exact persisted presentation')
        for b,r in ((item['circle'],item['circleRadius']),(item['arc'],item['arcRadius'])):
            source_row=one([s for s in project['sketches'] if s['id']==b['faceId']],'actual saved source');require(source_row['data']==source(before,b),'native original source exact including RadiusLength/IDs/other intent');object_source(source_row['data'],b,r)
        op=one([o for o in model['history'] if o['type']=='WORKER_SELECTED_PROFILE_EXTRUDE_V2'],'one selected Circle extrusion');p=op['params'];b=item['circle'];require(p['featureId']==b['body']['featureId'] and p['faceId']==b['faceId'] and p['regionId']==b['regionId'] and p['engineRevision']==receipt['engineRevision'] and p['depth']==20,'exact saved source/region/build/feature intent, no opaque parsing');require(len(model['history'])==3 and sum(o['type']=='PLANE' for o in model['history'])==2,'two genuine independent planes, one body; Arc not fabricated as BRep');native(before,b,item['circleRadius'],receipt['engineRevision']);artifacts.append({'file':item['savedFile'],'sha256':archive['sha256'],'designRevision':archive['manifest']['designRevision']})
    return {'status':'PASS','scope':'finite radius/quarter-Arc source, independent original equations, Circle Native material/units and actual .cad artifacts; not Arc BRep/fullC03/C04','observations':len(receipt['observations']),'nativePoints':queries,'nativeObservations':observations,'archives':artifacts}
if __name__=='__main__':print(json.dumps(check(sys.argv[1]),indent=2))
