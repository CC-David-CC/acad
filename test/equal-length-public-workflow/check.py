#!/usr/bin/env python3
"""Independent AFTER-WHOLE public source, equations, rank and ZIP oracle.
No production solver, polynomial or expected-geometry provider is imported.
"""
import hashlib,json,math,sys
from pathlib import Path
from fractions import Fraction as F
from decimal import Decimal as D,localcontext
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive
BUDGET=D('0.00000005')
def need(ok,message):
 if not ok:raise ValueError(message)
def one(rows,label):need(len(rows)==1,'one '+label);return rows[0]
def dec(v):return D.from_float(v) if isinstance(v,float) else D(v)
def close(x,y,budget=BUDGET):need(type(x) in (int,float,D) and math.isfinite(x) and abs(dec(x)-dec(y))<=budget,f'{x} != {y}; budget {budget}mm')
def source(state,face):return json.loads(one([s for s in state['capture']['native']['sketches'] if s['id']==face],'actual saved source')['source'])
def settled(s):
 r=s['ownership']['resources'];need(not s['ownership']['processing'] and not r['cleanupFailed'] and all(r[k]==0 for k in ('candidates','accepted','mounts')) and r['owners']==r['detached'],'actual retired resources');need(s['manufacturing'] is None,'no hidden material mutation')
def length(o):
 a,b=o['data']['a'],o['data']['b']
 with localcontext() as c:c.prec=110;dx=dec(b['x'])-dec(a['x']);dy=dec(b['y'])-dec(a['y']);return(dx*dx+dy*dy).sqrt()
def coords(s,b):
 objects={o['id']:o for o in s['objects']};points={b['unrelatedPointId']:objects[b['unrelatedId']]['data']}
 for name,v in b['objects'].items():
  o=objects[v['id']];need(o['type']=='Segment','actual native Segment');points[v['aId']]=o['data']['a'];points[v['bId']]=o['data']['b']
 # Unchanged rectangle members: map actual inspected initial endpoint identity
 # to the unique endpoint of its ACTUAL parent in the frozen rectangle. This
 # independently corroborates a replay observation within the fixed50pm budget;
 # it is not source identity authority, nearest search, snapping or authoring.
 for p in b['rectanglePoints']:
  o=objects[p['parentId']];matches=[o['data'][k] for k in ('a','b') if all(abs(dec(o['data'][k][axis])-dec(p[axis]))<=BUDGET for axis in ('x','y'))];points[p['id']]=one(matches,'unchanged rectangle actual endpoint')
 return objects,points
def equations(s,b):
 objects,points=coords(s,b)
 for st in s['stages']:
  for c in st['constraints']:
   need(c['admission']['state'] in ('accepted','redundant'),'actual admitted state');t=c['typeId'];ids=c['objects'];k=c.get('constants',{})
   if t=='PCoincident':
    a,z=[points[id] for id in ids]
    for axis in ('x','y'):close(a[axis],z[axis])
   elif t=='LockPoint':
    for axis in ('x','y'):close(points[one(ids,'point lock')][axis],D(str(k[axis])))
   elif t in ('SignedDistanceX','SignedDistanceY'):
    axis='x' if t=='SignedDistanceX' else 'y';a,z=[points[id] for id in ids];close(dec(z[axis])-dec(a[axis]),D(str(k['distance'])))
   elif t in ('Horizontal','Vertical'):
    o=objects[one(ids,'axis Segment')]['data'];axis='y' if t=='Horizontal' else 'x';close(o['a'][axis],o['b'][axis])
   elif t=='SegmentLength':close(length(objects[one(ids,'driver')]),D(str(k['length'])))
   elif t=='EqualLength':
    need(len(ids)==2 and ids[0]!=ids[1] and not k,'value-free actual equality');close(length(objects[ids[0]]),length(objects[ids[1]]))
   elif t=='LengthRelation':
    need(set(k)=={'factor','offset'},'actual two-constant authority');f,d=D(str(k['factor'])),D(str(k['offset']));need(f>=0 and abs(d)<=1000000,'existing constant domain');close(length(objects[ids[0]])-f*length(objects[ids[1]]),d)
   else:raise ValueError('Unexpected fixture original schema '+t)
 return objects,points

def exact_rank(rows,n):
 a=[[F(x) for x in r] for r in rows];rank=0
 for col in range(n):
  pivot=next((i for i in range(rank,len(a)) if a[i][col]),None)
  if pivot is None:continue
  a[rank],a[pivot]=a[pivot],a[rank];v=a[rank][col];a[rank]=[x/v for x in a[rank]]
  for i in range(len(a)):
   if i!=rank and a[i][col]:v=a[i][col];a[i]=[x-v*y for x,y in zip(a[i],a[rank])]
  rank+=1
 return rank

def independent_nullity(s,b):
 # Fixture diagnostics occur before removing the three dy=0 restrictions.
 # Start anchors/dy=0 are independently checked from original equations. Thus
 # each ordinary noncollapsed Segment has exactly one physical length freedom;
 # the two Q coordinates are independent until its actual LockPoint is added.
 ids=[b['objects'][k]['id'] for k in ('A','B','C','D','E')];rows=[];q_locks=set()
 for st in s['stages']:
  for c in st['constraints']:
   t=c['typeId'];refs=c['objects'];k=c.get('constants',{});v=[F(0)]*5
   if t=='EqualLength':v[ids.index(refs[0])]+=1;v[ids.index(refs[1])]-=1;rows.append(v)
   elif t=='LengthRelation':v[ids.index(refs[0])]+=1;v[ids.index(refs[1])]-=F(str(k['factor']));rows.append(v)
   elif t=='SegmentLength' and refs[0] in ids:v[ids.index(refs[0])]=1;rows.append(v)
   elif t in ('SignedDistanceX','SignedDistanceY') and refs==[b['datumId'],b['unrelatedPointId']]:q_locks.add(t)
   elif t=='LockPoint' and refs==[b['unrelatedPointId']]:q_locks.update(('SignedDistanceX','SignedDistanceY'))
 for v in b['objects'].values():
  allc=[c for st in s['stages'] for c in st['constraints']];need(any(c['typeId']=='SignedDistanceY' and c['objects']==[v['aId'],v['bId']] and D(str(c['constants']['distance']))==0 for c in allc),'rank domain has actual dy=0 row')
 return 5-exact_rank(rows,5)+(2-len(q_locks))

def source_check(row):
 b=row['binding'];s=source(row['before'],b['faceId']);need(s['version']==3 and len(s['objects'])==10 and len(s['stages'])==1 and not s['stages'][0]['generators'],'one real four-edge rectangle/five ordinary Segments/Point');need(all(not x for x in s['boundary'].values()),'no boundary source seed');objects,points=equations(s,b);edges={(tuple(objects[id]['data']['a'][k] for k in ('x','y')),tuple(objects[id]['data']['b'][k] for k in ('x','y'))) for id in b['rectangleIds']};need(edges=={((100,100),(110,100)),((110,100),(110,110)),((110,110),(100,110)),((100,110),(100,100))},'exact actual unrelated canonical rectangle');need(objects[b['unrelatedId']]['data']=={'x':77,'y':99},'exact unrelated Point');need(len({o['id'] for o in s['objects']})==10,'actual unique IDs');need(s['metadata']['boundaryFrame']=={'origin':[0,0,0],'x':[1,0,0],'y':[0,1,0],'z':[0,0,1]},'actual frame')
 for name,v in b['objects'].items():
  o=objects[v['id']];need(o['role']=='construction','explicit construction source');close(o['data']['a']['x'],v['start'][0]);close(o['data']['a']['y'],v['start'][1]);want=row['lengths'][name]
  if want is not None:close(length(o),want)
  if name!='C' or row['rotatedC'] is None:close(o['data']['b']['y'],0)
  if name=='B' and row['signedB'] is not None:close(dec(o['data']['b']['x'])-dec(o['data']['a']['x']),row['signedB'])
  if name=='C' and type(row['rotatedC']) is list:
   for axis,want in zip(('x','y'),row['rotatedC']):close(o['data']['b'][axis],want)
 actual=[c for st in s['stages'] for c in st['constraints'] if c['typeId']=='EqualLength'];need(len(actual)==len(row['pairs']),'exact equality membership')
 for a,z in row['pairs']:one([c for c in actual if set(c['objects'])=={b['objects'][a]['id'],b['objects'][z]['id']}],'actual expected equality')
 ratios=[c for st in s['stages'] for c in st['constraints'] if c['typeId']=='LengthRelation'];need(len(ratios)==(1 if row['ratio'] else 0),'exact ratio membership')
 if row['ratio']:
  r=one(ratios,'actual expected ratio');need(r['objects']==[b['objects']['A']['id'],b['objects']['B']['id']] and r['constants']=={k:str(v) for k,v in row['ratio'].items()},'actual ordered literal ratio')
 # Public replay inspection is a separate observation of the same source IDs,
 # never assumed byte-identical retained geometry or used as source authority.
 i=row['inspection'];need({o['id'] for o in i['objects']}==set(objects),'actual observed object IDs')
 for p in i['points']:
  need(p['id'] in points,'actual endpoint identity');q=points[p['id']]
  for axis in ('x','y'):close(p[axis],q[axis])
 for dim in s.get('dimensions',[]):
  need(set(dim)=={'id','type','data'} and dim['type']=='LinearDimension' and set(dim['data'])=={'a','b','offset'},'actual canonical native ruler');k=dim['data'];need(k['a'] in points and k['b'] in points and type(k['offset']) in (int,float) and math.isfinite(k['offset']),'owned ruler EndPoints/layout');m=one([m for m in row['measurementInspection']['measurements'] if m['measurementId']==dim['id']],'actual current ruler observation');segment=one([o for o in s['objects'] if o['type']=='Segment' and any(v['id']==o['id'] and {v['aId'],v['bId']}=={k['a'],k['b']} for v in b['objects'].values())],'actual ruler owner');close(m['canonicalValue'],length(segment));drivers=[c for st in s['stages'] for c in st['constraints'] if c['typeId']=='SegmentLength' and c['objects']==[segment['id']]];need(m['role']==('driving' if len(drivers)==1 else 'reference'),'derived original driver role, not stored equality flag')
 return s,objects

def check(folder):
 root=Path(folder);r=json.loads((root/'receipt.json').read_text());need(r['status']=='PASS' and r['ownedContextsRetired'] and r['sharedBrowserDisconnectedOnly'],'complete terminal workflow and cleanup');need(r['sourcePins']==r['sourcePinsAfter'] and not r['sourceSeeds'] and not r['fakeReplies'],'frozen genuine producers');need(r['tolerances']=={'coordinateMm':5e-8,'nativeVolumeMm3':1e-6,'nativeBoundsMm':1e-6},'unchanged budgets');need(len(r['saves'])==len(r['reopens'])==3,'three normal archive cycles')
 for snap in r['sourceSnapshots']:
  raw=(root/snap['file']).read_bytes();need(hashlib.sha256(raw).hexdigest()==snap['sha256']==r['sourcePins'][snap['originalFile']],'portable frozen source custody')
 observations=[];native_points=0
 for row in r['observations']:
  need(row['before']==row['after'],'exact read-only state');settled(row['before']);s,objects=source_check(row);body=one(row['before']['capture']['solids']['bodies'],'native solid');need(body['id']==row['binding']['native']['outputId'] and body['featureId']==row['binding']['native']['featureId'],'actual output binding');m=body['metrics'];need(m['nativeValidity']['valid'] and m['solidCount']==1 and m['resultKind']=='single-solid','actual Native census');need('sha256:'+m['runtime']['jsSha256']+':'+m['runtime']['wasmSha256']==r['engineRevision'],'actual build');close(m['nativeVolume'],2000,D('0.000001'))
  for k,want in {'min':[100,100,0],'max':[110,110,20]}.items():
   for x,y in zip(m['nativeBounds'][k],want):close(x,y,D('0.000001'))
  q=row['query'];request=row['input'];need(q['quality']=='native-re-evaluation-observation','genuine point read')
  for k in ('revision','version','unit','engine','engineRevision','bodyId','featureId'):need(q[k]==request[k],'actual point binding')
  need(request['points']==[[105,105,10],[111,105,10],[100,105,10],[105,105,21]],'independent native probes');need(q['points']==[{'point':p,'classification':c} for p,c in zip(request['points'],['inside','outside','boundary','outside'])],'analytic retained cube material/void');native_points+=4;observations.append(row['label'])
 need([d['nullity'] for d in r['diagnostics']]==[5,4,3,3,2,0,2],'whole free/full/redundant sequence')
 b=r['observations'][0]['binding']
 for d in r['diagnostics']:
  need(d['before']==d['after'],'read-only diagnostics');s=source(d['before'],b['faceId']);equations(s,b);need(independent_nullity(s,b)==d['nullity']==d['result']['localJacobian']['localNullity'],'independent original component rank, not global n-minus-rows')
 for label,pair in [('Transitive and exact fixed10/10 distinct redundancy',('A','C')),('Transitive and exact fixed10/10 distinct redundancy',('D','E'))]:
  o=one([x for x in r['observations'] if x['label']==label],'required genuine state');s=source(o['before'],b['faceId']);c=one([c for st in s['stages'] for c in st['constraints'] if c['typeId']=='EqualLength' and set(c['objects'])=={b['objects'][x]['id'] for x in pair}],'distinct original equality');need(c['admission']['state']=='redundant','actual exact original dependence, not duplicate no-op')
 noop=one([x for x in r['rows'] if x['label']=='Reversed equality no-op preserves redo'],'real no-op');need(noop['before']==noop['after'] and noop['noop']['changed'] is False and noop['before']['capture']['journal']['canRedo'],'no-op retains source/J/redo')
 for x in r['refusals']:need(x['before']==x['after'] and not x['error']['committed'] and not x['error']['possiblyCommitted'],'precise atomic refusal')
 required={'Fixed A10 versus B12 equality conflicts','Actual old equality request is stale','Factor0 conflicting offset15 retains A14 and free B8','Fixed physical A14 and B8 cannot be equal','Unknown relation locator','Negative ratio remains outside registered domain','Legacy positive SegmentLength zero still refuses','Legacy positive SegmentLength negative still refuses'};need({x['label'] for x in r['refusals']}==required,'all finite refusal controls')
 zero=one([x for x in r['observations'] if x['label']=='Nonzero to zero excludes obsolete B dependency'],'real factor0 replacement');need(source(zero['before'],b['faceId'])['objects']==source(one([x for x in r['observations'] if x['label']=='Fresh signed Open ratio-edited'],'prior real source')['before'],b['faceId'])['objects'],'no B or unrelated coordinate authority from removed old row')
 archives=[]
 for x in r['saves']:
  arc=read_archive(root/x['savedFile']);need(arc['sha256']==x['sha256'] and arc['bytes']==x['bytes'],'actual archive CRC/SHA/manifest');env=arc['envelope'];model=env['project']['model'];native=x['before']['capture']['native'];need(model['history']==native['history'] and model['expressions']==native['expressions'] and model['counters']==native['counters'],'one authored graph/definitions/allocator');need({s['id']:s['data'] for s in env['project']['sketches']}=={s['id']:json.loads(s['source']) for s in native['sketches']},'exact saved source/IDs/intent');need(env.get('manufacturing') is None and env.get('presentation')==native['presentation'],'actual metadata');need(x['after']['capture']==x['before']['capture'],'Save leaves authored state exact');archives.append({'file':x['savedFile'],'sha256':arc['sha256'],'designRevision':arc['manifest']['designRevision']})
 for x in r['reopens']:
  for k in ('history','source','sketches','expressions','counters','presentation'):need(x['opened']['capture']['native'][k]==x['before']['capture']['native'][k],'fresh Open exact '+k)
 return{'status':'PASS','scope':'finite physical EqualLength and literal LengthRelation lifecycle, not all C03/typed/general solver or BRep equality','observations':len(observations),'nativePoints':native_points,'archives':archives,'geometryBudgetMm':'0.00000005'}
if __name__=='__main__':print(json.dumps(check(sys.argv[1]),indent=2))
