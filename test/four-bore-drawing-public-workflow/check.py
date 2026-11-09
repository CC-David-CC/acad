#!/usr/bin/env python3
"""AFTER-WHOLE source/archive/equations/Native projection/SVG oracle.
No production CAD modules; retained independent archive and analytic decoders.
"""
import json,math,hashlib,sys,importlib.util,xml.etree.ElementTree as ET
from pathlib import Path
from collections import Counter
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'native-cad-container'))
from archive_oracle import read_archive
spec=importlib.util.spec_from_file_location('retained_iso_oracle',ROOT/'isometric-drawing-public-workflow'/'check.py');iso=importlib.util.module_from_spec(spec);spec.loader.exec_module(iso)
spec=importlib.util.spec_from_file_location('drawing_warning_oracle',ROOT/'drawing-warning-oracle.py');warnings=importlib.util.module_from_spec(spec);spec.loader.exec_module(warnings);warning_layout=warnings.check_warnings
need,near,vector,one=iso.need,iso.near,iso.vector,iso.one;sha=lambda b:hashlib.sha256(b).hexdigest()
BUILD='sha256:57b74074e0a249b917ac68357fbd003c37d1ab61897206886b575088e6995858:60dc956b08e01f43d08a48035a384e478e63bb34fb55f21a152c8cd12e8b8947'
SLOTS=['MIN_X_MIN_Y','MAX_X_MIN_Y','MAX_X_MAX_Y','MIN_X_MAX_Y'];NS=iso.NS

def source(s,b,e,inspection):
 n=s['capture']['native'];entry=one(n['sketches'],'one actual source');need(entry['id']==b['faceId'],'source identity');d=json.loads(entry['source']);objects={o['id']:o for o in d['objects']};need(d['version']==3 and len(objects)==4 and set(objects)==set(b['curveIds']) and len(d['stages'])==1 and not d['stages'][0]['generators'],'four nongenerated Segments');need(d['metadata']['boundaryFrame']=={'origin':[0,0,0],'x':[1,0,0],'y':[0,1,0],'z':[0,0,1]},'authentic datum, not rectangle minimum');x,y=e['origin'];w,h=e['width'],e['height'];corners=[(x,y),(x+w,y),(x+w,y+h),(x,y+h)];counts=[0]*4
 for o in objects.values():
  need(o['type']=='Segment' and o['role'] is None and o['stage']==0,'original source');ends=[]
  for p in(o['data']['a'],o['data']['b']):
   at=one([i for i,q in enumerate(corners) if math.dist((p['x'],p['y']),q)<=5e-8],'source endpoint');counts[at]+=1;ends.append(at)
  need((ends[0]+1)%4==ends[1],'directed branch')
 need(counts==[2]*4,'all original corners');points={}
 for p in inspection['points']:
  o=objects[p['parentId']];q=one([q for q in(o['data']['a'],o['data']['b']) if math.dist((p['x'],p['y']),(q['x'],q['y']))<=5e-8],'inspected endpoint');points[p['id']]=q
 need(len(points)==8,'actual endpoint IDs');rows=d['stages'][0]['constraints'];need(Counter(c['typeId'] for c in rows)=={'PCoincident':4,'LockPoint':1,'Horizontal':2,'Vertical':2,'SegmentLength':2},'eleven actual rows')
 for c in rows:
  need(c['admission']['state'] in('accepted','redundant'),'solver admission');t=c['typeId'];ids=c['objects'];k=c.get('constants',{})
  if t=='PCoincident':
   a,z=[points[i] for i in ids];vector([a['x'],a['y']],[z['x'],z['y']],5e-8)
  elif t=='LockPoint':
   q=points[one(ids,'lock')];vector([q['x'],q['y']],[float(k['x']),float(k['y'])],5e-8)
  else:
   o=objects[one(ids,'Segment')];a,z=o['data']['a'],o['data']['b']
   if t=='SegmentLength':near(math.hypot(a['x']-z['x'],a['y']-z['y']),float(k['length']),5e-8)
   else:near(a['y' if t=='Horizontal' else 'x'],z['y' if t=='Horizontal' else 'x'],5e-8)
 hist=n['history'];need([r['type'] for r in hist[:5]]==['PLANE','WORKER_SELECTED_PROFILE_EXTRUDE_V2','WORKER_THROUGH_HOLES_V1','WORKER_THROUGH_HOLES_V1','WORKER_SOLID_EDGE_TREATMENT_V1'],'actual source/profile/center/group/fillet');p=hist[1]['params'];need(p['featureId']==b['profile']['featureId'] and p['faceId']==b['faceId'] and p['regionId']==b['regionId'] and p['depth']==e['depth'],'selected source intent')
 for at,key,kind,diameter,parent in[(2,'center','centered-through',e['centerDiameter'],b['profile']),(3,'corners','four-corner-through',e['cornerDiameter'],b['center'])]:
  p=hist[at]['params'];need(p['featureId']==b[key]['featureId'] and p['kind']==kind and p['diameter']==diameter and p['target']==parent['outputId'] and p['producerFeatureId']==parent['featureId'] and p['sourceFeatureId']==b['profile']['featureId'] and p['sourceFaceId']==b['faceId'] and p['sourceRegionId']==b['regionId'],'actual bound hole intent')
  if at==3:need(p['offsetX']==e['offsetX'] and p['offsetY']==e['offsetY'],'actual offsets')
 p=hist[4]['params'];need(p['kind']=='fillet' and p['size']==3 and p['edgeIds']==[b['filletSelection']['id']] and p['featureId']==b['fillet']['featureId'],'immutable fillet selection');need(all(r['params']['engineRevision']==BUILD for r in hist[1:]),'one exact Native cohort')
 qualified={b['faceId']+'/'+i:o for i,o in objects.items()};refs=b['filletSelection']['incidentCurveIds'];need(len(refs)==2 and all(i in qualified for i in refs),'actual source namespace incidence');ends=[[tuple(qualified[i]['data'][k][a] for a in('x','y')) for k in('a','b')] for i in refs];corner=one([p for p in ends[0] if any(math.dist(p,q)<=5e-8 for q in ends[1])],'actual corner');at=one([i for i,q in enumerate(corners) if math.dist(corner,q)<=5e-8],'corner index');return objects,at

def centers(e):
 x,y=e['origin'];w,h=e['width'],e['height'];ox,oy=e['offsetX'],e['offsetY'];return[(x+w/2,y+h/2),(x+ox,y+oy),(x+w-ox,y+oy),(x+w-ox,y+h-oy),(x+ox,y+h-oy)]
def volume(e,mode):
 v=e['width']*e['height']*e['depth']-math.pi*((e['centerDiameter']/2)**2+4*(e['cornerDiameter']/2)**2)*e['depth']-9*(1-math.pi/4)*e['depth']
 if mode=='split':v-=(36-math.pi*(e['cornerDiameter']/2)**2)*2
 if mode=='consume':v-=(36-math.pi*(e['cornerDiameter']/2)**2)*e['depth']
 if mode=='cover':v+=2*e['width']*e['height']
 return v

def classify(p,e,corner,mode):
 x,y,z=p;x0,y0=e['origin'];w,h,d=e['width'],e['height'],e['depth'];cs=centers(e)
 if mode=='cover' and x0<x<x0+w and y0<y<y0+h and d<z<d+2:return 'inside'
 if x<x0 or x>x0+w or y<y0 or y>y0+h or z<0 or z>d:return 'outside'
 for i,(cx,cy) in enumerate(cs):
  radius=(e['cornerDiameter'] if i else e['centerDiameter'])/2
  if(x-cx)**2+(y-cy)**2<radius*radius:return 'outside'
 cx,cy=cs[1]
 if mode in('split','consume') and abs(x-cx)<3 and abs(y-cy)<3 and(mode=='consume' or abs(z-d/2)<1):return 'outside'
 u,v=[(x-x0,y-y0),(x0+w-x,y-y0),(x0+w-x,y0+h-y),(x-x0,y0+h-y)][corner]
 if u<3 and v<3 and(u-3)**2+(v-3)**2>9:return 'outside'
 return 'boundary' if x in(x0,x0+w) or y in(y0,y0+h) or z in(0,d) else 'inside'

def supports(e,corner,mode,u,v):
 # Independently construct all finite analytic support curves from source.
 n=iso.FRAMES[next(k for k,f in iso.FRAMES.items() if f[0]==u and f[1]==v)][2]
 out=[];dot=lambda a,b:sum(x*y for x,y in zip(a,b));project=lambda p:[dot(p,u),dot(p,v)]
 def line(a,b):out.append({'line':True,'c':project(a),'a':project([b[i]-a[i] for i in range(3)]),'b':[0,0],'range':[0,1]})
 def arc(c,a,b,ran):out.append({'line':False,'c':project(c),'a':project(a),'b':project(b),'range':ran})
 x,y=e['origin'];w,h,d=e['width'],e['height'],e['depth'];cs=[(x,y),(x+w,y),(x+w,y+h),(x,y+h)];pairs=[]
 for i,c in enumerate(cs):
  if i!=corner:pairs.append((c,c));continue
  prev,nxt=cs[(i-1)%4],cs[(i+1)%4];a=[c[j]+3*(prev[j]-c[j])/math.dist(prev,c) for j in range(2)];b=[c[j]+3*(nxt[j]-c[j])/math.dist(nxt,c) for j in range(2)];center=[a[j]+b[j]-c[j] for j in range(2)];t0=math.atan2(a[1]-center[1],a[0]-center[0]);t1=math.atan2(b[1]-center[1],b[0]-center[0]);
  while t1<=t0:t1+=2*math.pi
  near(t1-t0,math.pi/2,1e-12);pairs.append((a,b))
  for z in(0,d):arc([*center,z],[3,0,0],[0,3,0],[t0,t1])
  if n[0] or n[1]:
   phase=math.atan2(-n[0],n[1])
   for k in range(-3,4):
    t=phase+k*math.pi
    if t0<=t<=t1:line([center[0]+3*math.cos(t),center[1]+3*math.sin(t),0],[center[0]+3*math.cos(t),center[1]+3*math.sin(t),d])
 for i,(a,b) in enumerate(pairs):
  for z in(0,d):line([*b,z],[*pairs[(i+1)%4][0],z])
  for p in(a,b):line([*p,0],[*p,d])
 holes=centers(e)
 for i,c in enumerate(holes):
  if mode=='consume' and i==1:continue
  radius=(e['cornerDiameter'] if i else e['centerDiameter'])/2
  levels=[0,d]+([d/2-1,d/2+1] if mode=='split' and i==1 else[])
  for z in levels:arc([*c,z],[radius,0,0],[0,radius,0],[0,2*math.pi])
  # HLR silhouette generators: cylinder normal dot look=0. Native seam is
  # admitted too; these are support curves, not an expected fragment count.
  n=iso.FRAMES[next(k for k,f in iso.FRAMES.items() if f[0]==u and f[1]==v)][2]
  angles=[0]+([math.atan2(-n[0],n[1]),math.atan2(-n[0],n[1])+math.pi] if n[0] or n[1] else[])
  for t in angles:line([c[0]+radius*math.cos(t),c[1]+radius*math.sin(t),0],[c[0]+radius*math.cos(t),c[1]+radius*math.sin(t),d])
 def rectangle(x0,y0,w0,h0,z0,z1):
  q=[(x0,y0),(x0+w0,y0),(x0+w0,y0+h0),(x0,y0+h0)]
  for i,p in enumerate(q):
   for z in(z0,z1):line([*p,z],[*q[(i+1)%4],z])
   line([*p,z0],[*p,z1])
 if mode=='cover':rectangle(x,y,w,h,d,d+2)
 if mode in('split','consume'):
  cx,cy=holes[1];rectangle(cx-3,cy-3,6,6,d/2-1 if mode=='split' else 0,d/2+1 if mode=='split' else d)
 return out

def on_curve(p,c,tol=1e-6):
 if c['line']:
  a,b=iso.evaluate(c,c['range'][0]),iso.evaluate(c,c['range'][1]);v=[b[i]-a[i] for i in range(2)];length=sum(x*x for x in v)
  if length==0:return math.dist(p,a)<=tol
  t=sum((p[i]-a[i])*v[i] for i in range(2))/length;return -tol<=t<=1+tol and math.dist(p,[a[i]+max(0,min(1,t))*v[i] for i in range(2)])<=tol
 a,b=c['a'],c['b'];det=a[0]*b[1]-a[1]*b[0];q=[p[i]-c['c'][i] for i in range(2)]
 if det==0:
  # Degenerate projected circle is a finite transverse line; use its exact
  # analytic extrema rather than manufacturing new geometry.
  bounds=iso.extrema(c);return min(abs(p[0]-bounds[0]),abs(p[1]-bounds[1]))<=tol and bounds[0]-tol<=p[0]<=bounds[2]+tol and bounds[1]-tol<=p[1]<=bounds[3]+tol
 x=(q[0]*b[1]-q[1]*b[0])/det;y=(a[0]*q[1]-a[1]*q[0])/det;t=math.atan2(y,x)
 return any(c['range'][0]-1e-10<=t+2*math.pi*k<=c['range'][1]+1e-10 and math.dist(p,iso.evaluate(c,t+2*math.pi*k))<=tol for k in range(-3,4))

def authored(d):
 need(set(d)=={'version','unit','drawingId','title','target','datum','sheet','views','dimensions','annotations'} and d['version']==3 and d['unit']=='millimeter','one exact v3 definition')
 fields={'bore-center':{'hole','extension'},'baseline':{'axis','holes','labels'},'ordinate':{'axis','holes','labels'},'hole-callout':{'holes','label'}}
 for a in d['annotations']:
  need(a['kind'] in fields and set(a)=={'annotationId','viewId','kind'}|fields[a['kind']],'no measured facts/availability flags authored')
  refs=[a['hole']] if a['kind']=='bore-center' else a['holes']
  for ref in refs:need(set(ref)=={'kind','featureId','sourceFeatureId','faceId','regionId','holeKind','slot','geometry'} and ref['kind']=='through-hole' and ref['geometry']=='cylinder','only semantic source-bound references, no Native ordinals/handles')
  if a['kind']!='bore-center':need(len(refs)==4 and [r['slot'] for r in refs]==SLOTS and len({r['featureId'] for r in refs})==1,'one exact canonical four-member group')

def observation(row):
 s,b,e,d=row['before'],row['binding'],row['dimensions'],row['definition'];authored(d);mode=row['mode'];iso.settled(s);objects,corner=source(s,b,e,row['inspection']);need(corner==row['filletCorner'],'actual source-owned fillet corner');need(row['after']==s,'all reads exact readonly state');body=one(s['capture']['solids']['bodies'],'actual whole output');m=body['metrics'];need(body['id']==row['parent']['outputId'] and body['featureId']==row['parent']['featureId'] and m['nativeValidity']['valid'] is True and m['solidCount']==1 and m['resultKind']=='single-solid','actual current native producer/validity');near(m['nativeVolume'],volume(e,mode));vector(m['nativeBounds']['min'],[*e['origin'],0]);vector(m['nativeBounds']['max'],[e['origin'][0]+e['width'],e['origin'][1]+e['height'],e['depth']+(2 if mode=='cover' else 0)]);need(s['drawing']['definition']==d and d['version']==3 and len(d['dimensions'])==4 and len(d['annotations'])==8 and [v['basis'] for v in d['views']]==['top','front','right','isometric'],'same complete authored v3');need(s['drawing']['definitionVersions']==[1,2,3],'current supported schema advertisement');need(d['datum']=={'featureId':b['profile']['featureId'],'faceId':b['faceId'],'regionId':b['regionId']},'authentic source datum binding')
 hist=s['capture']['native']['history'];plane=hist[0]['params'];rectangle_id=b['rectangle']['featureId']
 # Existing PLANE history uses canonical decimal text; its public creation
 # receipt deliberately exposes Number(featureId). Other owned features use
 # safe integer IDs. Validate each dialect exactly, never loosely coerce IDs.
 need(type(rectangle_id) is int and 0<rectangle_id<=2**53-1 and type(plane['featureId']) is str and plane['featureId']==str(rectangle_id) and plane['orientation']=='XY' and plane['depth']==0 and plane['datum'] is None,'actual original datum plane')
 owned_ids=[r['params']['featureId'] for r in hist[1:]];counter=s['capture']['native']['counters']['featureId']
 need(all(type(i) is int and 0<i<=2**53-1 for i in owned_ids) and type(counter) is int and counter>=max([rectangle_id,*owned_ids]),'retained feature high-water')
 if mode=='normal':need(len(hist)==5,'same five-feature positive graph')
 else:
  need(len(hist)==7 and [r['type'] for r in hist[5:]]==['WORKER_SOLID_BOX_V1','WORKER_SOLID_BOOLEAN_V1'],'actual public negative geometry, no seeded topology');tool,operation=[r['params'] for r in hist[5:]];cx,cy=centers(e)[1];x,y=e['origin'];origin=[x,y,e['depth']] if mode=='cover' else[cx-3,cy-3,e['depth']/2-1 if mode=='split' else -1];dimensions=[e['width'],e['height'],2] if mode=='cover' else[6,6,2 if mode=='split' else e['depth']+2];need(set(tool)=={'version','unit','engine','engineRevision','featureId','x','y','z','width','depth','height'} and tool['version']==1 and tool['unit']=='millimeter' and tool['engine']=='occ' and [tool[k] for k in ('x','y','z')]==origin and [tool[k] for k in ('width','depth','height')]==dimensions and operation['kind']==('union' if mode=='cover' else 'subtract') and operation['a']==b['last']['outputId'] and operation['featureId']==row['parent']['featureId'],'independently frozen actual persisted box/Boolean intent')
 read=row['read'];need(read['revision']==s['host']['revision'] and read['geometryRevision']==s['capture']['solids']['revision'],'exact current read tokens');dis=row['discovery'];need(dis['revision']==read['revision'] and dis['geometryRevision']==read['geometryRevision'],'same public discovery time');need(dis['target']=={'bodyId':row['parent']['outputId'],'featureId':row['parent']['featureId'],'engine':'occ','engineRevision':BUILD},'actual public current producer/build');bores=dis['observation']['bores'];need(len(bores)==5,'all semantic members retained, never truncate');expected={('center',b['center']['featureId']):0}|{(slot,b['corners']['featureId']):i+1 for i,slot in enumerate(SLOTS)};need({(r['reference']['slot'],r['reference']['featureId']) for r in bores}==set(expected),'each real semantic member exactly once')
 # Full-depth removal preserves the independent constant cross-section slab;
 # only its removed wall is unresolved. Interior split adds cap levels, and
 # cover extends the solid beyond the authored end plane: neither gets THRU.
 for bore in bores:
  ref=bore['reference'];key=(ref['slot'],ref['featureId']);need(key in expected and ref['sourceFeatureId']==b['profile']['featureId'] and ref['faceId']==b['faceId'] and ref['regionId']==b['regionId'],'actual discovery semantic binding');i=expected[key]
  if i==1 and mode in('split','consume'):need(bore['status']=='unresolved' and bore['diameter'] is None and bore['center'] is None and bore['through'] is None,'actual split/missing wall unresolved');continue
  need(bore['status']=='available' and bore['quality']=='native-prism-cut-lineage','current native measurable wall');cx,cy=centers(e)[i];vector(bore['center'],[cx,cy,0]);near(bore['diameter'],e['cornerDiameter'] if i else e['centerDiameter']);vector(bore['ends'][0],[cx,cy,0]);vector(bore['ends'][1],[cx,cy,e['depth']]);need(bore['through']['status']==('available' if mode in ('normal','consume') else 'unqualified'),'only proved whole-current slab gets THRU')
 if row['consumed']:need(read['target'] is None and read['observation']['reason']=='DRAWING_TARGET_UNAVAILABLE' and not read['views'],'consumed target never follows latest');curves=[]
 else:
  need(len(read['views'])==4 and read['status']==('unresolved' if row['unresolved'] else 'available'),'real views remain, facts honest');curves=[]
  for definition,frame,view in zip(d['views'],read['observation']['viewFrames'],read['views']):
   u,v,n=iso.FRAMES[definition['basis']];actual=frame['frame'];vector(actual['origin'],[0,0,0],0)
   for key,want in [('u',u),('v',v),('n',n)]:vector(actual[key],want,1e-12)
   cc=iso.record_curves(view,[*actual['origin'],*actual['u'],*actual['v'],*actual['n']]);allowed=supports(e,corner,mode,u,v)
   for c in cc:
    for j in range(17):
     p=iso.evaluate(c,c['range'][0]+(c['range'][1]-c['range'][0])*j/16);need(any(on_curve(p,x) for x in allowed),'every real projected Native fragment matches source-derived analytic boundary support')
   bs=[iso.extrema(c) for c in cc];ws=[iso.extrema(c) for c in allowed];vector([min(c[0] for c in bs),min(c[1] for c in bs),max(c[2] for c in bs),max(c[3] for c in bs)],[min(c[0] for c in ws),min(c[1] for c in ws),max(c[2] for c in ws),max(c[3] for c in ws)])
   if definition['basis']=='top':
    for i,(cx,cy) in enumerate(centers(e)):
     if mode=='consume' and i==1:continue
     radius=(e['cornerDiameter'] if i else e['centerDiameter'])/2
     for j in range(16):need(any(on_curve([cx+radius*math.cos(j*math.pi/8),cy+radius*math.sin(j*math.pi/8)],c) for c in cc),'actual full projected bore rim coverage')
   curves.append(cc)
  if not row['unresolved']:
   for a,fact in zip(d['dimensions'],read['observation']['dimensions']):need(fact['status']=='available','real physical dimension available');near(fact['value'],{'width':e['width'],'height':e['height'],'depth':e['depth'],'center-diameter':e['centerDiameter']}[a['dimensionId']])
  for a,fact in zip(d['annotations'],read['observation']['annotations']):
   need(a['annotationId']==fact['annotationId'] and a['kind']==fact['kind'],'actual annotation binding')
   if row['unresolved'] and mode=='normal' and a['annotationId']!='center-line':need(fact['status']=='unresolved' and fact['reason']=='DRAWING_HOLE_WITNESS_UNAVAILABLE','actual invalid feature reference does not turn into a bore')
   if fact['status']=='unresolved':need(row['unresolved'] and fact['facts'] is None and fact['quality'] is None and fact['reason'],'no ghost measured annotation');continue
   need(fact['quality']=='native-prism-cut-lineage','actual native-derived annotation');f=fact['facts']
   if a['kind']=='bore-center':
    key=(a['hole']['slot'],a['hole']['featureId']);need(key in expected,'discovered bore only');i=expected[key];cx,cy=centers(e)[i];vector(f['center'],[cx,cy,0]);near(f['diameter'],e['cornerDiameter'] if i else e['centerDiameter']);vector(f['ends'][0],[cx,cy,0]);vector(f['ends'][1],[cx,cy,e['depth']])
   else:
    need([h['slot'] for h in a['holes']]==SLOTS,'complete canonical group')
    if a['kind']=='hole-callout':need(mode=='normal' and f['count']==4 and f['through'] is True,'no nominal or sample-only THRU');near(f['diameter'],e['cornerDiameter']);[vector(p,[*c,0]) for p,c in zip(f['centers'],centers(e)[1:])]
    else:
     key='coordinates' if a['kind']=='ordinate' else 'values';values=[c[0 if a['axis']=='datum-x' else 1] for c in centers(e)[1:]];vector(f[key],values if key=='coordinates' else list(map(abs,values)))
     for anchors,c in zip(f['anchors'],centers(e)[1:]):vector(anchors[1],[*c,0]);vector(anchors[0],[0,c[1],0] if a['axis']=='datum-x' else [c[0],0,0])
 q=row['pointReply'];request=row['pointRequest'];need(q['quality']=='native-re-evaluation-observation' and len(q['points'])==21,'actual 21-point query');
 for key in('revision','version','unit','engine','engineRevision','bodyId','featureId'):need(q[key]==request[key],'actual native query binding')
 need(request['revision']==s['capture']['solids']['revision'] and request['bodyId']==body['id'] and request['featureId']==body['featureId'] and request['engineRevision']==BUILD,'current points producer/build');need(q['points']==[{'point':p,'classification':classify(p,e,corner,mode)} for p in request['points']],'independent analytic material/void/cap classes');return curves

def check_svg(root,item,rows):
 raw=(root/item['savedFile']).read_bytes();need(sha(raw)==item['sha256'] and len(raw)==item['byteLength'],'own acknowledged SVG/server bytes');need(item['before']==item['after'],'SVG exact readonly state');matches=[r for r in rows if r['case']==item['case'] and r['definition']==item['definition'] and r['before']['host']['revision']==item['before']['host']['revision'] and r['before']['capture']==item['before']['capture']];row=one(matches[-1:],'current Native observation for SVG');curves=observation(row);d=item['definition'];xml=ET.fromstring(raw);need(xml.tag=='{'+NS['s']+'}svg' and xml.attrib=={'width':'594mm','height':'420mm','viewBox':'0 0 594 420'},'physical SVG sheet');meta=json.loads(one(xml.findall('s:metadata',NS),'actual SVG metadata').text);need(meta['drawingId']==d['drawingId'] and meta['revision']==item['before']['host']['revision'] and meta['geometryRevision']==item['before']['drawing']['geometryRevision'] and meta['definitionVersion']==3 and meta['viewCount']==4 and meta['dimensionRole']=='reference' and meta['annotationRole']=='derived-native-bore-reference' and meta['ordinateRole']=='signed-datum-coordinate' and meta['status']==row['read']['status'],'SVG source/native/typed fact binding');need(meta['annotationFacts']==row['read']['observation']['annotations'],'actual derived annotation facts reach SVG');need(all('transform' not in node.attrib for node in xml.iter()),'no hidden geometry transforms')
 paths=[p for p in xml.findall('.//s:path',NS) if p.get('data-view-id')];expected=[(v,c) for v,cc in zip(d['views'],curves) for c in cc];need(len(paths)==len(expected),'all actual Native fragments reach SVG, not count-only')
 for p,(v,c) in zip(paths,expected):
  need(p.get('data-view-id')==v['viewId'] and p.get('data-view-basis')==v['basis'],'fragment/view binding');ps=iso.path_points(p.attrib['d']);need((p.get('stroke-dasharray')=='2 1')==c['hidden'],'Native visibility');need(len(ps)==2 if c['line'] else len(ps)>=2,'line/conic SVG')
  for j,q in enumerate(ps):
   t=c['range'][0]+(c['range'][1]-c['range'][0])*j/(len(ps)-1);at=iso.evaluate(c,t);vector(q,[v['paperOrigin'][0]+at[0],v['paperOrigin'][1]-at[1]],1e-6)
 texts=xml.findall('.//s:text',NS);annpaths=[p for p in xml.findall('.//s:path',NS) if p.get('data-annotation-id')]
 expected_warnings=[{'role':'dimension','id':a['dimensionId'],'viewId':a['viewId'],'message':'UNRESOLVED: '+a['dimensionId']} for a,f in zip(d['dimensions'],row['read']['observation']['dimensions']) if f['status']=='unresolved']
 if item['label']=='invalid-reference':need({a['annotationId'] for a,f in zip(d['annotations'],meta['annotationFacts']) if a['kind']=='bore-center' and f['status']=='unresolved'}=={'corner-mark-'+str(i) for i in range(4)},'all FOUR actual unresolved center-mark errors, not one representative')
 for a,fact in zip(d['annotations'],meta['annotationFacts']):
  group=[t for t in texts if t.get('data-annotation-id')==a['annotationId']];segments=[p for p in annpaths if p.get('data-annotation-id')==a['annotationId']]
  if fact['status']=='unresolved':
   message='UNRESOLVED: '+a['annotationId']+' ('+fact['reason']+')';need(len(group)==1 and ''.join(group[0].itertext())==message and not segments,'full error membership, no ghost numeric annotation');node=group[0]
   expected_warnings.append({'role':'annotation','id':a['annotationId'],'viewId':a['viewId'],'message':message,'attributes':{'data-annotation-id':a['annotationId'],'data-annotation-kind':a['kind']}})
   continue
  f=fact['facts'];view=one([v for v in d['views'] if v['viewId']==a['viewId']],'annotation view');u,v,_=iso.FRAMES[view['basis']];project=lambda p:[view['paperOrigin'][0]+sum(p[i]*u[i] for i in range(3)),view['paperOrigin'][1]-sum(p[i]*v[i] for i in range(3))]
  if a['kind']=='hole-callout':need(len(group)==1 and group[0].text==f"4×Ø{f['diameter']:.3f} THRU" and len(segments)==4,'actual qualified group text and four real leaders')
  elif a['kind']=='bore-center':
   need(not group and len(segments)==(2 if view['basis']=='top' else 1),'real measured center mark/line');ps=[iso.path_points(p.attrib['d']) for p in segments]
   if view['basis']=='top':
    c=project(f['center']);extent=f['diameter']/2+a['extension'];want=[[[c[0]-extent,c[1]],[c[0]+extent,c[1]]],[[c[0],c[1]-extent],[c[0],c[1]+extent]]]
   else:
    ends=list(map(project,f['ends']));delta=[ends[1][i]-ends[0][i] for i in range(2)];length=math.hypot(*delta);extra=[x/length*a['extension'] for x in delta];want=[[[ends[0][i]-extra[i] for i in range(2)],[ends[1][i]+extra[i] for i in range(2)]]]
   for p,q in zip(ps,want):vector(p[0],q[0]);vector(p[-1],q[-1])
  else:
   need(len(group)==4 and len(segments)==8,'four actual datum lines/leaders/labels');values=f['coordinates' if a['kind']=='ordinate' else 'values']
   for j,t in enumerate(group):need(t.get('data-member-index')==str(j),'canonical member binding');need(t.text==(('+' if values[j]>=0 else '') if a['kind']=='ordinate' else 'Δ')+f'{values[j]:.3f} mm','actual signed ordinate/nonnegative baseline');vector([float(t.attrib['x']),float(t.attrib['y'])],a['labels'][j])
 envelopes=[]
 for view,cc in zip(d['views'],curves):
  points=[]
  for c in cc:
   if c['line']:points.extend(iso.evaluate(c,t) for t in c['range'])
   else:
    radius=[math.hypot(c['a'][j],c['b'][j]) for j in (0,1)];points.extend([[c['c'][j]+sign*radius[j] for j in (0,1)] for sign in (-1,1)])
  mapped=[[view['paperOrigin'][0]+p[0],view['paperOrigin'][1]-p[1]] for p in points];need(mapped,'actual warning view envelope');envelopes.append([min(p[0] for p in mapped),min(p[1] for p in mapped),max(p[0] for p in mapped),max(p[1] for p in mapped)])
 stroke_boxes=[]
 for p in xml.findall('.//s:path',NS):
  if p.get('data-view-id'):continue
  stroke_boxes.extend(warnings.overlay_line_boxes(p.attrib['d'],need))
 caption_boxes=[]
 for view in d['views']:
  n=one([n for n in texts if n.get('data-view-caption-id')==view['viewId']],'actual unchanged view caption');attrs={'data-view-caption-id':view['viewId'],'data-caption-role':'view','data-caption-layout':'observed-sheet-v1','font-family':'monospace','font-size':'3','lengthAdjust':'spacing'};need(not list(n) and n.text==view['basis'] and set(n.attrib)==set(attrs)|{'x','y','textLength'} and all(n.get(k)==v for k,v in attrs.items()),'exact visible caption fields');x,y,length=(float(n.get(k,'nan')) for k in ('x','y','textLength'));need(all(math.isfinite(z) for z in (x,y,length)) and abs(length-len(n.text)*1.8)<1e-9,'caption full physical advance');caption_boxes.append([x-1,y-4,x+length+1,y+2])
 label_boxes=[[float(n.get('x'))-1,float(n.get('y'))-4,float(n.get('x'))+len(n.text or '')*3+1,float(n.get('y'))+2] for n in texts if n.get('fill')=='#124']
 warning_layout(texts,expected_warnings,d['sheet'],envelopes,stroke_boxes,label_boxes,caption_boxes,need)
 return item['savedFile']

def main(root):
 packet=json.loads((root/'receipt.json').read_text());need(packet['status']=='PASS' and packet['ownedContextsRetired'] and packet['sharedBrowserDisconnectedOnly'],'whole application/cleanup PASS required');need(packet['sourcePins']==packet['sourcePinsAfter'],'frozen whole source');need(packet['engineRevision']==BUILD and not packet['sourceSeeds'] and not packet['privateAuthoring'] and not packet['fakeReplies'],'genuine public authoring only');need(packet['tolerances']=={'sourceMm':5e-8,'nativeVolumeMm3':1e-6,'nativeBoundsMm':1e-6,'dimensionMm':1e-6,'projectionMm':1e-6,'svgPaperChordMm':.02},'unchanged physical/native budgets');need([c['name'] for c in packet['cases']]==['original','translated-negative'] and all(c['status']=='PASS' for c in packet['cases']),'both actual datum families')
 warnings.verify_warning_sources(root,packet,need)
 need(len(packet['observations'])==56,'all finite current observations')
 for c in packet['cases']:
  m=c['binding']['preFillet']['metrics'];need(m['nativeValidity']['valid'] is True and m['solidCount']==1 and m['nativeTopology']['counts']['faces']==11,'actual earlier complete slab');near(m['nativeVolume'],100000-820*math.pi)
 for row in packet['observations']:observation(row)
 need(len(packet['saves'])==len(packet['reopens'])==6 and len(packet['repairs'])==2 and len(packet['negatives'])==6 and len(packet['refusals'])==6 and len(packet['creationTravels'])==2 and len(packet['noops'])==2,'complete finite native/repair/negative/refusal workflow')
 archives=[]
 for item in packet['saves']:
  arc=read_archive(root/item['savedFile']);need(arc['sha256']==item['sha256'] and arc['bytes']==item['byteLength'],'actual .cad CRC/SHA/designRevision');env=arc['envelope'];n=item['before']['capture']['native'];need(env['version']==3 and env['unit']=='millimeter' and env['drawings']==[item['definition']],'exact v3 drawing custody');need(env['project']['model']['history']==n['history'] and env['project']['model']['counters']==n['counters'] and env['project']['model']['expressions']==n['expressions'],'same authoritative native history/high-water/expressions');need({s['id']:s['data'] for s in env['project']['sketches']}=={s['id']:json.loads(s['source']) for s in n['sketches']},'same exact original source/constraints');need(item['before']['capture']==item['after']['capture'] and item['before']['drawing']==item['after']['drawing'],'Save does not mutate model/J/drawing');archives.append({'file':item['savedFile'],'sha256':arc['sha256'],'designRevision':arc['manifest']['designRevision']})
 for item in packet['reopens']:
  before,after=item['before'],item['opened'];need(after['capture']['journal']['canUndo'] is False and after['capture']['journal']['canRedo'] is False,'fresh session journal');need(before['drawing']['definition']==after['drawing']['definition'],'same complete reopened definition')
  for key in('history','source','sketches','expressions','counters','presentation'):need(before['capture']['native'][key]==after['capture']['native'][key],'exact native Open '+key)
 for item in packet['creationTravels']:
  need(item['create']['annotationCount']==8 and item['absent']['drawing']['definition'] is None and item['redoneCreate']['drawing']['definition']==item['atCreate']['drawing']['definition'],'actual v3 creation Undo/Redo same definition');need(item['atCreate']['capture']['native']==item['absent']['capture']['native']==item['redoneCreate']['capture']['native'],'creation travel retains exact source/body intent/counters/material');need(item['atCreate']['capture']['solids']['bodies']==item['absent']['capture']['solids']['bodies']==item['redoneCreate']['capture']['solids']['bodies'],'actual untouched native bodies during creation travel')
 for item in packet['noops']:need(item['noop']['changed'] is False and item['noop']['annotationCount']==8 and item['before']==item['after'],'v3 exact no-op summary/state')
 for repair in packet['repairs']:
  need(repair['undone']['drawing']['definition']==repair['wrong'] and repair['redone']['drawing']['definition']==repair['definition'],'repair exact reference-bearing Undo/Redo');need(repair['beforeRepair']['capture']['native']==repair['repaired']['capture']['native']==repair['undone']['capture']['native']==repair['redone']['capture']['native'],'annotation repair is metadata only')
 for item in packet['refusals']:
  need(item['error'] and not item['error']['committed'] and not item['error']['possiblyCommitted'],'explicit refusal, no false success')
  if not item.get('candidate'):need(item['before']==item['after'],'preflight exact accepted state')
  else:
   before,after=json.loads(json.dumps(item['before'])),json.loads(json.dumps(item['after']));need(after['lifecycle']['epoch']==before['lifecycle']['epoch']+1,'one rejected prepared candidate');need(item['error']['code']=='HOLE_OUTSIDE_PROFILE','actual geometry refusal layer')
   for s in(before,after):
    s['lifecycle'].pop('epoch');s['capture']['solids'].pop('revision');s['capture']['journal'].pop('revision');s['host'].pop('revision');s['drawing'].pop('revision');s['drawing'].pop('geometryRevision')
   need(before==after,'actual failed candidate preserves source/H/definition/J/material/resources')
 for travel in packet['travels']:need(travel['before']['capture']['native']['counters']==travel['after']['capture']['native']['counters'],'travel high-water stable')
 svgs=[check_svg(root,item,packet['observations']) for item in packet['svgs']];need(len(svgs)==14,'all actual positive/unresolved/topology-negative SVG artifacts')
 result={'status':'PASS','scope':packet['scope'],'observations':len(packet['observations']),'nativePointClasses':sum(len(r['pointReply']['points']) for r in packet['observations']),'archives':archives,'svgs':svgs,'independent':'actual saved source equations + semantic IDs + analytic set/volume/projection + Native points + ZIP CRC/SHA + SVG XML, no production CAD helpers'};print(json.dumps(result,indent=2));return result
if __name__=='__main__':main(Path(sys.argv[1]))
