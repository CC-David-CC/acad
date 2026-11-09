#!/usr/bin/env python3
"""Independent AFTER-WHOLE source/equation/Native/ZIP oracle; no production imports."""
import json,math,hashlib,sys,re,copy
from fractions import Fraction
from decimal import Decimal,localcontext
from pathlib import Path
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive
PI=Decimal('3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651')
def need(ok,msg):
    if not ok:raise ValueError(msg)
def one(rows,msg):need(len(rows)==1,'one '+msg);return rows[0]
def near(x,y,t=5e-8):need(type(x) in (int,float) and math.isfinite(x) and abs(x-float(y))<=t,f'{x} != {y}, budget {t}')
def source(s,face):return json.loads(one([r for r in s['capture']['native']['sketches'] if r['id']==face],'actual source')['source'])
def settled(s):
    r=s['ownership']['resources'];need(not s['ownership']['processing'] and not r['cleanupFailed'] and all(r[k]==0 for k in ('candidates','accepted','mounts')) and r['owners']==r['detached'],'retired ownership');need(s['manufacturing'] is None,'no hidden material publication')
def constants(c):
    if 'constants' not in c:return {}
    v=c['constants'];need(type(v) is dict,'ordinary actual constant record');return v
def radius(o):return o['data']['r'] if o['type']=='Circle' else math.dist(tuple(o['data']['a'][k] for k in ('x','y')),tuple(o['data']['c'][k] for k in ('x','y')))
def equations(s,inspection,values):
    obj={o['id']:o for o in s['objects']};points={}
    for p in inspection['points']:
        o=obj[p['parentId']];d=o['data'];candidates=[d] if o['type']=='Point' else [d['c']] if o['type']=='Circle' else [d[k] for k in ('a','b','c') if k in d];points[p['id']]=one([v for v in candidates if abs(v['x']-p['x'])<=5e-8 and abs(v['y']-p['y'])<=5e-8],'actual original endpoint')
    def val(v):
        if type(v) in (int,float):return v
        if v in values:return values[v]
        return float(v)
    for stage in s['stages']:
        for c in stage['constraints']:
            need(c['admission']['state'] in ('accepted','redundant'),'solver-owned actual admission');t=c['typeId'];ids=c['objects'];k=constants(c)
            if t=='PCoincident':
                a,b=[points[id] for id in ids]
                for axis in ('x','y'):near(a[axis],b[axis])
            elif t=='LockPoint':
                p=points[one(ids,'lock')]
                for axis in ('x','y'):near(p[axis],val(k[axis]))
            elif t in ('Horizontal','Vertical','SegmentLength'):
                o=obj[one(ids,'Segment')];a,b=o['data']['a'],o['data']['b']
                if t=='SegmentLength':near(math.dist((a['x'],a['y']),(b['x'],b['y'])),val(k['length']))
                else:near(a['y' if t=='Horizontal' else 'x'],b['y' if t=='Horizontal' else 'x'])
            elif t in ('SignedDistanceX','SignedDistanceY'):
                a,b=[points[id] for id in ids];axis='x' if t=='SignedDistanceX' else 'y';near(b[axis]-a[axis],val(k['distance']))
            elif t=='RadiusLength':near(radius(obj[one(ids,'radius')]),val(k['length']))
            elif t=='EqualRadius':
                need(len(ids)==2 and ids[0]!=ids[1] and k=={},'actual constant-free pair');near(radius(obj[ids[0]]),radius(obj[ids[1]]))
            else:raise ValueError('Unexpected fixture schema '+t)
def source_check(row):
    s=source(row['before'],row['binding']['faceId']);b=row['binding'];need(s['version']==3 and len(s['objects'])==9 and len(s['stages'])==1 and not s['stages'][0]['generators'],'original four Segments/three Circles/Arc/Point');need(all(not x for x in s['boundary'].values()),'no source boundary seed');need(s['metadata']['boundaryFrame']=={'origin':[0,0,0],'x':[1,0,0],'y':[0,1,0],'z':[0,0,1]},'actual frame');obj={o['id']:o for o in s['objects']};need(len(obj)==9,'unique actual IDs');need(obj[b['unrelatedId']]['type']=='Point' and obj[b['unrelatedId']]['data']=={'x':77,'y':99},'exact unrelated Point');rectangle=[obj[id] for id in b['rectangleIds']];edges={(tuple(o['data']['a'][k] for k in ('x','y')),tuple(o['data']['b'][k] for k in ('x','y'))) for o in rectangle};need(edges=={((100,100),(110,100)),((110,100),(110,110)),((110,110),(100,110)),((100,110),(100,100))},'bit-exact unrelated original rectangle')
    for name,v in b['objects'].items():
        o=obj[v['id']];need(o['type']==v['kind'],'actual type');d=o['data'];near(d['c']['x'],v['center'][0]);near(d['c']['y'],v['center'][1]);near(radius(o),row['radii'][name]);need(o['role']==(None if name!='Q' or row['typed'] else 'construction'),'explicit authored Arc role boundary')
        if name=='Q':
            near(d['a']['x'],60+row['radii']['Q']);near(d['a']['y'],0);near(d['b']['x'],60);near(d['b']['y'],row['radii']['Q']);u=[d['a'][k]-d['c'][k] for k in ('x','y')];v=[d['b'][k]-d['c'][k] for k in ('x','y')];near(math.hypot(*v),row['radii']['Q']);near(math.atan2(u[0]*v[1]-u[1]*v[0],u[0]*v[0]+u[1]*v[1]),math.pi/2,1e-8)
    values={}
    if row['definition'] is not None:
        r=row['definition'];defs=[{'name':'baseRadius','dimension':'length','expression':'mm('+str(r)+')'},{'name':'namedRadius','dimension':'length','expression':'baseRadius'}];raw=row['before']['capture']['native']['expressions'];prefix='codi-physical-parameters:1\n';need(raw.startswith(prefix) and json.loads(raw[len(prefix):])==defs,'actual original formula source');values={'baseRadius':r,'namedRadius':r};c=one([c for c in s['stages'][0]['constraints'] if c['typeId']=='RadiusLength' and c['objects']==[b['objects']['A']['id']]],'named radius');need(c['constants']['length']=='namedRadius','never literal substitution')
    equations(s,row['inspection'],values);eq=[c for c in s['stages'][0]['constraints'] if c['typeId']=='EqualRadius'];need(len(eq)==len(row['pairs']),'exact equality membership')
    for x,y in row['pairs']:
        ids={b['objects'][x]['id'],b['objects'][y]['id']};one([c for c in eq if set(c['objects'])==ids],'actual requested pair')
    if row['typed']:
        plate=source(row['before'],b['plate']['faceId']);need(len(plate['objects'])==4,'genuine separate rectangle source');equations(plate,row['plateInspection'],values);coords=[o['data'][p] for o in plate['objects'] for p in ('a','b')];need({(p['x'],p['y']) for p in coords}=={(0,0),(100,0),(100,50),(0,50)},'typed Native rectangle untouched')
    return s,obj

def pointclass(point,row,obj):
    x,y,z=point
    if row['typed']:
        if not(0<=x<=100 and 0<=y<=50 and 0<=z<=20):return 'outside'
        return 'boundary' if x in (0,100) or y in (0,50) or z in (0,20) else 'inside'
    o=obj[row['binding']['objects']['A']['id']];c=o['data']['c'];r=o['data']['r'];q=(x-c['x'])**2+(y-c['y'])**2
    if z<0 or z>20 or q>r*r:return 'outside'
    return 'boundary' if z in (0,20) or q==r*r else 'inside'
def normalized(s):
    s=json.loads(json.dumps(s))
    for v in (s['capture']['solids'],s['capture']['journal'],s['host'],s['parameters']):v.pop('revision',None)
    return s
def radius_component_rank(sketch,binding):
    # Exact original radius-equation matrix, not the production Jacobian or
    # an equation-count DOF estimate. All centers and Q's +X/+Y branch are
    # independently checked by source_check/equations in this finite fixture.
    ids=[binding['objects'][k]['id'] for k in ('A','B','C','Q')];matrix=[]
    for stage in sketch['stages']:
        for c in stage['constraints']:
            if c['typeId']=='RadiusLength':
                need(len(c['objects'])==1 and c['objects'][0] in ids,'actual radius anchor identity');row=[Fraction(0) for _ in ids];row[ids.index(c['objects'][0])]=Fraction(1);matrix.append(row)
            elif c['typeId']=='EqualRadius':
                need(len(c['objects'])==2 and all(x in ids for x in c['objects']) and c['objects'][0]!=c['objects'][1],'actual radius equality identities');row=[Fraction(0) for _ in ids];row[ids.index(c['objects'][0])]=Fraction(1);row[ids.index(c['objects'][1])]=-Fraction(1);matrix.append(row)
    rank=0
    for column in range(4):
        pivot=next((i for i in range(rank,len(matrix)) if matrix[i][column]),None)
        if pivot is None:continue
        matrix[rank],matrix[pivot]=matrix[pivot],matrix[rank];value=matrix[rank][column];matrix[rank]=[x/value for x in matrix[rank]]
        for i in range(len(matrix)):
            if i!=rank:
                factor=matrix[i][column];matrix[i]=[x-factor*y for x,y in zip(matrix[i],matrix[rank])]
        rank+=1
    return rank
def promotion_check(item):
    b=item['binding'];before=source(item['before'],b['faceId']);after=source(item['after'],b['faceId']);promoted=item['promoted']
    def target(sketch):return one([c for c in sketch['stages'][0]['constraints'] if c['typeId']==promoted['typeId'] and c['objects']==promoted['objects']],'actual distinct promoted row')
    old=target(before);need(old['admission']['state']=='redundant' and target(after)['admission']['state']=='accepted','actual redundant to accepted promotion')
    expected=copy.deepcopy(before);rows=expected['stages'][0]['constraints'];removed=one([c for c in rows if c==item['removed']],'actual removed original EqualRadius');need(removed['typeId']=='EqualRadius' and removed!=old,'distinct actual removed witness');rows.remove(removed);target(expected)['admission']['state']='accepted';need(after==expected,'EXACT one original row deletion and only required admission transition, no geometry authority')
    # Original rA-rB/radius-anchor matrix over Fraction, not a production rank
    # or an inference from tiny residuals. Candidate edge never witnesses itself.
    def without_target(sketch):
        reduced=copy.deepcopy(sketch);reduced['stages'][0]['constraints'].remove(target(reduced));return reduced
    rank_before=radius_component_rank(before,b);rank_after=radius_component_rank(after,b)
    need(radius_component_rank(without_target(before),b)==rank_before,'original promoted row was exactly dependent')
    need(rank_after==rank_before and radius_component_rank(without_target(after),b)==rank_after-1,'surviving original row is now genuinely necessary')
    equations(before,item['inspectionBefore'],{});equations(after,item['inspectionAfter'],{})
    for k in ('history','expressions','counters','presentation'):need(item['before']['capture']['native'][k]==item['after']['capture']['native'][k],'unchanged native '+k)
    need(item['result']['changed'] and item['result']['authoredUndo'] and item['result']['relation']['status']=='removed','one real journaled removal');settled(item['before']);settled(item['after'])
    return {'label':item['label'],'originalRadiusRank':rank_before,'remainingRadiusRank':rank_after,'promotedType':promoted['typeId']}
def check(directory):
    root=Path(directory);r=json.loads((root/'receipt.json').read_text());need(r['status']=='PASS','whole public workflow PASS first');need(r['ownedContextsRetired'] and r['sharedBrowserDisconnectedOnly'] and r['sourcePins']==r['sourcePinsAfter'],'immutable execution and owned cleanup');need(not any(r[k] for k in ('sourceSeeds','privateAuthoring','fakeReplies')),'genuine source')
    need(re.fullmatch('[a-f0-9]{40}',r['driverSourceCommit']) and re.fullmatch('[a-f0-9]{40}',r['desktopHelperCommit']),'separate frozen driver/helper Git commits, not assumed runtime source')
    expected_paths={'test/equal-radius-public-workflow/'+name for name in ('desktop-driver.mjs','example.mjs','check.py','README.md')}|{'test/native-cad-container/archive_oracle.py','docs/reviews/EQUAL-RADIUS-B3-ACCEPTANCE-CONTRACT-20261108.md','test/agent-cad-corpus/sweep/signed-harness.mjs'}
    need(len(r['sourceSnapshots'])==len(expected_paths) and {s['gitPath'] for s in r['sourceSnapshots']}==expected_paths,'exact frozen producer/source roster')
    for s in r['sourceSnapshots']:
        p=(root/s['file']).resolve();need(p.is_relative_to(root.resolve()) and hashlib.sha256(p.read_bytes()).hexdigest()==s['sha256']==r['sourcePins'][s['originalFile']],'exact bounded executed source snapshot')
        need(s['commit']==(r['desktopHelperCommit'] if s['gitPath']=='test/agent-cad-corpus/sweep/signed-harness.mjs' else r['driverSourceCommit']),'actual helper/acceptance Git object custody')
        if s['gitPath'].startswith('test/equal-radius-public-workflow/'):need(hashlib.sha256((Path(__file__).parent/Path(s['gitPath']).name).read_bytes()).hexdigest()==s['sha256'],'use frozen checker/fixture source, not later path bytes')
        if s['gitPath']=='test/native-cad-container/archive_oracle.py':need(hashlib.sha256((Path(__file__).resolve().parents[1]/'native-cad-container/archive_oracle.py').read_bytes()).hexdigest()==s['sha256'],'actual frozen independent archive helper')
    points=0;observations=[]
    for row in r['observations']:
        need(row['before']==row['after'],'exact same-window query/source/state tokens');settled(row['before']);s,obj=source_check(row);body=one(row['before']['capture']['solids']['bodies'],'actual body');need(body['id']==row['binding']['native']['body']['outputId'] and body['featureId']==row['binding']['native']['body']['featureId'],'actual producer/output, no ID parsing');m=body['metrics'];need(m['nativeValidity']['valid'] and m['solidCount']==1 and m['resultKind']=='single-solid','genuine Native validity/census');need('sha256:'+m['runtime']['jsSha256']+':'+m['runtime']['wasmSha256']==r['engineRevision'],'exact build')
        with localcontext() as ctx:ctx.prec=110;rv=Decimal(str(obj[row['binding']['objects']['A']['id']]['data']['r']));volume=Decimal(100000) if row['typed'] else PI*rv*rv*20
        near(m['nativeVolume'],volume,1e-6);ra=float(rv)
        for k,vs in ({'min':[0,0,0],'max':[100,50,20]} if row['typed'] else {'min':[-ra,-ra,0],'max':[ra,ra,20]}).items():
            for x,y in zip(m['nativeBounds'][k],vs):near(x,y,1e-6)
        request,q=row['input'],row['query'];need(q['quality']=='native-re-evaluation-observation','actual Native query');need(q['points']==[{'point':p,'classification':pointclass(p,row,obj)} for p in request['points']],'independent material/boundary classes')
        for k in ('revision','version','unit','engine','engineRevision','bodyId','featureId'):need(q[k]==request[k],'query binding')
        points+=len(request['points']);observations.append({'label':row['label'],'typed':row['typed'],'volumeMM3':str(volume)})
    redundant=one([o for o in r['observations'] if o['label']=='Distinct transitive A-C is actual redundant row'],'real distinct redundant observation');b=redundant['binding'];row=one([c for c in source(redundant['before'],b['faceId'])['stages'][0]['constraints'] if c['typeId']=='EqualRadius' and set(c['objects'])=={b['objects']['A']['id'],b['objects']['C']['id']}],'distinct A-C');need(row['admission']['state']=='redundant','not duplicate no-op as redundancy proof');noop=one([x for x in r['rows'] if x['label'].startswith('Reversed unordered pair')],'actual symmetric no-op');need(noop['before']==noop['after'] and noop['noop']['changed'] is False and noop['before']['capture']['journal']['canRedo'] is True,'actual reversed no-op preserves a genuine existing redo tail')
    need({x['label'] for x in r['promotions']}=={'Promote A-C after removal of A-B','Promote A-Q after removal of A-B','Promote RadiusLength B after removal of A-B'} and len(r['promotions'])==3,'complete Circle/quarter-Arc/retained-dimension promotion cases')
    promotions=[promotion_check(item) for item in r['promotions']]
    for label in ('Promoted Circle graph propagates radius6','Promoted Arc graph propagates radius7 with original quarter branch','Reopened promoted B radius remains7 while A becomes8','Healthy continuation preserves promoted B7 and unrelated C6 Q7'):one([o for o in r['observations'] if o['label']==label],'actual post-promotion continuation')
    for row in r['refusals']:need(normalized(row['before'])==normalized(row['after']) and not row['error']['committed'] and not row['error']['possiblyCommitted'],'atomic refusal')
    need([d['nullity'] for d in r['diagnostics']]==[5,3,2],'independent finite radius/Point freedoms, not global DOF')
    numeric=one([o for o in r['observations'] if o['label']=='Numeric Circle Native with explicitly construction quarter Arc'],'actual numeric radius fixture')['binding']
    for d in r['diagnostics']:
        need(d['before']==d['after'] and d['result']['localJacobian']['localNullity']==d['nullity'],'actual local rank observation')
        need(any(not o['typed'] and source(o['before'],numeric['faceId'])==source(d['before'],numeric['faceId']) for o in r['observations']),'rank assumptions use the actual same source already checked for centers/quarter/unrelated geometry')
        rank=radius_component_rank(source(d['before'],numeric['faceId']),numeric);need(4-rank+2==d['nullity'],'independent exact radius-component rank plus retained unrelated Point2; not global physical DOF')
    need(len(r['saves'])==9 and len(r['reopens'])==9 and sum(s['typed'] for s in r['saves'])==2,'original three numeric/two typed plus four real promotion archive cycles');archives=[]
    for item in r['saves']:
        arc=read_archive(root/item['savedFile']);need(arc['sha256']==item['sha256'] and arc['bytes']==item['bytes'],'independent actual archive CRC/SHA/manifest');env=arc['envelope'];model=env['project']['model'];native=item['before']['capture']['native'];need(model['history']==native['history'] and model['expressions']==native['expressions'] and model['counters']==native['counters'],'one saved graph/formulas/highwater');need(env.get('manufacturing')==item['before']['manufacturing'] and env.get('presentation')==native['presentation'],'saved metadata');need({s['id']:s['data'] for s in env['project']['sketches']}=={s['id']:json.loads(s['source']) for s in native['sketches']},'all native source/IDs/roles/equalities retained');need(len(model['history'])==(3 if item['typed'] else 2),'only actual planes and one original feature');op=one([x for x in model['history'] if x['type']=='WORKER_SELECTED_PROFILE_EXTRUDE_V2'],'actual Native profile');b=item['binding'];need(op['params']['featureId']==b['native']['body']['featureId'] and op['params']['faceId']==b['native']['faceId'] and op['params']['regionId']==b['native']['regionId'] and op['params']['engineRevision']==r['engineRevision'] and op['params']['depth']==20,'actual recorded source/build/producer intent');need(item['after']['capture']==item['before']['capture'],'Save does not mutate authored model');archives.append({'file':item['savedFile'],'sha256':arc['sha256'],'designRevision':arc['manifest']['designRevision']})
    for label,promoted_label in [('promotion-circle','Promote A-C after removal of A-B'),('promotion-arc','Promote A-Q after removal of A-B'),('promotion-radius','Promote RadiusLength B after removal of A-B')]:
        saved=one([x for x in r['saves'] if x['label']==label],'promoted native archive');item=one([x for x in r['promotions'] if x['label']==promoted_label],'actual promotion');wanted=item['promoted'];sketch=source(saved['before'],saved['binding']['faceId']);need(one([c for c in sketch['stages'][0]['constraints'] if c['typeId']==wanted['typeId'] and c['objects']==wanted['objects']],'saved promoted row')['admission']['state']=='accepted','promoted classification saved before fresh Open')
    for row in r['reopens']:
        for k in ('history','source','sketches','expressions','counters','presentation'):need(row['opened']['capture']['native'][k]==row['before']['capture']['native'][k],'fresh Open exact '+k)
        need(not row['opened']['capture']['journal']['canUndo'] and not row['opened']['capture']['journal']['canRedo'],'fresh session J reset')
    return {'status':'PASS','scope':'finite EqualRadius genuine numeric/construction-Arc and typed ordinary-Arc/source plus Native circle/rectangle, not typed consumed Circle capability/full C03','observations':len(observations),'nativePoints':points,'native':observations,'archives':archives,'promotions':promotions}
if __name__=='__main__':print(json.dumps(check(sys.argv[1]),indent=2))
