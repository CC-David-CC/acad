#!/usr/bin/env python3
"""AFTER-WHOLE only. Independent ZIP/CRC/SHA/source/equation/section/native checks.
No production codec, solver, planner, recipe or JS acceptance oracle imported.
"""
import json,math,hashlib,sys
from pathlib import Path
from decimal import Decimal,localcontext
from collections import Counter
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive
SOURCE=1e-8
BUILD='sha256:ed06b634a3e81f9a51c89f75b3d65e03b8ace1fc483900ea2858eae8eff970a4:bc8895ceb123e33aad68c8a1cf6322b5c0ccef9bfb129207defe1b8a5a7c893a'
def need(ok,text):
    if not ok:raise ValueError(text)
def one(xs,text):need(len(xs)==1,'one '+text);return xs[0]
def near(x,y,t=SOURCE):need(type(x) in (int,float) and math.isfinite(x) and abs(x-float(y))<=t,f'{x} differs from {y}; budget {t}')
def settled(s):
    r=s['ownership']['resources'];l=s['lifecycle'];need(not s['ownership']['processing'] and not r['cleanupFailed'] and all(r[k]==0 for k in ('candidates','accepted','mounts')) and r['owners']==r['detached'],'retired native ownership');need(s['manufacturing'] is None and not l['pipelineFailed'] and not l['cleanupFailed'],'healthy accepted document');need(l['historyLength']==len(s['capture']['native']['history']) and l['pointer']==l['historyLength']-1,'actual settled full history')
def native_intent(s):return{k:v for k,v in s['capture']['native'].items() if k!='materialRevision'}
def source(native,id):return json.loads(one([s for s in native['sketches'] if s['id']==id],'actual source')['source'])
def rectangle(native,b,d,n,inspection):
    h=native['history'];plane=h[b['planes'][n]['index']];p=plane['params'];need(plane['type']=='PLANE' and set(p)=={'featureId','orientation','datum','depth'},'exact principal plane');need(int(p['featureId'])==b['planes'][n]['featureId'] and p['orientation']=='XY' and p['datum'] is None and p['depth']==(d['depth'] if n else 0),'actual authored source frame')
    s=source(native,b['faceIds'][n]);need(s['version']==3 and len(s['objects'])==4 and len(s['stages'])==1 and not s['stages'][0]['generators'] and len(s['stages'][0]['constraints'])==11,'original rectangle declaration');need(all(not v for v in s['boundary'].values()),'no external boundary');need(s['metadata']['boundaryFrame']=={'origin':[0,0,p['depth']],'x':[1,0,0],'y':[0,1,0],'z':[0,0,1]},'actual XY source frame')
    objects={o['id']:o for o in s['objects']};need(set(objects)==set(b['curveIds'][n]) and len(objects)==4,'actual original curve IDs')
    vertices=[pt for o in objects.values() for pt in (o['data']['a'],o['data']['b'])];lo=[min(q[axis] for q in vertices) for axis in ('x','y')];hi=[max(q[axis] for q in vertices) for axis in ('x','y')]
    origin=[-25,-12.5] if n else [-50,-25];width=50 if n else d['width'];height=25 if n else 50
    for x,y in zip(lo,origin):near(x,y)
    near(hi[0]-lo[0],width);near(hi[1]-lo[1],height)
    corners=[(lo[0],lo[1]),(hi[0],lo[1]),(hi[0],hi[1]),(lo[0],hi[1])];counts=[0]*4;starts=[]
    for o in objects.values():
        need(o['type']=='Segment' and o['role'] is None and o['stage']==0,'original ordinary Segment')
        ends=[]
        for q in (o['data']['a'],o['data']['b']):
            at=one([j for j,c in enumerate(corners) if abs(q['x']-c[0])<=SOURCE and abs(q['y']-c[1])<=SOURCE],'actual source corner');counts[at]+=1;ends.append(at)
        need((ends[0]+1)%4==ends[1],'authored directed rectangle branch');starts.append(ends[0])
    need(counts==[2,2,2,2] and sorted(starts)==[0,1,2,3],'exact connected four-edge source')
    points={}
    for q in inspection['points']:
        parent=objects[q['parentId']];pt=one([pt for pt in (parent['data']['a'],parent['data']['b']) if abs(pt['x']-q['x'])<=SOURCE and abs(pt['y']-q['y'])<=SOURCE],'actual public point parent endpoint');need(q['id'] not in points,'unique public endpoint');points[q['id']]=pt
    need(len(points)==8,'all eight actual endpoints')
    constraints=s['stages'][0]['constraints'];need(Counter(c['typeId'] for c in constraints)=={'PCoincident':4,'LockPoint':1,'Horizontal':2,'Vertical':2,'SegmentLength':2},'original eleven real rows')
    for c in constraints:
        need(c['admission']['state'] in ('accepted','redundant'),'solver-derived actual admission');refs=c['objects'];k=c.get('constants',{});typ=c['typeId']
        if typ=='PCoincident':
            a,z=[points[id] for id in refs]
            for axis in ('x','y'):near(a[axis],z[axis])
        elif typ=='LockPoint':
            q=points[one(refs,'actual lock')]
            for axis in ('x','y'):near(q[axis],float(k[axis]))
        else:
            o=objects[one(refs,'actual Segment')];a,z=o['data']['a'],o['data']['b']
            if typ=='SegmentLength':near(math.dist((a['x'],a['y']),(z['x'],z['y'])),float(k['length']))
            else:near(a['y' if typ=='Horizontal' else 'x'],z['y' if typ=='Horizontal' else 'x'])
    ref=b['sections'][n];need(ref['faceId']==b['faceIds'][n] and ref['seam']['kind']=='vertex' and ref['seam']['reversed'] is False,'original ordered seam reference');seam=one([q for q in inspection['points'] if q['id']==ref['seam']['pointId']],'actual seam endpoint');need(seam['parentId']==b['seamCurveIds'][n],'verbatim actual seam parent');parent=objects[seam['parentId']]
    for q,expected in [(seam,lo),(parent['data']['a'],lo),(parent['data']['b'],[hi[0],lo[1]])]:
        near(q['x'],expected[0]);near(q['y'],expected[1])
    return {'min':lo,'max':hi,'z':p['depth'],'width':hi[0]-lo[0],'height':hi[1]-lo[1],'source':s}
def shape(s,b,d,inspections,loft=True):
    native=s['capture']['native'];need(len(native['sketches'])==2 and set(x['id'] for x in native['sketches'])==set(b['faceIds']),'both original sources only');need([r['type'] for r in native['history']]==['PLANE','PLANE']+(['WORKER_SELECTED_PROFILE_LOFT_V1'] if loft else []),'one authoritative graph')
    sections=[rectangle(native,b,d,n,inspections[n]) for n in range(2)]
    if loft:
        p=native['history'][2]['params'];need(set(p)=={'version','unit','engine','engineRevision','featureId','sections','construction','bodyPolicy'} and p['version']==1 and p['unit']=='millimeter' and p['engine']=='occ' and p['engineRevision']==BUILD and p['featureId']==b['featureId'] and p['sections']==b['sections'] and p['construction']=='ruled-solid' and p['bodyPolicy']=='separate','exact eight-field source/seam intent');need(p==b['authored'],'unchanged actual authored loft suffix')
    return sections
def geometry(sections):
    a,b=sections;need(b['z']>a['z'],'ordered separated XY sections');h=b['z']-a['z']
    with localcontext() as ctx:
        ctx.prec=80;w0,h0,w1,h1,z=[Decimal(str(x)) for x in (a['width'],a['height'],b['width'],b['height'],h)];volume=z*(2*w0*h0+w0*h1+w1*h0+2*w1*h1)/6
    bounds={'min':[min(a['min'][0],b['min'][0]),min(a['min'][1],b['min'][1]),a['z']],'max':[max(a['max'][0],b['max'][0]),max(a['max'][1],b['max'][1]),b['z']]}
    def band(t):return [(1-t)*a['min'][0]+t*b['min'][0],(1-t)*a['max'][0]+t*b['max'][0],(1-t)*a['min'][1]+t*b['min'][1],(1-t)*a['max'][1]+t*b['max'][1],a['z']+t*h]
    l,r,bot,top,z=band(.5);cx,cy=(l+r)/2,(bot+top)/2;cap0=[(a['min'][0]+a['max'][0])/2,(a['min'][1]+a['max'][1])/2];cap1=[(b['min'][0]+b['max'][0])/2,(b['min'][1]+b['max'][1])/2];q=band(.9)
    probes=[[cx,cy,z],[(cx+r)/2,cy,z],[r,cy,z],[r+1,cy,z],[cx,cy,b['z']+1],[*cap0,a['z']],[(r+cx)/2,(top+cy)/2,z],[a['max'][0]-1,(q[2]+q[3])/2,q[4]],[*cap1,b['z']],[*cap0,a['z']-1]]
    need(probes[7][0]>q[1]+SOURCE,'frozen upper taper void discriminator');classes=['inside','inside','boundary','outside','outside','boundary','inside','outside','boundary','outside'];return volume,bounds,probes,classes

def normalized(s,candidate=False):
    x=json.loads(json.dumps(s));x['capture']['solids'].pop('revision',None);x['capture']['journal'].pop('revision',None);x['host'].pop('revision',None)
    if candidate:x['lifecycle'].pop('epoch',None)
    return x

def check(directory):
    root=Path(directory);r=json.loads((root/'receipt.json').read_text());need(r['status']=='PASS','whole public workflow must first pass');need(r['engineRevision']==BUILD,'same qualified Native family');need(r['sourcePins']==r['sourcePinsAfter'] and r['ownedContextsRetired'] and r['sharedBrowserDisconnectedOnly'],'immutable source and owned cleanup');need(not any(r[k] for k in ('sourceSeeds','privateAuthoring','fakeReplies')),'genuine authoring only')
    for row in r['sourceSnapshots']:need(hashlib.sha256((root/row['file']).read_bytes()).hexdigest()==row['sha256'],'actual executed source bytes')
    outputs=[];points=0
    for row in r['sourceObservations']:
        s=row['before'];need(s==row['after'],'source-only exact readonly state');settled(s);shape(s,row['binding'],row['dimensions'],row['inspections'],False);need(not s['capture']['solids']['bodies'] and not s['capture']['solids']['outputs'],'actual source planes/no hidden loft output');need(len(row['planes']['features'])==2 and all(p['canEdit'] for p in row['planes']['features']),'actual editable source planes retained')
    for row in r['observations']:
        s=row['before'];need(s==row['after'],'Native query exact same-window accepted state/tokens/source versions/resources');settled(s);b=row['binding'];sections=shape(s,b,row['dimensions'],row['inspections']);v,bounds,probes,classes=geometry(sections);body=one(s['capture']['solids']['bodies'],'actual Native loft body');need(len(s['capture']['solids']['outputs'])==1 and body['id']==b['bodyId'] and body['featureId']==b['featureId'],'same original actual output/producer');m=body['metrics'];need(m['nativeValidity']['valid'] is True and m['solidCount']==1 and m['resultKind']=='single-solid' and 'sha256:'+m['runtime']['jsSha256']+':'+m['runtime']['wasmSha256']==BUILD,'actual valid exact-build Native solid');near(m['nativeVolume'],v,1e-6)
        for side in ('min','max'):
            for x,y in zip(m['nativeBounds'][side],bounds[side]):near(x,y,1e-6)
        for k,vv in {'solids':1,'shells':1,'faces':6,'wires':6,'edges':12,'vertices':8}.items():need(m['nativeTopology']['counts'][k]==vv,'analytic tapered prism census '+k)
        q,request=row['query'],row['input'];need(q['quality']=='native-re-evaluation-observation','actual Native classification')
        for k in ('version','unit','revision','bodyId','featureId','engine','engineRevision'):need(q[k]==request[k],'current actual query binding')
        need(request['bodyId']==b['bodyId'] and request['featureId']==b['featureId'] and request['engineRevision']==BUILD and request['revision']==s['capture']['solids']['revision'],'bound current accepted body')
        need(len(q['points'])==len(request['points'])==len(probes)==10,'all actual taper/cap/material probes')
        for actual,input,expected,classification in zip(q['points'],request['points'],probes,classes):
            need(set(actual)=={'point','classification'} and actual['point']==input and actual['classification']==classification,'actual ten Native classes')
            for x,y in zip(input,expected):near(x,y)
        points+=len(probes);outputs.append({'label':row['label'],'volumeMM3':str(v),'boundsMM':bounds})
    need(len(r['sourceObservations'])==3 and len(r['observations'])==25 and points==250,'frozen complete source/Native sequence')
    t=r['creationTravel'];before,created,undone,redone=[t[k] for k in ('before','created','undone','redone')];j=created['capture']['journal'];need(j['undoTarget']['kind']=='operation-append' and j['undoTarget']['operationType']=='WORKER_SELECTED_PROFILE_LOFT_V1' and j['undoTarget']['featureId']==r['binding']['featureId'],'actual named LOFT creation event');wanted=native_intent(before);wanted['counters']=created['capture']['native']['counters'];need(native_intent(undone)==wanted and native_intent(redone)==native_intent(created),'exact source predecessor and original-ID creation Redo');need(not undone['capture']['solids']['outputs'] and undone['capture']['journal']['redoTarget']['featureId']==r['binding']['featureId'],'actual loft removed, same Redo target')
    for k in ('scope','canUndo','canRedo','undoTarget','redoTarget'):need(redone['capture']['journal'][k]==j[k],'actual restored creation chronology')
    need(len(r['travels'])==16,'complete immediate and mixed shared travel')
    for row in r['travels']:need(row['before']['capture']['native']['counters']==row['after']['capture']['native']['counters'],'travel preserves actual high-water')
    need([x['error']['code'] for x in r['refusals']]==['LOFT_COINCIDENT_SECTIONS',None,'INVALID_VALUE',None] and [x['error']['name'] for x in r['refusals']]==['EngineContractError','AbortError','Error','AbortError'],'exact refusal layers')
    for row in r['refusals']:need(normalized(row['before'],row['candidate'])==normalized(row['after'],row['candidate']) and not row['error']['committed'] and not row['error']['possiblyCommitted'],'accepted refusal state preserved; candidate epoch separately observed')
    need(r['refusals'][2]['error']['message']=='A current positive typed length or literal millimeters is required.','actual schema-specific zero-width refusal');need([x['kind'] for x in r['noops']]==['source-plane-depth','width'],'both genuine no-ops')
    for row in r['noops']:need(row['result']['changed'] is False and row['before']==row['after'],'no-op preserves exact accepted document/J/tokens/resources')
    need(len(r['saves'])==len(r['reopens'])==3,'three real .cad Save/server/fresh Open cycles');archives=[]
    for row in r['saves']:
        arc=read_archive(root/row['savedFile']);need(arc['sha256']==row['sha256'] and arc['bytes']==row['bytes'],'actual own browser/server ZIP CRC/SHA/design revision');env=arc['envelope'];model=env['project']['model'];native=row['before']['capture']['native'];need(model['history']==native['history'] and model['counters']==native['counters'] and model['expressions']==native['expressions'],'one authored saved graph/high-water/parameters');need(env.get('manufacturing')==row['before']['manufacturing'] and env.get('presentation')==native['presentation'],'exact saved metadata');need({s['id']:s['data'] for s in env['project']['sketches']}=={s['id']:json.loads(s['source']) for s in native['sketches']},'both actual source sketches/intent/IDs retained');need(row['after']['capture']==row['before']['capture'],'normal Save preserves source/model/J');archives.append({'file':row['savedFile'],'sha256':arc['sha256'],'designRevision':arc['manifest']['designRevision']})
    for row in r['reopens']:
        for k in ('history','source','sketches','expressions','counters','presentation'):need(row['opened']['capture']['native'][k]==row['before']['capture']['native'][k],'fresh Open preserves '+k)
        need(not row['opened']['capture']['journal']['canUndo'] and not row['opened']['capture']['journal']['canRedo'],'fresh session Undo resets honestly')
    need((root/'final-normal-desktop.png').is_file(),'actual normal viewable Desktop capture')
    return {'status':'PASS','scope':'finite E15 unequal-section loft creation/source-plane/source-size travel and current .cad persistence; not all loft/C06/Gate1','nativeQueries':len(outputs),'nativePoints':points,'sourceOnlyStates':len(r['sourceObservations']),'native':outputs,'archives':archives}
if __name__=='__main__':print(json.dumps(check(sys.argv[1]),indent=2))
