#!/usr/bin/env python3
# Independent complete saved-source oracle, no imports of production math.
import argparse, hashlib, json, math, re
from fractions import Fraction
from pathlib import Path
F=lambda x:Fraction.from_float(x) if isinstance(x,float) else Fraction(x)
SIGMA=Fraction(1,2**43);KAPPA=Fraction(1,2**40);BUDGET=F(1e-9)
def need(v,m):
 if not v:raise AssertionError(m)
def one(rows,m):
 need(len(rows)==1,m);return rows[0]
def bare(c):return {k:v for k,v in c.items() if k!='admission'}
def number(raw,definitions):
 if isinstance(raw,str) and raw=='tiny':
  d=one([d for d in definitions if d['name']=='tiny'],'actual typed tiny definition');need(d['dimension']=='length','typed dimension');m=re.fullmatch(r'mm\(([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)\)',d['expression']);need(m is not None,'bounded actual mm literal expression');return F(float(m.group(1)))
 return F(float(raw)) if isinstance(raw,str) else F(raw)
def analyze(row):
 s,b,e=row['before'],row['binding'],row['expected'];a=json.loads(s['capture']['native']['source']);objects={o['id']:o for o in a['objects']};cs=a['stages'][0]['constraints'];need(a['version']==3 and len(a['stages'])==1 and a['stages'][0]['generators']==[],'actual ordinary source');need(a['metadata']['boundaryFrame']==b['frame'],'source frame');need([[o['id'],o['type'],o['role'],o['stage']]for o in a['objects']]==b['objects'],'source identity census');need(all(objects[o['id']]==o for o in b['baselineObjects']),'unrelated datum source exact');need(objects[b['unrelatedObject']]['data']=={'x':77,'y':99},'unrelated Point exact');need([bare(c)for c in cs[:len(b['baselineConstraints'])]]==b['baselineConstraints'],'retained source constraints');need(len(cs)==len(b['baselineConstraints'])+len(e['relations']),'complete constraint census');need(all(c['admission']['state'] in ('accepted','redundant')for c in cs),'actual admission rows');need(len(s['capture']['native']['history'])==1 and s['capture']['native']['history'][0]['type']=='PLANE','one actual PLANE only');need(s['capture']['solids']['bodies']==[],'no Native/BRep fabrication');need(not s['ownership']['processing'] and not s['ownership']['resources']['cleanupFailed'] and all(s['ownership']['resources'][k]==0 for k in ['accepted','candidates','mounts']),'settled resources')
 points={}
 for name,ref in b['points'].items():
  o=objects[ref['objectId']];p=o['data'][ref['endpoint']] if ref.get('endpoint') else o['data'];points[ref['id']]={k:F(p[k])for k in ['x','y']}
 need(s['physical']['definitions']==e['definitions'],'actual definitions');script=s['capture']['native']['expressions'];prefix='codi-physical-parameters:1\n';need((script.startswith(prefix)and json.loads(script[len(prefix):])==e['definitions'])if e['definitions']else script=='','native typed source')
 source_residuals=[];admission=[]
 for r in e['relations']:
  c=one([c for c in cs if c['typeId']==r['type']and c['objects']==r['ids']and c['constants']==r['constants']],'exact original source '+r['type']);
  if r.get('admission'):need(c['admission']['state']==r['admission'],'exact vs accepted-nonredundant distinction')
  if r['type']in ['SignedDistanceX','SignedDistanceY']:
   value=number(c['constants']['distance'],e['definitions']);need(value==F(r['resolved']),'actual resolved signed intent');axis='x'if r['type']=='SignedDistanceX'else'y';p,q=[points[k]for k in r['ids']];residual=q[axis]-p[axis]-value;need(abs(residual)<=F(1e-6),'unchanged final original mm residual');source_residuals.append({'type':r['type'],'ids':r['ids'],'residualMm':float(residual),'raw':c['constants']['distance'],'admission':c['admission']['state']})
  elif r['type']=='Horizontal':need(float(c['constants']['angle'])in (0,180),'actual horizontal branch')
  elif r['type']=='LengthRelation':need(F(float(c['constants']['factor']))==KAPPA and F(float(c['constants']['offset']))==0,'frozen genuine coefficient')
  else:need(False,'unknown oracle source relation')
 def point(name):return points[b['points'][name]['id']]
 expected_points={};error=Fraction(0)
 if row['case']=='tiny-offset-alias':
  rs=e['relations'];need(len(rs)==6 and [r['type']for r in rs]==['SignedDistanceX','SignedDistanceY','SignedDistanceX','SignedDistanceY','SignedDistanceX','SignedDistanceY'],'actual ordered alias contract');x=number(rs[2]['constants']['distance'],e['definitions']);cy=number(rs[5]['constants']['distance'],e['definitions']);need(x in (-SIGMA,0,SIGMA)and cy in (-SIGMA,SIGMA),'bounded genuine small offset values');expected_points={'A':{'x':F(0),'y':F(0)},'B':{'x':x,'y':-SIGMA},'C':{'x':x,'y':-SIGMA+cy}};need(e['exact'],'source bit expectation mode')
 elif row['case']=='deferred-original-constant':
  expected_points={'A':{'x':F(0),'y':F(0)},'B':{'x':F(0),'y':F(0)}};need(e['exact'],'constant locks exact');original=[r for r in source_residuals if r['ids']==[b['points']['A']['id'],b['points']['B']['id']]];need(len(original)in (1,2),'zero plus optional nonzero original relation');zero=one([r for r in original if F(float(r['raw']))==0],'real exact-zero row');need(zero['admission']=='redundant'and zero['residualMm']==0,'actual zero redundancy');
  if len(original)==2:
   nonzero=one([r for r in original if F(float(r['raw']))==SIGMA],'real nonzero source row');need(nonzero['admission']=='accepted'and F(nonzero['residualMm'])==-SIGMA,'measured nonzero residual is accepted not exact');admission.append(nonzero)
 elif row['case']=='small-coefficient-effect':
  need(not e['exact'],'achieved error budget separate from source-bit assertions');long_x=number(e['relations'][4]['constants']['distance'],e['definitions']);need(long_x in (500000,750000,1000000),'actual source edit values');need([r['type']for r in e['relations']]==['SignedDistanceX','SignedDistanceY']*3+['Horizontal','Horizontal','LengthRelation'],'complete genuine coefficient fixture');expected_points={'shorta':{'x':F(0),'y':F(30)},'shortb':{'x':KAPPA*long_x,'y':F(30)},'longa':{'x':F(0),'y':F(100)},'longb':{'x':long_x,'y':F(100)}};pa,pb=point('shorta'),point('shortb');la,lb=point('longa'),point('longb');length_a=math.hypot(float(pb['x']-pa['x']),float(pb['y']-pa['y']));length_b=math.hypot(float(lb['x']-la['x']),float(lb['y']-la['y']));achieved=abs(length_a-float(KAPPA*long_x));need(achieved<=1e-9,'independent actual 1pm length accuracy, NOT1nm residual budget');need(abs(length_a-float(KAPPA)*length_b)<=1e-6,'original LengthRelation final policy');error=max(error,F(achieved))
 else:need(False,'unknown complete case')
 need(set(e['points'])==set(expected_points),'independently derived expected point census')
 for name,p in expected_points.items():
  need({k:F(e['points'][name][k])for k in ['x','y']}==p,'driver expected geometry independently derived from source');actual=point(name)
  for axis in ['x','y']:
   delta=abs(actual[axis]-p[axis]);need(delta==0 if e['exact']else delta<=BUDGET,'exact source bits / frozen achieved1pm endpoint accuracy');error=max(error,delta)
 return {'case':row['case'],'label':row['label'],'maxCoordinateOrLengthErrorMm':float(error),'maxCoordinateOrLengthErrorNm':float(error)*1e6,'maxCoordinateOrLengthErrorPm':float(error)*1e9,'originalResiduals':source_residuals,'acceptedNonredundantOriginal':admission}
def main():
 ap=argparse.ArgumentParser();ap.add_argument('evidence',type=Path);args=ap.parse_args();r=json.loads((args.evidence/'receipt.json').read_text());need(r['status']=='PASS'and r['ownedContextsClosed']and r['sharedBrowserDisconnectedOnly'],'whole actual workflow/cleanup PASS');need(not r['sourceSeeds']and not r['privateAuthoring']and not r['fakeSuccessfulReplies'],'actual authoring boundary');need(r['sourcePins']==r['sourcePinsAfter'],'executing source stable');need([v for k,v in r['sourcePins'].items()if k.endswith('/small-polynomial-terms-workflow/check.py')]==[hashlib.sha256(Path(__file__).read_bytes()).hexdigest()],'actual independent checker pin');need(F(r['sigmaMm'])==SIGMA and F(r['kappa'])==KAPPA and r['geometryBudgetMm']==1e-9,'frozen values and1pm budget');need(set(r['bindings'])=={'tiny-offset-alias','small-coefficient-effect','deferred-original-constant'},'all complete cases')
 for case,b in r['bindings'].items():
  initial=one([x for x in r['rows']if x['case']==case and x['label']=='Genuine setup inspection'],'actual public source setup');public={p['id']:p for p in initial['inspection']['points']};need(all(public[p['id']]['parentId']==p['objectId']for p in b['points'].values()),'actual public point/parent identities, no opaqueID parsing');need(len(b['baselineObjects'])==4 and all(o['type']=='Segment'for o in b['baselineObjects']),'genuine public datum rectangle');need({(o['data'][k]['x'],o['data'][k]['y'])for o in b['baselineObjects']for k in ['a','b']}=={(0,0),(10,0),(10,10),(0,10)},'independent datum construction')
 observations=[];refusals=[]
 for row in r['rows']:
  if row.get('kind')=='state':observations.append(analyze(row))
  elif row.get('kind')=='refusal':
   need(not row['result']['ok']and not row['result']['error']['committed']and not row['result']['error']['possiblyCommitted']and row['before']==row['after'],'real refusal preserves exact accepted state');analyze(row);refusals.append({'case':row['case'],'label':row['label'],'error':row['result']['error']});
   if row['case']=='deferred-original-constant':need(row['result']['error']['cause']=={'kind':'original-residual-failure','basis':'original-equations'},'truthful original residual refusal cause')
  elif row['label']=='Exact runtime':need({a['name']:a['sha256']for a in row['assets']}==r['pins']['files']and row['outer']['sha256']==r['pins']['outer']['sha256'],'exact composed runtime')
 need(len(r['saved'])==6,'six genuine saved/reopened files');saved=[]
 for row in r['saved']:
  analyze(row);data=(args.evidence/row['savedFile']).read_bytes();need(len(data)==row['bytes']and hashlib.sha256(data).hexdigest()==row['sha256'],'actual browser/server/native bytes');n=json.loads(data);need(n['format']=='codi-jsketcher-project'and n['version']==2 and n['unit']=='millimeter','native envelope');b=row['before']['capture']['native'];need(n['project']['sketches']==[{'id':row['binding']['faceId'],'data':json.loads(b['source'])}],'exact saved actual authored source');need(all(n['project']['model'][k]==b[k]for k in ['history','counters','expressions']),'exact native intent/counters/formula provenance');saved.append({'file':row['savedFile'],'sha256':row['sha256'],'case':row['case']})
 need(any(x['acceptedNonredundantOriginal']for x in observations),'actual accepted-nonredundant original residual observed');print(json.dumps({'status':'PASS_SCOPED_SMALL_TERMS_COMPLETE_WORKFLOW','geometryBudgetMm':1e-9,'geometryBudgetNm':.001,'geometryBudgetPm':1,'observations':observations,'nativeFiles':saved,'refusals':refusals,'limits':['Exact tiny Point offsets are represented source checks, not nanoscale Native/BRep qualification.','Amplified coefficient achieved geometry budget1pm is separate from unchanged final1nm residual admission.','No universal convergence/underflow/high-power/public unknown-schema claim; no infeasibility assertion.']},indent=2))
if __name__=='__main__':main()
