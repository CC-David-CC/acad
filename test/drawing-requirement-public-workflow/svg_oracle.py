"""AFTER WHOLE: independent analytic projection, complete SVG grammar and
visible requirement membership. No production imports or placement-search replay.
Only independently known finite source surfaces and actual protected records
supply geometry. Authored requirement text is never a conformance measurement.
"""
import math,json,re
import xml.etree.ElementTree as ET
from collections import Counter
from truth import need,one,near,vector,AXES
from native_record import record_curves,evaluate,extrema,covered_segment,full_circle,path_points,TOKEN
S='{http://www.w3.org/2000/svg}'
def project(view,frame,p,scale=1):
 d=[p[k]-frame['origin'][k] for k in range(3)]
 return [view['paperOrigin'][0]+scale*sum(d[k]*frame['u'][k] for k in range(3)),view['paperOrigin'][1]-scale*sum(d[k]*frame['v'][k] for k in range(3))]
def box(ps):return[min(p[0] for p in ps),min(p[1] for p in ps),max(p[0] for p in ps),max(p[1] for p in ps)]
def expanded(b,p):return[b[0]-p,b[1]-p,b[2]+p,b[3]+p]
def overlap(a,b):return a[0]<b[2] and a[2]>b[0] and a[1]<b[3] and a[3]>b[1]
def contained(b,d):need(b[0]>=8 and b[1]>=16 and b[2]<=d['sheet']['width']-8 and b[3]<=d['sheet']['height']-16,'complete visible fixed-size paper box within original margins')
def text_box(x,y,length):return[x-1,y-4,x+length+1,y+2]
def crosses(a,z,b):
 # Exact represented rational open-box clipping, independent of layout choices.
 from fractions import Fraction as F
 lo,hi=F(0),F(1)
 for k in range(2):
  p,delta=F(a[k]),F(z[k])-F(a[k]);lower,upper=F(b[k]),F(b[k+2])
  if not delta:
   if not lower<p<upper:return False
  else:
   u,v=sorted(((lower-p)/delta,(upper-p)/delta));lo=max(lo,u);hi=min(hi,v)
   if lo>=hi:return False
 return lo<hi and hi>0 and lo<1
def number(n,places=0,signed=False):
 need(type(n)in(int,float) and math.isfinite(n),'finite visible quantity')
 if n==0:s='0'
 elif float(n).is_integer() and abs(n)<1e21:s=str(int(n))
 else:s=repr(float(n)).replace('e-0','e-').replace('e+0','e+')
 if 'e'not in s:
  decimals=len(s.split('.')[1]) if'.'in s else 0
  if decimals<places:s+=('.'if'.'not in s else'')+'0'*(places-decimals)
 return('+'if signed and n>0 else'')+s

def projection(row):
 d,p,e=row['definition'],row['projection'],row['expected'];o=p['observation']
 if row['targetMissing']:need(p['views']==[],'lost target has no actual projections');return[]
 result=[];need(len(p['views'])==len(o['viewFrames'])==len(d['views'])==3,'complete real three-view observation')
 for v,f,a in zip(p['views'],o['viewFrames'],d['views']):
  need(v['viewId']==f['viewId']==a['viewId'],'actual view identity');F=f['frame'];need(F['origin']==[0,0,0],'original source projection origin')
  for key,want in zip(('u','v','n'),AXES[a['basis']]):vector(F[key],want,1e-12)
  curves=record_curves(v,[*F['origin'],*F['u'],*F['v'],*F['n']]);basis=a['basis'];W=e['height']if basis=='right'else e['width'];H=e['height']if basis=='top'else e['depth']+e['cover'];R=e['diameter']/2;center=[e['width']/2,e['height']/2]if basis=='top'else[W/2,0]
  bounds=[extrema(c) for c in curves];vector([min(x[0]for x in bounds),min(x[1]for x in bounds),max(x[2]for x in bounds),max(x[3]for x in bounds)],[0,0,W,H])
  edges=[([0,0],[W,0]),([W,0],[W,H]),([W,H],[0,H]),([0,H],[0,0])]
  need(all(covered_segment(a,z,curves)for a,z in edges),'entire independently known outer projected boundary')
  if basis=='top':
   need(full_circle(curves,*center,R),'complete actual finite bore rim projection, not a fitted circle/count')
   wanted_visibility=bool(e['cover']);need(full_circle([c for c in curves if c['hidden']==wanted_visibility],*center,R),'actual circle visibility reflects roof occlusion, not automatic THRU')
   for c in curves:
    if not c['line']:
     vector(c['c'],center);near(math.hypot(*c['a']),R);near(math.hypot(*c['b']),R);near(sum(x*y for x,y in zip(c['a'],c['b'])),0)
    else:
     need(any(abs(c['start'][axis]-level)<=1e-6 and abs(c['end'][axis]-level)<=1e-6 for axis,level in((0,0),(0,W),(1,0),(1,H))) or math.dist(c['start'],c['end'])<=1e-6,'every actual projected top LINE lies on finite outer boundary; no invented positive line')
  else:
   for sign in(-1,1):need(covered_segment([W/2+sign*R,0],[W/2+sign*R,e['depth']],[c for c in curves if c['hidden']]),'complete hidden cylindrical generators over original finite interval')
   for c in curves:
    if c['line']:
     a,z=c['start'],c['end'];outer=any(abs(a[k]-v)<=1e-6 and abs(z[k]-v)<=1e-6 for k,v in((0,0),(0,W),(1,0),(1,H)))
     rim=any(abs(a[1]-v)<=1e-6 and abs(z[1]-v)<=1e-6 and all(W/2-R-1e-6<=p[0]<=W/2+R+1e-6 for p in(a,z))for v in(0,e['depth']))
     seam=abs(a[0]-z[0])<=1e-6 and all(abs(p[0]-W/2)<=R+1e-6 and -1e-6<=p[1]<=e['depth']+1e-6 for p in(a,z))
     junction=bool(e['cover'])and all(abs(p[1]-e['depth'])<=1e-6 and -1e-6<=p[0]<=W+1e-6 for p in(a,z))
     need(outer or rim or seam or junction,'every actual front/right line on outer plane/rim/finite cylindrical support or genuine coplanar roof junction')
    else:
     need(abs(c['c'][0]-W/2)<=1e-6 and any(abs(c['c'][1]-z)<=1e-6 for z in(0,e['depth'])) and abs(c['a'][1])+abs(c['b'][1])<=1e-6,'edge-on finite original circular rim support');near(math.hypot(c['a'][0],c['b'][0]),R)
  result.append(curves)
 need(sum(v['metadata']['valueBytes']+v['metadata']['tagBytes']for v in p['views'])<=3276800,'original aggregate projection budget')
 return result

def inspect_svg(raw,item,row):
 need(0<len(raw)<=16*1024*1024,'original SVG byte budget');d=row['definition'];r=row['projection'];o=r['observation'];cc=projection(row);root=ET.fromstring(raw)
 need(root.tag==S+'svg' and root.attrib=={'width':'594mm','height':'420mm','viewBox':'0 0 594 420'},'exact physical root grammar')
 need([x.tag for x in root]==[S+x for x in('title','metadata','defs','rect','g','g')],'closed complete SVG child grammar')
 title,meta,defs,bg,g,t=list(root)
 need(all(not(x.tail or'').strip()for x in root.iter()),'no hidden/unaccounted visible tail text')
 need(all(not(x.text or'').strip()for x in(root,defs,bg,g,t)),'no unaccounted container text')
 need(title.attrib=={} and len(title)==0 and title.text==d['title'],'authored title')
 need(meta.attrib=={} and len(meta)==0 and defs.attrib=={} and len(defs)==0,'bare metadata/defs; no CSS/masking/clip substitutions')
 need(bg.attrib=={'width':'100%','height':'100%','fill':'white'} and not len(bg) and g.attrib=={'fill':'none','stroke':'#111','stroke-width':'.25'} and t.attrib=={'font-family':'sans-serif','font-size':'3'},'sole background and fixed geometry/text grammar')
 m=json.loads(meta.text);need(set(m)==set('version drawingId revision geometryRevision quality status definitionVersion viewCount projection annotationFacts annotationRole ordinateRole datumFeatureFacts requirementFacts manufacturingRequirementRole measurementScope curvePresentationTolerancePaperMm dimensionRole'.split()),'complete exact metadata fields')
 need(m=={'version':1,'drawingId':d['drawingId'],'revision':item['before']['host']['revision'],'geometryRevision':item['before']['capture']['solids']['revision'],'quality':'native-bound-drawing-references','status':r['status'],'definitionVersion':4,'viewCount':3,'projection':'source-relative-orthographic-v1','annotationFacts':o['annotations'],'annotationRole':'derived-native-bore-reference','ordinateRole':'signed-datum-coordinate','datumFeatureFacts':o['datumFeatures'],'requirementFacts':o['requirements'],'manufacturingRequirementRole':'authored-manufacturing-requirement','measurementScope':'nominal-cad-reference-only','curvePresentationTolerancePaperMm':.02,'dimensionRole':'reference'},'issued read/revision/accepted definition and explicit authored roles')
 need(item['definition']==d and item['before']['drawing']['definition']==d and item['before']==item['after'],'SVG exact accepted definition and all readonly state')
 paths=list(g);need(all(p.tag==S+'path' and not len(p) and not(p.text or'').strip() for p in paths),'only complete finite path children')
 cursor=0;scale=d['sheet']['scale']['numerator']/d['sheet']['scale']['denominator'];geometry_boxes=[];stroke_boxes=[];oldlabels=[];frames={x['viewId']:x['frame']for x in o['viewFrames']}
 for view,curves in zip(d['views'],cc):
  envelope=[]
  for c in curves:
   path=paths[cursor];cursor+=1;expected={'d','data-view-id','data-view-basis'}|({'stroke','stroke-dasharray'}if c['hidden']else set())
   need(set(path.attrib)==expected and path.get('data-view-id')==view['viewId'] and path.get('data-view-basis')==view['basis'] and(not c['hidden']or(path.get('stroke'),path.get('stroke-dasharray'))==('#777','2 1')),'exact actual Native path identity/visibility')
   ps=path_points(path.get('d'));need([x for x in TOKEN.findall(path.get('d'))if x in('M','L')]==['M']+['L']*(len(ps)-1),'complete explicit Native polyline')
   need(len(ps)==2 if c['line']else len(ps)>=2,'line/conic path domain')
   for j,point in enumerate(ps):
    q=evaluate(c,c['range'][0]+(c['range'][1]-c['range'][0])*j/(len(ps)-1));vector(point,[view['paperOrigin'][0]+scale*q[0],view['paperOrigin'][1]-scale*q[1]])
   if not c['line']:need((math.hypot(*c['a'])+math.hypot(*c['b']))*scale*((c['range'][1]-c['range'][0])/(len(ps)-1))**2/8<=.02+1e-12,'derived presentation-only chord bound, not Native accuracy claim')
   if c['line']:envelope+=ps
   else:
    ex=[math.hypot(c['a'][k],c['b'][k])for k in(0,1)]
    envelope += [[view['paperOrigin'][0]+scale*(c['c'][0]+sx*ex[0]),view['paperOrigin'][1]-scale*(c['c'][1]+sy*ex[1])]for sx in(-1,1)for sy in(-1,1)]
  geometry_boxes.append(box(envelope))
 texts=list(t);need(all(x.tag==S+'text'for x in texts) and texts[0].attrib=={'x':'8','y':'8'} and texts[0].text==d['title'] and not len(texts[0]),'exact visible title');ti=1
 for a,f in zip(d['dimensions'],o['dimensions']):
  if f['status']!='available':continue
  view=one([v for v in d['views']if v['viewId']==a['viewId']],'dimension view');ends=[project(view,frames[a['viewId']],p,scale)for p in f['anchors']]
  span,leaders=paths[cursor:cursor+2];cursor+=2;need(set(span.attrib)=={'d','stroke'} and span.get('stroke')=='#246' and set(leaders.attrib)=={'d','stroke','stroke-dasharray'}and leaders.get('stroke')=='#789'and leaders.get('stroke-dasharray')=='1 1','actual complete original dimension paths')
  for path,want,cmd in((span,ends,['M','L']),(leaders,[ends[0],a['label'],ends[1],a['label']],['M','L','M','L'])):
   ps=path_points(path.get('d'));need(len(ps)==len(want) and[x for x in TOKEN.findall(path.get('d'))if x in('M','L')]==cmd,'original span/leader syntax');[vector(p,q)for p,q in zip(ps,want)]
  stroke_boxes.extend((box(ends),box([ends[0],a['label']]),box([ends[1],a['label']])))
  txt=texts[ti];ti+=1;prefix='Ø'if a['kind']=='hole-diameter'else'ΔZ 'if a['kind']=='plane-distance'else'ΔX 'if a['axis']=='datum-x'else'ΔY ';value=prefix+format(f['value'],'.3f')+' mm'
  need(set(txt.attrib)=={'x','y','fill'}and txt.get('fill')=='#124'and not len(txt)and txt.text==value,'unchanged actual physical dimension label');vector([float(txt.get('x')),float(txt.get('y'))],a['label']);oldlabels.append(text_box(*a['label'],len(value)*3))
 for a,f in zip(d['annotations'],o['annotations']):
  if f['status']!='available':continue
  need(a['kind']=='bore-center','finite original center-mark scope');view=one([v for v in d['views']if v['viewId']==a['viewId']],'mark view');c=project(view,frames[a['viewId']],f['facts']['center'],scale);extent=f['facts']['diameter']*scale/2+a['extension']
  for want in([[c[0]-extent,c[1]],[c[0]+extent,c[1]]],[[c[0],c[1]-extent],[c[0],c[1]+extent]]):
   p=paths[cursor];cursor+=1;need(set(p.attrib)=={'data-annotation-id','data-annotation-kind','d','stroke','stroke-dasharray'}and p.get('data-annotation-id')==a['annotationId']and p.get('data-annotation-kind')==a['kind']and(p.get('stroke'),p.get('stroke-dasharray'))==('#357','4 1 1 1'),'old actual center-mark grammar')
   ps=path_points(p.get('d'));need(len(ps)==2,'complete center mark');[vector(x,y)for x,y in zip(ps,want)];stroke_boxes.append(box(ps))
 captions=[]
 for view in d['views']:
  txt=texts[ti];ti+=1;unavailable=row['targetMissing'];keys=set('x y data-view-caption-id data-caption-role data-caption-layout font-family font-size textLength lengthAdjust'.split())|({'fill'}if unavailable else set())
  need(set(txt.attrib)==keys and txt.get('data-view-caption-id')==view['viewId']and txt.get('data-caption-role')=='view'and txt.get('data-caption-layout')=='observed-sheet-v1'and txt.get('font-family')=='monospace'and txt.get('font-size')=='3'and txt.get('lengthAdjust')=='spacing'and not len(txt),'fixed complete caption grammar')
  value=view['basis']+(': unresolved'if unavailable else'');need(txt.text==value and(not unavailable or txt.get('fill')=='#a00'),'actual view availability visible')
  x,y,L=[float(txt.get(k))for k in('x','y','textLength')];near(L,len(value)*1.8,1e-9);b=text_box(x,y,L);contained(b,d);need(not any(overlap(b,q)for q in captions),'distinct caption boxes')
  if not unavailable:
   own=geometry_boxes[len(captions)];need(b[1]-own[3]>=5-1e-9,'complete caption clears OWN actual projection')
  captions.append(b)
 forms=[];leaders=[];unavailable=[];new_strokes=[]
 rows=list(zip(d['datumFeatures'],o['datumFeatures']))+list(zip(d['requirements'],o['requirements']))
 for a,f in rows:
  kind='datum-feature'if 'symbol'in a else a['kind']
  if f['status']!='available':unavailable.append(('annotation',a['annotationId'],a['viewId'],'UNRESOLVED: '+a['annotationId']+' ('+f['reason']+')',kind));continue
  base={'data-annotation-id':a['annotationId'],'data-annotation-kind':kind,'data-requirement-role':'authored-manufacturing-requirement','data-geometry-binding':'resolved'}
  pp=[]
  while cursor<len(paths) and paths[cursor].get('data-annotation-id')==a['annotationId']:
   p=paths[cursor];cursor+=1;need(set(p.attrib)==set(base)|{'data-presentation','d','stroke'}and all(p.get(k)==v for k,v in base.items())and p.get('stroke')=='#357','closed complete new requirement path grammar')
   points=path_points(p.get('d'));need([x for x in TOKEN.findall(p.get('d'))if x in('M','L')]==['M']+['L']*(len(points)-1),'explicit complete new form path')
   new_strokes.append(box(points));pp.append(p)
  frame=one([p for p in pp if p.get('data-presentation')=='requirement-frame'],'form frame');fp=path_points(frame.get('d'));need(len(fp)==5,'complete explicit closed rectangular form');B=box(fp);[vector(x,y)for x,y in zip(fp,[[B[0],B[1]],[B[2],B[1]],[B[2],B[3]],[B[0],B[3]],[B[0],B[1]]])];vector(B[:2],[a['label'][0]-1,a['label'][1]-4]);contained(B,d)
  leader=one([p for p in pp if p.get('data-presentation')=='requirement-leader'],'actual fact leader');lp=path_points(leader.get('d'));need(len(lp)==2,'single complete finite leader');view=one([v for v in d['views']if v['viewId']==a['viewId']],'form view');vector(lp[0],project(view,frames[a['viewId']],f['facts']['anchor'],scale));end=lp[1];need((abs(end[0]-B[0])<=1e-9 or abs(end[0]-B[2])<=1e-9)and B[1]-1e-9<=end[1]<=B[3]+1e-9 or(abs(end[1]-B[1])<=1e-9 or abs(end[1]-B[3])<=1e-9)and B[0]-1e-9<=end[0]<=B[2]+1e-9,'actual leader terminates on its complete frame, no placement-search replay')
  if kind=='datum-feature':lines=[('datum-symbol',a['symbol'])];width=8;height=6;wantpoints=[[a['label'][0]+2,a['label'][1]]]
  elif kind=='position-tolerance':
   lines=[('kind','POS REQ'),('zone','Ø'+number(a['zone']['value'],2)+' mm')]+[('datum-'+s,s)for s in a['datumSymbols']];widths=[max(6,len(s)*1.8+2)for _,s in lines];width=sum(widths);height=6;x=B[0];wantpoints=[]
   cells=[p for p in pp if p.get('data-presentation')=='requirement-cell'];need(len(cells)==4,'all five position cells, not cropped datum sequence')
   for j,w in enumerate(widths):
    wantpoints.append([x+1,a['label'][1]]);x+=w
    if j<4:
     cellpoints=path_points(cells[j].get('d'));need(len(cellpoints)==2,'exact finite cell separator')
     [vector(p,q)for p,q in zip(cellpoints,[[x,B[1]],[x,B[3]]])]
  elif kind=='surface-finish':lines=[('roughness','REQ Ra ≤'+number(a['maximum']['value'])+' µm')];width=len(lines[0][1])*1.8+2;height=6;wantpoints=[a['label']]
  else:
   v=f['facts'];lines=[('nominal','REQ FIT nominal Ø'+number(v['nominalDiameter'],3)+' mm'),('hole-deviations','HOLE deviations '+number(a['hole']['lowerDeviation'],3,True)+'..'+number(a['hole']['upperDeviation'],3,True)+' mm'),('hole-limits','HOLE limits ['+','.join(number(n,3)for n in v['holeLimits'])+'] mm'),('declared-shaft-deviations','DECLARED SHAFT deviations '+number(a['declaredShaft']['lowerDeviation'],3,True)+'..'+number(a['declaredShaft']['upperDeviation'],3,True)+' mm'),('declared-shaft-limits','DECLARED SHAFT limits ['+','.join(number(n,3)for n in v['declaredShaftLimits'])+'] mm'),('clearance','REQUIRED CLEARANCE ['+number(v['clearance']['minimum'],3)+','+number(v['clearance']['maximum'],3)+'] mm')];width=max(len(s)for _,s in lines)*1.8+2;height=36;wantpoints=[[a['label'][0],a['label'][1]+j*6]for j in range(6)]
  vector([B[2]-B[0],B[3]-B[1]],[width,height],1e-9);need(len(pp)==2+(4 if kind=='position-tolerance'else 0),'no extra/hidden presentation paths')
  for(role,value),want in zip(lines,wantpoints):
   txt=texts[ti];ti+=1;need(set(txt.attrib)==set(base)|set('x y data-requirement-text font-family font-size textLength lengthAdjust fill'.split())and all(txt.get(k)==v for k,v in base.items())and txt.get('data-requirement-text')==role and txt.get('font-family')=='monospace'and txt.get('font-size')=='3'and txt.get('lengthAdjust')=='spacing'and txt.get('fill')=='#124'and txt.text==value and not len(txt),'complete visible exact raw/canonical/declared quantity line');vector([float(txt.get('x')),float(txt.get('y'))],want);near(float(txt.get('textLength')),len(value)*1.8,1e-9)
  need(not any(overlap(B,expanded(q,2.125))for q in geometry_boxes+stroke_boxes)and not any(overlap(B,expanded(q,2))for q in oldlabels+captions+forms),'complete fixed-size form clears actual view/strokes/all text, without running placement search')
  forms.append(B);leaders.append((lp,B))
 need(cursor==len(paths),'no extra paths outside actual Native/dimension/center/new-form roster')
 for lp,B in leaders:need(not any(crosses(*lp,expanded(q,.125))for q in oldlabels+captions+[x for x in forms if x is not B]),'all new leaders clear every other declared text box')
 for a,f in zip(d['dimensions'],o['dimensions']):
  if f['status']!='available':unavailable.append(('dimension',a['dimensionId'],a['viewId'],'UNRESOLVED: '+a['dimensionId'],None))
 for a,f in zip(d['annotations'],o['annotations']):
  if f['status']!='available':unavailable.append(('annotation',a['annotationId'],a['viewId'],'UNRESOLVED: '+a['annotationId']+' ('+f['reason']+')',a['kind']))
 warningboxes=[];membership={}
 for txt in texts[ti:-1]:
  need(txt.get('data-warning-layout')=='observed-sheet-v1','no extra text outside captions/forms/warnings')
  role,id,view=txt.get('data-warning-role'),txt.get('data-warning-id'),txt.get('data-warning-view-id');want=one([x for x in unavailable if x[:3]==(role,id,view)],'actual unresolved warning member');need(id not in membership,'one complete warning per unavailable member')
  keys=set('x y data-warning-layout data-warning-role data-warning-id data-warning-view-id font-family font-size fill aria-label'.split())|({'data-annotation-id','data-annotation-kind'}if want[4]else set())
  need(set(txt.attrib)==keys and txt.get('font-family')=='monospace'and txt.get('font-size')=='3'and txt.get('fill')=='#a00'and txt.get('aria-label')==want[3] and not(txt.text or'').strip(),'closed warning grammar and complete identity/reason')
  if want[4]:need(txt.get('data-annotation-id')==id and txt.get('data-annotation-kind')==want[4],'actual annotation warning binding')
  need(0<len(txt)<=256,'bounded actual lines');combined=''
  for j,line in enumerate(txt):
   need(line.tag==S+'tspan'and set(line.attrib)=={'x','y','textLength','lengthAdjust'}and line.get('lengthAdjust')=='spacing'and not len(line)and isinstance(line.text,str),'complete plain warning line')
   x,y,L=[float(line.get(k))for k in('x','y','textLength')];near(L,len(line.text)*1.8,1e-9);B=text_box(x,y,L);contained(B,d);need(not any(overlap(B,q)for q in warningboxes),'distinct readable warning lines');need(not any(overlap(B,expanded(q,2.125))for q in geometry_boxes+stroke_boxes+new_strokes)and not any(overlap(B,expanded(q,2))for q in oldlabels+captions+forms),'warning text clears all actual geometry/text obstacles');warningboxes.append(B);combined+=line.text
   if j==0:vector([x,y],[float(txt.get('x')),float(txt.get('y'))])
  need(combined==want[3],'visible complete untruncated warning reason');membership[id]=combined
 need(set(membership)=={x[1]for x in unavailable},'every actual unresolved member visibly represented, no ghost success')
 notice=texts[-1];need(not len(notice)and notice.attrib=={'x':'8','y':'415'}and notice.text=='Reference drawing · '+r['status']+' · scale 1:1','exact factual footer')
 return{'quality':'independent-source/Native-analytic-record/complete-visible-SVG-membership','fragments':sum(map(len,cc)),'resolvedForms':len(forms),'unresolvedWarnings':membership,'manufacturedConformance':False}
