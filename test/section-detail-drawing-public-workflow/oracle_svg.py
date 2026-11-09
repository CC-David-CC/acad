"""AFTER-WHOLE XML/paper geometry and physical-fact oracle (stdlib only).

No production renderer/provider import. Presentation paths are reconciled with
independently checked observed analytic geometry, not metadata alone.
"""
import json,math,re,hashlib,xml.etree.ElementTree as ET
from oracle_geometry import chord_certificate

def physical_facts(row,objects,bore,iso):
 need,near,vector,one=iso.need,iso.near,iso.vector,iso.one
 d,e,b,read=row['definition'],row['dimensions'],row['binding'],row['read'];o=read['observation'];bore.authored(d)
 need(d['datum']=={'featureId':b['profile']['featureId'],'faceId':b['faceId'],'regionId':b['regionId']},'actual original datum identity')
 need([v['basis'] for v in d['views']] in (['top','front','right','isometric'],['top','front','right','isometric','bore-center-section','detail']) and [v['viewId'] for v in d['views']]==[v['basis'] if v['basis']!='bore-center-section' else 'section' for v in d['views']],'exact actual four/six authored view roles')
 need([x['dimensionId'] for x in d['dimensions']]==['width','height','depth','center-diameter']+(['section-depth','detail-diameter'] if len(d['views'])==6 else []),'exact original and added physical dimension identities')
 need(d['target']=={'featureId':row['parent']['featureId'],'operationType':'WORKER_SOLID_BOOLEAN_V1' if row['mode']=='cover' and not row['consumed'] else 'WORKER_SOLID_EDGE_TREATMENT_V1','engine':'occ','engineRevision':bore.BUILD,'output':'complete-native-result'},'actual authored target producer, not latest body') if not row['consumed'] else None
 need([x['dimensionId'] for x in o['dimensions']]==[x['dimensionId'] for x in d['dimensions']],'ordered complete physical dimension membership')
 for v in d['views']:
  if v['basis'] not in ('detail','bore-center-section'):continue
  r=v['focus'] if v['basis']=='detail' else v['hole'];slot='MIN_X_MIN_Y' if v['basis']=='detail' else 'center';owner=b['corners']['featureId'] if v['basis']=='detail' else b['center']['featureId']
  actual=one([x['reference'] for x in row['discovery']['observation']['bores'] if x['reference']['featureId']==owner and x['reference']['slot']==slot],'actual discovered section/detail source reference')
  if row['unresolved'] and row['mode']=='normal':actual={**actual,'featureId':b['fillet']['featureId']}
  need(r==actual,'exact authored actual bore locator, no ordinal/ID parsing/follow-latest')
  frame=one([x for x in o['viewFrames'] if x['viewId']==v['viewId']],'derived frame')['frame']
  if frame is not None:
   center=bore.centers(e)[1 if v['basis']=='detail' else 0];vector(frame['origin'],[*center,0]);axes=([1,0,0],[0,1,0],[0,0,1]) if v['basis']=='detail' else ([1,0,0],[0,0,1],[0,-1,0])
   for key,value in zip(('u','v','n'),axes):vector(frame[key],value,1e-12)
  else:need(row['unresolved'] and row['mode']=='normal','no fabricated missing derived frame')
 def ref_index(r):
  need(r['sourceFeatureId']==b['profile']['featureId'] and r['faceId']==b['faceId'] and r['regionId']==b['regionId'] and r['geometry']=='cylinder','authored bore source identity')
  if r['slot']=='center': need(r['featureId']==b['center']['featureId'],'actual center feature');return 0
  need(r['featureId']==b['corners']['featureId'] and r['slot'] in bore.SLOTS,'actual corner feature/slot');return bore.SLOTS.index(r['slot'])+1
 def source_point(r):
  need(r=={'kind':'source-point','featureId':b['profile']['featureId'],'faceId':b['faceId'],'regionId':b['regionId'],'curveId':r['curveId'],'curveType':'segment','point':r['point']} and r['curveId'] in objects and r['point'] in ('a','b'),'source endpoint actual owner/type')
  p=objects[r['curveId']]['data'][r['point']];return[p['x'],p['y'],0]
 for a,f in zip(d['dimensions'],o['dimensions']):
  need(f['dimensionId']==a['dimensionId'] and f['kind']==a['kind'],'dimension row identity')
  if f['status']=='unresolved':
   need(row['unresolved'] and f['value'] is None and f['quality'] is None and f['anchors']==[] and isinstance(f['reason'],str) and f['reason'],'no cached measurement/anchors for unresolved dimension')
   need((row['mode']=='cover' and a['kind']=='plane-distance') or (row['mode']=='normal' and a['dimensionId']=='detail-diameter' and a['hole']['featureId']==b['fillet']['featureId']),'only actual finite missing refs may be unresolved');continue
  need(f['status']=='available' and f['reason'] is None and len(f['anchors'])==2,'actual available dimension facts')
  if a['kind']=='source-distance':
   p,q=source_point(a['from']),source_point(a['to']);[vector(x,y,5e-8) for x,y in zip(f['anchors'],(p,q))];near(f['value'],abs(q[0 if a['axis']=='datum-x' else 1]-p[0 if a['axis']=='datum-x' else 1]),5e-8);need(f['quality']=='solved-source-datum','source component, not line length')
  elif a['kind']=='plane-distance':
   descriptors=row['before']['capture']['solids']['bodies'][0]['selections']['plan']['faces']
   for r,role in ((a['first'],'first-cap'),(a['second'],'last-cap')):
    one([p for p in descriptors if p['id']==r['selectionId'] and p['originFeatureId']==r['originFeatureId']==b['profile']['featureId'] and p['geometry']=='plane' and p['role']==role],'actual named cap membership')
   p,q=f['anchors'];near(p[2],0);near(q[2],e['depth']);vector(p[:2],q[:2]);near(f['value'],abs(q[2]-p[2]));need(f['quality']=='native-brep-analytic','Native cap measurement')
   # Native chooses a genuine matching cap vertex; do not invent a preferred
   # source corner or replace those anchors with a nominal datum line.
   support=bore.supports(e,row['filletCorner'],'normal',[1,0,0],[0,1,0])
   need(any(bore.on_curve(p[:2],c) for c in support),'actual finite material-cap boundary anchor')
  else:
   need(a['kind']=='hole-diameter','finite fixture dimension kind');i=ref_index(a['hole']);cx,cy=bore.centers(e)[i];r=(e['cornerDiameter'] if i else e['centerDiameter'])/2
   vector(f['anchors'][0],[cx-r,cy,e['depth']/2]);vector(f['anchors'][1],[cx+r,cy,e['depth']/2]);near(f['value'],2*r);need(f['quality']=='native-prism-cut-lineage','actual finite cylinder diameter')
 expected_ids=['corner-mark-'+str(i) for i in range(4)]+['center-line','baseline-x','ordinate-y','four-thru']
 need([a['annotationId'] for a in d['annotations']]==expected_ids and [a['annotationId'] for a in o['annotations']]==expected_ids,'all eight exact physical annotation identities')
 for a,f in zip(d['annotations'],o['annotations']):
  need(f['kind']==a['kind'],'annotation kind identity');refs=[a['hole']] if a['kind']=='bore-center' else a['holes'];indices=[ref_index(r) for r in refs]
  if a['kind']!='bore-center':need(indices==[1,2,3,4],'canonical real four-hole source membership')
  if f['status']=='unresolved':
   need(row['mode']=='cover' and a['kind']=='hole-callout' and f['reason']=='DRAWING_THROUGH_EXTENT_UNQUALIFIED' and f['facts'] is None and f['quality'] is None,'only actual roof invalidates THRU, no fictitious measured group');continue
  need(f['status']=='available' and f['reason'] is None and f['quality']=='native-prism-cut-lineage','current actual physical annotation');v=f['facts']
  if a['kind']=='bore-center':
   i=indices[0];cx,cy=bore.centers(e)[i];vector(v['center'],[cx,cy,0]);near(v['diameter'],e['cornerDiameter'] if i else e['centerDiameter']);vector(v['ends'][0],[cx,cy,0]);vector(v['ends'][1],[cx,cy,e['depth']])
  elif a['kind']=='hole-callout':
   need(v['count']==4 and v['through'] is True and row['mode']=='normal','actual THRU, never nominal');near(v['diameter'],e['cornerDiameter']);need(len(v['centers'])==4,'complete measured group');[vector(p,[*c,0]) for p,c in zip(v['centers'],bore.centers(e)[1:])]
  else:
   key='coordinates' if a['kind']=='ordinate' else 'values';values=[c[0 if a['axis']=='datum-x' else 1] for c in bore.centers(e)[1:]];vector(v[key],values if a['kind']=='ordinate' else list(map(abs,values)));need(len(v['anchors'])==4,'complete actual datum anchors')
   for pair,c in zip(v['anchors'],bore.centers(e)[1:]):
    vector(pair[1],[*c,0]);vector(pair[0],[0,c[1],0] if a['axis']=='datum-x' else [c[0],0,0])

def verify_svg(root,item,row,facts,iso,bore):
 need,near,vector,one=iso.need,iso.near,iso.vector,iso.one;NS=iso.NS
 raw=(root/item['savedFile']).read_bytes();need(hashlib.sha256(raw).hexdigest()==item['sha256'] and len(raw)==item['byteLength'] and item['before']==item['after'],'actual settled immutable SVG bytes')
 d=item['definition'];read=row['read'];o=read['observation'];xml=ET.fromstring(raw)
 need(xml.tag=='{'+NS['s']+'}svg' and xml.attrib=={'width':'594mm','height':'420mm','viewBox':'0 0 594 420'},'physical SVG mm sheet')
 need([n.tag.split('}')[-1] for n in xml]==['title','metadata','defs','rect','g','g'],'closed SVG structure, no foreign image/script/extra geometry')
 for n in xml.iter():need(not (set(n.attrib)&{'transform','style','opacity','display','visibility','clip-path','mask'}),'no hidden/transformed/unverified geometry')
 meta=json.loads(one(xml.findall('s:metadata',NS),'metadata').text)
 need(meta=={'version':1,'drawingId':d['drawingId'],'revision':item['before']['host']['revision'],'geometryRevision':item['before']['drawing']['geometryRevision'],'quality':o['quality'],'status':read['status'],'definitionVersion':3,'viewCount':len(d['views']),'projection':'source-relative-isometric-v1','annotationFacts':o['annotations'],'annotationRole':'derived-native-bore-reference','ordinateRole':'signed-datum-coordinate','curvePresentationTolerancePaperMm':.02,'dimensionRole':'reference'},'exact current source/read/units/physical metadata')
 need(one(xml.findall('s:title',NS),'title').text==d['title'],'authored title')
 rect=one(xml.findall('s:rect',NS),'paper background');need(rect.attrib=={'width':'100%','height':'100%','fill':'white'},'unobscured white paper')
 geometry,textgroup=xml.findall('s:g',NS);need(geometry.attrib=={'fill':'none','stroke':'#111','stroke-width':'.25'} and textgroup.attrib=={'font-family':'sans-serif','font-size':'3'},'visible geometry/legible physical typography')
 paths=list(geometry);texts=list(textgroup);need(all(p.tag=='{'+NS['s']+'}path' for p in paths) and all(t.tag=='{'+NS['s']+'}text' for t in texts),'closed path/text roles')
 used=set();usedtexts=set();defs=one(xml.findall('s:defs',NS),'defs');need(defs.attrib=={},'bare defs cannot alter inherited hatch presentation');patterns=list(defs);usedpatterns=set()
 def ps(node,moves=(0,),closed=False):
  value=node.get('d','');need(not re.search(r'[^MLZ0-9eE+.,\s-]',value),'only finite supported M/L/Z geometry')
  need(value.count('Z')==int(closed) and value.rstrip().endswith('Z')==closed,'actual finite closed/open path grammar');value=value[:-1].rstrip() if closed else value
  tokens=iso.TOKEN.findall(value);need(len(tokens)%3==0 and len(tokens)>=6,'explicit complete M/L coordinate commands')
  for i in range(0,len(tokens),3):need(tokens[i]==('M' if i//3 in moves else 'L') and tokens[i+1] not in ('M','L') and tokens[i+2] not in ('M','L'),'actual path connectivity/subpath grammar')
  return iso.path_points(value)
 def pathcheck(node,expected,attrs,closed=False,moves=(0,)):
  need(set(node.attrib)==set(attrs)|{'d'} and all(node.get(k)==v for k,v in attrs.items()),'exact path role/style');p=ps(node,moves,closed);need(len(p)==len(expected),'complete path membership');[vector(x,y) for x,y in zip(p,expected)];used.add(id(node))
 def textcheck(position,value,attrs={}):
  matches=[t for t in texts if id(t) not in usedtexts and (t.text or '')==value and math.dist([float(t.get('x','nan')),float(t.get('y','nan'))],position)<=1e-6]
  node=one(matches,'exact full physical label '+value);need(not list(node) and set(node.attrib)==set(attrs)|{'x','y'} and all(node.get(k)==v for k,v in attrs.items()),'full visible text role/style');usedtexts.add(id(node));return node
 frames={v['viewId']:v.get('frame') for v in o['viewFrames']};sheet=d['sheet']['scale']['numerator']/d['sheet']['scale']['denominator']
 def scale(v):return v['scale']['numerator']/v['scale']['denominator'] if v['basis']=='detail' else sheet
 def paper(v,p):return[v['paperOrigin'][0]+scale(v)*p[0],v['paperOrigin'][1]-scale(v)*p[1]]
 def project(v,p):
  f=frames[v['viewId']];q=[p[i]-f['origin'][i] for i in range(3)];return paper(v,[sum(q[i]*f[k][i] for i in range(3)) for k in ('u','v')])
 def caption_bounds(view):
  # Independent paper-space bounds of already checked authentic geometry.
  # Conic coefficients are reconciled against actual source/body supports by
  # observation(); full ellipse envelopes conservatively contain finite trims.
  role=view['basis'];points=[]
  if role=='detail':
   hw,hh=view['aperture']['halfWidth'],view['aperture']['halfHeight'];points=[[-hw,-hh],[hw,hh]]
  elif role=='bore-center-section':
   points=[p for patch in facts['section'][0] for pair in patch for p in pair]
  else:
   for curve in facts[role]:
    if curve['line']:points.extend(iso.evaluate(curve,t) for t in curve['range'])
    else:
     radii=[math.hypot(curve['a'][j],curve['b'][j]) for j in (0,1)]
     points.extend([[curve['c'][j]+sign*radii[j] for j in (0,1)] for sign in (-1,1))
  if not points:return None
  mapped=[paper(view,p) for p in points];need(all(all(math.isfinite(z) for z in p) for p in mapped),'finite authentic caption envelope')
  return [min(p[0] for p in mapped),min(p[1] for p in mapped),max(p[0] for p in mapped),max(p[1] for p in mapped)]
 textcheck([8,8],d['title'] or d['drawingId'])
 for index,v in enumerate(d['views']):
  role=v['basis'];observed=one([p for p in read['views'] if p['viewId']==v['viewId']],'view');group=[p for p in paths if p.get('data-view-id')==v['viewId']]
  if observed['status']!='available':
   need(not group and frames[v['viewId']] is None,'no stale unresolved geometry/hatching/aperture');textcheck(v['paperOrigin'],role+': unresolved',{'fill':'#a00'});continue
  if role=='bore-center-section':
   patches,edges=facts['section'];hatch=[p for p in group if p.get('data-presentation')=='section-hatch'];cut=[p for p in group if p.get('data-cut-boundary')=='true'];need(len(group)==len(hatch)+len(cut) and len(hatch)==len(patches) and len(cut)==len(edges),'all and only cap patches/cut boundaries')
   pid='drawing-section-hatch-'+str(index);pattern=one([p for p in patterns if p.get('id')==pid],'actual referenced hatch pattern');usedpatterns.add(id(pattern))
   need(pattern.tag=='{'+NS['s']+'}pattern' and pattern.attrib=={'id':pid,'patternUnits':'userSpaceOnUse','width':'4','height':'4','patternTransform':'rotate(45)'},'physical hatch units/spacing/rotation');child=one(list(pattern),'hatch stroke');need(child.tag=='{'+NS['s']+'}path' and child.attrib=={'d':'M0,0 L0,4','stroke':'#777','stroke-width':'.2'},'actual visible hatch content')
   for p,patch in zip(hatch,patches):pathcheck(p,[paper(v,a) for a,b in patch],{'data-view-id':v['viewId'],'data-view-basis':role,'data-presentation':'section-hatch','data-section-area':str(p.get('data-section-area')),'fill':'url(#'+pid+')','stroke':'none'},True);near(float(p.get('data-section-area')),observed['metadata']['area'])
   for p,(a,b) in zip(cut,edges):pathcheck(p,[paper(v,a),paper(v,b)],{'data-view-id':v['viewId'],'data-view-basis':role,'data-cut-boundary':'true'})
  else:
   actual=[p for p in group if not p.get('data-presentation')]
   if role=='detail':
    expected=facts['detail'][0];offset=bore.centers(item['dimensions'])[1];hw,hh=v['aperture']['halfWidth'],v['aperture']['halfHeight'];aperture=one([p for p in group if p.get('data-presentation')=='detail-aperture'],'actual aperture')
    pathcheck(aperture,[paper(v,p) for p in ((-hw,-hh),(hw,-hh),(hw,hh),(-hw,hh),(-hw,-hh))],{'data-view-id':v['viewId'],'data-presentation':'detail-aperture','stroke':'#777','stroke-dasharray':'1 1'})
    need(len(group)==len(actual)+1,'detail has no ghost presentation geometry')
    if not expected:textcheck([v['paperOrigin'][0],v['paperOrigin'][1]+9],'detail: available-empty')
   else:expected=[(c,*c['range']) for c in facts[role]];offset=[0,0];need(len(group)==len(actual),'ordinary projection has no injected presentation')
   need(len(actual)==len(expected),'every actual analytic occurrence reaches SVG')
   for p,(c,a,b) in zip(actual,expected):
    attrs={'data-view-id':v['viewId'],'data-view-basis':role}|({'stroke-dasharray':'2 1','stroke':'#777'} if c['hidden'] else {})
    need(set(p.attrib)==set(attrs)|{'d'} and all(p.get(k)==z for k,z in attrs.items()),'analytic view/visibility identity');need('Z' not in p.get('d',''),'open analytic path');used.add(id(p))
    chord_certificate(c,a,b,ps(p),lambda q:paper(v,[q[j]-offset[j] for j in (0,1)]),scale(v),iso.evaluate)
  bounds=caption_bounds(v);position=[bounds[0],bounds[3]+5] if bounds else [v['paperOrigin'][0],v['paperOrigin'][1]+5];caption=textcheck(position,role+(' 2:1' if role=='detail' else ''))
  if bounds:need(float(caption.get('y'))>=bounds[3]+5-1e-6,'caption baseline clears actual conservative paper geometry by5mm, without clamping')
 for a,f in zip(d['dimensions'],o['dimensions']):
  v=one([v for v in d['views'] if v['viewId']==a['viewId']],'dimension view')
  if f['status']!='available' or frames[v['viewId']] is None:textcheck(a['label'],'UNRESOLVED: '+a['dimensionId'],{'fill':'#a00'});continue
  ends=[project(v,p) for p in f['anchors']];lines=[p for p in paths if id(p) not in used and p.get('stroke')=='#246'];leaders=[p for p in paths if id(p) not in used and p.get('stroke')=='#789'];need(lines and leaders,'actual dimension line and paired leaders')
  pathcheck(lines[0],ends,{'stroke':'#246'});pathcheck(leaders[0],[ends[0],a['label'],ends[1],a['label']],{'stroke':'#789','stroke-dasharray':'1 1'},moves=(0,2))
  semantics='Ø' if a['kind']=='hole-diameter' else 'L ' if a['kind']=='edge-length' else 'ΔZ ' if a['kind']=='plane-distance' else 'ΔX ' if a['axis']=='datum-x' else 'ΔY '
  textcheck(a['label'],semantics+f"{f['value']:.3f} mm",{'fill':'#124'})
 for a,f in zip(d['annotations'],o['annotations']):
  tag={'data-annotation-id':a['annotationId'],'data-annotation-kind':a['kind']};group=[p for p in paths if p.get('data-annotation-id')==a['annotationId']];v=one([v for v in d['views'] if v['viewId']==a['viewId']],'annotation view')
  if f['status']=='unresolved':
   need(a['kind']=='hole-callout' and not group,'finite roof error has no ghost annotation');textcheck(a['label'],'UNRESOLVED: '+a['annotationId']+' ('+f['reason']+')',tag|{'fill':'#a00'});continue
  value=f['facts'];expected=[]
  if a['kind']=='bore-center':
   if v['basis'] in ('top','detail'):
    c=project(v,value['center']);extent=value['diameter']*scale(v)/2+a['extension'];expected=[([[c[0]-extent,c[1]],[c[0]+extent,c[1]]],'4 1 1 1'),([[c[0],c[1]-extent],[c[0],c[1]+extent]],'4 1 1 1')]
   else:
    p,q=map(lambda p:project(v,p),value['ends']);delta=[q[j]-p[j] for j in (0,1)];length=math.hypot(*delta);need(length>0,'finite projected center axis');extra=[x/length*a['extension'] for x in delta];expected=[([[p[j]-extra[j] for j in (0,1)],[q[j]+extra[j] for j in (0,1)]],'4 1 1 1')]
  elif a['kind']=='hole-callout':
   expected=[([project(v,c),a['label']],'1 1') for c in value['centers']];textcheck(a['label'],f"4×Ø{value['diameter']:.3f} THRU",tag|{'fill':'#124'})
  else:
   vals=value['coordinates' if a['kind']=='ordinate' else 'values']
   for j,pair in enumerate(value['anchors']):
    ends=[project(v,p) for p in pair];expected.extend([(ends,None),([ends[1],a['labels'][j]],'1 1')]);prefix=('+' if vals[j]>=0 else '') if a['kind']=='ordinate' else 'Δ';textcheck(a['labels'][j],prefix+f'{vals[j]:.3f} mm',tag|{'data-member-index':str(j),'fill':'#124'})
  need(len(group)==len(expected),'complete annotation lines/leader membership')
  for p,(points,dash) in zip(group,expected):pathcheck(p,points,tag|{'stroke':'#357'}|({'stroke-dasharray':dash} if dash else {}))
 textcheck([8,d['sheet']['height']-5],f"Reference drawing · {read['status']} · scale {d['sheet']['scale']['numerator']}:{d['sheet']['scale']['denominator']}")
 need(len(used)==len(paths) and len(usedtexts)==len(texts) and len(usedpatterns)==len(patterns),'no stale/extra unverified lines, labels, patterns or hidden geometry')
 return item['savedFile']
