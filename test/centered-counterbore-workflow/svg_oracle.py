"""Independent finite source-frame projection, paper and chord audit."""
import json,math,re
from xml.etree import ElementTree as ET

def require(value,message):
 if not value:raise ValueError(message)
def near(a,b,t=1e-6):require(math.isfinite(a) and abs(a-b)<=t,f'{a} != {b}')
def inspect_counterbore_svg(raw,e,definition,context):
 ns={'s':'http://www.w3.org/2000/svg'};root=ET.fromstring(raw);require(root.attrib.get('width')=='420mm' and root.attrib.get('height')=='297mm' and root.attrib.get('viewBox')=='0 0 420 297','physical sheet/viewBox')
 meta=json.loads(root.find('s:metadata',ns).text);require(meta['drawingId']==definition['drawingId'] and meta['status']=='available' and meta['dimensionRole']=='reference','current available reference drawing');require(meta['revision']==context['host']['revision'] and meta['geometryRevision']==context['capture']['solids']['revision']==context['drawing']['geometryRevision'],'actual current document/geometry SVG binding');require(meta['curvePresentationTolerancePaperMm']==.02,'same declared chord budget')
 require(definition['version']==1 and [v['basis'] for v in definition['views']]==['top','front','right'] and len(definition['dimensions'])==3,'unchanged three-view/source-dimension definition')
 texts=[''.join(n.itertext()) for n in root.findall('.//s:text',ns)];require(not any('UNRESOLVED' in t or 'THRU' in t for t in texts),'no unresolved or fabricated through annotation')
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
 for node in root.findall('.//s:path',ns):
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
