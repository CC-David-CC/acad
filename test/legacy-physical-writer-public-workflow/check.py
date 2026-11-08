#!/usr/bin/env python3
"""Independent AFTER-WHOLE source/public-geometry/actual ZIP oracle.
No production CAD parser/solver/geometry validator; no browser or Native calls.
"""
import copy,hashlib,json,math,re,sys
from collections import Counter
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive
JS='a84b31900e58e61a1d7e3f8d04978408455764ad149923359e7fba19d3d07884'
WASM='07d763a05f35cd257501d339d9087df63c65bcaeb51a4f4f80832e333892e12e'
KINDS=['PLANE','WORKER_RECTANGLE_EXTRUDE_V1','WORKER_CENTERED_THROUGH_HOLE_V1','WORKER_FOUR_CORNER_THROUGH_HOLES_V1']
SOURCE_BUDGET=5e-8
def need(value,text):
    if not value:raise ValueError(text)
def one(rows,text):need(len(rows)==1,'one '+text);return rows[0]
def near(x,y,t=1e-6):need(type(x) in (int,float) and math.isfinite(x) and abs(x-y)<=t,f'{x} differs from {y}; budget {t}')
def sha(raw):return hashlib.sha256(raw).hexdigest()
def defs(width):return [{'name':n,'dimension':'length','expression':f'mm({v})'} for n,v in [('width',width),('height',30),('edgeX',9),('edgeY',8)]]
def settled(s):
    o=s['ownership'];r=o['resources'];need(o['processing'] is False and r['cleanupFailed'] is False and all(r[k]==0 for k in ('candidates','accepted','mounts')) and r['owners']==r['detached'],'settled actual evaluation ownership');need(s['physical']['ready'] is True,'current physical inspection')
def authored_source(data):
    d=copy.deepcopy(data)
    for o in d['objects']:
        need(o['type']=='Segment','ordinary source Segment')
        for end in ('a','b'):
            for axis in ('x','y'):del o['data'][end][axis]
    for stage in d['stages']:
        for row in stage['constraints']:
            need(row.get('admission',{}).get('state') in ('accepted','redundant'),'actual admitted source row');del row['admission']
    return d
def source_check(n,b,width,bound,literal):
    need([o['type'] for o in n['history']]==KINDS,'same actual legacy authored operation kinds');need([int(o['params']['featureId']) for o in n['history']]==b['featureIds'],'same actual public feature IDs')
    original=copy.deepcopy(literal['capture']['native']['history'])
    if bound:original[3]['params'].update(offsetX='edgeX',offsetY='edgeY')
    need(n['history']==original,'exact authored history except actual two offset bindings');need(n['counters']==literal['capture']['native']['counters'],'unchanged original high-water')
    h=30 if bound else 50;ox=9 if bound else 10;oy=8 if bound else 10
    need(n['history'][1]['params']['face']==b['faceId'] and n['history'][1]['params']['length']==20 and n['history'][2]['params']['diameter']==10 and n['history'][3]['params']['diameter']==4,'actual source/numeric depth/diameters')
    sketches=n['sketches'];s=one(sketches,'saved actual source');need(s['id']==b['faceId'] and s['source']==n['source'],'actual complete source inventory');d=json.loads(n['source']);base=json.loads(literal['capture']['native']['source'])
    need(d['version']==3 and len(d['objects'])==4 and len(d['stages'])==1 and not d['stages'][0]['generators'],'original four-Segment source');need(not any(d['boundary'].values()),'no seeded external geometry')
    if bound:
        need(n['expressions'].startswith('codi-physical-parameters:1\n'),'real v1 physical source');need(json.loads(n['expressions'].split('\n',1)[1])==defs(width),'exact persisted typed definitions')
    else:need(n['expressions']=='','true empty original physical source')
    expected=authored_source(base)
    if bound:
        for row in expected['stages'][0]['constraints']:
            if row['typeId']=='SegmentLength':row['constants']['length']={'rect-0':'width','rect-1':'height'}[row['objects'][0]]
    need(authored_source(d)==expected,'ALL other authored source fields/schema/order/constants/frame preserved')
    objects={o['id']:o for o in d['objects']};need(list(objects)==['rect-0','rect-1','rect-2','rect-3'],'same genuine producer source IDs/order');corners=[(0,0),(width,0),(width,h),(0,h)];points={}
    for i,o in enumerate(d['objects']):
        need(o['stage']==0 and o['role'] is None,'ordinary own source Segment')
        for end,q in [('a',corners[i]),('b',corners[(i+1)%4])]:
            p=o['data'][end];near(p['x'],q[0],SOURCE_BUDGET);near(p['y'],q[1],SOURCE_BUDGET);points[o['id']+':'+end.upper()]=p
    rows=d['stages'][0]['constraints'];need(Counter(c['typeId'] for c in rows)=={'PCoincident':4,'Horizontal':2,'Vertical':2,'LockPoint':1,'SegmentLength':2},'eleven original equations')
    quantities={'width':width,'height':h,'edgeX':ox,'edgeY':oy}
    for c in rows:
        ids=c['objects'];k=c.get('constants',{});t=c['typeId']
        if t=='PCoincident':
            p,q=[points[x] for x in ids]
            for axis in ('x','y'):near(p[axis],q[axis],SOURCE_BUDGET)
        elif t=='LockPoint':
            p=points[one(ids,'lock target')]
            for axis in ('x','y'):near(p[axis],float(k[axis]),SOURCE_BUDGET)
        else:
            o=objects[one(ids,'dimension/orientation target')];p,q=o['data']['a'],o['data']['b']
            if t=='SegmentLength':
                raw=k['length'];value=quantities[raw] if raw in quantities else float(raw);near(math.hypot(q['x']-p['x'],q['y']-p['y']),value,SOURCE_BUDGET)
            else:
                angle=math.radians(float(k['angle']));dx=q['x']-p['x'];dy=q['y']-p['y'];near(dx*math.sin(angle)-dy*math.cos(angle),0,SOURCE_BUDGET);need(dx*math.cos(angle)+dy*math.sin(angle)>0,'original directed branch')
    return d
def state_check(s,b,width,bound,literal):
    settled(s);d=source_check(s['capture']['native'],b,width,bound,literal);need(s['physical']['definitions']==(defs(width) if bound else []),'actual public definitions');need(not s['physical']['selectedProfiles'],'no modern selected-profile substitution')
    h=30 if bound else 50;ox=9 if bound else 10;oy=8 if bound else 10
    if bound:
        need(len(s['physical']['quantities'])==4,'four genuine current quantities')
        for name,value in [('width',width),('height',30),('edgeX',9),('edgeY',8)]:
            q=one([q for q in s['physical']['quantities'] if q['name']==name],'actual current quantity');need(q['dimension']=='length' and q['unit']=='millimeter','dimensioned current quantity');near(q['value'],value,1e-12)
    g=s['geometry'];need(g['unit']=='millimeter' and g['scope']=='published-worker-plates','honest public geometry scope');body=one(g['bodies'],'actual published body');need(body['bodyId']==b['bodyId'] and body['representation']=='worker-owned-occ-four-corner','same current legacy output');need(len(body['faces'])==11 and len(body['holes'])==5,'actual public five-hole plate census')
    initial=one(literal['geometry']['bodies'],'original output');need(len({f['id'] for f in body['faces']})==11 and {f['id']:f['role'] for f in body['faces']}=={f['id']:f['role'] for f in initial['faces']},'same actual semantic face IDs/roles; no face-ordinal authority');need(len(body['bounds'])==3,'three actual bounds axes')
    for pair,want in zip(body['bounds'],[(0,width),(0,h),(0,20)]):
        need(len(pair)==2,'bounds pair')
        for x,y in zip(pair,want):near(x,y)
    expected=[(width/2,h/2,5,'HOLE_WALL'),(ox,oy,2,'CORNER_WALL'),(width-ox,oy,2,'CORNER_WALL'),(width-ox,h-oy,2,'CORNER_WALL'),(ox,h-oy,2,'CORNER_WALL')]
    seen=set()
    for x,y,r,role in expected:
        q=one([q for q in body['holes'] if abs(q['center'][0]-x)<=1e-6 and abs(q['center'][1]-y)<=1e-6],'independent analytic hole center');need(q['faceId'] not in seen and q['role']==role,'unique actual semantic hole role');seen.add(q['faceId']);near(q['radius'],r);need(len(q['center'])==3 and all(type(v) in (int,float) and math.isfinite(v) for v in q['center']) and -1e-6<=q['center'][2]<=20+1e-6,'finite actual cylindrical axial origin')
    return d
def check(directory):
    root=Path(directory);r=json.loads((root/'receipt.json').read_text());need(r['status']=='PASS','complete whole workflow first');need(r['sourcePins']==r['sourcePinsAfter'] and r['ownedContextsRetired'] and r['sharedBrowserDisconnectedOnly'],'immutable sources/owned cleanup');need(not any(r[k] for k in ('sourceSeeds','privateAuthoring','fakeReplies')),'actual public authoring')
    need(r['legacyRuntime']['js']==JS and r['legacyRuntime']['wasm']==WASM,'exact old Native runtime')
    for role,digest in [('js',JS),('wasm',WASM)]:need(r['pins']['files'][r['legacyRuntime']['assets'][role]]==digest,'actual supplied legacy asset pin')
    for snap in r['sourceSnapshots']:need(sha((root/snap['file']).read_bytes())==snap['sha256'],'executed source snapshot')
    pinrows=[x for x in r['rows'] if x['label']=='Exact actual application and legacy runtime pins'];need(len(pinrows)==3,'actual initial plus two fresh Open cohorts')
    for row in pinrows:
        actual={a['name']:a['sha256'] for a in row['assets']};need(actual==r['pins']['files'] and row['outer']['sha256']==r['pins']['outer']['sha256'],'actual application/legacy/outer byte pins')
    b=r['binding'];literal=r['literal'];need(len(b['featureIds'])==4 and len(set(b['featureIds']))==4 and all(type(x) is int and 0<x<=9007199254740991 for x in b['featureIds']),'actual public safe feature identities')
    creation=[c for c in r['commands'] if c['command'] in ('create-rectangle-sketch','create-worker-extrusion','create-worker-centered-hole','create-worker-four-corner-holes')];need([c['command'] for c in creation]==['create-rectangle-sketch','create-worker-extrusion','create-worker-centered-hole','create-worker-four-corner-holes'] and [c['result']['featureId'] for c in creation]==b['featureIds'],'genuine ordered public recipe creation')
    need(creation[0]['args']['origin']==[0,0] and creation[0]['args']['width']==100 and creation[0]['args']['height']==50 and creation[0]['args']['depth']==0 and creation[0]['result']['faceId']==b['faceId'],'actual literal public source')
    need(creation[1]['args']=={'revision':creation[1]['args']['revision'],'faceId':b['faceId'],'regionId':creation[0]['result']['regionId'],'depth':20},'actual discovered numeric extrusion source')
    specs=[('create-worker-extrusion','extrusion','extrusionCandidates',('faceId','regionId'),{'depth':20}),('create-worker-centered-hole','centeredHole','centeredHoleCandidates',('bodyId','lidFaceId'),{'diameter':10}),('create-worker-four-corner-holes','fourCornerHoles','fourCornerCandidates',('bodyId','centerWallId','sideIds'),{'diameter':4,'offsetX':10,'offsetY':10})]
    for command,capability,key,ids,dimensions in specs:
        at=next(i for i,c in enumerate(r['commands']) if c['command']==command);c=r['commands'][at];prior=[v for v in r['commands'][:at] if v['command']=='inspect-worker-features'];info=prior[-1]['result'];need(info['ready'] is True and info['capabilities'][capability] is True and c['args']['revision']==info['revision'],'actual current public capability/revision');candidate={k:c['args'][k] for k in ids};need(candidate in info[key] and all(c['args'][k]==v for k,v in dimensions.items()),'actual discovered source/body/semantic side selection, never invented IDs')
    bind=one([c for c in r['commands'] if c['command']=='apply-physical-bracket'],'actual public binding');need(bind['args']['faceId']==b['faceId'] and bind['args']['index']==b['index'] and bind['args']['featureId']==b['featureId'] and {k:bind['args'][k] for k in ('width','height','offsetX','offsetY')}=={'width':'width','height':'height','offsetX':'edgeX','offsetY':'edgeY'} and bind['args']['definitions']==defs(150),'actual named width/height/offset request')
    need(len(r['observations'])==14,'all fourteen complete source/geometry observations');expected=[(100,False),(150,True),(100,False),(150,True),(160,True),(150,True),(160,True),(150,True),(160,True),(160,True),(170,True),(160,True),(170,True),(170,True)]
    for row,(w,bound) in zip(r['observations'],expected):
        need(row['width']==w and row['bound'] is bound and row['binding']==b,'exact intended whole chronology');need(row['before']==row['after'],'passive read-only state exact');state_check(row['before'],b,w,bound,literal)
    need(len(r['travels'])==8 and [x['direction'] for x in r['travels']]==['undo','redo']*4,'all actual physical travel')
    for row in r['travels']:
        need(row['target']['kind']=='physical-transaction','same authored journal');need(row['before']['capture']['native']['counters']==row['after']['capture']['native']['counters'],'travel retains high-water');need(len(row['workerHeaders'])<=4096,'bounded actual task evidence')
        for header in row['workerHeaders']:need(set(header)=={'task','revision','forwarded'} and type(header['forwarded']) is bool and type(header['task']) is str and len(header['task'])<=256,'strict task forwarding record')
    first=r['travels'][0];need(first['after']['capture']['native']==literal['capture']['native'],'immediate Undo EXACT original empty source and numeric sketch')
    writer=[h for h in first['workerHeaders'] if h['task']=='legacy-physical-sketch-transaction-solve'];need(len(writer)==1 and writer[0]['forwarded'] is True and type(writer[0]['revision']) is str and 0<len(writer[0]['revision'])<=256,'actual successful renamed writer issuance, not thrown forwarding or read-task inference')
    need(r['travels'][1]['after']['capture']['native']==r['firstBinding']['after']['capture']['native'],'Redo restores exact same names/source');need(r['firstBinding']['result']['changed'] is True,'real binding publication')
    refusal=one(r['refusals'],'dimension refusal');need(refusal['error']['code']=='DIMENSION_MISMATCH' and not refusal['error']['committed'] and not refusal['error']['possiblyCommitted'],'precise uncommitted quantity refusal');need(refusal['before']==refusal['after'],'invalid quantity preserves ALL state/tokens/resources')
    need(len(r['saves'])==len(r['reopens'])==2,'two real .cad cycles/fresh Opens');archives=[]
    for item,w in zip(r['saves'],[160,170]):
        need(item['width']==w and item['bound'] is True and item['result']['committed'] is True and item['result']['persistence']=='browser' and item['result']['nativeArchive']['format']=='codi-cad-project','normal committed browser .cad Save');arc=read_archive(root/item['savedFile']);need(arc['sha256']==item['sha256'] and arc['bytes']==item['byteLength'],'actual complete server ZIP bytes/CRC/SHA');env=arc['envelope'];n=item['before']['capture']['native'];need(env['unit']=='millimeter' and env['project']['model']['history']==n['history'] and env['project']['model']['expressions']==n['expressions'] and env['project']['model']['counters']==n['counters'],'exact saved authored graph/definitions/high-water');need({s['id']:s['data'] for s in env['project']['sketches']}=={s['id']:json.loads(s['source']) for s in n['sketches']},'actual archived editable sketches');state_check(item['before'],b,w,True,literal);need(item['before']['capture']==item['after']['capture'] and item['before']['physical']==item['after']['physical'] and item['before']['geometry']==item['after']['geometry'],'normal Save preserves accepted source/J/geometry');archives.append({'file':item['savedFile'],'sha256':arc['sha256'],'designRevision':arc['manifest']['designRevision'],'widthMm':w})
    for item,w in zip(r['reopens'],[160,170]):
        for k in ('history','source','sketches','expressions','counters','presentation'):need(item['before']['capture']['native'][k]==item['after']['capture']['native'][k],'fresh Open exact '+k)
        need(not item['after']['capture']['journal']['canUndo'] and not item['after']['capture']['journal']['canRedo'],'fresh session journal resets');state_check(item['after'],b,w,True,literal)
    return {'status':'PASS','scope':'finite public legacy empty-source writer travel and editable .cad; source equations/public analytic bounds and holes, not Native mass/classification','observations':14,'travels':8,'refusals':1,'archives':archives,'actualWriterForwarded':True}
if __name__=='__main__':print(json.dumps(check(sys.argv[1]),indent=2))
