#!/usr/bin/env python3
"""Independent AFTER-WHOLE fixture oracle. No production solver/codec import.
Actual original point equations + exact rational point-subproblem rank, actual
Native material observations and ZIP/CRC/SHA/designRevision checked .cad bytes.
"""
import hashlib,json,math,sys
from fractions import Fraction as F
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive

def require(ok,text):
    if not ok:raise ValueError(text)
def one(rows,label):require(len(rows)==1,'one '+label);return rows[0]
def near(a,b,t=5e-8):require(type(a) in (int,float) and math.isfinite(a) and abs(a-b)<=t,f'{a} differs from {b}; budget {t}')
def rank(rows):
    a=[[F(v) for v in row] for row in rows];r=0
    for j in range(6):
        p=next((i for i in range(r,len(a)) if a[i][j]),None)
        if p is None:continue
        a[r],a[p]=a[p],a[r];v=a[r][j];a[r]=[x/v for x in a[r]]
        for i in range(len(a)):
            if i!=r and a[i][j]:v=a[i][j];a[i]=[x-v*y for x,y in zip(a[i],a[r])]
        r+=1
    return r

def source_geometry(state,binding,stage,q):
    s=json.loads(state['capture']['native']['source']);require(s['version']==3 and len(s['objects'])==7 and len(s['stages'])==1 and not s['stages'][0]['generators'],'ordinary actual source')
    require(s['metadata']['boundaryFrame']=={'origin':[0,0,0],'x':[1,0,0],'y':[0,1,0],'z':[0,0,1]} and all(not v for v in s['boundary'].values()),'canonical genuine source frame/no seeded boundary')
    objects={o['id']:o for o in s['objects']};require(len(objects)==7,'unique actual root identities');rectangle=[objects[id] for id in binding['rectangleIds']];require(len(rectangle)==4 and all(o['type']=='Segment' for o in rectangle),'actual rectangle')
    expected={((0,0),(100,0)),((100,0),(100,50)),((100,50),(0,50)),((0,50),(0,0))};actual={(tuple(o['data']['a'][k] for k in ('x','y')),tuple(o['data']['b'][k] for k in ('x','y'))) for o in rectangle};require(actual==expected,'EXACT original rectangle/datum; no tolerance waiver')
    expectedB={'x':10,'y':20} if stage=='free' else {'x':0,'y':0};expectedC={'x':30,'y':40} if stage in ('free','ab') else {'x':0,'y':0}
    for key,wanted in (('bRootId',expectedB),('cRootId',expectedC),('qRootId',q)):
        o=objects[binding[key]];require(o['type']=='Point' and set(o['data'])=={'x','y'},'actual standalone Point')
        for axis in ('x','y'):near(o['data'][axis],wanted[axis])
    require(objects[binding['qRootId']]['data']==q,'unrelated actual Q exact')
    return s,objects

def equations(s,i,binding,stage):
    objects={o['id']:o for o in s['objects']};points={}
    for p in i['points']:
        parent=objects[p['parentId']];choices=[parent['data']] if parent['type']=='Point' else [parent['data'][key] for key in ('a','b')]
        value=one([q for q in choices if math.hypot(q['x']-p['x'],q['y']-p['y'])<=5e-8],'saved source endpoint associated by actual discovered parent/coordinates');require(p['id'] not in points,'unique actual point ID');points[p['id']]=value
    A=points[binding['aId']];require(A=={'x':0,'y':0},'authentic locked datum exact')
    roots={binding['bId']:binding['bRootId'],binding['cId']:binding['cRootId'],binding['qId']:binding['qRootId']}
    for id,root in roots.items():require(points[id]==objects[root]['data'],'actual returned source/point binding without ID grammar')
    columns={(id,axis):n*2+j for n,id in enumerate(roots) for j,axis in enumerate(('x','y'))};linear=[];extras=[]
    constraints=s['stages'][0]['constraints'];require(len(i['constraints'])==len(constraints),'actual public constraint census')
    for index,c in enumerate(constraints):
        require(c['stage']==0 and c['admission']['version']==1 and c['admission']['state'] in ('accepted','redundant'),'actual admitted source row');public=i['constraints'][index];require(public['index']==index and public['stage']==0 and public['typeId']==c['typeId'] and public['objects']==c['objects'] and public['constants']==c.get('constants',{}) and public['admission']==c['admission'],'public/source exact row association')
        refs,typ,k=c['objects'],c['typeId'],c.get('constants',{})
        if typ=='PCoincident':
            a,b=[points[id] for id in refs]
            for axis in ('x','y'):near(a[axis],b[axis])
            if any(id in roots for id in refs):
                require(k=={} and all(id==binding['aId'] or id in roots for id in refs),'no fabricated hidden point constraint');extras.append(c)
                for axis in ('x','y'):
                    row=[0]*6
                    for id,sign in zip(refs,(1,-1)):
                        if id in roots:row[columns[(id,axis)]]+=sign
                        else:require(points[id][axis]==0,'actual fixed datum substituted, not guessed state')
                    linear.append(row)
        elif typ=='LockPoint':
            p=points[one(refs,'actual lock')]
            for axis in ('x','y'):near(p[axis],float(k[axis]))
        elif typ in ('Horizontal','Vertical','SegmentLength'):
            o=objects[one(refs,'segment target')];require(o['type']=='Segment','actual Segment equation');a,b=o['data']['a'],o['data']['b']
            if typ=='SegmentLength':near(math.hypot(b['x']-a['x'],b['y']-a['y']),float(k['length']))
            else:near(a['y' if typ=='Horizontal' else 'x'],b['y' if typ=='Horizontal' else 'x'])
        else:raise ValueError('Unexpected retained fixture schema '+typ)
    expected=[] if stage=='free' else [[binding['aId'],binding['bId']]] if stage=='ab' else [[binding['aId'],binding['bId']],[binding['bId'],binding['cId']]] if stage=='chain' else [[binding['aId'],binding['bId']],[binding['bId'],binding['cId']],[binding['aId'],binding['cId']]]
    require([c['objects'] for c in extras]==expected,'new distinct original-order rows; no reversed duplicate/weld')
    require([c['admission']['state'] for c in extras]==(['accepted']*min(2,len(expected))+(['redundant'] if len(expected)==3 else [])),'actual transitive redundant row')
    return 6-rank(linear)

def settled(state):
    r=state['ownership']['resources'];require(state['ownership']['processing'] is False and r['cleanupFailed'] is False and all(r[k]==0 for k in ('candidates','accepted','mounts')) and r['owners']==r['detached'],'actual resources retired')
def native(state,binding,depth,build):
    b=one(state['capture']['solids']['bodies'],'actual Native body');m=b['metrics'];require(b['id']==binding['body']['outputId'] and b['featureId']==binding['body']['featureId'],'same actual producer/output IDs');require(m['nativeValidity']['valid'] is True and m['solidCount']==1 and m['resultKind']=='single-solid','actual Native facts');require('sha256:'+m['runtime']['jsSha256']+':'+m['runtime']['wasmSha256']==build,'actual Native build');near(m['nativeVolume'],100*50*depth,1e-6)
    for key,wanted in {'min':[0,0,0],'max':[100,50,depth]}.items():
        for a,b in zip(m['nativeBounds'][key],wanted):near(a,b,1e-6)
def classify(point,depth):
    if any(v<0 or v>maximum for v,maximum in zip(point,(100,50,depth))):return 'outside'
    if any(v in (0,maximum) for v,maximum in zip(point,(100,50,depth))):return 'boundary'
    return 'inside'
def check(directory):
    directory=Path(directory);r=json.loads((directory/'receipt.json').read_text());require(r['status']=='PASS','complete browser workflow PASS required');require(r['ownedContextsRetired'] and r['sharedBrowserDisconnectedOnly'] and r['sourcePins']==r['sourcePinsAfter'],'owned-only cleanup/executed source unchanged');require(r['sourceSeeds'] is False and r['privateAuthoring'] is False and r['fakeReplies'] is False,'normal public workflow')
    for p in r['sourceSnapshots']:require(hashlib.sha256((directory/p['file']).read_bytes()).hexdigest()==p['sha256'],'executed source snapshot')
    points=0;states={}
    for row in r['observations']:
        state=row['before'];require(state==row['after'],'same-window full source/history/J/dirty/tokens/resources unchanged by read');settled(state);s,_=source_geometry(state,row['binding'],row['stage'],row['q']);nullity=equations(s,row['inspection'],row['binding'],row['stage']);states[row['stage']]=nullity;native(state,row['binding'],row['depth'],r['engineRevision']);query=row['query'];request=row['input'];require(query['quality']=='native-re-evaluation-observation','actual Native re-evaluation')
        for key in ('revision','bodyId','featureId','unit','engine','engineRevision'):require(query[key]==request[key],'actual point query binding')
        require(query['points']==[{'point':p,'classification':classify(p,row['depth'])} for p in request['points']],'independent analytic Native material/void/boundary classes');points+=len(query['points'])
    require(states=={'free':6,'ab':4,'chain':2,'cycle':2},'all finite exact linear point states observed')
    require(len(r['diagnostics'])==4,'actual local reports for all four finite states')
    for row in r['diagnostics']:
        require(row['before']==row['after'],'diagnostic readonly');report=row['report'];d=report['localJacobian'];expected=states[row['stage']];require(report['scope']=='current-sketch-local-estimate' and report['status']=='estimated' and d['localNullity']==row['expected']==expected,'real local report corroborates independent original linear rank');require(report.get('physicalDof') is None,'no global physicalDOF assertion')
    for row in r['noops']:require(row['before']==row['after'] and row['result']['changed'] is False and row['result']['authoredUndo'] is False and row['result']['relation']['existing'] is True and row['result']['relation']['objects']==row['actualObjects'],'unordered no-op preserves exact actual row/J/order')
    require(any(row['ids']==[r['binding']['bId'],r['binding']['aId']] for row in r['noops']),'actual reversed pair tested')
    for row in r['refusals']:require(row['before']==row['after'] and row['error']['committed'] is False and row['error']['possiblyCommitted'] is False,'actual refusal atomicity')
    require(len(r['refusals'])==4,'signed conflict/alias/unknown/stale cases');require(one([row for row in r['refusals'] if 'signed X1' in row['label']],'actual contradictory row')['error']['code']=='DISTANCE_CONFLICT','precise real admission refusal; do not infer numerical failure as contradiction')
    # Independent finite contradiction: PCoincident imposes xB-xA=0, requested
    # actual SignedDistanceX imposes xB-xA=1. Subtracting yields0=1, regardless
    # of whether a particular solver diagnostic classifies an exact reduced row.
    artifacts=[];require(len(r['saves'])==3,'three genuine native Save/freshOpen cycles')
    for item in r['saves']:
        archive=read_archive(directory/item['savedFile']);require(archive['sha256']==item['sha256'] and archive['bytes']==item['bytes'],'actual .cad bytes');p=archive['envelope']['project'];before=item['before'];model=p['model'];require(model['history']==before['capture']['native']['history'] and model['counters']==before['capture']['native']['counters'] and model['expressions']==before['capture']['native']['expressions'],'one exact saved authored history/counters/expressions');s=one([s['data'] for s in p['sketches'] if s['id']==item['binding']['faceId']],'actual saved source');require(s==json.loads(before['capture']['native']['source']),'complete coincidence/source/annotations/IDs preserved, no second model');source_geometry(before,item['binding'],item['stage'],item['q']);require(archive['envelope'].get('presentation')==before['capture']['native']['presentation'],'native presentation preserved');require(len(model['history'])==2 and model['history'][0]['type']=='PLANE' and model['history'][1]['type']=='WORKER_SELECTED_PROFILE_EXTRUDE_V2','one actual plane/part graph');params=model['history'][1]['params'];b=item['binding'];require(params['featureId']==b['body']['featureId'] and params['faceId']==b['faceId'] and params['regionId']==b['regionId'] and params['engineRevision']==r['engineRevision'] and params['depth']==item['depth'],'actual saved feature/region/build/editeddepth');native(before,b,item['depth'],r['engineRevision']);artifacts.append({'file':item['savedFile'],'sha256':archive['sha256'],'designRevision':archive['manifest']['designRevision']})
    return{'status':'PASS','scope':'finite actual point coincidence/original equations/local linear rank/shared Native/.cad chain; not completeC03/C04/Gate1','observations':len(r['observations']),'nativePoints':points,'exactPointNullities':states,'archives':artifacts}
if __name__=='__main__':print(json.dumps(check(sys.argv[1]),indent=2))
