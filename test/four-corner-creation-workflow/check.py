#!/usr/bin/env python3
"""AFTER-WHOLE only. Independent ZIP/CRC/SHA/source/equation/analytic oracle.
No production codec, solver, native implementation, recipe or driver import.
"""
import hashlib,json,math,sys
from pathlib import Path
from decimal import Decimal,localcontext
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive
PI=Decimal('3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651')
def need(ok,msg):
    if not ok:raise ValueError(msg)
def one(xs,msg):need(len(xs)==1,'one '+msg);return xs[0]
def near(a,b,t=5e-8):need(type(a) in (int,float) and math.isfinite(a) and abs(a-float(b))<=t,f'{a} differs from {b}; budget {t}')
def settled(s):
    r=s['ownership']['resources'];need(not s['ownership']['processing'] and not r['cleanupFailed'] and all(r[k]==0 for k in ('candidates','accepted','mounts')) and r['owners']==r['detached'],'retired candidate ownership');need(s['manufacturing'] is None,'no hidden manufacturing publication')
def source(s,b):return json.loads(one([x for x in s['capture']['native']['sketches'] if x['id']==b['faceId']],'actual source')['source'])
def check_source(s,b,d,inspection):
    need(s['version']==3 and len(s['objects'])==4 and len(s['stages'])==1,'exact ordinary source');stage=s['stages'][0];need(not stage['generators'] and len(stage['constraints'])==11,'actual original rectangle declaration');need(all(not x for x in s['boundary'].values()),'no external boundary');need(s['metadata']['boundaryFrame']=={'origin':[0,0,0],'x':[1,0,0],'y':[0,1,0],'z':[0,0,1]},'actual XY frame');objects={o['id']:o for o in s['objects']};need(len(objects)==4 and set(objects)==set(b['curveIds']),'exact discovered original IDs');expected=[(0,0),(d['width'],0),(d['width'],d['height']),(0,d['height'])];counts={p:0 for p in expected};edges=set()
    for o in objects.values():
        need(o['type']=='Segment' and o['role'] is None and o['stage']==0,'only original real Segments');ends=[]
        for p in [o['data']['a'],o['data']['b']]:
            match=one([q for q in expected if abs(p['x']-q[0])<=5e-8 and abs(p['y']-q[1])<=5e-8],'true rectangle corner');counts[match]+=1;ends.append(match)
        edges.add(frozenset(ends))
    need(all(c==2 for c in counts.values()) and edges=={frozenset([expected[i],expected[(i+1)%4]]) for i in range(4)},'one exact original four-edge loop, no hidden geometry')
    points={}
    for p in inspection['points']:
        o=objects[p['parentId']];choice=one([q for q in o['data'].values() if abs(q['x']-p['x'])<=5e-8 and abs(q['y']-p['y'])<=5e-8],'actual parent endpoint');points[p['id']]=choice
    for c in stage['constraints']:
        need(c['admission']['state'] in ('accepted','redundant'),'solver-derived accepted intent');typ=c['typeId'];refs=c['objects'];k=c.get('constants',{})
        if typ=='PCoincident':
            a,bp=[points[id] for id in refs]
            for axis in ('x','y'):near(a[axis],bp[axis])
        elif typ=='LockPoint':
            p=points[one(refs,'actual lock')]
            for axis in ('x','y'):near(p[axis],float(k[axis]))
        elif typ in ('Horizontal','Vertical','SegmentLength'):
            o=objects[one(refs,'actual Segment')];a,bp=o['data']['a'],o['data']['b']
            if typ=='SegmentLength':near(math.hypot(a['x']-bp['x'],a['y']-bp['y']),float(k['length']))
            else:near(a['y' if typ=='Horizontal' else 'x'],bp['y' if typ=='Horizontal' else 'x'])
        else:raise ValueError('Unexpected source schema '+typ)
    return s
COMMON={'version','unit','engine','engineRevision','featureId','target','producerFeatureId','sourceFeatureId','sourceFaceId','sourceRegionId','kind','diameter'}
def history(s,b,d,has_corners,build):
    h=s['capture']['native']['history'];need(len(h)==(4 if has_corners else 3) and h[0]['type']=='PLANE','one plane/profile/center/optional corner, no hidden authored tools');profile=h[1];need(profile['type']=='WORKER_SELECTED_PROFILE_EXTRUDE_V2','actual original feature type');p=profile['params'];need(len(p)==9 and p['featureId']==b['profile']['featureId'] and p['faceId']==b['faceId'] and p['regionId']==b['regionId'] and p['engineRevision']==build and p['depth']==d['depth'] and p['bodyPolicy']=='separate','exact original extrusion intent')
    for index,key,kind,diameter,parent,extra in [(2,'center','centered-through',10,b['profile'],set())]+([(3,'corners','four-corner-through',d['diameter'],b['center'],{'offsetX','offsetY'})] if has_corners else []):
        op=h[index];p=op['params'];need(op['type']=='WORKER_THROUGH_HOLES_V1' and set(p)==COMMON|extra,'exact authored native hole fields');need(p['version']==1 and p['unit']=='millimeter' and p['engine']=='occ' and p['engineRevision']==build and p['kind']==kind and p['diameter']==diameter,'hole kind/domain/runtime');need(p['featureId']==b[key]['featureId'] and p['target']==parent['outputId'] and p['producerFeatureId']==parent['featureId'] and p['sourceFeatureId']==b['profile']['featureId'] and p['sourceFaceId']==b['faceId'] and p['sourceRegionId']==b['regionId'],'verbatim actual binding, no identity grammar');
        if extra:need(p['offsetX']==d['offsetX'] and p['offsetY']==d['offsetY'],'exact corner offsets')
def centers(d):return [(d['offsetX'],d['offsetY']),(d['width']-d['offsetX'],d['offsetY']),(d['width']-d['offsetX'],d['height']-d['offsetY']),(d['offsetX'],d['height']-d['offsetY'])]
def pointclass(p,d,has_corners):
    x,y,z=p;w,h,t=d['width'],d['height'],d['depth']
    if x<0 or x>w or y<0 or y>h or z<0 or z>t:return 'outside'
    bores=[(w/2,h/2,5)]+[(cx,cy,d['diameter']/2) for cx,cy in centers(d)]*has_corners
    boundary=x in (0,w) or y in (0,h) or z in (0,t)
    for cx,cy,r in bores:
        q=(x-cx)**2+(y-cy)**2
        if q<r*r:return 'outside'
        if q==r*r:boundary=True
    return 'boundary' if boundary else 'inside'
def native(s,b,d,has_corners,build):
    body=one(s['capture']['solids']['bodies'],'one actual BRep output');target=b['corners' if has_corners else 'center'];need(body['id']==target['outputId'] and body['featureId']==target['featureId'],'actual output/producer');m=body['metrics'];need(m['nativeValidity']['valid'] is True and m['resultKind']=='single-solid' and m['solidCount']==1,'actual valid one solid');need('sha256:'+m['runtime']['jsSha256']+':'+m['runtime']['wasmSha256']==build,'exact Native build')
    with localcontext() as ctx:
        ctx.prec=110;w,h,t=[Decimal(str(d[k])) for k in ('width','height','depth')];volume=w*h*t-PI*t*(Decimal(25)+(Decimal(str(d['diameter']))**2 if has_corners else 0))
    near(m['nativeVolume'],volume,1e-6)
    for k,vs in {'min':[0,0,0],'max':[d['width'],d['height'],d['depth']]}.items():
        for x,y in zip(m['nativeBounds'][k],vs):near(x,y,1e-6)
    return str(volume)
def intent(s):return {k:v for k,v in s['capture']['native'].items() if k!='materialRevision'}
def refusal(s):
    s=json.loads(json.dumps(s));s['capture']['solids'].pop('revision');s['capture']['journal'].pop('revision');s['host'].pop('revision');return s
def check(directory):
    root=Path(directory);r=json.loads((root/'receipt.json').read_text());need(r['status']=='PASS','whole browser workflow must pass first');need(r['ownedContextsRetired'] and r['sharedBrowserDisconnectedOnly'] and r['sourcePins']==r['sourcePinsAfter'],'immutable source/owned cleanup');need(not any(r[k] for k in ('sourceSeeds','privateAuthoring','fakeReplies')),'public genuine workflow')
    for row in r['sourceSnapshots']:need(hashlib.sha256((root/row['file']).read_bytes()).hexdigest()==row['sha256'],'executed frozen bytes')
    results=[];points=0
    for row in r['observations']:
        s=row['before'];need(s==row['after'],'same-window exact accepted/read-only tokens/material/publication/source/J');settled(s);b,d=row['binding'],row['dimensions'];check_source(source(s,b),b,d,row['inspection']);history(s,b,d,row['corners'],r['engineRevision']);volume=native(s,b,d,row['corners'],r['engineRevision']);q=row['query'];request=row['input'];need(q['quality']=='native-re-evaluation-observation','real Native read')
        for k in ('revision','version','unit','engine','engineRevision','bodyId','featureId'):need(q[k]==request[k],'bound current request')
        need(len(request['points'])==(13 if row['corners'] else 9),'actual all-four-hole centers and adjacent material')
        need(q['points']==[{'point':p,'classification':pointclass(p,d,row['corners'])} for p in request['points']],'independent material/void/boundary classes');points+=len(q['points']);results.append({'label':row['label'],'volumeMM3':volume})
    t=r['creationTravel'];created,undone,redone=t['created'],t['undone'],t['redone'];before=t['before'];b=r['binding'];expected=intent(before);expected['counters']=created['capture']['native']['counters'];need(intent(undone)==expected and intent(redone)==intent(created),'exact immediate CORNER source/history/IDs restoration');need(undone['capture']['native']['counters']==created['capture']['native']['counters'],'monotonic high-water');need(created['capture']['journal']['undoTarget']['featureId']==b['corners']['featureId'] and undone['capture']['journal']['redoTarget']['featureId']==b['corners']['featureId'],'actual CORNER event, not center/pattern');need(len(before['capture']['native']['history'])==3 and len(created['capture']['native']['history'])==4 and len(undone['capture']['native']['history'])==3,'actual corner operation removed/reinserted')
    for k in ('scope','canUndo','canRedo','undoTarget','redoTarget'):need(redone['capture']['journal'][k]==created['capture']['journal'][k],'Redo restores actual journal chronology')
    need(len(r['refusals'])==4 and [x['error']['code'] for x in r['refusals']]==['HOLE_OUTSIDE_PROFILE','HOLES_OVERLAP','INVALID_REQUEST','STALE_HISTORY'],'precise finite refusal layers')
    for row in r['refusals']:need(refusal(row['before'])==refusal(row['after']) and not row['error']['committed'] and not row['error']['possiblyCommitted'],'atomic refusal except explicitly recorded opaque inspection revisions')
    need(len(r['saves'])==3 and len(r['reopens'])==3,'three real Save/server/fresh signed Open cycles');artifacts=[]
    for row in r['saves']:
        arc=read_archive(root/row['savedFile']);need(arc['sha256']==row['sha256'] and arc['bytes']==row['bytes'],'own browser/server archive SHA/size');env=arc['envelope'];model=env['project']['model'];s=row['before'];need(env['unit']=='millimeter' and model['history']==s['capture']['native']['history'] and model['counters']==s['capture']['native']['counters'] and model['expressions']==s['capture']['native']['expressions'],'exact actual authored saved domains');need(env.get('manufacturing')==s['manufacturing'] and env.get('presentation')==s['capture']['native']['presentation'],'exact metadata');need(env['project']['sketches']==[{'id':row['binding']['faceId'],'data':source(s,row['binding'])}],'one source including original intent and IDs');need(row['after']['capture']==s['capture'],'Save does not mutate accepted source/J/model');artifacts.append({'file':row['savedFile'],'sha256':arc['sha256'],'designRevision':arc['manifest']['designRevision']})
    for row in r['reopens']:
        for k in ('history','source','sketches','expressions','counters','presentation'):need(row['opened']['capture']['native'][k]==row['before']['capture']['native'][k],'fresh native preservation '+k)
        need(not row['opened']['capture']['journal']['canUndo'] and not row['opened']['capture']['journal']['canRedo'],'session Undo reset')
    return {'status':'PASS','scope':'finite E09 genuine corner creation/edit travel, analytic source/Native points and three independent .cad archive checks; not full C06/Gate1','observations':len(results),'nativePoints':points,'native':results,'archives':artifacts}
if __name__=='__main__':print(json.dumps(check(sys.argv[1]),indent=2))
