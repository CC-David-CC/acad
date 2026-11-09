"""Independent AFTER-WHOLE visible diagnostic membership/paper inequalities.

No production helper or placement search is imported/reproduced. Callers first
reconcile actual view/path/source facts, then supply those independent obstacles.
"""
import math,hashlib,re,subprocess
from pathlib import Path

def overlay_line_boxes(value,need):
 number=r'[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?'
 need(re.fullmatch('M'+number+','+number+'(?: [ML]'+number+','+number+')*',value),'exact visible explicit ML overlay grammar')
 tokens=re.findall('[ML]|'+number,value);out=[];previous=None
 for i in range(0,len(tokens),3):
  command=tokens[i];point=[float(tokens[i+1]),float(tokens[i+2])];need(all(math.isfinite(z) for z in point),'finite actual overlay endpoint')
  if command=='L':
   need(previous is not None,'connected actual overlay');out.append([min(previous[0],point[0]),min(previous[1],point[1]),max(previous[0],point[0]),max(previous[1],point[1])])
  previous=point
 need(out,'actual nonempty overlay');return out

def verify_warning_sources(root,receipt,need):
 rows=receipt['sourceSnapshots'];identities={(r['repository'],r['relative']) for r in rows}
 required={('core','test/drawing-warning-oracle.py'),('core','web/app/cad/export/linkedPartDrawingSvg.mjs'),('core','web/app/cad/export/linkedPartDrawingCaptionLayout.mjs'),('core','web/app/cad/export/linkedPartDrawingWarningLayout.mjs'),('desktop','test/agent-cad-corpus/strict-join/oracle.mjs')}
 need(len(identities)==len(rows) and required<=identities and {r['originalFile'] for r in rows}==set(receipt['sourcePins']),'complete new transitive warning/helper producer custody, no duplicates')
 for row in rows:
  raw=(root/row['file']).read_bytes();need(len(raw)<=8388608 and hashlib.sha256(raw).hexdigest()==row['sha256']==receipt['sourcePins'][row['originalFile']],'actual before/after frozen helper snapshot bytes')
  commit=receipt['pins']['desktop'] if row['repository']=='desktop' else receipt['acceptanceSource'] if row['relative'].startswith('test/') else receipt['pins']['source']
  need(row['commit']==commit and re.fullmatch('[a-f0-9]{40}',commit) and row['originalFile']==str(Path(row['root'])/row['relative']),'actual producer commit and path binding')
  need(hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==row['gitBlobOID'],'independent source Git blob identity')
  original=subprocess.run(['git','-C',row['root'],'show',commit+':'+row['relative']],stdout=subprocess.PIPE,stderr=subprocess.PIPE);need(original.returncode==0 and original.stdout==raw,'independent frozen producer commit:path bytes')

def check_warnings(texts,expected,sheet,view_bounds,stroke_bounds,label_boxes,caption_boxes,need):
 ns='{http://www.w3.org/2000/svg}';nodes=[n for n in texts if 'data-warning-layout' in n.attrib]
 need(len(nodes)==len(expected)<=32,'exact complete derived diagnostic roster')
 boxes=[];used=set();lines=0
 def intersects(a,b):return a[0]<b[2] and a[2]>b[0] and a[1]<b[3] and a[3]>b[1]
 for node,w in zip(nodes,expected):
  attrs={'data-warning-layout':'observed-sheet-v1','data-warning-role':w['role'],'data-warning-id':w['id'],'data-warning-view-id':w['viewId'],'font-family':'monospace','font-size':'3','fill':'#a00','aria-label':w['message']}|w.get('attributes',{})
  need(node.tag==ns+'text' and set(node.attrib)==set(attrs)|{'x','y'} and all(node.get(k)==v for k,v in attrs.items()),'exact visible diagnostic identity/role/style, no extra effects')
  need(node.text in (None,'') and node.tail in (None,''),'no hidden/extra diagnostic parent text')
  spans=list(node);need(1<=len(spans)<=256,'complete visible diagnostic lines');joined='';previous=None
  for span in spans:
   lines+=1;need(lines<=256 and span.tag==ns+'tspan' and not list(span) and span.tail in (None,'') and set(span.attrib)=={'x','y','textLength','lengthAdjust'} and span.get('lengthAdjust')=='spacing','only visible fixed-font lines, no shrinking/hidden content')
   value=span.text;need(isinstance(value,str) and 1<=len(value)<=120,'bounded complete visible line');joined+=value
   x,y,length=(float(span.get(k,'nan')) for k in ('x','y','textLength'));need(all(math.isfinite(z) for z in (x,y,length)) and abs(length-1.8*len(value))<=1e-9,'actual finite full line advance')
   if previous is None:need(float(node.get('x','nan'))==x and float(node.get('y','nan'))==y,'parent baseline binds first visible line')
   else:need(x==previous[0] and abs(y-previous[1]-6)<=1e-9,'separate fixed6mm line boxes, no stacked baselines')
   previous=(x,y);box=[x-1,y-4,x+length+1,y+2]
   need(box[0]>=8-1e-6 and box[1]>=16-1e-6 and box[2]<=sheet['width']-8+1e-6 and box[3]<=sheet['height']-16+1e-6,'whole diagnostic line box inside title/footer-safe paper margins')
   for group,gutter in ((view_bounds,2.125),(stroke_bounds,2.125),(label_boxes,2),(caption_boxes,2)):
    for b in group:
     if b is None:continue
     need(len(b)==4 and all(math.isfinite(z) for z in b) and b[0]<=b[2] and b[1]<=b[3],'independent finite actual paper obstacle')
     # Existing serialization budget only. No source/Native budget changed.
     need(not intersects(box,[b[0]-gutter+1e-6,b[1]-gutter+1e-6,b[2]+gutter-1e-6,b[3]+gutter-1e-6]),'diagnostic clears every independently reconciled view/stroke/label/caption')
   for prior in boxes:need(not intersects(box,prior),'distinct visible diagnostic lines never overlap')
   boxes.append(box)
  need(joined==w['message'],'every diagnostic character is actually visible; aria-label cannot replace text')
  used.add(id(node))
 return used,boxes

def check_dimension_diagnostics(xml,d,observation,curves,evaluate,path_points,need):
 """Current three/four-view dimension-only families; no placement prediction."""
 ns='{http://www.w3.org/2000/svg}';texts=xml.findall('.//'+ns+'text');scale=d['sheet']['scale']['numerator']/d['sheet']['scale']['denominator'];envelopes=[]
 for view,cc in zip(d['views'],curves):
  points=[]
  for c in cc:
   if c['line']:points.extend(evaluate(c,t) for t in c['range'])
   else:
    radius=[math.hypot(c['a'][j],c['b'][j]) for j in (0,1)];points.extend([[c['c'][j]+sign*radius[j] for j in (0,1)] for sign in (-1,1)])
  points=[[view['paperOrigin'][0]+p[0]*scale,view['paperOrigin'][1]-p[1]*scale] for p in points];need(points,'actual source-reconciled view envelope');envelopes.append([min(p[0] for p in points),min(p[1] for p in points),max(p[0] for p in points),max(p[1] for p in points)])
 stroke_boxes=[];groups=xml.findall(ns+'g');need(len(groups)==2,'actual geometry/text groups')
 for p in groups[0]:
  if p.get('stroke') not in ('#246','#789','#357'):continue
  stroke_boxes.extend(overlay_line_boxes(p.attrib['d'],need))
 labels=[[float(n.get('x'))-1,float(n.get('y'))-4,float(n.get('x'))+len(n.text or '')*3+1,float(n.get('y'))+2] for n in texts if n.get('fill')=='#124'];captions=[];verified=set()
 for view in d['views']:
  nodes=[n for n in texts if n.get('data-view-caption-id')==view['viewId']];need(len(nodes)==1,'one actual caption per view');n=nodes[0]
  attrs={'data-view-caption-id':view['viewId'],'data-caption-role':'view','data-caption-layout':'observed-sheet-v1','font-family':'monospace','font-size':'3','lengthAdjust':'spacing'}
  need(not list(n) and n.text==view['basis'] and set(n.attrib)==set(attrs)|{'x','y','textLength'} and all(n.get(k)==v for k,v in attrs.items()),'unchanged full visible caption')
  x,y,length=(float(n.get(k,'nan')) for k in ('x','y','textLength'));need(all(math.isfinite(z) for z in (x,y,length)) and abs(length-len(n.text)*1.8)<1e-9,'finite actual caption advance');captions.append([x-1,y-4,x+length+1,y+2]);verified.add(id(n))
 frames={v['viewId']:v['frame'] for v in observation['viewFrames']};expected=[{'role':'dimension','id':a['dimensionId'],'viewId':a['viewId'],'message':'UNRESOLVED: '+a['dimensionId']} for a,f in zip(d['dimensions'],observation['dimensions']) if f['status']!='available' or frames[a['viewId']] is None]
 result=check_warnings(texts,expected,d['sheet'],envelopes,stroke_boxes,labels,captions,need);verified.update(result[0])
 for a,f in zip(d['dimensions'],observation['dimensions']):
  if f['status']!='available' or frames[a['viewId']] is None:continue
  matches=[n for n in texts if n.get('fill')=='#124' and [float(n.get('x','nan')),float(n.get('y','nan'))]==a['label']];need(len(matches)==1,'same successful authored dimension label, no ghost numeric duplicates');n=matches[0]
  need(set(n.attrib)=={'x','y','fill'} and not list(n) and isinstance(n.text,str) and n.text,'unchanged visible successful label fields');verified.add(id(n))
 for point,value in (([8,8],d['title'] or d['drawingId']),([8,d['sheet']['height']-5],"Reference drawing · "+observation['status']+" · scale "+str(d['sheet']['scale']['numerator'])+':'+str(d['sheet']['scale']['denominator']))):
  matches=[n for n in texts if n.text==value and [float(n.get('x','nan')),float(n.get('y','nan'))]==point];need(len(matches)==1,'unchanged title/footer');n=matches[0];need(set(n.attrib)=={'x','y'} and not list(n),'visible fixed title/footer');verified.add(id(n))
 need(len(verified)==len(texts),'no extra/hidden stale numeric text outside complete dimension/caption/warning roster')
 return result
