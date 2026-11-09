#!/usr/bin/env python3
"""AFTER-WHOLE independent source/equations/Decimal/Fraction/ZIP/XML/STEP audit.
No production codec/validator/solver/geometry executor. make-bad creates only own
negative files during the complete workflow; never a positive authoring source.
"""
import binascii,hashlib,json,math,re,sys,zipfile,zlib,subprocess
from collections import Counter
from decimal import Decimal,localcontext
from fractions import Fraction
from pathlib import Path
from xml.etree import ElementTree as ET
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive,structure,rebuild,manifest_row,canonical,root_record
from step_oracle import inspect_step
from mesh_oracle import inspect_finite_counterbore_mesh
from svg_oracle import inspect_counterbore_svg
from negative_archive import rewrite as rewrite_negative,inspect as inspect_negative
from acceptance_oracle import verify_roster,expected_points,verify_phases,verify_writes
PI=Decimal('3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651')
sha=lambda b:hashlib.sha256(b).hexdigest()
KEYS={'version','unit','engine','engineRevision','featureId','target','producerFeatureId','sourceFeatureId','sourceFaceId','sourceRegionId','entryFaceId','kind','throughDiameter','stepDiameter','stepDepth'}
PREFIX='codi-physical-parameters:1\n'
def need(v,msg):
 if not v:raise ValueError(msg)
def one(xs,label):need(len(xs)==1,'one '+label);return xs[0]
def near(x,y,t=5e-8):need(type(x) in (int,float) and math.isfinite(x) and abs(x-float(y))<=t,f'{x} differs from {y}, budget {t}')
def settled(s):
 r=s['ownership']['resources'];need(not s['ownership']['processing'] and not r['cleanupFailed'] and all(r[k]==0 for k in ('candidates','accepted','mounts')) and r['owners']==r['detached'],'retired actual Native resources');need(not s['lifecycle']['pipelineFailed'] and not s['lifecycle']['cleanupFailed'],'healthy candidate continuation')
def expected_volume(e):
 with localcontext() as c:
  c.prec=90;T=Decimal(str(e['thickness']));r=Decimal(str(e['throughDiameter']))/2;R=Decimal(str(e['stepDiameter']))/2;h=Decimal(str(e['stepDepth']));return Decimal(str(e['width']))*Decimal(str(e['height']))*T-PI*(r*r*T+(R*R-r*r)*h)
def point_class(p,e):
 x,y,z=map(lambda v:Fraction(str(v)),p);W,H,T=[Fraction(str(e[k])) for k in ('width','height','thickness')];r,R=[Fraction(str(e[k]))/2 for k in ('throughDiameter','stepDiameter')];h=Fraction(str(e['stepDepth']));s=T-h;q=(x-W/2)**2+(y-H/2)**2
 if not(0<=x<=W and 0<=y<=H and 0<=z<=T):return 'outside'
 if r and(q<r*r or z>s and q<R*R):return 'outside'
 if x in (0,W) or y in (0,H):return 'boundary'
 if r and(q==r*r and z<=s or q==R*R and z>=s or r*r<=q<=R*R and z==s):return 'boundary'
 if z in (0,T):return 'boundary'
 return 'inside'
def rectangle(s,b,inspection,e):
 need(s['version']==3 and len(s['objects'])==4 and len(s['stages'])==1 and not s['stages'][0]['generators'] and len(s['stages'][0]['constraints'])==11,'genuine four-Segment/eleven-row source')
 need(all(not x for x in s['boundary'].values()),'no external source seed');need(s['metadata']['boundaryFrame']=={'origin':[0,0,0],'x':[1,0,0],'y':[0,1,0],'z':[0,0,1]},'actual source frame')
 objects={o['id']:o for o in s['objects']};need(set(objects)==set(b['sourceCurveIds']) and len(objects)==4,'actual discovered source curve IDs');corners=[(0,0),(e['width'],0),(e['width'],e['height']),(0,e['height'])];counts={p:0 for p in corners};edges=set()
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
 rows=[r for r in h if r['type']=='WORKER_CENTERED_COUNTERBORE_V1'];need(len(rows)==bool(e['throughDiameter']),'no private tool/Boolean feature recipe')
 if rows:
  q=one(rows,'counterbore')['params'];need(set(q)==KEYS and q['version']==1 and q['unit']=='millimeter' and q['engine']=='occ' and q['engineRevision']==build and q['kind']=='centered-counterbore-flat','exact fifteen-field semantic intent')
  need(q['featureId']==b['counterbore']['featureId'] and q['target']==b['profile']['outputId'] and q['producerFeatureId']==q['sourceFeatureId']==b['profile']['featureId'] and q['sourceFaceId']==b['faceId'] and q['sourceRegionId']==b['regionId'] and q['entryFaceId']==b['counterbore']['entryFaceId'],'actual authentic parent/source/entry identity; no ID parsing')
  need(q['throughDiameter']==('bore' if bound else e['throughDiameter']) and q['stepDiameter']==('step' if bound else e['stepDiameter']) and q['stepDepth']==('recess' if bound else e['stepDepth']),'raw counterbore bindings retained')
 need(all(r['type'] in ('PLANE','WORKER_SELECTED_PROFILE_EXTRUDE_V2','WORKER_CENTERED_COUNTERBORE_V1') for r in h),'one authored graph, no fake tool history')
 expression=state['capture']['native']['expressions']
 if bound:
  need(expression.startswith(PREFIX),'actual typed source');defs=json.loads(expression[len(PREFIX):]);need(defs==state['physical']['definitions'],'actual inspected/saved directed parameter state');need([d['name'] for d in defs]==['plate','bore','step','recess'],'exact finite named lengths')
  for d,value in zip(defs,[e['thickness'],e['throughDiameter'],e['stepDiameter'],e['stepDepth']]):need(d['dimension']=='length' and d['expression']==f'mm({value})','unchanged authoritative definition');row=one([r for r in state['physical']['quantities'] if r['name']==d['name']],'actual evaluated quantity');near(row['value'],value,1e-12)
 else:need(expression=='','literal source remains literal')

def check_refusal(row):
 before,after=row['before'],row['after'];need(row['error'] and not row['error']['committed'] and not row['error']['possiblyCommitted'],'actual typed refusal');settled(before);settled(after)
 if not row['candidate']:need(after==before,'pre-candidate full state exact');return
 for s in (before,after):
  need(s['drawing']['revision']==s['host']['revision']==s['manufacturing']['revision'],'actual document token links');need(s['physical']['ready'] is True and s['physical']['reason'] is None,'ready physical inspection')
  source=s['capture']['native']['expressions']
  if source=='':need(s['physical']['presentationRevision'] is None and s['physical']['definitions']==[] and s['physical']['quantities']==[],'literal-empty source has no captured physical presentation')
  else:need(isinstance(source,str) and source.startswith(('codi-physical-parameters:1\n','codi-physical-parameters:2\n')) and s['physical']['presentationRevision']==s['host']['revision'],'typed-ready source binds actual physical presentation')
  need(s['drawing']['geometryRevision']==s['capture']['solids']['revision'],'actual geometry token link');need(s['physical']['revision']==s['capture']['journal']['revision'],'actual physical/J link')
  j=s['capture']['journal']['revision'];need(j.endswith(':'+s['host']['revision']) and re.fullmatch(r'[0-9]+:[0-9]+:',j[:-len(s['host']['revision'])]),'actual J generation/revision/document suffix')
 need(after['lifecycle']['epoch']==before['lifecycle']['epoch']+1 and after['host']['revision']!=before['host']['revision'] and after['capture']['solids']['revision']!=before['capture']['solids']['revision'],'exact one candidate invalidation')
 need(after['capture']['journal']['revision']==before['capture']['journal']['revision'][:-len(before['host']['revision'])]+after['host']['revision'],'same exact J chronology')
 def accepted(s):
  q=json.loads(json.dumps(s));q['lifecycle'].pop('epoch')
  for parent,key in ((q['capture']['solids'],'revision'),(q['capture']['journal'],'revision'),(q['host'],'revision'),(q['drawing'],'revision'),(q['drawing'],'geometryRevision'),(q['physical'],'revision'),(q['manufacturing'],'revision')):parent.pop(key)
  if q['physical']['presentationRevision'] is not None:q['physical'].pop('presentationRevision')
  return q
 need(accepted(before)==accepted(after),'all other accepted state exact, no broad normalization')

def mesh(raw,e,b,build,encoding_revision):
 ns={'m':'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
 with zipfile.ZipFile(__import__('io').BytesIO(raw)) as z:
  need(z.testzip() is None,'3MF CRC');root=ET.fromstring(z.read('3D/3dmodel.model'));need(root.attrib['unit']=='millimeter','3MF physical unit')
 need(root.find('m:metadata[@name="codi:SourceRevision"]',ns) is not None and root.find('m:metadata[@name="codi:SourceRevision"]',ns).text==encoding_revision,'actual XML source revision binds the issued accepted manufacturing source');provenance=json.loads(root.find('m:metadata[@name="codi:ManufacturingBindings"]',ns).text);need(provenance['revision']==encoding_revision,'actual manufacturing provenance binds the same accepted source');part=one(provenance['parts'],'actual printable part');region=one(part['regions'],'actual printable region');need(part['id']=='plate' and region['id']=='main' and region['bodyId']==b['counterbore']['outputId'] and region['featureId']==b['counterbore']['featureId'] and region['engineRevision']==build and region['materialId']=='pla' and region['appearanceId']=='blue','derived metadata binds actual authored source/producer/material')
 resources=root.find('m:resources',ns);objects={x.attrib['id']:x for x in resources.findall('m:object',ns)};leaves=[];visited=set()
 def visit(identity):
  need(identity in objects and identity not in visited,'actual unique build component');visited.add(identity);o=objects[identity];m=o.find('m:mesh',ns)
  if m is not None:leaves.append((identity,o,m));return
  cs=o.find('m:components',ns);need(cs is not None,'mesh or actual components')
  for c in cs:
   need('transform' not in c.attrib or [float(v) for v in c.attrib['transform'].split()]==[1,0,0,0,1,0,0,0,1,0,0,0],'no unreported component placement');visit(c.attrib['objectid'])
 for item in root.find('m:build',ns):need('transform' not in item.attrib or [float(v) for v in item.attrib['transform'].split()]==[1,0,0,0,1,0,0,0,1,0,0,0],'actual build identity');visit(item.attrib['objectid'])
 identity,obj,m=one(leaves,'actual mesh');need(identity==str(region['meshResourceId']) and obj.attrib.get('pid')==str(region['materialResourceId']) and obj.attrib.get('pindex')==str(region['materialIndex']),'actual mesh/material resource binding');base=resources.find('m:basematerials[@id="'+str(region['materialResourceId'])+'"]',ns);need(base is not None and 0<=region['materialIndex']<len(base),'actual material resource/index');need(base[region['materialIndex']].attrib['displaycolor'].upper()=='#3366FF','actual Blue material color');need(str(part['buildResourceId']) in objects and str(region['componentResourceId']) in objects,'actual build/component resource binding');need(one(list(root.find('m:build',ns)),'actual build item').attrib['objectid']==str(part['buildResourceId']),'actual named part build');need(one(list(objects[str(region['componentResourceId'])].find('m:components',ns)),'actual region component').attrib['objectid']==identity,'actual region-to-mesh component');vertices=[[float(v.attrib[k]) for k in ('x','y','z')] for v in m.find('m:vertices',ns)];triangles=[[int(v.attrib[k]) for k in ('v1','v2','v3')] for v in m.find('m:triangles',ns)];need(0<len(vertices)<=150000 and 0<len(triangles)<=100000 and 32+24*len(vertices)+12*len(triangles)<=8388608,'actual one-artifact controlled limits within aggregate bounds');r=e['throughDiameter']/2;R=e['stepDiameter']/2;floor=e['thickness']-e['stepDepth'];edge_use=Counter();edge_orientation=Counter();volumes=[]
 for p in vertices:
  need(all(math.isfinite(v) for v in p),'finite real mesh');need(-1e-6<=p[0]<=e['width']+1e-6 and -1e-6<=p[1]<=e['height']+1e-6 and -1e-6<=p[2]<=e['thickness']+1e-6,'source Native bounds')
 for tri in triangles:
  need(len(set(tri))==3 and all(0<=i<len(vertices) for i in tri),'actual triangle indices')
  for i in range(3):u,v=tri[i],tri[(i+1)%3];key=tuple(sorted((u,v)));edge_use[key]+=1;edge_orientation[key]+=1 if u<v else -1
  p,q,s=[vertices[i] for i in tri];volumes.append((p[0]*(q[1]*s[2]-q[2]*s[1])+p[1]*(q[2]*s[0]-q[0]*s[2])+p[2]*(q[0]*s[1]-q[1]*s[0]))/6)
 need(all(n==2 for n in edge_use.values()) and all(n==0 for n in edge_orientation.values()),'independent closed oriented mesh');volume=math.fsum(volumes);allowance=math.pi*((2*r*.01+.01**2)*floor+(2*R*.01+.01**2)*e['stepDepth'])+1e-5;need(volume>0 and abs(volume-float(expected_volume(e)))<=allowance,'mesh versus independently bounded cylindrical tessellation error')
 finite=inspect_finite_counterbore_mesh(vertices,triangles,e)
 return {'vertices':len(vertices),'triangles':len(triangles),'signedVolume':volume,'volumeAllowance':allowance,'quality':'derived-controlled-mesh-not-exact-BRep','finiteGeometry':finite}

def make_bad(source,dest,receipt_path):
 source,dest=Path(source),Path(dest);dest.mkdir(parents=True,exist_ok=False);receipt=json.loads(Path(receipt_path).read_text());archive=(read_archive,structure,rebuild,manifest_row,canonical,root_record);rows=[]
 for name,code in [('equal-depth','COUNTERBORE_STEP_NOT_INTERIOR'),('reversed-diameters','COUNTERBORE_DIAMETER_ORDER'),('wrong-entry','COUNTERBORE_ENTRY_UNRESOLVED')]:
  output=dest/(name+'.cad');proof=rewrite_negative(source,output,receipt,name,archive);rows.append({'name':name,'path':str(output),'code':code,'negativeOnly':True,'negativeProof':proof})
 return rows

def check(directory):
 directory=Path(directory);r=json.loads((directory/'receipt.json').read_text());need(r['status']=='PASS' and r['ownedContextsRetired'] and r['sharedBrowserDisconnectedOnly'],'complete genuine whole/context cleanup');need(not r['sourceSeeds'] and not r['privateAuthoring'] and not r['fakeReplies'],'no fake Native/source');need(r['sourcePins']==r['sourcePinsAfter'],'unchanged executed source');build=r['engineRevision'];need(build=='sha256:32eec74e3019d9e2d767c9016f05aa3daa49441c6102423a269d67b9c7f02a08:abbf2aa02a6f2101c600aa1eedd20fa80ab2db206e677ca860d9c5103cdfbfcc','actual approved primary MFG pair')
 verify_roster(directory,r);verify_phases(r);verify_writes(directory,r)
 need(len(r['creationTravel'])==1 and len(r['saves'])==2 and len(r['reopens'])==2 and len(r['artifacts'])==6 and len(r['malformed'])==3,'complete required lifecycle/artifact/negative roster');points=0
 for row in r['observations']:
  s,b,e=row['before'],row['binding'],row['dimensions'];settled(s);need(row['workBudget']['plannedNativeResults']==(5 if e['throughDiameter'] else 1) and row['workBudget']['maxLifetimeNames']==32,'unchanged authored work budget, four genuine results required by bound receipt');need(row['after']==s and row['afterInspection']==s,'actual readonly Native and source-inspection equality');src=json.loads(one([x for x in s['capture']['native']['sketches'] if x['id']==b['faceId']],'source')['source']);rectangle(src,b,row['inspection'],e);intents(s,b,e,row['bound'],build);body=one(s['capture']['solids']['bodies'],'actual body');m=body['metrics'];need(body['id']==(b['counterbore'] if e['throughDiameter'] else b['profile'])['outputId'] and body['featureId']==(b['counterbore'] if e['throughDiameter'] else b['profile'])['featureId'],'actual current output/producer for exact phase');need('sha256:'+m['runtime']['jsSha256']+':'+m['runtime']['wasmSha256']==build,'actual Native metric runtime pair');need(m['nativeValidity']['valid'] is True and m['solidCount']==1 and m['resultKind']=='single-solid','actual measured valid solid');near(m['nativeVolume'],expected_volume(e),1e-6)
  for key,expected in [('min',[0,0,0]),('max',[e['width'],e['height'],e['thickness']])]:
   for actual,wanted in zip(m['nativeBounds'][key],expected):near(actual,wanted,1e-6)
  need(all(row['query'][k]==row['input'][k] for k in ('revision','version','unit','engine','engineRevision','bodyId','featureId')),'exact original public point request/receipt tuple');need(row['query']['quality']=='native-re-evaluation-observation' and row['query']['bodyId']==body['id'] and row['query']['engineRevision']==build,'actual same-body/build Native points');need(row['input']['points']==expected_points(e) and [p['point'] for p in row['query']['points']]==row['input']['points'],'exact frozen finite material/void/boundary queries');need([p['classification'] for p in row['query']['points']]==[point_class(p,e) for p in row['input']['points']],'independent Fraction material/void/annular shoulder equations');points+=len(row['input']['points'])
 travel=r['creationTravel'][0]
 def authored(s):
  n=json.loads(json.dumps(s['capture']['native']));n.pop('materialRevision',None);return n
 prior=travel['before']['capture']['native']['counters'];expected_counters={**prior,'featureId':prior['featureId']+1};need(travel['created']['capture']['native']['counters']==expected_counters and r['binding']['counterbore']['featureId']==prior['featureId']+1,'exact one feature allocation, every other counter unchanged');original=authored(travel['before']);original['counters']=expected_counters;need(authored(travel['undone'])==original,'actual immediate creation Undo restores exact original intent with retained high water');need(authored(travel['redone'])==authored(travel['created']),'actual immediate creation Redo restores exact fifteen-field intent and IDs');need(travel['redone']['capture']['solids']['bodies'][0]['selections']==travel['created']['capture']['solids']['bodies'][0]['selections'],'same actual inherited selections/explicit unresolved identities')
 control=r['controlPlane']['faceId'];control_source=one([s['source'] for s in travel['before']['capture']['native']['sketches'] if s['id']==control],'actual independently authored control source')
 for observation in r['observations']:
  need(one([s['source'] for s in observation['before']['capture']['native']['sketches'] if s['id']==control],'retained independent source')==control_source,'unrelated authored control source remains exact')
 for row in r['refusals']:check_refusal(row)
 archives=[]
 for saved in r['saves']:
  p=directory/saved['savedFile'];info=read_archive(p);need(info['sha256']==saved['sha256'] and info['bytes']==saved['bytes'],'actual browser/server archive bytes');project=info['envelope']['project'];need(project['model']['history']==saved['before']['capture']['native']['history'] and project['model']['expressions']==saved['before']['capture']['native']['expressions'],'actual archived authored intent/formulas');actual={s['id']:json.loads(s['source']) for s in saved['before']['capture']['native']['sketches']};need({s['id']:s['data'] for s in project['sketches']}==actual,'exact all saved source, no dropped unrelated control');need(info['envelope']['drawings']==[r['definition']],'exact persisted genuine drawing definition');need(info['envelope']['manufacturing']==saved['before']['manufacturing']['metadata'],'exact material state');archives.append({'file':saved['savedFile'],'sha256':info['sha256'],'designRevision':info['manifest']['designRevision']})
 for opened in r['reopens']:
  for k in ('history','source','sketches','expressions','counters','presentation'):need(opened['before']['capture']['native'][k]==opened['opened']['capture']['native'][k],'actual fresh Open '+k)
  need(not opened['opened']['capture']['journal']['canUndo'] and not opened['opened']['capture']['journal']['canRedo'],'journal is honestly session-local')
 artifacts=[]
 for row in r['artifacts']:
  raw=(directory/row['savedFile']).read_bytes();need(sha(raw)==row['sha256'] and len(raw)==row['bytes'],'actual artifact bytes');e=row['dimensions'];operation={'step':'export-worker-step','3mf':'export-core-3mf','svg':'export-linked-part-drawing-svg'}[row['format']]
  issued=one([x for x in r['commands'] if x['command']==operation and x['args']==row['issued']],'actual unique export issuance');need(issued['result']==row['result'],'actual issuing result binds artifact');context=one([x for x in r['exportSets'] if x['label']==row['label']],'same accepted export set')['before'];need(row['issued']['revision']==context['host']['revision'],'actual issuing document revision')
  source_revision=context['manufacturing']['metadata']['revision'];need(re.fullmatch('sha256-[a-f0-9]{64}',source_revision),'actual accepted manufacturing source hash')
  if row['format']=='step':
   need(row['issued']['geometryRevision']==context['capture']['solids']['revision'] and row['issued']['engineRevision']==build and row['issued']['bodies']==[{'bodyId':row['binding']['counterbore']['outputId'],'featureId':row['binding']['counterbore']['featureId']}],'actual STEP target/build/geometry tuple');detail=inspect_step(raw,{**e,'volume':float(expected_volume(e))})
  elif row['format']=='3mf':detail=mesh(raw,e,row['binding'],build,source_revision[7:])
  else:detail=inspect_counterbore_svg(raw,e,r['definition'],context)
  artifacts.append({'file':row['savedFile'],'format':row['format'],'detail':detail})
 need([(x['name'],x['code']) for x in r['malformed']]==[('equal-depth','COUNTERBORE_STEP_NOT_INTERIOR'),('reversed-diameters','COUNTERBORE_DIAMETER_ORDER'),('wrong-entry','COUNTERBORE_ENTRY_UNRESOLVED')],'exact malformed semantics')
 negative_reports=[]
 for row in r['malformed']:
  need(row['error']['code']==row['code'] and not row['error']['committed'] and not row['error']['possiblyCommitted'] and row['before']==row['after'],'malformed Open preserves FULL accepted state/tokens/J/host/parameters/resources and is not committed')
  readback=row['negativeReadback'];need(readback['file']==row['own'] and readback['sha256']==row['sha256'],'actual server-read negative path/hash');proof=inspect_negative(directory/r['saves'][1]['savedFile'],directory/readback['savedFile'],r,row['name'],(read_archive,structure,rebuild,manifest_row,canonical,root_record));need(proof==row['negativeProof'],'independent after-whole exact negative/base metadata/string/compressed-span diff');negative_reports.append(proof)
 return {'status':'PASS','scope':'finite semantic centered counterbore, not all C06 or general interchange','observations':len(r['observations']),'nativePoints':points,'refusals':len(r['refusals']),'archives':archives,'artifacts':artifacts,'negativeArchives':negative_reports,'sourceMmBudget':5e-8,'nativeVolumeMm3Budget':1e-6,'nativeBoundsMmBudget':1e-6,'finiteBRepNotMeshAuthority':True}

if __name__=='__main__':
 if len(sys.argv)>1 and sys.argv[1]=='make-bad':print(json.dumps(make_bad(sys.argv[2],sys.argv[3],sys.argv[4])));sys.exit(0)
 directory=Path(sys.argv[1]);result=check(directory);(directory/'independent-oracle.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
