#!/usr/bin/env python3
"""AFTER complete whole only. No production math/decoder imports."""
import hashlib, importlib.util, json, math, sys
from fractions import Fraction as Q
from pathlib import Path
sys.dont_write_bytecode=True
archive_path=Path(__file__).resolve().parents[1]/'native-cad-container/archive_oracle.py'
spec=importlib.util.spec_from_file_location('pattern_archive',archive_path);archive=importlib.util.module_from_spec(spec);spec.loader.exec_module(archive)
BUDGET=Q(1,20000000)
PHASES=['source-original','created-four','source-point','source-segment','source-radius','source-center','count-grow','count-shrink','count-regrow','pitch-edit','refusals','remove-travel','save-A','open-A','reopened-edit','save-B','open-B','reopened-remove-travel','save-C','open-C','healthy-final']
TRAVELS=['creation-undo','creation-redo','point-undo','point-redo','segment-undo','segment-redo','radius-undo','radius-redo','center-undo','center-redo','pitch-undo','pitch-redo','removal-undo','removal-redo','removal-restore','reopened-pitch-undo','reopened-pitch-redo','reopened-remove-undo','reopened-remove-redo','reopened-remove-restore']
REFUSALS={'zero-step':'INVALID_REQUEST','count-one':'INVALID_REQUEST','foreign-source':'PATTERN_TARGET','generated-point':'GENERATED_TARGET','source-removal':'GENERATOR_REFERENCE','stale-revision':None}
OPERATIONS=['create-count-four','source-point-edit','source-segment-edit','source-circle-radius','source-circle-center','count-grow-five','count-shrink-three','count-regrow-four','pitch-diagonal-reverse','stale-advance','remove-pattern','reopened-pitch-edit','reopened-remove']
def require(value,message):
    if not value:raise ValueError(message)
def one(rows,message):
    require(len(rows)==1,'one '+message);return rows[0]
def finite(v):return type(v) in (int,float) and math.isfinite(v)
def q(v):require(finite(v),'finite represented source number');return Q(v)
def source_at(s,face):return json.loads(one([x for x in s['capture']['native']['sketches'] if x['id']==face],'actual source')['source'])
def native_equal(a,b):
    for k in ['history','source','sketches','expressions','counters','presentation']:require(a['capture']['native'][k]==b['capture']['native'][k],'exact authored '+k)
    require(a['parameters']['definitions']==b['parameters']['definitions'] and a['manufacturing']==b['manufacturing'] and a['drawing']['definition']==b['drawing']['definition'],'physical/material/drawing intent')
def settled(s):
    require(not s['ownership']['processing'],'settled publication');r=s['ownership']['resources'];require(all(r[k]==0 for k in ['accepted','candidates','mounts']) and r['owners']==r['detached'] and not r['cleanupFailed'],'owned resources retired');require(not s['lifecycle']['pipelineFailed'] and not s['lifecycle']['cleanupFailed'] and not s['capture']['solids']['bodies'],'no hidden solid/projection');require(s['lifecycle']['pointer']==len(s['capture']['native']['history'])-1,'current full tip')
def translation(actual,original,step,instance,kind):
    require(set(actual)==set(original),'exact primitive data fields')
    fields=[''] if kind=='Point' else ['c'] if kind=='Circle' else ['a','b'] if kind=='Segment' else ['a','b','c']
    for field in fields:
        p=actual[field] if field else actual;s=original[field] if field else original
        require(set(p)==set(s)=={'x','y'},'actual source points')
        for axis in ['x','y']:require(abs(q(p[axis])-(q(s[axis])+instance*q(step[axis])))<=BUDGET,'independent Fraction source translation50pm')
    if kind=='Circle':require(actual['r']==original['r'] and q(original['r'])>0,'original Circle radius unchanged')
    if kind=='Arc':require(actual['branch']==original['branch']=='proper-ccw','actual explicit Arc branch retained')
def inspect_source(s,b,control,inventory=None):
    settled(s);require(one([x for x in s['capture']['native']['sketches'] if x['id']==control['faceId']],'unrelated actual source')['source']==control['source'],'unrelated source bytes exact')
    require(s['capture']['native']['expressions']=='' and s['parameters']['definitions']==[],'numeric-only original document')
    src=source_at(s,b['faceId']);require(len(src['stages'])==1,'actual one-stage source');circle=one([o['id'] for o in b['roots'] if o['type']=='Circle'],'original Circle');constraints=src['stages'][0]['constraints'];require(len(constraints)<=1,'no invented equations');
    for c in constraints:require(c['typeId']=='RadiusLength' and c['objects']==[circle] and set(c['constants'])=={'length'} and Q(str(c['constants']['length']))==2 and c['stage']==0 and c['admission']['state'] in ['accepted','redundant'],'actual original RadiusLength2 equation')
    objects={o['id']:o for o in src['objects']};require(not constraints or abs(q(objects[circle]['data']['r'])-2)<=BUDGET,'actual radius equation residual');require(len(objects)==len(src['objects']),'unique roots');require(all(objects[o['id']]['type']==o['type'] for o in b['roots']),'actual seed identities/kinds');rows=[];generated=set()
    for stage,st in enumerate(src['stages']):
        for index,g in enumerate(st['generators']):
            require(set(g)=={'typeId','params','stage','generatedObjects'} and g['typeId']=='LinearSketchPattern' and g['stage']==stage,'one authoritative registered pattern record');p=g['params'];require(set(p)=={'objects','count','stepX','stepY'} and p['objects']==sorted(x['id'] for x in b['roots']),'canonical actual seed census');require(type(p['count']) is int and 2<=p['count']<=17,'TOTAL instance domain');step={'x':p['stepX'],'y':p['stepY']};require(all(finite(v) and abs(v)<=1e6 for v in step.values()) and any(step.values()),'explicit bounded nonzero step');ids=g['generatedObjects'];require(len(ids)==(p['count']-1)*len(p['objects']) and len(set(ids))==len(ids),'instance/source cardinality')
            for at,id in enumerate(ids):
                require(id not in generated and id not in p['objects'] and id in objects,'unique real output owner');generated.add(id);seed=objects[p['objects'][at%len(p['objects'])]];target=objects[id];require(target['stage']==stage and target['type']==seed['type'] and target['role']==seed['role'],'actual source/output type/role/stage');translation(target['data'],seed['data'],step,1+at//len(p['objects']),seed['type'])
            rows.append((stage,index,p,ids))
    require(len(rows)<=1 and set(objects)==set(x['id'] for x in b['roots'])|generated,'no flattened or unrelated authoring')
    if inventory is not None:
        require(inventory['unit']=='millimeter' and inventory['version']==1 and inventory['totalInstancesIncludeSeed'] is True and inventory['limits']=={'sources':16,'totalInstances':17,'outputs':256},'truthful bounded discovery');require(set(x['id'] for x in inventory['sources'])==set(objects),'source census');require(all(not x['canPattern'] for x in inventory['sources'] if x['id'] in generated),'generated roots read-only eligibility');require(len(inventory['patterns'])==len(rows),'real generator discovery')
        for stage,index,p,ids in rows:
            row=one([x for x in inventory['patterns'] if x['outputId']==ids[0]],'actual pattern locator');require(row=={'outputId':ids[0],'sourceIds':p['objects'],'generatedIds':ids,'stage':stage,'index':index,'count':p['count'],'step':{'x':p['stepX'],'y':p['stepY']},'status':'available','canEdit':True,'canRemove':True},'exact current native generator correspondence')
    return src

# Independent literal original fixture, before any derived pattern.
INITIAL_PRIMITIVES=[('Point',{'x':3,'y':4}),('Segment',{'a':{'x':0,'y':0},'b':{'x':2,'y':1}}),('Circle',{'c':{'x':2,'y':8},'r':1}),('Arc',{'a':{'x':1,'y':15},'b':{'x':-1,'y':15},'c':{'x':0,'y':15},'branch':'proper-ccw'})]
INITIAL_FRAME={'kind':'basis','frame':{'origin':[0,0,0],'x':[1,0,0],'y':[0,1,0],'z':[0,0,1]}}
def bind_initial_authoring(r):
    b,control=r['binding'],r['control'];s=one([x for x in r['phases'] if x['label']=='source-original'],'initial phase')['state']
    require({x['id'] for x in s['capture']['native']['sketches']}=={b['faceId'],control['faceId']} and b['faceId']!=control['faceId'],'exact two genuine source stores')
    appends=[x for x in r['commands'] if x['command']=='append-sketch-primitive'];frames=[x for x in r['commands'] if x['command']=='create-source-frame'];history=s['capture']['native']['history']
    require(len(appends)==8 and len(frames)==len(history)==2,'exact actual public source-authoring census')
    for face,binding in [(b['faceId'],b),(control['faceId'],None)]:
        frame=one([x for x in frames if x.get('result',{}).get('faceId')==face],'actual face creation');args,result=frame['args'],frame['result']
        require(set(args)=={'revision','unit','parent','placement'} and args['unit']=='millimeter' and args['parent'] is None and args['placement']==INITIAL_FRAME and result['changed'] is True and result['committed'] is True and result['authoredUndo'] is True,'actual original XY placement request/result')
        if binding is not None:require(result==binding['source'],'original source receipt binding')
        feature,index=result['featureId'],result['index'];require(type(feature) is int and type(index) is int and 0<=index<len(history),'actual safe source feature/index')
        require(history[index]=={'type':'SOURCE_FRAME_V1','params':{'version':1,'unit':'millimeter','featureId':feature,'parent':None,'placement':INITIAL_FRAME}},'retained source-frame history matches public request')
        commands=[x for x in appends if x['args']['faceId']==face];require(len(commands)==4,'four genuine requests for each source');raw=source_at(s,face)
        require(raw['version']==3 and raw['constants']=='' and raw['dimensions']==[] and raw['labels']==[] and raw['stages']==[{'constraints':[],'generators':[]}],'initial literal source has no extra equations/rulers/generators')
        actual=[]
        for command,(kind,data) in zip(commands,INITIAL_PRIMITIVES):
            args,response=command['args'],command.get('result',{});require('error' not in command and set(args)=={'revision','faceId','stage','role','kind','data'} and args['stage']==0 and args['role'] is None and args['kind']==kind and args['data']==data,'exact original primitive request')
            require(response.get('changed') is True and response.get('authoredUndo') is True and response['primitive']['kind']==kind,'actual admitted primitive result');identity=response['primitive']['id'];require(type(identity) is str and identity,'actual public root identity')
            actual.append({'id':identity,'type':kind,'role':None,'stage':0,'data':data})
        require(raw['objects']==actual and len({o['id'] for o in actual})==4,'initial root records match genuine requests/results')
        if binding is not None:require(binding['roots']==[{'id':o['id'],'type':o['type']} for o in actual],'original seed identity/kind order')
        else:require(json.loads(control['source'])==raw and one([x for x in s['capture']['native']['sketches'] if x['id']==face],'control store')['source']==control['source'],'control geometry is actual authored source')
    return history

def run(directory):
    d=Path(directory);raw=(d/'receipt.json').read_bytes();r=json.loads(raw);require(r['status']=='PASS' and r['qualification']=='REACHABLE_SCOPE_ONLY_REQUIRED_DEPENDENCY_OPEN','complete reachable whole only');require(r['requiredOpen']==['genuine-public-dependent-shrink'],'do not waive missing dependency workflow');require(not r['sourceSeeds'] and not r['privateAuthoring'] and not r['fakeReplies'] and r['totalInstancesIncludeSeed'] is True and r['sourceBudgetMm']==5e-8,'unchanged authority/budget');require(r['sourcePins']==r['sourcePinsAfter'] and r['ownedContextsRetired'] and r['sharedBrowserDisconnectedOnly'] and not r.get('pendingOpen') and not r.get('pendingDirect') and not r.get('retainedOutcome'),'source/cleanup custody')
    require(r['pins']['source']==r['source'] and r['pins']['desktop']==r['hostSource'],'exact actual compiled pin identities')
    before_roots=r['sourceCheckoutsBefore'];after_roots=r['sourceCheckoutsAfter']
    require(set(before_roots)=={'core','desktop','acceptance'} and before_roots==after_roots,'all three actual checkout identities before and after')
    require(len({x['root'] for x in before_roots.values()})==3,'separate immutable compiled and acceptance checkouts')
    for role,expected in [('core',r['source']),('desktop',r['hostSource']),('acceptance',r['acceptanceSource'])]:
        entry=before_roots[role];require(set(entry)=={'root','head','expectedCommit','status'} and entry['head']==entry['expectedCommit']==expected and entry['status']=='','actual clean named checkout '+role)
        require(Path(entry['root']).is_absolute(),'absolute actual checkout root')
    require(Path(before_roots['acceptance']['root']).resolve()==Path(__file__).resolve().parents[2],'executing independent checker acceptance root')
    roster=json.loads((Path(__file__).parent/'producer-roster.json').read_text());expected={(role,('test/sketch-pattern-public-workflow/'+name) if role=='acceptance' else name) for role,names in roster.items() for name in names};require({(s['role'],s['relative']) for s in r['sourceSnapshots']}==expected and len(r['sourceSnapshots'])==len(expected),'exact complete role-separated producer roster')
    for s in r['sourceSnapshots']:
        data=(d/s['snapshot']).read_bytes();require(hashlib.sha256(data).hexdigest()==s['sha256']==r['sourcePins'][s['role']+':'+s['relative']],'original producer source bytes');require(hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==s['gitBlobOID'],'actual producer Git blob');require(s['root']==before_roots[s['role']]['root'] and s['commit']==r['acceptanceSource' if s['role']=='acceptance' else 'source' if s['role']=='core' else 'hostSource'],'exact source role commit')
        if s['role']=='acceptance':require(data==(Path(__file__).resolve().parents[2]/s['relative']).read_bytes(),'executing independent reader frozen source')
        if s['relative']=='test/native-cad-container/archive_oracle.py':require(data==archive_path.read_bytes(),'executing transitive archive helper exact source')
    require([x['label'] for x in r['phases']]==PHASES==r['requiredPhases'] and [x['label'] for x in r['travels']]==TRAVELS==r['requiredTravels'] and [x['label'] for x in r['operations']]==OPERATIONS,'unique exact lifecycle rosters');require([x['label'] for x in r['refusals']]==list(REFUSALS)==r['requiredRefusals'],'exact negative roster');b=r['binding'];control=r['control'];initial_history=bind_initial_authoring(r);observations={}
    for row in r['observations']:
        require(row['label'] not in observations and row['before']==row['after'],'unique read-only observations');require(row['before']['capture']['native']['history']==initial_history,'original source-frame history exact');observations[row['label']]=inspect_source(row['before'],b,control,row['inventory'])
    require(set(observations)==set(PHASES),'all required actual source phases');base=observations['source-original'];require(len(base['objects'])==4 and not base['stages'][0]['generators'],'actual four seed roots');created=observations['created-four'];require(created['stages'][0]['generators'][0]['params']['count']==4 and len(created['objects'])==16,'seed plus THREE additional copies')
    commands=r['commands'];require([x['index'] for x in commands]==list(range(len(commands))),'ordered actual command trace');
    for row in r['operations']:
        inspect_source(row['before'],b,control);inspect_source(row['after'],b,control);require(row['result']['changed'] and row['result']['authoredUndo'] and row['before']['capture']['native']['counters']==row['after']['capture']['native']['counters'],'single genuine shared source mutation');trace=commands[row['commandStart']:row['commandEnd']];required='create-sketch-pattern' if row['label']=='create-count-four' else 'remove-sketch-pattern' if row['label'] in ['remove-pattern','reopened-remove'] else 'edit-sketch-pattern' if row['label'] in ['count-grow-five','count-shrink-three','count-regrow-four','pitch-diagonal-reverse','reopened-pitch-edit'] else 'apply-closed-sketch-radius' if row['label']=='source-circle-radius' else 'edit-closed-sketch-point';command=one([x for x in trace if x['command']==required],'actual operation command');require(command['result']==row['result'],'exact public result association')
        left=source_at(row['before'],b['faceId']);right=source_at(row['after'],b['faceId']);require(left['metadata']==right['metadata'] and left['boundary']==right['boundary'],'original frame/reference intent retained')
        if required in ['create-sketch-pattern','edit-sketch-pattern','remove-sketch-pattern']:
            def strip_pattern(src):
                x=json.loads(json.dumps(src));ids={id for st in x['stages'] for g in st['generators'] if g['typeId']=='LinearSketchPattern' for id in g['generatedObjects']};x['objects']=[o for o in x['objects'] if o['id'] not in ids]
                for st in x['stages']:st['generators']=[g for g in st['generators'] if g['typeId']!='LinearSketchPattern']
                return x
            require(strip_pattern(left)==strip_pattern(right),'pattern mutation preserves every original source/constraint/metadata field')
            if required!='remove-sketch-pattern':
                g=one([g for st in right['stages'] for g in st['generators']],'actual resulting generator');require(g['params']['count']==command['args']['count'] and {'x':g['params']['stepX'],'y':g['params']['stepY']}==command['args']['step'],'actual original requested count/vector')
        if required in ['edit-closed-sketch-point','apply-closed-sketch-radius']:
            require([g for st in left['stages'] for g in st['generators']]==[g for st in right['stages'] for g in st['generators']],'source edit preserves original generator intent/IDs')
            for k in ['version','dimensions','labels']:require(left[k]==right[k],'source edit retains '+k)
            if required=='edit-closed-sketch-point':require([st['constraints'] for st in left['stages']]==[st['constraints'] for st in right['stages']],'coordinate edit preserves exact original equations')
            else:require(not left['stages'][0]['constraints'] and len(right['stages'][0]['constraints'])==1,'real RadiusLength addition')
            roots={o['type']:o['id'] for o in b['roots']};label=row['label'];target='Segment' if label=='source-segment-edit' else 'Circle' if label in ['source-circle-radius','source-circle-center'] else 'Point';before_roots={o['id']:o for o in left['objects'] if o['id'] in roots.values()};after_roots={o['id']:o for o in right['objects'] if o['id'] in roots.values()};require(all(before_roots[id]==after_roots[id] for id in before_roots if id!=roots[target]),'unrelated original seed BIT exact');o=after_roots[roots[target]];args=command['args']
            require({k:v for k,v in o.items() if k!='data'}=={k:v for k,v in before_roots[o['id']].items() if k!='data'},'original target identity/type/role/stage unchanged')
            if target=='Segment':require(o['data']['a']==before_roots[o['id']]['data']['a'],'requested endpoint does not move its original opposite endpoint')
            if required=='apply-closed-sketch-radius':require(o['data']['r']==args['radius']==2,'actual requested source RadiusLength2');require(before_roots[o['id']]['data']['c']==o['data']['c'],'radius edit preserves original center')
            else:
                field=None if target=='Point' else 'b' if target=='Segment' else 'c';actual=o['data'][field] if field else o['data'];require(actual=={'x':args['x'],'y':args['y']},'actual requested original coordinate');
                if target=='Circle':require(o['data']['r']==before_roots[o['id']]['data']['r'],'center edit preserves original radius')
    ops={x['label']:x for x in r['operations']};g=lambda name:ops[name]['result']['pattern']['generatedIds'];require(g('count-grow-five')[:12]==g('create-count-four') and g('count-shrink-three')==g('count-grow-five')[:8] and g('count-regrow-four')[:8]==g('count-shrink-three') and not set(g('count-regrow-four')[8:])&set(g('count-grow-five')[8:]),'retained/fresh retired identity semantics');require(g('pitch-diagonal-reverse')==g('count-regrow-four'),'pitch retains actual output IDs')
    for row in r['travels']:
        native_equal(row['after'],row['expected']);settled(row['after']);trace=commands[row['commandIndex']:];command=one([x for x in trace[:2] if x['command']=='travel-authored-edit'],'actual shared travel command');require(command['args']['direction']==row['direction'] and command['result']==row['result'],'actual travel direction/result');require(row['before']['capture']['native']['counters']==row['after']['capture']['native']['counters'],'travel highwater retained')
    for row in r['refusals']:
        require(row['before']==row['after'] and row['error'] is not None and not row['error']['committed'] and not row['error']['possiblyCommitted'],'complete pure refusal state');settled(row['after']);expected=REFUSALS[row['label']];require(row['error']['code']==expected if expected else row['error']['name']=='AbortError','actual refusal layer/code');require(any(x.get('error')==row['error'] for x in commands[row['commandStart']:row['commandEnd']]),'actual failed command binding')
    direct=r['directBoundary'];require([x['action'] for x in direct['calls']]==['create','edit'],'both genuine direct-Core captures')
    req=direct['originalRequest'];require(req['count']==4 and req['step']=={'x':7,'y':1} and set(req['sourceIds'])==set(x['id'] for x in b['roots']),'original direct create tuple')
    require(direct['foreignId'] not in req['sourceIds'],'actual different-source negative caller identity')
    created=direct['calls'][0];edited=direct['calls'][1]
    for row in direct['calls']:
        obs=row['observation'];request=row['originalRequest'];require(row['phase']=='settled' and obs['ok'] is True and obs['originalRequest']==request,'valid direct call must genuinely succeed, never a refusal pass')
        require(obs['result']['changed'] is True and obs['result']['authoredUndo'] is True,'genuine direct publication')
        expected_caller={'step':{'x':999,'y':999}}
        if row['action']=='create':expected_caller['sourceIds']=[direct['foreignId']]
        require(obs['changedCaller']==expected_caller,'actual post-invocation caller-only mutation')
        before=source_at(row['before'],b['faceId']);after=source_at(row['after'],b['faceId']);objects={o['id']:o for o in after['objects']};p=obs['result']['pattern']
        require(p['count']==request['count']==4 and p['step']==request['step'] and p['sourceIds']==sorted(req['sourceIds']),'returned original captured tuple')
        g=one([g for st in after['stages'] for g in st['generators'] if g['generatedObjects'][0]==p['outputId']],'actual direct generator')
        require(g['params']=={'objects':p['sourceIds'],'count':4,'stepX':request['step']['x'],'stepY':request['step']['y']} and g['generatedObjects']==p['generatedIds'],'actual original-intent generator')
        require(len(p['generatedIds'])==12 and len(set(p['generatedIds']))==12 and not set(p['generatedIds'])&set(p['sourceIds']),'real direct output identities')
        for at,id in enumerate(p['generatedIds']):
            seed=objects[p['sourceIds'][at%len(p['sourceIds'])]];target=objects[id];require(target['type']==seed['type'] and target['role']==seed['role'] and target['stage']==seed['stage'],'actual direct source/output ownership')
            translation(target['data'],seed['data'],request['step'],1+at//len(p['sourceIds']),seed['type'])
        restored=json.loads(json.dumps(after))
        if row['action']=='create':
            require(request==req and p['outputId']==p['generatedIds'][0] and not set(p['generatedIds'])&{o['id'] for o in before['objects']},'actual original direct create and fresh IDs')
            restored['objects']=[o for o in restored['objects'] if o['id'] not in p['generatedIds']]
            for st in restored['stages']:st['generators']=[g for g in st['generators'] if g['generatedObjects'][0]!=p['outputId']]
        else:
            prior=created['observation']['result']['pattern'];require(request['outputId']==prior['outputId'] and request['step']=={'x':5,'y':-2} and p['generatedIds']==prior['generatedIds'],'genuine direct edit retains every actual output ID')
            original_objects={o['id']:o for o in before['objects']}
            restored['objects']=[original_objects[o['id']] if o['id'] in p['generatedIds'] else o for o in restored['objects']]
            for at,st in enumerate(restored['stages']):
                st['generators']=[next(old for old in before['stages'][at]['generators'] if old['generatedObjects'][0]==p['outputId']) if g['generatedObjects'][0]==p['outputId'] else g for g in st['generators']]
        require(restored==before,'direct command changes only original requested generator/output fields')
        require(row['after']['capture']['native']['history']==row['before']['capture']['native']['history'] and row['after']['capture']['native']['counters']==row['before']['capture']['native']['counters'],'direct source operation preserves history/allocator')
        require(row['after']['capture']['journal']['canUndo'] is True and row['after']['capture']['journal']['undoTarget']=={'kind':'sketch-bytes','faceId':b['faceId']} and row['after']['capture']['journal']['revision']!=row['before']['capture']['journal']['revision'],'actual direct shared journal boundary')
        settled(row['before']);settled(row['after'])
    require([x['label'] for x in direct['travels']]==['direct-create-undo','direct-create-redo','direct-edit-undo','direct-edit-redo'],'both direct operations have immediate actual Undo/Redo')
    for t,expected,direction in zip(direct['travels'],[created['before'],created['after'],edited['before'],edited['after']],['undo','redo','undo','redo']):
        require(t['direction']==direction,'actual direct travel direction');native_equal(t['expected'],expected);native_equal(t['after'],expected);settled(t['after'])
        command=one([x for x in commands[t['commandStart']:t['commandEnd']] if x['command']=='travel-authored-edit'],'actual direct shared travel command')
        require(command['result']==t['result'] and command['args']['direction']==direction and t['after']['capture']['journal']['redoTarget' if direction=='undo' else 'undoTarget']==t['before']['capture']['journal']['undoTarget' if direction=='undo' else 'redoTarget'],'actual inverse direct journal target/result')
    native_equal(created['before'],direct['before']);native_equal(edited['before'],created['after']);native_equal(direct['removalBefore'],edited['after'])
    removal=one([x for x in commands[direct['removalCommandStart']:direct['removalCommandEnd']] if x['command']=='remove-sketch-pattern'],'actual direct-pattern public removal')
    require(removal['result']==direct['removalResult'] and removal['args']['outputId']==created['observation']['result']['pattern']['outputId'] and direct['removalResult']['changed'] is True,'actual shared direct-pattern removal')
    native_equal(direct['restored'],direct['before'])
    no=r['noop'];require(no['before']==no['after'] and not no['result']['changed'] and not no['result']['authoredUndo'],'no-op preserves full source/J/redo state');require(one([x for x in commands[no['commandStart']:no['commandEnd']] if x['command']=='edit-sketch-pattern'],'no-op command')['result']==no['result'],'no-op actual command')
    require([x['label'] for x in r['saves']]==['A','B','C'] and [x['label'] for x in r['reopens']]==['A','B','C'] and len(r['writes'])==3,'three full native Save/freshOpen cycles');artifacts=[]
    for index,(saved,opened) in enumerate(zip(r['saves'],r['reopens'])):
        write=r['writes'][index];require(write['sequence']==saved['writeSequence']==index and write['label']==saved['label'] and write['phase']=='settled' and write['result']==saved['result'] and write['artifact']['sha256']==saved['sha256']==saved['localSha256'],'submitted own write settlement');command=commands[write['commandIndex']];require(command['command']=='save' and command['result']==write['result'] and command['windowId']==write['windowId'] and saved['result']['committed'] and saved['result']['persistence']=='browser','actual Save command/window binding');require(saved['before']['capture']==saved['after']['capture'],'Save does not author source/J');a=archive.read_archive(d/saved['savedFile']);require(a['sha256']==saved['sha256'] and a['bytes']==saved['bytes'],'actual stored native artifact');n=saved['before']['capture']['native'];model=a['envelope']['project']['model'];require(model['history']==n['history'] and model['counters']==n['counters'] and model['expressions']==n['expressions'],'exact archive H/IDs/physical intent');require(a['rawSketches']=={x['id']:x['source'] for x in n['sketches']} and a['envelope'].get('presentation')==n['presentation'],'exact raw saved source/presentation');native_equal(opened['opened'],saved['before']);require(not opened['opened']['capture']['journal']['canUndo'] and not opened['opened']['capture']['journal']['canRedo'],'fresh Open session journal reset');require(opened['path']==write['path'],'actual own settled path');artifacts.append({'file':saved['savedFile'],'sha256':a['sha256'],'designRevision':a['manifest']['designRevision']})
    return {'status':'PASS','qualification':'PARTIAL_REQUIRED_DEPENDENT_SHRINK_OPEN','scope':'Reachable numeric ordinary Point/Segment/Circle/Arc associative pattern lifecycle/source50pm/native container, not Native generated-profile BRep or typed patterns','requiredOpen':r['requiredOpen'],'wholeReceiptSha256':hashlib.sha256(raw).hexdigest(),'observations':len(r['observations']),'travelDirectionsActuallyExercised':len(r['travels'])+len(direct['travels']),'artifacts':artifacts}
if __name__=='__main__':print(json.dumps(run(sys.argv[1]),indent=2))
