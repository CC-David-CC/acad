#!/usr/bin/env python3
"""AFTER the COMPLETE public workflow and actual STEP readback; no production geometry imports."""
import copy,hashlib,importlib.util,itertools,json,math,re,sys
from collections import deque
from fractions import Fraction as Q
from pathlib import Path

HERE=Path(__file__).resolve().parent
sys.dont_write_bytecode=True
sha=lambda b:hashlib.sha256(b).hexdigest()
def require(ok,message):
    if not ok:raise ValueError(message)
def finite(x):return isinstance(x,(int,float,Q)) and not isinstance(x,bool) and math.isfinite(x)
def rational(x):
    require(finite(x),'finite source number');return x if isinstance(x,Q) else Q(x) if isinstance(x,int) else Q.from_float(x)
def near(x,y,t,label):require(finite(x) and finite(y) and abs(rational(x)-rational(y))<=rational(t),label+': '+str(x)+' != '+str(y))
def one(rows,label):require(len(rows)==1,'exactly one '+label);return rows[0]
def normalized(state,candidate=False):
    x=copy.deepcopy(state)
    del x['host']['revision'];del x['capture']['journal']['revision'];del x['capture']['solids']['revision']
    if candidate:del x['lifecycle']['epoch']
    return x
def settled(s):
    r=s['ownership']['resources'];require(not s['ownership']['processing'] and r['cleanupFailed'] is False,'settled owned resources')
    require(all(r[k]==0 for k in ('candidates','accepted','mounts')) and r['owners']==r['detached'],'no live candidate/native mount')
    require(not s['lifecycle']['pipelineFailed'] and not s['lifecycle']['cleanupFailed'],'no retained pipeline/cleanup failure')
def custody(root,r):
    require(r['sourcePins']==r['sourcePinsAfter'] and r['sourceSeeds'] is False and r['privateAuthoring'] is False and r['fakeReplies'] is False,'immutable honest producer inputs')
    require(re.fullmatch('[0-9a-f]{40}',r['driverSourceCommit']) and re.fullmatch('[0-9a-f]{40}',r['desktopHelperCommit']),'separate exact driver/helper commits')
    seen=set()
    for row in r['sourceSnapshots']:
        p=(root/row['file']).resolve();require(p.is_relative_to(root.resolve()) and row['gitPath'] not in seen,'bounded source snapshot roster');seen.add(row['gitPath'])
        require(sha(p.read_bytes())==row['sha256']==r['sourcePins'][row['originalFile']],'actual frozen source SHA')
        expected=r['desktopHelperCommit'] if row['gitPath']=='test/agent-cad-corpus/sweep/signed-harness.mjs' else r['driverSourceCommit']
        require(row['commit']==expected,'Git-only producer custody distinct from runtime commit')
    for name in ('cases.json','ANALYTIC-CONTRACT.md','check.py','read-step.cpp','build-reader.sh','run-reader.mjs','desktop-driver.mjs','example.mjs','README.md'):
        row=one([s for s in r['sourceSnapshots'] if s['gitPath']=='test/occ-boolean-public-workflow/'+name],'frozen '+name)
        require(sha((HERE/name).read_bytes())==row['sha256'],'use frozen Git-object oracle/source, not a later mutable path: '+name)
    helper=HERE.parent/'native-cad-container/archive_oracle.py';row=one([s for s in r['sourceSnapshots'] if s['gitPath']=='test/native-cad-container/archive_oracle.py'],'independent archive helper');require(sha(helper.read_bytes())==row['sha256'],'frozen archive helper custody')
    spec=importlib.util.spec_from_file_location('e16_independent_archive_oracle',helper);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    require(re.fullmatch('[0-9a-f]{40}',r['pins']['source']) and re.fullmatch('[0-9a-f]{40}',r['pins']['desktop']),'actual runtime commits')
    require(r['ownedContextsRetired'] is True and r['sharedBrowserDisconnectedOnly'] is True and not r.get('cleanupPending'),'owned cleanup terminal')
    for row in r['rows']:
        if row['label']=='Exact actual composed runtime':
            require({a['name']:a['sha256'] for a in row['assets']}==r['pins']['files'],'all actual loaded native/module pins')
            require(row['outer']['sha256']==r['pins']['outer']['sha256'],'actual outer index pin')
    return module
def declared(case,facts):
    spec=facts['main'] if case['label']==facts['main']['label'] else one([x for x in facts['cases'] if x['label']==case['label']],'frozen case')
    require(case['operations']==spec['operations'] and case.get('points')==spec.get('points'),'frozen operation/point recipe')
    require(all(case.get(k)==spec.get(k) for k in ('refusalCodes','policyObservationOnly','voidContactDimension','stepRequired')),'frozen raw/strict/contact policy')
    expected=copy.deepcopy(spec['boxes']);live=case['liveKeys']
    if spec is facts['main']:
        actual={b['key']:b for b in case['boxes']};phase={(30,10):0,(35,10):1,(35,12):2}.get((actual['outer']['dimensions'][0],actual['tool']['origin'][0]));require(phase is not None,'only frozen main source edits')
        expected[0]['dimensions'][0]=30 if phase==0 else 35;expected[1]['origin'][0]=12 if phase==2 else 10
        require(case['expected']==(spec['expected'] if phase==0 else spec['edits'][phase-1]['expected']),'frozen main volume/bounds')
        order=['outer','tool','result','suffix'];require(live==order[:len(live)] and 2<=len(live)<=4,'actual mixed prefix chronology')
        require(case['suffix']==spec['suffix'],'immutable suffix specification')
        if 'suffix' in live:expected.append(spec['suffix'])
    else:
        require(case.get('expected')==spec.get('expected'),'frozen ordinary expected policy')
        order=[b['key'] for b in spec['boxes']]+[o['key'] for o in spec['operations']]
        if any(b['key']=='healthy' for b in case['boxes']):
            require(spec.get('expected',{}).get('solids')==0,'only empty continuation');expected.append({'key':'healthy','origin':[100,0,0],'dimensions':[2,3,4]});order.append('healthy')
        require(live==order[:len(live)] and len(live)>=len(spec['boxes']),'actual frozen feature prefix')
    require(case['boxes']==expected,'exact authored box/source intent, not fitted geometry')
    return spec
def history(case,bindings,state,r,facts):
    spec=declared(case,facts);hist=state['capture']['native']['history'];require(len(hist)==len(case['liveKeys']),'exact current authored history length')
    boxes={b['key']:b for b in case['boxes']};ops={o['key']:o for o in case['operations']};by_id={};active=set();nodes={}
    initial={b['key']:b for b in spec['boxes']}
    if spec is facts['main']:initial['suffix']=spec['suffix']
    initial['healthy']={'key':'healthy','origin':[100,0,0],'dimensions':[2,3,4]}
    common={'version','unit','engine','engineRevision','featureId'}
    for key,entry in zip(case['liveKeys'],hist):
        p=entry['params'];binding=bindings[key];require(set(entry)=={'type','params'} and p['featureId']==binding['featureId'],'exact feature/receipt identity')
        require(isinstance(p['featureId'],int) and not isinstance(p['featureId'],bool) and p['featureId']>0 and p['featureId'] not in by_id,'unique actual feature ID')
        by_id[p['featureId']]=binding['outputId'];require(p['version']==1 and p['unit']=='millimeter' and p['engine']=='occ' and p['engineRevision']==r['engineRevision']==binding['engineRevision'],'immutable authored build/units')
        commands=[c for c in r['commands'] if c.get('case')==case['label'] and isinstance(c.get('result'),dict) and c['result'].get('featureId')==p['featureId'] and c['result'].get('outputId')==binding['outputId'] and c['command'].startswith('create-worker-solid-')]
        command=one(commands,'actual public creator');args=command['args'];require(command['result']==binding,'bound actual creator reply, no guessed ID')
        if key in boxes:
            require(entry['type']=='WORKER_SOLID_BOX_V1' and set(p)==common|{'x','y','z','width','depth','height'},'exact saved box schema')
            b=boxes[key];require([p[k] for k in ('x','y','z')]==b['origin'] and [p[k] for k in ('width','depth','height')]==b['dimensions'],'actual source dimensions/placement')
            require(command['command']=='create-worker-solid-box' and args['engineRevision']==r['engineRevision'] and args['origin']==initial[key]['origin'] and args['dimensions']==initial[key]['dimensions'],'genuine frozen public authored box')
            lo=tuple(map(rational,b['origin']));hi=tuple(lo[i]+rational(b['dimensions'][i]) for i in range(3));require(all(hi[i]>lo[i] for i in range(3)),'positive actual source box');nodes[binding['outputId']]=('box',lo,hi)
        else:
            op=ops[key];require(entry['type']=='WORKER_SOLID_BOOLEAN_V1' and set(p)==common|{'kind','a','b'},'exact saved Boolean schema')
            require(p['kind']==op['kind'] and p['a']==bindings[op['a']]['outputId'] and p['b']==bindings[op['b']]['outputId'],'actual ordered opaque operands')
            require(p['a'] in active and p['b'] in active and p['a']!=p['b'],'only current actual parents consumed')
            require(command['command']=='create-worker-solid-boolean' and all(args[k]==p[k] for k in ('kind','a','b','version','unit','engine')),'actual public Boolean request/intent')
            nodes[binding['outputId']]=(p['kind'],p['a'],p['b']);active.remove(p['a']);active.remove(p['b'])
        active.add(binding['outputId'])
    outputs=state['capture']['solids']['outputs'];require({o['outputId'] for o in outputs}==active,'exact real consumed/retained output inventory')
    require(state['capture']['native']['sketches']==[] and state['capture']['native']['expressions']=='','ordinary box model, no seeded sketches/parameters')
    return nodes
def cells(nodes,target):
    planes=[sorted({v[i] for n in nodes.values() if n[0]=='box' for v in (n[1],n[2])}) for i in range(3)]
    require(all(2<=len(p)<=16 for p in planes),'finite independent orthogonal oracle bound')
    def material(p,key):
        n=nodes[key]
        if n[0]=='box':return all(n[1][i]<p[i]<n[2][i] for i in range(3))
        x,y=material(p,n[1]),material(p,n[2]);return x and not y if n[0]=='subtract' else x and y if n[0]=='common' else x or y
    filled=set();volume=Q(0)
    for index in itertools.product(*(range(len(p)-1) for p in planes)):
        lo=[planes[i][j] for i,j in enumerate(index)];hi=[planes[i][j+1] for i,j in enumerate(index)]
        if material([(lo[i]+hi[i])/2 for i in range(3)],target):filled.add(index);volume+=math.prod(hi[i]-lo[i] for i in range(3))
    bounds=None if not filled else {'min':[min(planes[i][j[i]] for j in filled) for i in range(3)],'max':[max(planes[i][j[i]+1] for j in filled) for i in range(3)]}
    pending=set(filled);components=0
    while pending:
        components+=1;queue=deque([pending.pop()])
        while queue:
            at=queue.popleft()
            for axis in range(3):
                for step in (-1,1):
                    neighbor=list(at);neighbor[axis]+=step;neighbor=tuple(neighbor)
                    if neighbor in pending:pending.remove(neighbor);queue.append(neighbor)
    def classify(point):
        point=list(map(rational,point));incident=[]
        for axis,p in enumerate(point):
            adjacent=[];cuts=planes[axis]
            for j in range(len(cuts)-1):
                if cuts[j]<=p<=cuts[j+1]:adjacent.append(j)
            if p<=cuts[0] or p>=cuts[-1]:adjacent.append(None)
            incident.append(adjacent or [None])
        states=[None not in index and index in filled for index in itertools.product(*incident)]
        return 'inside' if all(states) else 'outside' if not any(states) else 'boundary'
    return {'volume':volume,'bounds':bounds,'components':components,'classify':classify,'cellCount':len(filled)}
def metric(output,truth,r,expected):
    m=output['metrics'];require('sha256:'+m['runtime']['jsSha256']+':'+m['runtime']['wasmSha256']==r['engineRevision'],'actual immutable native pair')
    require(output['engine']=='occ' and m['unit']=='millimeter' and m['materialRegions'] is None,'geometric OCC evidence, not physical assignments')
    n=truth['components'];require(n==expected['solids'] and m['solidCount']==n,'independent material components versus actual solid census')
    require(m['resultKind']==('empty' if n==0 else 'single-solid' if n==1 else 'multi-solid'),'explicit raw empty/single/multi policy')
    near(m['nativeVolume'],truth['volume'],r['budgets']['nativeVolumeMm3'],'native versus independent cell volume');near(expected['volume'],truth['volume'],0,'frozen analytic volume')
    if not n:require(output['bodyId'] is None and m['nativeBounds'] is None and m['triangleCount']==0 and expected['bounds'] is None,'empty is metadata/no body/mesh')
    else:
        require(output['bodyId']==output['outputId'] and m['nativeValidity']['valid'] is True,'actual positive native output')
        for k in ('min','max'):
            for i in range(3):near(m['nativeBounds'][k][i],truth['bounds'][k][i],r['budgets']['nativeBoundsMm'],'native independent bounds');near(expected['bounds'][k][i],truth['bounds'][k][i],0,'frozen bounds')
        if 'shells' in expected:require(m['nativeTopology']['counts']['shells']==expected['shells'],'cavity boundary shell count is NOT material components')
def observations(r,facts):
    observations=[];point_count=0;labels=set()
    for row in r['observations']:
        require(row['before']==row['after'],'genuine readonly source/history/journal/resources');settled(row['after']);case=row['case'];labels.add(case['label']);nodes=history(case,row['bindings'],row['before'],r,facts);key=row['outputKey'];target=row['bindings'][key]['outputId'];truth=cells(nodes,target);output=one([o for o in row['before']['capture']['solids']['outputs'] if o['outputId']==target],'actual observed output');metric(output,truth,r,row['expected'])
        if key=='result':require(row['expected']==case['expected'],'intended result expectation')
        for q in row['queries']:
            binding=row['bindings'][q['key']];i=q['input'];result=q['result'];actual=cells(nodes,binding['outputId'])
            require(i['bodyId']==binding['outputId'] and i['featureId']==binding['featureId'] and i['engineRevision']==r['engineRevision'] and i['revision']==row['before']['capture']['solids']['revision'],'actual selected output/revision binding')
            require(result['quality']=='native-re-evaluation-observation' and all(result[k]==i[k] for k in ('revision','bodyId','featureId','unit','engine','engineRevision')),'genuine native full-history point replay')
            require(result['points']==[{'point':p,'classification':actual['classify'](p)} for p in i['points']],'independent original material/void/boundary truth')
            if q['key']=='result':require(i['points']==case['points'],'frozen result probes')
            elif q['key']=='suffix':require(i['points']==facts['main']['suffix']['points'],'frozen unrelated suffix probes')
            elif q['key']=='healthy':require(i['points']==[[101,1,1],[99,1,1]],'frozen healthy continuation probes')
            else:
                b=one([b for b in case['boxes'] if b['key']==q['key']],'actual parent box');center=[b['origin'][j]+b['dimensions'][j]/2 for j in range(3)];require(i['points']==[center,[center[0]+100,center[1],center[2]]],'independently source-derived parent probes')
            point_count+=len(i['points'])
        require((truth['components']==1)==any(q['key']==key for q in row['queries']),'single solids MUST have genuine public Native points; empty/multi do not fake them')
        contact=void_contact(case,row['bindings'],nodes) if 'voidContactDimension' in case else None
        observations.append({'label':row['label'],'case':case['label'],'volumeMm3':str(truth['volume']),'faceConnectedMaterialComponents':truth['components'],'analyticCells':truth['cellCount'],'voidContactDimension':contact})
    for spec in [facts['main']]+facts['cases']:
        if not spec.get('refusalCodes') and not spec.get('policyObservationOnly'):require(spec['label'] in labels,'whole case not omitted: '+spec['label'])
    require(any('Creation Undo genuine parents' in o['label'] for o in r['observations']),'real creation Undo parent observations')
    require(any(t['kind']=='operation-append' and t['direction']=='undo' for t in r['travels']) and any(t['kind']=='operation-append' and t['direction']=='redo' for t in r['travels']),'actual append Undo AND Redo')
    require(sum(t['kind']=='solid-box' for t in r['travels'])>=8,'mixed original box/source edits, not only append travel')
    return observations,point_count
def allocation_contract(r,facts):
    initial=one([o for o in r['observations'] if o['label']=='Actual ordinary subtract19000 material/void'],'actual initial subtract observation')
    suffix=one([o for o in r['observations'] if o['label']=='Actual unrelated suffix box24 retains Boolean and parent consumption'],'actual later suffix observation')
    ids=initial['bindings'];parent_high=ids['tool']['featureId'];created_high=ids['result']['featureId'];suffix_high=suffix['bindings']['suffix']['featureId']
    require(parent_high==ids['outer']['featureId']+1 and created_high==parent_high+1 and suffix_high==created_high+1,'actual public creation receipts advance allocation exactly once')
    require(initial['before']['capture']['native']['counters']=={'featureId':created_high} and suffix['before']['capture']['native']['counters']=={'featureId':suffix_high},'exact allocated creation high-water snapshots')
    for row in r['travels']:
        before=row['before']['capture']['native']['counters'];after=row['after']['capture']['native']['counters']
        require(set(before)=={'featureId'} and type(before['featureId']) is int and 0<=before['featureId']<=2**53-1,'actual finite allocation-counter contract')
        require(after==before,'every actual Undo/Redo preserves exact already allocated high-water')
    parents=initial['before']['capture']['native']['history'][:2]
    for label,high in [('Immediate SUBTRACTION CREATION Undo',created_high),('Mixed Undo SUBTRACTION CREATION',suffix_high)]:
        row=one([t for t in r['travels'] if t['label']==label],'required genuine creation Undo')
        require(row['kind']=='operation-append' and row['direction']=='undo','creation Undo is actual shared append chronology')
        native=row['after']['capture']['native'];require(native['history']==parents and native['counters']=={'featureId':high} and high>parent_high,'creation Undo restores exact earlier parents while retaining later allocation high-water')
        for key in ('source','sketches','expressions','presentation'):require(native[key]==initial['before']['capture']['native'][key],'creation Undo retains all other authored source fields '+key)
        history(row['case'],row['bindings'],row['after'],r,facts)
    redo=one([t for t in r['travels'] if t['label']=='Immediate SUBTRACTION CREATION Redo'],'required immediate creation Redo')
    mixed=one([t for t in r['travels'] if t['label']=='Mixed Undo outer dimensions'],'required numeric-edit Undo')
    for actual,expected in [(redo['after'],initial['before']),(mixed['after'],suffix['before'])]:
        for key in ('history','source','sketches','expressions','counters','presentation'):require(actual['capture']['native'][key]==expected['capture']['native'][key],'Redo/numeric travel retains exact source INCLUDING counters '+key)
    return {'everyTravelPreservesCounters':len(r['travels']),'parentHighWater':parent_high,'createdHighWater':created_high,'suffixHighWater':suffix_high,'creationUndoCounterRollback':'forbidden'}
def refusals(r,facts):
    seen=set()
    one([row for row in r['refusals'] if row['label']=='Actual stale source-box edit'],'required genuine old authored-revision refusal')
    for row in r['refusals']:
        error=row['error'];require(error and error['committed'] is False and error['possiblyCommitted'] is False,'real uncommitted refusal')
        require(normalized(row['before'],row['candidate'])==normalized(row['after'],row['candidate']),'exact accepted state/resources across refusal');settled(row['after']);history(row['case'],row['bindings'],row['before'],r,facts);seen.add(row['case']['label'])
        spec=declared(row['case'],facts)
        if spec.get('refusalCodes') and row['label']==spec['label']:require(error['code'] in spec['refusalCodes'],'frozen strict Join refusal catalogue')
        if 'point-query' in row['label']:require(error['code']=='UNSUPPORTED_TARGET','explicit app multi/empty point limitation')
        if 'STEP-export' in row['label']:require(error['code']=='UNAVAILABLE','empty STEP export unavailable')
        if 'stale' in row['label']:
            require(error['name']=='Error' and error['code']=='STALE_HISTORY','authored revision preflight retains exact machine-readable stale-history refusal')
            require(row['before']==row['after'],'stale authored-history preflight retains ALL state/revisions/counters/resources, without normalization')
    for spec in facts['cases']:
        if spec.get('refusalCodes') or spec.get('expected',{}).get('solids') in (0,2):require(spec['label'] in seen,'required explicit strict/empty/multi refusal case')
def void_contact(case,bindings,nodes):
    outer=nodes[bindings['outer']['outputId']];notch=nodes[bindings['notch']['outputId']];inner=nodes[bindings['inner']['outputId']]
    lo=[max(outer[1][i],notch[1][i]) for i in range(3)];hi=[min(outer[2][i],notch[2][i]) for i in range(3)];extent=[min(hi[i],inner[2][i])-max(lo[i],inner[1][i]) for i in range(3)]
    dimension=-1 if min(extent)<0 else sum(x>0 for x in extent);require(dimension==case['voidContactDimension'],'independent exact void-contact dimension')
    return dimension
def contacts(r,facts):
    require(r['contactManifoldGate']=='OPEN','recording RAW outcomes must not close contact gate');reports=[]
    for row in r['contacts']:
        case=row['case'];declared(case,facts);require(case['policyObservationOnly'] is True and row['materialManifoldQualification']=='OPEN','not an invented raw Boolean manifold/rejection contract')
        before_case=case if row['result'] is None else dict(case,liveKeys=case['liveKeys'][:-1]);nodes=history(before_case,row['bindings'],row['before'],r,facts);dimension=void_contact(case,row['bindings'],nodes)
        if row['error']:
            require(not row['error']['committed'] and not row['error']['possiblyCommitted'],'refused RAW contact has no commit');require(normalized(row['before'],True)==normalized(row['after'],True),'RAW refusal preserves accepted parents')
            require(row['nativeGeometryCoverage']=='refused-no-result','honest no-result contact coverage')
        else:
            history(case,row['bindings'],row['after'],r,facts);require(row['nativeGeometryCoverage'] in ('single-solid-public-native-points','public-native-point-domain-unavailable'),'honest raw geometry coverage')
        reports.append({'case':case['label'],'voidContactDimension':dimension,'actualOutcome':'refused' if row['error'] else 'published-RAW','nativeGeometryCoverage':row['nativeGeometryCoverage'],'materialManifoldQualification':'OPEN'})
    require({x['case'] for x in reports}=={x['label'] for x in facts['cases'] if x.get('policyObservationOnly')},'both frozen point/edge controls retained')
    return reports
def saves(root,r,facts,archive):
    require([s['label'] for s in r['saves']]==['subtract-initial','subtract-width-edited','subtract-tool-edited'],'exact THREE native cycles')
    require(len(r['reopens'])==3,'three fresh login native Open cycles');out=[]
    for row in r['saves']:
        path=root/row['savedFile'];require(path.suffix=='.cad' and sha(path.read_bytes())==row['sha256'] and path.stat().st_size==row['bytes'],'actual saved .cad custody')
        data=archive.read_archive(path);native=data['envelope'];model=native['project']['model'];before=row['before']['capture']['native'];require(model['history']==before['history'] and model['counters']==before['counters'] and model['expressions']==before['expressions'],'actual archived authored history/counters/expression')
        require(native['unit']=='millimeter' and native['project']['sketches']==[] and model['assembly']==[],'one ordinary source model, no seeded sketches')
        require(native.get('manufacturing') is None and native.get('drawings',[])==[] and native.get('presentation')==before['presentation'],'no invented physical assignment or extra domains')
        require(row['result']['committed'] is True and row['result']['persistence']=='browser' and row['before']['capture']==row['after']['capture'],'normal native Save browser receipt/source preserved')
        nodes=history(row['case'],row['bindings'],row['before'],r,facts);truth=cells(nodes,row['bindings']['result']['outputId']);near(truth['volume'],row['case']['expected']['volume'],0,'saved original Boolean truth')
        out.append({'file':row['savedFile'],'sha256':row['sha256'],'historyEntries':len(model['history']),'volumeMm3':str(truth['volume'])})
    for row in r['reopens']:
        require(row['openReceipt']['status']=='opened','actual normal Open receipt')
        for k in ('history','source','sketches','expressions','counters','presentation'):require(row['before']['capture']['native'][k]==row['after']['capture']['native'][k],'fresh Open exact retained source '+k)
        require(not row['after']['capture']['journal']['canUndo'] and not row['after']['capture']['journal']['canRedo'],'fresh Open clears ephemeral travel')
    return out
def orient(a,b,p):return (b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0])
def area(polygon):return abs(sum(polygon[i][0]*polygon[(i+1)%len(polygon)][1]-polygon[i][1]*polygon[(i+1)%len(polygon)][0] for i in range(len(polygon))))/2 if len(polygon)>=3 else Q(0)
def ccw(triangle):return triangle if orient(*triangle)>0 else list(reversed(triangle))
def intersection_area(first,second):
    polygon=ccw(first)
    for j,a in enumerate(ccw(second)):
        b=ccw(second)[(j+1)%3];output=[]
        if not polygon:return Q(0)
        previous=polygon[-1];d0=orient(a,b,previous)
        for current in polygon:
            d1=orient(a,b,current)
            if (d1>=0)!=(d0>=0):
                t=d0/(d0-d1);output.append(tuple(previous[k]+t*(current[k]-previous[k]) for k in range(2)))
            if d1>=0:output.append(current)
            previous=current;d0=d1
        polygon=output
    return area(polygon)
def sub(a,b):return tuple(a[i]-b[i] for i in range(3))
def cross(a,b):return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def dot(a,b):return sum(a[i]*b[i] for i in range(3))
def cuboid_surface(component,box,budgets):
    lo=tuple(map(rational,box['origin']));hi=tuple(lo[i]+rational(box['dimensions'][i]) for i in range(3));plane_tol=rational(budgets['stepPlanesMm']);seen=set();signed_volume=Q(0);count=0
    require(component['shells']==1 and component['vertices']==8 and component['edges']==12 and len(component['faces'])==6,'actual cuboid component incidence census')
    for face in component['faces']:
        triangles=[[tuple(map(rational,p)) for p in tri] for tri in face['triangles']];require(triangles and all(len(t)==3 for t in triangles),'actual triangle roster')
        points=[p for tri in triangles for p in tri];candidates=[]
        for axis in range(3):
            for side,plane in ((-1,lo[axis]),(1,hi[axis])):
                if all(abs(p[axis]-plane)<=plane_tol for p in points):candidates.append((axis,side,plane))
        axis,side,plane=one(candidates,'actual source-plane face support');require((axis,side) not in seen,'no duplicate face coverage');seen.add((axis,side));near(face['planeOrigin'][axis],plane,budgets['stepPlanesMm'],'actual BRep plane support')
        for j,n in enumerate(face['planeNormal']):near(abs(n) if j==axis else n,1 if j==axis else 0,1e-12,'native plane normal axis')
        other=[j for j in range(3) if j!=axis];projected=[]
        for tri in triangles:
            require(all(all(lo[j]-plane_tol<=p[j]<=hi[j]+plane_tol for j in other) for p in tri),'actual face triangles stay within source rectangle')
            normal=cross(sub(tri[1],tri[0]),sub(tri[2],tri[0]));require(normal[axis]*side>0,'actual outward triangle orientation')
            projected.append([tuple(p[j] for j in other) for p in tri]);require(area(projected[-1])>0,'nondegenerate projected triangle')
            signed_volume+=dot(tri[0],cross(tri[1],tri[2]))/6;count+=1
        require(len(projected)<=128,'bounded fixture face coverage work')
        for i,first in enumerate(projected):
            for second in projected[i+1:]:require(intersection_area(first,second)==0,'no projected triangle interior overlap; no welding')
        near(sum(map(area,projected),Q(0)),math.prod(hi[j]-lo[j] for j in other),budgets['stepFaceAreaMm2'],'complete actual rectangle surface coverage')
    require(seen=={(i,s) for i in range(3) for s in (-1,1)},'all SIX source planes covered independently')
    truth=math.prod(hi[i]-lo[i] for i in range(3));near(signed_volume,truth,budgets['nativeVolumeMm3'],'independent actual triangle signed volume')
    return {'sourceKey':box['key'],'triangles':count,'surfaceSignedVolumeMm3':str(signed_volume),'analyticVolumeMm3':str(truth)}
def box_classify(point,box):
    p=list(map(rational,point));lo=list(map(rational,box['origin']));hi=[lo[i]+rational(box['dimensions'][i]) for i in range(3)]
    return 'inside' if all(lo[i]<p[i]<hi[i] for i in range(3)) else 'boundary' if all(lo[i]<=p[i]<=hi[i] for i in range(3)) else 'outside'
def step_readback(root,r,facts):
    require(len(r['artifacts'])==1,'one genuine multi STEP artifact');artifact=r['artifacts'][0];require(artifact['label']=='raw-union-disjoint-multi' and artifact['savedFile']=='raw-union-disjoint-multi.step','frozen multi artifact')
    file=root/artifact['savedFile'];raw=file.read_bytes();require(sha(raw)==artifact['sha256'] and len(raw)==artifact['bytes'],'actual public STEP bytes')
    text=raw.decode('ascii');require(text.startswith('ISO-10303-21;') and 'FILE_SCHEMA' in text and 'AUTOMOTIVE_DESIGN' in text,'actual AP214-family STEP header')
    require(artifact['result']['committed'] is True and artifact['result']['persistence']=='browser' and artifact['before']==artifact['after'],'actual public file commit, model readonly')
    require(artifact['result']['metadata']['inputSolidCounts']==[2] and artifact['result']['metadata']['inputShapeCount']==artifact['result']['metadata']['transferCount']==1,'one actual multi container transfer, not two substituted app bodies')
    nodes=history(artifact['case'],artifact['bindings'],artifact['before'],r,facts);truth=cells(nodes,artifact['bindings']['result']['outputId']);require(truth['components']==2 and truth['volume']==28000,'frozen independent multi truth')
    read=json.loads((root/'step-readback.json').read_text());require(read['status']=='PASS' and read['artifact']=={'savedFile':artifact['savedFile'],'sha256':artifact['sha256'],'bytes':artifact['bytes']},'readback bound to actual whole artifact')
    source=one([s for s in r['sourceSnapshots'] if s['gitPath']=='test/occ-boolean-public-workflow/read-step.cpp'],'frozen reader source');observation=read['observation'];require(read['readerBuild']['readerSourceSha256']==observation['readerSourceSha256']==source['sha256'] and read['sourceCommit']==source['commit'],'actual separate reader compiled from frozen source')
    require(read['process']['status']==0 and read['process']['error'] is None and observation['reader']=='same-OCCT-separate-build' and observation['unit']=='millimeter' and observation['valid'] is True and observation['inputBytes']==len(raw),'actual successful same-OCCT transfer')
    require(len(read['readerBuild']['libraries'])==23 and read['readerBuild']['identity']=='same-OCCT-separate-build-not-external-kernel','reviewed reader dependency census')
    require(observation['topology']=={'solids':2,'shells':2,'faces':12,'edges':24,'vertices':16},'actual two components fully accounted lower-dimensional topology')
    near(observation['volume'],28000,r['budgets']['nativeVolumeMm3'],'transferred total volume')
    for x,y in zip(observation['bounds'],[0,0,0,50,30,30]):near(x,y,r['budgets']['nativeBoundsMm'],'transferred combined bounds')
    components=observation['solids'];require(len(components)==2,'actual multi components retained');boxes=artifact['case']['boxes'];mapped=[];reports=[]
    for i,component in enumerate(components):
        require(component['responseLocalIndex']==i+1,'reader-local component order only')
        possible=[b for b in boxes if all(abs(rational(v)-rational(w))<=rational(r['budgets']['nativeBoundsMm']) for v,w in zip(component['bounds'],b['origin']+[b['origin'][j]+b['dimensions'][j] for j in range(3)]))];box=one(possible,'matching analytic component geometry');require(box['key'] not in mapped,'two DISTINCT disjoint component surfaces');mapped.append(box['key'])
        near(component['volume'],math.prod(box['dimensions']),r['budgets']['nativeVolumeMm3'],'independent per-solid volume');reports.append(cuboid_surface(component,box,r['budgets']))
    require(len(observation['points'])==len(artifact['case']['points']),'all both-cell/gap/exterior/boundary probes')
    for row,point in zip(observation['points'],artifact['case']['points']):
        require(row['point']==point,'frozen actual STEP point position');expected=[box_classify(point,one([b for b in boxes if b['key']==key],'component source geometry')) for key in mapped]
        require(row['bySolid']==expected and row['classification']==truth['classify'](point),'actual per-solid material/canceled-face/gap membership')
    require(observation['triangles']==sum(x['triangles'] for x in reports),'all actual transferred triangles covered')
    return {'artifact':artifact['savedFile'],'reader':'same-OCCT-separate-build-not-external-kernel','components':reports,'points':len(observation['points']),'appMultiPointCapability':'UNSUPPORTED'}
def main():
    require(len(sys.argv)==2,'usage: check.py COMPLETE_EVIDENCE_DIRECTORY');root=Path(sys.argv[1]).resolve();r=json.loads((root/'receipt.json').read_text());require(r['status']=='PASS','complete public workflow must PASS first; retain all original failures')
    archive=custody(root,r);facts=json.loads((HERE/'cases.json').read_text());require(facts['version']==1 and facts['unit']=='millimeter' and r['budgets']==facts['budgets'],'frozen analytic budgets/unit')
    obs,points=observations(r,facts);allocation=allocation_contract(r,facts);refusals(r,facts);contact=contacts(r,facts);native=saves(root,r,facts,archive);step=step_readback(root,r,facts)
    return {'status':'PASS','scope':'complete finite public OCC Boolean/source/creation travel/.cad and actual multi STEP geometry; no universal manifold/backend/precision/Gate1 signoff','observations':obs,'nativePointClassifications':points,'nativeArchives':native,'allocation':allocation,'refusals':len(r['refusals']),'contactManifoldGate':'OPEN','contactControls':contact,'multiSTEP':step,'exactInterfaceSanity':{'fullFaceJoin_10_5_5':'inside','notchFaceOpening_10_7_7':'outside'}}
if __name__=='__main__':
    try:print(json.dumps(main(),indent=2))
    except Exception as error:print(json.dumps({'status':'ORACLE_REFUSED','error':type(error).__name__,'message':str(error)},indent=2));sys.exit(1)
