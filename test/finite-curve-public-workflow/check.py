#!/usr/bin/env python3
"""Complete AFTER-WHOLE source/query/Native/archive oracle; no product imports."""
import copy,hashlib,json,math,re,subprocess,sys
from pathlib import Path
from fractions import Fraction as F
from query_math import check_query,json_source,number,point,sub,dot,require
import query_math as query_math_module
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive,parse_json
import archive_oracle as archive_module
PHASES=['runtime-start','unrelated-prism','query-roster','trim-travel','ray-both-choices','noop-collapse','fixed-refusal','selection-refusals','consumed-profile','source-stale','save-A','open-A','typed-radius','parameter-stale','save-B','open-B','reopened-reedit','save-C','open-C','healthy-final']
TRAVELS=['point-create-undo','point-create-redo','trim-undo','trim-redo','ray-six-undo','ray-four-undo','ray-four-redo','consumed-trim-undo','consumed-trim-redo','restore-right-fix','typed-definition-undo','typed-definition-redo','reopened-edit-undo','reopened-edit-redo']
CASES=['segment-cross','segment-endpoint','finite-exclusion','separated-parallel','linear-overlap','linear-contact','segment-circle','segment-circle-tangent','segment-circle-empty','circle-circle','circle-circle-tangent','circle-near-inside','circle-near-outside','circle-coincident','circle-nested','circle-disjoint','arc-quarter','arc-major','arc-seam','arc-complementary-contact','circle-quarter-overlap','native-census-uncertainty','tiny-proper-positive','source-incidence-uncertainty','full-arc-required-open']
REVERSE=['segment-cross','segment-circle','circle-circle','arc-quarter']
REFUSALS={'proper-arc-collapsed':'INVALID_ARC_BRANCH','opposite-collapse':'CURVE_ENDPOINT_DEGENERATE','fixed-target-refusal':'COORDINATE_CONFLICT','unknown-query-does-not-consume':'STALE_CURVE_QUERY','wrong-action-domain':'CURVE_QUERY_DOMAIN_MISMATCH','foreign-own-face-root':'FINITE_CURVE_SOURCE_UNSUPPORTED_TARGET','open-profile-source-policy':'OPEN_OR_AMBIGUOUS_PROFILE','downstream-overlapping-profile':'OPEN_OR_AMBIGUOUS_PROFILE','old-ticket-after-source-edit':'STALE_CURVE_QUERY','old-ticket-after-undo-restored-bytes':'STALE_CURVE_QUERY','old-ticket-after-parameter-edit':'STALE_CURVE_QUERY',**{'old-ticket-after-open-'+s:'STALE_CURVE_QUERY' for s in 'ABC'}}
REFUSALS.update({'unknown-event-does-not-consume':'CURVE_QUERY_SELECTION_MISMATCH','old-ticket-after-new-query':'STALE_CURVE_QUERY'})
LOCAL=['CONTRACT.md','README.md','cases.mjs','example.mjs','source-custody.mjs','desktop-driver.mjs','check.py','query_math.py']
IMPORTED={('core','test/native-cad-container/archive_oracle.py'),('desktop','test/agent-cad-corpus/sweep/signed-harness.mjs'),('desktop','test/agent-cad-corpus/strict-join/oracle.mjs')}
BUDGET=F(1,20000000)
def input_segment(a,b):return {'type':'Segment','data':{'a':dict(zip(('x','y'),a)),'b':dict(zip(('x','y'),b))}}
def input_circle(c,r):return {'type':'Circle','data':{'c':dict(zip(('x','y'),c)),'r':r}}
def input_arc(a,b,c=(0,0),branch='proper-ccw'):return {'type':'Arc','data':{'a':dict(zip(('x','y'),a)),'b':dict(zip(('x','y'),b)),'c':dict(zip(('x','y'),c)),'branch':branch}}
INPUTS=[
 (input_segment((-5,0),(5,0)),input_segment((0,-5),(0,5))),
 (input_segment((-5,0),(5,0)),input_segment((5,0),(8,3))),
 (input_segment((0,0),(1,0)),input_segment((2,-1),(2,1))),
 (input_segment((0,0),(4,0)),input_segment((0,1),(4,1))),
 (input_segment((0,0),(4,0)),input_segment((2,0),(6,0))),
 (input_segment((0,0),(2,0)),input_segment((2,0),(4,0))),
 (input_segment((-6,3),(6,3)),input_circle((0,0),5)),
 (input_segment((-6,5),(6,5)),input_circle((0,0),5)),
 (input_segment((-6,6),(6,6)),input_circle((0,0),5)),
 (input_circle((0,0),5),input_circle((6,0),5)),
 (input_circle((0,0),5),input_circle((10,0),5)),
 (input_circle((0,0),5),input_circle((10-1e-6,0),5)),
 (input_circle((0,0),5),input_circle((10+1e-6,0),5)),
 (input_circle((0,0),5),input_circle((0,0),5)),
 (input_circle((0,0),5),input_circle((0,0),3)),
 (input_circle((0,0),5),input_circle((20,0),5)),
 (input_arc((5,0),(0,5)),input_segment((-6,3),(6,3))),
 (input_arc((0,5),(5,0)),input_segment((-6,3),(6,3))),
 (input_arc((3,-4),(3,4)),input_segment((4,-6),(4,6))),
 (input_arc((5,0),(0,5)),input_arc((0,5),(5,0))),
 (input_circle((0,0),5),input_arc((5,0),(0,5))),
 (input_segment((0,0),(1,0)),input_segment((0,2**-54),(1,2**-53))),
 (input_arc((1e-7,0),(0,1e-7)),input_segment((-2e-7,0),(2e-7,0))),
 (input_arc((1,0),(2**-27,1)),input_segment((-2,0),(2,0))),
 (input_arc((1,0),(1,0),branch='full-ccw'),input_segment((-2,0),(2,0)))
]
def one(rows,label):require(len(rows)==1,'one '+label);return rows[0]
def digest(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def near(a,b,t=BUDGET):require(abs(number(a)-F(b))<=t,f'{a} != {b}, bound {t}')
def same_authored(a,b):
    for key in ('history','source','sketches','expressions','counters','presentation'):require(a['capture']['native'][key]==b['capture']['native'][key],'exact authored '+key)
    require(a['parameters']['definitions']==b['parameters']['definitions'] and a['manufacturing']==b['manufacturing'] and a['drawing']['definition']==b['drawing']['definition'],'exact definitions/material/drawing')
def settled(s):
    r=s['ownership']['resources'];require(s['ownership']['processing'] is False and r['cleanupFailed'] is False and all(r[k]==0 for k in ('accepted','candidates','mounts')) and r['owners']==r['detached'],'all owned resources settled')
    require(s['lifecycle']['pipelineFailed'] is False and s['lifecycle']['cleanupFailed'] is False and s['lifecycle']['pointer']==len(s['capture']['native']['history'])-1,'healthy full-tip accepted state')
def scalar(v,q):
    if type(v) is str and v in q:return q[v]
    require(type(v) in (int,float,str),'literal or bound length')
    return F(v)
def quantities(s):
    definitions=s['parameters']['definitions'];raw=s['capture']['native']['expressions']
    if not definitions:return {}
    require(len(definitions)==1 and definitions[0]['name']=='boundaryR' and definitions[0]['dimension']=='length' and definitions[0]['expression'] in ('mm(1)','mm(2)'),'exact original named LENGTH graph')
    prefix='codi-physical-parameters:1\n';require(raw.startswith(prefix) and json.loads(raw[len(prefix):])==definitions,'raw authoritative name/formula preservation')
    return {'boundaryR':F(definitions[0]['expression'][3:-1])}
def equations(row):
    s=json_source(row['before'],row['request']['faceId']);i=row['inspection'];objects={o['id']:o for o in s['objects']};points={};q=quantities(row['before'])
    for p in i['points']:
        require(p['id'] not in points and p['parentId'] in objects,'unique actual point/parent ownership');o=objects[p['parentId']];d=o['data']
        options=[d] if o['type']=='Point' else [d['c']] if o['type']=='Circle' else [d[k] for k in (('a','b','c') if o['type']=='Arc' else ('a','b'))]
        matches=[v for v in options if all(abs(number(p[k])-number(v[k]))<=BUDGET for k in ('x','y'))]
        require(matches and all(point(v)==point(matches[0]) for v in matches),'actual owned coordinate, coincident full-Arc endpoints only when identical');points[p['id']]=matches[0]
    original=[c for stage in s['stages'] for c in stage['constraints']]
    require(len(original)==len(i['constraints']),'complete original constraint census')
    for c,observed in zip(original,i['constraints']):
        for k in ('typeId','objects','constants','admission'):require(observed.get(k,{})==c.get(k,{}),'cold/original actual row '+k)
        require(c['admission']['state'] in ('accepted','redundant'),'valid original admission');refs=c['objects'];k=c.get('constants',{});typ=c['typeId']
        if typ=='PCoincident':
            for axis in ('x','y'):near(points[refs[0]][axis],number(points[refs[1]][axis]))
        elif typ=='LockPoint':
            for axis in ('x','y'):near(points[refs[0]][axis],scalar(k[axis],q))
        elif typ in ('Horizontal','Vertical','SegmentLength'):
            d=objects[one(refs,'Segment equation')]['data'];a,b=point(d['a']),point(d['b']);v=sub(b,a)
            if typ=='SegmentLength':require(abs(dot(v,v)-scalar(k['length'],q)**2)<=BUDGET*(2*abs(scalar(k['length'],q))+BUDGET),'original length equation')
            else:
                angle=scalar(k['angle'],q);axes={F(0):(1,0),F(90):(0,1),F(180):(-1,0),F(270):(0,-1)};require(angle in axes,'actual canonical source direction');ux,uy=axes[angle];require(abs(-uy*v[0]+ux*v[1])<=BUDGET and ux*v[0]+uy*v[1]>0,'original ordered line equation')
        elif typ=='RadiusLength':
            d=objects[one(refs,'radius owner')]['data'];require(objects[refs[0]]['type']=='Circle','actual Circle radius, no proxy');near(d['r'],scalar(k['length'],q))
        elif typ=='FixSegment':
            d=objects[one(refs,'whole fixed Segment')]['data']
            for end in ('a','b'):
                for axis in ('x','y'):near(d[end][axis],scalar(k[end+axis],q))
            v=sub(point(d['b']),point(d['a']));length=scalar(k['length'],q);require(abs(dot(v,v)-length*length)<=BUDGET*(2*abs(length)+BUDGET),'whole Fix length');near(float(k['direction']),math.atan2(float(v[1]),float(v[0])),F(1,10**8))
        else:raise ValueError('Unreviewed original fixture equation '+typ)
def refusal_state(row):
    before,after=row['before'],row['after'];settled(before);settled(after)
    if not row['candidate']:require(after==before,'FULL pure-refusal state, no normalization');return
    require(row['label']=='downstream-overlapping-profile','only declared actual downstream candidate predicate')
    for s in (before,after):
        require(s['parameters']['revision']==s['capture']['journal']['revision'],'parameter inspection binds this SAME actual journal/document token')
        require(s['host']['revision']==s['drawing']['revision'] and s['capture']['solids']['revision']==s['drawing']['geometryRevision'],'tokens bind actual current document/body');j=s['capture']['journal']['revision'];require(j.endswith(':'+s['host']['revision']) and j.startswith(str(s['lifecycle']['generation'])+':'),'same document/generation journal suffix')
    require(after['lifecycle']['epoch']==before['lifecycle']['epoch']+1 and after['host']['revision']!=before['host']['revision'] and after['capture']['solids']['revision']!=before['capture']['solids']['revision'],'exactly one attempted candidate invalidation')
    prefix=before['capture']['journal']['revision'][:-len(before['host']['revision'])];require(after['capture']['journal']['revision']==prefix+after['host']['revision'],'unchanged J revision prefix')
    a,b=copy.deepcopy(before),copy.deepcopy(after)
    for s in (a,b):
        del s['lifecycle']['epoch'];del s['host']['revision'];del s['capture']['solids']['revision'];del s['capture']['journal']['revision'];del s['parameters']['revision'];del s['drawing']['revision'];del s['drawing']['geometryRevision']
    require(a==b,'all source/versions/J/definitions/native bodies/resources exact after candidate refusal')
def native_geometry(row,receipt):
    b=row['binding'];s=json_source(row['before'],b['faceId']);objects={o['id']:o for o in s['objects']};ordinary=b['body']==receipt['unrelated']['body'];shape=receipt['unrelated'] if ordinary else receipt['consumed']
    require(b['body']==shape['body'] and b['faceId']==shape['faceId'] and b['ids']==shape['ids'],'actual original source/producer binding');edges=[objects[id]['data'] for id in b['ids']];require(len(edges)==4,'genuine four-edge boundary')
    for j,d in enumerate(edges):
        for axis in ('x','y'):near(d['b'][axis],number(edges[(j+1)%4]['a'][axis]))
    reference=receipt['unrelated']['inspection'] if ordinary else one([q for q in receipt['queries'] if q['label']=='consumed-top-construction'],'actual prior connected-source inspection')['inspection']
    baseline=s if ordinary else json_source(one([q for q in receipt['queries'] if q['label']=='consumed-top-construction'],'actual prior source')['before'],b['faceId']);base_objects={o['id']:o for o in baseline['objects']}
    def child(id,end):
        v=base_objects[id]['data'][end]
        return one([p for p in reference['points'] if p['parentId']==id and all(abs(number(p[k])-number(v[k]))<=BUDGET for k in ('x','y'))],'actual inspected owned boundary child')['id']
    constraints=[c for stage in s['stages'] for c in stage['constraints']]
    for j,id in enumerate(b['ids']):
        pair={child(id,'b'),child(b['ids'][(j+1)%4],'a')}
        require(any(c['typeId']=='PCoincident' and set(c['objects'])==pair for c in constraints),'explicit source relation supplies endpoint identity; no tolerance weld')
    vertices=[point(d['a']) for d in edges];area=abs(sum(vertices[j][0]*vertices[(j+1)%4][1]-vertices[j][1]*vertices[(j+1)%4][0] for j in range(4)))/2;depth=F(4 if ordinary else 2)
    expected_area=F(60) if ordinary else F(12) if 'rectangle' in row['label'] else F(9);require(abs(area-expected_area)<=7*BUDGET,'independent represented-vertex shoelace and propagated endpoint error (not a welded mesh)')
    body=one([x for x in row['before']['capture']['solids']['bodies'] if x['id']==b['body']['outputId'] and x['featureId']==b['body']['featureId']],'actual current body');m=body['metrics'];require(m['resultKind']=='single-solid' and m['solidCount']==1 and m['nativeValidity']['valid'] is True,'actual Native solid evidence')
    creation=one([x for x in receipt['commands'] if x['command']=='create-selected-extrusion' and x.get('result',{}).get('outputId')==body['id']],'actual original public constructor')
    op=one([x for x in row['before']['capture']['native']['history'] if x['type']=='WORKER_SELECTED_PROFILE_EXTRUDE_V2' and x['params']['featureId']==body['featureId']],'actual producing history identity');p=op['params']
    require(p['faceId']==b['faceId']==creation['args']['faceId'] and p['depth']==depth==creation['args']['depth'] and p['engineRevision']==receipt['engineRevision']==creation['args']['engineRevision'] and p['regionId']==creation['args']['regionId'],'actual same source/region/producer/depth/build, no runtime-output identity proxy')
    require('sha256:'+m['runtime']['jsSha256']+':'+m['runtime']['wasmSha256']==receipt['engineRevision'],'actual exact part backend');near(m['nativeVolume'],area*depth,F(1,10**6));near(m['nativeVolume'],expected_area*depth,F(1,10**6))
    for k in range(2):near(m['nativeBounds']['min'][k],min(p[k] for p in vertices),F(1,10**6));near(m['nativeBounds']['max'][k],max(p[k] for p in vertices),F(1,10**6))
    near(m['nativeBounds']['min'][2],0,F(1,10**6));near(m['nativeBounds']['max'][2],depth,F(1,10**6));req,reply=row['request'],row['reply'];require(reply['quality']=='native-re-evaluation-observation','actual Native read quality')
    for key in ('revision','version','unit','engine','engineRevision','bodyId','featureId'):require(reply[key]==req[key],'actual point observation '+key)
    require(req['revision']==row['before']['capture']['solids']['revision'] and req['bodyId']==body['id'] and req['featureId']==body['featureId'],'point read issued from SAME current source/body');require([p['point'] for p in reply['points']]==req['points'],'actual unchanged submitted Native points')
    if ordinary:points=[[-75,-37,2],[-80,-37,2],[-81,-37,2],[-75,-37,5]];classes=['inside','boundary','outside','outside']
    else:points=[[23,2,1],[20.5,2,1],[21,1.5,1],[23,3,1],[21,3,1],[19,1,1]];classes=['inside','inside','inside','boundary','boundary','outside'] if expected_area==12 else ['inside','outside','boundary','boundary','outside','outside']
    require(req['points']==points and [p['classification'] for p in reply['points']]==classes,'independent finite part interior/boundary/exterior truth');require(row['after']==row['before'],'Native read leaves FULL state exact')
    return {'label':row['label'],'sourceArea':str(area),'depth':str(depth),'nativeVolume':m['nativeVolume']}

def check(directory,source,host_source,acceptance):
    directory=Path(directory);raw=(directory/'receipt.json').read_bytes();require(len(raw)<=128*1024*1024,'bounded actual whole receipt');r=parse_json(raw)
    require(r['status']=='PASS' and r['ownedContextsRetired'] is True and r['sharedBrowserDisconnectedOnly'] is True,'complete settled browser PASS FIRST')
    require((r['source'],r['hostSource'],r['acceptanceSource'])==(source,host_source,acceptance),'Root-supplied exact independent producer tuple')
    require(not r['sourceSeeds'] and not r['privateAuthoring'] and not r['fakeReplies'],'actual public-only authoring');require(r['sourcePins']==r['sourcePinsAfter'],'before/after producer hashes unchanged')
    roster={(s['repository'],s['relative']) for s in r['sourceSnapshots']};require(len(roster)==len(r['sourceSnapshots']) and IMPORTED<=roster,'unique complete executing external helper roster')
    require({('core','test/finite-curve-public-workflow/'+p) for p in LOCAL}<=roster,'every executing local reader/driver/helper/contract')
    critical={'web/app/cad/craft/closedSketchTransitions.ts','web/app/cad/craft/craftBundle.ts','web/app/sketcher/headless/finiteCurveEndpointTransition.ts','web/app/sketcher/headless/finiteCurveCertificateEnvelope.mjs','web/app/sketcher/headless/finiteCurveSourceExtraction.ts','web/app/sketcher/headless/client.ts','web/app/sketcher/headless/solveWorker.ts','web/app/sketcher/headless/transitionClient.ts','modules/engine/mount/finiteCurveFiniteCertificate.mjs','modules/engine/mount/finiteCurveCertificateArithmetic.mjs'}
    require({('core',p) for p in critical}<=roster and ('desktop','apps/system/jsketcher/curve-query-commands.mjs') in roster,'actual authority/semantic/Worker/Host source closure')
    require(set(r['sourcePins'])=={a+':'+b for a,b in roster},'exact before/after source inventory')
    executing={'test/finite-curve-public-workflow/check.py':Path(__file__).resolve(),'test/finite-curve-public-workflow/query_math.py':Path(query_math_module.__file__).resolve(),'test/native-cad-container/archive_oracle.py':Path(archive_module.__file__).resolve()}
    for row in r['sourceSnapshots']:
        key=row['repository']+':'+row['relative'];commit=acceptance if row['repository']=='core' and row['relative'].startswith('test/finite-curve-public-workflow/') else source if row['repository']=='core' else host_source
        require(row['commit']==commit,'exact source role, no report-selected helper identity');source_file=directory/row['file'];require(source_file.is_file() and not source_file.is_symlink() and digest(source_file)==row['sha256']==r['sourcePins'][key],'frozen actual source bytes')
        actual=subprocess.check_output(['git','-C',row['root'],'show',commit+':'+row['relative']]);oid=subprocess.check_output(['git','-C',row['root'],'rev-parse',commit+':'+row['relative']],text=True).strip();require(hashlib.sha256(actual).hexdigest()==row['sha256'] and oid==row['gitBlobOID'],'exact Git object/helper association')
        if row['repository']=='core' and row['relative'] in executing:require(digest(executing[row['relative']])==row['sha256'],'actual executing reader/helper matches its frozen Git-bound bytes')
    require(r['caseRoster']==CASES and [p['label'] for p in r['phases']]==PHASES,'exact case/phase membership/order');require(sorted(x['label'] for x in r['travels'])==sorted(TRAVELS),'exact actual both-direction travel roster')
    for row in r['phases']:settled(row['state'])
    runtime=[row for row in r['rows'] if row['label']=='Actual frozen composed byte tuple'];require(len(runtime)==4,'initial plus THREE genuinely fresh contexts')
    for row in runtime:require({x['name']:x['sha256'] for x in row['files']}==r['pins']['files'] and row['outer']['sha256']==r['pins']['outer']['sha256'],'every actual composed runtime asset/outer hash')
    summaries=[]
    for row in r['queries']:
        require(row['before']==row['after'],'query source/host/J/native/resources FULL exact');settled(row['before']);equations(row);summaries.append(check_query(row))
    labels=[x['label'] for x in r['queries']]
    for label in CASES+[x+'-reverse' for x in REVERSE]:require(labels.count(label)==1,'one exact required public query '+label)
    require(len(INPUTS)==len(CASES),'independent input roster complete')
    for label,wanted in zip(CASES,INPUTS):
        row=one([x for x in r['queries'] if x['label']==label],'actual case '+label);s=json_source(row['before'],row['request']['faceId']);objects={o['id']:o for o in s['objects']}
        require(len(row['binding']['ids'])==2,'actual authored pair')
        for id,expected in zip(row['binding']['ids'],wanted):require({k:objects[id][k] for k in ('type','data')}==expected,'exact original public fixture '+label)
    require(sorted(x['label'] for x in r['refusals'])==sorted(REFUSALS),'exact negative/lifetime roster')
    control=r['downstreamControl'];require(control['kind']=='right-top-to-fixed-bottom-left','genuine deterministic invalid profile control')
    invalid=one([x for x in r['refusals'] if x['label']=='downstream-overlapping-profile'],'actual downstream refusal');control_source=json_source(invalid['before'],r['consumed']['faceId']);objects={o['id']:o for o in control_source['objects']};ids=r['consumed']['ids'];constraints=[c for stage in control_source['stages'] for c in stage['constraints']]
    require([c['typeId'] for c in constraints]==['PCoincident']*4+['FixSegment'],'only actual bottom Fix and retained corner relations; other corner remains free')
    fix=constraints[-1];require(fix['objects']==[ids[0]] and fix['constants']=={'ax':'20','ay':'0','bx':'24','by':'0','length':'4','direction':'0'},'actual source-authenticated fixed bottom A/B')
    def owned(id,end):
        xy=objects[id]['data'][end]
        return one([p for p in control['inspection']['points'] if p['parentId']==id and p['x']==xy['x'] and p['y']==xy['y']],'actual inspected endpoint owner')
    for i,id in enumerate(ids):require(any(c['typeId']=='PCoincident' and set(c['objects'])=={owned(id,'b')['id'],owned(ids[(i+1)%4],'a')['id']} for c in constraints),'actual closed-chain PC identity, not recipe proximity')
    A,B=objects[ids[0]]['data']['a'],objects[ids[0]]['data']['b'];C=owned(ids[1],'b');require(A=={'x':20,'y':0} and B=={'x':24,'y':0} and C['x']==24 and C['y']==3,'original nondegenerate current valid source')
    require(control['rightTop']==C and control['fixedBottomLeft']==owned(ids[0],'a'),'actual original moving/fixed point observations')
    request=control['request'];require(request=={'revision':control['inspection']['revision'],'faceId':r['consumed']['faceId'],'id':C['id'],'x':A['x'],'y':A['y']},'actual public request places C exactly at fixed A')
    command=r['commands'][control['commandIndex']];require(command['command']=='edit-closed-sketch-point' and command['args']==request and command['error']['code']=='OPEN_OR_AMBIGUOUS_PROFILE','actual issued downstream operation/code')
    # Fixed AB plus exact C=A forces BC=reverse(AB). PC ties top/left through
    # their actual shared D, so CD=reverse(DA) for every possible solved D.
    # Thus the intended candidate has no simple positive-area boundary without
    # assuming the free D stayed at(22,3), and no source candidate is fabricated.
    require(dot(sub(point(B),point(A)),sub(point(B),point(A)))==16,'positive fixed base, forced exact reverse right support')
    for row in r['refusals']:
        if row.get('kind')=='source-unsupported':
            require(row['label']=='foreign-own-face-root' and row['result']['status']=='unsupported' and row['result']['reason']['code']==REFUSALS[row['label']] and row['result']['reason']['layer']=='source','actual explicit source-layer unsupported result, not an invented exception');refusal_state(row);continue
        err=row['error'];require(err and err['code']==REFUSALS[row['label']] and not err['committed'] and not err['possiblyCommitted'],'actual precise noncommitted refusal');refusal_state(row)
        if row['label']=='opposite-collapse':require(err['failureLayer']=='preflight' and err['selectionDisposition']=='retained','actual pure preflight retention')
        if row['label']=='unknown-query-does-not-consume' or row['label'].startswith('old-ticket-after-'):require(err['selectionDisposition']=='unavailable','no fabricated ticket recognition after actual transaction/Open retirement')
        if row['label']=='unknown-event-does-not-consume':require(err['selectionDisposition']=='retained','recognized current query survives an unknown event preflight')
        if row['label']=='wrong-action-domain':require(err['selectionDisposition']=='retained','pure domain mismatch keeps exact still-current receipt')
    for row in r['appends']:
        before=json_source(row['before'],row['faceId']);after=json_source(row['after'],row['faceId']);id=row['result']['primitive']['id'];added=one([o for o in after['objects'] if o['id']==id],'actual new primitive');require(added['type']==row['kind'] and added['data']==row['data'] and added['role']==row['role'],'actual public append intent');after['objects']=[o for o in after['objects'] if o['id']!=id];require(after==before,'all prior source untouched by append');require(row['after']['capture']['native']['counters']==row['before']['capture']['native']['counters'],'no authored counter consumed by primitive edit')
    for row in r['travels']:
        same_authored(row['after'],row['expected']);require(row['after']['capture']['native']['counters']==row['before']['capture']['native']['counters'],'actual source travel counter/highwater exact');settled(row['after'])
    edits={x['label']:x for x in r['edits']};require(len(edits)==len(r['edits']),'unique edit observations')
    for label in ['trim-free','ray-select-six','ray-select-four','ticket-still-usable','close-top-before-consumption','consumed-top-trapezoid','reopened-typed-endpoint']:
        row=edits[label];before=json_source(row['before'],row['binding']['faceId']);after=json_source(row['after'],row['binding']['faceId']);target=row['request']['target'];old=one([x for x in before['objects'] if x['id']==target['curveId']],'actual prior Segment');new=one([x for x in after['objects'] if x['id']==target['curveId']],'actual next Segment');end=target['endpoint'];other='a' if end=='b' else 'b';p=row['event']['point'];require(new['data'][end]=={'x':p[0],'y':p[1]} and new['data'][other]==old['data'][other],'exact chosen Native endpoint and untouched opposite')
        allowed={target['curveId'],*row['connected']};a,b=copy.deepcopy(before),copy.deepcopy(after);a['objects']=[x for x in a['objects'] if x['id'] not in allowed];b['objects']=[x for x in b['objects'] if x['id'] not in allowed];require(a==b,'ALL unrelated original fields remain exact');require(row['result']['changed'] is True and row['result']['authoredUndo'] is True,'one real shared edit')
        q=one([x for x in r['queries'] if x['result']['queryId']==row['request']['queryId']],'actual issued query for this edit');require(q['before']==row['before'] and row['event'] in q['result']['events'],'same actual source/lifetime/event, no fabricated chosen geometry')
        owned=one([p for p in q['inspection']['points'] if p['parentId']==target['curveId'] and p['x']==old['data'][end]['x'] and p['y']==old['data'][end]['y']],'actual owned selected endpoint');require(row['result']['point']['id']==owned['id'],'actual returned point identity')
        a,b=copy.deepcopy(before),copy.deepcopy(after)
        for s in (a,b):
            for o in s['objects']:
                if o['id']==target['curveId']:o['data'][end]=None
                elif o['id'] in row['connected']:o['data']['a']=None
        require(a==b,'ALL non-coordinate authored fields preserved, including connected-root other fields')
        if row['connected']:
            require(label=='consumed-top-trapezoid' and row['connected']==[r['consumed']['ids'][3]],'only actual retained left neighbor in declared fixture')
            prior=one([o for o in before['objects'] if o['id']==row['connected'][0]],'prior left Segment');next=one([o for o in after['objects'] if o['id']==row['connected'][0]],'next left Segment')
            near(next['data']['a']['x'],number(p[0]));near(next['data']['a']['y'],number(p[1]));require(next['data']['b']==prior['data']['b'],'actual connected endpoint follows, its other endpoint exact')
            peer=one([v for v in q['inspection']['points'] if v['parentId']==prior['id'] and v['x']==prior['data']['a']['x'] and v['y']==prior['data']['a']['y']],'actual owned linked endpoint')
            require(any(c['typeId']=='PCoincident' and set(c['objects'])=={owned['id'],peer['id']} for stage in before['stages'] for c in stage['constraints']),'genuine retained PCoincident authority, not declared recipe grouping')
        for source_row in row['before']['capture']['native']['sketches']:
            if source_row['id']!=row['binding']['faceId']:require(source_row==one([x for x in row['after']['capture']['native']['sketches'] if x['id']==source_row['id']],'same unrelated source'),'all other sources exact')
    require(edits['own-end-noop']['before']==edits['own-end-noop']['after'] and edits['own-end-noop']['result']['changed'] is False and edits['own-end-noop']['result']['authoredUndo'] is False,'genuine full-state own-end no-op')
    for label,want in [('ray-select-six',6),('ray-select-four',4)]:near(edits[label]['event']['point'][0],want);near(edits[label]['event']['point'][1],0)
    typed=r['typed'];first=one([q for q in r['queries'] if q['label']=='typed-radius-one'],'actual bound radius1 query');second=one([q for q in r['queries'] if q['label']=='typed-radius-two'],'actual bound radius2 query')
    require(quantities(first['before'])=={'boundaryR':F(1)} and quantities(second['before'])=={'boundaryR':F(2)},'actual named LENGTH1→2, not an erased numeric radius')
    left=json_source(first['before'],typed['faceId']);right=json_source(second['before'],typed['faceId'])
    for s,value in ((left,1),(right,2)):
        c=one([o for o in s['objects'] if o['id']==typed['ids'][1]],'actual boundary Circle');require(c['type']=='Circle' and c['data']=={'c':{'x':5,'y':0},'r':value},'actual Circle center/radius, no proxy');row=one([c for stage in s['stages'] for c in stage['constraints'] if c['typeId']=='RadiusLength' and c['objects']==[typed['ids'][1]]],'same genuine driving RadiusLength');require(row['constants']=={'length':'boundaryR'},'original named binding retained literally');c['data']['r']=None
    require(left==right,'ONLY actual bound Circle radius changes, every other field exact');a={s['id']:s['source'] for s in first['before']['capture']['native']['sketches'] if s['id']!=typed['faceId']};b={s['id']:s['source'] for s in second['before']['capture']['native']['sketches'] if s['id']!=typed['faceId']};require(a==b,'ALL unrelated sources exact through typed regeneration')
    native=[native_geometry(row,r) for row in r['native']];require({x['label'] for x in native}=={'unrelated-prism-original','consumed-rectangle-area12-volume24','consumed-trapezoid-area9-volume18','consumed-travel-rectangle','consumed-travel-trapezoid','unrelated-prism-final','consumed-trapezoid-final'} and len(native)==7,'complete actual Native read/area/travel roster')
    require([s['label'] for s in r['saves']]==['A','B','C'] and [s['label'] for s in r['reopens']]==['A','B','C'] and len(r['writes'])==3,'THREE exact normal archive/Open cycles');archives=[]
    for write,save,opened in zip(r['writes'],r['saves'],r['reopens']):
        require(write['phase']=='settled' and write['sequence']==save['writeSequence'] and write['artifact']['sha256']==write['artifact']['localSha256']==save['sha256'],'submitted browser/server write settled');command=r['commands'][write['commandIndex']];require(command['command']=='save' and command['args']['revision']==save['before']['host']['revision'] and command['result']==write['result']==save['result'],'actual submitted Save acknowledgement binding');require(write['windowId']==command['windowId'] and write['username'] and write['file']==opened['file'],'own actor/path bound to actual writes')
        info=read_archive(directory/save['savedFile']);require(info['sha256']==save['sha256'] and info['bytes']==save['bytes'],'actual ZIP CRC/SHA/size');envelope=info['envelope'];model=envelope['project']['model'];stored=save['before']['capture']['native'];require(model['history']==stored['history'] and model['counters']==stored['counters'] and model['expressions']==stored['expressions'],'exact archived graph/counters/raw names');require({s['id']:s['data'] for s in envelope['project']['sketches']}=={s['id']:json.loads(s['source']) for s in stored['sketches']},'all actual source/IDs/branches persisted')
        for s in envelope['project']['sketches']:
            for o in s['data']['objects']:
                if o['type']=='Arc':require(set(o['data'])=={'a','b','c','branch'} and o['data']['branch'] in ('proper-ccw','full-ccw'),'mandatory saved Arc branch')
        same_authored(save['after'],save['before']);same_authored(opened['opened'],save['before']);require(opened['opened']['capture']['journal']['canUndo'] is False and opened['opened']['capture']['journal']['canRedo'] is False,'actual fresh Open resets session journal');archives.append({'label':save['label'],'sha256':info['sha256'],'designRevision':info['manifest']['designRevision']})
    require(r['openRequirements']==['full-arc-query','middle-trim-split','circle-to-arc','arc-endpoint-edit','overlap-boundary-edit'],'unconditional remaining requirements retained')
    return {'status':'PASS','scope':r['scope'],'queries':summaries,'native':native,'archives':archives,'requiredOpen':r['openRequirements'],'wholeReceiptSha256':hashlib.sha256(raw).hexdigest()}

if __name__=='__main__':
    require(len(sys.argv)==5,'check.py WHOLE_DIR EXACT_CORE_SOURCE EXACT_HOST_SOURCE EXACT_ACCEPTANCE_SOURCE')
    whole=Path(sys.argv[1]);files=sorted(p for p in whole.rglob('*') if p.is_file());require(len(files)<=4096 and all(not p.is_symlink() and p.stat().st_size<=128*1024*1024 for p in files),'bounded original input roster')
    before={str(p.relative_to(whole)):digest(p) for p in files};readers=[Path(__file__).resolve(),Path(query_math_module.__file__).resolve(),Path(archive_module.__file__).resolve()];reader_before={str(p):digest(p) for p in readers}
    result=check(*sys.argv[1:]);after_files=sorted(p for p in whole.rglob('*') if p.is_file());after={str(p.relative_to(whole)):digest(p) for p in after_files};require(after==before,'ALL original whole inputs unchanged');require({str(p):digest(p) for p in readers}==reader_before,'actual executing readers unchanged')
    result.update(inputsUnchanged=True,inputSha256=before,readerFiles=reader_before)
    print(json.dumps(result,indent=2))
