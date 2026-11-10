#!/usr/bin/env python3
"""Independent AFTER-whole .cad/source/incidence/native-observation reader.
No production planner, solver, codec or geometry module is imported.
"""
import collections,copy,hashlib,importlib.util,json,math,re,subprocess,sys
from decimal import Decimal,localcontext
from fractions import Fraction as Q
from pathlib import Path
sys.dont_write_bytecode=True
HERE=Path(__file__).resolve().parent
SHA=lambda b:hashlib.sha256(b).hexdigest()
FINE=Q(1,20000000)
SHELL='sha256:57b74074e0a249b917ac68357fbd003c37d1ab61897206886b575088e6995858:60dc956b08e01f43d08a48035a384e478e63bb34fb55f21a152c8cd12e8b8947'
PI=Decimal('3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679')
def need(value,message):
 if not value:raise ValueError(message)
def one(rows,message):need(len(rows)==1,'exactly one '+message);return rows[0]
def rational(v):
 need(type(v)in(int,float)and math.isfinite(v),'actual finite represented number');return Q(v)
def near(a,b,budget,message):need(abs(rational(a)-(b if isinstance(b,Q)else Q(b)))<=budget,message)
def pairs(rows):
 value={}
 for k,v in rows:need(k not in value,'duplicate JSON field');value[k]=v
 return value
def load(file,limit=134217728):
 p=Path(file);need(p.is_file()and not p.is_symlink()and p.stat().st_size<=limit,'bounded original regular input');return json.loads(p.read_text(),object_pairs_hook=pairs,parse_constant=lambda _:(_ for _ in()).throw(ValueError('nonfinite JSON')))
def canonical(v):return json.dumps(v,sort_keys=True,ensure_ascii=False,separators=(',',':'))
def settled(s):
 r=s['ownership']['resources'];need(s['ownership']['processing']is False and not r['cleanupFailed']and not s['lifecycle']['cleanupFailed']and not s['lifecycle']['pipelineFailed'],'actual settled healthy pipeline');need(all(r[k]==0 for k in('candidates','accepted','mounts'))and r['owners']==r['detached'],'actual owner/candidate retirement');need(s['lifecycle']['pointer']==len(s['capture']['native']['history'])-1 and s['ownership']['counters']==s['capture']['native']['counters'],'full tip and identical counter observations')
def currentness(s):
 need(s['manufacturing']['revision']==s['drawing']['revision']==s['host']['revision']and s['drawing']['geometryRevision']==s['capture']['solids']['revision'],'same issued document/geometry aliases');need(s['physical']['revision']==s['frames']['revision']==s['capture']['journal']['revision']and s['capture']['journal']['revision'].endswith(':'+s['host']['revision']),'same actual journal/source aliases')
def refusal(q):
 s,t=q['before'],q['after'];need(q['error']['code']==q['expectedCode']and q['error']['name']=='Error'and not q['error']['committed']and not q['error']['possiblyCommitted'],'precise actual noncommitted refusal');settled(t)
 if not q['replayed']:need(s==t,'exact full preflight refusal state');return
 currentness(s);currentness(t);need(t['lifecycle']['epoch']==s['lifecycle']['epoch']+1 and t['host']['revision']!=s['host']['revision']and t['capture']['solids']['revision']!=s['capture']['solids']['revision'],'one actual failed candidate issuance');x=copy.deepcopy(s)
 for p in [('lifecycle','epoch'),('host','revision'),('capture','solids','revision'),('capture','journal','revision'),('manufacturing','revision'),('drawing','revision'),('drawing','geometryRevision'),('physical','revision'),('frames','revision')]:
  a,b=x,t
  for k in p[:-1]:a,b=a[k],b[k]
  a[p[-1]]=b[p[-1]]
 need(x==t,'all other original source/history/J/counters/owners remain exact')
def custody(directory,r):
 need(r['sourcePins']==r['sourcePinsAfter']and r['sourceSeeds']is False and r['privateAuthoring']is False and r['fakeReplies']is False,'immutable original source/no private authoring or fabricated replies');roster=load(HERE/'producer-roster.json',65536)
 need(r['sourceCheckoutsBefore']==r['sourceCheckoutsAfter']and set(r['sourceCheckoutsBefore'])=={'acceptance','core','desktop'},'all actual checkout identities before/after')
 roots=r['sourceCheckoutsBefore'];need(len({v['root']for v in roots.values()})==3,'separate actual compiled Core/Host/acceptance roots')
 for role,commit in [('acceptance',r['acceptanceSource']),('core',r['source']),('desktop',r['hostSource'])]:
  item=roots[role];need(set(item)=={'root','head','expectedCommit','status'}and item['head']==item['expectedCommit']==commit and item['status']==''and Path(item['root']).is_absolute(),'actual clean named checkout '+role)
 need(Path(roots['acceptance']['root']).resolve()==HERE.parents[1],'actual executing acceptance source root')
 names=['CONTRACT.md','README.md','desktop-driver.mjs','oracle.mjs','check.py','run-artifact-oracle.py','producer-roster.json'];expected={('acceptance','test/rectangle-arrangement-native-workflow/'+n)for n in names}|{(kind,p)for kind,paths in roster.items()for p in paths};need(len(r['sourceSnapshots'])==len(expected)and{(s['repository'],s['relative'])for s in r['sourceSnapshots']}==expected,'complete closed compiled Core/Host/acceptance/transitive source roster')
 for s in r['sourceSnapshots']:
  need(s['root']==roots[s['repository']]['root']and s['commit']=={'acceptance':r['acceptanceSource'],'core':r['source'],'desktop':r['hostSource']}[s['repository']]and re.fullmatch('[a-f0-9]{40}',s['commit']),'separate exact actual source commits');p=(directory/s['file']).resolve();need(p.is_relative_to(directory.resolve()),'own retained snapshot');raw=p.read_bytes();need(len(raw)==s['bytes']and SHA(raw)==s['sha256']==r['sourcePins'][s['repository']+':'+s['relative']],'unchanged retained source bytes');g=subprocess.run(['git','-C',s['root'],'show',s['commit']+':'+s['relative']],capture_output=True,check=True);oid=subprocess.run(['git','-C',s['root'],'rev-parse',s['commit']+':'+s['relative']],capture_output=True,text=True,check=True);need(g.stdout==raw and oid.stdout.strip()==s['gitBlobOID'],'actual frozen Git blob, not later mutable source')
 for n in names:
  s=one([s for s in r['sourceSnapshots']if s['repository']=='acceptance'and s['relative']=='test/rectangle-arrangement-native-workflow/'+n],'executed acceptance '+n);need(SHA((HERE/n).read_bytes())==s['sha256'],'use actual frozen after-whole reader source '+n)
 for relative in roster['acceptance']:
  s=one([s for s in r['sourceSnapshots']if s['repository']=='acceptance'and s['relative']==relative],'actual shared acceptance '+relative);need(SHA((HERE.parents[1]/relative).read_bytes())==s['sha256'],'shared fragment/oracle equals its executed frozen bytes')
 for row in r['rows']:
  if row['label']=='Actual served compiled Core Host Worker and Native pins':need({p['name']:p['sha256']for p in row['assets']}==r['pins']['files']and row['outer']['sha256']==r['pins']['outer']['sha256'],'all actual delivered runtime pins')
 need(r['pins']['source']==r['source']and r['pins']['desktop']==r['hostSource']and r['build']==SHELL,'compiled producer tuple distinct from acceptance and genuine finite Shell cohort')
 helper=HERE.parent/'native-cad-container/archive_oracle.py';snap=one([s for s in r['sourceSnapshots']if s['repository']=='core'and s['relative']=='test/native-cad-container/archive_oracle.py'],'independent archive helper');need(SHA(helper.read_bytes())==snap['sha256'],'archive reader matches actual pinned Core helper');spec=importlib.util.spec_from_file_location('rectangle_native_archive_reader',helper);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module

def source(row):
 b=row['binding'];s=json.loads(row['before']['capture']['native']['source'],object_pairs_hook=pairs);need(s['version']==3 and len(s['objects'])==9 and len(s['stages'])==1 and not s['stages'][0]['generators'],'only actual eight original Segments/Point, no generator or derived spans');objects={o['id']:o for o in s['objects']};need(len(objects)==9 and set(objects)==set(b['A']+b['B']+[b['point']['id']]),'complete exact original source-ID census');need(objects[b['point']['id']]==b['point']and s['metadata']['boundaryFrame']==b['frame'],'unrelated Point and original frame exact');curves=[]
 for ids,lo,hi in [(b['A'],[0,0],[row['aw'],10]),(b['B'],[row['bx'],0],[15,10])]:
  degree=collections.Counter();points=[]
  for identity in ids:
   o=objects[identity];need(o['type']=='Segment'and o['role']is None and o['stage']==0,'actual ordinary root Segment ownership');p,q=[tuple(rational(o['data'][end][k])for k in('x','y'))for end in('a','b')];need((p[0]==q[0])!=(p[1]==q[1]),'exact nonzero axis segment');degree[p]+=1;degree[q]+=1;points.extend((p,q));curves.append({'id':identity,'a':p,'b':q})
  need(len(ids)==4 and len(degree)==4 and set(degree.values())=={2},'one exact closed four-edge original rectangle')
  for axis in range(2):near(float(min(p[axis]for p in points)),lo[axis],Q(1,1000000000),'legacy strict source min');near(float(max(p[axis]for p in points)),hi[axis],Q(1,1000000000),'legacy strict source max')
 constraints=s['stages'][0]['constraints'];need(collections.Counter(c['typeId']for c in constraints)=={'PCoincident':4,'Horizontal':2,'Vertical':2,'LockPoint':1,'SegmentLength':2},'actual original eleven-row rectangle declaration');i=row['inspection'];pt={p['id']:p for p in i['points']};need(len(pt)==len(i['points']),'unique actual owned point IDs');need({p['parentId']for p in pt.values()}==set(objects),'every original object has actual inspected owned points')
 for identity,obj in objects.items():
  targets=[obj['data'][end]for end in('a','b')]if obj['type']=='Segment'else[obj['data']];actual=[p for p in pt.values()if p['parentId']==identity];need(len(targets)==len(actual),'complete actual owned cold endpoint census')
  for target in targets:
   found=[p for p in actual if all(abs(rational(p[k])-rational(target[k]))<=FINE for k in('x','y'))];p=one(found,'owned original endpoint within source budget');actual.remove(p)
 for c in constraints:
  need(c['admission']['state']in('accepted','redundant'),'retained original admission');kind=c['typeId'];ids=c['objects'];k=c.get('constants',{})
  if kind=='PCoincident':
   need(len(ids)==2 and all(x in pt and pt[x]['parentId']in b['A']for x in ids),'actual original owned endpoint junction');need(all(abs(rational(pt[ids[0]][v])-rational(pt[ids[1]][v]))<=FINE for v in('x','y')),'original coincident equations')
  elif kind=='LockPoint':
   need(len(ids)==1 and ids[0]in pt and pt[ids[0]]['parentId']in b['A']and set(k)=={'x','y'},'actual original anchor ownership');need(all(rational(float(k[v]))==0 and abs(rational(pt[ids[0]][v]))<=FINE for v in('x','y')),'original anchor constants/equations')
  else:
   need(len(ids)==1 and ids[0]in b['A'],'row references actual A root');o=objects[ids[0]];p,q=[tuple(rational(o['data'][end][v])for v in('x','y'))for end in('a','b')];d=[q[v]-p[v]for v in range(2)]
   if kind=='SegmentLength':
    need(set(k)=={'length'},'actual literal length, no named coercion');length=rational(float(k['length']));need(length>0 and abs(sum(v*v for v in d)-length*length)<=FINE*(2*length+FINE),'original physical length equation');need(length==rational(row['aw']if ids[0]==b['bottom']else 10),'only actual requested original width changes')
   else:
    need(set(k)=={'angle'},'actual fixed axis equation');angle=rational(float(k['angle']));need((kind=='Horizontal'and angle in(0,180)and d[1]==0 and(d[0]>0)==(angle==0))or(kind=='Vertical'and angle in(90,270)and d[0]==0 and(d[1]>0)==(angle==90)),'original signed Polar chart/axis intent')
 need({o['id']for o in i['objects']}==set(objects)and all(c['admission']['state']in('accepted','redundant')for c in i['constraints']),'actual independent cold inspection retains source and rows');return s,curves

def events(curves):
 values={p for c in curves for p in(c['a'],c['b'])}
 for c in curves:
  for d in curves:
   if(c['a'][0]==c['b'][0])!=(d['a'][0]==d['b'][0]):
    v,h=(c,d)if c['a'][0]==c['b'][0]else(d,c);p=(v['a'][0],h['a'][1])
    if on(p,c)and on(p,d):values.add(p)
 return {tuple(sorted(c['id']for c in curves if on(p,c))):p for p in values}
def on(p,c):return p[0]==c['a'][0]and min(c['a'][1],c['b'][1])<=p[1]<=max(c['a'][1],c['b'][1])if c['a'][0]==c['b'][0]else p[1]==c['a'][1]and min(c['a'][0],c['b'][0])<=p[0]<=max(c['a'][0],c['b'][0])
def span(ref,ev,curves):
 need(set(ref)=={'id','sourceSpan'}and re.fullmatch('source-span:1:[a-f0-9]{64}',ref['id']),'actual source span record');s=ref['sourceSpan'];need(set(s)=={'kind','owners','ends'}and s['kind']=='source-span'and len(s['ends'])==2,'closed source reference schema');ends=[]
 for e in s['ends']:need(set(e)=={'incidentCurveIds'}and tuple(e['incidentCurveIds'])in ev,'actual original source incidence event');ends.append(ev[tuple(e['incidentCurveIds'])])
 need(ends[0]!=ends[1]and(ends[0][0]==ends[1][0]or ends[0][1]==ends[1][1]),'actual positive axis span');owners=sorted(c['id']for c in curves if on(ends[0],c)and on(ends[1],c));need(s['owners']==owners,'all genuine collinear original owners survive');need(ref['id']=='source-span:1:'+SHA(('ACAD/source-span/1\n'+canonical(s)).encode()),'independently hashed incidence, not opaque-ID parsing');return ends

def discovery(row):
 proxy={'binding':row['binding'],'before':{'capture':row['capture']},'aw':row['aw'],'bx':row['bx'],'inspection':row['inspection']};s,curves=source(proxy);ev=events(curves);d=row['discovery'];analysis=d['sourceAnalysis'];need(set(analysis)=={'version','policy','sourceLoops','spans','sourceIntervals','cells'}and analysis['version']==2 and analysis['policy']=='v3-extrusion-axis-rectangle-arrangement-v1','actual complete arrangement analysis');need(sorted(analysis['sourceLoops'])==sorted([sorted(row['binding']['A']),sorted(row['binding']['B'])])and len(ev)==8 and len(analysis['spans'])==10 and len(d['regions'])==3,'whole source/event/span/cell census');refs={x['id']:x for x in analysis['spans']};need(len(refs)==10 and sum(len(x['sourceSpan']['owners'])==2 for x in refs.values())==2,'two actual shared horizontal spans, no discarded duplicates')
 for ref in refs.values():span(ref,ev,curves)
 labels={}
 for cell in d['regions']:
  descriptor=cell['descriptor'];need(cell['support']=='supported'and cell['reason']is None and descriptor['version']==2 and descriptor['kind']=='axis-rectangle-arrangement-cell'and descriptor['holeBoundaryRefs']==[],'all three ordinary finite cells eligible');coverage=descriptor['coveringSourceLoops'];A=sorted(row['binding']['A']);B=sorted(row['binding']['B']);need(all(x in(A,B)for x in coverage),'original coverage only');label='middle'if A in coverage and B in coverage else'left'if A in coverage else'right'if B in coverage else None;need(label is not None and len(coverage)==(2 if label=='middle'else 1)and len({canonical(x)for x in coverage})==len(coverage)and label not in labels,'one cell per exact source cover');lo=0 if label=='left'else row['bx']if label=='middle'else row['aw'];hi=row['bx']if label=='left'else row['aw']if label=='middle'else 15;expected={frozenset((tuple(map(Q,p)),tuple(map(Q,q))))for p,q in [([lo,0],[hi,0]),([hi,0],[hi,10]),([hi,10],[lo,10]),([lo,10],[lo,0])]};actual=[]
  for ref in descriptor['outerBoundaryRefs']:need(ref['id']in refs and ref==refs[ref['id']],'cell uses actual complete census span');actual.append(frozenset(span(ref,ev,curves)))
  need(len(actual)==4 and set(actual)==expected,'exact whole physical cell boundary from original equations');labels[label]=cell['regionId']
 need(set(labels)=={'left','middle','right'}and sorted(analysis['cells'])==sorted(labels.values()),'all cells retained under correct original source covers');need(len(analysis['sourceIntervals'])==8 and{r['curveId']for r in analysis['sourceIntervals']}==set(row['binding']['A']+row['binding']['B']),'every original source interval once')
 for interval in analysis['sourceIntervals']:need(sorted(interval['spanIds'])==sorted(x['id']for x in refs.values()if interval['curveId']in x['sourceSpan']['owners']),'complete source interval partition/all owners')
 return labels

def expected(row,model):
 opt=row['options'];label=model['label'];lo=Q(0)if label=='left'else rational(row['bx'])if label=='middle'else rational(row['aw']);hi=rational(row['bx'])if label=='left'else rational(row['aw'])if label=='middle'else Q(15)
 if opt.get('disjoint'):lo,hi=Q(0),rational(row['aw'])
 depth=rational(opt['depth']);bottom=Q(5)if opt.get('child')else Q(0);radius=rational(opt.get('fillet',0));volume=(hi-lo)*(10-bottom)*depth
 if radius:volume-=Q(Decimal(depth.numerator)/Decimal(depth.denominator)*Decimal(radius.numerator)**2/Decimal(radius.denominator)**2*(1-PI/4))
 return {'min':(lo,bottom,Q(0)),'max':(hi,Q(10),depth),'volume':volume,'radius':radius}
def classify(p,t):
 p=tuple(map(rational,p));lo=t['min'];hi=t['max'];need(len(p)==3,'actual 3D point')
 if any(p[i]<lo[i]or p[i]>hi[i]for i in range(3)):return'outside'
 radius=t['radius'];on_round=False
 if radius and p[0]<lo[0]+radius and p[1]<lo[1]+radius:
  radial=(p[0]-lo[0]-radius)**2+(p[1]-lo[1]-radius)**2
  if radial>radius**2:return'outside'
  on_round=radial==radius**2
 return'boundary'if on_round or any(p[i]in(lo[i],hi[i])for i in range(3))else'inside'
def observation(row,r):
 need(row['before']==row['after'],'all actual read observations preserve FULL accepted state');settled(row['before']);s,curves=source(row);state=row['before'];b=row['binding'];bodies=state['capture']['solids']['bodies'];need(len(bodies)==len(row['models'])==len(state['capture']['solids']['outputs']),'exact current result inventory');truth={}
 for model in row['models']:
  body=one([x for x in bodies if x['id']==model['outputId']],'actual model');need(body['featureId']==model['featureId'],'actual feature output binding');m=body['metrics'];t=expected(row,model);truth[body['id']]=t;need(m['resultKind']=='single-solid'and m['solidCount']==1 and m['nativeValidity']['valid']is True and'sha256:'+m['runtime']['jsSha256']+':'+m['runtime']['wasmSha256']==r['build'],'real exact-pair Native result');near(m['nativeVolume'],t['volume'],Q(1,1000000),'independent source volume')
  for key in('min','max'):
   for x,y in zip(m['nativeBounds'][key],t[key]):near(x,y,Q(1,1000000),'independent Native bounds, separate from source accuracy')
  counts=m['nativeTopology']['counts'];need((counts['faces'],counts['edges'],counts['vertices'])==((7,15,10)if t['radius']else(6,12,8)),'finite actual topology census');history=state['capture']['native']['history'];origin=model.get('originFeatureId',model['featureId']);entry=one([x for x in history if x['type']=='WORKER_SELECTED_PROFILE_EXTRUDE_V2'and x['params']['featureId']==origin],'original source profile');p=entry['params'];need(set(p)=={'version','unit','engine','engineRevision','featureId','faceId','regionId','depth','bodyPolicy'}and p['version']==1 and p['unit']=='millimeter'and p['engine']=='occ'and p['faceId']==b['faceId']and p['depth']==row['options']['depth']and p['bodyPolicy']=='separate'and p['engineRevision']==r['build'],'exact original nine-field source intent, no persisted split geometry');producer=body['producer'];need(0<=producer['index']<len(history)and producer=={'index':producer['index'],'featureId':body['featureId'],'operationType':history[producer['index']]['type']}and history[producer['index']]['params']['featureId']==body['featureId'],'actual public producer versus retained original history')
  selection=body['selections'];need(selection['status']=='available'and selection['plan']['version']==2,'actual common source-span selection');context=one([x for x in selection['plan']['sourceContexts']if x['featureId']==origin],'original selection source context');need(context['kind']=='sketch-profile'and context['regionId']==p['regionId'],'actual original region/source ancestry')
  if not row['options'].get('disjoint'):
   named=[x for x in selection['plan']['edges']+selection['plan']['faces']if'boundaryRef'in x or'incidentBoundaryRefs'in x];need(named,'source-span descriptors retained')
   for x in named:need('curveId'not in x and'incidentCurveIds'not in x and x['originFeatureId']==origin,'derived span never mislabeled whole original curve')
   if not row['options'].get('child'):
    ev=events(curves)
    for x in named:
     for ref in([x['boundaryRef']]if'boundaryRef'in x else x['incidentBoundaryRefs']):span(ref,ev,curves)
 for q in row['queries']:
  i,result=q['input'],q['result'];need(i['revision']==state['capture']['solids']['revision']and i['engineRevision']==r['build']and i['bodyId']in truth,'actual original body/geometry request');need(result['quality']=='native-re-evaluation-observation'and all(result[k]==i[k]for k in('revision','bodyId','featureId','engineRevision')),'actual Native point replay');need(result['points']==[{'point':p,'classification':classify(p,truth[i['bodyId']])}for p in i['points']],'independent material/void/boundary classification')
 return {'case':row['case'],'label':row['label'],'bodies':len(truth),'nativePoints':sum(len(q['input']['points'])for q in row['queries'])}

def selection(capture):
 values=[]
 for body in capture['solids']['bodies']:
  s=copy.deepcopy(body['selections'])
  if s.get('plan'):
   for key in('edges','faces'):s['plan'][key].sort(key=lambda x:x['id'])
   if'sourceContexts'in s['plan']:s['plan']['sourceContexts'].sort(key=canonical)
  values.append({'id':body['id'],'featureId':body['featureId'],'producer':body['producer'],'selections':s})
 return sorted(values,key=lambda x:x['id'])
def main(directory):
 directory=Path(directory);r=load(directory/'receipt.json');need(r['status']=='PASS'and r['ownedContextsRetired']is True and r['sharedBrowserDisconnectedOnly']is True and not r.get('pendingWrite')and not r.get('pendingOpen')and not r.get('uncertainMutation'),'terminal complete whole and known durable settlement before oracle');archive=custody(directory,r);need(all(not c.get('error',{}).get('committed')and not c.get('error',{}).get('possiblyCommitted')for c in r['commands']),'no unresolved committed command errors on complete PASS');reports=[observation(row,r)for row in r['observations']];need(len(reports)>=35,'complete ordinary source/creation/repair/child travel and Open observations');labels={x['label']for x in r['observations']};need({'Three separate real100mm3 cell bodies','Source B edit preserves A and all cell identities120/80/100','Reversed B traversal preserves source-span identities and geometry','Creation/source Redo restores original feature IDs','Fresh Open A width11 gives120/100/80','Atomic overlap-cell to disjoint-A repair retains unchanged Boolean child40','Reopened width3 full source follows same repaired child30','Real source-span edge fillet retains genuine Native ancestry','Treated depth Undo','Treated depth Redo'}<=labels,'all retained meaningful original and new reopen phases');need(len(r['discoveries'])>=8,'complete current discovery observations')
 by_case={}
 for row in r['discoveries']:
  ids=discovery(row)
  if row['case']in by_case:need(ids==by_case[row['case']],'stable exact semantic cell IDs across ordinary compatible changes')
  else:by_case[row['case']]=ids
 originals={}
 for row in r['observations']:
  value=json.loads(row['before']['capture']['native']['source']);intent=copy.deepcopy(value)
  for obj in intent['objects']:
   if obj['type']=='Segment':obj['data']={}
  for stage in intent['stages']:
   for constraint in stage['constraints']:
    if constraint['typeId']=='SegmentLength'and constraint['objects']==[row['binding']['bottom']]:constraint['constants']['length']='<only requested width>'
  if row['case']not in originals:originals[row['case']]=intent
  need(intent==originals[row['case']],'all untouched original equations/stages/roles/metadata/Point exact across ordinary edits/travel/Open')
 need(len(r['noops'])==1 and r['noops'][0]['before']==r['noops'][0]['after']and r['noops'][0]['result']['changed']is False,'genuine equal width no-op preserves full state/redo/currentness')
 for q in r['refusals']:refusal(q)
 need(collections.Counter(q['expectedCode']for q in r['refusals'])=={'STALE_REGION':2,'STALE_HISTORY':1,'STALE_PROPOSAL':1,'UNRESOLVED_SELECTION':2,'UNSUPPORTED_REGION_TOPOLOGY':2,'SELF_INTERSECTION':1,'OPEN_OR_AMBIGUOUS_PROFILE':1},'all ordinary precise refusal layers retained')
 for t in r['travels']:need(t['before']['capture']['native']['counters']==t['after']['capture']['native']['counters'],'all genuine mixed travel preserves highwater')
 expected_mutation_refusals=[q for q in r['refusals']if q['command']!='inspect-selected-regions']+[dict(q,command='edit-selected-profile-region',expectedCode='UNSUPPORTED_REGION',replayed=False)for q in r['perCellResolution']['refusals']]
 need(len(r['mutationOutcomes'])==len(expected_mutation_refusals)==8,'every actual failed mutation is settled by real refusal proof')
 seen=set()
 for outcome in r['mutationOutcomes']:
  need(outcome['phase']=='settled-refusal'and outcome['commandIndex']not in seen,'no unknown/duplicate mutation outcome');seen.add(outcome['commandIndex']);command=r['commands'][outcome['commandIndex']]
  need(command['command']==outcome['command']and command['args']==outcome['args']and command['error']==outcome['error']and command['commitEvidence']==outcome['commitEvidence'],'raw actual mutation error and flag-presence binding')
  ack=outcome['acknowledgedError'];need(type(ack)is dict and set(ack)=={'name','message','code','committed','possiblyCommitted','work'} and ack==command['acknowledgedError'],'actual acknowledged own-data signed-harness error envelope');need(type(ack['name'])is str and type(ack['message'])is str and (ack['code']is None or type(ack['code'])is str) and type(ack['committed'])is bool and type(ack['possiblyCommitted'])is bool and (ack['work']is None or type(ack['work'])is dict),'closed actual harness acknowledgment fields');need(all(ack[k]==command['error'][k]for k in('name','code','message','committed','possiblyCommitted')),'acknowledged error matches actual raw diagnostic trace; retained cause remains separately bound')
  proof=one([q for q in expected_mutation_refusals if q['command']==outcome['command']and q['args']==outcome['args']],'actual expected failed mutation');need(outcome['proof']==proof,'full actual before/after refusal proof, not false flags');refusal(proof)
 for q in r['filletQueries']:
  need(q['before']==q['after'],'real treated reads preserve source/J/owners');proxy={'options':q['options'],'aw':10,'bx':5};t=expected(proxy,{'label':'middle'});need(q['input']['points']==[[5.05,.05,1],[5.6,.6,1],[9.95,.05,1],[5.5,0,1]]and q['result']['points']==[{'point':p,'classification':classify(p,t)}for p in q['input']['points']],'actual rounded-corner material, not only untrimmed box/metrics')
 ordinary=[('three-cells','three-edited'),('three-cells','three-reedited'),('repair-child','repair-edited'),('repair-child','repair-reedited'),('incompatible-child','incompatible-preserved'),('incompatible-child','incompatible-reedited')];need([(s['case'],s['label'])for s in r['saves']if s['case']!='per-cell-resolution']==ordinary,'all six current ordinary .cad cycles');need(len(r['saves'])==len(r['reopens'])==len(r['writes'])==len(r['opens'])==9,'six ordinary plus three real per-cell native cycles, every write settled');archives=[]
 actors={c['name']:{'username':c['username'],'windowId':c['windowId']}for c in r['cases']}
 for saved,opened in zip(r['saves'],r['reopens']):
  o=r['opens'][opened['openSequence']];need(o['sequence']==opened['openSequence']and o['phase']=='settled'and 'error'not in o and o['case']==saved['case']and o['label']==saved['label']and o['file']==saved['file']and o['opened']==opened['opened']and o['result']['status']=='opened','actual separately submitted acknowledged and settled freshOpen')
  need(o['windowIdAfter']==opened['windowId']and o['username']==opened['username'],'actual new owned Open actor')
  need(saved['writeSequence']==opened['writeSequence']and saved['label']==opened['label'],'same actual save/Open issuance');w=r['writes'][saved['writeSequence']];need(w['phase']=='settled'and'error'not in w and w['readback']['sha256']==saved['sha256']and w['readback']['savedFile']==saved['savedFile'],'normal submitted/acknowledged/server-settled write');need(type(w['windowId'])is str and w['windowId']and type(w['username'])is str and w['username'],'actual postlaunch own actor')
  need(o['windowIdBefore']==w['windowId'],'actual old owned window before freshOpen');need(saved['case']in actors and w['username']==actors[saved['case']]['username']and w['windowId']==actors[saved['case']]['windowId'],'chronological actual own actor, including each fresh registered context');need(opened['username']==w['username']and type(opened['windowId'])is str and opened['windowId'],'actual public fresh context window');actors[saved['case']]={'username':opened['username'],'windowId':opened['windowId']}
  need(saved['issued']['revision']==saved['before']['host']['revision']and saved['result']==w['result']and saved['result']['path']==saved['file']and saved['result']['committed']is True and saved['result']['persistence']=='browser','actual issued normal Save and result, not inferred committed state')
  info=archive.read_archive(directory/saved['savedFile']);need(info['sha256']==saved['sha256']and info['bytes']==saved['bytes'],'complete .cad ZIP/manifest/content byte integrity');need(saved['result']['nativeArchive']['designRevision']==info['manifest']['designRevision']and saved['result']['nativeArchive']['outerBytes']==info['bytes'],'actual codec receipt equals independently read authored root/outer bytes');native=saved['before']['capture']['native'];model=info['envelope']['project']['model'];need(model['history']==native['history']and model['expressions']==native['expressions']and model['counters']==native['counters'],'actual original model/history/counters exact in native archive');need(info['rawSketches']=={s['id']:s['source']for s in native['sketches']},'all original source bytes, not normalized reconstruction');need(info['envelope'].get('presentation')==native['presentation']and info['envelope'].get('manufacturing')==saved['before']['manufacturing']['metadata'],'all real presentation/material metadata');need(saved['before']['capture']==saved['after']['capture'],'Save itself publishes no geometry/J')
  a,b=copy.deepcopy(native),copy.deepcopy(opened['opened']['capture']['native']);a.pop('materialRevision',None);b.pop('materialRevision',None);need(a==b and selection(saved['before']['capture'])==selection(opened['opened']['capture']),'fresh context exact authoritative source/history/highwater and regenerated source selections');need(not opened['opened']['capture']['journal']['canUndo']and not opened['opened']['capture']['journal']['canRedo'],'fresh Open does not fabricate prior session J');archives.append({'file':saved['savedFile'],'sha256':info['sha256'],'designRevision':info['manifest']['designRevision']})
 # The separately reviewed shared exact source/census oracle owns the tiny-
 # span family; it is called only here after the COMPLETE whole succeeds.
 fragment=HERE.parent/'rectangle-arrangement-resolution/resolution_oracle.py';spec=importlib.util.spec_from_file_location('rectangle_per_cell_resolution_reader',fragment);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
 resolution=module.check_resolution(r['perCellResolution'],directory)
 need(type(resolution)is dict and resolution.get('status')=='PASS','complete independently checked per-cell family')
 return {'status':'PASS','scope':'finite current rectangle arrangement public .cad archive/source-span Native lifecycle, not general topology/kernel accuracy or STEP/mesh qualification','observations':reports,'archives':archives,'perCellResolution':resolution,'sourceCoordinateBudgetMm':'5e-8','nativeVolumeBudgetMm3':'1e-6','nativeBoundsBudgetMm':'1e-6','limitations':['Native 1e-4mm cell eligibility unchanged','tiny middle Native body not constructed','extreme UNREPRESENTABLE_AREA remains explicit boundary','historical callback/cancel test not rerun','STEP and mesh consumers not newly qualified by this archive packet']}
if __name__=='__main__':
 need(len(sys.argv)==3,'WHOLE NEW_FIRST_REPORT');output=Path(sys.argv[2]);need(not output.exists(),'preserve FIRST independent result')
 try:
  with localcontext()as ctx:ctx.prec=100;result=main(sys.argv[1])
 except Exception as e:
  result={'status':'ORACLE_REFUSED','error':str(e),'geometryJudgment':'no certification; original whole/FIRST remain unchanged'}
  with output.open('x')as stream:json.dump(result,stream,indent=2);stream.write('\n')
  raise
 with output.open('x')as stream:json.dump(result,stream,indent=2);stream.write('\n')
 print(json.dumps(result))
