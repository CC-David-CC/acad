#!/usr/bin/env python3
"""FIRST independent oracle AFTER terminal complete public whole PASS only.
Source equations/analytic cells, exact archives and actual XML/mesh/SVG/STEP.
No production geometry, codec, solver or ID grammar. No runtime calls.
"""
import copy,hashlib,io,json,math,os,subprocess,sys,zipfile
from collections import Counter
from decimal import Decimal,localcontext
from fractions import Fraction as Q
from pathlib import Path
from xml.etree import ElementTree as ET
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive
from mesh_oracle import inspect_mesh
from step_oracle import inspect_step
from negative_archive import inspect as inspect_negative
TYPE='WORKER_SELECTED_PROFILE_EXTENT_EXTRUDE_V1'
BUILD='sha256:32eec74e3019d9e2d767c9016f05aa3daa49441c6102423a269d67b9c7f02a08:abbf2aa02a6f2101c600aa1eedd20fa80ab2db206e677ca860d9c5103cdfbfcc'
PI=Decimal('3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651')
PREFIX='codi-physical-parameters:1\n'
FINE=5e-8
sha=lambda b:hashlib.sha256(b).hexdigest()
def need(v,m):
 if not v:raise ValueError(m)
def one(xs,m):need(len(xs)==1,'one '+m);return xs[0]
def near(a,b,t=FINE):need(type(a) in (int,float) and math.isfinite(a) and abs(a-float(b))<=t,f'{a} != {b} within declared {t}mm')
def interval(e):
 if e['extent']=='one-sided':return min(0,e['distance']),max(0,e['distance'])
 if e['extent']=='symmetric':return -e['length']/2,e['length']/2
 return -e['negative'],e['positive']
def fields(e):return ['distance'] if e['extent']=='one-sided' else ['length'] if e['extent']=='symmetric' else ['positive','negative']
def settled(s):
 q=s['ownership'];r=q['resources'];need(q['processing'] is False and not r['cleanupFailed'] and all(r[k]==0 for k in ('candidates','accepted','mounts')) and r['owners']==r['detached'],'actual owned resources retired');need(not s['lifecycle']['pipelineFailed'] and not s['lifecycle']['cleanupFailed'],'healthy pipeline/custody')
def geometry(e,frame):
 lo,hi=map(Q,interval(e));D=lambda x:Decimal(str(x))
 with localcontext() as c:
  c.prec=90
  area=D(e['width'])*D(e['height']) if e['kind']=='rectangle' else PI*(D(e['outer'])**2-D(e.get('inner',0))**2);volume=area*D(float(hi-lo))-sum((PI*D(h['radius'])**2*D(float(hi-lo) if h['depth'] is None else h['depth']) for h in e.get('holes',[])),Decimal(0))
 origin=frame['origin'];axes=[frame[k] for k in ('x','y','z')]
 need(all(sum(v*v for v in a)==1 and all(v in (-1,0,1) for v in a) for a in axes) and all(sum(a[k]*b[k] for k in range(3))==0 for i,a in enumerate(axes) for b in axes[:i]),'frozen actual orthonormal permutation frame')
 def world(p):return [float(Q(origin[i])+sum(Q(axes[j][i])*p[j] for j in range(3))) for i in range(3)]
 if e['kind']=='rectangle':
  pts=[world((Q(x),Q(y),z)) for x,y in ((0,0),(e['width'],0),(e['width'],e['height']),(0,e['height'])) for z in (lo,hi)];bounds={k:[(min if k=='min' else max)(p[i] for p in pts) for i in range(3)] for k in ('min','max')}
 else:
  radial=[e['outer']*math.hypot(frame['x'][i],frame['y'][i]) for i in range(3)];bounds={'min':[origin[i]-radial[i]+min(frame['z'][i]*float(lo),frame['z'][i]*float(hi)) for i in range(3)],'max':[origin[i]+radial[i]+max(frame['z'][i]*float(lo),frame['z'][i]*float(hi)) for i in range(3)]}
 return float(lo),float(hi),volume,bounds

def classify(world,e,f):
 p=[sum((Q(v)-Q(f['origin'][i]))*Q(f[key][i]) for i,v in enumerate(world)) for key in ('x','y','z')];x,y,z=p;lo,hi=map(Q,interval(e));boundary=False
 if z<lo or z>hi:return 'outside'
 if e['kind']=='rectangle':
  if not(0<=x<=Q(e['width']) and 0<=y<=Q(e['height'])):return 'outside'
  boundary=x in (0,Q(e['width'])) or y in (0,Q(e['height']))
 else:
  r=x*x+y*y;outer=Q(e['outer']);inner=Q(e.get('inner',0))
  if r>outer*outer or inner and r<inner*inner:return 'outside'
  boundary=r==outer*outer or bool(inner and r==inner*inner)
 for h in e.get('holes',[]):
  q=(x-Q(h['u']))**2+(y-Q(h['v']))**2;radius=Q(h['radius']);floor=lo if h['depth'] is None else hi-Q(h['depth'])
  if q<radius*radius and (z>=floor if h['depth'] is None else z>floor):return 'outside'
  boundary=boundary or q==radius*radius and floor<=z<=hi or h['depth'] is not None and q<radius*radius and z==floor
 return 'boundary' if boundary or z in (lo,hi) else 'inside'

def source_oracle(s,b,e,inspection):
 need(s['version']==3 and len(s['stages'])==1 and not s['stages'][0]['generators'],'genuine ordinary source, no private generator recipe');need(all(not x for x in s['boundary'].values()),'no invented imported boundary');objects={o['id']:o for o in s['objects']};need(len(objects)==len(s['objects']) and set(objects)==set(b['curveIds']),'exact discovered primitive identity set');frame=s['metadata']['boundaryFrame']
 if 'explicitFrame' in e:need(frame==e['explicitFrame'],'exact authored custom frame retained')
 else:near(sum(x*z for x,z in zip(frame['origin'],frame['z'])),e['sourceDepth'],1e-9)
 if e['kind']!='rectangle':
  need(len(objects)==(2 if e.get('inner') else 1) and all(o['type']=='Circle' and o['role'] is None and o['stage']==0 for o in objects.values()),'real ordinary circular source');radii=[]
  for o in objects.values():need(set(o['data'])=={'c','r'} and o['data']['c']=={'x':0,'y':0},'exact centered source circle');radii.append(o['data']['r'])
  need(sorted(radii)==sorted([e['outer']]+([e['inner']] if e.get('inner') else [])),'actual exact source radii, no tolerance masking');need(not s['stages'][0]['constraints'],'no fabricated circular constraints');return frame
 corners=[(0,0),(e['width'],0),(e['width'],e['height']),(0,e['height'])];counts=Counter();edges=set()
 for o in objects.values():
  need(o['type']=='Segment' and o['role'] is None and o['stage']==0,'actual ordinary source Segment');ends=[]
  for p in (o['data']['a'],o['data']['b']):q=one([q for q in corners if abs(q[0]-p['x'])<=FINE and abs(q[1]-p['y'])<=FINE],'independent physical source corner');counts[q]+=1;ends.append(q)
  edges.add(frozenset(ends))
 need(set(counts)==set(corners) and set(counts.values())=={2} and edges=={frozenset((corners[i],corners[(i+1)%4])) for i in range(4)},'complete true four-Segment source polygon')
 rows=s['stages'][0]['constraints']
 if 'explicitFrame' in e:need(rows==[],'actual appended custom rectangle has no fabricated dimension rows');return frame
 need(len(rows)==11 and Counter(c['typeId'] for c in rows)=={'PCoincident':4,'LockPoint':1,'Horizontal':2,'Vertical':2,'SegmentLength':2},'actual eleven registered rectangle rows')
 points={}
 for p in inspection['points']:
  need(p['parentId'] in objects,'inspection actual parent');o=objects[p['parentId']];q=one([q for q in o['data'].values() if abs(q['x']-p['x'])<=FINE and abs(q['y']-p['y'])<=FINE],'source/cold-inspection endpoint agreement within50pm, distinct observations');points[p['id']]=q
 for c in rows:
  need(c['admission']['state'] in ('accepted','redundant'),'actual source admission');refs=c['objects'];k=c.get('constants',{});kind=c['typeId']
  if kind=='PCoincident':
   a,bp=[points[x] for x in refs]
   for axis in ('x','y'):near(a[axis],bp[axis])
  elif kind=='LockPoint':
   p=points[one(refs,'locked point')]
   for axis in ('x','y'):near(p[axis],float(k[axis]))
  else:
   o=objects[one(refs,'constrained Segment')];a,bp=o['data']['a'],o['data']['b']
   if kind=='SegmentLength':near(math.dist((a['x'],a['y']),(bp['x'],bp['y'])),float(k['length']))
   else:near(a['y' if kind=='Horizontal' else 'x'],bp['y' if kind=='Horizontal' else 'x'])
 return frame

def inspect_observation(row,build):
 before,after=row['before'],row['after'];need(before==after,'Native and source reads preserve complete state');settled(before);e,b=row['expected'],row['binding'];s=json.loads(before['capture']['native']['source']);f=source_oracle(s,b,e,row['inspection']);lo,hi,volume,bounds=geometry(e,f);p=one([r['params'] for r in before['capture']['native']['history'] if r['type']==TYPE],'one authoritative extent');need(set(p)==set(['version','unit','engine','engineRevision','featureId','faceId','regionId','bodyPolicy','extent']+fields(e)),'exact variant raw source keys');need(p['featureId']==b['profile']['featureId'] and p['faceId']==b['faceId'] and p['regionId']==b['regionId'] and p['engineRevision']==build and p['extent']==e['extent'] and p['version']==1 and p['unit']=='millimeter' and p['engine']=='occ' and p['bodyPolicy']=='separate','actual constructor/source/build/variant')
 for field in fields(e):
  raw=e.get('raw') or {};need(p[field]==raw.get(field,e[field]),'exact raw active authored value/name')
  if field in raw:
   defs=before['physical']['definitions'];definition=one([d for d in defs if d['name']==raw[field]],'actual active raw name definition');need(definition['dimension']=='length' and definition['expression']=='mm('+str(e[field])+')','independent literal quantity definition');quantity=one([q for q in before['physical']['quantities'] if q['name']==raw[field]],'actual evaluated physical quantity');near(quantity['value'],e[field],1e-12)
 expression=before['capture']['native']['expressions']
 if e.get('raw'):need(expression.startswith(PREFIX) and json.loads(expression[len(PREFIX):])==before['physical']['definitions'],'real parameter document, not numeric substitution')
 if 'explicitFrame' not in e:plane=one([r['params'] for r in before['capture']['native']['history'] if r['type']=='PLANE'],'actual original principal plane');need(plane['depth']==e['sourceDepth'],'raw original source depth')
 history=before['capture']['native']['history'];need(all(row['type'] in {'PLANE','SOURCE_FRAME_V1',TYPE,'WORKER_THROUGH_HOLES_V1','WORKER_LINEAR_HOLE_PATTERN_V1','WORKER_CENTERED_BLIND_HOLE_V1'} for row in history),'one authored graph, no hidden Boolean/tool recipe');active=history[:before['lifecycle']['pointer']+1];holes=[row for row in active if row['type'] in ('WORKER_THROUGH_HOLES_V1','WORKER_LINEAR_HOLE_PATTERN_V1','WORKER_CENTERED_BLIND_HOLE_V1')]
 if e.get('holes'):
  expectedHoles=[]
  if b.get('blind'):
   raw=one([row['params'] for row in holes if row['type']=='WORKER_CENTERED_BLIND_HOLE_V1'],'actual blind row');need(raw['featureId']==b['blind']['featureId'] and raw['target']==b['profile']['outputId'] and raw['producerFeatureId']==raw['sourceFeatureId']==b['profile']['featureId'] and raw['sourceFaceId']==b['faceId'] and raw['sourceRegionId']==b['regionId'] and raw['entryFaceId']==b['blind']['entryFaceId'] and raw['kind']=='centered-blind-flat' and raw['diameter']==4 and raw['depth']==6 and raw['engineRevision']==build,'exact original blind source/upper-entry/dimensions/build');need(len(holes)==1,'no hidden blind recipe');expectedHoles=[{'u':e['width']/2,'v':e['height']/2,'radius':raw['diameter']/2,'depth':raw['depth']}]
  else:
   seed=one([row['params'] for row in holes if row['type']=='WORKER_THROUGH_HOLES_V1'],'actual through seed');need(seed['featureId']==b['through']['featureId'] and seed['target']==b['profile']['outputId'] and seed['producerFeatureId']==seed['sourceFeatureId']==b['profile']['featureId'] and seed['sourceFaceId']==b['faceId'] and seed['sourceRegionId']==b['regionId'] and seed['kind']=='centered-through' and seed['diameter']==4 and seed['engineRevision']==build,'actual centered-through original intent');count,spacing=1,0
   if b.get('pattern'):
    raw=one([row['params'] for row in holes if row['type']=='WORKER_LINEAR_HOLE_PATTERN_V1'],'actual pattern');need(raw['featureId']==b['pattern']['featureId'] and raw['target']==b['through']['outputId'] and raw['producerFeatureId']==raw['seedFeatureId']==b['through']['featureId'] and raw['count']==3 and raw['spacing']==10 and raw['axis']=='source-local-x-positive' and raw['engineRevision']==build,'actual seed-owned count/spacing/axis/target');count,spacing=raw['count'],raw['spacing']
   need(len(holes)==(2 if b.get('pattern') else 1),'only actual seed and optional pattern');expectedHoles=[{'u':e['width']/2+i*spacing,'v':e['height']/2,'radius':seed['diameter']/2,'depth':None} for i in range(count)]
  need(e['holes']==expectedHoles,'analytic holes derive actual original source and authored consumer intent')
 else:need(not holes,'no unobserved active consumer')
 body=one(before['capture']['solids']['bodies'],'actual observed output');target=b.get('current') or b['profile'];need((body['id'],body['featureId'])==(target['outputId'],target['featureId']),'actual successor identity');m=body['metrics'];need(m['resultKind']=='single-solid' and m['solidCount']==1 and m['nativeValidity']['valid'],'actual valid single Native body');need('sha256:'+m['runtime']['jsSha256']+':'+m['runtime']['wasmSha256']==build,'actual Native pair');near(m['nativeVolume'],volume,max(1e-6,float(abs(volume))*1e-9))
 for key in ('min','max'):
  for a,b in zip(m['nativeBounds'][key],bounds[key]):near(a,b,1e-6)
 query=row['query'];request=row['input'];need(query['quality']=='native-re-evaluation-observation','genuine Native observation')
 for key in ('revision','version','unit','engine','engineRevision','bodyId','featureId'):need(query[key]==request[key],'actual point response input binding')
 need(request['revision']==before['capture']['solids']['revision'] and request['bodyId']==body['id'] and request['featureId']==body['featureId'],'issued actual current body binding');need([p['point'] for p in query['points']]==request['points'],'actual queried point coordinates')
 expected=[classify(p,e,f) for p in request['points']];need(expected==[p['classification'] for p in query['points']],'independent exact represented source-domain point truth')
 return {'case':row['case'],'label':row['label'],'volume':str(volume),'lo':lo,'hi':hi,'frame':f,'bounds':bounds,'points':request['points'],'classes':expected}

def refusal(row):
 a,b=row['before'],row['after'];settled(a);settled(b);need(row['error'] and not row['error']['committed'] and not row['error']['possiblyCommitted'],'typed atomic refusal')
 if not row['candidate']:need(a==b,'all pre-candidate source/history/J/counters/resources/tokens exact');return
 need(b['lifecycle']['epoch']==a['lifecycle']['epoch']+1 and a['host']['revision']!=b['host']['revision'],'one actual rejected candidate token invalidation')
 for s in (a,b):
  need(s['manufacturing']['revision']==s['host']['revision']==s['drawing']['revision'] and s['drawing']['geometryRevision']==s['capture']['solids']['revision'],'fresh derived token family');need(s['capture']['journal']['revision'].endswith(':'+s['host']['revision']) and s['physical']['revision']==s['capture']['journal']['revision'],'actual J/physical token binding')
 def accepted(s):
  s=copy.deepcopy(s);s['lifecycle'].pop('epoch')
  for obj,key in ((s['host'],'revision'),(s['manufacturing'],'revision'),(s['drawing'],'revision'),(s['drawing'],'geometryRevision'),(s['capture']['solids'],'revision'),(s['capture']['journal'],'revision'),(s['physical'],'revision')):obj.pop(key)
  if isinstance(s['physical']['presentationRevision'],str):s['physical'].pop('presentationRevision')
  return s
 need(a['capture']['journal']['revision'][:-len(a['host']['revision'])]==b['capture']['journal']['revision'][:-len(b['host']['revision'])] and accepted(a)==accepted(b),'all accepted state exact, only actual documented invalidated token family')

def mesh(raw,e,b,build,encoding,truth):
 ns={'m':'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
 with zipfile.ZipFile(io.BytesIO(raw)) as z:need(z.testzip() is None,'independent3MF CRC');root=ET.fromstring(z.read('3D/3dmodel.model'))
 need(root.attrib['unit']=='millimeter','real3MF units');metadata=lambda key:one(root.findall('m:metadata[@name="'+key+'"]',ns),'actual metadata '+key).text;need(metadata('codi:SourceRevision')==encoding,'XML actual accepted encoding revision');provenance=json.loads(metadata('codi:ManufacturingBindings'));need(provenance['revision']==encoding,'same provenance source');part=one(provenance['parts'],'actual part');region=one(part['regions'],'actual region');target=b.get('current') or b['profile'];need(part['id']=='part' and region['id']=='main' and region['bodyId']==target['outputId'] and region['featureId']==target['featureId'] and region['engineRevision']==build and region['materialId']=='pla' and region['appearanceId']=='blue','full actual authored provenance/material/output association')
 resources=root.find('m:resources',ns);objects={x.attrib['id']:x for x in resources.findall('m:object',ns)};need(len(objects)==len(resources.findall('m:object',ns)),'unique actual resource identities');leaves=[];visited=set()
 def visit(identity):
  need(identity in objects and identity not in visited,'actual unique acyclic component');visited.add(identity);obj=objects[identity];m=obj.find('m:mesh',ns)
  if m is not None:leaves.append((identity,obj,m));return
  components=obj.find('m:components',ns);need(components is not None,'actual mesh or component')
  for c in components:need('transform' not in c.attrib or list(map(float,c.attrib['transform'].split()))==[1,0,0,0,1,0,0,0,1,0,0,0],'no hidden assembly placement');visit(c.attrib['objectid'])
 buildItems=list(root.find('m:build',ns));item=one(buildItems,'one printable object');need('transform' not in item.attrib or list(map(float,item.attrib['transform'].split()))==[1,0,0,0,1,0,0,0,1,0,0,0],'actual build placement');visit(item.attrib['objectid']);identity,obj,m=one(leaves,'actual printed mesh');need(identity==str(region['meshResourceId']) and obj.attrib['pid']==str(region['materialResourceId']) and obj.attrib['pindex']==str(region['materialIndex']),'writer-derived actual resource associations');material=resources.find('m:basematerials[@id="'+str(region['materialResourceId'])+'"]',ns);need(material is not None and 0<=region['materialIndex']<len(material) and material[region['materialIndex']].attrib['displaycolor'].upper()=='#3366FF','actual Blue material');need(item.attrib['objectid']==str(part['buildResourceId']) and str(region['componentResourceId']) in objects and one(list(objects[str(region['componentResourceId'])].find('m:components',ns)),'region component').attrib['objectid']==identity,'part/region resource reciprocity');v=[[float(x.attrib[k]) for k in ('x','y','z')] for x in m.find('m:vertices',ns)];t=[[int(x.attrib[k]) for k in ('v1','v2','v3')] for x in m.find('m:triangles',ns)];need(32+24*len(v)+12*len(t)<=8388608,'actual controlled binary budget');return inspect_mesh(v,t,e,truth['frame'],truth['lo'],truth['hi'],float(truth['volume']))

def svg(raw,e,definition):
 ns={'s':'http://www.w3.org/2000/svg'};root=ET.fromstring(raw);need(root.attrib['width']=='420mm' and root.attrib['height']=='297mm' and root.attrib['viewBox']=='0 0 420 297','actual physical sheet');meta=json.loads(root.find('s:metadata',ns).text);need(meta['drawingId']==definition['drawingId'] and meta['status']=='available' and meta['dimensionRole']=='reference','actual available reference dimensions');texts=[t.text or '' for t in root.findall('.//s:text',ns)];lo,hi=interval(e);need('ΔX '+format(e['width'],'.3f')+' mm' in texts and 'ΔY '+format(e['height'],'.3f')+' mm' in texts and 'ΔZ '+format(hi-lo,'.3f')+' mm' in texts,'actual original-source width/height and TRUE cap span, not source plane offset');need(root.findall('.//s:path',ns) and not any('UNRESOLVED' in t for t in texts),'actual available geometry paths');need(len(definition['dimensions'])==3 and definition['dimensions'][2]['first']['selectionId']!=definition['dimensions'][2]['second']['selectionId'],'distinct actual lower/upper cap source references');return meta

def check(directory,readerFile):
 directory=Path(directory);r=json.loads((directory/'receipt.json').read_text());need(r['status']=='PASS' and r['ownedContextsRetired'] and r['sharedBrowserDisconnectedOnly'] and not r['sourceSeeds'] and not r['fakeReplies'],'whole terminal complete public/source/context custody');need(r['sourcePins']==r['sourcePinsAfter'] and r['engineRevision']==BUILD,'immutable source and explicit approved cohort')
 names=['desktop-driver.mjs','example.mjs','check.py','mesh_oracle.py','negative_archive.py','step_oracle.py','run-reader.mjs','read-step.cpp','build-reader.sh','CONTRACT.md','README.md'];expected={('core','test/selected-profile-extents-workflow/'+name) for name in names}|{('core','test/native-cad-container/archive_oracle.py'),('desktop','test/agent-cad-corpus/sweep/signed-harness.mjs'),('desktop','test/agent-cad-corpus/strict-join/oracle.mjs')};need({(s['repository'],s['relative']) for s in r['sourceSnapshots']}==expected and len(r['sourceSnapshots'])==len(expected),'complete executed/helper/transitive source roster')
 for s in r['sourceSnapshots']:
  raw=(directory/s['file']).read_bytes();need(sha(raw)==s['sha256']==r['sourcePins'][s['repository']+':'+s['relative']],'actual immutable snapshot SHA');commit=r['acceptance'] if s['relative'].startswith('test/selected-profile-extents-workflow/') else r['source'] if s['repository']=='core' else r['hostSource'];need(s['commit']==commit,'separate driver/runtime source custody');gitRoot=os.environ.get('CODI_ORACLE_'+s['repository'].upper()+'_GIT',s['root']);blob=subprocess.run(['git','-C',gitRoot,'show',commit+':'+s['relative']],capture_output=True);need(blob.returncode==0 and blob.stdout==raw,'exact frozen Git object, not current path assumption');oid=subprocess.run(['git','-C',gitRoot,'rev-parse',commit+':'+s['relative']],capture_output=True,text=True);need(oid.returncode==0 and oid.stdout.strip()==s['gitBlobOID'],'actual Git blob identity')
 cases={c['name'] for c in r['cases']};need(cases=={'rectangle-main','circle-XZ','annulus-ZY','placed-rectangle','large-private-origin','literal-through-pattern','literal-blind'},'complete source/placement/consumer domain roster');need(len(r['allocations'])==4,'two actual through seeds, one pattern and one blind reservation');need(len(r['exportSets'])==6 and len(r['saves'])==len(r['reopens'])>=9 and len(r['malformed'])==3 and len(r['consumers'])==2,'complete artifacts/native cycles/negative/consumer phases')
 observed={o['label'] for o in r['observations']};required={'Same interval retains distinct two-sided authored intent','Same-geometry mode Undo restores exact one-sided source','Positive8 actual constructor','Negative8 shifts real material','Symmetric TOTAL10','Symmetric TOTAL12','Sides7/3','Equal-volume sides6/4 move caps','Zero positive side valid','Zero negative side valid','Actual source width12 replays same region','Original plane depth20 replays interval','Independent named sides9/5','Actual circle-XZ','Actual annulus-ZY','Actual placed-rectangle','Actual large-private-origin','Prefix retains actual interval constructor','Branch drops through suffix only','Through creation Undo retains extent','Actual extent three-hole pattern','Real blind floor14 in interval0..20','Blind interval6..16 floor10 retains material','Healthy blind continuation interval4..16','Original custom frame edit regenerates cap and attached source','Second two-sided native Open'};need(required<=observed,'every frozen substantive phase observed')
 observations=[inspect_observation(o,BUILD) for o in r['observations']]
 expectedRefusals={'Real other cohort cannot acquire extent capability':('UNSUPPORTED_PROFILE_EXTENT_BUILD',False),'Actual output identity cannot replace source plane':('UNSUPPORTED_FACE',False),'Actual source curve is not a region identity':('INVALID_REQUEST',False),'Signed zero':('INVALID_REQUEST',False),'Negative zero':('INVALID_REQUEST',False),'Nonpositive total':('INVALID_REQUEST',False),'Both zero':('INVALID_REQUEST',False),'Negative side':('INVALID_REQUEST',False),'Over span':('INVALID_REQUEST',False),'Inactive field':('INVALID_REQUEST',False),'Genuine stale authored revision':('STALE_HISTORY',False),'Named value cannot be erased':('UNSUPPORTED_PARAMETERS',False),'Named mode cannot be erased':('UNSUPPORTED_PARAMETERS',False),'Named signed zero':('NUMERIC_DOMAIN',False),'Named side negative':('NUMERIC_DOMAIN',False),'Wrong-dimensional active length':('DIMENSION_MISMATCH',False),'Unknown active name':('UNKNOWN_PARAMETER',False),'Actual extent collapse through blind floor':('BLIND_DEPTH_NOT_INTERIOR',True)};need(len(r['refusals'])==len(expectedRefusals),'exact finite refusal roster')
 for row in r['refusals']:need((row['error']['code'],row['candidate'])==expectedRefusals[row['label']],'precise code/candidate phase');refusal(row)
 for write in r['writes']:
  need(write['phase']=='settled' and write['readback']['sha256']==sha((directory/write['readback']['savedFile']).read_bytes()),'every submitted save/export/fixture acknowledged and exact server bytes');need('result' in write and 'error' not in write,'no unresolved write hidden by cleanup')
 archives=[]
 for saved,opened in zip(r['saves'],r['reopens']):
  need(saved['label']==opened['label'] and saved['case']==opened['case'],'actual paired Save/Open');file=directory/saved['savedFile'];info=read_archive(file);need(info['sha256']==saved['sha256'] and info['bytes']==saved['bytes'],'actual browser/server archive hash');native=saved['before']['capture']['native'];model=info['envelope']['project']['model'];need(model['history']==native['history'] and model['expressions']==native['expressions'] and model['counters']==native['counters'],'all authoritative history/parameters/highwater persisted');need(info['rawSketches']=={x['id']:x['source'] for x in native['sketches']},'exact ALL raw source bytes and source IDs');need(saved['before']['capture']==saved['after']['capture'],'save never changes accepted geometry or J');need(info['envelope'].get('presentation')==native['presentation'],'presentation source persisted')
  need(info['envelope'].get('manufacturing')==saved['before']['manufacturing']['metadata'],'exact actual material metadata or actual absence')
  definition=saved['before']['drawing']['definition'];need(info['envelope'].get('drawings')==([definition] if definition is not None else None),'exact persisted source/cap drawing or actual prior absence')
  for key in ('history','source','sketches','expressions','counters','presentation'):need(opened['opened']['capture']['native'][key]==native[key],'fresh native replay retains exact authored '+key)
  need(not opened['opened']['capture']['journal']['canUndo'] and not opened['opened']['capture']['journal']['canRedo'],'journal not invented from archive');archives.append({'file':saved['savedFile'],'designRevision':info['manifest']['designRevision'],'sha256':info['sha256']})
 base=one([x for x in r['saves'] if x['label']=='negative'],'actual negative saved base')
 for row in r['malformed']:need(row['before']==row['after'] and row['error']['code']=='INVALID_REQUEST' and not row['error']['committed'] and not row['error']['possiblyCommitted'],'malformed Open before-adoption exact retention');need(Path(row['path']).name==row['name']+'.cad','original negative basename');proof=inspect_negative(directory/base['savedFile'],directory/'malformed'/(row['name']+'.cad'),row['name']);need(proof==row['proof'] and proof['negativeSha256']==row['fixtureSHA256'],'negative-only exact-diff custody')
 for capset in r['caps']:
  need(capset['before']==capset['after'],'cap observation read-only');matches=[o for o in r['observations'] if o['case']==capset['case'] and o['before']==capset['before']];need(matches,'cap matches exact actual model observation');truth=inspect_observation(matches[-1],BUILD)
  for cap in capset['result']['parents']:
   role=cap['observation']['role'];need(role in ('lower-cap','upper-cap') and cap['parent']['framePolicy']=='profile-extent-cap-source-datum-v1','authentic new cap namespace/policy');level=truth['lo'] if role=='lower-cap' else truth['hi'];sign=-1 if role=='lower-cap' else 1
   for i in range(3):near(cap['observation']['frame']['origin'][i],truth['frame']['origin'][i]+truth['frame']['z'][i]*level,1e-7);near(cap['observation']['frame']['z'][i],sign*truth['frame']['z'][i],1e-12)
 for creation in r['creationTravel']:
  parents,created,undo,redo=[creation[k] for k in ('parents','created','undone','redone')];expected=copy.deepcopy(parents['capture']['native']['counters']);expected['featureId']+=1;need(created['capture']['native']['counters']==created['ownership']['counters']==expected and undo['capture']['native']['counters']==expected,'exact single creation allocation and monotonic Undo highwater');need(undo['capture']['native']['history']==parents['capture']['native']['history'] and undo['capture']['native']['sketches']==parents['capture']['native']['sketches'] and redo['capture']['native']==created['capture']['native'],'genuine creation travel source/identity')
 need(len(r['bores'])==2,'two actual source-interior through-slab observations')
 for row in r['bores']:
  need(row['before']==row['after'],'bore observation exact state');e,b=row['expected'],row['binding'];f=json.loads(row['before']['capture']['native']['source'])['metadata']['boundaryFrame'];lo,hi=interval(e);q=row['request'];need(q['revision']==row['before']['host']['revision'] and q['geometryRevision']==row['before']['capture']['solids']['revision'] and q['target']['featureId']==b['through']['featureId'] and q['datum']=={'featureId':b['profile']['featureId'],'faceId':b['faceId'],'regionId':b['regionId']},'actual issued current bore/datum binding');actual=one(row['result']['observation']['bores'],'actual Native cylinder');need(row['result']['status']==actual['status']==actual['through']['status']=='available' and actual['reference']['featureId']==b['through']['featureId'] and actual['reference']['sourceFeatureId']==b['profile']['featureId'] and actual['reference']['faceId']==b['faceId'] and actual['reference']['regionId']==b['regionId'] and actual['reference']['slot']=='center','genuine available bore lineage and THRU slab proof');near(actual['diameter'],4,1e-6)
  for i in range(3):
   center=f['origin'][i]+f['x'][i]*e['width']/2+f['y'][i]*e['height']/2;near(actual['center'][i],center,1e-6)
   for k,level in enumerate((lo,hi)):near(actual['ends'][k][i],center+f['z'][i]*level,1e-6)
 for row in r['allocations']:
  before,after=row['before'],row['after'];expected=copy.deepcopy(before['capture']['native']['counters']);expected['featureId']+=1;need(after['capture']['native']['counters']==after['ownership']['counters']==expected and after['capture']['native']['sketches']==before['capture']['native']['sketches'],'successful consumer reserves exactly one feature without changing source')
 for row in r['travels']:need(row['before']['capture']['native']['counters']==row['after']['capture']['native']['counters'],'all edit travel retains highwater')
 reader=json.loads(Path(readerFile).read_text());need(reader['status']=='PASS' and reader['wholeReceiptSHA256']==sha((directory/'receipt.json').read_bytes()) and reader['readerFiles']==reader['readerFilesAfter'],'FIRST separate-reader whole/artifact/custody');cpp=one([x for x in r['sourceSnapshots'] if x['relative'].endswith('/read-step.cpp')],'reader source');need(reader['readerSourceSHA256']==cpp['sha256']==reader['sourceManifest']['readerSourceSha256'],'compiled reader binds frozen source');need(len(reader['sourceManifest']['libraries'])==23,'reviewed same-OCCT23-archive SDK roster');artifacts=[]
 for item in r['artifacts']:
  raw=(directory/item['savedFile']).read_bytes();need(len(raw)==item['bytes'] and sha(raw)==item['sha256'],'actual exported artifact bytes');export=one([x for x in r['exportSets'] if x['label']==item['label'] and x['case']==item['case']],'actual export captured state');need(export['before']==export['after'],'all export state exact');before=export['before'];candidate=[(o,t) for o,t in zip(r['observations'],observations) if o['case']==item['case'] and o['expected']==item['expected'] and o['before']['capture']['native']==before['capture']['native']];need(candidate,'actual complete vector/source bound exported state');o,t=candidate[-1];kind=item['format']
  if kind=='3mf':need(item['issued']['revision']==before['host']['revision'],'actual public export doc revision');metadata=before['manufacturing']['metadata'];need(metadata['revision'].startswith('sha256-'),'actual canonical encoding revision');result=mesh(raw,item['expected'],item['binding'],BUILD,metadata['revision'][7:],t)
  elif kind=='step':
   actual=one([x for x in reader['artifacts'] if x['file']==item['savedFile'] and x['artifactSHA256']==item['sha256']],'actual STEP reader record');need(actual['exitCode']==0 and actual['observation']['readerSourceSha256']==cpp['sha256'],'actual matching reader');need(item['issued']['revision']==before['host']['revision'] and item['issued']['geometryRevision']==before['capture']['solids']['revision'],'real issued STEP currentness');result=inspect_step(actual['observation'],item['expected'],t['frame'],t['lo'],t['hi'],float(t['volume']),t['bounds'],t['points'],t['classes'])
  elif kind=='svg':result=svg(raw,item['expected'],one([x['definition'] for x in r['definitions'] if x['case']==item['case']],'actual source/cap definition'))
  else:raise ValueError('unknown actual artifact')
  artifacts.append({'file':item['savedFile'],'format':kind,'result':result})
 need(Counter(x['format'] for x in artifacts)=={'3mf':6,'step':6,'svg':2},'complete actual artifact roster, no missing consumers');return {'status':'PASS','scope':'finite C06 authored extents/source/caps/consumers/persistence/material/artifacts; no universal BRep/physics/UI qualification','sourceCoordinateBudgetMm':FINE,'sourceCoordinateBudgetPm':50,'observations':len(observations),'refusals':len(r['refusals']),'archives':archives,'artifacts':artifacts,'stepLimitation':'separate SAME-OCCT reader, not external kernel'}
if __name__=='__main__':
 need(len(sys.argv)==4,'WHOLE FIRST_READER_REPORT NEW_ORACLE_REPORT');output=Path(sys.argv[3]);need(not output.exists(),'preserve FIRST oracle report')
 try:result=check(sys.argv[1],sys.argv[2])
 except Exception as e:result={'status':'FAIL','error':str(e)};output.write_text(json.dumps(result,indent=2)+'\n');raise
 output.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
