"""Independent finite source-frame projection, paper and chord audit."""
import json,math,re
from xml.etree import ElementTree as ET

def require(value,message):
 if not value:raise ValueError(message)
def near(a,b,t=1e-6):require(math.isfinite(a) and abs(a-b)<=t,f'{a} != {b}')
def visible_scaffold(raw,definition,e):
 # The actual v1 exporter emits a closed, untransformed visible sheet. This
 # reader does not implement general SVG/CSS, so no effect-bearing vocabulary
 # may be ignored while checking raw path coordinates.
 require(isinstance(raw,bytes) and 0<len(raw)<=16*1024*1024,'same actual SVG byte cap')
 text=raw.decode('utf-8');require('<!' not in text and '<?' not in text,'no DTD/entity declarations/processing instructions/comments outside the fixed exporter form')
 root=ET.fromstring(text);namespace='{http://www.w3.org/2000/svg}';tag=lambda name:namespace+name
 blank=lambda value:value is None or not value.strip()
 require(root.tag==tag('svg') and root.attrib=={'width':'420mm','height':'297mm','viewBox':'0 0 420 297'} and blank(root.text) and blank(root.tail),'exact physical root with no transforms/style/visibility/effect attributes')
 children=list(root);names=[n.tag for n in children];without=['title','metadata','rect','g','g'];with_defs=['title','metadata','defs','rect','g','g']
 require(names in ([tag(n) for n in without],[tag(n) for n in with_defs]),'exact closed title/metadata/optional-empty-defs/background/path/text scaffold')
 require(all(blank(n.tail) for n in children),'no extra root character content')
 title,metadata=children[:2];require(not title.attrib and not list(title) and (title.text or '')==definition['title'],'exact escaped title, no nested/external content')
 require(not metadata.attrib and not list(metadata) and isinstance(metadata.text,str),'plain metadata only')
 if len(children)==6:
  defs=children[2];require(not defs.attrib and not list(defs) and blank(defs.text),'only bare EMPTY defs, no patterns/clips/masks/styles/links')
 background,geometry,labels=children[-3:]
 require(background.attrib=={'width':'100%','height':'100%','fill':'white'} and not list(background) and blank(background.text),'exact white sheet background')
 require(geometry.attrib=={'fill':'none','stroke':'#111','stroke-width':'.25'} and blank(geometry.text),'exact visible untransformed geometry style')
 paths=list(geometry)
 for node in paths:
  require(node.tag==tag('path') and not list(node) and blank(node.text) and blank(node.tail),'plain path leaves in actual geometry group only')
  a=node.attrib;keys=set(a)
  require('d' in a and isinstance(a['d'],str) and bool(a['d']),'actual finite path data')
  allowed=(keys=={'d'} or keys=={'d','stroke','stroke-dasharray'} and (a['stroke'],a['stroke-dasharray']) in (('#777','2 1'),('#789','1 1')) or keys=={'d','stroke'} and a['stroke']=='#246')
  require(allowed,'only exact solid/hidden/dimension/leader path styles; no local transforms, opacity, events or external effects')
 require(labels.attrib=={'font-family':'sans-serif','font-size':'3'} and blank(labels.text),'exact visible untransformed text style')
 expected=[((8,8),definition['title'] or definition['drawingId'],None)]
 for d in definition['dimensions']:
  if d['kind']=='plane-distance':name,value='ΔZ ',e['thickness']
  elif d['kind']=='source-distance' and d['axis']=='datum-x':name,value='ΔX ',e['width']
  else:require(d['kind']=='source-distance' and d['axis']=='datum-y','same finite source/cap dimension family');name,value='ΔY ',e['height']
  expected.append((tuple(d['label']),name+f'{value:.3f} mm','#124'))
 expected.append(((8,292),'Reference drawing · available · scale 1:1',None))
 texts=list(labels);captions=[node for node in texts if 'data-view-caption-id' in node.attrib];fixed=[node for node in texts if node not in captions]
 require(len(texts)==len(expected)+len(definition['views']) and len(captions)==len(definition['views']) and len(fixed)==len(expected),'exact title/view/dimension/footer text roster, no hidden/extra text')
 for node in texts:require(node.tag==tag('text') and not list(node) and blank(node.tail),'all actual labels are plain visible text leaves')
 for node,(position,value,fill) in zip(fixed,expected):
  require(node.tag==tag('text') and not list(node) and blank(node.tail) and (node.text or '')==value,'exact plain actual visible text and order')
  require(set(node.attrib)==({'x','y'} if fill is None else {'x','y','fill'}) and (fill is None or node.attrib['fill']==fill),'only exact text placement/fill; no style, transforms, opacity, events, tspan or external content')
  xy=tuple(float(node.attrib[k]) for k in ('x','y'));require(all(math.isfinite(n) for n in xy) and xy==tuple(position) and 0<=xy[0]<=420 and 0<=xy[1]<=297,'exact authored/current derived text position on sheet')
 # The finite counterbore has an independently checked rectangular outer
 # boundary in these three projections. Reconstruct its physical paper boxes
 # from the authored dimensions, not a renderer-declared layout box or search.
 scale=definition['sheet']['scale']['numerator']/definition['sheet']['scale']['denominator'];geometry={}
 for view in definition['views']:
  role=view['basis'];require(role in ('top','front','right'),'same finite orthographic caption family')
  width,height=(e['width'],e['height']) if role=='top' else (e['width'],e['thickness']) if role=='front' else (e['height'],e['thickness'])
  x,y=view['paperOrigin'];geometry[view['viewId']]=[x,y-height*scale,x+width*scale,y]
 require(len(geometry)==len(definition['views']),'unique actual view identities')
 def intersects(a,b):return a[0]<b[2] and a[2]>b[0] and a[1]<b[3] and a[3]>b[1]
 boxes=[];used=set()
 for view in definition['views']:
  matches=[node for node in captions if node.get('data-view-caption-id')==view['viewId']]
  require(len(matches)==1,'one complete derived caption per actual view');node=matches[0];used.add(id(node))
  attrs={'data-view-caption-id':view['viewId'],'data-caption-role':'view','data-caption-layout':'observed-sheet-v1','font-family':'monospace','font-size':'3','lengthAdjust':'spacing'}
  value=view['basis'];require((node.text or '')==value and set(node.attrib)==set(attrs)|{'x','y','textLength'} and all(node.get(k)==v for k,v in attrs.items()),'full unchanged caption value and fixed physical typography; no hidden/extra attributes')
  x,y,length=(float(node.get(k,'nan')) for k in ('x','y','textLength'));require(all(math.isfinite(n) for n in (x,y,length)) and length>0,'finite actual caption placement/advance');near(length,len(value)*1.8)
  box=[x-1,y-4,x+length+1,y+2];own=geometry[view['viewId']]
  require(box[0]>=8-1e-6 and box[1]>=16-1e-6 and box[2]<=420-8+1e-6 and box[3]<=297-16+1e-6,'complete padded caption within sheet margins/header/footer')
  require(box[1]>=own[3]+.125+5-1e-6,'entire caption clears its actual view/stroke by at least5mm')
  for observed in geometry.values():require(not intersects(box,[observed[0]-.125,observed[1]-.125,observed[2]+.125,observed[3]+.125]),'caption clears EVERY actual projected view and stroke')
  for prior in boxes:require(not intersects(box,prior),'all complete derived caption boxes are disjoint')
  boxes.append(box)
 require(len(used)==len(captions),'no unverified extra or duplicate derived caption')
 return root,paths,texts

def inspect_counterbore_svg(raw,e,definition,context):
 ns={'s':'http://www.w3.org/2000/svg'};root,geometry_paths,text_nodes=visible_scaffold(raw,definition,e);require(root.attrib.get('width')=='420mm' and root.attrib.get('height')=='297mm' and root.attrib.get('viewBox')=='0 0 420 297','physical sheet/viewBox')
 meta=json.loads(root.find('s:metadata',ns).text);require(set(meta)=={'version','drawingId','revision','geometryRevision','quality','status','curvePresentationTolerancePaperMm','dimensionRole'} and meta['version']==1 and meta['quality']=='native-bound-drawing-references','exact actual v1 metadata vocabulary');require(meta['drawingId']==definition['drawingId'] and meta['status']=='available' and meta['dimensionRole']=='reference','current available reference drawing');require(meta['revision']==context['host']['revision'] and meta['geometryRevision']==context['capture']['solids']['revision']==context['drawing']['geometryRevision'],'actual current document/geometry SVG binding');require(meta['curvePresentationTolerancePaperMm']==.02,'same declared chord budget')
 require(definition['version']==1 and [v['basis'] for v in definition['views']]==['top','front','right'] and len(definition['dimensions'])==3,'unchanged three-view/source-dimension definition')
 texts=[n.text or '' for n in text_nodes];require(not any('UNRESOLVED' in t or 'THRU' in t for t in texts),'no unresolved or fabricated through annotation')
 for text in [f"ΔX {e['width']:.3f} mm",f"ΔY {e['height']:.3f} mm",f"ΔZ {e['thickness']:.3f} mm"]:require(text in texts,'actual physical source/cap dimension '+text)
 require({d['kind'] for d in definition['dimensions']}=={'source-distance','plane-distance'},'no invented counterbore measurement')
 W,H,T=e['width'],e['height'],e['thickness'];s=T-e['stepDepth'];r,R=e['throughDiameter']/2,e['stepDiameter']/2;scale=definition['sheet']['scale']['numerator']/definition['sheet']['scale']['denominator'];require(scale==1,'frozen1:1 physical paper mapping');chord=.02/scale;inc=1e-6
 def path_chains(text):
  token=re.compile(r'[ML]|[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?');parts=[];end=0
  for m in token.finditer(text):require(not text[end:m.start()].strip(' ,\t\r\n'),'exact SVG polyline grammar');parts.append(m[0]);end=m.end()
  require(not text[end:].strip(' ,\t\r\n') and len(parts)>=6 and parts[0]=='M','complete actual SVG polyline');chains=[];i=0
  while i<len(parts):
   require(parts[i] in ('M','L') and i+2<len(parts),'actual SVG path command');p=(float(parts[i+1]),float(parts[i+2]));require(all(math.isfinite(v) for v in p),'finite SVG point')
   if parts[i]=='M':chains.append([])
   require(chains,'move before line');chains[-1].append(p);i+=3
  require(all(2<=len(ps)<=65537 and all(0<=p[0]<=420 and 0<=p[1]<=297 for p in ps) for ps in chains),'bounded physical paper curve');return chains
 views={v['viewId']:{'view':v,'curves':[]} for v in definition['views']};segments=0;dimension_paths=[];leaders=[]
 for node in geometry_paths:
  stroke=node.attrib.get('stroke');chains=path_chains(node.attrib['d'])
  if stroke=='#246':dimension_paths.append(chains);continue
  if stroke=='#789':leaders.append(chains);continue
  require(stroke in (None,'#777','#111') and len(chains)==1,'no extra/decorative geometry path');points=chains[0];segments+=len(points)-1;matches=[]
  for key,data in views.items():
   v=data['view'];ox,oy=v['paperOrigin'];ps=[((x-ox)/scale,(oy-y)/scale) for x,y in points];width,height=(W,H) if v['basis']=='top' else(W,T) if v['basis']=='front' else(H,T)
   if all(-inc<=u<=width+inc and -inc<=w<=height+inc for u,w in ps):matches.append((key,ps))
  require(len(matches)==1,'unambiguous actual view/paper mapping');key,ps=matches[0];views[key]['curves'].append(ps)
 require(segments<=200000,'same actual presentation segment cap')
 def cover(intervals,lo,hi,tol=inc):
  require(intervals,'required real projected boundary absent');end=lo
  for a,b in sorted(intervals):
   if b<lo-tol or a>hi+tol:continue
   require(a<=end+tol,'projected boundary has a finite gap');end=max(end,b)
  require(end>=hi-tol,'projected boundary incomplete')
 summary={}
 for key,data in views.items():
  basis=data['view']['basis'];width,height=(W,H) if basis=='top' else(W,T) if basis=='front' else(H,T);center=width/2;lines={};circles={r:[],R:[]}
  def line(axis,at,lo,hi,ps):
   if all(abs(p[axis]-at)<=inc and lo-inc<=p[1-axis]<=hi+inc for p in ps):
    label=(axis,at,lo,hi);lines.setdefault(label,[]).append((min(p[1-axis] for p in ps),max(p[1-axis] for p in ps)));return True
   return False
  for ps in data['curves']:
   if basis=='top':
    circular=False
    for radius in (r,R):
     if all(abs(math.hypot(p[0]-W/2,p[1]-H/2)-radius)<=inc for p in ps):
      circular=True
      for a,b in zip(ps,ps[1:]):
       ax,ay=a[0]-W/2,a[1]-H/2;bx,by=b[0]-W/2,b[1]-H/2;delta=math.atan2(ax*by-ay*bx,ax*bx+ay*by);require(0<abs(delta)<=math.pi/8+1e-9,'bounded genuine circle chord')
       require(radius*(1-math.cos(abs(delta)/2))<=chord+inc,'actual circle chord error');start=math.atan2(ay,ax);end=start+delta;lo,hi=sorted((start,end))
       while lo<0:lo+=2*math.pi;hi+=2*math.pi
       while lo>=2*math.pi:lo-=2*math.pi;hi-=2*math.pi
       if hi>2*math.pi:circles[radius].extend([(lo,2*math.pi),(0,hi-2*math.pi)])
       else:circles[radius].append((lo,hi))
      break
    if circular:continue
   allowed=[(0,0,0,height),(0,width,0,height),(1,0,0,width),(1,height,0,width)]
   if basis!='top':allowed +=[(0,center-r,0,s),(0,center+r,0,s),(0,center-R,s,T),(0,center+R,s,T),(1,s,center-R,center+R),(0,center,0,T)]
   require(any(line(*candidate,ps) for candidate in allowed),'entire actual path belongs to finite projected counterbore support')
  for candidate in [(0,0,0,height),(0,width,0,height),(1,0,0,width),(1,height,0,width)]:cover(lines.get(candidate,[]),candidate[2],candidate[3])
  if basis=='top':
   for radius in (r,R):cover(circles[radius],0,2*math.pi,inc/radius)
  else:
   for candidate in [(0,center-r,0,s),(0,center+r,0,s),(0,center-R,s,T),(0,center+R,s,T),(1,s,center-R,center+R)]:cover(lines.get(candidate,[]),candidate[2],candidate[3])
  summary[key]={'basis':basis,'curves':len(data['curves']),'completeOuterOutline':True,'completeCircularRims':basis=='top','finiteStepIntervals':basis!='top'}
 # Source dimensions use actual saved curve identities; no ID grammar or provider values.
 source_rows=[x for x in context['capture']['native']['sketches'] if x['id']==definition['datum']['faceId']];require(len(source_rows)==1,'actual drawing datum source');source=json.loads(source_rows[0]['source']);objects={o['id']:o for o in source['objects']}
 require(len(dimension_paths)==len(leaders)==3,'actual three reference dimensions and leaders')
 def pair_equal(actual,expected):return len(actual)==2 and (all(math.dist(p,q)<=inc for p,q in zip(actual,expected)) or all(math.dist(p,q)<=inc for p,q in zip(actual,reversed(expected))))
 used_dimensions=set();used_leaders=set()
 for dimension in definition['dimensions']:
  v=next(v for v in definition['views'] if v['viewId']==dimension['viewId']);ox,oy=v['paperOrigin']
  if dimension['kind']=='source-distance':
   anchors=[]
   for ref in (dimension['from'],dimension['to']):
    require(ref['kind']=='source-point' and ref['faceId']==definition['datum']['faceId'] and ref['curveId'] in objects and ref['point'] in ('a','b'),'actual saved source reference');obj=objects[ref['curveId']];require(obj['type']=='Segment','actual Segment point');p=obj['data'][ref['point']];anchors.append((ox+p['x']*scale,oy-p['y']*scale))
   candidates=[anchors]
  else:
   require(dimension['kind']=='plane-distance' and v['basis']=='front','actual inherited source-cap dimension')
   # The authentic cap fact may select either genuine source corner column;
   # no interior arbitrary anchor or another measurement is permitted.
   candidates=[[(ox+x*scale,oy),(ox+x*scale,oy-T*scale)] for x in (0,W)]
  matching=[(i,candidate) for i,chains in enumerate(dimension_paths) if i not in used_dimensions and len(chains)==1 for candidate in candidates if pair_equal(chains[0],candidate)];require(len(matching)==1,'actual dimension path matches its own physical anchors');i,ends=matching[0];used_dimensions.add(i)
  label=tuple(dimension['label']);matching=[]
  for j,chains in enumerate(leaders):
   if j in used_leaders or len(chains)!=2 or any(len(c)!=2 or math.dist(c[1],label)>inc for c in chains):continue
   if pair_equal([c[0] for c in chains],ends):matching.append(j)
  require(len(matching)==1,'actual leaders bind same dimension anchors to authored label');used_leaders.add(matching[0])
 return {'metadata':meta,'views':summary,'geometrySegments':segments,'paperChordMm':.02,'nativeProjectedIncidenceMm':inc,'actualSourceDimensionPaths':3}
