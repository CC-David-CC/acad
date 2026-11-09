"""Independent source, material, plane/axis and requirement truth; AFTER WHOLE.
No production imports, Native caller or ID grammar. Public opaque references
are associated with actual discovery/selection records, not invented indices.
"""
import json,math,hashlib
from collections import Counter
from fractions import Fraction
from decimal import Decimal,localcontext
from requirement_math import quantity_math
FINE=5e-8;INCIDENCE=1e-7;DIRECTION=1e-8
PI=Decimal('3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651')
def need(v,m):
 if not v:raise ValueError(m)
def one(rows,m):need(len(rows)==1,'one '+m);return rows[0]
def near(x,y,t=1e-6):need(type(x) in (int,float) and math.isfinite(x) and abs(x-float(y))<=t,str(x)+' differs from '+str(y)+', budget '+str(t))
def vector(a,b,t=1e-6):need(len(a)==len(b),'vector dimension');[near(x,y,t) for x,y in zip(a,b)]
def norm_vector(a,b,t):need(len(a)==len(b) and all(type(x) in (int,float) and math.isfinite(x) for x in a) and math.dist(a,b)<=t,'bounded actual vector error')
def fields(v,keys):need(type(v) is dict and set(v)==set(keys),'exact source/fact fieldset')
def Q(x):need(type(x) in (int,float) and math.isfinite(x),'finite actual represented coordinate');return Fraction.from_float(float(x))
def producer_metadata(s):
 history=s['capture']['native']['history'];solids=s['capture']['solids'];pointer=s['lifecycle']['pointer'];public=s['host']
 need(type(history)is list and type(pointer)is int and public['operationsTruncated'] is False and public['operationCount']==len(history) and public['operations']==[row['type']for row in history],'actual complete public operation list agrees with captured native history')
 indexed={}
 for collection in ('bodies','outputs'):
  rows=solids[collection];need(type(rows)is list,'actual public solid inventory');seen=set();indexed[collection]={}
  for row in rows:
   need(type(row)is dict and type(row['id'])is str and bool(row['id']) and row['id']not in seen,'unique actual observed body/output identity');seen.add(row['id']);p=row['producer'];fields(p,('index','featureId','operationType'))
   need(type(p['index'])is int and 0<=p['index']<=pointer and p['index']<len(history) and type(p['featureId'])is int and 0<p['featureId']<=9007199254740991 and type(row['featureId'])is int and row['featureId']==p['featureId'] and type(p['operationType'])is str,'bounded active actual producer tuple')
   original=history[p['index']];params=original['params'];need(type(params)is dict and type(params['featureId'])is int and params['featureId']==p['featureId'] and original['type']==p['operationType']==public['operations'][p['index']],'producer derives from the actual original history row and owned feature, not ID grammar')
   indexed[collection][row['id']]=row
 for identity,body in indexed['bodies'].items():
  need(identity in indexed['outputs'],'every actual observed body has its output row');output=indexed['outputs'][identity]
  need(body['producer']==output['producer'] and body['featureId']==output['featureId'] and body['engine']==output['engine'] and output['outputId']==output['bodyId']==identity,'body/output producer aliases agree without invented output identity')
def settled(s):
 producer_metadata(s)
 r=s['ownership']['resources'];need(s['ownership']['processing'] is False and all(r[k]==0 for k in ('accepted','candidates','mounts')) and r['owners']==r['detached'] and r['cleanupFailed'] is False,'actual retired Native ownership')
 need(not s['lifecycle']['pipelineFailed'] and not s['lifecycle']['cleanupFailed'] and s['lifecycle']['pointer']==len(s['capture']['native']['history'])-1 and s['manufacturing']['metadata'] is None,'healthy full-tip unassigned source')
def source(row,build):
 b,e,s=row['binding'],row['expected'],row['before'];n=s['capture']['native'];raw=json.loads(n['source'])
 need(raw['version']==3 and len(raw['stages'])==1 and not raw['stages'][0]['generators'] and all(not x for x in raw['boundary'].values()),'genuine ordinary original source')
 frame={'origin':[0,0,0],'x':[1,0,0],'y':[0,1,0],'z':[0,0,1]};need(raw['metadata']['boundaryFrame']==frame and n['expressions']=='','actual original canonical source datum, no inferred body minimum')
 objects={r['id']:r for r in raw['objects']};need(len(objects)==len(raw['objects'])==4 and set(objects)==set(b['curveIds']),'actual original four-Segment identity set')
 corners=[(0,0),(e['width'],0),(e['width'],e['height']),(0,e['height'])];counts=Counter();edges=set()
 for o in objects.values():
  need(o['type']=='Segment' and o['stage']==0 and o['role'] is None and set(o['data'])=={'a','b'},'ordinary source Segment');ends=[]
  for p in (o['data']['a'],o['data']['b']):
   fields(p,('x','y'));q=one([q for q in corners if abs(q[0]-p['x'])<=FINE and abs(q[1]-p['y'])<=FINE],'independent source corner within50pm');counts[q]+=1;ends.append(q)
  edges.add(frozenset(ends))
 need(set(counts)==set(corners) and set(counts.values())=={2} and edges=={frozenset((corners[i],corners[(i+1)%4])) for i in range(4)},'whole actual source boundary')
 points={};inspection=row['inspection'];need(inspection['faceId']==b['faceId'] and len(inspection['points'])==8,'actual current public cold endpoint inventory')
 for p in inspection['points']:
  need(p['parentId'] in objects and p['id'] not in points,'real point ownership without parsing IDs');o=objects[p['parentId']];q=one([q for q in o['data'].values() if abs(q['x']-p['x'])<=FINE and abs(q['y']-p['y'])<=FINE],'actual cold/source endpoint agreement');points[p['id']]=q
 rows=raw['stages'][0]['constraints'];need(len(rows)==11 and Counter(r['typeId'] for r in rows)=={'PCoincident':4,'LockPoint':1,'Horizontal':2,'Vertical':2,'SegmentLength':2},'actual original11 registered rows')
 for c in rows:
  need(c['admission']['state'] in ('accepted','redundant'),'real admitted original constraints');refs=c['objects'];k=c.get('constants',{});kind=c['typeId']
  if kind=='PCoincident':
   a,z=[points[x] for x in refs];vector([a['x'],a['y']],[z['x'],z['y']],FINE)
  elif kind=='LockPoint':
   p=points[one(refs,'actual locked endpoint')];vector([p['x'],p['y']],[float(k['x']),float(k['y'])],FINE)
  else:
   o=objects[one(refs,'actual constrained Segment')];a,z=o['data']['a'],o['data']['b']
   if kind=='SegmentLength':near(math.dist([a['x'],a['y']],[z['x'],z['y']]),float(k['length']),FINE)
   else:near(a['y' if kind=='Horizontal' else 'x'],z['y' if kind=='Horizontal' else 'x'],FINE)
 history=n['history'];need([r['type'] for r in history[:3]]==['PLANE','WORKER_SELECTED_PROFILE_EXTRUDE_V2','WORKER_THROUGH_HOLES_V1'],'one actual source/profile/bore model')
 plane,profile,hole=[r['params'] for r in history[:3]];need(type(plane['featureId'])is str and type(b['rectangle']['featureId'])is int and plane['featureId']==str(b['rectangle']['featureId']) and plane['orientation']=='XY' and plane['depth']==0 and plane['datum'] is None,'actual independently authored source plane')
 need(profile['featureId']==b['profile']['featureId'] and profile['faceId']==b['faceId'] and profile['regionId']==b['regionId'] and profile['version']==1 and profile['unit']=='millimeter' and profile['engine']=='occ' and profile['engineRevision']==build and profile['bodyPolicy']=='separate' and profile['depth']==e['depth'],'exact original literal profile intent/build')
 need(hole['featureId']==b['center']['featureId'] and hole['target']==b['profile']['outputId'] and hole['producerFeatureId']==hole['sourceFeatureId']==b['profile']['featureId'] and hole['sourceFaceId']==b['faceId'] and hole['sourceRegionId']==b['regionId'] and hole['kind']=='centered-through' and hole['diameter']==e['diameter'] and hole['engineRevision']==build,'actual original centered-bore semantics')
 need((e['width'],e['height'],e['depth'],e['diameter']) in {(100,50,20,10),(150,30,20,10),(150,30,25,10),(150,30,25,12),(150,30,25,14)},'only frozen source edit/Undo/Redo dimensions')
 if 'tool' in b:
  box=one([r['params'] for r in history if r['type']=='WORKER_SOLID_BOX_V1'],'real independent OWN roof box');need(box['featureId']==b['tool']['featureId'] and [box[k] for k in ('x','y','z','width','depth','height')]==[0,0,25,150,30,2] and box['engineRevision']==build,'genuine actual roof, no fake reference source')
 if e['cover']:
  op=one([r['params'] for r in history if r['type']=='WORKER_SOLID_BOOLEAN_V1'],'actual upstream union');need(op['featureId']==b['last']['featureId'] and op['kind']=='union' and op['a']==b['center']['outputId'] and op['b']==b['tool']['outputId'] and op['engineRevision']==build and e['cover']==2,'actual ordered public union, not a drawn cover')
 need(len(history)==3+int('tool'in b)+int(bool(e['cover'])),'no hidden recipe/history')
 return frame

def classify(p,e):
 x,y,z=map(Q,p);W,H,T,R=Q(e['width']),Q(e['height']),Q(e['depth']),Q(e['diameter'])/2;top=T+Q(e['cover'])
 if x<0 or x>W or y<0 or y>H or z<0 or z>top:return'outside'
 r=(x-W/2)**2+(y-H/2)**2
 if r<R*R and (z<T if e['cover'] else z<=T):return'outside'
 return 'boundary' if x in (0,W) or y in(0,H) or z in(0,top) or r==R*R and z<=T or e['cover'] and r<R*R and z==T else'inside'

def surface_anchor(p,e):
 x,y,z=p;W,H,T,R=e['width'],e['height'],e['depth'],e['diameter']/2;top=T+e['cover'];r=math.hypot(x-W/2,y-H/2);t=INCIDENCE
 inside=lambda n,a,b:a-t<=n<=b+t
 need(all(type(n) in(int,float) and math.isfinite(n) for n in p),'actual finite Native anchor')
 side=((abs(x)<=t or abs(x-W)<=t) and inside(y,0,H) and inside(z,0,top)) or ((abs(y)<=t or abs(y-H)<=t) and inside(x,0,W) and inside(z,0,top))
 cap=(abs(z)<=t or abs(z-top)<=t) and inside(x,0,W) and inside(y,0,H) and (e['cover'] and abs(z-top)<=t or r>=R-t)
 cylinder=abs(r-R)<=t and inside(z,0,T)
 ceiling=e['cover'] and abs(z-T)<=t and r<=R+t
 need(side or cap or cylinder or ceiling,'actual anchor lies on independent finite material boundary within Native incidence')

def plane_facts(f,e,axis=None,level=None):
 fields(f,('support','anchor','sourceAxis'));fields(f['support'],('origin','normal'));n=f['support']['normal'];o=f['support']['origin'];p=f['anchor']
 need(len(n)==len(o)==len(p)==3 and all(type(x) in(int,float) and math.isfinite(x) for a in(n,o,p) for x in a),'finite complete plane observations')
 if axis is None:
  axis=f['sourceAxis'];need(axis in('x','y','z'),'finite fixture actual plane source axis')
  levels={'x':[0,e['width']],'y':[0,e['height']],'z':[0,e['depth'],e['depth']+e['cover']]}[axis]
  need(any(abs(o['xyz'.index(axis)]-v)<=INCIDENCE for v in levels),'actual plane support belongs to independent finite material planes')
 if axis is not None:
  wanted={'x':[1,0,0],'y':[0,1,0],'z':[0,0,1]}[axis];norm_vector(n,wanted,DIRECTION);need(f['sourceAxis']==axis,'actual source-aligned orientation, not symbol inference')
  if level is not None:near(o['xyz'.index(axis)],level,INCIDENCE)
 near(sum((p[i]-o[i])*n[i] for i in range(3)),0,INCIDENCE);surface_anchor(p,e)

def geometry_observation(row,build):
 before,after=row['before'],row['after'];need(before==after,'all actual reads preserve complete accepted state');settled(before);frame=source(row,build);e,b=row['expected'],row['binding'];body=one([r for r in before['capture']['solids']['bodies'] if r['id']==b['last']['outputId'] and r['featureId']==b['last']['featureId']],'actual current complete result')
 m=body['metrics'];need(m['nativeValidity']['valid'] is True and m['solidCount']==1 and m['resultKind']=='single-solid' and 'sha256:'+m['runtime']['jsSha256']+':'+m['runtime']['wasmSha256']==build,'actual measured Native single-solid/build')
 with localcontext() as c:
  c.prec=90;W,H,T,R,C=[Decimal(str(e[k])) for k in ('width','height','depth','diameter','cover')];volume=W*H*(T+C)-PI*(R/2)**2*T
 near(m['nativeVolume'],volume,1e-6);vector(m['nativeBounds']['min'],[0,0,0]);vector(m['nativeBounds']['max'],[e['width'],e['height'],e['depth']+e['cover']])
 q,rowq=row['pointRequest'],row['pointReply'];cx,cy,T,R,Z=e['width']/2,e['height']/2,e['depth'],e['diameter']/2,e['depth']+e['cover']
 expected_points=[[e['width']/4,e['height']/4,T/2],[e['width']/4,e['height']/4,0],[e['width']/4,e['height']/4,Z],[-1,cy,T/2],[cx,cy,T/2],[cx+R,cy,T/2],[cx,cy,0],[cx,cy,T],[cx,cy,T+1],[cx,cy,Z+1],[cx,cy,-1],[0,cy,T/2]]
 need(q['points']==expected_points,'ALL frozen original/cap/material/cylindrical/roof/outer/void probes, no subset selected from results')
 fields(q,('revision','version','unit','engine','engineRevision','bodyId','featureId','points'))
 need(q['revision']==before['capture']['solids']['revision'] and q['bodyId']==body['id'] and q['featureId']==body['featureId'] and q['engineRevision']==build,'actual issued point source/body binding')
 for k in ('revision','version','unit','engine','engineRevision','bodyId','featureId'):need(rowq[k]==q[k],'actual point reply capture')
 need(rowq['quality']=='native-re-evaluation-observation' and rowq['points']==[{'point':p,'classification':classify(p,e)} for p in q['points']],'independent exact represented source material/void truth')
 return {'frame':frame,'volumeMm3':str(volume),'body':body,'source':json.loads(before['capture']['native']['source'])}

REASONS=set('DRAWING_REFERENCE_UNRESOLVED DRAWING_REFERENCE_MISSING DRAWING_TYPE_CHANGED DRAWING_SOURCE_CHANGED DRAWING_HOLE_WITNESS_UNAVAILABLE DRAWING_AMBIGUOUS_ANCESTRY DRAWING_FINITE_EXTENT_UNQUALIFIED DRAWING_AXIS_UNSUPPORTED DRAWING_NO_DESCENDANT DRAWING_MULTIPLE_DESCENDANTS DRAWING_MERGED_DESCENDANT NO_DESCENDANT MULTIPLE_DESCENDANTS MERGED_DESCENDANT AUTHORED_REMOVAL UNRESOLVED_SELECTION DRAWING_PLANE_UNQUALIFIED DRAWING_DATUM_FRAME_UNQUALIFIED DRAWING_POSITION_AXIS_UNQUALIFIED DRAWING_FIT_NOMINAL_UNAVAILABLE DRAWING_FIT_LIMIT_DOMAIN DRAWING_SURFACE_UNQUALIFIED DRAWING_TARGET_UNAVAILABLE'.split())
FRAME={'origin':[0,0,0],'x':[1,0,0],'y':[0,1,0],'z':[0,0,1]}
AXES={'top':([1,0,0],[0,1,0],[0,0,1]),'front':([1,0,0],[0,0,1],[0,-1,0]),'right':([0,1,0],[0,0,1],[1,0,0])}
def face_member(ref,body):
 fields(ref,('kind','originFeatureId','selectionId','geometry'));need(ref['kind']=='native-face' and ref['geometry']=='plane','actual NativeFace reference kind')
 matches=[r for r in body['selections']['plan']['faces'] if r['id']==ref['selectionId'] and r['originFeatureId']==ref['originFeatureId'] and r['geometry']=='plane']
 need(len(matches)==1,'actual current opaque face identity AND original author membership, no support-only identity');return matches[0]

def unresolved(row):
 need(row['status']=='unresolved' and row['reason'] in REASONS and row['quality'] is None and row['facts'] is None,'actual closed known unavailable binding, never nominal facts')

def requirement_observation(row,build):
 derived=geometry_observation(row,build)
 if row['geometryOnly']:
  need(row['definition'] is None and row['read'] is None and row['projection'] is None,'actual no-definition phase, no invented read');return derived
 d,r,p,e=row['definition'],row['read'],row['projection'],row['expected'];before=row['before'];body=derived['body']
 fields(d['target'],('featureId','operationType','engine','engineRevision','output'));authored=d['target'];original=one([entry for entry in before['capture']['native']['history']if type(entry['params'].get('featureId'))is int and entry['params']['featureId']==authored['featureId']],'actual historical target producer')
 need(authored['operationType']==original['type'] and authored['engine']=='occ' and authored['engineRevision']==build and authored['output']=='complete-native-result','authored target type is actual original history, even when consumed')
 if not row['targetMissing']:need(authored['featureId']==body['producer']['featureId'] and authored['operationType']==body['producer']['operationType'],'resolved current target is actual body producer')
 b=row['binding'];bore={'kind':'through-hole','featureId':b['center']['featureId'],'sourceFeatureId':b['profile']['featureId'],'faceId':b['faceId'],'regionId':b['regionId'],'holeKind':'centered-through','slot':'center','geometry':'cylinder'}
 need(next(x for x in d['requirements']if x['kind']=='position-tolerance')['target']==bore and next(x for x in d['dimensions']if x['kind']=='hole-diameter')['hole']==bore and d['annotations'][0]['hole']==bore,'all original actual cylinder source/slot/producer references, never source flags')
 fields(r,('version','unit','revision','geometryRevision','drawingId','target','status','observation'))
 need(r['version']==1 and r['unit']=='millimeter' and r['revision']==before['host']['revision'] and r['geometryRevision']==before['capture']['solids']['revision'] and r['drawingId']==d['drawingId'] and before['drawing']['definition']==d,'exact accepted definition and actual issued document/geometry lifetime')
 need({k:v for k,v in p.items() if k!='views'}==r,'metadata-only and actual full protected read share one ordered observation; neither is source truth')
 o=r['observation'];need(o['version']==1 and o['unit']=='millimeter' and o['scope']=='response-local' and o['quality']=='native-bound-drawing-references' and o['drawingId']==d['drawingId'] and o['featureId']==d['target']['featureId'],'actual metadata reference scope')
 need(len(o['dimensions'])==len(d['dimensions'])==4 and len(o['annotations'])==len(d['annotations'])==1 and len(o['datumFeatures'])==len(d['datumFeatures'])==3 and len(o['requirements'])==len(d['requirements'])==3,'all original + new rows, not filtered successes')
 for a,f in zip(d['datumFeatures'],o['datumFeatures']):
  need(f['annotationId']==a['annotationId'] and f['symbol']==a['symbol'],'ordered datum identity')
  if f['status']=='available':
   face_member(a['reference'],body);plane_facts(f['facts'],e,{'A':'z','B':'x','C':'y'}[a['symbol']],e['datumLevel'] if a['symbol']=='A' else 0)
   need(f['quality']=='native-brep-analytic' and f['reason'] is None,'genuine Native planar datum facts')
  else:unresolved(f)
 if row['targetMissing']:
  need(r['target'] is None and r['status']==o['status']=='unresolved' and o['datumFrame'] is None and not o['viewFrames'] and not p['views'],'consumed target is explicitly unresolved, no copied old projections')
  need(all(x['status']=='unresolved' and x['reason']=='DRAWING_TARGET_UNAVAILABLE' for key in ('dimensions','annotations','datumFeatures','requirements') for x in o[key]),'all lost-target references unavailable')
 else:
  need(r['target']=={'bodyId':body['id'],'featureId':body['featureId'],'engine':'occ','engineRevision':build} and o['datumFrame']==FRAME,'actual whole target and ORIGINAL source datum, not model bounds')
  need(r['status']==o['status']==('unresolved' if row['unresolved'] else 'available'),'complete expected geometry-binding state')
  if row['foreign']:
   need(o['datumFeatures'][0]['reason']=='DRAWING_REFERENCE_UNRESOLVED' and o['requirements'][0]['reason']=='DRAWING_REFERENCE_UNRESOLVED','OWN unrelated Native identity is not current target membership')
  elif row['unresolved']:
   unresolved(o['datumFeatures'][0]);unresolved(o['requirements'][0]);unresolved(o['requirements'][1])
   old=d['datumFeatures'][0]['reference'];u=[x for x in body['selections']['plan']['unresolved'] if x.get('kind')=='face' and x.get('id')==old['selectionId'] and x.get('originFeatureId')==old['originFeatureId']]
   reason=u[0]['reason'] if u and u[0]['reason'] in REASONS else 'DRAWING_REFERENCE_UNRESOLVED'
   need(o['datumFeatures'][0]['reason']==reason and o['requirements'][0]['reason']==reason and o['requirements'][1]['reason']==reason,'first actual retained lineage reason, no guessed loss severity')
  objects={x['id']:x for x in derived['source']['objects']}
  for a,f in zip(d['dimensions'],o['dimensions']):
   need(f['dimensionId']==a['dimensionId'] and f['kind']==a['kind'],'original dimension order')
   if f['status']=='unresolved':
    need(f['reason'] in REASONS and f['quality'] is None and f['value'] is None and f['anchors']==[],'unavailable old dimension has no stale value');continue
   need(f['reason'] is None and len(f['anchors'])==2,'actual measured old dimension')
   if a['kind']=='source-distance':
    need(f['quality']=='solved-source-datum','original solved-source dimension quality')
    for ref,point in zip((a['from'],a['to']),f['anchors']):
     need(ref['featureId']==row['binding']['profile']['featureId'] and ref['faceId']==row['binding']['faceId'] and ref['regionId']==row['binding']['regionId'] and ref['curveId'] in objects,'source endpoint membership, no ID grammar')
     q=objects[ref['curveId']]['data'][ref['point']];vector(point,[q['x'],q['y'],0],FINE)
    near(f['value'],e['width'] if a['axis']=='datum-x' else e['height'],FINE)
   elif a['kind']=='plane-distance':
    face_member(a['first'],body);face_member(a['second'],body);need(f['quality']=='native-brep-analytic','actual two-plane distance');near(f['value'],e['depth']+e['cover'],INCIDENCE)
    vector(f['anchors'][0][:2],f['anchors'][1][:2],INCIDENCE);near(f['anchors'][0][2],0,INCIDENCE);near(f['anchors'][1][2],e['depth']+e['cover'],INCIDENCE)
   else:
    need(a['kind']=='hole-diameter' and f['quality']=='native-prism-cut-lineage','actual finite bore nominal, not a THRU assertion');near(f['value'],e['diameter'],INCIDENCE)
    near(math.dist(*f['anchors']),e['diameter'],INCIDENCE)
    for pt in f['anchors']:near(pt[2],e['depth']/2,INCIDENCE);near(math.hypot(pt[0]-e['width']/2,pt[1]-e['height']/2),e['diameter']/2,INCIDENCE)
  for a,f in zip(d['requirements'],o['requirements']):
   if f['status']=='unresolved':unresolved(f);continue
   v=f['facts'];W,H,T,A=e['width'],e['height'],e['depth'],e['datumLevel'];cx,cy=W/2,H/2
   if a['kind']=='position-tolerance':
    vector(v['datumFrame']['origin'],[0,0,A],INCIDENCE)
    for k,want in (('x',[1,0,0]),('y',[0,1,0]),('z',[0,0,1])):norm_vector(v['datumFrame'][k],want,DIRECTION)
    vector(v['axisPoint'],[cx,cy,A],INCIDENCE);vector(v['anchor'],v['axisPoint'],INCIDENCE);norm_vector(v['axisDirection'],[0,0,1],DIRECTION);vector(v['coordinates'],[cx,cy,0],INCIDENCE)
    need(len(v['axisEnds'])==2,'complete finite original bore ends');ends=sorted(v['axisEnds'],key=lambda q:q[2]);vector(ends[0],[cx,cy,0],INCIDENCE);vector(ends[1],[cx,cy,T],INCIDENCE)
    need(A in (0,T),'A is actual finite rim plane, not arbitrary internal axis crossing')
   elif a['kind']=='surface-finish':
    face_member(a['target'],body);plane_facts({'support':v['support'],'anchor':v['anchor'],'sourceAxis':'z'},e,'z',A)
   else:vector(v['anchor'],[cx+e['diameter']/2,cy,T/2],INCIDENCE)
  # Original center mark must remain actual finite cylindrical observation.
  a,f=d['annotations'][0],o['annotations'][0]
  need(f['annotationId']==a['annotationId'] and f['kind']==a['kind']=='bore-center','unchanged old annotation identity')
  if f['status']=='available':
   near(f['facts']['diameter'],e['diameter'],INCIDENCE);vector(f['facts']['center'],[e['width']/2,e['height']/2,0],INCIDENCE)
   ends=sorted(f['facts']['ends'],key=lambda q:q[2]);vector(ends[0],[e['width']/2,e['height']/2,0],INCIDENCE);vector(ends[1],[e['width']/2,e['height']/2,e['depth']],INCIDENCE)
  else:unresolved(f)
 derived['quantityMath']=quantity_math(d,o,e['diameter'],INCIDENCE)
 return derived

def discovery(row,build,binding,expected):
 need(row['before']==row['after'],'actual discovery preserves complete source/model/J/resources');q,r=row['request'],row['result'];o=r['observation']
 producer_metadata(row['before'])
 need(q['revision']==r['revision']==row['before']['host']['revision'] and q['geometryRevision']==r['geometryRevision']==row['before']['capture']['solids']['revision'] and r['target']['featureId']==q['target']['featureId'],'actual issued discovery binding')
 need(o['version']==1 and o['unit']=='millimeter' and o['scope']=='response-local' and o['quality']=='native-bound-drawing-requirement-targets' and o['featureId']==q['target']['featureId'] and o['sourceFrame']==FRAME and o['datum']==q['datum'],'actual bounded original frame, not a new authored datum')
 body=one([b for b in row['before']['capture']['solids']['bodies'] if b['featureId']==q['target']['featureId']],'actual discovery target');seen=set()
 need(q['target']=={'featureId':body['producer']['featureId'],'operationType':body['producer']['operationType'],'engine':'occ','engineRevision':build,'output':'complete-native-result'},'discovery query names the actual current original producer')
 for p in o['planes']:
  need(p['reference']['selectionId'] not in seen,'each actual plane once');seen.add(p['reference']['selectionId']);face_member(p['reference'],body)
  if p['status']=='available':need(p['quality']=='native-brep-analytic' and p['reason'] is None,'actual plane quality');plane_facts(p['facts'],expected)
  else:unresolved(p)
 need(0<len(o['planes'])<=16 and o['bores'],'finite complete discovery inventory')
 return {'planes':len(o['planes']),'bores':len(o['bores'])}
