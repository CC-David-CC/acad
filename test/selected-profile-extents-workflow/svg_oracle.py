"""Independent finite rectangular-extent SVG geometry/visibility audit.

AFTER-WHOLE only. No production renderer, layout search or geometry import.
"""
import json,math,re
from xml.etree import ElementTree as ET
NS='{http://www.w3.org/2000/svg}'
INC=1e-6

def need(value,message):
 if not value:raise ValueError(message)
def one(rows,message):need(len(rows)==1,'one '+message);return rows[0]
def blank(value):return value is None or not value.strip()
def pair_equal(a,b):return len(a)==len(b)==2 and (all(math.dist(x,y)<=INC for x,y in zip(a,b)) or all(math.dist(x,y)<=INC for x,y in zip(a,reversed(b))))
def path_chains(value):
 number=r'[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?'
 need(re.fullmatch('M'+number+','+number+'(?: [ML]'+number+','+number+')*',value),'exact explicit ML exporter subset; no positional comma or implicit command')
 token=re.compile(r'[ML]|[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?');parts=[];end=0
 for m in token.finditer(value):need(not value[end:m.start()].strip(' ,\t\r\n'),'closed finite SVG polyline grammar');parts.append(m[0]);end=m.end()
 need(not value[end:].strip(' ,\t\r\n') and len(parts)>=6 and len(parts)%3==0,'complete bounded SVG path');chains=[]
 for i in range(0,len(parts),3):
  need(parts[i] in ('M','L'),'explicit move/line command');p=(float(parts[i+1]),float(parts[i+2]));need(all(math.isfinite(v) for v in p),'finite actual paper point')
  if parts[i]=='M':chains.append([])
  need(chains,'move before line');chains[-1].append(p)
 need(all(2<=len(ps)<=65537 and all(0<=p[0]<=420 and 0<=p[1]<=297 for p in ps) for ps in chains),'bounded actual sheet geometry');return chains

def inspect_extent_svg(raw,e,definition,context):
 need(definition==context['drawing']['definition'],'proposed drawing equals actual accepted current authored definition')
 need(type(raw) is bytes and 0<len(raw)<=16*1024*1024,'actual16MiB SVG cap');text=raw.decode('utf-8');need('\x00' not in text and '<!' not in text and '<?' not in text,'fixed UTF8 exporter form, no declarations/PIs/comments/NUL')
 root=ET.fromstring(text);need(root.tag==NS+'svg' and root.attrib=={'width':'420mm','height':'297mm','viewBox':'0 0 420 297'} and blank(root.text) and blank(root.tail),'exact visible physical root')
 children=list(root);need([n.tag for n in children]==[NS+n for n in ('title','metadata','defs','rect','g','g')] and all(blank(n.tail) for n in children),'closed visible SVG scaffold')
 title,meta_node,defs,paper,geometry,labels=children
 need(not title.attrib and not list(title) and title.text==definition['title'],'exact authored title');need(not meta_node.attrib and not list(meta_node),'plain metadata');meta=json.loads(meta_node.text)
 need(meta=={'version':1,'drawingId':definition['drawingId'],'revision':context['host']['revision'],'geometryRevision':context['capture']['solids']['revision'],'quality':'native-bound-drawing-references','status':'available','curvePresentationTolerancePaperMm':.02,'dimensionRole':'reference'},'exact actual revision/geometry/reference metadata')
 need(not defs.attrib and not list(defs) and blank(defs.text),'bare empty defs; no hidden pattern/clip/mask');need(paper.attrib=={'width':'100%','height':'100%','fill':'white'} and not list(paper) and blank(paper.text),'exact white paper')
 need(geometry.attrib=={'fill':'none','stroke':'#111','stroke-width':'.25'} and labels.attrib=={'font-family':'sans-serif','font-size':'3'} and blank(geometry.text) and blank(labels.text),'exact visible untransformed groups')
 need(definition['version']==1 and e['kind']=='rectangle' and not e.get('holes') and [v['basis'] for v in definition['views']]==['top','front','right'] and len(definition['dimensions'])==3,'finite unperforated three-view scope')
 scale=definition['sheet']['scale'];need(scale=={'numerator':1,'denominator':1},'frozen physical1:1 mapping');lo,hi=(min(0,e['distance']),max(0,e['distance'])) if e['extent']=='one-sided' else (-e['length']/2,e['length']/2) if e['extent']=='symmetric' else (-e['negative'],e['positive'])
 W,H=e['width'],e['height'];views={}
 for v in definition['views']:
  ox,oy=v['paperOrigin'];xmin,xmax=ox,ox+(H if v['basis']=='right' else W);ymin,ymax=(oy-H,oy) if v['basis']=='top' else (oy-hi,oy-lo)
  views[v['viewId']]={'view':v,'box':(xmin,ymin,xmax,ymax),'coverage':[[],[],[],[]],'curves':0}
 dimensions=[];leaders=[];segments=0
 for n in geometry:
  need(n.tag==NS+'path' and not list(n) and blank(n.text) and blank(n.tail),'plain geometry path only');a=n.attrib;stroke=a.get('stroke');keys=set(a)
  allowed=keys=={'d'} or keys=={'d','stroke','stroke-dasharray'} and (stroke,a['stroke-dasharray']) in (('#777','2 1'),('#789','1 1')) or keys=={'d','stroke'} and stroke=='#246'
  need(allowed,'no transform/style/visibility/external/local effect');chains=path_chains(a['d']);segments+=sum(len(ps)-1 for ps in chains);need(segments<=200000,'same actual segment budget')
  if stroke=='#246':dimensions.append(chains);continue
  if stroke=='#789':leaders.append(chains);continue
  need(len(chains)==1,'one actual analytic projected line');ps=chains[0];matches=[]
  for key,data in views.items():
   x0,y0,x1,y1=data['box'];edges=[]
   for index,(axis,at,low,high) in enumerate(((0,x0,y0,y1),(0,x1,y0,y1),(1,y0,x0,x1),(1,y1,x0,x1))):
    if all(abs(p[axis]-at)<=INC and low-INC<=p[1-axis]<=high+INC for p in ps):edges.append((index,min(p[1-axis] for p in ps),max(p[1-axis] for p in ps)))
   if edges:matches.append((key,edges))
  key,edges=one(matches,'unambiguous actual finite source-interval view');data=views[key];data['curves']+=1
  for index,start,end in edges:data['coverage'][index].append((start,end))
 for data in views.values():
  x0,y0,x1,y1=data['box']
  for intervals,(low,high) in zip(data['coverage'],((y0,y1),(y0,y1),(x0,x1),(x0,x1))):
   need(intervals,'actual projected boundary present');end=low
   for a,b in sorted(intervals):need(a<=end+INC,'no projected outline gap');end=max(end,b)
   need(end>=high-INC,'complete independently derived projected boundary')
 texts=[];captions={}
 for n in labels:
  need(n.tag==NS+'text' and not list(n) and blank(n.tail) and isinstance(n.text,str),'plain actual text leaves');a=n.attrib
  if 'data-view-caption-id' in a:
   key=a['data-view-caption-id'];need(key in views and key not in captions,'exact unique derived view-caption identity');need(set(a)=={'x','y','data-view-caption-id','data-caption-role','data-caption-layout','font-family','font-size','textLength','lengthAdjust'},'closed visible caption fields')
   need(a['data-caption-role']=='view' and a['data-caption-layout']=='observed-sheet-v1' and a['font-family']=='monospace' and a['font-size']=='3' and a['lengthAdjust']=='spacing' and n.text==views[key]['view']['basis'],'fixed glyph size, ordinary view caption only');x,y,length=map(float,(a['x'],a['y'],a['textLength']));need(all(math.isfinite(v) for v in (x,y,length)) and abs(length-1.8*len(n.text))<=1e-9,'actual full untruncated caption advance');captions[key]=(x-1,y-4,x+length+1,y+2)
  else:texts.append(n)
 need(set(captions)==set(views),'every actual view caption retained')
 def intersects(a,b,gap=0):return a[0]<b[2]+gap and a[2]>b[0]-gap and a[1]<b[3]+gap and a[3]>b[1]-gap
 for key,box in captions.items():
  need(8<=box[0] and box[2]<=412 and 16<=box[1] and box[3]<=281,'whole caption inside title/footer-safe sheet margins');need(box[1]>=views[key]['box'][3]+5,'whole caption below its actual signed-interval geometry')
  for other,data in views.items():
   if other!=key:need(not intersects(box,data['box'],2),'caption clears every other actual view')
  for other,prior in captions.items():
   if other!=key:need(not intersects(box,prior),'complete caption boxes disjoint')
 expected=[((8,8),definition['title'],None)]
 for d in definition['dimensions']:
  value=W if d['dimensionId']=='width' else H if d['dimensionId']=='height' else hi-lo
  prefix='ΔX ' if d['dimensionId']=='width' else 'ΔY ' if d['dimensionId']=='height' else 'ΔZ '
  expected.append((tuple(d['label']),prefix+format(value,'.3f')+' mm','#124'))
 expected.append(((8,292),'Reference drawing · available · scale 1:1',None));need(len(texts)==len(expected),'only exact title/source-cap dimensions/footer')
 for node,(point,value,fill) in zip(texts,expected):
  need(node.attrib=={'x':str(point[0]),'y':str(point[1]),**({'fill':fill} if fill else {})} and node.text==value,'actual authored label position/value/style')
 source=one([s for s in context['capture']['native']['sketches'] if s['id']==definition['datum']['faceId']],'actual accepted source sketch');objects={o['id']:o for o in json.loads(source['source'])['objects']};body=one([b for b in context['capture']['solids']['bodies'] if b['featureId']==definition['target']['featureId']],'actual current drawing target');faces=body['selections']['plan']['faces']
 need(len(dimensions)==len(leaders)==3,'all and only real dimension/leader paths');used=set();used_leaders=set()
 for d in definition['dimensions']:
  view=one([v for v in definition['views'] if v['viewId']==d['viewId']],'dimension view');ox,oy=view['paperOrigin']
  if d['kind']=='source-distance':
   need(view['basis']=='top' and d['axis'] in ('datum-x','datum-y'),'source dimensions in actual datum plane');ends=[]
   for ref in (d['from'],d['to']):
    need(ref['kind']=='source-point' and ref['faceId']==definition['datum']['faceId'] and ref['featureId']==definition['datum']['featureId'] and ref['regionId']==definition['datum']['regionId'] and ref['curveId'] in objects and ref['point'] in ('a','b'),'actual original source-reference identity');obj=objects[ref['curveId']];need(obj['type']=='Segment','ordinary actual Segment');p=obj['data'][ref['point']];ends.append((ox+p['x'],oy-p['y']))
   candidates=[ends]
  else:
   need(d['kind']=='plane-distance' and d['axis']=='datum-normal' and view['basis']=='front','actual source-normal finite cap dimension')
   for ref,role in ((d['first'],'lower-cap'),(d['second'],'upper-cap')):
    need(ref['kind']=='native-face' and ref['geometry']=='plane' and ref['originFeatureId']==definition['datum']['featureId'],'actual original cap source');one([f for f in faces if f['id']==ref['selectionId'] and f['role']==role and f['originFeatureId']==ref['originFeatureId']],'actual current '+role+' selection')
   need(d['first']['selectionId']!=d['second']['selectionId'],'distinct genuine lower/upper caps');candidates=[[(ox+x,oy-lo),(ox+x,oy-hi)] for x in (0,W)]
  matches=[(i,ends) for i,chains in enumerate(dimensions) if i not in used and len(chains)==1 for ends in candidates if pair_equal(chains[0],ends)];i,ends=one(matches,'actual physical source/cap dimension anchors');used.add(i);label=tuple(d['label']);matches=[]
  for j,chains in enumerate(leaders):
   if j not in used_leaders and len(chains)==2 and all(len(c)==2 and math.dist(c[1],label)<=INC for c in chains) and pair_equal([c[0] for c in chains],ends):matches.append(j)
  used_leaders.add(one(matches,'same physical dimension anchors and authored leader label'))
 return {'metadata':meta,'nativeProjectedIncidenceMm':INC,'actualDimensionPaths':3,'actualLeaderPaths':3,'geometrySegments':segments,'views':{key:{'basis':d['view']['basis'],'paperBounds':list(d['box']),'curves':d['curves'],'completeOutline':True} for key,d in views.items()},'captionBoxes':{key:list(box) for key,box in captions.items()}}
