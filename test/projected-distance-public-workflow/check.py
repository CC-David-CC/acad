#!/usr/bin/env python3
"""Independent AFTER-WHOLE source/equation/archive oracle. No production solver.
Projection uses source Segment endpoints and original dot product. Observed
solver status is not an independent impossibility or global-DOF certificate.
"""
import hashlib,json,math,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive

def require(v,msg):
    if not v:raise ValueError(msg)
def one(rows,label):require(len(rows)==1,'one '+label);return rows[0]
def near(a,b):require(type(a) in (int,float) and math.isfinite(a) and abs(a-b)<=5e-8,f'{a} != {b}, 50pm coordinate qualification')
def source(state,b):return json.loads(one([r for r in state['capture']['native']['sketches'] if r['id']==b['faceId']],'actual source')['source'])
def normalized(state):
    v=json.loads(json.dumps(state))
    for owner in (v['host'],v['parameters'],v['capture']['journal'],v['capture']['solids']):owner.pop('revision',None)
    return v

def quantities(definitions):
    if not definitions:return {}
    require(len(definitions)==2,'finite two named length definitions')
    a,b=definitions;require(a['name']=='base' and a['dimension']=='length' and b=={'name':'projection','dimension':'length','expression':'base'},'exact original directed formula definitions')
    text=a['expression'];require(text.startswith('mm(') and text.endswith(')'),'explicit physical unit');number=float(text[3:-1]);require(math.isfinite(number),'finite original length literal');return {'base':number,'projection':number}
def value(raw,q):
    try:return float(raw)
    except (ValueError,TypeError):require(raw in q,'only actual defined named length');return q[raw]
def validate(row):
    s=source(row['before'],row['b']);b=row['b'];i=row['inspection'];objects={o['id']:o for o in s['objects']};require(len(objects)==len(s['objects']),'unique actual source IDs');require(s['version']==3 and len(s['stages'])==1 and not s['stages'][0]['generators'],'finite actual ordinary stage');require(s['metadata']['boundaryFrame']=={'origin':[0,0,0],'x':[1,0,0],'y':[0,1,0],'z':[0,0,1]},'actual XY source frame');require(all(not v for v in s['boundary'].values()),'no source seeds')
    require(objects[b['unrelatedId']]['type']=='Point' and objects[b['unrelatedId']]['data']=={'x':77,'y':99},'unrelated free Point exact')
    rect=[objects[id] for id in b['rectangleIds']];require(len(rect)==4 and all(o['type']=='Segment' for o in rect),'actual rectangle source');expected={((0,0),(10,0)),((10,0),(10,10)),((10,10),(0,10)),((0,10),(0,0))};actual={(tuple(o['data']['a'][k] for k in ('x','y')),tuple(o['data']['b'][k] for k in ('x','y'))) for o in rect};require(actual==expected,'unrelated canonical rectangle exact')
    # Link inspected opaque handles to ACTUAL source data within their actual
    # parent; never parse an ID suffix or treat inspection coordinates as truth.
    points={}
    for p in i['points']:
        o=objects[p['parentId']];choices=[o['data']] if o['type']=='Point' else [o['data'][k] for k in ('a','b')]
        matching=[c for c in choices if abs(c['x']-p['x'])<=5e-8 and abs(c['y']-p['y'])<=5e-8];points[p['id']]=one(matching,'actual parent-owned endpoint')
    a,p=points[b['datumId']],points[b['pointId']];near(a['x'],0);near(a['y'],0);d=objects[b['directionId']];require(d['type']=='Segment','actual live Segment');u,v=d['data']['a'],d['data']['b'];near(u['x'],10);near(u['y'],10)
    for k,want in zip(('x','y'),row['end']):near(v[k],want)
    dx,dy=v['x']-u['x'],v['y']-u['y'];L=math.hypot(dx,dy);require(L>1e-9,'genuine nonzero live direction');projection=((p['x']-a['x'])*dx+(p['y']-a['y'])*dy)/L
    if row['hasRadius']:near(math.dist(tuple(a[k] for k in ('x','y')),tuple(p[k] for k in ('x','y'))),5)
    if row['pointExpected']:
        for k,want in zip(('x','y'),row['pointExpected']):near(p[k],want)
    q=quantities(row['definitions']);projected=[]
    if q:
        prefix='codi-physical-parameters:1\n';raw=row['before']['capture']['native']['expressions'];require(raw.startswith(prefix) and json.loads(raw[len(prefix):])==row['definitions'],'actual authoritative typed source, not producer expectation only')
    for c in s['stages'][0]['constraints']:
        require(c['admission']['version']==1 and c['admission']['state'] in ('accepted','redundant'),'actual admitted classification');refs=c['objects'];k=c.get('constants',{});t=c['typeId']
        if t=='PCoincident':
            x,y=[points[id] for id in refs]
            for key in ('x','y'):near(x[key],y[key])
        elif t=='LockPoint':
            x=points[one(refs,'lock')]
            for key in ('x','y'):near(x[key],float(k[key]))
        elif t in ('Horizontal','Vertical','SegmentLength'):
            x=objects[one(refs,'ordinary Segment')];require(x['type']=='Segment','Segment schema owner');a0,b0=x['data']['a'],x['data']['b']
            if t=='SegmentLength':near(math.hypot(b0['x']-a0['x'],b0['y']-a0['y']),value(k['length'],q))
            else:near(b0['y' if t=='Horizontal' else 'x'],a0['y' if t=='Horizontal' else 'x'])
        elif t in ('SignedDistanceX','SignedDistanceY','DistancePP','ProjectedDistance'):
            x,y=[points[id] for id in refs[:2]];X,Y=y['x']-x['x'],y['y']-x['y']
            if t=='ProjectedDistance':
                require(len(refs)==3 and refs==[b['datumId'],b['pointId'],b['directionId']] and set(k)=={'distance'},'exact ordered three-reference projected identity');z=objects[refs[2]];require(z['type']=='Segment','source Segment direction');U,V=z['data']['a'],z['data']['b'];DX,DY=V['x']-U['x'],V['y']-U['y'];length=math.hypot(DX,DY);require(length>1e-9,'original projected domain');observed=(X*DX+Y*DY)/length;projected.append(c);require(str(k['distance'])==('projection' if q else str(row['projection'])),'authoritative named/literal constant preserved, not live reference readout')
            else:observed=X if t=='SignedDistanceX' else Y if t=='SignedDistanceY' else math.hypot(X,Y)
            near(observed,value(k['distance'],q))
        else:raise ValueError('Unexpected finite fixture schema '+t)
    require(len(projected)==int(row['hasProjection']),'actual projected row membership')
    if row['hasProjection']:near(projection,row['projection'])
    require(row['before']==row['after'],'read-only inspection exact preservation');r=row['before']['ownership']['resources'];require(not row['before']['ownership']['processing'] and not r['cleanupFailed'] and all(r[k]==0 for k in ('candidates','accepted','mounts')) and r['owners']==r['detached'],'actual settled ownership')
    return s

def check(directory):
    directory=Path(directory);r=json.loads((directory/'receipt.json').read_text());require(r['status']=='PASS','actual complete browser workflow PASS');require(r['ownedContextsRetired'] and r['sharedBrowserDisconnectedOnly'],'owned-only cleanup');require(r['sourcePins']==r['sourcePinsAfter'],'immutable executed source');require(not r['sourceSeeds'] and not r['privateAuthoring'] and not r['fakeReplies'],'public-only authoring')
    for s in r['sourceSnapshots']:require(hashlib.sha256((directory/s['file']).read_bytes()).hexdigest()==s['sha256'],'source snapshot hashes')
    for row in r['observations']:validate(row)
    directions=[row for row in r['observations'] if row['label'].startswith('Live direction')];require(len(directions)==6,'all actual rotation/reversal checkpoints');require(any(x['end']==[10,20] for x in directions) and any(x['end']==[10,0] for x in directions),'actual +Y and -Y directions');require(all(x['projection']==3 for x in directions),'driving constant stays3; no reference-value substitution')
    combined=one([x for x in r['observations'] if x['pointExpected']==[-3,4] and x['hasProjection']],'signed(-3,4), length5 combined source');near(combined['projection'],-3)
    for row in r['refusals']:require(normalized(row['before'])==normalized(row['after']) and not row['error']['committed'] and not row['error']['possiblyCommitted'],'exact refusal except four opaque currentness tokens')
    labels=[x['label'] for x in r['refusals']];require(all(any(s in label for label in labels) for s in ('Stale','Zero live direction','contradicts retained Euclidean5','numeric erasure','Undefined','Wrong dimension','Cyclic')),'complete finite refusal inventory')
    noop=one([x for x in r['rows'] if x['label']=='Exact no-op preserves source/J/redo'],'actual no-op');require(noop['before']==noop['after'] and noop['before']['capture']['journal']['canRedo'] and not noop['noop']['changed'],'no-op retains actual redo')
    require(any(c['command']=='remove-closed-sketch-dimension' and c.get('result',{}).get('dimension',{}).get('typeId')=='ProjectedDistance' and c['result']['dimension']['status']=='removed' for c in r['commands']),'actual discovered projected removal')
    require(len(r['saves'])==3,'three .cad Save/server/fresh Open cycles');archives=[]
    for item in r['saves']:
        archive=read_archive(directory/item['savedFile']);require(archive['sha256']==item['sha256'] and archive['bytes']==item['bytes'],'actual server/local bytes and independent ZIP32 CRC/hash');envelope=archive['envelope'];require(envelope['unit']=='millimeter','physical unit remains canonical');project=envelope['project'];model=project['model'];native=item['before']['capture']['native'];require(model['history']==native['history'] and model['counters']==native['counters'] and model['expressions']==native['expressions'],'one exact authored graph/highwater/typed source');require(envelope.get('presentation')==native['presentation'],'saved presentation exact');saved=one([s for s in project['sketches'] if s['id']==item['b']['faceId']],'native saved source');require(saved['data']==source(item['before'],item['b']),'exact complete source/IDs/constant/name/branch persisted');require(len(model['history'])==1 and model['history'][0]['type']=='PLANE','one genuine source producer, no private geometry seed/BRep substitute');archives.append({'file':item['savedFile'],'sha256':archive['sha256'],'designRevision':archive['manifest']['designRevision']})
    return {'status':'PASS','scope':'finite live Segment ProjectedDistance driving edit/remove/named length/original equations/.cad; not arbitrary reference role or global DOF','observations':len(r['observations']),'refusals':len(r['refusals']),'archives':archives}
if __name__=='__main__':print(json.dumps(check(sys.argv[1]),indent=2))
