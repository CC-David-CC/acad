#!/usr/bin/env python3
"""Independent AFTER-whole source/equations/archive/STEP/controlled-mesh oracle.
Execute once through run-artifact-oracle.py after the complete public whole
PASS. Source coordinate50pm, Native observation incidence1e-6mm and derived
mesh.01mm budgets are distinct. No production geometry imports.
"""
import collections,copy,hashlib,io,json,math,os,subprocess,sys,zipfile
from decimal import Decimal,localcontext
from fractions import Fraction as Q
from pathlib import Path
from xml.etree import ElementTree as ET
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'analytic-preparation-refusals'))
from check_refusals import check_analytic_preparation_refusals
from truth import facts,frame,need,one,near,number,FINE
from mesh_oracle import inspect_mesh
from step_oracle import inspect_step
from negative_archive import inspect as inspect_negative
sha=lambda b:hashlib.sha256(b).hexdigest()
TYPE='WORKER_SELECTED_PROFILE_EXTRUDE_V2'
def reviewed_json(file):
 p=Path(file);need(p.is_file()and not p.is_symlink()and p.stat().st_size<=65536,'bounded actual reviewed config')
 def pairs(rows):
  r={}
  for k,v in rows:need(k not in r,'no duplicate JSON fields');r[k]=v
  return r
 return json.loads(p.read_text(),object_pairs_hook=pairs,parse_constant=lambda _:(_ for _ in ()).throw(ValueError('nonfinite JSON')))
def settled(s):
 q=s['ownership'];r=q['resources'];need(q['processing']is False and not r['cleanupFailed']and all(r[k]==0 for k in('candidates','accepted','mounts'))and r['owners']==r['detached'],'actual owned candidate/mount retirement');need(not s['lifecycle']['pipelineFailed']and not s['lifecycle']['cleanupFailed']and s['lifecycle']['pointer']==len(s['capture']['native']['history'])-1,'healthy accepted full tip')
def xy(p):return tuple(number(p[k])for k in('x','y'))
def endpoint(p,truth):
 need(set(p)=={'x','y'},'native source endpoint format')
 for k,v in zip(('x','y'),truth):near(p[k],v)
def normalized_selection(state):
 body=one(state['capture']['solids']['bodies'],'actual selected result');value=copy.deepcopy(body['selections'])
 if value.get('status')=='available':
  for key in ('edges','faces'):value['plan'][key].sort(key=lambda d:d['id'])
 return value
def connector_identity(row,source):
 state=row['before'];binding=row['binding'];kind=row['expected']['kind'];selection=normalized_selection(state)
 if kind=='full':need(selection=={'status':'unavailable','reason':'PROFILE_PROVENANCE_UNSUPPORTED'},'full-Arc periodic seam remains explicitly unsupported');need(row['connectorIdentity']==selection,'actual retained full-seam observation');return selection
 need(set(selection)=={'status','plan'}and selection['status']=='available','proper analytic source has actual available connector selections');plan=selection['plan'];need(set(plan)=={'version','featureId','regionId','scope','source','edges','faces','unresolved'}and plan['version']==1 and plan['featureId']==binding['profile']['featureId']and plan['regionId']==binding['regionId']and plan['scope']=='authored-source'and plan['source']=='prism-construction-history','exact actual source-bound V1 selection plan')
 objects={o['id']:o for o in source['objects']};active=[o for o in source['objects']if o['role']!='construction'];need(1<=len(active)<=170 and all(o['type']in('Arc','Segment')for o in active),'actual bounded analytic source members')
 if kind=='slot':
  slot=one([v for v in row['inspection']['slots']if v['slotId']==binding['slot']['slot']['slotId']],'actual original StraightSlot relation');m=slot['members'];pairs=[[(m[1],'b'),(m[2],'a')],[(m[2],'b'),(m[3],'a')],[(m[3],'b'),(m[4],'a')],[(m[4],'b'),(m[1],'a')]]
 elif kind=='notch':
  lines=[o for o in source['objects']if o['type']=='Segment'];arc=one([o for o in active if o['type']=='Arc'],'original notch Arc');need(len(lines)==5,'five original notch segments');l=[o['id']for o in lines];pairs=[[(l[0],'a'),(l[4],'b')],[(l[0],'b'),(l[1],'a')],[(l[1],'b'),(l[2],'a')],[(l[2],'b'),(arc['id'],'b')],[(arc['id'],'a'),(l[3],'a')],[(l[3],'b'),(l[4],'a')]]
 else:
  need(kind in('semicircle','major'),'closed frozen proper family');arc=one([o for o in active if o['type']=='Arc'],'original Arc');line=one([o for o in active if o['type']=='Segment'],'original chord');pairs=[[(arc['id'],'a'),(line['id'],'a')],[(arc['id'],'b'),(line['id'],'b')]]
 # Documented source namespace and read-only selection key contract are
 # independently reconstructed; no ID parsing or positive authoring input.
 qualified=lambda local:binding['faceId']+'/'+local
 key=lambda entity,role,origin:'worker-prism-selection:1:'+json.dumps([binding['profile']['featureId'],binding['regionId'],entity,role,origin],ensure_ascii=False,separators=(',',':'))
 edges=[];faces=[{'id':key('face',role,None),'role':role,'geometry':'plane'}for role in('first-cap','last-cap')]
 for obj in active:
  curve=qualified(obj['id']);edges.extend({'id':key('edge',role,curve),'role':role,'curveId':curve,'geometry':'circle'if obj['type']=='Arc'else'line'}for role in('first-boundary','last-boundary'));faces.append({'id':key('face','swept-boundary',curve),'role':'swept-boundary','curveId':curve,'geometry':'cylinder'if obj['type']=='Arc'else'plane'})
 endpoint_uses=collections.Counter()
 for pair in pairs:
  for local,endpoint_role in pair:
   need(local in objects and endpoint_role in('a','b')and set(objects[local]['data'][endpoint_role])=={'x','y'},'genuine original endpoint occurrence');endpoint_uses[(local,endpoint_role)]+=1
  roles=sorted([{'curveId':qualified(local),'endpoint':endpoint_role}for local,endpoint_role in pair],key=lambda x:(x['curveId'],x['endpoint']));incident=[x['curveId']for x in roles];need(incident[0]<incident[1],'distinct source curves, not a fabricated periodic selector');edges.append({'id':key('edge','connector',{'endpointRoles':roles}),'role':'connector','incidentCurveIds':incident,'endpointRoles':roles,'geometry':'line'})
 need(endpoint_uses==collections.Counter((o['id'],end)for o in active for end in('a','b')),'EVERY original source endpoint participates in exactly one authored junction');need(len(pairs)==len(active)and len({x['id']for x in edges})==len(edges),'all distinct source junction/boundary IDs, including two repeated curve-pair occurrences');need(plan['edges']==sorted(edges,key=lambda x:x['id'])and plan['faces']==sorted(faces,key=lambda x:x['id']),'complete actual cap/boundary/connector identity and exact role metadata')
 need(type(plan['unresolved'])is list and len(plan['unresolved'])<=1 and all(set(x)=={'kind','count','reason'}and x['kind']=='edge'and type(x['count'])is int and 1<=x['count']<=512 and x['reason']=='UNAUTHORED_KERNEL_EDGE'for x in plan['unresolved']),'unclaimed Native edges remain explicit, never invented selectors');need(all(len(x['id'])<=16384 for x in edges+faces)and len(json.dumps(plan,ensure_ascii=False,separators=(',',':')).encode())<=524288,'unchanged identity/observation bounds');need(row['connectorIdentity']==selection,'actual connector observation bound to retained source/Native state');return selection
def source_oracle(row):
 need(row['before']==row['after'],'all genuine Native/source reads preserve full accepted state');s=row['before'];settled(s);b=row['binding'];e=row['expected'];raw=s['capture']['native']['source'];source=json.loads(raw);i=row['inspection'];need(source['metadata']['boundaryFrame']==frame(e)==i['boundaryFrame'],'original source/cold read frame agrees with actual authored frame');objects={o['id']:o for o in source['objects']};need(len(objects)==len(source['objects'])and set(objects)=={c['id']for c in b['curves']},'exact source member IDs, no omitted extra/generated source');need(all(not st['generators']for st in source['stages']),'no hidden generator flattening');need(one([x for x in s['capture']['native']['sketches']if x['id']==b['control']['faceId']],'actual unrelated source')['source']==row['controlSource'],'unrelated control source exact');need({o['id']for o in i['objects']}==set(objects),'actual cold native members same IDs')
 if e['kind']=='slot':
  A=tuple(map(Q,e['a']));B=tuple(map(Q,e['b']));d=(B[0]-A[0],B[1]-A[1]);l2=sum(x*x for x in d);n,m=math.isqrt(l2.numerator),math.isqrt(l2.denominator);need(n*n==l2.numerator and m*m==l2.denominator,'frozen rational axis length, no rounded reference');L=Q(n,m);need(L>0,'nonzero source axis');R=Q(e['radius']);normal=(-d[1]/L,d[0]/L);off=lambda p,sgn:tuple(p[k]+sgn*R*normal[k]for k in range(2));ap,am,bp,bm=off(A,1),off(A,-1),off(B,1),off(B,-1);g=[(A,B,None),(bp,ap,None),(ap,am,A),(am,bm,None),(bm,bp,B)];slot=one([x for x in i['slots']if x['slotId']==b['slot']['slot']['slotId']],'actual native Slot observation');need(slot['members']==b['slot']['slot']['members']and len(slot['members'])==5,'real ordered axis+four member custody');axis=objects[slot['slotId']];need(axis['role']=='construction'and xy(axis['data']['a'])==A and xy(axis['data']['b'])==B,'EXACT requested original construction-axis endpoints');decl=source['stages'][slot['stage']]['constraints'][slot['index']];need(decl['typeId']=='StraightSlot'and decl['objects']==slot['members']and set(decl['constants'])=={'radius'}and Q(decl['constants']['radius'])==R,'actual original relation/literal radius')
  need(slot['canEdit']is True and slot['reason']is None and slot['radius']==e['radius'],'actual supported native Slot discovery')
  for j,(identity,truth)in enumerate(zip(slot['members'],g)):
   obj=objects[identity];need(obj['type']==('Arc'if j in(2,4)else'Segment'),'actual native class')
   for key,p in zip(('a','b','c'),truth):
    if p is not None:endpoint(obj['data'][key],p)
   if j in(2,4):need(obj['data']['branch']=='proper-ccw','actual explicit cap branch')
  pairs=[(slot['geometry'][1]['b']['pointId'],slot['geometry'][2]['a']['pointId']),(slot['geometry'][2]['b']['pointId'],slot['geometry'][3]['a']['pointId']),(slot['geometry'][3]['b']['pointId'],slot['geometry'][4]['a']['pointId']),(slot['geometry'][4]['b']['pointId'],slot['geometry'][1]['a']['pointId'])]
  for a,bid in pairs:need(any(c['typeId']=='PCoincident'and c['objects']in([a,bid],[bid,a])for st in source['stages']for c in st['constraints']),'genuine registered original junction, no coordinate welding')
 else:
  arcs=[o for o in objects.values()if o['type']=='Arc'];arc=one(arcs,'original authored Arc');R=Q(e.get('radius',5));kind=e['kind'];a,bp,c=((R,0),(-R,0),(0,0))
  if kind=='full':bp=a
  if kind=='major':bp=(0,-R)
  if kind=='notch':a,bp,c=(3,10),(7,10),(5,10)
  for key,p in zip(('a','b','c'),(a,bp,c)):endpoint(arc['data'][key],p)
  need(arc['data']['branch']==('full-ccw'if kind=='full'else'proper-ccw'),'saved branch is authoritative, no inferred full default');need(arc['data']['a']==arc['data']['b']if kind=='full'else arc['data']['a']!=arc['data']['b'],'full seam/proper separation exact')
  if kind in('semicircle','major'):
   line=one([o for o in objects.values()if o['type']=='Segment'],'actual chord');endpoint(line['data']['a'],a);endpoint(line['data']['b'],bp)
  if kind=='full':need(len(objects)==1,'full Arc sole loop with no invented seam line')
  if kind=='notch':
   lines=[o for o in objects.values()if o['type']=='Segment'];expected=[((0,0),(10,0)),((10,0),(10,10)),((10,10),(7,10)),((3,10),(0,10)),((0,10),(0,0))];need(len(lines)==5,'five actual notch boundary Segments')
   for obj,(a0,b0)in zip(lines,expected):endpoint(obj['data']['a'],a0);endpoint(obj['data']['b'],b0)
 for obj in objects.values():
  points=[p for p in i['points']if p['parentId']==obj['id']];keys=['a','b','c']if obj['type']=='Arc'else['a','b'];need(len(points)==len(keys)and len({p['id']for p in points})==len(keys),'actual owned endpoint IDs remain distinct, including full seam')
  # Equal full endpoints are intentionally indistinguishable by coordinate;
  # compare a multiset and never infer a/b from an opaque identifier suffix.
  remaining=list(points)
  for key in keys:
   target=obj['data'][key];matches=[p for p in remaining if all(abs(number(p[k])-number(target[k]))<=FINE for k in('x','y'))];p=one(matches,'owned native coordinate')if len(matches)==1 else matches[0]if matches else None;need(p is not None,'actual cold point within independently frozen coordinate budget');remaining.remove(p)
 need(all(c['admission']['state']in('accepted','redundant')for c in i['constraints']),'all actual retained original rows admitted')
 body=one(s['capture']['solids']['bodies'],'actual resulting body');producer=body['producer'];history=s['capture']['native']['history'];need(producer=={'index':producer['index'],'featureId':body['featureId'],'operationType':TYPE}and 0<=producer['index']<len(history)and history[producer['index']]['type']==TYPE and int(history[producer['index']]['params']['featureId'])==body['featureId'],'actual public producer cross-check against independent captured native history');p=history[producer['index']]['params'];need(p['faceId']==b['faceId']and p['regionId']==b['regionId']and p['depth']==e['depth']and p['engineRevision']==row['input']['engineRevision']and p['bodyPolicy']=='separate','ONE original authored profile intent, not fabricated body replay');need(body['id']==b['profile']['outputId']and body['featureId']==b['profile']['featureId'],'actual produced identity');
 if e['kind']=='full':need(set(body['selections'])=={'status','reason'}and body['selections']['status']=='unavailable'and type(body['selections']['reason'])is str and body['selections']['reason'],'actual legacy periodic seam selection remains unavailable; no fabricated plan/IDs')
 connector_identity(row,source);g=facts(e);m=body['metrics'];need(m['resultKind']=='single-solid'and m['solidCount']==1 and m['nativeValidity']['valid']is True,'actual bounded Native observation, not source accuracy certificate');near(m['nativeVolume'],float(g['volume']),Q(1,1000000))
 for key in('min','max'):
  for v,w in zip(m['nativeBounds'][key],g['bounds'][key]):near(v,w,FINE)
 need(row['input']['points']==g['points']and row['query']['points']==[{'point':p,'classification':c}for p,c in zip(g['points'],g['classes'])],'actual full material/void/boundary point vectors independently derived with Decimal100');need(row['query']['quality']=='native-re-evaluation-observation','actual Native observation quality')
 return{'case':row['case'],'label':row['label'],'sourceCoordinateBudgetMm':str(FINE),'volumeMm3':g['volume'],'actualProducer':producer}
def mesh(raw,item,config,out):
 ns={'m':'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'};need(0<len(raw)<=16777216,'actual archive artifact bound')
 with zipfile.ZipFile(io.BytesIO(raw))as z:
  need(len(z.infolist())==len({r.filename for r in z.infolist()})<=16 and z.testzip()is None and all(r.file_size<=8388608 for r in z.infolist()),'actual bounded CRC/unique 3MF entries');xml=z.read('3D/3dmodel.model')
 need(b'<!DOCTYPE'not in xml and b'<!ENTITY'not in xml,'no external XML input');root=ET.fromstring(xml);need(root.tag=='{'+ns['m']+'}model'and root.attrib['unit']=='millimeter','actual model namespace/canonical unit');metadata=lambda k:one(root.findall('m:metadata[@name="'+k+'"]',ns),'actual metadata '+k).text;revision=item['before']['manufacturing']['metadata']['revision'];need(revision.startswith('sha256-')and metadata('codi:SourceRevision')==revision[7:],'actual encoding revision separate from opaque issued document revision');provenance=json.loads(metadata('codi:ManufacturingBindings'));need(provenance['revision']==revision[7:],'actual accepted source provenance');part=one(provenance['parts'],'actual printed part');region=one(part['regions'],'actual material region');b=item['binding'];need(part['id']=='part'and region['id']=='main'and region['bodyId']==b['profile']['outputId']and region['featureId']==b['profile']['featureId']and region['materialId']=='pla'and region['appearanceId']=='blue'and region['engineRevision']==item['issued'].get('engineRevision',b['profile']['engineRevision']),'source/body/material provenance')
 resources=root.find('m:resources',ns);objects={x.attrib['id']:x for x in resources.findall('m:object',ns)};need(len(objects)==len(resources.findall('m:object',ns))<=16,'unique bounded resources');leaves=[];visited=set();identity=[1,0,0,0,1,0,0,0,1,0,0,0]
 def visit(key):
  need(key in objects and key not in visited,'actual acyclic component identity');visited.add(key);o=objects[key];m=o.find('m:mesh',ns)
  if m is not None:need(o.find('m:components',ns)is None,'no mixed mesh/components');leaves.append((key,o,m));return
  c=o.find('m:components',ns);need(c is not None and len(c)>0,'actual component record')
  for r in c:need(set(r.attrib)<= {'objectid','transform'}and('transform'not in r.attrib or list(map(float,r.attrib['transform'].split()))==identity),'no hidden transform or component fields');visit(r.attrib['objectid'])
 build=one(list(root.find('m:build',ns)),'one actual build item');need(set(build.attrib)<= {'objectid','transform'}and('transform'not in build.attrib or list(map(float,build.attrib['transform'].split()))==identity),'actual identity build');visit(build.attrib['objectid']);key,obj,m=one(leaves,'actual original mesh');need(visited==set(objects),'no unused extra model object');need(key==str(region['meshResourceId'])and obj.attrib['pid']==str(region['materialResourceId'])and obj.attrib['pindex']==str(region['materialIndex'])and build.attrib['objectid']==str(part['buildResourceId']),'actual resource/material reciprocity');need(one(list(objects[str(region['componentResourceId'])].find('m:components',ns)),'actual region component').attrib['objectid']==key,'actual component points to mesh');material=resources.find('m:basematerials[@id="'+str(region['materialResourceId'])+'"]',ns);need(material is not None and 0<=region['materialIndex']<len(material)and material[region['materialIndex']].attrib['displaycolor'].upper()=='#3366FF','actual blue material');vs=list(m.find('m:vertices',ns));ts=list(m.find('m:triangles',ns));need(all(v.tag=='{'+ns['m']+'}vertex'and set(v.attrib)=={'x','y','z'}and len(v)==0 and not(v.text or'').strip()for v in vs),'strict actual vertex grammar');need(all(t.tag=='{'+ns['m']+'}triangle'and set(t.attrib)=={'v1','v2','v3'}and len(t)==0 and not(t.text or'').strip()for t in ts),'no per-triangle material overrides/hidden fields');vertices=[[float(v.attrib[k])for k in('x','y','z')]for v in vs];triangles=[[int(t.attrib[k])for k in('v1','v2','v3')]for t in ts];return inspect_mesh(vertices,triangles,item['expected'],config,out)
def check(directory,configuration):
 directory=Path(directory);r=json.loads((directory/'receipt.json').read_text());need(r['status']=='PASS'and r['ownedContextsRetired']and r['sharedBrowserDisconnectedOnly']and not r.get('pendingWrite'),'whole terminal PASS/settled own custody first');need(r['sourcePins']==r['sourcePinsAfter'],'executed sources immutable');roster=reviewed_json(Path(__file__).with_name('producer-roster.json'));names=['CONTRACT.md','README.md','desktop-driver.mjs','example.mjs','truth.py','check.py','mesh_oracle.py','step_oracle.py','negative_archive.py','run-artifact-oracle.py','producer-roster.json'];expected={('acceptance','test/analytic-arc-profile-public-workflow/'+n)for n in names}|{(repo,p)for repo,paths in roster.items()for p in paths};need(len(r['sourceSnapshots'])==len(expected)and{(s['repository'],s['relative'])for s in r['sourceSnapshots']}==expected,'complete runtime/acceptance/transitive helper/source roster')
 for s in r['sourceSnapshots']:
  raw=(directory/s['file']).read_bytes();need(sha(raw)==s['sha256']==r['sourcePins'][s['repository']+':'+s['relative']],'exact actual frozen snapshot');commit={'acceptance':r['acceptanceSource'],'core':r['source'],'desktop':r['hostSource'],'native':r['nativeSource']}[s['repository']];need(s['commit']==commit,'separate actual producer vs acceptance identity');repo=os.environ.get('CODI_ORACLE_'+s['repository'].upper()+'_GIT',s['root']);g=subprocess.run(['git','-C',repo,'show',commit+':'+s['relative']],capture_output=True,check=True);oid=subprocess.run(['git','-C',repo,'rev-parse',commit+':'+s['relative']],capture_output=True,text=True,check=True);need(g.stdout==raw and oid.stdout.strip()==s['gitBlobOID'],'exact Git blob binding')
 need([c['name']for c in r['cases']]==['semicircle','slot','full','notch','major','open-repair','multiple-loops','generator','tiny-proper','tiny-proper-continuation','tiny-full','world-height-erasure'],'complete ordinary and explicitly unsupported source boundaries');reports=[source_oracle(o)for o in r['observations']];preparation_refusals=check_analytic_preparation_refusals(r['preparationRefusals'],r['commands']);
 for case in r['cases']:
  observations=[o for o in r['observations']if o['case']==case['name']]
  if not observations:continue
  baseline=None
  for o in observations:
   need(o['controlSource']==observations[0]['controlSource']and o['binding']['faceId']==case['binding']['faceId']and [c['id']for c in o['binding']['curves']]==[c['id']for c in case['binding']['curves']],'stable original/control IDs throughout each whole case');source=json.loads(o['before']['capture']['native']['source']);intent=copy.deepcopy(source);intent['metadata']['boundaryFrame']='<actual separately checked frame>'
   for obj in intent['objects']:obj['data']={'branch':obj['data']['branch']}if obj['type']=='Arc'else{}
   for stage in intent['stages']:
    for c in stage['constraints']:
     if c['typeId']=='StraightSlot':c['constants']['radius']='<actual separately checked literal>'
   if baseline is None:baseline=intent
   need(intent==baseline,'all unrelated original equations/roles/stages/constants/nongeometry exact across edits/travel/Open')
 need(len(reports)>=40,'complete observed creation/edit/travel/reopen/refusal continuation, not a single happy snapshot');groups={name:[(i,o)for i,o in enumerate(r['observations'])if o['case']==name]for name in{v['case']for v in r['observations']}};need({v['case']for v in r['connectorBaselines']}==set(groups)and len(r['connectorBaselines'])==len(groups),'one actual connector baseline per positive case')
 for baseline in r['connectorBaselines']:
  first,initial=groups[baseline['case']][0];need(baseline['observationIndex']==first and baseline['identity']==initial['connectorIdentity'],'baseline bound to first actual source/Native observation');need(all(o['connectorIdentity']==baseline['identity']for _,o in groups[baseline['case']]),'SAME endpoint-aware IDs/metadata across every real edit/travel/Open, independent of traversal or Native slots')
 labels={o['label']for o in r['observations']};need({'Actual shared four-endpoint radius6 edit','Radius Undo','Radius Redo','Reopened actual radius7','Actual 3-4-5 rotated Slot','Actual reversed Slot axis','Return declared axis before cardinal artifact domain','Reopened Slot30 radius5','Full seam source-frame translation','Full frame Undo','Full frame Redo','Reopened full frame edit','Major proper Arc remains major, not complementary minor','Genuine open endpoint repair healthy continuation'}<=labels,'all meaningful public edit/branch/travel phases')
 for c in r['creationTravels']:
  p,s,u,d=[c[k]for k in('parents','created','undone','redone')];expected=copy.deepcopy(p['capture']['native']['counters']);expected['featureId']+=1;need(s['capture']['native']['counters']==s['ownership']['counters']==u['capture']['native']['counters']==expected and u['capture']['native']['history']==p['capture']['native']['history']and u['capture']['native']['sketches']==p['capture']['native']['sketches']and u['capture']['solids']['bodies']==[]and d['capture']['native']==s['capture']['native'],'genuine one-feature creation Undo/Redo/highwater/SAME source and identity')
 for c in r['creationTravels']:need(normalized_selection(c['created'])==normalized_selection(c['redone']),'actual creation Undo/Redo reissues SAME connector/cap/boundary source identities')
 need(len(r['creationTravels'])==6,'all six actual positive creations get genuine journal travel');need(r['noop']['before']==r['noop']['after']and r['noop']['result']['changed']is False,'no-op publishes no source/J/token changes')
 for t in r['travels']:need(t['before']['capture']['native']['counters']==t['after']['capture']['native']['counters'],'travel preserves allocator highwater')
 for d in r['discoveries']:
  need(d['before']==d['after'],'discovery is read-only')
  if d['kind']=='catalog-isolation':need(sum(b['engineRevision']==r['engineRevision']for b in d['selected']['availableBuilds'])==1 and d['selected']['analyticProfileVersion']==1 and set(d['others'])=={'inspect-worker-lofts','inspect-worker-sweeps','inspect-worker-revolves'}and all(not any(b['engineRevision']==r['engineRevision']for b in v['builds'])for v in d['others'].values()),'actual analytic selected discovery once; real unrelated operation discoveries callable and isolated')
  if d['kind']=='mismatched-cohort':need(d['other']['engineRevision']!=r['engineRevision']and d['other']in d['selected']['availableBuilds']and any(v['engineRevision']==d['other']['engineRevision']for v in d['lofts']['builds'])and d['different']['ready']is False and d['different']['creationReason']=='ENGINE_REVISION_MISMATCH','genuine advertised mismatched cohort refuses without fake availability authority')
 need(collections.Counter(d['kind']for d in r['discoveries'])=={'catalog-isolation':6,'mismatched-cohort':1,'unsupported-source':3},'whole discovery scope exact')
 expected_refusals={'Actually advertised other cohort cannot read this analytic history':'ENGINE_REVISION_MISMATCH','Advertised different point cohort cannot observe this actual body':'UNSUPPORTED_TARGET','Native 100pm builder-path proper boundary remains unqualified':'ANALYTIC_PROFILE_UNQUALIFIED','Native stored vertex/full seam boundary remains unqualified':'ANALYTIC_PROFILE_UNQUALIFIED','World transform cannot erase requested positive height':'ANALYTIC_PROFILE_UNQUALIFIED'}
 for label,code in expected_refusals.items():need(one([q for q in r['refusals']if q['label']==label],'required genuine refusal '+label)['error']['code']==code,'exact source-derived refusal code')
 need(len(r['refusals'])==11 and {q['label']for q in r['refusals']if q['label'].startswith('Public Arc admission ')}=={'Public Arc admission '+s for s in('zero radial','collapsed proper','mismatched full seam','unknown authored branch','nonfinite JSON number')},'all source-domain and stale/cohort/native precision refusal controls retained')
 for q in r['refusals']:
  need(q['error']and not q['error']['committed']and not q['error']['possiblyCommitted'],'real noncommitted refusal');s,t=q['before'],q['after'];settled(t)
  if not q['allocation']:need(s==t,'noncandidate/preflight refusal FULL state exact');continue
  need(q['case']in('tiny-proper','tiny-full')and q['error']['code']=='ANALYTIC_PROFILE_UNQUALIFIED','ONLY actual native builder-path uncertainty may reserve one ID');x=copy.deepcopy(s)
  for counts in(x['capture']['native']['counters'],x['ownership']['counters']):counts['featureId']+=1
  need(t['lifecycle']['epoch']==s['lifecycle']['epoch']+1 and t['host']['revision']!=s['host']['revision']and t['capture']['solids']['revision']!=s['capture']['solids']['revision'],'one failed actual candidate changes currentness, no accepted model')
  for item in(s,t):need(item['manufacturing']['revision']==item['host']['revision']==item['drawing']['revision']and item['drawing']['geometryRevision']==item['capture']['solids']['revision']and item['physical']['revision']==item['frames']['revision']==item['capture']['journal']['revision']and item['capture']['journal']['revision'].endswith(':'+item['host']['revision']),'actual same-document currentness aliases')
  for path in [('lifecycle','epoch'),('host','revision'),('capture','solids','revision'),('capture','journal','revision'),('manufacturing','revision'),('drawing','revision'),('drawing','geometryRevision'),('physical','revision'),('frames','revision')]:
   a,b=x,t
   for k in path[:-1]:a,b=a[k],b[k]
   a[path[-1]]=b[path[-1]]
  need(x==t,'all other source/body/J/file/owner fields exact after acknowledged native refusal')
 need(one([x for x in r['refusals']if x['label']=='Real old endpoint revision is stale'],'real old request')['error']['name']=='AbortError','actual stale sketch contract, not invented code');continuation=r['refusalContinuation'];need(continuation['created']['featureId']==continuation['floor']+1 and continuation['profile']['featureId']==continuation['floor']+3,'genuine same-project source/control/profile allocations skip failed ID');need(continuation['after']['capture']['native']['history'][:len(continuation['before']['capture']['native']['history'])]==continuation['before']['capture']['native']['history']and not any(int(x['params']['featureId'])==continuation['floor']for x in continuation['after']['capture']['native']['history']),'retained original source history, no reused refused feature');
 for old in continuation['before']['capture']['native']['sketches']:need(one([x for x in continuation['after']['capture']['native']['sketches']if x['id']==old['id']],'actual retained unrelated source')['source']==old['source'],'all prior source bytes exact across healthy Native continuation')
 stages=[('semicircle',v)for v in('baseline','edited','final')]+[('slot',v)for v in('baseline','edited','final')]+[('full',v)for v in('baseline','edited','final')]+[('notch','final')];need([(s['case'],s['label'])for s in r['saves']]==[(s['case'],s['label'])for s in r['reopens']]==stages,'ALL ten native cycles, including all three required for ordinary Arc/Slot/full')
 archives=[]
 for saved,opened in zip(r['saves'],r['reopens']):
  info=read_archive(directory/saved['savedFile']);need(info['sha256']==saved['sha256']and info['bytes']==saved['bytes'],'actual server native bytes');native=saved['before']['capture']['native'];model=info['envelope']['project']['model'];need(model['history']==native['history']and model['expressions']==native['expressions']and model['counters']==native['counters'],'original authoritative source/history/counters');need(info['rawSketches']=={s['id']:s['source']for s in native['sketches']},'ALL actual source/control bytes exact');need(info['envelope']['manufacturing']==saved['before']['manufacturing']['metadata'],'actual persisted material source binding');need(saved['before']['capture']==saved['after']['capture'],'Save publishes no geometry/J copy')
  for k in('history','source','sketches','expressions','counters','presentation'):need(opened['opened']['capture']['native'][k]==native[k],'fresh Open exact '+k)
  need(normalized_selection(opened['opened'])==normalized_selection(saved['before']),'actual .cad source reconstruction reissues exact endpoint-aware connector/cap/boundary IDs; no saved Native ordinals');need(not opened['opened']['capture']['journal']['canUndo']and not opened['opened']['capture']['journal']['canRedo'],'fresh Open does not fabricate session J');archives.append({'file':saved['savedFile'],'sha256':info['sha256'],'designRevision':info['manifest']['designRevision']})
 need(all(w['username']==one([c for c in r['cases']if c['name']==w['case']],'actual own case')['username']and w['windowId']in{str(c['windowId'])for c in r['cases']if c['name']==w['case']}|{str(c['windowId'])for c in r['reopens']if c['case']==w['case']}for w in r['writes']),'actual own post-launch actor custody across fresh contexts; no global-window identity assumption');need(len(r['writes'])==33 and all(w['phase']=='settled'and'error'not in w and type(w['windowId'])is str and w['windowId']and w['readback']['sha256']==sha((directory/w['readback']['savedFile']).read_bytes())for w in r['writes']),'EVERY 10 Save/20 export/3 own fixture submitted write acknowledged and hashed browser-server readback');need(len(r['malformed'])==3,'all three own saved-full branch controls');base=one([s for s in r['saves']if s['case']=='full'and s['label']=='final'],'actual full base')
 for q in r['malformed']:need(q['before']==q['after']and q['error']['code']==q['code']=='INVALID_ARC_BRANCH'and not q['error']['committed']and not q['error']['possiblyCommitted'],'actual pre-adoption branch refusal preserves FULL accepted model/file/J/owners');need(inspect_negative(directory/base['savedFile'],directory/'malformed'/(q['name']+'.cad'),r,q['name'])==q['proof'],'independent negative-only original archive delta')
 need(collections.Counter((v['case'],v['label'],v['format'])for v in r['artifacts'])==collections.Counter((c,l,f)for c,l in stages for f in('step','3mf')),'ALL20 real STEP/controlled3MF artifacts');config=reviewed_json(configuration);need(set(config)=={'global','planar','output_dir'},'closed reviewed validator invocation config');output=Path(config['output_dir']);need(output.is_absolute()and not output.exists(),'NEW owned complete artifact validator output');output.mkdir(parents=False);validator={k:config[k]for k in('global','planar')};artifacts=[]
 for n,item in enumerate(r['artifacts']):
  raw=(directory/item['savedFile']).read_bytes();need(len(raw)==item['bytes']and sha(raw)==item['sha256'],'actual complete artifact bytes');before=item['before'];need(item['issued']['revision']==before['host']['revision']and item['result']['sourceRevision']==before['host']['revision']and item['result']['committed']is True and item['result']['persistence']=='browser','real public issued/result source revision, not fabricated revision field');observation=one([o for o in r['observations']if o['case']==item['case']and o['label']=='Export-bound '+item['label']],'actual export-bound Native/source observation');need(observation['before']['capture']['native']==before['capture']['native']and observation['binding']==item['binding']and observation['expected']==item['expected'],'same original observed model/source/identity')
  if item['format']=='step':need(item['issued']['geometryRevision']==before['capture']['solids']['revision'],'actual STEP geometry revision');report=inspect_step(raw,item['expected'])
  else:report=mesh(raw,item,validator,output/('artifact-'+str(n)))
  artifacts.append({'file':item['savedFile'],'sha256':item['sha256'],'format':item['format'],'report':report})
 return{'status':'PASS','scope':'finite genuine analytic Arc/Slot prism shared workflow; source/equations/Native observations/ten native cycles/actual finite STEP/complete indexed mesh proof; broader Arc holes/arrangements/kernel small-scale accuracy remain OPEN','sourceCoordinateBudgetMm':str(FINE),'sourceCoordinateBudgetPm':50,'nativeBoundsBudgetMm':str(FINE),'nativeVolumeBudgetMm3':'1e-6','meshDeflectionMm':'.01','observations':reports,'preparationRefusals':preparation_refusals,'archives':archives,'artifacts':artifacts,'unqualifiedBoundaries':['100pm default builder-path endpoint/full seam and stored vertex tolerances','world-frame erased height','multiple loops/holes','native generators','unconfigured optional-cohort fixture not exercised by mounted whole']}
if __name__=='__main__':
 need(len(sys.argv)==4,'WHOLE REVIEWED_VALIDATOR_CONFIG NEW_FIRST_JSON');output=Path(sys.argv[3]);need(not output.exists(),'preserve FIRST oracle')
 try:
  with localcontext()as ctx:ctx.prec=100;result=check(sys.argv[1],sys.argv[2])
 except Exception as error:result={'status':'ORACLE_REFUSED','error':str(error),'geometryJudgment':'no certification; retain whole evidence unchanged'};output.write_text(json.dumps(result,indent=2)+'\n');raise
 output.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
