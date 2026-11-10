#!/usr/bin/env python3
"""AFTER-WHOLE independent source/equations/Decimal/Fraction/ZIP/XML/STEP audit.
No production codec/validator/solver/geometry executor. make-bad creates only own
negative files during the complete workflow; never a positive authoring source.
"""
from pathlib import Path as _DimensionPath
import importlib.util as _dimension_import
_dimension_spec=_dimension_import.spec_from_file_location('drawing_dimension_oracle',_DimensionPath(__file__).resolve().parents[1]/'drawing-dimension-oracle.py')
_dimension_oracle=_dimension_import.module_from_spec(_dimension_spec);_dimension_spec.loader.exec_module(_dimension_oracle)

import binascii,hashlib,json,math,re,subprocess,sys,zipfile,zlib
from collections import Counter
from decimal import Decimal,localcontext
from fractions import Fraction
from pathlib import Path
from xml.etree import ElementTree as ET
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive,structure,rebuild,manifest_row,canonical,root_record
sys.path.insert(0,str(Path(__file__).resolve().parent))
from step_oracle import inspect_step
from mesh_oracle import inspect_finite_blind_mesh
from negative_archive import rewrite as rewrite_negative_archive,inspect as inspect_negative_archive
PI=Decimal('3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651')
sha=lambda b:hashlib.sha256(b).hexdigest()
KEYS={'version','unit','engine','engineRevision','featureId','target','producerFeatureId','sourceFeatureId','sourceFaceId','sourceRegionId','entryFaceId','kind','diameter','depth'}
PREFIX='codi-physical-parameters:1\n'
def need(v,msg):
 if not v:raise ValueError(msg)
def one(xs,label):need(len(xs)==1,'one '+label);return xs[0]
def near(x,y,t=5e-8):need(type(x) in (int,float) and math.isfinite(x) and abs(x-float(y))<=t,f'{x} differs from {y}, budget {t}')
def settled(s):
 r=s['ownership']['resources'];need(not s['ownership']['processing'] and not r['cleanupFailed'] and all(r[k]==0 for k in ('candidates','accepted','mounts')) and r['owners']==r['detached'],'retired actual Native resources');need(not s['lifecycle']['pipelineFailed'] and not s['lifecycle']['cleanupFailed'],'healthy candidate continuation')
def expected_volume(e):
 with localcontext() as c:c.prec=90;return Decimal(5000)*Decimal(str(e['thickness']))-PI*(Decimal(str(e['diameter']))/2)**2*Decimal(str(e['depth']))
def point_class(p,e):
 x,y,z=map(lambda v:Fraction(str(v)),p);t=Fraction(str(e['thickness']));d=Fraction(str(e['depth']));r=Fraction(str(e['diameter']))/2;f=t-d
 if not(0<=x<=100 and 0<=y<=50 and 0<=z<=t):return 'outside'
 q=(x-50)**2+(y-25)**2
 if r and q<r*r and z>f:return 'outside'
 if x in (0,100) or y in (0,50) or z==0:return 'boundary'
 if r and (q==r*r and f<=z<=t or q<=r*r and z==f):return 'boundary'
 if z==t:return 'boundary'
 return 'inside'
def rectangle(s,b,inspection):
 need(s['version']==3 and len(s['objects'])==4 and len(s['stages'])==1 and not s['stages'][0]['generators'] and len(s['stages'][0]['constraints'])==11,'genuine four-Segment/eleven-row source')
 need(all(not x for x in s['boundary'].values()),'no external source seed');need(s['metadata']['boundaryFrame']=={'origin':[0,0,0],'x':[1,0,0],'y':[0,1,0],'z':[0,0,1]},'actual source frame')
 objects={o['id']:o for o in s['objects']};need(set(objects)==set(b['sourceCurveIds']) and len(objects)==4,'actual discovered source curve IDs');corners=[(0,0),(100,0),(100,50),(0,50)];counts={p:0 for p in corners};edges=set()
 for o in objects.values():
  need(o['type']=='Segment' and o['role'] is None and o['stage']==0,'ordinary actual Segment');ends=[]
  for p in (o['data']['a'],o['data']['b']):
   q=one([q for q in corners if abs(q[0]-p['x'])<=5e-8 and abs(q[1]-p['y'])<=5e-8],'source coordinate budget');counts[q]+=1;ends.append(q)
  edges.add(frozenset(ends))
 need(all(n==2 for n in counts.values()) and edges=={frozenset([corners[i],corners[(i+1)%4]]) for i in range(4)},'actual complete rectangular boundary')
 points={}
 for p in inspection['points']:
  o=objects[p['parentId']];points[p['id']]=one([q for q in o['data'].values() if abs(q['x']-p['x'])<=5e-8 and abs(q['y']-p['y'])<=5e-8],'actual public endpoint/parent ownership')
 for c in s['stages'][0]['constraints']:
  need(c['admission']['state'] in ('accepted','redundant'),'actual solved admission');t=c['typeId'];refs=c['objects'];k=c.get('constants',{})
  if t=='PCoincident':
   a,bp=[points[i] for i in refs]
   for axis in ('x','y'):near(a[axis],bp[axis])
  elif t=='LockPoint':
   p=points[one(refs,'actual point lock')]
   for axis in ('x','y'):near(p[axis],float(k[axis]))
  elif t in ('Horizontal','Vertical','SegmentLength'):
   o=objects[one(refs,'actual constrained Segment')];a,bp=o['data']['a'],o['data']['b']
   if t=='SegmentLength':near(math.dist((a['x'],a['y']),(bp['x'],bp['y'])),float(k['length']))
   else:near(a['y' if t=='Horizontal' else 'x'],bp['y' if t=='Horizontal' else 'x'])
  else:raise ValueError('Unexpected source equation '+t)
 return s

def intents(state,b,e,bound,build):
 h=state['capture']['native']['history'];p=one([r['params'] for r in h if r['type']=='WORKER_SELECTED_PROFILE_EXTRUDE_V2'],'actual profile');need(p['featureId']==b['profile']['featureId'] and p['faceId']==b['faceId'] and p['regionId']==b['regionId'] and p['engineRevision']==build,'same actual constructor/source/build');need(p['depth']==('plate' if bound else e['thickness']),'raw thickness binding')
 rows=[r for r in h if r['type']=='WORKER_CENTERED_BLIND_HOLE_V1'];need(len(rows)==bool(e['diameter']),'no private tool/Boolean feature recipe')
 if rows:
  q=one(rows,'blind')['params'];need(set(q)==KEYS and q['version']==1 and q['unit']=='millimeter' and q['engine']=='occ' and q['engineRevision']==build and q['kind']=='centered-blind-flat','exact fourteen-field semantic intent')
  need(q['featureId']==b['blind']['featureId'] and q['target']==b['profile']['outputId'] and q['producerFeatureId']==q['sourceFeatureId']==b['profile']['featureId'] and q['sourceFaceId']==b['faceId'] and q['sourceRegionId']==b['regionId'] and q['entryFaceId']==b['blind']['entryFaceId'],'actual authentic parent/source/entry identity; no ID parsing')
  need(q['diameter']==('bore' if bound else e['diameter']) and q['depth']==('blind' if bound else e['depth']),'raw blind bindings retained')
 need(all(r['type'] in ('PLANE','WORKER_SELECTED_PROFILE_EXTRUDE_V2','WORKER_CENTERED_BLIND_HOLE_V1') for r in h),'one authored graph, no fake tool history')
 expression=state['capture']['native']['expressions']
 if bound:
  need(expression.startswith(PREFIX),'actual typed source');defs=json.loads(expression[len(PREFIX):]);need(defs==state['physical']['definitions'],'actual inspected/saved directed parameter state');need([d['name'] for d in defs]==['plate','bore','blind'],'exact finite named lengths')
  for d,value in zip(defs,[e['thickness'],e['diameter'],e['depth']]):need(d['dimension']=='length' and d['expression']==f'mm({value})','unchanged authoritative definition');row=one([r for r in state['physical']['quantities'] if r['name']==d['name']],'actual evaluated quantity');near(row['value'],value,1e-12)
 else:need(expression=='','literal source remains literal')

def check_refusal(row):
 before,after=row['before'],row['after'];need(row['error'] and not row['error']['committed'] and not row['error']['possiblyCommitted'],'actual typed refusal');settled(before);settled(after)
 if not row['candidate']:need(after==before,'pre-candidate full state exact');return
 for s in (before,after):
  need(s['drawing']['revision']==s['host']['revision']==s['manufacturing']['revision'],'actual document token links')
  raw=s['capture']['native']['expressions'];physical=s['physical'];need(physical['ready'] is True and physical['reason'] is None,'actual ready physical source')
  if raw=='':need(physical['presentationRevision'] is None and all(physical[k]==[] for k in ('definitions','quantities','configurations')) and physical['activeConfigurationId'] is None,'literal-empty source has no typed presentation; exact null remains authoritative')
  else:need(isinstance(raw,str) and raw.startswith((PREFIX,'codi-physical-parameters:2\n')) and physical['presentationRevision']==s['host']['revision'],'actual typed-source presentation binds current document')
  need(s['drawing']['geometryRevision']==s['capture']['solids']['revision'],'actual geometry token link');need(s['physical']['revision']==s['capture']['journal']['revision'],'actual physical/J link')
  j=s['capture']['journal']['revision'];need(j.endswith(':'+s['host']['revision']) and re.fullmatch(r'[0-9]+:[0-9]+:',j[:-len(s['host']['revision'])]),'actual J generation/revision/document suffix')
 need(after['lifecycle']['epoch']==before['lifecycle']['epoch']+1 and after['host']['revision']!=before['host']['revision'] and after['capture']['solids']['revision']!=before['capture']['solids']['revision'],'exact one candidate invalidation')
 need(after['capture']['journal']['revision']==before['capture']['journal']['revision'][:-len(before['host']['revision'])]+after['host']['revision'],'same exact J chronology')
 def accepted(s):
  q=json.loads(json.dumps(s));q['lifecycle'].pop('epoch')
  for parent,key in ((q['capture']['solids'],'revision'),(q['capture']['journal'],'revision'),(q['host'],'revision'),(q['drawing'],'revision'),(q['drawing'],'geometryRevision'),(q['physical'],'revision'),(q['manufacturing'],'revision')):parent.pop(key)
  if isinstance(q['physical']['presentationRevision'],str):q['physical'].pop('presentationRevision')
  return q
 need(accepted(before)==accepted(after),'all other accepted state exact, no broad normalization')

def mesh(raw,e,b,build,encoding_revision):
 ns={'m':'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
 with zipfile.ZipFile(__import__('io').BytesIO(raw)) as z:
  need(z.testzip() is None,'3MF CRC');root=ET.fromstring(z.read('3D/3dmodel.model'));need(root.attrib['unit']=='millimeter','3MF physical unit')
 need(root.find('m:metadata[@name="codi:SourceRevision"]',ns) is not None and root.find('m:metadata[@name="codi:SourceRevision"]',ns).text==encoding_revision,'actual XML source revision binds the issued accepted manufacturing source');provenance=json.loads(root.find('m:metadata[@name="codi:ManufacturingBindings"]',ns).text);need(provenance['revision']==encoding_revision,'actual manufacturing provenance binds the same accepted source');part=one(provenance['parts'],'actual printable part');region=one(part['regions'],'actual printable region');need(part['id']=='plate' and region['id']=='main' and region['bodyId']==b['blind']['outputId'] and region['featureId']==b['blind']['featureId'] and region['engineRevision']==build and region['materialId']=='pla' and region['appearanceId']=='blue','derived metadata binds actual authored source/producer/material')
 resources=root.find('m:resources',ns);objects={x.attrib['id']:x for x in resources.findall('m:object',ns)};leaves=[];visited=set()
 def visit(identity):
  need(identity in objects and identity not in visited,'actual unique build component');visited.add(identity);o=objects[identity];m=o.find('m:mesh',ns)
  if m is not None:leaves.append((identity,o,m));return
  cs=o.find('m:components',ns);need(cs is not None,'mesh or actual components')
  for c in cs:
   need('transform' not in c.attrib or [float(v) for v in c.attrib['transform'].split()]==[1,0,0,0,1,0,0,0,1,0,0,0],'no unreported component placement');visit(c.attrib['objectid'])
 for item in root.find('m:build',ns):need('transform' not in item.attrib or [float(v) for v in item.attrib['transform'].split()]==[1,0,0,0,1,0,0,0,1,0,0,0],'actual build identity');visit(item.attrib['objectid'])
 identity,obj,m=one(leaves,'actual mesh');need(identity==str(region['meshResourceId']) and obj.attrib.get('pid')==str(region['materialResourceId']) and obj.attrib.get('pindex')==str(region['materialIndex']),'actual mesh/material resource binding');base=resources.find('m:basematerials[@id="'+str(region['materialResourceId'])+'"]',ns);need(base is not None and 0<=region['materialIndex']<len(base),'actual material resource/index');need(base[region['materialIndex']].attrib['displaycolor'].upper()=='#3366FF','actual Blue material color');need(str(part['buildResourceId']) in objects and str(region['componentResourceId']) in objects,'actual build/component resource binding');need(one(list(root.find('m:build',ns)),'actual build item').attrib['objectid']==str(part['buildResourceId']),'actual named part build');need(one(list(objects[str(region['componentResourceId'])].find('m:components',ns)),'actual region component').attrib['objectid']==identity,'actual region-to-mesh component');vertices=[[float(v.attrib[k]) for k in ('x','y','z')] for v in m.find('m:vertices',ns)];triangles=[[int(v.attrib[k]) for k in ('v1','v2','v3')] for v in m.find('m:triangles',ns)];need(0<len(vertices)<=150000 and 0<len(triangles)<=100000 and 32+24*len(vertices)+12*len(triangles)<=8388608,'actual one-artifact controlled limits within aggregate bounds');r=e['diameter']/2;floor=e['thickness']-e['depth'];edge_use=Counter();edge_orientation=Counter();volumes=[]
 for p in vertices:
  need(all(math.isfinite(v) for v in p),'finite real mesh');need(-1e-6<=p[0]<=100+1e-6 and -1e-6<=p[1]<=50+1e-6 and -1e-6<=p[2]<=e['thickness']+1e-6,'source Native bounds')
 for tri in triangles:
  need(len(set(tri))==3 and all(0<=i<len(vertices) for i in tri),'actual triangle indices')
  for i in range(3):u,v=tri[i],tri[(i+1)%3];key=tuple(sorted((u,v)));edge_use[key]+=1;edge_orientation[key]+=1 if u<v else -1
  p,q,s=[vertices[i] for i in tri];volumes.append((p[0]*(q[1]*s[2]-q[2]*s[1])+p[1]*(q[2]*s[0]-q[0]*s[2])+p[2]*(q[0]*s[1]-q[1]*s[0]))/6)
 need(all(n==2 for n in edge_use.values()) and all(n==0 for n in edge_orientation.values()),'independent closed oriented mesh');volume=math.fsum(volumes);allowance=math.pi*(2*r*.01+.01**2)*e['depth']+1e-5;need(volume>0 and abs(volume-float(expected_volume(e)))<=allowance,'mesh versus independently bounded cylindrical tessellation error')
 finite=inspect_finite_blind_mesh(vertices,triangles,e)
 return {'vertices':len(vertices),'triangles':len(triangles),'signedVolume':volume,'volumeAllowance':allowance,'quality':'derived-controlled-mesh-not-exact-BRep','finiteGeometry':finite}

def svg(raw,e,definition,context):
 ns={'s':'http://www.w3.org/2000/svg'};root=ET.fromstring(raw);need(root.attrib['width']=='420mm' and root.attrib['height']=='297mm' and root.attrib['viewBox']=='0 0 420 297','physical sheet/scale');meta=json.loads(root.find('s:metadata',ns).text);need(meta['drawingId']==definition['drawingId'] and meta['status']=='available' and meta['dimensionRole']=='reference','actual available source/reference drawing');texts=[n.text or '' for n in root.findall('.//s:text',ns)];need(not any('UNRESOLVED' in t or 'THRU' in t for t in texts),'no failed reference/false through label');need('ΔX 100.000 mm' in texts and 'ΔY 50.000 mm' in texts and f"ΔZ {e['thickness']:.3f} mm" in texts,'actual source-axis/thickness semantics');need(root.findall('.//s:path',ns),'real projected paths');need(len(definition['dimensions'])==3 and not any(d['kind'].startswith('hole') for d in definition['dimensions']),'no unsupported blind measurement masquerade');dimension_proof=_dimension_oracle.DimensionPresentation(root,definition,need);objects={o['id']:o for o in json.loads(one([row for row in context['capture']['native']['sketches']if row['id']==definition['datum']['faceId']],'actual SVG datum source')['source'])['objects']};bounds=[]
 for dim in definition['dimensions']:
  view=one([v for v in definition['views']if v['viewId']==dim['viewId']],'actual source dimension view');ox,oy=view['paperOrigin']
  if dim['kind']=='source-distance':
   ends=[]
   for ref in(dim['from'],dim['to']):
    need(ref['kind']=='source-point'and ref['faceId']==definition['datum']['faceId']and ref['curveId']in objects and ref['point']in('a','b'),'actual saved source-point identity');q=objects[ref['curveId']]['data'][ref['point']];ends.append([ox+q['x'],oy-q['y']])
   candidates=[ends];prefix='ΔX 'if dim['axis']=='datum-x'else'ΔY ';value=100 if dim['axis']=='datum-x'else 50
  else:
   need(dim['kind']=='plane-distance'and view['basis']=='front','actual finite source/cap depth reference');candidates=[[[ox+x,oy],[ox+x,oy-e['thickness']]]for x in(0,100)];prefix='ΔZ ';value=e['thickness']
  dimension_proof.verify(dim['dimensionId'],candidates,prefix+format(value,'.3f')+' mm')
 for view in definition['views']:
  width,height=(100,50)if view['basis']=='top'else(100,e['thickness'])if view['basis']=='front'else(50,e['thickness']);ox,oy=view['paperOrigin'];bounds.append([ox,oy-height,ox+width,oy])
 dimension_proof.finish(bounds)
 return meta

def negative_archive_api():return(read_archive,structure,rebuild,manifest_row,canonical,root_record)

def make_bad(source,dest,receipt_path):
 source,dest=Path(source),Path(dest);dest.mkdir(parents=True,exist_ok=False);receipt=json.loads(Path(receipt_path).read_text());need(source.read_bytes()==(Path(receipt_path).parent/receipt['saves'][1]['savedFile']).read_bytes(),'negative derives ONLY from actual second healthy saved file');output=[]
 for name,code in [('equal-depth','BLIND_DEPTH_NOT_INTERIOR'),('wrong-entry','BLIND_ENTRY_UNRESOLVED')]:
  file=dest/(name+'.cad');proof=rewrite_negative_archive(source,file,receipt,name,negative_archive_api());output.append({'name':name,'path':str(file),'code':code,'negativeOnly':True,'negativeProof':proof})
 return output

def check(directory):
 directory=Path(directory);r=json.loads((directory/'receipt.json').read_text());need(r['status']=='PASS' and r['ownedContextsRetired'] and r['sharedBrowserDisconnectedOnly'],'complete genuine whole/context cleanup');need(not r['sourceSeeds'] and not r['privateAuthoring'] and not r['fakeReplies'],'no fake Native/source');need(r['sourcePins']==r['sourcePinsAfter'],'unchanged executed source');build=r['engineRevision'];need(build=='sha256:32eec74e3019d9e2d767c9016f05aa3daa49441c6102423a269d67b9c7f02a08:abbf2aa02a6f2101c600aa1eedd20fa80ab2db206e677ca860d9c5103cdfbfcc','actual approved primary MFG pair')
 local_names=['desktop-driver.mjs','example.mjs','check.py','step_oracle.py','mesh_oracle.py','negative_archive.py','README.md','CONTRACT.md','SOURCE.md'];roster={('core','test/centered-blind-hole-workflow/'+n) for n in local_names}|{('core','web/app/cad/export/linkedPartDrawingSvg.mjs'), ('core','web/app/cad/export/linkedPartDrawingDimensionLayout.mjs'),('core','web/app/cad/export/linkedPartDrawingCaptionLayout.mjs'),('core','web/app/cad/export/linkedPartDrawingRequirementForms.mjs'),('core','web/app/cad/export/linkedPartDrawingWarningLayout.mjs'),('core','test/drawing-dimension-oracle.py'),('core','test/native-cad-container/archive_oracle.py'),('desktop','test/agent-cad-corpus/sweep/signed-harness.mjs'),('desktop','test/agent-cad-corpus/strict-join/oracle.mjs'),('desktop','apps/system/jsketcher/examples/source-bound-blind-hole.mjs')}
 need(len(r['sourceSnapshots'])==len(roster) and {(x['repository'],x['relative']) for x in r['sourceSnapshots']}==roster,'exact source and transitive producer-helper roster');need(len(r['sourcePins'])==len(roster),'exact source pin roster')
 for row in r['sourceSnapshots']:
  raw=(directory/row['file']).read_bytes();need(len(raw)<=8388608 and sha(raw)==row['sha256']==r['sourcePins'][row['originalFile']],'exact executing source snapshot/pin');need(row['originalFile']==str(Path(row['root'])/row['relative']),'actual source path binding')
  expected=r['acceptanceSource'] if (row['relative'].startswith('test/centered-blind-hole-workflow/') or row['relative']=='test/drawing-dimension-oracle.py') else r['pins']['source'] if row['repository']=='core' else r['pins']['desktop'];need(row['commit']==expected and re.fullmatch('[a-f0-9]{40}',expected),'exact frozen producer commit')
  blob=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest();need(blob==row['gitBlobOID'],'actual Git blob identity of executed snapshot');frozen=subprocess.run(['git','-C',row['root'],'show',row['commit']+':'+row['relative']],stdout=subprocess.PIPE,stderr=subprocess.PIPE);need(frozen.returncode==0 and frozen.stdout==raw,'independent exact producer commit/path/blob readback')
 need(len(r['creationTravel'])==1 and len(r['saves'])==2 and len(r['reopens'])==2 and len(r['artifacts'])==6 and len(r['malformed'])==2,'complete required lifecycle/artifact/negative roster');need(len(r['observations'])>=20,'actual creation/source/edit/travel/read observations');points=0
 phases=['literal-constructor', 'blind-create', 'creation-undo', 'creation-redo', 'depth8', 'diameter6', 'parent25', 'undo-parent', 'undo-diameter', 'undo-depth', 'redo-depth', 'redo-diameter', 'redo-parent', 'post-refusal-undo-parent', 'post-refusal-redo-parent', 'healthy-depth7', 'restore-depth8', 'named-bind', 'named-binding-undo', 'named-binding-redo', 'inch-display', 'first-fresh-open', 'reopened-named-edit', 'reopened-named-undo', 'reopened-named-redo', 'second-fresh-open', 'second-open-continuation', 'malformed-equal-depth-continuation', 'malformed-wrong-entry-continuation']
 expected=[(20, 0, 0, False), (20, 4, 6, False), (20, 0, 0, False), (20, 4, 6, False), (20, 4, 8, False), (20, 6, 8, False), (25, 6, 8, False), (20, 6, 8, False), (20, 4, 8, False), (20, 4, 6, False), (20, 4, 8, False), (20, 6, 8, False), (25, 6, 8, False), (20, 6, 8, False), (25, 6, 8, False), (25, 6, 7, False), (25, 6, 8, False), (25, 6, 8, True), (25, 6, 8, False), (25, 6, 8, True), (25, 6, 8, True), (25, 6, 8, True), (30, 6, 7, True), (25, 6, 8, True), (30, 6, 7, True), (30, 6, 7, True), (30, 6, 7, True), (30, 6, 7, True), (30, 6, 7, True)]
 need([x['phase'] for x in r['observations']]==phases and len(set(phases))==len(phases),'exact unique complete observation phase roster')
 for row,wanted in zip(r['observations'],expected):need((row['dimensions']['thickness'],row['dimensions']['diameter'],row['dimensions']['depth'],row['bound'])==wanted,'phase-specific independent dimensions/bindings')
 for row in r['observations']:
  s,b,e=row['before'],row['binding'],row['dimensions'];settled(s);need(row['after']==s,'actual readonly equality');src=json.loads(one([x for x in s['capture']['native']['sketches'] if x['id']==b['faceId']],'source')['source']);rectangle(src,b,row['inspection']);intents(s,b,e,row['bound'],build);body=one(s['capture']['solids']['bodies'],'actual body');m=body['metrics'];need(m['nativeValidity']['valid'] and m['solidCount']==1 and m['resultKind']=='single-solid','actual measured valid solid');near(m['nativeVolume'],expected_volume(e),1e-6)
  for key,expected in [('min',[0,0,0]),('max',[100,50,e['thickness']])]:
   for actual,wanted in zip(m['nativeBounds'][key],expected):near(actual,wanted,1e-6)
  need(row['query']['quality']=='native-re-evaluation-observation' and row['query']['bodyId']==body['id'] and row['query']['engineRevision']==build,'actual same-body/build Native points');need([p['point'] for p in row['query']['points']]==row['input']['points'],'actual issued queries');need([p['classification'] for p in row['query']['points']]==[point_class(p,e) for p in row['input']['points']],'independent Fraction material/void/floor equations');points+=len(row['input']['points'])
 travel=r['creationTravel'][0]
 for key,index in [('before',0),('created',1),('undone',2),('redone',3)]:need(travel[key]==r['observations'][index]['before'],'creation travel binds its exact actual Native observation phase')
 directions=[x['args']['direction'] for x in r['commands'] if x['command']=='travel-authored-edit'];need(directions==['undo','redo','undo','undo','undo','redo','redo','redo','undo','redo','undo','redo','undo','redo'],'exact actual shared creation/mixed/physical travel issuance roster')
 def authored(s):
  n=json.loads(json.dumps(s['capture']['native']));n.pop('materialRevision',None);return n
 prior=travel['before']['capture']['native']['counters'];created=travel['created']['capture']['native']['counters'];need(created=={**prior,'featureId':prior['featureId']+1} and r['binding']['blind']['featureId']==created['featureId'],'exact single creation feature increment and every other high water unchanged');original=authored(travel['before']);original['counters']={**prior,'featureId':prior['featureId']+1};need(authored(travel['undone'])==original,'actual immediate creation Undo restores exact original intent with retained high water');need(authored(travel['redone'])==authored(travel['created']),'actual immediate creation Redo restores exact fourteen-field intent and IDs')
 control=r['controlPlane']['faceId'];control_source=one([s['source'] for s in travel['before']['capture']['native']['sketches'] if s['id']==control],'actual independently authored control source')
 for observation in r['observations']:
  need(one([s['source'] for s in observation['before']['capture']['native']['sketches'] if s['id']==control],'retained independent source')==control_source,'unrelated authored control source remains exact')
 negatives=[('Authentic independent source cannot replace blind datum', 'BLIND_ENTRY_UNRESOLVED', False), ('Creation depth equals current thickness', 'BLIND_DEPTH_NOT_INTERIOR', False), ('Caller cannot substitute a backend build', 'INVALID_REQUEST', False), ('Zero blind depth is argument domain', 'INVALID_REQUEST', False), ('Negative blind depth is argument domain', 'INVALID_REQUEST', False), ('Equal thickness refuses without becoming THRU', 'BLIND_DEPTH_NOT_INTERIOR', True), ('Oversize depth refuses without clamping', 'BLIND_DEPTH_NOT_INTERIOR', True), ('Oversize diameter refuses actual containment', 'BLIND_HOLE_OUTSIDE_PROFILE', True), ('Positive parent thickness equality is downstream blind failure', 'BLIND_DEPTH_NOT_INTERIOR', True), ('Actual stale blind revision refuses before candidate', 'STALE_HISTORY', False), ('Named blind binding cannot be erased numerically', 'BOUND_DIMENSION', False), ('Named equality definition refuses genuine current hole', 'BLIND_DEPTH_NOT_INTERIOR', True), ('Changed geometry requires material review before3MF', 'MANUFACTURING_REVIEW_REQUIRED', False)]
 need([(x['label'],x['error']['code'],x['candidate']) for x in r['refusals']]==negatives,'exact required negative phase/code/candidate roster')
 for row in r['refusals']:check_refusal(row)
 need([x['label'] for x in r['exportSets']]==['initial','reopened-reedited'] and all(x['before']==x['after'] for x in r['exportSets']),'actual complete read-only export sets')
 need([(x['label'],x['format']) for x in r['artifacts']]==[(phase,kind) for phase in ('initial','reopened-reedited') for kind in ('step','3mf','svg')],'exact unique artifact phase/format roster')
 need([x['label'] for x in r['saves']]==['blind-initial','blind-reedited'] and [x['label'] for x in r['reopens']]==['blind-initial','blind-reedited'],'exact save/Open phase roster')
 writes=[('export-step','initial'),('export-3mf','initial'),('export-svg','initial'),('save','blind-initial'),('expected-prewrite-refusal','Changed geometry requires material review before3MF'),('export-step','reopened-reedited'),('export-3mf','reopened-reedited'),('export-svg','reopened-reedited'),('save','blind-reedited'),('negative-fixture','negative-equal-depth'),('negative-fixture','negative-wrong-entry')]
 need(not r.get('pendingWrite') and [(x['kind'],x['label']) for x in r['writes']]==writes,'exact sequential submitted-write/readback roster')
 owner=r['writes'][0]['username'];need(owner and all(x['username']==owner for x in r['writes']),'same actual own account through fresh contexts')
 for i,row in enumerate(r['writes']):
  need(row['sequence']==i and row['phase']=='settled' and row['file'].startswith('/Blind-'+owner) and row['windowId'],'same owned context/path settled before the next write')
  if row['kind']=='expected-prewrite-refusal':
   absence=row['readback'];need(set(absence)=={'absent','method','file','username','windowId','owner','browserEntries','serverEntries'} and absence['absent'] is True and absence['method']=='browser-server-root-list' and absence['file']==row['file'] and absence['username']==row['username'] and absence['windowId']==str(row['windowId']) and isinstance(absence['owner'],str) and 0<len(absence['owner'])<=256,'actual scoped account/path directory-list absence evidence')
   need(row['failure']['code']=='MANUFACTURING_REVIEW_REQUIRED' and not row['failure']['committed'] and not row['failure']['possiblyCommitted'],'actual authoritative noncommitted prewrite refusal')
   for side in ('browserEntries','serverEntries'):
    entries=absence[side];need(isinstance(entries,list) and len(entries)<=4096,'bounded complete own directory listing');names=[]
    for entry in entries:
     need(set(entry)==({'path','name','directory'} if side=='browserEntries' else {'name','directory','bytes'}) and isinstance(entry['name'],str) and 0<len(entry['name'].encode())<=255 and '/' not in entry['name'] and type(entry['directory']) is bool,'actual own directory entry fields')
     if side=='browserEntries':need(entry['path']=='/'+entry['name'],'actual root path/name binding')
     else:need(entry['bytes'] is None if entry['directory'] else type(entry['bytes']) is int and entry['bytes']>=0,'actual server listing size')
     names.append(entry['name'])
    need(len(names)==len(set(names)) and row['file'][1:] not in names,'actual requested file absent from both own root listings')
   refused=one([x for x in r['refusals'] if x['label']==row['label']],'same material prewrite refusal');need(row['afterAbsence']==refused['after'],'directory observation preserves every accepted model/token/resource field')
   continue
  artifact=row['readback'];raw=(directory/artifact['savedFile']).read_bytes();need(artifact['file']==row['file'] and sha(raw)==artifact['sha256'] and len(raw)==artifact['bytes'],'actual submitted path readback/whole bytes')
  if row['kind']=='negative-fixture':need(row['result']['path']==row['file'] and row['result']['version'] and row['result']['status']=='pending' and row['result']['sha256']==artifact['sha256'],'actual negative write acknowledgment binds independently read bytes')
  else:need(row['result']['committed'] and row['result']['persistence']=='browser','actual submitted browser write acknowledgment')
 archives=[]
 for saved in r['saves']:
  p=directory/saved['savedFile'];info=read_archive(p);need(info['sha256']==saved['sha256'] and info['bytes']==saved['bytes'],'actual browser/server archive bytes');project=info['envelope']['project'];need(project['model']['history']==saved['before']['capture']['native']['history'] and project['model']['expressions']==saved['before']['capture']['native']['expressions'],'actual archived authored intent/formulas');actual={s['id']:json.loads(s['source']) for s in saved['before']['capture']['native']['sketches']};need({s['id']:s['data'] for s in project['sketches']}==actual,'exact all saved source, no dropped unrelated control');need(info['envelope']['drawings']==[r['definition']],'exact persisted genuine drawing definition');need(info['envelope']['manufacturing']==saved['before']['manufacturing']['metadata'],'exact material state');archives.append({'file':saved['savedFile'],'sha256':info['sha256'],'designRevision':info['manifest']['designRevision']})
 for opened in r['reopens']:
  for k in ('history','source','sketches','expressions','counters','presentation'):need(opened['before']['capture']['native'][k]==opened['opened']['capture']['native'][k],'actual fresh Open '+k)
  need(not opened['opened']['capture']['journal']['canUndo'] and not opened['opened']['capture']['journal']['canRedo'],'journal is honestly session-local')
 artifacts=[]
 for row in r['artifacts']:
  raw=(directory/row['savedFile']).read_bytes();need(sha(raw)==row['sha256'] and len(raw)==row['bytes'],'actual artifact bytes');e=row['dimensions'];operation={'step':'export-worker-step','3mf':'export-core-3mf','svg':'export-linked-part-drawing-svg'}[row['format']];issued=one([x for x in r['commands'] if x['command']==operation and x['args']==row['issued']],'actual unique public export issuance');need(issued['result']==row['result'],'actual public export receipt binds recorded artifact');context=one([x for x in r['exportSets'] if x['label']==row['label']],'actual accepted export context')['before'];need(row['issued']['revision']==context['host']['revision'],'actual public export document revision');manufacturing_revision=context['manufacturing']['metadata']['revision'];need(re.fullmatch('sha256-[a-f0-9]{64}',manufacturing_revision),'actual accepted manufacturing source revision')
  if row['format']=='step':detail=inspect_step(raw,{**e,'volume':float(expected_volume(e))})
  elif row['format']=='3mf':detail=mesh(raw,e,row['binding'],build,manufacturing_revision[7:])
  else:detail=svg(raw,e,r['definition'],context)
  artifacts.append({'file':row['savedFile'],'format':row['format'],'detail':detail})
 need([(x['name'],x['code']) for x in r['malformed']]==[('equal-depth','BLIND_DEPTH_NOT_INTERIOR'),('wrong-entry','BLIND_ENTRY_UNRESOLVED')],'exact malformed semantic roster')
 negative_proofs=[]
 for row in r['malformed']:
  need(row['negativeOnly'] is True and row['error']['code']==row['code'] and not row['error']['committed'] and not row['error']['possiblyCommitted'] and row['before']==row['after'],'typed pre-adoption negative preserves full host/path/dirty/J/material/drawing/parameter/source/resource state')
  write=one([x for x in r['writes'] if x['kind']=='negative-fixture' and x['label']=='negative-'+row['name']],'actual unique submitted negative/readback')
  need(write['file']==row['own'] and write['readback']['sha256']==row['sha256'],'public rejected path binds actual server-identical negative bytes')
  file=directory/write['readback']['savedFile'];need(sha(file.read_bytes())==row['sha256'],'actual owned negative artifact')
  proof=inspect_negative_archive(directory/r['saves'][1]['savedFile'],file,r,row['name'],negative_archive_api());need(proof==row['negativeProof'],'independent after-whole original/negative exact source/number/role/span/metadata/manifest difference proof');negative_proofs.append(proof)
 return {'status':'PASS','scope':'finite semantic centered flat-bottom blind hole, not all C06 or general interchange','observations':len(r['observations']),'nativePoints':points,'refusals':len(r['refusals']),'archives':archives,'artifacts':artifacts,'negativeArchiveProofs':negative_proofs,'sourceMmBudget':5e-8,'nativeVolumeMm3Budget':1e-6,'nativeBoundsMmBudget':1e-6,'nativeFloorNotMeshAuthority':True}

if __name__=='__main__':
 if len(sys.argv)>1 and sys.argv[1]=='make-bad':print(json.dumps(make_bad(sys.argv[2],sys.argv[3],sys.argv[4])));sys.exit(0)
 directory=Path(sys.argv[1]);result=check(directory);(directory/'independent-oracle.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
