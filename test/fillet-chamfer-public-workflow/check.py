#!/usr/bin/env python3
"""AFTER-WHOLE only: independent actual source/analytic BRep/point/ZIP checks.
No production codec, planner, solver, recipe or Native implementation imported.
"""
import json,math,hashlib,sys
from pathlib import Path
from decimal import Decimal,localcontext
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive
PI=Decimal('3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651')
MASKS=((True,False,True,False),(False,True,False,True))
def need(ok,msg):
    if not ok:raise ValueError(msg)
def one(xs,msg):need(len(xs)==1,'one '+msg);return xs[0]
def near(x,y,t=5e-8):need(type(x) in (int,float) and math.isfinite(x) and abs(x-float(y))<=t,f'{x} differs from {y}, budget {t}')
def settled(s):
    r=s['ownership']['resources'];need(not s['ownership']['processing'] and not r['cleanupFailed'] and all(r[k]==0 for k in ('candidates','accepted','mounts')) and r['owners']==r['detached'],'actual candidate/native resources retired');need(s['manufacturing'] is None,'no hidden material publication')
def source(s,b):return json.loads(one([x for x in s['capture']['native']['sketches'] if x['id']==b['faceId']],'actual source')['source'])
def rectangle(s,b,d,i):
    need(s['version']==3 and len(s['objects'])==4 and len(s['stages'])==1 and not s['stages'][0]['generators'] and len(s['stages'][0]['constraints'])==11,'original ordinary four-Segment/11-row declaration');need(all(not x for x in s['boundary'].values()),'no external source');need(s['metadata']['boundaryFrame']=={'origin':[0,0,0],'x':[1,0,0],'y':[0,1,0],'z':[0,0,1]},'actual XY frame');objects={o['id']:o for o in s['objects']};need(set(objects)==set(b['sourceCurveIds']) and len(objects)==4,'exact discovered source IDs');corners=[(0,0),(d['width'],0),(d['width'],d['height']),(0,d['height'])];counts={p:0 for p in corners};edges=set()
    for o in objects.values():
        need(o['type']=='Segment' and o['role'] is None and o['stage']==0,'ordinary original Segment');end=[]
        for p in (o['data']['a'],o['data']['b']):
            match=one([q for q in corners if abs(q[0]-p['x'])<=5e-8 and abs(q[1]-p['y'])<=5e-8],'actual rectangle corner');counts[match]+=1;end.append(match)
        edges.add(frozenset(end))
    need(all(n==2 for n in counts.values()) and edges=={frozenset([corners[j],corners[(j+1)%4]]) for j in range(4)},'actual simple four-sided boundary')
    points={}
    for p in i['points']:
        o=objects[p['parentId']];points[p['id']]=one([q for q in o['data'].values() if abs(q['x']-p['x'])<=5e-8 and abs(q['y']-p['y'])<=5e-8],'actual endpoint ownership')
    for c in s['stages'][0]['constraints']:
        need(c['admission']['state'] in ('accepted','redundant'),'solver-derived actual admission');t=c['typeId'];refs=c['objects'];k=c.get('constants',{})
        if t=='PCoincident':
            a,bp=[points[id] for id in refs]
            for axis in ('x','y'):near(a[axis],bp[axis])
        elif t=='LockPoint':
            p=points[one(refs,'lock')]
            for axis in ('x','y'):near(p[axis],float(k[axis]))
        elif t in ('Horizontal','Vertical','SegmentLength'):
            o=objects[one(refs,'Segment')];a,bp=o['data']['a'],o['data']['b']
            if t=='SegmentLength':near(math.dist((a['x'],a['y']),(bp['x'],bp['y'])),float(k['length']))
            else:near(a['y' if t=='Horizontal' else 'x'],bp['y' if t=='Horizontal' else 'x'])
        else:raise ValueError('Unexpected fixture schema '+t)
    return s
HOLE={'version','unit','engine','engineRevision','featureId','target','producerFeatureId','sourceFeatureId','sourceFaceId','sourceRegionId','kind','diameter'}
EDGE={'version','unit','engine','engineRevision','featureId','target','producerFeatureId','kind','edgeIds','size'}
def intent_history(state,b,d,build):
    h=state['capture']['native']['history'];need(len(h)==4+bool(d['fillet'])+bool(d['chamfer']) and h[0]['type']=='PLANE','exact authored graph, no private tools/history');need(h[0]['params']['orientation']=='XY' and h[0]['params']['depth']==0 and h[0]['params'].get('datum') is None,'actual principal source placement');p=h[1]['params'];need(h[1]['type']=='WORKER_SELECTED_PROFILE_EXTRUDE_V2' and len(p)==9 and p['featureId']==b['profile']['featureId'] and p['faceId']==b['faceId'] and p['regionId']==b['regionId'] and p['depth']==d['depth'] and p['engineRevision']==build and p['bodyPolicy']=='separate','actual original profile intent')
    for at,name,kind,parent,diameter in ((2,'center','centered-through',b['profile'],10),(3,'corners','four-corner-through',b['center'],4)):
        c=h[at];p=c['params'];need(c['type']=='WORKER_THROUGH_HOLES_V1' and set(p)==HOLE|({'offsetX','offsetY'} if name=='corners' else set()),'exact semantic hole fields');need(p['featureId']==b[name]['featureId'] and p['target']==parent['outputId'] and p['producerFeatureId']==parent['featureId'] and p['sourceFeatureId']==b['profile']['featureId'] and p['sourceFaceId']==b['faceId'] and p['sourceRegionId']==b['regionId'] and p['engineRevision']==build and p['kind']==kind and p['diameter']==diameter,'real source/producer binding');
        if name=='corners':need(p['offsetX']==8 and p['offsetY']==8,'actual source-relative corner offsets')
    for at,name,kind,parent,ids in ((4,'fillet','fillet',b['corners'],b['filletEdges']),(5,'chamfer','chamfer-equal',b.get('fillet'),b['chamferEdges'])):
        if not d[name]:continue
        c=h[at];p=c['params'];need(c['type']=='WORKER_SOLID_EDGE_TREATMENT_V1' and set(p)==EDGE and p['kind']==kind and p['size']==d[name] and p['featureId']==b[name]['featureId'] and p['target']==parent['outputId'] and p['producerFeatureId']==parent['featureId'] and p['edgeIds']==ids and p['engineRevision']==build,'exact original treatment intent/opaque edges/producer')
    for op in h[1:]:need(op['params']['version'] in (1,2) and op['params']['unit']=='millimeter' and op['params']['engine']=='occ','explicit canonical units/engine')
def selection(b):
    rows=b['connectors'];need(len(rows)==4 and len({e['id'] for e in rows})==4,'four actual opaque connectors');curves=set();counts={}
    for e in rows:
        need(e['role']=='connector' and e['geometry']=='line' and e['originFeatureId']==b['profile']['featureId'] and len(e['incidentCurveIds'])==2 and len(set(e['incidentCurveIds']))==2,'actual source incidence');
        for id in e['incidentCurveIds']:need(type(id) is str and 0<len(id)<=16384,'bounded opaque authored ID');curves.add(id);counts[id]=counts.get(id,0)+1
    need(len(curves)==4 and all(n==2 for n in counts.values()),'source four-cycle incidence');byId={e['id']:e for e in rows};f=b['filletEdges'];c=b['chamferEdges'];need(len(f)==len(c)==2 and set(f).isdisjoint(c) and set(f+c)==set(byId),'actual two complementary pairs');need(set(byId[f[0]]['incidentCurveIds']).isdisjoint(byId[f[1]]['incidentCurveIds']) and set(byId[c[0]]['incidentCurveIds']).isdisjoint(byId[c[1]]['incidentCurveIds']),'actual opposite pair without parsing identities')
def pointclass(point,d,mask):
    x,y,z=point;w,h,t=d['width'],d['height'],d['depth'];r,c=d['fillet'],d['chamfer']
    if x<0 or x>w or y<0 or y>h or z<0 or z>t:return 'outside'
    boundary=x in (0,w) or y in (0,h) or z in (0,t)
    for cx,cy,rad in ((w/2,h/2,5),(8,8,2),(w-8,8,2),(w-8,h-8,2),(8,h-8,2)):
        q=(x-cx)**2+(y-cy)**2
        if q<rad*rad:return 'outside'
        if q==rad*rad:boundary=True
    for at,(u,v) in enumerate(((x,y),(w-x,y),(w-x,h-y),(x,h-y))):
        if mask[at] and r and u<r and v<r:
            q=(u-r)**2+(v-r)**2
            if q>r*r:return 'outside'
            if q==r*r:boundary=True
        if not mask[at] and c:
            if u+v<c:return 'outside'
            if u+v==c:boundary=True
    return 'boundary' if boundary else 'inside'
def normalized(s):
    s=json.loads(json.dumps(s))
    for v in (s['capture']['solids'],s['capture']['journal'],s['host']):v.pop('revision',None)
    return s
def native_intent(s):return{k:v for k,v in s['capture']['native'].items() if k!='materialRevision'}
def check(directory):
    root=Path(directory);r=json.loads((root/'receipt.json').read_text());need(r['status']=='PASS','complete public workflow PASS first');need(r['sourcePins']==r['sourcePinsAfter'] and r['ownedContextsRetired'] and r['sharedBrowserDisconnectedOnly'],'immutable source and owned cleanup');need(not any(r[k] for k in ('sourceSeeds','privateAuthoring','fakeReplies')),'genuine authoring');
    for row in r['sourceSnapshots']:need(hashlib.sha256((root/row['file']).read_bytes()).hexdigest()==row['sha256'],'actual executed source snapshots')
    diagonal=None;observations=[];points=0
    for row in r['observations']:
        need(row['before']==row['after'],'exact same-window accepted read-only state/tokens');s=row['before'];settled(s);b,d=row['binding'],row['dimensions'];selection(b);rectangle(source(s,b),b,d,row['inspection']);intent_history(s,b,d,r['engineRevision']);body=one(s['capture']['solids']['bodies'],'actual Native output');target=b['chamfer'] if d['chamfer'] else b['fillet'] if d['fillet'] else b['corners'];need(body['id']==target['outputId'] and body['featureId']==target['featureId'],'actual producer/body');m=body['metrics'];need(m['nativeValidity']['valid'] and m['solidCount']==1 and m['resultKind']=='single-solid' and 'sha256:'+m['runtime']['jsSha256']+':'+m['runtime']['wasmSha256']==r['engineRevision'],'actual valid exact-build Native solid')
        with localcontext() as ctx:
            ctx.prec=110;w,h,t,fr,cr=[Decimal(str(d[k])) for k in ('width','height','depth','fillet','chamfer')];v=w*h*t-41*PI*t-2*t*fr*fr*(1-PI/4)-t*cr*cr
        near(m['nativeVolume'],v,1e-6)
        for k,vs in {'min':[0,0,0],'max':[d['width'],d['height'],d['depth']]}.items():
            for x,y in zip(m['nativeBounds'][k],vs):near(x,y,1e-7)
        treated=2*bool(d['fillet'])+2*bool(d['chamfer'])
        for k,vv in {'faces':11+treated,'edges':27+3*treated,'vertices':18+2*treated}.items():need(m['nativeTopology']['counts'][k]==vv,'independent analytic census '+k)
        request,q=row['input'],row['query'];need(q['quality']=='native-re-evaluation-observation','actual Native observation');need(len(request['points'])==25,'all finite bore/treatment/material probes')
        for k in ('revision','version','unit','engine','engineRevision','bodyId','featureId'):need(q[k]==request[k],'actual current query binding')
        matching=[at for at,mask in enumerate(MASKS) if q['points']==[{'point':p,'classification':pointclass(p,d,mask)} for p in request['points']]];need(matching,'no arbitrary post-failure geometry/oracle choice')
        if d['fillet']:
            need(len(matching)==1,'fillet/chamfer probes distinguish the two diagonals')
            if diagonal is None:diagonal=matching[0]
            need(matching[0]==diagonal and row['diagonal']==diagonal,'same immutable fillet edges retain spatial diagonal')
        elif diagonal is not None:need(row['diagonal']==diagonal,'accepted reference binding retained while creation undone')
        points+=len(request['points']);observations.append({'label':row['label'],'volumeMM3':str(v),'filletDiagonal':row['diagonal']})
    need([t['kind'] for t in r['creationTravel']]==['fillet','chamfer'],'both exact feature creations observed')
    for t in r['creationTravel']:
        before,created,undone,redone=t['before'],t['created'],t['undone'],t['redone'];j=created['capture']['journal'];feature=j['undoTarget']['featureId'];need(j['undoTarget']['kind']=='operation-append' and j['undoTarget']['operationType']=='WORKER_SOLID_EDGE_TREATMENT_V1','actual treatment append');op=created['capture']['native']['history'][-1];need(op['params']['featureId']==feature and op['params']['kind']==('fillet' if t['kind']=='fillet' else 'chamfer-equal'),'Undo targets the actual named feature, not unrelated operation');need(not any(o['params']['featureId']==feature for o in undone['capture']['native']['history']),'actual feature removed');wanted=native_intent(before);wanted['counters']=created['capture']['native']['counters'];need(native_intent(undone)==wanted and native_intent(redone)==native_intent(created),'exact predecessor/source/IDs and Redo same intent');need(undone['capture']['journal']['redoTarget']['featureId']==feature,'exact Redo target')
        for k in ('scope','canUndo','canRedo','undoTarget','redoTarget'):need(redone['capture']['journal'][k]==j[k],'restored chronology')
    need([x['error']['code'] for x in r['refusals']]==['EDGE_TREATMENT_FAILED',None,'STALE_HISTORY','UNRESOLVED_SELECTION'],'exact source-confirmed refusal layers')
    for row in r['refusals']:need(normalized(row['before'])==normalized(row['after']) and not row['error']['committed'] and not row['error']['possiblyCommitted'],'accepted state refusal preservation')
    need(len(r['saves'])==3 and len(r['reopens'])==3,'three normal .cad Save/fresh Open cycles');archives=[]
    for item in r['saves']:
        arc=read_archive(root/item['savedFile']);need(arc['sha256']==item['sha256'] and arc['bytes']==item['bytes'],'actual server/archive CRC/SHA/design revision');env=arc['envelope'];model=env['project']['model'];native=item['before']['capture']['native'];need(model['history']==native['history'] and model['counters']==native['counters'] and model['expressions']==native['expressions'],'one authored graph/highwater/source');need(env.get('manufacturing')==item['before']['manufacturing'] and env.get('presentation')==native['presentation'],'exact metadata');need(env['project']['sketches']==[{'id':item['binding']['faceId'],'data':source(item['before'],item['binding'])}],'original source only, no tool sketches');intent_history(item['before'],item['binding'],item['dimensions'],r['engineRevision']);need(item['after']['capture']==item['before']['capture'],'Save preserves accepted intent/model/J');archives.append({'file':item['savedFile'],'sha256':arc['sha256'],'designRevision':arc['manifest']['designRevision']})
    for item in r['reopens']:
        for k in ('history','source','sketches','expressions','counters','presentation'):need(item['opened']['capture']['native'][k]==item['before']['capture']['native'][k],'fresh Open exact '+k)
        need(not item['opened']['capture']['journal']['canUndo'] and not item['opened']['capture']['journal']['canRedo'],'fresh session Undo reset')
    return {'status':'PASS','scope':'finite E11 explicit fillet/chamfer creation travel/source/native material/three .cad cycles; not broader C06/Gate1','filletDiagonal':diagonal,'nativePoints':points,'observations':observations,'archives':archives}
if __name__=='__main__':print(json.dumps(check(sys.argv[1]),indent=2))
