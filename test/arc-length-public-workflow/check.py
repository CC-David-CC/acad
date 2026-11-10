#!/usr/bin/env python3
"""Independent AFTER-whole original equations and real native ZIP reader.
No production solver, authored Arc policy, codec or formatter import.
"""
import hashlib, importlib.util, json, math, sys
from fractions import Fraction as Q
from pathlib import Path
sys.dont_write_bytecode=True
p=Path(__file__).resolve().parents[1]/'native-cad-container/archive_oracle.py'
spec=importlib.util.spec_from_file_location('arc_archive',p);archive=importlib.util.module_from_spec(spec);spec.loader.exec_module(archive)
CASES=['proper-quarter','proper-seam-crossing','full-ccw']
FIXTURES={'proper-quarter':{'a':{'x':5,'y':0},'b':{'x':0,'y':5},'c':{'x':0,'y':0},'branch':'proper-ccw'},'proper-seam-crossing':{'a':{'x':-4,'y':3},'b':{'x':4,'y':3},'c':{'x':0,'y':0},'branch':'proper-ccw'},'full-ccw':{'a':{'x':5,'y':0},'b':{'x':5,'y':0},'c':{'x':0,'y':0},'branch':'full-ccw'}}
OPS=['ruler-create','promote','driver-edit','reopened-driver-edit','driver-remove','demote','ruler-remove']
TRAVEL=['ruler-create-undo','ruler-create-redo','promote-undo','promote-redo','driver-edit-undo','driver-edit-redo','reopened-edit-undo','reopened-edit-redo','driver-remove-undo','driver-remove-redo','driver-remove-restore','demote-undo','demote-redo','ruler-remove-undo','ruler-remove-redo']
LABELS=['source-original','reference-created','driving-edited','open-A','driver-restored','open-B','reference-removed','open-C']
def require(v,message):
 if not v:raise ValueError(message)
def one(v,label):require(len(v)==1,'one '+label);return v[0]
def near(a,b,t=5e-8):require(type(a) in(int,float) and math.isfinite(a) and abs(a-b)<=t,'numeric difference '+str((a,b,t)))
def sha(raw):return hashlib.sha256(raw).hexdigest()
def source(s,b):return json.loads(one([x for x in s['capture']['native']['sketches'] if x['id']==b['faceId']],'actual source')['source'])
def same_native(a,b):
 for k in['history','source','sketches','expressions','counters','presentation']:require(a['capture']['native'][k]==b['capture']['native'][k],'exact authored '+k)
 require(a['parameters']['definitions']==b['parameters']['definitions'] and a['manufacturing']==b['manufacturing'] and a['drawing']['definition']==b['drawing']['definition'],'exact physical/material/drawing intent')
def settled(s):
 r=s['ownership']['resources'];require(s['ownership']['processing'] is False and not r['cleanupFailed'] and r['owners']==r['detached'] and all(r[k]==0 for k in['accepted','candidates','mounts']) and not s['capture']['solids']['bodies'],'actual resources settled, no hidden solid')
def arc(d):
 require(set(d)=={'a','b','c','branch'},'native explicit branch fields');u=[Q(d['a'][k])-Q(d['c'][k]) for k in('x','y')];v=[Q(d['b'][k])-Q(d['c'][k]) for k in('x','y')];require(any(u) and any(v),'nonzero endpoint rays');cross=u[0]*v[1]-u[1]*v[0];dot=u[0]*v[0]+u[1]*v[1]
 radius=math.hypot(float(u[0]),float(u[1]));near(radius,math.hypot(float(v[0]),float(v[1])))
 if d['branch']=='full-ccw':require(d['a']==d['b'],'exact full seam');angle=2*math.pi
 else:
  require(d['branch']=='proper-ccw' and (cross!=0 or dot<0),'proper directed distinct rays');angle=math.atan2(float(cross),float(dot));angle=angle if angle>0 else angle+2*math.pi;require(0<angle<2*math.pi,'representable proper interval')
 return radius,angle,radius*angle

def points_from_initial(s,inspection):
 objects={o['id']:o for o in s['objects']};roles={}
 for p in inspection['points']:
  require(p['parentId'] in objects,'actual source parent');o=objects[p['parentId']];fields=[''] if o['type']=='Point' else ['a','b','c'] if o['type']=='Arc' else ['a','b'] if o['type']=='Segment' else []
  found=[k for k in fields if all(abs((o['data'] if k=='' else o['data'][k])[axis]-p[axis])<=5e-8 for axis in('x','y'))];require(found,'actual discovered source point');roles[p['id']]=(o['id'],found[0])
 return roles

def equations(s,roles):
 objects={o['id']:o for o in s['objects']};point=lambda id:(objects[roles[id][0]]['data'] if roles[id][1]=='' else objects[roles[id][0]]['data'][roles[id][1]])
 for stage in s['stages']:
  require(not stage['generators'],'ordinary non-generated fixture')
  for c in stage['constraints']:
   require(c['admission']['version']==1 and c['admission']['state'] in('accepted','redundant'),'admitted original row');t=c['typeId'];refs=c['objects'];k=c.get('constants',{})
   if t=='PCoincident':
    x,y=map(point,refs)
    for key in('x','y'):near(x[key],y[key])
   elif t=='LockPoint':
    x=point(one(refs,'lock point'))
    for key in('x','y'):near(x[key],float(k[key]))
   elif t in('Horizontal','Vertical','SegmentLength'):
    o=objects[one(refs,'segment')];require(o['type']=='Segment','segment target');x,y=o['data']['a'],o['data']['b']
    if t=='SegmentLength':near(math.dist(tuple(x.values()),tuple(y.values())),float(k['length']),1e-6)
    else:near(x['y' if t=='Horizontal' else 'x'],y['y' if t=='Horizontal' else 'x'])
   elif t in('SignedDistanceX','SignedDistanceY'):
    x,y=map(point,refs);key='x' if t=='SignedDistanceX' else 'y';near(y[key]-x[key],float(k['distance']),1e-6)
   elif t=='ArcLength':
    o=objects[one(refs,'ArcLength target')];require(o['type']=='Arc' and set(k)=={'length'},'actual typed length schema');target=float(k['length']);require(0<target<=1e6,'positive bounded driving length');near(arc(o['data'])[2],target,1e-6)
   elif t=='FixArc':
    o=objects[one(refs,'FixArc')];require(o['type']=='Arc','actual fixed Arc');d=o['data'];radius,sweep,_=arc(d)
    for field in('a','b','c'):
     for axis in('x','y'):near(d[field][axis],float(k[field+axis]))
    near(radius,float(k['radius']));near(sweep,float(k['sweep']),1e-8)
   else:raise ValueError('Unexpected original schema '+t)

def check_state(state,b,original,roles,measurement=None):
 settled(state);s=source(state,b);require(s['version']==3 and len(s['stages'])==1 and all(not v for v in s['boundary'].values()),'ordinary exact source domain');objects={o['id']:o for o in s['objects']};require(len(objects)==len(s['objects']),'unique source identities');old={o['id']:o for o in original['objects']};require(set(objects)==set(old),'no unintended object additions/loss')
 for id in b['rectangleIds']+[b['unrelatedId']]:require(objects[id]==old[id],'exact unrelated source')
 strip=lambda row:{k:v for k,v in row.items()if k!='admission'}
 for index,stage in enumerate(s['stages']):require([strip(c)for c in stage['constraints']if c['typeId']not in('ArcLength','FixArc')]==[strip(c)for c in original['stages'][index]['constraints']],'exact unchanged original constraints')
 require({k:v for k,v in s.items()if k not in('objects','stages','dimensions')}=={k:v for k,v in original.items()if k not in('objects','stages','dimensions')},'exact original source metadata/boundary/labels');o=objects[b['arcId']];require({k:v for k,v in o.items()if k!='data'}=={k:v for k,v in old[b['arcId']].items()if k!='data'},'actual Arc identity/role/stage');require(o['type']=='Arc' and o['data']['branch']==b['originalData']['branch'],'actual authored branch preserved');radius,sweep,length=arc(o['data']);near(o['data']['c']['x'],0);near(o['data']['c']['y'],0);equations(s,roles)
 rulers=[d for d in s['dimensions'] if d['type']=='ArcLengthDimension'];require(len(rulers)<=1 and len(rulers)==len(s['dimensions']),'only the unique native Arc ruler')
 for ruler in rulers:require(set(ruler)=={'id','type','data'} and set(ruler['data'])=={'arc','offset'} and ruler['data']['arc']==b['arcId'] and type(ruler['data']['offset']) in(int,float) and math.isfinite(ruler['data']['offset']),'native ruler owns actual Arc, no role/value persisted')
 drivers=[c for st in s['stages'] for c in st['constraints'] if c['typeId']=='ArcLength'];require(len(drivers)<=1,'one current driving equation')
 if measurement is not None:
  row=one([x for x in measurement['measurements'] if x['arcId']==b['arcId']],'actual measurement discovery');near(row['canonicalValue'],length,1e-6);require(row['role']==('driving' if drivers else 'reference') and row['measurementId']==(rulers[0]['id'] if rulers else None) and row['unit']=='millimeter' and row['reason'] is None,'role/value derived from actual source');require(row['canCreate']==(not rulers) and row['canConvert']==bool(rulers),'truthful ordinary capability')
 return {'radius':radius,'sweep':sweep,'length':length}

def run(directory):
 d=Path(directory);raw=(d/'receipt.json').read_bytes();r=json.loads(raw);require(r['status']=='PASS' and r['qualification']=='FINITE_ORDINARY_ARC_LENGTH_ONLY' and not r['gate1Qualified'],'terminal finite whole only');require(r['requiredOpen']==['C04_TYPED_MEASUREMENT_ROLE_MUTATION'],'typed role remains OPEN, no unsupported PASS');require(r['sourceSeeds'] is False and r['privateAuthoring'] is False and r['fakeReplies'] is False,'public authority');require(r['budgets']=={'coordinateMm':5e-8,'lengthMm':1e-6,'angleRadians':1e-8},'unchanged stated budgets');require(r['ownedContextsRetired'] and r['sharedBrowserDisconnectedOnly'] and not any(r.get(k) for k in['pendingMutation','pendingWrite','pendingOpen','retainedMutation','retainedWrite','retainedOpen','retainedOutcome']),'no unresolved outcome/context');require(r['sourcePins']==r['sourcePinsAfter'] and r['sourceCheckoutsBefore']==r['sourceCheckoutsAfter'],'unchanged source custody')
 roster=json.loads((Path(__file__).parent/'producer-roster.json').read_text());expected={(role,'test/arc-length-public-workflow/'+name if role=='acceptance' else name)for role,names in roster.items()for name in names};require(len(r['sourceSnapshots'])==len(expected) and {(s['role'],s['relative'])for s in r['sourceSnapshots']}==expected,'complete actual producer roster')
 for s in r['sourceSnapshots']:
  data=(d/s['snapshot']).read_bytes();require(sha(data)==s['sha256']==r['sourcePins'][s['role']+':'+s['relative']],'actual frozen source snapshot');require(hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==s['gitBlobOID'],'actual Git blob');require(s['commit']==r['acceptanceSource' if s['role']=='acceptance' else 'source' if s['role']=='core' else 'hostSource'],'role commit')
 commands=r['commands'];require([c['index']for c in commands]==list(range(len(commands))),'ordered public trace');require([b['name']for b in r['cases']]==CASES,'all three branches');results=[]
 for b in r['cases']:
  name=b['name'];obs=[x for x in r['observations'] if x['case']==name];labels=LABELS.copy()
  if name=='full-ccw':labels.insert(4,'fixed-full-arc')
  require([x['label']for x in obs]==labels,'complete observation progression');initial=obs[0];original=source(initial['before'],b);actual=one([o for o in original['objects']if o['id']==b['arcId']],'actual appended Arc');require(actual['data']==b['originalData']==FIXTURES[name],'original expected public geometry exact');require(len(original['objects'])==6 and len(b['rectangleIds'])==4,'only original four segments, Arc and unrelated Point');rects=[x for x in original['objects']if x['id']in b['rectangleIds']];require(all(x['type']=='Segment'for x in rects),'actual original rectangle');edges={(tuple(x['data']['a'][k]for k in('x','y')),tuple(x['data']['b'][k]for k in('x','y')))for x in rects};require(edges=={((100,100),(110,100)),((110,100),(110,110)),((110,110),(100,110)),((100,110),(100,100))},'known exact original rectangle');free=one([x for x in original['objects']if x['id']==b['unrelatedId']],'original unrelated Point');require(free['type']=='Point' and free['data']=={'x':7,'y':9},'known unrelated geometry');roles=points_from_initial(original,initial['inspection'])
  rectangle=one([c for c in commands if c['case']==name and c['command']=='create-rectangle-sketch'],'public rectangle creation');require(rectangle['result']['faceId']==b['faceId'] and rectangle['args']=={'revision':rectangle['args']['revision'],'unit':'millimeter','origin':[100,100],'width':10,'height':10,'depth':0},'actual principal source frame creation');append=one([c for c in commands if c['case']==name and c['command']=='append-sketch-primitive' and c['args']['kind']=='Arc' and c.get('result',{}).get('primitive',{}).get('id')==b['arcId']],'real Arc append');require(append['result']['primitive']['id']==b['arcId'] and append['args']['data']==b['originalData'],'actual public allocation/source binding')
  values=[]
  for o in obs:require(o['before']==o['after'],'inspection pure');values.append(check_state(o['before'],b,original,roles,o['measurements']))
  ops=[x for x in r['operations']if x['case']==name];wanted=OPS.copy()
  if name=='full-ccw':wanted.insert(3,'fix-full-arc')
  require([x['label']for x in ops]==wanted,'complete public operations')
  for op in ops:
   require(op['result']['changed'] and op['result']['authoredUndo'],'actual authoring result');check_state(op['before'],b,original,roles);check_state(op['after'],b,original,roles);submitted=[c for c in commands[op['commandStart']:op['commandEnd']]if c.get('result')==op['result']];require(len(submitted)==1 and submitted[0]['command']!='inspect','actual public operation result/trace')
   c=submitted[0];before_source=source(op['before'],b);after_source=source(op['after'],b);drivers=lambda src:[row for st in src['stages']for row in st['constraints']if row['typeId']=='ArcLength']
   if op['label'] in('driver-edit','reopened-driver-edit'):
    require(c['command']=='edit-closed-sketch-dimension','normal discovered driver edit');driver=one(drivers(after_source),'after driver');near(float(driver['constants']['length']),c['args']['value'],0);near(c['args']['value'],arc(one([x for x in before_source['objects']if x['id']==b['arcId']],'before Arc')['data'])[2]*(1.25 if op['label']=='driver-edit' else 1.1),1e-6)
   if op['label']=='promote':require(not drivers(before_source) and len(drivers(after_source))==1 and before_source['objects']==after_source['objects'] and before_source['dimensions']==after_source['dimensions'],'one original driver, unchanged geometry/ruler')
   if op['label'] in('driver-remove','demote'):require(len(drivers(before_source))==1 and not drivers(after_source) and before_source['objects']==after_source['objects'] and before_source['dimensions']==after_source['dimensions'],'remove exactly driving membership, keep geometry/ruler')
   if op['label']=='ruler-create':require(not before_source['dimensions'] and len(after_source['dimensions'])==1 and before_source['objects']==after_source['objects'] and before_source['stages']==after_source['stages'],'reference-only native ruler creation')
   if op['label']=='ruler-remove':require(len(before_source['dimensions'])==1 and not after_source['dimensions'] and before_source['objects']==after_source['objects'] and before_source['stages']==after_source['stages'],'remove only native ruler')
  travels=[x for x in r['travels']if x['case']==name];wanted=TRAVEL.copy()
  if name=='full-ccw':wanted.insert(6,'release-fix')
  require([x['label']for x in travels]==wanted,'both actual history directions')
  for t in travels:
   same_native(t['after'],t['expected']);check_state(t['after'],b,original,roles);c=one([c for c in commands[t['commandStart']:t['commandEnd']]if c['command']=='travel-authored-edit'],'real travel');require(c['args']['direction']==t['direction'] and c['result']==t['result'],'actual history request/result')
  refusals=[x for x in r['refusals']if x['case']==name];wanted=['stale-revision','driving-ruler-remove','zero-driving-length','negative-driving-length','collapsed-proper-interval','mismatched-full-seam']+(['contradictory-fixed-length']if name=='full-ccw' else []);require([x['label']for x in refusals]==wanted,'complete refusals')
  for f in refusals:
   require(f['before']==f['after'] and f['error'] and not f['error']['committed'] and not f['error']['possiblyCommitted'],'unchanged full refused state');check_state(f['after'],b,original,roles);c=commands[f['mutationSettlement']['commandIndex']];require(c['errorAcknowledged'] and c['error']==f['error'] and f['commandStart']<=c['index']<f['commandEnd'] and f['mutationSettlement']['kind']=='acknowledged-refusal-after-exact-state','actual acknowledged refusal settlement');require(f['error'].get('name')=='AbortError' if f['label']=='stale-revision' else f['error']['code']=={'driving-ruler-remove':'REFERENCE_MEASUREMENT_REQUIRED','zero-driving-length':'INVALID_VALUE','negative-driving-length':'INVALID_VALUE','collapsed-proper-interval':'INVALID_ARC_BRANCH','mismatched-full-seam':'INVALID_ARC_BRANCH','contradictory-fixed-length':'DIMENSION_REJECTED'}[f['label']],'precise domain rejection')
   if f['label']=='contradictory-fixed-length':
    before_source=source(f['before'],b);require(any(row['typeId']=='FixArc' and row['objects']==[b['arcId']]for st in before_source['stages']for row in st['constraints']),'actual same-Arc fixed geometry');require(c['command']=='edit-closed-sketch-dimension','actual contradictory driving edit');near(c['args']['value'],arc(one([x for x in before_source['objects']if x['id']==b['arcId']],'fixed Arc source')['data'])[2]*1.25,1e-6)
   if f['label']=='collapsed-proper-interval':require(c['command']=='append-sketch-primitive' and c['args']['data']=={'a':{'x':5,'y':0},'b':{'x':5,'y':0},'c':{'x':0,'y':0},'branch':'proper-ccw'},'actual collapsed proper input')
   if f['label']=='mismatched-full-seam':require(c['command']=='append-sketch-primitive' and c['args']['data']=={'a':{'x':5,'y':0},'b':{'x':0,'y':5},'c':{'x':0,'y':0},'branch':'full-ccw'},'actual mismatched full input')
  saved=[x for x in r['saves']if x['case']==name];opened=[x for x in r['reopens']if x['case']==name];require([x['label']for x in saved]==['A','B','C'] and [x['label']for x in opened]==['A','B','C'],'three real archive cycles')
  for s,o in zip(saved,opened):
   w=r['writes'][s['writeSequence']];require(w['phase']=='settled' and w['result']==s['result'] and w['case']==name and w['artifact']['sha256']==s['sha256']==s['localSha256'],'actual settled own write');c=commands[w['commandIndex']];require(c['command']=='save' and c['result']==s['result'] and c['windowId']==w['windowId'] and s['result']['committed'] and s['result']['persistence']=='browser','actual Save authority');a=archive.read_archive(d/s['savedFile']);require(a['sha256']==s['sha256'] and a['bytes']==s['bytes'],'actual stored artifact');n=s['before']['capture']['native'];m=a['envelope']['project']['model'];require(m['history']==n['history'] and m['counters']==n['counters'] and m['expressions']==n['expressions'] and a['rawSketches']=={x['id']:x['source']for x in n['sketches']} and a['envelope'].get('presentation')==n['presentation'],'exact archive authored intent');same_native(s['after'],s['before']);same_native(o['opened'],s['before']);require(o['path']==w['path'] and not o['opened']['capture']['journal']['canUndo'] and not o['opened']['capture']['journal']['canRedo'],'fresh actual Open/session');check_state(o['opened'],b,original,roles)
  results.append({'case':name,'observations':len(obs),'operations':len(ops),'travelDirections':len(travels),'nativeArchives':len(saved),'values':values})
 require(len(r['writes'])==len(r['saves'])==len(r['reopens'])==9,'no missing/extra submitted write cycle');return {'status':'PASS','scope':r['scope'],'qualification':'PASS_FINITE_ORDINARY_ARC_LENGTH_ONLY','gate1Qualified':False,'requiredOpen':r['requiredOpen'],'wholeReceiptSha256':sha(raw),'cases':results}
if __name__=='__main__':
 result=run(sys.argv[1]);
 with Path(sys.argv[2]).open('x') as output:output.write(json.dumps(result,indent=2)+'\n')
 print(json.dumps(result))
